import type { OODADecision } from "@/lib/data/ooda-types";
import { formatCurrency } from "./currency";

export function generateDecisionMarkdown(decision: OODADecision): string {
  const lines: string[] = [];

  lines.push(`# Decision Export: ${decision.title}`);
  lines.push(`**Date:** ${decision.decidedAt ?? decision.createdAt}`);
  lines.push(`**Type:** ${decision.type.replace(/_/g, " ")}`);
  lines.push(`**Status:** ${decision.status}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Observe
  lines.push("## Stage 1: Observe — Financial Snapshot");
  const snap = decision.observeData as any;
  if (snap?.consolidated) {
    lines.push(`- Total Revenue: ${formatCurrency(snap.consolidated.totalRevenue)}`);
    lines.push(`- Total Expenses: ${formatCurrency(snap.consolidated.totalExpenses)}`);
    lines.push(`- Total Payroll: ${formatCurrency(snap.consolidated.totalPayroll)}`);
    lines.push(`- Net Profit: ${formatCurrency(snap.consolidated.netProfit)}`);
    lines.push(`- Payroll Ratio: ${snap.consolidated.payrollToRevenueRatio?.toFixed(1)}%`);
  }
  lines.push("");

  // Orient
  lines.push("## Stage 2: Orient — AI Analysis");
  const orient = decision.orientAnalysis as any;
  if (orient?.recommendation) {
    lines.push(`**Recommendation:** ${orient.recommendation}`);
  }
  if (orient?.riskAssessment?.overallRiskLevel) {
    lines.push(`**Risk Level:** ${orient.riskAssessment.overallRiskLevel}`);
  }
  lines.push("");

  // Decide
  lines.push("## Stage 3: Decide — Options Evaluated");
  const opts = decision.decideOptions as any;
  if (opts?.options) {
    opts.options.forEach((opt: any) => {
      lines.push(`### Option ${opt.id}: ${opt.title}${opt.recommended ? " ⭐ RECOMMENDED" : ""}`);
      lines.push(opt.description);
      lines.push(`- Monthly Impact: ${formatCurrency(opt.monthlySavings)}`);
      lines.push(`- Annual Impact: ${formatCurrency(opt.annualImpact)}`);
      lines.push(`- Timeline: ${opt.timeToImplement}`);
      lines.push("");
    });
  }

  // Votes
  lines.push("**Votes:**");
  Object.entries(decision.adminVotes).forEach(([uid, vote]: [string, any]) => {
    lines.push(`- ${uid}: ${vote.vote}${vote.note ? ` — "${vote.note}"` : ""}`);
  });
  lines.push("");

  // Act
  lines.push("## Stage 4: Act — Decision Made");
  const act = decision.actOutcome as any;
  if (act?.outcomeNotes) {
    lines.push(`**Outcome Notes:** ${act.outcomeNotes}`);
  }
  lines.push("");
  lines.push("---");
  lines.push("*Exported from Executive Decision Intelligence Dashboard*");

  return lines.join("\n");
}

export function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
