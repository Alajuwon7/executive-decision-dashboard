import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { parseState, exchangeCode } from "@/lib/integrations/quickbooks/oauth";
import { encryptToken } from "@/lib/crypto/encryption";

export async function POST(request: NextRequest) {
  console.error("=== [QB Exchange] START ===");

  // Auth check
  let userId: string | null = null;
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
    console.error("[QB Exchange] Auth user:", userId ?? "NONE");
  } catch (e: any) {
    console.error("[QB Exchange] Auth error:", e.message);
  }

  const { code, state, realmId } = await request.json();
  console.error("[QB Exchange] Params — code:", code?.slice(0, 15) + "...", "realmId:", realmId);

  if (!code || !state || !realmId) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  // Step 1: Parse state
  let businessId: string;
  try {
    const parsed = parseState(state);
    businessId = parsed.businessId;
    console.error("[QB Exchange] businessId:", businessId);
  } catch (err: any) {
    console.error("[QB Exchange] State parse failed:", err.message);
    return NextResponse.json({ error: "Invalid state: " + err.message }, { status: 400 });
  }

  // Step 2: Exchange code for tokens
  let tokens;
  try {
    tokens = await exchangeCode(code);
    console.error("[QB Exchange] Token exchange OK — expires_in:", tokens.expires_in);
  } catch (err: any) {
    console.error("[QB Exchange] Token exchange FAILED:", err.message);
    return NextResponse.json({ error: err.message }, { status: 502 });
  }

  // Step 3: Encrypt tokens
  let encryptedAccess: string;
  let encryptedRefresh: string;
  try {
    encryptedAccess = encryptToken(tokens.access_token);
    encryptedRefresh = encryptToken(tokens.refresh_token);
    console.error("[QB Exchange] Encryption OK");
  } catch (err: any) {
    console.error("[QB Exchange] Encryption FAILED:", err.message);
    return NextResponse.json({ error: "Encryption failed" }, { status: 500 });
  }

  // Step 4: Write to database
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("business_integrations")
      .upsert(
        {
          business_id: businessId,
          provider: "quickbooks",
          access_token: encryptedAccess,
          refresh_token: encryptedRefresh,
          token_expires_at: expiresAt,
          realm_id: realmId,
          is_active: true,
          last_sync_status: "pending",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "business_id,provider" }
      )
      .select()
      .single();

    if (error) {
      console.error("[QB Exchange] DB upsert FAILED:", error.message, error.code, error.details);
      return NextResponse.json({ error: "Database error: " + error.message }, { status: 500 });
    }

    console.error("[QB Exchange] DB upsert OK — id:", data?.id);

    // Trigger initial sync (fire-and-forget)
    fetch(new URL("/api/integrations/quickbooks/sync", request.url).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, syncType: "full" }),
    }).catch(() => {});

    console.error("=== [QB Exchange] SUCCESS ===");
    return NextResponse.json({ success: true, businessId, integrationId: data?.id });
  } catch (err: any) {
    console.error("[QB Exchange] DB threw:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
