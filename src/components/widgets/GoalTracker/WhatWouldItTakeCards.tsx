"use client";
import { Scissors, TrendingUp, Shuffle, Calendar, Sparkles } from "lucide-react";
import type { WhatWouldItTakeCard, ScenarioModification } from "@/lib/data/types";
import { formatCompactCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/formatters";
import { useScenarioStore } from "@/lib/stores/scenarioStore";

const categoryIcons = {
  reduce_cost: Scissors,
  increase_revenue: TrendingUp,
  restructure: Shuffle,
  timeline_shift: Calendar,
};

const difficultyClass = {
  easy: "border-success/40 text-success bg-success/10",
  medium: "border-accent/40 text-accent bg-accent-subtle",
  hard: "border-danger/40 text-danger bg-danger/10",
};

interface Props {
  cards: WhatWouldItTakeCard[] | null;
  loading: boolean;
  onGenerate: () => void;
}

function CardSkeleton() {
  return (
    <div className="bg-surface-elevated border border-border-subtle rounded-card p-4 animate-pulse">
      <div className="h-3 w-20 bg-border-subtle rounded mb-2" />
      <div className="h-4 w-3/4 bg-border-subtle rounded mb-3" />
      <div className="h-3 w-full bg-border-subtle rounded mb-1" />
      <div className="h-3 w-1/2 bg-border-subtle rounded" />
    </div>
  );
}

export function WhatWouldItTakeCards({ cards, loading, onGenerate }: Props) {
  const openBuilderWithMods = useScenarioStore((s) => s.openBuilderWithMods);

  const applyToScenario = (c: WhatWouldItTakeCard) => {
    const mod: ScenarioModification = {
      type: "custom",
      label: c.title,
      monthlyImpact:
        c.category === "reduce_cost" ? c.monthlySavingsOrRevenue : c.monthlySavingsOrRevenue,
      description: c.description,
    };
    openBuilderWithMods([mod], c.title);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-text-faint italic flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-accent animate-pulse" />
          Claude is generating recovery suggestions...
        </p>
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <div className="bg-surface-elevated border border-dashed border-border-subtle rounded-card p-6 text-center">
        <Sparkles className="w-5 h-5 text-accent mx-auto mb-2" />
        <p className="text-sm text-text-muted mb-3">
          Get AI-powered recovery paths for this goal
        </p>
        <button
          onClick={onGenerate}
          className="text-xs font-semibold text-accent border border-accent/40 bg-accent-subtle hover:bg-accent/20 rounded-button px-4 py-2 transition-colors"
        >
          Generate Suggestions
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cards.map((c) => {
        const Icon = categoryIcons[c.category] ?? Shuffle;
        return (
          <div key={c.id} className="bg-surface-elevated border border-border-subtle rounded-card p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-accent" />
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  {c.category.replace("_", " ")}
                </span>
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                  difficultyClass[c.difficulty]
                )}
              >
                {c.difficulty}
              </span>
            </div>
            <h4 className="font-serif text-base text-text-primary mb-1">{c.title}</h4>
            <p className="text-xs text-text-muted mb-3">{c.description}</p>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <p className="text-[10px] text-text-faint uppercase tracking-wider">Monthly Impact</p>
                <p className="font-mono text-sm font-bold text-success">
                  +{formatCompactCurrency(c.monthlySavingsOrRevenue)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-text-faint uppercase tracking-wider">Time to Impact</p>
                <p className="text-xs text-text-primary">{c.timeToImpact}</p>
              </div>
            </div>

            {c.implementationSteps.length > 0 && (
              <ol className="text-xs text-text-muted space-y-0.5 mb-3 list-decimal list-inside">
                {c.implementationSteps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            )}

            <button
              onClick={() => applyToScenario(c)}
              className="text-xs font-semibold text-accent border border-accent/40 bg-accent-subtle hover:bg-accent/20 rounded-button px-3 py-1.5 transition-colors"
            >
              Apply to Scenario →
            </button>
          </div>
        );
      })}
    </div>
  );
}
