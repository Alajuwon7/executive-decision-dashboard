import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, buildOrientPrompt, buildDecidePrompt } from "@/lib/claude/prompts";
import { parseOrientResponse, parseDecideResponse } from "@/lib/claude/parsers";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, decisionType, snapshot, employee, orientAnalysis } = body;

    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    let userPrompt: string;

    if (action === "orient") {
      userPrompt = buildOrientPrompt(decisionType, snapshot, employee);
    } else if (action === "decide") {
      userPrompt = buildDecidePrompt(orientAnalysis, snapshot);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    // Extract text content
    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No text response from Claude" }, { status: 500 });
    }

    const rawText = textBlock.text;

    let parsed: any;
    try {
      if (action === "orient") {
        parsed = parseOrientResponse(rawText);
      } else {
        parsed = parseDecideResponse(rawText);
      }
    } catch (parseError) {
      // Retry once asking for valid JSON only
      const retryMessage = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        temperature: 0.1,
        system: SYSTEM_PROMPT,
        messages: [
          { role: "user", content: userPrompt },
          { role: "assistant", content: rawText },
          { role: "user", content: "Your response was not valid JSON. Please respond ONLY with the valid JSON object, no other text." },
        ],
      });

      const retryBlock = retryMessage.content.find((block) => block.type === "text");
      if (!retryBlock || retryBlock.type !== "text") {
        return NextResponse.json({ error: "Failed to get valid JSON from Claude" }, { status: 500 });
      }

      if (action === "orient") {
        parsed = parseOrientResponse(retryBlock.text);
      } else {
        parsed = parseDecideResponse(retryBlock.text);
      }
    }

    return NextResponse.json({
      analysis: parsed,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    });
  } catch (error: any) {
    console.error("Claude API error:", error);

    if (error?.status === 429) {
      return NextResponse.json({ error: "Rate limit exceeded. Try again in a few minutes." }, { status: 429 });
    }

    return NextResponse.json(
      { error: error.message ?? "Failed to get AI analysis" },
      { status: 500 }
    );
  }
}
