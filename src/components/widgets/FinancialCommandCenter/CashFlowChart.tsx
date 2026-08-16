"use client";
import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { formatCurrency } from "@/lib/utils/currency";
import { formatMonthYear } from "@/lib/utils/formatters";
import { getMonthlyRevenueTrend, calculateConsolidatedPL } from "@/lib/utils/calculations";
import { KPIDetailModal } from "./KPIDetailModal";
import type { KPIType } from "@/lib/data/types";

const tabs: { label: string; kpi: KPIType }[] = [
  { label: "Income", kpi: "revenue" },
  { label: "Expense", kpi: "expenses" },
  { label: "Saving", kpi: "takeHome" },
];

export function CashFlowChart() {
  const [selectedKPI, setSelectedKPI] = useState<KPIType | null>(null);
  const { businesses, expenses, revenueEntries, employees } = useFinancialStore();
  const trend = useMemo(() => getMonthlyRevenueTrend(revenueEntries), [revenueEntries]);
  const pl = useMemo(() => calculateConsolidatedPL(businesses, expenses, revenueEntries, employees), [businesses, expenses, revenueEntries, employees]);
  const data = useMemo(() => trend.map((d) => ({ month: formatMonthYear(d.month + "-01"), amount: d.amount })), [trend]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-base font-bold text-text-primary">Cash Flow</p>
          <p className="font-mono text-xl font-semibold text-text-primary mt-0.5">{formatCurrency(pl.totalRevenue)}</p>
        </div>
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setSelectedKPI(tab.kpi)}
              className="px-3 py-1.5 rounded-[8px] text-xs font-semibold border bg-transparent text-text-muted border-border-subtle hover:border-accent hover:text-text-primary transition-all duration-150"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
          <XAxis dataKey="month" tick={{ fill: "#737373", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#737373", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
          <Tooltip
            cursor={{ fill: "rgba(245,158,11,0.05)" }}
            contentStyle={{ background: "#2A2A2A", border: "1px solid #404040", borderRadius: "8px", color: "#FFFFFF", fontSize: "12px", fontFamily: "var(--font-jetbrains-mono)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
            labelStyle={{ color: "#A3A3A3", marginBottom: "2px" }}
            itemStyle={{ color: "#FFFFFF" }}
            formatter={(value: any) => [formatCurrency(Number(value)), "Revenue"]}
          />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={i === data.length - 1 ? "url(#amberGradientStrong)" : `rgba(245,158,11,${0.1 + (i / data.length) * 0.25})`} />)}
          </Bar>
          <defs>
            <linearGradient id="amberGradientStrong" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.3} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
      <KPIDetailModal kpiType={selectedKPI} onClose={() => setSelectedKPI(null)} />
    </div>
  );
}
