"use client";
import { useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { generateKPIInsights } from "@/lib/utils/insights";
import { formatCurrency } from "@/lib/utils/currency";
import { formatMonthYear } from "@/lib/utils/formatters";
import {
  getMonthlyRevenueTrend,
  calculateTotalRevenue,
  calculateTotalExpenses,
  calculateMonthlyPayroll,
  calculateConsolidatedPL,
} from "@/lib/utils/calculations";
import type { KPIType, RevenueEntry, Expense } from "@/lib/data/types";

const KPI_LABELS: Record<KPIType, string> = {
  revenue: "Total Revenue", expenses: "Total Expenses", netProfit: "Net Profit", takeHome: "Take-Home",
};

function SourceBadge({ source }: { source?: string }) {
  const isQB = (source ?? "manual").toLowerCase() === "quickbooks";
  return <Badge variant={isQB ? "accent" : "default"} className="text-[10px]">{isQB ? "QB" : "Manual"}</Badge>;
}

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" });
  } catch {
    return iso;
  }
}

export function KPIDetailModal({ kpiType, onClose }: { kpiType: KPIType | null; onClose: () => void }) {
  const { businesses, expenses, revenueEntries, employees } = useFinancialStore();
  const pl = useMemo(
    () => calculateConsolidatedPL(businesses, expenses, revenueEntries, employees),
    [businesses, expenses, revenueEntries, employees]
  );

  const sortedRevenue: RevenueEntry[] = useMemo(
    () => [...revenueEntries].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")),
    [revenueEntries]
  );

  const expensesByCategory = useMemo(() => {
    const groups = new Map<string, Expense[]>();
    expenses.forEach((e) => {
      const key = e.category || "Uncategorized";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(e);
    });
    return Array.from(groups.entries())
      .map(([category, items]) => ({
        category,
        items: items.sort((a, b) => b.amount - a.amount),
        subtotal: items.reduce((s, e) => s + e.amount, 0),
      }))
      .sort((a, b) => b.subtotal - a.subtotal);
  }, [expenses]);

  const bizName = (id: string) => businesses.find((b) => b.id === id)?.displayName ?? "—";

  if (!kpiType) return null;

  const values: Record<KPIType, { value: number; change: number }> = {
    revenue: { value: pl.totalRevenue, change: pl.revenueChange },
    expenses: { value: pl.totalExpenses, change: pl.expenseChange },
    netProfit: { value: pl.netProfit, change: pl.profitChange },
    takeHome: { value: pl.takeHome, change: pl.takeHomeChange },
  };

  const { value, change } = values[kpiType];
  const insights = generateKPIInsights(kpiType, businesses, expenses, revenueEntries, employees);
  const trend = getMonthlyRevenueTrend(revenueEntries);
  const last6 = trend.slice(-6);
  const maxVal = Math.max(...last6.map((d) => d.amount), 1);

  const bizSplit = businesses.map((biz) => {
    const bizRevenue = calculateTotalRevenue(revenueEntries.filter((e) => e.businessId === biz.id));
    return { name: biz.displayName, amount: bizRevenue, pct: pl.totalRevenue > 0 ? (bizRevenue / pl.totalRevenue) * 100 : 0 };
  });
  const bizColors = ["#F59E0B", "#8B5CF6", "#22C55E", "#3B82F6"];

  const totalRevenue = pl.totalRevenue;
  const totalExpensesVal = calculateTotalExpenses(expenses);
  const totalPayroll = calculateMonthlyPayroll(employees);

  return (
    <Modal isOpen onClose={onClose} className="max-w-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">{KPI_LABELS[kpiType]}</p>
          <p className="font-mono text-3xl font-bold text-text-primary">{formatCurrency(value)}</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-surface-elevated text-text-muted hover:text-text-secondary transition-colors">&times;</button>
      </div>
      <div className="flex items-center gap-2 mb-5">
        <Badge variant={change >= 0 ? "success" : "danger"}>{change >= 0 ? "\u2191" : "\u2193"} {Math.abs(change).toFixed(1)}% vs last month</Badge>
      </div>
      {last6.length > 1 && (
        <div className="bg-bg rounded-[12px] p-4 mb-5">
          <p className="text-[11px] font-semibold text-text-faint uppercase tracking-wider mb-2">Last 6 months</p>
          <div className="flex items-end gap-1 h-12">
            {last6.map((d, i) => (
              <div key={d.month} className="flex-1 rounded-[3px]" style={{
                height: `${(d.amount / maxVal) * 100}%`,
                background: i === last6.length - 1 ? "linear-gradient(to top, #F59E0B, rgba(245,158,11,0.6))" : `rgba(245,158,11,${0.1 + (i / last6.length) * 0.2})`,
              }} title={`${formatMonthYear(d.month + "-01")}: ${formatCurrency(d.amount)}`} />
            ))}
          </div>
        </div>
      )}
      {insights.length > 0 && (
        <div className="mb-5">
          <p className="text-[11px] font-semibold text-text-faint uppercase tracking-wider mb-3">Key Insights</p>
          <div className="space-y-1">
            {insights.map((insight, i) => (
              <div key={i} className="flex gap-2.5 py-2.5 border-b border-border last:border-0">
                <div className="w-7 h-7 rounded-[8px] flex items-center justify-center text-xs shrink-0 mt-0.5" style={{ background: insight.iconBg, color: insight.iconColor }}>{insight.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-text-secondary font-medium leading-snug">
                    {insight.text.split(insight.highlight).map((part, j, arr) => (
                      <span key={j}>{part}{j < arr.length - 1 && <span className="font-mono font-semibold text-accent">{insight.highlight}</span>}</span>
                    ))}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{insight.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {kpiType === "revenue" && bizSplit.length > 0 && (
        <div className="mb-5">
          <p className="text-[11px] font-semibold text-text-faint uppercase tracking-wider mb-3">By Business</p>
          {bizSplit.map((biz, i) => (
            <div key={biz.name} className="flex items-center gap-2.5 mb-2">
              <span className="text-xs text-text-tertiary w-28 truncate font-medium">{biz.name}</span>
              <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${biz.pct}%`, background: `linear-gradient(90deg, ${bizColors[i]}, ${bizColors[i]}90)` }} />
              </div>
              <span className="font-mono text-xs text-text-tertiary w-16 text-right">{formatCurrency(biz.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {(kpiType === "netProfit" || kpiType === "takeHome") && (
        <div className="mb-5">
          <p className="text-[11px] font-semibold text-text-faint uppercase tracking-wider mb-3">Breakdown</p>
          <div className="bg-bg rounded-[12px] p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Revenue</span>
              <span className="font-mono text-success">+{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Expenses</span>
              <span className="font-mono text-danger">−{formatCurrency(totalExpensesVal)}</span>
            </div>
            {kpiType === "takeHome" && (
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Payroll</span>
                <span className="font-mono text-danger">−{formatCurrency(totalPayroll)}</span>
              </div>
            )}
            <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
              <span className="text-text-primary">{KPI_LABELS[kpiType]}</span>
              <span className={`font-mono ${value >= 0 ? "text-success" : "text-danger"}`}>{formatCurrency(value)}</span>
            </div>
          </div>
        </div>
      )}

      {kpiType === "revenue" && (
        <div>
          <p className="text-[11px] font-semibold text-text-faint uppercase tracking-wider mb-3">Entries ({sortedRevenue.length})</p>
          {sortedRevenue.length === 0 ? (
            <p className="text-xs text-text-muted">No revenue entries yet.</p>
          ) : (
            <div className="max-h-72 overflow-y-auto pr-1 -mr-1 space-y-1">
              {sortedRevenue.map((entry) => (
                <div key={entry.id} className="flex items-center gap-2 py-2 border-b border-border last:border-0">
                  <span className="font-mono text-[11px] text-text-muted w-16 shrink-0">{formatShortDate(entry.date)}</span>
                  <span className="font-mono text-xs text-text-primary font-semibold w-20 shrink-0 text-right">{formatCurrency(entry.amount)}</span>
                  <SourceBadge source={entry.source} />
                  <span className="text-xs text-text-tertiary flex-1 truncate" title={entry.description}>{entry.description || "—"}</span>
                  <span className="text-[10px] text-text-faint shrink-0 truncate max-w-[80px]">{bizName(entry.businessId)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {kpiType === "expenses" && (
        <div>
          <p className="text-[11px] font-semibold text-text-faint uppercase tracking-wider mb-3">By Category</p>
          {expensesByCategory.length === 0 ? (
            <p className="text-xs text-text-muted">No expenses yet.</p>
          ) : (
            <div className="max-h-72 overflow-y-auto pr-1 -mr-1 space-y-3">
              {expensesByCategory.map((grp) => (
                <div key={grp.category}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{grp.category}</span>
                    <span className="font-mono text-xs text-text-primary font-semibold">{formatCurrency(grp.subtotal)}</span>
                  </div>
                  <div className="space-y-1">
                    {grp.items.map((e) => (
                      <div key={e.id} className="flex items-center gap-2 py-1.5 pl-2 border-l-2 border-border">
                        <span className="font-mono text-xs text-text-primary w-20 shrink-0 text-right">{formatCurrency(e.amount)}</span>
                        <SourceBadge source={e.source} />
                        <span className="text-xs text-text-tertiary flex-1 truncate" title={e.name}>{e.name}</span>
                        <span className="text-[10px] text-text-faint shrink-0 truncate max-w-[80px]">{bizName(e.businessId)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
