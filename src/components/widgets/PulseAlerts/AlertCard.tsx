"use client";
import { memo } from "react";
import { X, AlertTriangle, Activity, TrendingDown, TrendingUp, Target, AlertCircle, Clock } from "lucide-react";
import type { PulseAlert } from "@/lib/data/types";
import { cn } from "@/lib/utils/formatters";

const typeIcon: Record<PulseAlert["type"], any> = {
  ratio_breach: Activity,
  goal_at_risk: Target,
  goal_pacing: Target,
  spending_trend: TrendingUp,
  revenue_drop: TrendingDown,
  revenue_momentum: TrendingUp,
  anomaly: AlertTriangle,
  decision_stalled: Clock,
};

const severityClass: Record<PulseAlert["severity"], { border: string; bg: string; text: string }> = {
  info: { border: "border-l-blue-500", bg: "bg-blue-500/5", text: "text-blue-300" },
  warning: { border: "border-l-accent", bg: "bg-accent-subtle", text: "text-accent" },
  critical: { border: "border-l-danger", bg: "bg-danger/10", text: "text-danger" },
};

interface Props {
  alert: PulseAlert;
  onRead: () => void;
  onDismiss: () => void;
}

export const AlertCard = memo(function AlertCard({ alert, onRead, onDismiss }: Props) {
  const Icon = typeIcon[alert.type] ?? AlertCircle;
  const cls = severityClass[alert.severity];

  return (
    <div
      onClick={() => !alert.isRead && onRead()}
      className={cn(
        "relative border-l-4 border border-border-subtle rounded-card p-3 cursor-pointer transition-all",
        cls.border,
        alert.isRead ? "bg-surface-elevated" : cls.bg
      )}
    >
      <div className="flex items-start gap-2">
        <Icon className={cn("w-4 h-4 flex-shrink-0 mt-0.5", cls.text)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className={cn("text-[10px] font-bold uppercase tracking-wider", cls.text)}>
              {alert.severity}
            </span>
            <span className="text-[10px] text-text-faint font-mono">
              {new Date(alert.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
          <p className="text-xs font-semibold text-text-primary mb-1 truncate">{alert.title}</p>
          <p className="text-[11px] text-text-muted line-clamp-2">{alert.message}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="text-text-faint hover:text-text-muted transition-colors flex-shrink-0"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
});
