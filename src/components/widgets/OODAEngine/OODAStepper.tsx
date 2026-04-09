"use client";
import { Check, Eye, Compass, Scale, Play } from "lucide-react";
import { cn } from "@/lib/utils/formatters";
import type { DecisionStage } from "@/lib/data/ooda-types";

const STAGES: { id: DecisionStage; label: string; icon: any }[] = [
  { id: "observe", label: "Observe", icon: Eye },
  { id: "orient", label: "Orient", icon: Compass },
  { id: "decide", label: "Decide", icon: Scale },
  { id: "act", label: "Act", icon: Play },
];

const STAGE_ORDER: Record<DecisionStage, number> = {
  observe: 0, orient: 1, decide: 2, act: 3, completed: 4,
};

interface OODAStepperProps {
  currentStage: DecisionStage;
  onStageClick?: (stage: DecisionStage) => void;
}

export function OODAStepper({ currentStage, onStageClick }: OODAStepperProps) {
  const currentIndex = STAGE_ORDER[currentStage] ?? 0;

  return (
    <div className="flex items-center justify-between mb-6">
      {STAGES.map((stage, i) => {
        const isCompleted = currentIndex > i;
        const isActive = currentIndex === i;
        const isFuture = currentIndex < i;
        const Icon = stage.icon;

        return (
          <div key={stage.id} className="flex items-center flex-1">
            <button
              onClick={() => isCompleted && onStageClick?.(stage.id)}
              disabled={!isCompleted}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-button transition-all duration-200",
                isActive && "bg-accent-subtle text-accent",
                isCompleted && "text-success cursor-pointer hover:bg-surface-elevated",
                isFuture && "text-text-faint cursor-default"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                isActive && "bg-accent text-bg",
                isCompleted && "bg-success-bg text-success",
                isFuture && "bg-surface-elevated text-text-faint"
              )}>
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <span className="text-sm font-semibold hidden sm:inline">{stage.label}</span>
            </button>
            {i < STAGES.length - 1 && (
              <div className={cn(
                "flex-1 h-px mx-2",
                currentIndex > i ? "bg-success/30" : "bg-border"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
