"use client";
import { useMemo } from "react";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { useGoalStore } from "@/lib/stores/goalStore";
import { formatCompactCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/formatters";

function StatCard({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex-1 min-w-0 overflow-hidden">
      <p className="text-[10px] font-semibold text-text-faint uppercase tracking-wider mb-1 truncate">{label}</p>
      <p className={cn("font-mono text-base font-semibold text-text-primary truncate", valueClass)}>{value}</p>
    </div>
  );
}

export function GoalStats() {
  const { goals } = useFinancialStore();
  const feasibilityCache = useGoalStore((s) => s.feasibilityCache);

  const counts = useMemo(() => {
    let active = 0;
    let onTrack = 0;
    let atRisk = 0;
    let achieved = 0;
    for (const g of goals) {
      if (g.status === "achieved") achieved++;
      else if (g.status === "abandoned") continue;
      else {
        active++;
        if (g.status === "active") onTrack++;
        if (g.status === "at_risk" || g.status === "behind") atRisk++;
      }
    }
    return { active, onTrack, atRisk, achieved };
  }, [goals]);

  const monthlySurplus = useMemo(() => {
    const first = Object.values(feasibilityCache)[0];
    return first?.currentMonthlySurplus ?? 0;
  }, [feasibilityCache]);

  return (
    <div className="flex items-stretch gap-4 p-4 bg-surface-elevated rounded-[12px] mb-4">
      <StatCard label="Active" value={String(counts.active)} />
      <div className="w-px bg-border-subtle" />
      <StatCard label="On Track" value={String(counts.onTrack)} valueClass="text-success" />
      <div className="w-px bg-border-subtle" />
      <StatCard label="At Risk" value={String(counts.atRisk)} valueClass={counts.atRisk > 0 ? "text-accent" : undefined} />
      <div className="w-px bg-border-subtle" />
      <StatCard label="Achieved" value={String(counts.achieved)} valueClass="text-success" />
      <div className="w-px bg-border-subtle" />
      <StatCard
        label="Monthly Surplus"
        value={formatCompactCurrency(monthlySurplus)}
        valueClass={monthlySurplus >= 0 ? "text-success" : "text-danger"}
      />
    </div>
  );
}
