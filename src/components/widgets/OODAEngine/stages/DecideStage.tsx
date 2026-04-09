"use client";
import { useEffect, useState } from "react";
import { useOODAStore } from "@/lib/stores/oodaStore";
import { repository } from "@/lib/data";
import { VotingPanel } from "../VotingPanel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/formatters";
import { Star, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { OODADecision, DecisionOption, VoteChoice, FinancialSnapshot } from "@/lib/data/ooda-types";

interface DecideStageProps {
  decision: OODADecision;
  snapshot: FinancialSnapshot;
  currentUserId: string;
  onContinue: () => void;
}

export function DecideStage({ decision, snapshot, currentUserId, onContinue }: DecideStageProps) {
  const { isGeneratingOptions, setGeneratingOptions, setError } = useOODAStore();
  const [options, setOptions] = useState<DecisionOption[]>(decision.decideOptions?.options ?? []);
  const [summary, setSummary] = useState(decision.decideOptions?.summary ?? "");
  const hasOptions = options.length > 0;

  const generateOptions = async () => {
    setGeneratingOptions(true);
    setError(null);
    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "decide",
          orientAnalysis: decision.orientAnalysis,
          snapshot,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to generate options");
      }

      const data = await res.json();
      setOptions(data.analysis.options ?? []);
      setSummary(data.analysis.summary ?? "");

      await repository.updateOODADecision(decision.id, {
        decideOptions: data.analysis,
        stage: "decide",
      });

      toast.success("Options generated");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message ?? "Failed to generate options");
    } finally {
      setGeneratingOptions(false);
    }
  };

  useEffect(() => {
    if (!hasOptions && !isGeneratingOptions) {
      generateOptions();
    }
  }, []);

  const handleVote = async (vote: VoteChoice, note?: string) => {
    const updatedVotes = {
      ...decision.adminVotes,
      [currentUserId]: { vote, note, timestamp: new Date().toISOString() },
    };
    await repository.updateOODADecision(decision.id, { adminVotes: updatedVotes });
    toast.success("Vote recorded");
  };

  const hasAnyVote = Object.keys(decision.adminVotes).length > 0;

  if (isGeneratingOptions) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-text-muted">Generating decision options...</p>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div>
      {summary && <p className="text-sm text-text-secondary mb-4">{summary}</p>}

      {/* Option cards */}
      <div className="space-y-3 mb-4">
        {options.map((opt, i) => (
          <div
            key={opt.id ?? i}
            className={cn(
              "bg-surface border rounded-card p-4",
              opt.recommended ? "border-accent/40" : "border-border"
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-surface-elevated flex items-center justify-center font-mono text-xs font-bold text-text-primary">
                  {opt.id ?? String.fromCharCode(65 + i)}
                </span>
                <h4 className="text-sm font-bold text-text-primary">{opt.title}</h4>
              </div>
              {opt.recommended && (
                <Badge variant="accent" className="text-[10px]">
                  <Star className="w-2.5 h-2.5 mr-0.5" /> RECOMMENDED
                </Badge>
              )}
            </div>

            <p className="text-sm text-text-muted mb-3">{opt.description}</p>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-bg rounded-[8px] p-2 text-center">
                <p className="text-[10px] text-text-faint uppercase">Monthly</p>
                <p className={cn("font-mono text-xs font-semibold", opt.monthlySavings >= 0 ? "text-success" : "text-danger")}>
                  {opt.monthlySavings >= 0 ? "+" : ""}{formatCurrency(opt.monthlySavings)}
                </p>
              </div>
              <div className="bg-bg rounded-[8px] p-2 text-center">
                <p className="text-[10px] text-text-faint uppercase">Annual</p>
                <p className={cn("font-mono text-xs font-semibold", opt.annualImpact >= 0 ? "text-success" : "text-danger")}>
                  {opt.annualImpact >= 0 ? "+" : ""}{formatCurrency(opt.annualImpact)}
                </p>
              </div>
              <div className="bg-bg rounded-[8px] p-2 text-center">
                <p className="text-[10px] text-text-faint uppercase">Timeline</p>
                <p className="text-xs font-semibold text-text-primary flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" /> {opt.timeToImplement}
                </p>
              </div>
            </div>

            {opt.implementationSteps?.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] text-text-faint uppercase tracking-wider mb-1">Implementation</p>
                <ol className="list-decimal list-inside text-xs text-text-muted space-y-0.5">
                  {opt.implementationSteps.map((step, j) => (
                    <li key={j}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {opt.risks?.length > 0 && (
              <div className="flex items-start gap-1.5 mt-2">
                <AlertTriangle className="w-3 h-3 text-accent mt-0.5 shrink-0" />
                <p className="text-xs text-text-muted">{opt.risks.join("; ")}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Voting */}
      <VotingPanel votes={decision.adminVotes} currentUserId={currentUserId} onVote={handleVote} />

      {/* Proceed */}
      <div className="flex justify-end pt-4 mt-4 border-t border-border">
        <Button onClick={onContinue} disabled={!hasAnyVote && options.length > 0}>
          Proceed to Action →
        </Button>
      </div>
    </div>
  );
}
