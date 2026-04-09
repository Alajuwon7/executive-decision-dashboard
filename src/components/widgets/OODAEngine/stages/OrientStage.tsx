"use client";
import { useEffect, useState } from "react";
import { useOODAStore } from "@/lib/stores/oodaStore";
import { repository } from "@/lib/data";
import { AIAnalysisPanel } from "../AIAnalysisPanel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/formatters";
import { RefreshCw, AlertTriangle, Shield, Zap, Bot } from "lucide-react";
import { toast } from "sonner";
import type { OODADecision, FinancialSnapshot } from "@/lib/data/ooda-types";

interface OrientStageProps {
  decision: OODADecision;
  snapshot: FinancialSnapshot;
  onContinue: () => void;
  onRefresh: () => void;
}

export function OrientStage({ decision, snapshot, onContinue, onRefresh }: OrientStageProps) {
  const { isAnalyzing, setAnalyzing, setError, analysisError } = useOODAStore();
  const [analysis, setAnalysis] = useState<Record<string, any>>(decision.orientAnalysis);
  const hasAnalysis = Object.keys(analysis).length > 0;

  const runAnalysis = async (bypassCache = false) => {
    setAnalyzing(true);
    setError(null);
    try {
      // Find related employee data from snapshot
      const relatedEmployee = decision.relatedEmployeeId
        ? snapshot.employees.find((e) => e.id === decision.relatedEmployeeId)
        : null;

      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "orient",
          decisionType: decision.type,
          snapshot,
          employee: relatedEmployee,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Analysis failed");
      }

      const data = await res.json();
      setAnalysis(data.analysis);

      // Save to DB
      await repository.updateOODADecision(decision.id, {
        orientAnalysis: data.analysis,
        stage: "orient",
      });

      toast.success("Analysis complete");
    } catch (err: any) {
      setError(err.message ?? "Failed to generate analysis");
      toast.error(err.message ?? "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!hasAnalysis && !isAnalyzing) {
      runAnalysis();
    }
  }, []); // Run once on mount if no analysis exists

  if (isAnalyzing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-accent-subtle flex items-center justify-center animate-pulse">
            <Bot className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">Claude is analyzing your decision...</p>
            <p className="text-xs text-text-muted">This typically takes 10-15 seconds</p>
          </div>
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (analysisError && !hasAnalysis) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-8 h-8 text-danger mx-auto mb-3" />
        <p className="text-sm text-text-secondary mb-1">Analysis Failed</p>
        <p className="text-xs text-text-muted mb-4">{analysisError}</p>
        <Button size="sm" onClick={() => runAnalysis()}>
          <RefreshCw className="w-3.5 h-3.5" /> Retry Analysis
        </Button>
      </div>
    );
  }

  if (!hasAnalysis) return null;

  // Render based on decision type
  const isTermination = decision.type === "termination";

  return (
    <div>
      <AIAnalysisPanel>
        {isTermination ? (
          <TerminationAnalysis analysis={analysis} />
        ) : decision.type === "large_purchase" ? (
          <PurchaseAnalysis analysis={analysis} />
        ) : (
          <GenericAnalysis analysis={analysis} />
        )}
      </AIAnalysisPanel>

      {/* Regenerate + Continue */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
        <Button size="sm" variant="ghost" onClick={() => runAnalysis(true)}>
          <RefreshCw className="w-3.5 h-3.5" /> Regenerate Analysis
        </Button>
        <Button onClick={onContinue}>
          Continue to Options →
        </Button>
      </div>
    </div>
  );
}

function TerminationAnalysis({ analysis }: { analysis: any }) {
  const ri = analysis.roleImpactSummary;
  const auto = analysis.automationAssessment;
  const fin = analysis.financialTradeoffMatrix;
  const risk = analysis.riskAssessment;

  return (
    <div className="space-y-5">
      {/* Role Impact */}
      {ri && (
        <div>
          <p className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-2">Role Impact</p>
          <p className="text-sm text-text-secondary mb-3">{ri.overview}</p>
          {ri.taskBreakdown?.length > 0 && (
            <div className="space-y-1.5">
              {ri.taskBreakdown.map((task: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 bg-bg rounded-[8px]">
                  <span className="text-sm text-text-secondary">{task.task}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-text-muted">{task.hoursPerWeek} hrs/wk</span>
                    <Badge className="text-[10px]">{task.category}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Automation Assessment */}
      {auto && (
        <div>
          <p className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Zap className="w-3 h-3" /> Automation Assessment
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-success uppercase tracking-wider mb-1.5">Can Automate</p>
              <div className="space-y-1.5">
                {auto.automatable?.map((item: any, i: number) => (
                  <div key={i} className="bg-bg rounded-[8px] p-2.5">
                    <p className="text-xs font-semibold text-text-secondary">{item.task}</p>
                    <p className="text-[10px] text-text-muted">Tool: {item.tool}</p>
                    <p className="font-mono text-xs text-accent">{formatCurrency(item.monthlyCost)}/mo</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-danger uppercase tracking-wider mb-1.5">Requires Human</p>
              <div className="space-y-1.5">
                {auto.requiresHuman?.map((item: any, i: number) => (
                  <div key={i} className="bg-bg rounded-[8px] p-2.5">
                    <p className="text-xs font-semibold text-text-secondary">{item.task}</p>
                    <p className="text-[10px] text-text-muted">{item.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {auto.automationSavingsVsSalary != null && (
            <div className="mt-2 px-3 py-2 bg-bg rounded-[8px] flex items-center justify-between">
              <span className="text-xs text-text-muted">Automation savings vs salary</span>
              <span className="font-mono text-sm font-semibold text-success">{formatCurrency(auto.automationSavingsVsSalary)}/mo</span>
            </div>
          )}
        </div>
      )}

      {/* Financial Tradeoff */}
      {fin && (
        <div>
          <p className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-2">Financial Tradeoff</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-bg rounded-[10px] p-3 text-center">
              <p className="text-[10px] text-text-faint uppercase mb-1">Current Cost</p>
              <p className="font-mono text-sm font-semibold text-text-primary">{formatCurrency(fin.currentMonthlyCost)}/mo</p>
            </div>
            <div className="bg-bg rounded-[10px] p-3 text-center">
              <p className="text-[10px] text-text-faint uppercase mb-1">Savings</p>
              <p className="font-mono text-sm font-semibold text-success">{formatCurrency(fin.savingsIfTerminated)}/mo</p>
            </div>
            <div className="bg-bg rounded-[10px] p-3 text-center">
              <p className="text-[10px] text-text-faint uppercase mb-1">AI Replacement</p>
              <p className="font-mono text-sm font-semibold text-accent">{formatCurrency(fin.replacementCosts?.aiTools ?? 0)}/mo</p>
            </div>
          </div>
        </div>
      )}

      {/* Risk Assessment */}
      {risk && (
        <div>
          <p className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Shield className="w-3 h-3" /> Risk Assessment
          </p>
          <Badge variant={risk.overallRiskLevel === "low" ? "success" : risk.overallRiskLevel === "medium" ? "warning" : "danger"} className="mb-2">
            {risk.overallRiskLevel?.toUpperCase()} RISK
          </Badge>
          <div className="space-y-1">
            {risk.immediateRisks?.map((r: string, i: number) => (
              <p key={i} className="text-xs text-text-muted">• {r}</p>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      {analysis.recommendation && (
        <div className="border-l-4 border-accent bg-bg rounded-r-[10px] p-3">
          <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">Recommendation</p>
          <p className="text-sm text-text-secondary">{analysis.recommendation}</p>
        </div>
      )}
    </div>
  );
}

function PurchaseAnalysis({ analysis }: { analysis: any }) {
  const f = analysis.feasibilityAssessment;
  return (
    <div className="space-y-4">
      {f && (
        <>
          <div className="flex items-center gap-3">
            <Badge variant={f.canAfford ? "success" : "danger"} className="text-sm px-3 py-1">
              {f.canAfford ? "FEASIBLE" : "NOT FEASIBLE"}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-bg rounded-[10px] p-3 text-center">
              <p className="text-[10px] text-text-faint uppercase mb-1">Monthly Impact</p>
              <p className="font-mono text-sm font-semibold text-text-primary">{formatCurrency(f.monthlyBudgetImpact)}</p>
            </div>
            <div className="bg-bg rounded-[10px] p-3 text-center">
              <p className="text-[10px] text-text-faint uppercase mb-1">Months to Save</p>
              <p className="font-mono text-sm font-semibold text-text-primary">{f.monthsToSave}</p>
            </div>
            <div className="bg-bg rounded-[10px] p-3 text-center">
              <p className="text-[10px] text-text-faint uppercase mb-1">Gap</p>
              <p className="font-mono text-sm font-semibold text-danger">{formatCurrency(f.gapAmount)}</p>
            </div>
          </div>
        </>
      )}
      {analysis.tradeOffs?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-2">Trade-Offs</p>
          {analysis.tradeOffs.map((t: any, i: number) => (
            <div key={i} className="flex justify-between px-3 py-2 bg-bg rounded-[8px] mb-1.5">
              <span className="text-sm text-text-secondary">{t.action}</span>
              <span className="font-mono text-xs text-success">{formatCurrency(t.savings)}/mo</span>
            </div>
          ))}
        </div>
      )}
      {analysis.recommendation && (
        <div className="border-l-4 border-accent bg-bg rounded-r-[10px] p-3">
          <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">Recommendation</p>
          <p className="text-sm text-text-secondary">{analysis.recommendation}</p>
        </div>
      )}
    </div>
  );
}

function GenericAnalysis({ analysis }: { analysis: any }) {
  const f = analysis.feasibilityAssessment;
  const s = analysis.strategicAnalysis;
  return (
    <div className="space-y-4">
      {f && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-bg rounded-[10px] p-3 text-center">
            <p className="text-[10px] text-text-faint uppercase mb-1">Monthly Cost</p>
            <p className="font-mono text-sm font-semibold text-danger">{formatCurrency(f.estimatedMonthlyCost)}</p>
          </div>
          <div className="bg-bg rounded-[10px] p-3 text-center">
            <p className="text-[10px] text-text-faint uppercase mb-1">Monthly Revenue</p>
            <p className="font-mono text-sm font-semibold text-success">{formatCurrency(f.estimatedMonthlyRevenue)}</p>
          </div>
          <div className="bg-bg rounded-[10px] p-3 text-center">
            <p className="text-[10px] text-text-faint uppercase mb-1">Break Even</p>
            <p className="text-sm font-semibold text-text-primary">{f.breakEvenTimeline}</p>
          </div>
        </div>
      )}
      {s?.strengths?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-2">Strengths & Risks</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              {s.strengths.map((str: string, i: number) => (
                <p key={i} className="text-xs text-success">✓ {str}</p>
              ))}
            </div>
            <div className="space-y-1">
              {s.risks?.map((r: string, i: number) => (
                <p key={i} className="text-xs text-danger">⚠ {r}</p>
              ))}
            </div>
          </div>
        </div>
      )}
      {analysis.recommendation && (
        <div className="border-l-4 border-accent bg-bg rounded-r-[10px] p-3">
          <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">Recommendation</p>
          <p className="text-sm text-text-secondary">{analysis.recommendation}</p>
        </div>
      )}
    </div>
  );
}
