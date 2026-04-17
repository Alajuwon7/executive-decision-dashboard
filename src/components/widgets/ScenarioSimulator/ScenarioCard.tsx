"use client";
import { Trash2, Eye, GitCompare } from "lucide-react";
import type { Scenario } from "@/lib/data/types";
import { formatCompactCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/formatters";

interface Props {
  scenario: Scenario;
  onOpen: () => void;
  onCompare: () => void;
  onDelete: () => void;
  isInCompare: boolean;
}

export function ScenarioCard({ scenario, onOpen, onCompare, onDelete, isInCompare }: Props) {
  const surplus = scenario.projectedOutcome?.monthlySurplus ?? 0;
  const surplusDelta = scenario.projectedOutcome?.surplusDelta ?? 0;
  const topProb = scenario.monteCarloResults?.goalProbabilities[0];

  return (
    <div className="bg-surface-elevated border border-border-subtle rounded-card p-4 hover:border-border transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-base text-text-primary truncate">{scenario.name}</h3>
          <p className="text-[10px] text-text-faint">
            Created {new Date(scenario.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

      {scenario.description && <p className="text-xs text-text-muted line-clamp-2 mb-2">{scenario.description}</p>}

      <div className="space-y-1 mb-3">
        <p className="text-xs text-text-muted">
          {scenario.modifications.length} modification{scenario.modifications.length === 1 ? "" : "s"} applied
        </p>
        <p className="text-xs">
          <span className="text-text-muted">Surplus: </span>
          <span className="font-mono text-text-primary">{formatCompactCurrency(surplus)}</span>
          {surplusDelta !== 0 && (
            <span className={cn("ml-1 font-mono text-[10px]", surplusDelta > 0 ? "text-success" : "text-danger")}>
              ({surplusDelta > 0 ? "+" : ""}{formatCompactCurrency(surplusDelta)})
            </span>
          )}
        </p>
        {topProb && (
          <p className="text-xs font-mono text-text-muted truncate">
            {topProb.goalTitle}:{" "}
            <span className={cn(topProb.probabilityOfSuccess >= 75 ? "text-success" : topProb.probabilityOfSuccess >= 50 ? "text-accent" : "text-danger")}>
              {topProb.probabilityOfSuccess.toFixed(0)}%
            </span>
          </p>
        )}
      </div>

      <div className="flex gap-1.5">
        <button onClick={onOpen} className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-text-muted hover:text-text-primary border border-border-subtle rounded-button py-1.5 transition-colors">
          <Eye className="w-3 h-3" />
          Open
        </button>
        <button
          onClick={onCompare}
          className={cn(
            "flex items-center justify-center gap-1 text-xs font-semibold rounded-button py-1.5 px-2 border transition-colors",
            isInCompare
              ? "text-accent border-accent/40 bg-accent-subtle"
              : "text-text-muted border-border-subtle hover:text-text-primary"
          )}
        >
          <GitCompare className="w-3 h-3" />
        </button>
        <button onClick={onDelete} className="flex items-center justify-center text-text-faint hover:text-danger border border-border-subtle rounded-button py-1.5 px-2 transition-colors">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
