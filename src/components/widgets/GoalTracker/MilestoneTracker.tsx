"use client";
import { useState } from "react";
import { Check, Plus } from "lucide-react";
import type { GoalMilestone } from "@/lib/data/types";
import { useGoalStore } from "@/lib/stores/goalStore";
import { cn } from "@/lib/utils/formatters";

interface Props {
  goalId: string;
  milestones: GoalMilestone[];
}

export function MilestoneTracker({ goalId, milestones }: Props) {
  const [newTitle, setNewTitle] = useState("");
  const toggleMilestone = useGoalStore((s) => s.toggleMilestone);
  const createMilestone = useGoalStore((s) => s.createMilestone);

  const completedCount = milestones.filter((m) => m.isCompleted).length;
  const pct = milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0;

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    await createMilestone({ goalId, title: newTitle.trim() });
    setNewTitle("");
  };

  return (
    <div className="bg-surface-elevated border border-border-subtle rounded-card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-text-faint uppercase tracking-wider">Milestones</p>
        <span className="font-mono text-xs text-text-muted">
          {completedCount}/{milestones.length}
        </span>
      </div>
      {milestones.length > 0 && (
        <div className="h-1 bg-border-subtle rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-success transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <div className="space-y-1.5 mb-3">
        {milestones.map((m) => (
          <button
            key={m.id}
            onClick={() => toggleMilestone(m.id, !m.isCompleted)}
            className="w-full flex items-center gap-2 text-left text-sm py-1 hover:bg-surface/50 rounded px-1 transition-colors"
          >
            <div
              className={cn(
                "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                m.isCompleted ? "bg-success/20 border-success" : "border-border-subtle"
              )}
            >
              {m.isCompleted && <Check className="w-3 h-3 text-success" />}
            </div>
            <span className={cn("flex-1", m.isCompleted ? "text-text-faint line-through" : "text-text-primary")}>
              {m.title}
            </span>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add milestone..."
          className="flex-1 bg-surface border border-border-subtle rounded-button px-3 py-1.5 text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent"
        />
        <button
          onClick={handleAdd}
          className="px-2 bg-accent-subtle border border-accent/40 text-accent rounded-button hover:bg-accent/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
