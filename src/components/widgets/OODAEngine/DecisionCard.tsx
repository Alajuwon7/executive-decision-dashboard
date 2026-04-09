"use client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/formatters";
import { ArrowRight, Zap, ShoppingCart, UserPlus, Building2, Package, Handshake, HelpCircle } from "lucide-react";
import type { OODADecision, DecisionStage } from "@/lib/data/ooda-types";

const TYPE_ICONS: Record<string, any> = {
  termination: Zap,
  large_purchase: ShoppingCart,
  new_hire: UserPlus,
  new_business: Building2,
  new_product: Package,
  partnership: Handshake,
  other: HelpCircle,
};

const STATUS_VARIANT: Record<string, "accent" | "success" | "default" | "danger"> = {
  in_progress: "accent",
  decided: "success",
  exported: "default",
  cancelled: "danger",
};

const STAGE_ORDER: Record<DecisionStage, number> = {
  observe: 0, orient: 1, decide: 2, act: 3, completed: 4,
};

interface DecisionCardProps {
  decision: OODADecision;
  onContinue: () => void;
}

export function DecisionCard({ decision, onContinue }: DecisionCardProps) {
  const Icon = TYPE_ICONS[decision.type] ?? HelpCircle;
  const stageIndex = STAGE_ORDER[decision.stage] ?? 0;

  return (
    <div className="bg-surface border border-border rounded-card p-4 transition-all duration-200 hover:border-border-subtle">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-accent" />
          <span className="text-xs font-semibold text-text-muted uppercase">{decision.type.replace(/_/g, " ")}</span>
        </div>
        <Badge variant={STATUS_VARIANT[decision.status] ?? "default"} className="text-[10px]">
          {decision.status.replace(/_/g, " ")}
        </Badge>
      </div>

      <h4 className="text-sm font-bold text-text-primary mb-2 truncate">{decision.title}</h4>

      {/* Stage dots */}
      <div className="flex items-center gap-1.5 mb-3">
        {["observe", "orient", "decide", "act"].map((s, i) => (
          <div
            key={s}
            className={cn(
              "w-2 h-2 rounded-full",
              i < stageIndex ? "bg-success" : i === stageIndex && decision.stage !== "completed" ? "bg-accent animate-pulse" : "bg-border"
            )}
          />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-faint">{formatDate(decision.createdAt)}</span>
        {decision.status === "in_progress" && (
          <Button size="sm" variant="ghost" onClick={onContinue}>
            Continue <ArrowRight className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
