import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buildAuthUrl } from "@/lib/integrations/quickbooks/oauth";

export async function GET(request: NextRequest) {
  console.error("[QB Connect] Route hit");

  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!user || error) {
    console.error("[QB Connect] Auth failed:", error?.message);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const businessId = request.nextUrl.searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "businessId required" }, { status: 400 });
  }

  try {
    const { authUrl } = buildAuthUrl(businessId);
    console.error("[QB Connect] Auth URL generated for business:", businessId);
    console.error("[QB Connect] Redirect URI in env:", process.env.QUICKBOOKS_REDIRECT_URI);
    return NextResponse.json({ authUrl });
  } catch (err: any) {
    console.error("[QB Connect] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
