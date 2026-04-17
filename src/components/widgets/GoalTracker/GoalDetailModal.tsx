"use client";
import { useMemo } from "react";
import type { Goal, FeasibilityResult, GoalMilestone } from "@/lib/data/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useGoalStore } from "@/lib/stores/goalStore";
import { FeasibilityEngine } from "./FeasibilityEngine";
import { WhatWouldItTakeCards } from "./WhatWouldItTakeCards";
import { MilestoneTracker } from "./MilestoneTracker";
import { GoalProgressRing } from "./GoalProgressRing";
import { formatCompactCurrency } from "@/lib/utils/currency";

interface Props {
  goal: Goal | null;
  feasibility: FeasibilityResult | null;
  milestones: GoalMilestone[];
  onClose: () => void;
  onRequestWWIT: (goal: Goal) => void;
}

export function GoalDetailModal({ goal, feasibility, milestones, onClose, onRequestWWIT }: Props) {
  const wwitCache = useGoalStore((s) => s.wwitCache);
  const isGeneratingWWIT = useGoalStore((s) => s.isGeneratingWWIT);
  const updateGoal = useGoalStore((s) => s.updateGoal);
  const deleteGoal = useGoalStore((s) => s.deleteGoal);

  if (!goal) return null;

  const target = goal.targetValue ?? 0;
  const pct = target > 0 ? (goal.currentValue / target) * 100 : 0;
  const isAtRisk = goal.status === "at_risk" || goal.status === "behind";
  const wwitCards = wwitCache[goal.id] ?? (goal.metadata?.wwitCards as any) ?? null;

  const handleMarkAchieved = async () => {
    await updateGoal(goal.id, { status: "achieved" });
    onClose();
  };

  const handleAbandon = async () => {
    if (!confirm("Abandon this goal?")) return;
    await updateGoal(goal.id, { status: "abandoned" });
    onClose();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this goal permanently?")) return;
    await deleteGoal(goal.id);
    onClose();
  };

  return (
    <Modal isOpen={!!goal} onClose={onClose} title={goal.title} className="!max-w-2xl">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <GoalProgressRing percentage={pct} status={goal.status} size={96} />
          <div className="flex-1 min-w-0">
            <p className="font-mono text-lg text-text-primary">
              {formatCompactCurrency(goal.currentValue)}{" "}
              <span className="text-text-faint text-sm">/ {formatCompactCurrency(target)}</span>
            </p>
            {goal.targetDate && (
              <p className="text-xs text-text-muted mt-1">
                Target: {new Date(goal.targetDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            )}
            {goal.description && <p className="text-xs text-text-muted mt-2">{goal.description}</p>}
          </div>
        </div>

        {goal.type !== "operational" && <FeasibilityEngine feasibility={feasibility} />}

        {goal.type === "operational" && (
          <MilestoneTracker goalId={goal.id} milestones={milestones} />
        )}

        {isAtRisk && (
          <div>
            <p className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-2">Recovery Paths</p>
            <WhatWouldItTakeCards
              cards={wwitCards}
              loading={isGeneratingWWIT}
              onGenerate={() => onRequestWWIT(goal)}
            />
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t border-border-subtle">
          {goal.status !== "achieved" && (
            <Button size="sm" onClick={handleMarkAchieved}>Mark Achieved</Button>
          )}
          {goal.status !== "abandoned" && (
            <Button size="sm" variant="ghost" onClick={handleAbandon}>Abandon</Button>
          )}
          <Button size="sm" variant="ghost" onClick={handleDelete}>Delete</Button>
        </div>
      </div>
    </Modal>
  );
}
