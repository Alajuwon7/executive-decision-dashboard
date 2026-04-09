"use client";
import { useMemo } from "react";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { useWorkforceStore } from "@/lib/stores/workforceStore";
import { formatCurrency } from "@/lib/utils/currency";
import { calculateTotalPayroll, calculateAverageCost, calculateFTE } from "@/lib/utils/workforce-calculations";
import { calculateTotalRevenue, calculatePayrollToRevenueRatio } from "@/lib/utils/calculations";
import { cn } from "@/lib/utils/formatters";

function StatCard({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-semibold text-text-faint uppercase tracking-wider mb-1">{label}</p>
      <p className={cn("font-mono text-lg font-semibold text-text-primary", valueClass)}>{value}</p>
    </div>
  );
}

export function WorkforceStats() {
  const { employees, revenueEntries } = useFinancialStore();
  const businessFilter = useWorkforceStore((s) => s.businessFilter);

  const filtered = useMemo(
    () => businessFilter ? employees.filter((e) => e.businessId === businessFilter) : employees,
    [employees, businessFilter]
  );

  const active = useMemo(() => filtered.filter((e) => e.status === "active"), [filtered]);
  const totalPayroll = useMemo(() => calculateTotalPayroll(active), [active]);
  const avgCost = useMemo(() => calculateAverageCost(active), [active]);
  const totalRevenue = useMemo(() => calculateTotalRevenue(revenueEntries), [revenueEntries]);
  const payrollRatio = useMemo(() => calculatePayrollToRevenueRatio(totalPayroll, totalRevenue), [totalPayroll, totalRevenue]);
  const fte = useMemo(() => calculateFTE(active), [active]);

  const ratioColor = payrollRatio < 30 ? "text-success" : payrollRatio < 40 ? "text-accent" : "text-danger";

  return (
    <div className="flex items-stretch gap-4 p-4 bg-surface-elevated rounded-[12px] mb-4">
      <StatCard label="Headcount" value={String(active.length)} />
      <div className="w-px bg-border-subtle" />
      <StatCard label="Monthly Payroll" value={formatCurrency(totalPayroll)} />
      <div className="w-px bg-border-subtle" />
      <StatCard label="Avg Cost/Employee" value={formatCurrency(avgCost)} />
      <div className="w-px bg-border-subtle" />
      <StatCard label="Payroll Ratio" value={`${payrollRatio.toFixed(1)}%`} valueClass={ratioColor} />
      <div className="w-px bg-border-subtle" />
      <StatCard label="FTE" value={fte.toFixed(1)} />
    </div>
  );
}
