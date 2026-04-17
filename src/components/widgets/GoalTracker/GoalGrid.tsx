"use client";
import { Target, Plus } from "lucide-react";
import type { Goal, FeasibilityResult } from "@/lib/data/types";
import { GoalCard } from "./GoalCard";

interface GoalGridProps {
  goals: Goal[];
  feasibilityCache: Record<string, FeasibilityResult>;
  onOpenDetail: (id: string) => void;
  onRequestWWIT: (id: string) => void;
  onAdd: () => void;
}

export function GoalGrid({ goals, feasibilityCache, onOpenDetail, onRequestWWIT, onAdd }: GoalGridProps) {
  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 border border-dashed border-border-subtle rounded-card">
        <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center">
          <Target className="w-5 h-5 text-text-faint" />
        </div>
        <div className="text-center">
          <p className="text-sm text-text-muted font-semibold">No goals yet</p>
          <p className="text-xs text-text-faint mt-1">Create your first goal to start tracking feasibility.</p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 text-xs font-semibold text-accent border border-accent/40 bg-accent-subtle hover:bg-accent/20 rounded-button px-3 py-1.5 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Goal
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {goals.map((g) => (
        <GoalCard
          key={g.id}
          goal={g}
          feasibility={feasibilityCache[g.id] ?? g.feasibility ?? null}
          onOpenDetail={() => onOpenDetail(g.id)}
          onRequestWWIT={() => onRequestWWIT(g.id)}
        />
      ))}
    </div>
  );
}
