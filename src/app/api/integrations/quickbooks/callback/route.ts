import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/client";
import { parseState, exchangeCode } from "@/lib/integrations/quickbooks/oauth";
import { encryptToken } from "@/lib/crypto/encryption";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  console.error("=== [QB Callback] START ===");
  console.error("[QB Callback] Full URL:", url.toString());

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const realmId = url.searchParams.get("realmId");
  const errorParam = url.searchParams.get("error");

  console.error("[QB Callback] code:", code ? code.slice(0, 15) + "..." : "MISSING");
  console.error("[QB Callback] state:", state ? "present (" + state.length + " chars)" : "MISSING");
  console.error("[QB Callback] realmId:", realmId ?? "MISSING");
  console.error("[QB Callback] error:", errorParam ?? "none");

  if (errorParam) {
    console.error("[QB Callback] Intuit returned error:", errorParam);
    return NextResponse.redirect(
      new URL(`/dashboard?integration=quickbooks&status=error&reason=${encodeURIComponent(errorParam)}`, url.origin)
    );
  }

  if (!code || !state || !realmId) {
    console.error("[QB Callback] ABORT: missing required params");
    return NextResponse.redirect(
      new URL("/dashboard?integration=quickbooks&status=error&reason=missing_params", url.origin)
    );
  }

  // Step 1: Parse state
  let businessId: string;
  try {
    const parsed = parseState(state);
    businessId = parsed.businessId;
    console.error("[QB Callback] Step 1 OK — businessId:", businessId);
  } catch (err: any) {
    console.error("[QB Callback] Step 1 FAILED — state parse error:", err.message);
    console.error("[QB Callback] Raw state:", state);
    return NextResponse.redirect(
      new URL("/dashboard?integration=quickbooks&status=error&reason=invalid_state", url.origin)
    );
  }

  // Step 2: Exchange code for tokens
  let tokens;
  try {
    tokens = await exchangeCode(code);
    console.error("[QB Callback] Step 2 OK — got tokens, expires_in:", tokens.expires_in);
  } catch (err: any) {
    console.error("[QB Callback] Step 2 FAILED — token exchange error:", err.message);
    return NextResponse.redirect(
      new URL(`/dashboard?integration=quickbooks&status=error&reason=${encodeURIComponent(err.message)}`, url.origin)
    );
  }

  // Step 3: Encrypt tokens
  let encryptedAccess: string;
  let encryptedRefresh: string;
  try {
    encryptedAccess = encryptToken(tokens.access_token);
    encryptedRefresh = encryptToken(tokens.refresh_token);
    console.error("[QB Callback] Step 3 OK — tokens encrypted");
  } catch (err: any) {
    console.error("[QB Callback] Step 3 FAILED — encryption error:", err.message);
    console.error("[QB Callback] Is INTEGRATION_ENCRYPTION_KEY set?", !!process.env.INTEGRATION_ENCRYPTION_KEY);
    return NextResponse.redirect(
      new URL("/dashboard?integration=quickbooks&status=error&reason=encryption_failed", url.origin)
    );
  }

  // Step 4: Write to database
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  const upsertPayload = {
    business_id: businessId,
    provider: "quickbooks",
    access_token: encryptedAccess,
    refresh_token: encryptedRefresh,
    token_expires_at: expiresAt,
    realm_id: realmId,
    is_active: true,
    last_sync_status: "pending",
    updated_at: new Date().toISOString(),
  };
  console.error("[QB Callback] Step 4 — upserting to business_integrations...");
  console.error("[QB Callback] business_id:", businessId, "realm_id:", realmId);

  try {
    // Try server client first (cookie-based auth)
    let supabase;
    let clientType = "server";
    try {
      supabase = await createServerSupabaseClient();
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (!user || authErr) {
        console.error("[QB Callback] Server auth failed:", authErr?.message ?? "no user — falling back to anon");
        supabase = createClient();
        clientType = "anon";
      } else {
        console.error("[QB Callback] Server auth OK, user:", user.id);
      }
    } catch (e: any) {
      console.error("[QB Callback] Server client init failed:", e.message, "— using anon");
      supabase = createClient();
      clientType = "anon";
    }

    const { data, error } = await supabase
      .from("business_integrations")
      .upsert(upsertPayload, { onConflict: "business_id,provider" })
      .select()
      .single();

    if (error) {
      console.error(`[QB Callback] Step 4 FAILED (${clientType}) —`, error.message, error.details, error.code);
      return NextResponse.redirect(
        new URL(`/dashboard?integration=quickbooks&status=error&reason=${encodeURIComponent("DB: " + error.message)}`, url.origin)
      );
    }

    console.error(`[QB Callback] Step 4 OK (${clientType}) — row id:`, data?.id);
  } catch (err: any) {
    console.error("[QB Callback] Step 4 THREW:", err.message, err.stack);
    return NextResponse.redirect(
      new URL(`/dashboard?integration=quickbooks&status=error&reason=${encodeURIComponent(err.message)}`, url.origin)
    );
  }

  // Step 5: Trigger async initial sync (fire-and-forget)
  fetch(new URL("/api/integrations/quickbooks/sync", url.origin).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ businessId, syncType: "full" }),
  }).catch((e) => console.error("[QB Callback] Sync trigger failed:", e.message));

  // Step 6: Redirect to dashboard
  const redirectUrl = `/dashboard?integration=quickbooks&status=connected&business=${businessId}`;
  console.error("[QB Callback] Step 6 — redirecting to:", redirectUrl);
  console.error("=== [QB Callback] END ===");
  return NextResponse.redirect(new URL(redirectUrl, url.origin));
}
