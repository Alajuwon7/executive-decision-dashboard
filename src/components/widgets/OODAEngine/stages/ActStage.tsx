"use client";
import { useState } from "react";
import { repository } from "@/lib/data";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { useOODAStore } from "@/lib/stores/oodaStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { generateDecisionMarkdown, downloadMarkdown, generateDecisionPDF } from "@/lib/utils/export";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/formatters";
import { Download, CheckCircle2, XCircle, UserX } from "lucide-react";
import { toast } from "sonner";
import type { OODADecision } from "@/lib/data/ooda-types";

interface ActStageProps {
  decision: OODADecision;
  onComplete: () => void;
}

export function ActStage({ decision, onComplete }: ActStageProps) {
  const [outcomeNotes, setOutcomeNotes] = useState("");
  const [updateEmployeeStatus, setUpdateEmployeeStatus] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { updateEmployee } = useFinancialStore();
  const { withdrawDecision } = useOODAStore();

  const recommendedOption = decision.decideOptions?.options?.find((o: any) => o.recommended);
  const chosenOption = recommendedOption ?? decision.decideOptions?.options?.[0];

  const handleFinalize = async () => {
    setIsProcessing(true);
    try {
      // Update decision record
      await repository.updateOODADecision(decision.id, {
        stage: "completed",
        status: "decided",
        decidedAt: new Date().toISOString(),
        actOutcome: { outcomeNotes, chosenOption },
      });

      // Create log entry
      await repository.addDecisionLogEntry({
        oodaDecisionId: decision.id,
        action: "finalized",
        snapshot: decision.observeData,
        outcomeNotes,
      });

      // Optionally update employee status
      if (updateEmployeeStatus && decision.relatedEmployeeId && decision.type === "termination") {
        await updateEmployee(decision.relatedEmployeeId, { status: "terminated" });
      }

      toast.success("Decision finalized");
      onComplete();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to finalize decision");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportPDF = async () => {
    let log: Awaited<ReturnType<typeof repository.getDecisionLog>> = [];
    try {
      log = await repository.getDecisionLog(decision.id);
    } catch {
      // non-fatal — the report's timeline falls back to the decision's own dates
    }
    generateDecisionPDF({ ...decision, actOutcome: { outcomeNotes } }, log);
    toast.success("PDF exported");
  };

  const handleCopyMarkdown = async () => {
    let log: Awaited<ReturnType<typeof repository.getDecisionLog>> = [];
    try {
      log = await repository.getDecisionLog(decision.id);
    } catch {
      // non-fatal — the timeline falls back to the decision's own dates
    }
    const md = generateDecisionMarkdown({ ...decision, actOutcome: { outcomeNotes } }, log);
    navigator.clipboard.writeText(md).then(() => toast.success("Markdown copied to clipboard"));
  };

  const handleCancel = async () => {
    if (!confirm("Withdraw this decision? It will be marked as cancelled but remain in the timeline for audit.")) return;
    await withdrawDecision(decision.id);
  };

  return (
    <div>
      {/* Chosen option summary */}
      {chosenOption && (
        <div className="bg-surface-elevated rounded-card p-4 mb-5">
          <p className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-2">Recommended Action</p>
          <h4 className="text-base font-bold text-text-primary mb-1">{chosenOption.title}</h4>
          <p className="text-sm text-text-muted mb-3">{chosenOption.description}</p>
          <div className="flex gap-4">
            <div>
              <p className="text-[10px] text-text-faint uppercase">Monthly Impact</p>
              <p className={cn("font-mono text-sm font-bold", chosenOption.monthlySavings >= 0 ? "text-success" : "text-danger")}>
                {chosenOption.monthlySavings >= 0 ? "+" : ""}{formatCurrency(chosenOption.monthlySavings)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-text-faint uppercase">Annual Impact</p>
              <p className={cn("font-mono text-sm font-bold", chosenOption.annualImpact >= 0 ? "text-success" : "text-danger")}>
                {chosenOption.annualImpact >= 0 ? "+" : ""}{formatCurrency(chosenOption.annualImpact)}
              </p>
            </div>
          </div>

          {/* Implementation steps */}
          {chosenOption.implementationSteps?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-[10px] text-text-faint uppercase tracking-wider mb-2">Implementation Checklist</p>
              <div className="space-y-1.5">
                {chosenOption.implementationSteps.map((step: string, i: number) => (
                  <label key={i} className="flex items-start gap-2 text-sm text-text-secondary cursor-pointer">
                    <input type="checkbox" className="mt-0.5 accent-accent" />
                    {step}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Termination: update employee status */}
      {decision.type === "termination" && decision.relatedEmployeeId && (
        <label className="flex items-center gap-2 mb-4 p-3 bg-surface-elevated rounded-[10px] cursor-pointer">
          <input
            type="checkbox"
            checked={updateEmployeeStatus}
            onChange={(e) => setUpdateEmployeeStatus(e.target.checked)}
            className="accent-accent"
          />
          <UserX className="w-4 h-4 text-text-muted" />
          <span className="text-sm text-text-secondary">Update employee status to "Terminated"</span>
        </label>
      )}

      {/* Outcome notes */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-2">Outcome Notes</p>
        <textarea
          value={outcomeNotes}
          onChange={(e) => setOutcomeNotes(e.target.value)}
          placeholder="Describe what action you're taking and any additional context..."
          className="w-full bg-bg border border-border rounded-[8px] px-3 py-2.5 text-sm text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 min-h-[80px] resize-y"
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-4 border-t border-border">
        <Button onClick={handleFinalize} isLoading={isProcessing}>
          <CheckCircle2 className="w-3.5 h-3.5" /> Finalize Decision
        </Button>
        <Button variant="secondary" onClick={handleExportPDF}>
          <Download className="w-3.5 h-3.5" /> Export PDF
        </Button>
        <Button variant="ghost" onClick={handleCopyMarkdown}>
          Copy Markdown
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" className="text-danger" onClick={handleCancel}>
          <XCircle className="w-3.5 h-3.5" /> Cancel Decision
        </Button>
      </div>
    </div>
  );
}
