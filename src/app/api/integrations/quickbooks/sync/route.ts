import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { runSync } from "@/lib/integrations/quickbooks/sync";
import type { BusinessIntegration } from "@/lib/data/types";

function mapRow(row: any): BusinessIntegration {
  return {
    id: row.id,
    businessId: row.business_id,
    provider: row.provider,
    tokenExpiresAt: row.token_expires_at ?? null,
    realmId: row.realm_id ?? null,
    externalAccountId: row.external_account_id ?? null,
    lastSyncAt: row.last_sync_at ?? null,
    lastSyncStatus: row.last_sync_status ?? null,
    lastSyncError: row.last_sync_error ?? null,
    isActive: row.is_active ?? true,
    syncFrequency: row.sync_frequency ?? "15min",
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // Also allow cron token auth
  const cronToken = request.headers.get("x-cron-token");
  const isCron = cronToken && cronToken === process.env.INTERNAL_CRON_TOKEN;

  if ((!user || authError) && !isCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { integrationId, businessId, syncType = "incremental", scheduled } = body;

  try {
    let integrations: BusinessIntegration[] = [];

    if (scheduled) {
      // Cron: sync all active QB integrations
      const { data } = await supabase
        .from("business_integrations")
        .select("*")
        .eq("provider", "quickbooks")
        .eq("is_active", true);
      integrations = (data ?? []).map(mapRow);
    } else if (integrationId) {
      const { data } = await supabase
        .from("business_integrations")
        .select("*")
        .eq("id", integrationId)
        .single();
      if (data) integrations = [mapRow(data)];
    } else if (businessId) {
      const { data } = await supabase
        .from("business_integrations")
        .select("*")
        .eq("business_id", businessId)
        .eq("provider", "quickbooks")
        .single();
      if (data) integrations = [mapRow(data)];
    }

    if (integrations.length === 0) {
      return NextResponse.json({ error: "No active integration found" }, { status: 404 });
    }

    const results = [];
    for (const integration of integrations) {
      // Create sync log entry
      const { data: logEntry } = await supabase
        .from("sync_log")
        .insert({
          integration_id: integration.id,
          business_id: integration.businessId,
          provider: "quickbooks",
          sync_type: syncType,
          status: "started",
        })
        .select()
        .single();

      try {
        const result = await runSync(integration, syncType);
        const status = result.errors.length > 0 ? "partial" : "success";

        // Update sync log
        if (logEntry) {
          await supabase
            .from("sync_log")
            .update({
              status,
              records_fetched: result.recordsFetched,
              records_created: result.recordsCreated,
              records_updated: result.recordsUpdated,
              records_skipped: result.recordsSkipped,
              errors_count: result.errors.length,
              error_details: result.errors,
              completed_at: new Date().toISOString(),
            })
            .eq("id", logEntry.id);
        }

        // Update integration record
        await supabase
          .from("business_integrations")
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: status,
            last_sync_error: result.errors.length > 0 ? `${result.errors.length} errors` : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", integration.id);

        results.push({ businessId: integration.businessId, ...result, status });
      } catch (err: any) {
        if (logEntry) {
          await supabase
            .from("sync_log")
            .update({
              status: "failed",
              error_details: [{ error: err.message }],
              completed_at: new Date().toISOString(),
            })
            .eq("id", logEntry.id);
        }

        await supabase
          .from("business_integrations")
          .update({
            last_sync_status: "failed",
            last_sync_error: err.message,
            updated_at: new Date().toISOString(),
          })
          .eq("id", integration.id);

        results.push({ businessId: integration.businessId, status: "failed", error: err.message });
      }
    }

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error("Sync error:", err.message);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
