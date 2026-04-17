"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, X, AlertTriangle, TrendingUp, Target, Activity } from "lucide-react";
import type { PatternAlert } from "@/lib/data/types";
import { useGoalStore } from "@/lib/stores/goalStore";
import { cn } from "@/lib/utils/formatters";

const typeIcon: Record<PatternAlert["type"], any> = {
  spending_trend: TrendingUp,
  revenue_momentum: TrendingUp,
  goal_pacing: Target,
  anomaly: AlertTriangle,
  ratio_breach: Activity,
};

const severityClass: Record<PatternAlert["severity"], string> = {
  info: "border-blue-500/40 bg-blue-500/10 text-blue-300",
  warning: "border-accent/40 bg-accent-subtle text-accent",
  critical: "border-danger/40 bg-danger/10 text-danger",
};

interface Props {
  alerts: PatternAlert[];
}

export function PatternAlerts({ alerts }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const isAlertsExpanded = useGoalStore((s) => s.isAlertsExpanded);
  const toggleAlerts = useGoalStore((s) => s.toggleAlerts);
  const dismissAlert = useGoalStore((s) => s.dismissAlert);

  const visible = alerts.filter((a) => !a.isDismissed);
  const shown = isAlertsExpanded ? visible : visible.slice(0, 3);

  if (visible.length === 0) return null;

  return (
    <div className="mt-4 border-t border-border-subtle pt-3">
      <button
        onClick={toggleAlerts}
        className="flex items-center justify-between w-full mb-2"
      >
        <span className="text-xs font-semibold text-text-faint uppercase tracking-wider">
          Patterns & Insights
          <span className="ml-2 font-mono text-accent">{visible.length}</span>
        </span>
        {isAlertsExpanded ? (
          <ChevronUp className="w-3 h-3 text-text-faint" />
        ) : (
          <ChevronDown className="w-3 h-3 text-text-faint" />
        )}
      </button>

      <div className="space-y-1.5">
        {shown.map((a) => {
          const Icon = typeIcon[a.type] ?? Activity;
          const isOpen = expanded === a.id;
          return (
            <div
              key={a.id}
              className={cn(
                "border rounded-button p-2.5 transition-colors",
                severityClass[a.severity]
              )}
            >
              <div className="flex items-start gap-2">
                <Icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => setExpanded(isOpen ? null : a.id)}
                    className="text-left w-full"
                  >
                    <p className="text-xs font-semibold text-text-primary truncate">{a.title}</p>
                    {isOpen && <p className="text-[11px] text-text-muted mt-1">{a.message}</p>}
                  </button>
                </div>
                <button
                  onClick={() => dismissAlert(a.id)}
                  className="text-text-faint hover:text-text-muted transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
