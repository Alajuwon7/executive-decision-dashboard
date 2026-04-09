"use client";
import { useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { generateKPIInsights } from "@/lib/utils/insights";
import { formatCurrency } from "@/lib/utils/currency";
import { formatMonthYear } from "@/lib/utils/formatters";
import { getMonthlyRevenueTrend, calculateTotalRevenue, calculateConsolidatedPL } from "@/lib/utils/calculations";
import type { KPIType } from "@/lib/data/types";

const KPI_LABELS: Record<KPIType, string> = {
  revenue: "Total Revenue", expenses: "Total Expenses", netProfit: "Net Profit", takeHome: "Take-Home",
};

export function KPIDetailModal({ kpiType, onClose }: { kpiType: KPIType | null; onClose: () => void }) {
  const { businesses, expenses, revenueEntries, employees } = useFinancialStore();
  const pl = useMemo(
    () => calculateConsolidatedPL(businesses, expenses, revenueEntries, employees),
    [businesses, expenses, revenueEntries, employees]
  );

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

  return (
    <Modal isOpen onClose={onClose} className="max-w-md">
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
        <div>
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
    </Modal>
  );
}
