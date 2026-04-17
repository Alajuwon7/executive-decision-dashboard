import { createClient } from "@/lib/supabase/client";
import { QuickBooksClient } from "./client";
import {
  mapInvoiceToRevenue,
  mapPaymentToRevenue,
  mapSalesReceiptToRevenue,
  mapBillToExpense,
  mapPurchaseToExpense,
} from "./mappers";
import type { SyncLogEntry, BusinessIntegration } from "@/lib/data/types";

interface SyncResult {
  recordsFetched: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors: any[];
}

async function upsertRevenue(
  supabase: any,
  businessId: string,
  mapped: any
): Promise<"created" | "updated" | "skipped"> {
  const { data: existing } = await supabase
    .from("revenue_entries")
    .select("id, amount")
    .eq("external_id", mapped.externalId)
    .eq("source", "quickbooks")
    .maybeSingle();

  if (existing) {
    if (Number(existing.amount) !== mapped.amount) {
      await supabase
        .from("revenue_entries")
        .update({
          amount: mapped.amount,
          description: mapped.description,
          date: mapped.date,
          synced_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      return "updated";
    }
    return "skipped";
  }

  await supabase.from("revenue_entries").insert({
    business_id: mapped.businessId,
    amount: mapped.amount,
    currency: mapped.currency,
    source: "quickbooks",
    description: mapped.description,
    date: mapped.date,
    external_id: mapped.externalId,
    quickbooks_entity_type: mapped.entityType,
    synced_at: new Date().toISOString(),
  });
  return "created";
}

async function upsertExpense(
  supabase: any,
  businessId: string,
  mapped: any
): Promise<"created" | "updated" | "skipped"> {
  const { data: existing } = await supabase
    .from("expenses")
    .select("id, amount")
    .eq("external_id", mapped.externalId)
    .eq("source", "quickbooks")
    .maybeSingle();

  if (existing) {
    if (Number(existing.amount) !== mapped.amount) {
      await supabase
        .from("expenses")
        .update({
          amount: mapped.amount,
          name: mapped.name,
          category: mapped.category,
          synced_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      return "updated";
    }
    return "skipped";
  }

  await supabase.from("expenses").insert({
    business_id: mapped.businessId,
    category: mapped.category,
    name: mapped.name,
    amount: mapped.amount,
    currency: mapped.currency,
    frequency: mapped.frequency,
    source: "quickbooks",
    external_id: mapped.externalId,
    quickbooks_entity_type: mapped.entityType,
    synced_at: new Date().toISOString(),
  });
  return "created";
}

export async function runSync(
  integration: BusinessIntegration,
  syncType: "full" | "incremental" | "manual"
): Promise<SyncResult> {
  const supabase = createClient();
  const client = new QuickBooksClient(integration.id);
  const categoryOverrides = (integration.metadata as any)?.categoryOverrides ?? {};
  const since =
    syncType === "full" || !integration.lastSyncAt
      ? undefined
      : new Date(integration.lastSyncAt);

  const result: SyncResult = {
    recordsFetched: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
    errors: [],
  };

  // Revenue: invoices + payments + sales receipts
  try {
    const invoices = await client.getInvoices(since);
    result.recordsFetched += invoices.length;
    for (const inv of invoices) {
      try {
        const mapped = mapInvoiceToRevenue(inv, integration.businessId);
        const outcome = await upsertRevenue(supabase, integration.businessId, mapped);
        if (outcome === "created") result.recordsCreated++;
        else if (outcome === "updated") result.recordsUpdated++;
        else result.recordsSkipped++;
      } catch (err: any) {
        result.errors.push({ entity: "Invoice", id: inv.Id, error: err.message });
      }
    }
  } catch (err: any) {
    result.errors.push({ entity: "Invoices", error: err.message });
  }

  try {
    const payments = await client.getPayments(since);
    result.recordsFetched += payments.length;
    for (const pmt of payments) {
      try {
        const mapped = mapPaymentToRevenue(pmt, integration.businessId);
        const outcome = await upsertRevenue(supabase, integration.businessId, mapped);
        if (outcome === "created") result.recordsCreated++;
        else if (outcome === "updated") result.recordsUpdated++;
        else result.recordsSkipped++;
      } catch (err: any) {
        result.errors.push({ entity: "Payment", id: pmt.Id, error: err.message });
      }
    }
  } catch (err: any) {
    result.errors.push({ entity: "Payments", error: err.message });
  }

  try {
    const receipts = await client.getSalesReceipts(since);
    result.recordsFetched += receipts.length;
    for (const rcpt of receipts) {
      try {
        const mapped = mapSalesReceiptToRevenue(rcpt, integration.businessId);
        const outcome = await upsertRevenue(supabase, integration.businessId, mapped);
        if (outcome === "created") result.recordsCreated++;
        else if (outcome === "updated") result.recordsUpdated++;
        else result.recordsSkipped++;
      } catch (err: any) {
        result.errors.push({ entity: "SalesReceipt", id: rcpt.Id, error: err.message });
      }
    }
  } catch (err: any) {
    result.errors.push({ entity: "SalesReceipts", error: err.message });
  }

  // Expenses: bills + purchases
  try {
    const bills = await client.getBills(since);
    result.recordsFetched += bills.length;
    for (const bill of bills) {
      try {
        const mapped = mapBillToExpense(bill, integration.businessId, categoryOverrides);
        const outcome = await upsertExpense(supabase, integration.businessId, mapped);
        if (outcome === "created") result.recordsCreated++;
        else if (outcome === "updated") result.recordsUpdated++;
        else result.recordsSkipped++;
      } catch (err: any) {
        result.errors.push({ entity: "Bill", id: bill.Id, error: err.message });
      }
    }
  } catch (err: any) {
    result.errors.push({ entity: "Bills", error: err.message });
  }

  try {
    const purchases = await client.getPurchases(since);
    result.recordsFetched += purchases.length;
    for (const p of purchases) {
      try {
        const mapped = mapPurchaseToExpense(p, integration.businessId, categoryOverrides);
        const outcome = await upsertExpense(supabase, integration.businessId, mapped);
        if (outcome === "created") result.recordsCreated++;
        else if (outcome === "updated") result.recordsUpdated++;
        else result.recordsSkipped++;
      } catch (err: any) {
        result.errors.push({ entity: "Purchase", id: p.Id, error: err.message });
      }
    }
  } catch (err: any) {
    result.errors.push({ entity: "Purchases", error: err.message });
  }

  return result;
}
