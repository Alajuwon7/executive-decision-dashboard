"use client";
import type { FeasibilityResult } from "@/lib/data/types";
import { formatCompactCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/formatters";

interface FeasibilityEngineProps {
  feasibility: FeasibilityResult | null;
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
      <span className="text-xs text-text-muted">{label}</span>
      <span className={cn("font-mono text-sm font-semibold text-text-primary", accent)}>{value}</span>
    </div>
  );
}

export function FeasibilityEngine({ feasibility }: FeasibilityEngineProps) {
  if (!feasibility) {
    return (
      <div className="bg-surface-elevated border border-border-subtle rounded-card p-4">
        <p className="text-xs text-text-faint">Feasibility not yet calculated.</p>
      </div>
    );
  }

  const gapAccent = feasibility.gap >= 0 ? "text-success" : "text-danger";
  const surplusAccent = feasibility.currentMonthlySurplus >= 0 ? "text-success" : "text-danger";

  return (
    <div className="bg-surface-elevated border border-border-subtle rounded-card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-text-faint uppercase tracking-wider">Feasibility Breakdown</p>
        <span
          className={cn(
            "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border",
            feasibility.confidence === "high"
              ? "border-success/40 text-success bg-success/10"
              : feasibility.confidence === "medium"
              ? "border-accent/40 text-accent bg-accent-subtle"
              : "border-border-subtle text-text-faint"
          )}
        >
          {feasibility.confidence} confidence
        </span>
      </div>

      <Row label="Monthly revenue (avg 3mo)" value={formatCompactCurrency(feasibility.breakdown.totalRevenue)} />
      <Row label="− Monthly expenses" value={formatCompactCurrency(feasibility.breakdown.totalExpenses)} />
      <Row label="− Monthly payroll" value={formatCompactCurrency(feasibility.breakdown.totalPayroll)} />
      <Row label="− Personal draw" value={formatCompactCurrency(feasibility.breakdown.personalDraw)} />
      <Row label="= Monthly surplus" value={formatCompactCurrency(feasibility.breakdown.availableSurplus)} accent={surplusAccent} />

      <div className="h-px bg-border-subtle my-3" />

      <Row label="Monthly target needed" value={formatCompactCurrency(feasibility.monthlyTarget)} />
      <Row label="Gap" value={formatCompactCurrency(feasibility.gap)} accent={gapAccent} />
      {feasibility.projectedAchieveDate && (
        <Row
          label="Projected achieve date"
          value={new Date(feasibility.projectedAchieveDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
        />
      )}

      {feasibility.note && <p className="text-[10px] text-text-faint mt-3 italic">{feasibility.note}</p>}
    </div>
  );
}
