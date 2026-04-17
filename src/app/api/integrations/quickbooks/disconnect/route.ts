import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/crypto/encryption";
import { revokeToken } from "@/lib/integrations/quickbooks/oauth";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { integrationId } = await request.json();
  if (!integrationId) {
    return NextResponse.json({ error: "integrationId required" }, { status: 400 });
  }

  try {
    const { data: row } = await supabase
      .from("business_integrations")
      .select("refresh_token")
      .eq("id", integrationId)
      .single();

    if (row?.refresh_token) {
      try {
        await revokeToken(decryptToken(row.refresh_token));
      } catch {
        // Revocation may fail if token already expired — continue anyway
      }
    }

    await supabase
      .from("business_integrations")
      .update({
        is_active: false,
        access_token: null,
        refresh_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", integrationId);

    // Mark synced records so admin knows origin
    const { data: integration } = await supabase
      .from("business_integrations")
      .select("business_id")
      .eq("id", integrationId)
      .single();

    if (integration) {
      await supabase
        .from("expenses")
        .update({ source: "quickbooks_disconnected" })
        .eq("business_id", integration.business_id)
        .eq("source", "quickbooks");
      await supabase
        .from("revenue_entries")
        .update({ source: "quickbooks_disconnected" })
        .eq("business_id", integration.business_id)
        .eq("source", "quickbooks");
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("QB disconnect error:", err.message);
    return NextResponse.json({ error: "Disconnect failed" }, { status: 500 });
  }
}
