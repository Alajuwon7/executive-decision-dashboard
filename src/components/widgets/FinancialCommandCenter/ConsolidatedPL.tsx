"use client";
import { useState, useMemo } from "react";
import { useCountUp } from "@/hooks/useCountUp";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { formatCurrency } from "@/lib/utils/currency";
import { calculateConsolidatedPL } from "@/lib/utils/calculations";
import { Badge } from "@/components/ui/Badge";
import { KPIDetailModal } from "./KPIDetailModal";
import type { KPIType } from "@/lib/data/types";

function MetricCard({ label, value, change, kpiType, onClick }: {
  label: string; value: number; change: number; kpiType: KPIType; onClick: (type: KPIType) => void;
}) {
  const animatedValue = useCountUp(value);
  const isPositive = change >= 0;
  return (
    <button onClick={() => onClick(kpiType)} className="bg-surface-elevated rounded-[12px] p-4 text-left transition-all duration-200 hover:border-accent border border-transparent cursor-pointer">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-2xl font-semibold text-text-primary">{formatCurrency(parseFloat(animatedValue))}</span>
        <Badge variant={isPositive ? "success" : "danger"} className="text-[10px]">
          {isPositive ? "\u2191" : "\u2193"} {Math.abs(change).toFixed(1)}%
        </Badge>
      </div>
    </button>
  );
}

export function ConsolidatedPL() {
  const [selectedKPI, setSelectedKPI] = useState<KPIType | null>(null);
  const { businesses, expenses, revenueEntries, employees } = useFinancialStore();
  const pl = useMemo(
    () => calculateConsolidatedPL(businesses, expenses, revenueEntries, employees),
    [businesses, expenses, revenueEntries, employees]
  );
  return (
    <>
      <div className="grid grid-cols-4 gap-3 mb-5">
        <MetricCard label="Total Revenue" value={pl.totalRevenue} change={pl.revenueChange} kpiType="revenue" onClick={setSelectedKPI} />
        <MetricCard label="Total Expenses" value={pl.totalExpenses} change={pl.expenseChange} kpiType="expenses" onClick={setSelectedKPI} />
        <MetricCard label="Net Profit" value={pl.netProfit} change={pl.profitChange} kpiType="netProfit" onClick={setSelectedKPI} />
        <MetricCard label="Take-Home" value={pl.takeHome} change={pl.takeHomeChange} kpiType="takeHome" onClick={setSelectedKPI} />
      </div>
      <KPIDetailModal kpiType={selectedKPI} onClose={() => setSelectedKPI(null)} />
    </>
  );
}
