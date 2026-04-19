"use client";
import { memo } from "react";
import { Sparkles, Link2, Building2 } from "lucide-react";
import type { Goal, FeasibilityResult, GoalStatus } from "@/lib/data/types";
import { formatCompactCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/formatters";
import { GoalProgressRing } from "./GoalProgressRing";

interface GoalCardProps {
  goal: Goal;
  feasibility: FeasibilityResult | null;
  onOpenDetail: () => void;
  onRequestWWIT: () => void;
}

const statusLabel: Record<GoalStatus, string> = {
  active: "On Track",
  at_risk: "At Risk",
  behind: "Behind",
  achieved: "Achieved",
  abandoned: "Archived",
};

const statusClass: Record<GoalStatus, string> = {
  active: "border-teal-500/30 text-teal-400 bg-teal-500/10",
  at_risk: "border-accent/40 text-accent bg-accent-subtle",
  behind: "border-danger/40 text-danger bg-danger/10",
  achieved: "border-success/40 text-success bg-success/10",
  abandoned: "border-border-subtle text-text-faint bg-transparent",
};

function OwnerBadge({ owner }: { owner: Goal["owner"] }) {
  const common = "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border";
  if (owner === "his") return <div className={cn(common, "border-teal-500/40 text-teal-300 bg-teal-500/10")}>H</div>;
  if (owner === "hers") return <div className={cn(common, "border-accent/40 text-accent bg-accent-subtle")}>S</div>;
  if (owner === "shared")
    return (
      <div className={cn(common, "border-border text-text-muted")}>
        <Link2 className="w-3 h-3" />
      </div>
    );
  return (
    <div className={cn(common, "border-border text-text-muted")}>
      <Building2 className="w-3 h-3" />
    </div>
  );
}

export const GoalCard = memo(function GoalCard({ goal, feasibility, onOpenDetail, onRequestWWIT }: GoalCardProps) {
  const target = goal.targetValue ?? 0;
  const pct = target > 0 ? (goal.currentValue / target) * 100 : 0;
  const isAtRisk = goal.status === "at_risk" || goal.status === "behind";

  return (
    <div className="bg-surface-elevated border border-border-subtle rounded-card p-4 flex flex-col gap-3 hover:border-border transition-colors">
      <div className="flex items-start justify-between">
        <OwnerBadge owner={goal.owner} />
        <span className={cn("text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border", statusClass[goal.status])}>
          {statusLabel[goal.status]}
        </span>
      </div>

      <div>
        <h3 className="font-serif text-base text-text-primary leading-tight mb-0.5">{goal.title}</h3>
        {goal.description && <p className="text-xs text-text-faint line-clamp-2">{goal.description}</p>}
      </div>

      <div className="flex items-center gap-3">
        <GoalProgressRing percentage={pct} status={goal.status} />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm text-text-primary truncate">
            {formatCompactCurrency(goal.currentValue)}{" "}
            <span className="text-text-faint">/ {formatCompactCurrency(target)}</span>
          </p>
          {goal.targetDate && (
            <p className="text-[10px] text-text-faint mt-0.5">
              Target: {new Date(goal.targetDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </p>
          )}
          {feasibility && isAtRisk && feasibility.gap < 0 && (
            <p className="text-[10px] text-accent font-mono mt-0.5">
              Gap: {formatCompactCurrency(feasibility.gap)}/mo
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-auto">
        <button
          onClick={onOpenDetail}
          className="flex-1 text-xs font-semibold text-text-muted hover:text-text-primary border border-border-subtle rounded-button py-1.5 transition-colors"
        >
          View Details
        </button>
        {isAtRisk && (
          <button
            onClick={onRequestWWIT}
            className="flex items-center gap-1 text-xs font-semibold text-accent border border-accent/40 bg-accent-subtle hover:bg-accent/20 rounded-button px-2.5 py-1.5 transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            What Would It Take?
          </button>
        )}
      </div>
    </div>
  );
});
