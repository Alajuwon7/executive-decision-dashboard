"use client";
import { useMemo } from "react";
import type { Goal } from "@/lib/data/types";
import { cn } from "@/lib/utils/formatters";

interface Props {
  goals: Goal[];
  onSelectGoal: (id: string) => void;
}

// Tree layout default (spec approved). Force-directed toggle is a future enhancement
// gated behind dynamic d3-force import; not used by default to keep bundle small.
export function DependencyMap({ goals, onSelectGoal }: Props) {
  const roots = useMemo(() => {
    const dependents = new Set<string>();
    goals.forEach((g) => g.dependencies.forEach((d) => dependents.add(d)));
    // Roots are goals that nothing depends on (top of the chain) — show them first.
    return goals.filter((g) => !dependents.has(g.id) && g.dependencies.length === 0);
  }, [goals]);

  if (goals.length === 0) {
    return (
      <div className="bg-surface-elevated border border-border-subtle rounded-card p-4 text-center">
        <p className="text-xs text-text-faint">No goals to map.</p>
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    active: "border-teal-500/40 text-teal-300",
    at_risk: "border-accent/40 text-accent",
    behind: "border-danger/40 text-danger",
    achieved: "border-success/40 text-success",
    abandoned: "border-border-subtle text-text-faint",
  };

  const renderTree = (goalId: string, depth: number): React.ReactNode => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return null;
    const children = goals.filter((g) => g.dependencies.includes(goalId));
    return (
      <div key={goalId} className="flex flex-col gap-1">
        <button
          onClick={() => onSelectGoal(goalId)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-button border text-xs font-semibold text-left bg-surface hover:bg-surface-elevated transition-colors",
            statusColor[goal.status]
          )}
          style={{ marginLeft: depth * 16 }}
        >
          <span className="font-serif text-sm text-text-primary">{goal.title}</span>
          <span className="font-mono text-[10px] uppercase">{goal.status.replace("_", " ")}</span>
        </button>
        {children.length > 0 && (
          <div className="flex flex-col gap-1 border-l border-border-subtle ml-4 pl-2">
            {children.map((c) => renderTree(c.id, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const displayed = roots.length > 0 ? roots : goals.filter((g) => g.dependencies.length === 0);

  return (
    <div className="bg-surface-elevated border border-border-subtle rounded-card p-4">
      <p className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-3">Dependency Map (tree view)</p>
      <div className="flex flex-col gap-2">
        {displayed.map((g) => renderTree(g.id, 0))}
      </div>
    </div>
  );
}
