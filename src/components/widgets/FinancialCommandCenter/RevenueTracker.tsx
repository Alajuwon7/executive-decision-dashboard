"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { formatCurrency } from "@/lib/utils/currency";
import { formatMonthYear } from "@/lib/utils/formatters";

export function RevenueTracker() {
  const { businesses } = useFinancialStore();
  const trend1 = useFinancialStore((s) => s.getMonthlyRevenueTrend(businesses[0]?.id));
  const trend2 = useFinancialStore((s) => s.getMonthlyRevenueTrend(businesses[1]?.id));
  const months = new Set([...trend1.map((d) => d.month), ...trend2.map((d) => d.month)]);
  const biz1Name = businesses[0]?.displayName ?? "Business 1";
  const biz2Name = businesses[1]?.displayName ?? "Business 2";
  const data = Array.from(months).sort().map((month) => ({
    month: formatMonthYear(month + "-01"),
    [biz1Name]: trend1.find((d) => d.month === month)?.amount ?? 0,
    [biz2Name]: trend2.find((d) => d.month === month)?.amount ?? 0,
  }));

  if (data.length === 0) return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <p className="text-text-muted text-sm">No revenue entries yet</p>
      <p className="text-text-faint text-xs mt-1">Add your first revenue entry to see trends</p>
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-4 mb-3">
        <p className="text-base font-bold text-text-primary">Revenue Trend</p>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-accent" /><span className="text-[10px] text-text-muted">{biz1Name}</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-purple" /><span className="text-[10px] text-text-muted">{biz2Name}</span></div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
          <XAxis dataKey="month" tick={{ fill: "#737373", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#737373", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
          <Tooltip contentStyle={{ background: "#2A2A2A", border: "none", borderRadius: "8px", color: "#FFFFFF", fontSize: "12px", fontFamily: "var(--font-jetbrains-mono)" }} formatter={(value: any) => formatCurrency(Number(value))} />
          <Line type="monotone" dataKey={biz1Name} stroke="#F59E0B" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#F59E0B" }} />
          <Line type="monotone" dataKey={biz2Name} stroke="#8B5CF6" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#8B5CF6" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
