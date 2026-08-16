import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  SYSTEM_PROMPT,
  buildOrientPrompt,
  buildDecidePrompt,
  buildWhatWouldItTakePrompt,
  buildPatternAnalysisPrompt,
} from "@/lib/claude/prompts";
import {
  parseOrientResponse,
  parseDecideResponse,
  parseWWITResponse,
  parsePatternAnalysisResponse,
} from "@/lib/claude/parsers";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Single source of truth for the model. Anthropic retires dated model IDs on a
// published schedule — when one lapses the API returns 404 and every OODA call
// fails, so keep this in one place and check it when the engine goes quiet.
const CLAUDE_MODEL = "claude-sonnet-5";

type ActionKind = "orient" | "decide" | "what_would_it_take" | "pattern_analysis";
const VALID_ACTIONS: ActionKind[] = ["orient", "decide", "what_would_it_take", "pattern_analysis"];

const requestSchema = z.object({
  action: z.enum(VALID_ACTIONS as [ActionKind, ...ActionKind[]]),
  decisionType: z.string().optional(),
  snapshot: z.record(z.string(), z.unknown()).optional(),
  employee: z.record(z.string(), z.unknown()).nullable().optional(),
  employeeROI: z.record(z.string(), z.unknown()).nullable().optional(),
  orientAnalysis: z.record(z.string(), z.unknown()).optional(),
  goal: z.record(z.string(), z.unknown()).optional(),
  feasibility: z.record(z.string(), z.unknown()).optional(),
});

const MAX_PAYLOAD_BYTES = 50 * 1024;
const RATE_LIMIT_PER_HOUR = 20;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 3_600_000 });
    return true;
  }
  if (entry.count >= RATE_LIMIT_PER_HOUR) return false;
  entry.count++;
  return true;
}

function buildPrompt(action: ActionKind, body: any): string {
  const { decisionType, snapshot, employee, employeeROI, orientAnalysis, goal, feasibility } = body;
  switch (action) {
    case "orient":
      return buildOrientPrompt(decisionType, snapshot, employee, employeeROI);
    case "decide":
      return buildDecidePrompt(orientAnalysis, snapshot);
    case "what_would_it_take":
      return buildWhatWouldItTakePrompt(goal, snapshot, feasibility);
    case "pattern_analysis":
      return buildPatternAnalysisPrompt(snapshot);
  }
}

function parseResponse(action: ActionKind, raw: string): any {
  switch (action) {
    case "orient":
      return parseOrientResponse(raw);
    case "decide":
      return parseDecideResponse(raw);
    case "what_would_it_take":
      return parseWWITResponse(raw);
    case "pattern_analysis":
      return parsePatternAnalysisResponse(raw);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Maximum 20 Claude requests per hour." },
        { status: 429 }
      );
    }

    // Payload size check
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    }

    const raw = await request.json();
    const validation = requestSchema.safeParse(raw);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", issues: validation.error.issues },
        { status: 400 }
      );
    }
    const body = validation.data;
    const action = body.action;

    const userPrompt = buildPrompt(action, body);

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No text response from Claude" }, { status: 500 });
    }

    const rawText = textBlock.text;

    let parsed: any;
    try {
      parsed = parseResponse(action, rawText);
    } catch {
      const retryMessage = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          { role: "user", content: userPrompt },
          { role: "assistant", content: rawText },
          {
            role: "user",
            content: "Your response was not valid JSON. Please respond ONLY with the valid JSON object, no other text.",
          },
        ],
      });
      const retryBlock = retryMessage.content.find((block) => block.type === "text");
      if (!retryBlock || retryBlock.type !== "text") {
        return NextResponse.json({ error: "Failed to get valid JSON from Claude" }, { status: 500 });
      }
      parsed = parseResponse(action, retryBlock.text);
    }

    return NextResponse.json({
      analysis: parsed,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    });
  } catch (error: any) {
    // Log the status and API error type, not just the message — a bare message
    // hides the difference between a retired model (404), a bad key (401), and
    // a billing problem (400), which all surface identically to the user.
    console.error(
      `Claude API error: status=${error?.status ?? "?"} type=${error?.type ?? "?"} :: ${error?.message ?? error}`
    );

    if (error?.status === 429) {
      return NextResponse.json({ error: "Rate limit exceeded. Try again in a few minutes." }, { status: 429 });
    }

    // A retired or mistyped model ID. Distinct message so this is diagnosable
    // without reading server logs.
    if (error?.status === 404) {
      return NextResponse.json(
        { error: `AI model "${CLAUDE_MODEL}" is unavailable. It may have been retired — update CLAUDE_MODEL.` },
        { status: 503 }
      );
    }

    if (error?.status === 401 || error?.status === 403) {
      return NextResponse.json(
        { error: "AI service authentication failed. Check ANTHROPIC_API_KEY." },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: "Failed to get AI analysis" }, { status: 500 });
  }
}
