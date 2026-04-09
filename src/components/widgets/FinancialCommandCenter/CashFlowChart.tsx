"use client";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { formatCurrency } from "@/lib/utils/currency";
import { formatMonthYear, cn } from "@/lib/utils/formatters";

const tabs = ["Income", "Expense", "Saving"] as const;

export function CashFlowChart() {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Income");
  const trend = useFinancialStore((s) => s.getMonthlyRevenueTrend());
  const pl = useFinancialStore((s) => s.getConsolidatedPL());
  const data = trend.map((d) => ({ month: formatMonthYear(d.month + "-01"), amount: d.amount }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-base font-bold text-text-primary">Cash Flow</p>
          <p className="font-mono text-xl font-semibold text-text-primary mt-0.5">{formatCurrency(pl.totalRevenue)}</p>
        </div>
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={cn(
              "px-3 py-1.5 rounded-[8px] text-xs font-semibold border transition-all duration-150",
              activeTab === tab ? "bg-text-primary text-bg border-text-primary" : "bg-transparent text-text-muted border-border-subtle hover:border-text-muted"
            )}>{tab}</button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
          <XAxis dataKey="month" tick={{ fill: "#737373", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#737373", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
          <Tooltip cursor={{ fill: "rgba(245,158,11,0.05)" }} contentStyle={{ background: "#2A2A2A", border: "none", borderRadius: "8px", color: "#FFFFFF", fontSize: "12px", fontFamily: "var(--font-jetbrains-mono)" }} formatter={(value: number) => [formatCurrency(value), "Revenue"]} />
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
    </div>
  );
}
