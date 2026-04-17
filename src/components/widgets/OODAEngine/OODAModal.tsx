"use client";
import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useOODAStore } from "@/lib/stores/oodaStore";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { repository } from "@/lib/data";
import { getUser } from "@/lib/auth";
import { OODAStepper } from "./OODAStepper";
import { ObserveStage } from "./stages/ObserveStage";
import { OrientStage } from "./stages/OrientStage";
import { DecideStage } from "./stages/DecideStage";
import { ActStage } from "./stages/ActStage";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowLeft, X, XCircle } from "lucide-react";
import type { OODADecision, DecisionStage, FinancialSnapshot } from "@/lib/data/ooda-types";

export function OODAModal() {
  const { activeDecisionId, activeStage, isModalOpen, closeModal, setStage, withdrawDecision } = useOODAStore();
  const { employees } = useFinancialStore();
  const [decision, setDecision] = useState<OODADecision | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState("anonymous");

  useEffect(() => {
    if (activeDecisionId && isModalOpen) {
      loadDecision();
    }
  }, [activeDecisionId, isModalOpen]);

  useEffect(() => {
    getUser().then((u) => { if (u) setUserId(u.email); });
  }, []);

  const loadDecision = async () => {
    if (!activeDecisionId) return;
    setIsLoading(true);
    try {
      const d = await repository.getOODADecision(activeDecisionId);
      if (d) {
        setDecision(d);
        setStage(d.stage as any);
      }
    } catch { /* ignore */ }
    finally { setIsLoading(false); }
  };

  const snapshot = useMemo<FinancialSnapshot | null>(
    () => decision?.observeData as FinancialSnapshot ?? null,
    [decision]
  );

  const relatedEmployee = useMemo(
    () => decision?.relatedEmployeeId ? employees.find((e) => e.id === decision.relatedEmployeeId) : null,
    [decision, employees]
  );

  const advanceStage = async (nextStage: DecisionStage) => {
    if (!decision) return;
    setStage(nextStage as "observe" | "orient" | "decide" | "act");
    await repository.updateOODADecision(decision.id, { stage: nextStage });
    await loadDecision();
  };

  if (!isModalOpen) return null;

  const content = (
    <div className="fixed inset-0 z-[100] bg-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={closeModal}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <h2 className="text-lg font-bold text-text-primary">{decision?.title ?? "Loading..."}</h2>
        </div>
        <div className="flex items-center gap-2">
          {decision?.status === "in_progress" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-warning hover:text-warning"
              onClick={async () => {
                if (!confirm(`Withdraw "${decision.title}"? It will be marked as cancelled but remain in the timeline for audit.`)) return;
                await withdrawDecision(decision.id);
              }}
            >
              <XCircle className="w-3.5 h-3.5" /> Withdraw
            </Button>
          )}
          <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-surface-elevated text-text-muted hover:text-text-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stepper */}
      <div className="px-6 py-4">
        <OODAStepper
          currentStage={activeStage ?? "observe"}
          onStageClick={(s) => setStage(s as "observe" | "orient" | "decide" | "act")}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : decision && snapshot ? (
            <>
              {activeStage === "observe" && (
                <ObserveStage
                  snapshot={snapshot}
                  relatedEmployee={relatedEmployee}
                  decisionType={decision.type}
                  onContinue={() => advanceStage("orient")}
                />
              )}
              {activeStage === "orient" && (
                <OrientStage
                  decision={decision}
                  snapshot={snapshot}
                  onContinue={() => advanceStage("decide")}
                  onRefresh={loadDecision}
                />
              )}
              {activeStage === "decide" && (
                <DecideStage
                  decision={decision}
                  snapshot={snapshot}
                  currentUserId={userId}
                  onContinue={() => advanceStage("act")}
                />
              )}
              {activeStage === "act" && (
                <ActStage
                  decision={decision}
                  onComplete={closeModal}
                />
              )}
            </>
          ) : (
            <p className="text-text-muted text-center py-8">Decision not found.</p>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(content, document.body);
  }
  return content;
}
