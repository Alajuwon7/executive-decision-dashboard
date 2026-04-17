import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!user || error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const businessId = request.nextUrl.searchParams.get("businessId");

  let query = supabase
    .from("business_integrations")
    .select("id, business_id, provider, realm_id, is_active, last_sync_at, last_sync_status, last_sync_error, sync_frequency, created_at, updated_at")
    .eq("provider", "quickbooks");

  if (businessId) query = query.eq("business_id", businessId);

  const { data, error: fetchError } = await query;
  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json({ integrations: data ?? [] });
}
