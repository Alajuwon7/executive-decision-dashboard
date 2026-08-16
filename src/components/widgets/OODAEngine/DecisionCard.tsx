"use client";
import { memo, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/formatters";
import { useOODAStore } from "@/lib/stores/oodaStore";
import { repository } from "@/lib/data";
import { generateDecisionPDF } from "@/lib/utils/export";
import { toast } from "sonner";
import { ArrowRight, Zap, ShoppingCart, UserPlus, Building2, Package, Handshake, HelpCircle, MoreHorizontal, XCircle, Trash2, FileText } from "lucide-react";
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

export const DecisionCard = memo(function DecisionCard({ decision, onContinue }: DecisionCardProps) {
  const Icon = TYPE_ICONS[decision.type] ?? HelpCircle;
  const stageIndex = STAGE_ORDER[decision.stage] ?? 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const withdrawDecision = useOODAStore((s) => s.withdrawDecision);
  const deleteDecision = useOODAStore((s) => s.deleteDecision);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleWithdraw = async () => {
    setMenuOpen(false);
    if (!confirm(`Withdraw "${decision.title}"? It will be marked as cancelled but remain in the timeline for audit.`)) return;
    await withdrawDecision(decision.id);
  };

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      // The log drives the report's timeline. If it can't be read we still
      // want the report, so fall back to an empty log rather than aborting.
      let log: Awaited<ReturnType<typeof repository.getDecisionLog>> = [];
      try {
        log = await repository.getDecisionLog(decision.id);
      } catch {
        // non-fatal — timeline degrades to the decision's own timestamps
      }
      generateDecisionPDF(decision, log);
      toast.success("OODA report generated");
    } catch (err: any) {
      // Log the cause — a silent catch here is what made this hard to diagnose.
      console.error("OODA report generation failed:", err);
      toast.error(err?.message ? `Report failed: ${err.message}` : "Could not generate the report");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!confirm(`Permanently delete "${decision.title}"? This removes it and its full log from the database. This cannot be undone.`)) return;
    await deleteDecision(decision.id);
  };

  return (
    <div className="bg-surface border border-border rounded-card p-4 transition-all duration-200 hover:border-border-subtle">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-accent" />
          <span className="text-xs font-semibold text-text-muted uppercase">{decision.type.replace(/_/g, " ")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant={STATUS_VARIANT[decision.status] ?? "default"} className="text-[10px]">
            {decision.status.replace(/_/g, " ")}
          </Badge>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
              aria-label="Decision actions"
              className="w-6 h-6 flex items-center justify-center rounded-[6px] text-text-faint hover:bg-surface-elevated hover:text-text-muted transition-colors"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-7 z-20 min-w-[160px] bg-surface-elevated border border-border rounded-[10px] shadow-lg py-1 text-xs">
                {decision.status === "in_progress" && (
                  <button
                    type="button"
                    onClick={handleWithdraw}
                    className="w-full flex items-center gap-2 px-3 py-2 text-text-secondary hover:bg-bg text-left transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5 text-warning" /> Withdraw
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 text-danger hover:bg-bg text-left transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
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

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-text-faint shrink-0">{formatDate(decision.createdAt)}</span>
        <div className="flex items-center gap-1">
          {/* Available on every decision, not just in-progress ones — a report
              you can only produce while finalising is one you never re-run. */}
          <Button
            size="sm"
            variant="secondary"
            onClick={handleGenerateReport}
            isLoading={isGenerating}
            title="Download the full OODA decision report as a PDF"
          >
            <FileText className="w-3 h-3" />
            Generate OODA Report
          </Button>
          {decision.status === "in_progress" && (
            <Button size="sm" variant="ghost" onClick={onContinue}>
              Continue <ArrowRight className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
