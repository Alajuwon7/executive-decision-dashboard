import type { CreateExpense, CreateRevenue } from "@/lib/data/types";
import { mapQuickBooksAccountToCategory } from "./category-map";

export function mapInvoiceToRevenue(invoice: any, businessId: string): CreateRevenue & { externalId: string; entityType: string } {
  return {
    businessId,
    amount: Number(invoice.TotalAmt ?? 0),
    currency: invoice.CurrencyRef?.value ?? "USD",
    source: "quickbooks",
    description: `${invoice.CustomerRef?.name ?? "Customer"} — #${invoice.DocNumber ?? ""}`.trim(),
    date: invoice.TxnDate ?? new Date().toISOString().slice(0, 10),
    externalId: String(invoice.Id),
    entityType: "Invoice",
  };
}

export function mapPaymentToRevenue(payment: any, businessId: string): CreateRevenue & { externalId: string; entityType: string } {
  return {
    businessId,
    amount: Number(payment.TotalAmt ?? 0),
    currency: payment.CurrencyRef?.value ?? "USD",
    source: "quickbooks",
    description: `Payment — ${payment.CustomerRef?.name ?? "Customer"}`,
    date: payment.TxnDate ?? new Date().toISOString().slice(0, 10),
    externalId: String(payment.Id),
    entityType: "Payment",
  };
}

export function mapSalesReceiptToRevenue(receipt: any, businessId: string): CreateRevenue & { externalId: string; entityType: string } {
  return {
    businessId,
    amount: Number(receipt.TotalAmt ?? 0),
    currency: receipt.CurrencyRef?.value ?? "USD",
    source: "quickbooks",
    description: `Sale — ${receipt.CustomerRef?.name ?? "Customer"}`,
    date: receipt.TxnDate ?? new Date().toISOString().slice(0, 10),
    externalId: String(receipt.Id),
    entityType: "SalesReceipt",
  };
}

export function mapBillToExpense(
  bill: any,
  businessId: string,
  categoryOverrides?: Record<string, string>
): CreateExpense & { externalId: string; entityType: string } {
  const accountName = bill.Line?.[0]?.AccountBasedExpenseLineDetail?.AccountRef?.name ?? "";
  const category = mapQuickBooksAccountToCategory(accountName, "Expense", categoryOverrides);

  return {
    businessId,
    category,
    name: bill.VendorRef?.name ?? "Unknown Vendor",
    amount: Number(bill.TotalAmt ?? 0),
    currency: bill.CurrencyRef?.value ?? "USD",
    frequency: "monthly",
    externalId: String(bill.Id),
    entityType: "Bill",
  };
}

export function mapPurchaseToExpense(
  purchase: any,
  businessId: string,
  categoryOverrides?: Record<string, string>
): CreateExpense & { externalId: string; entityType: string } {
  const accountName = purchase.AccountRef?.name ?? "";
  const category = mapQuickBooksAccountToCategory(accountName, "Expense", categoryOverrides);

  return {
    businessId,
    category,
    name: purchase.EntityRef?.name ?? purchase.AccountRef?.name ?? "Purchase",
    amount: Number(purchase.TotalAmt ?? 0),
    currency: purchase.CurrencyRef?.value ?? "USD",
    frequency: "one-time",
    externalId: String(purchase.Id),
    entityType: "Purchase",
  };
}
