import type { OODADecision } from "@/lib/data/ooda-types";
import { formatCurrency } from "./currency";
import jsPDF from "jspdf";

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

export function generateDecisionPDF(decision: OODADecision): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPage = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = margin;
    }
  };

  const heading = (text: string, size: number) => {
    checkPage(12);
    doc.setFontSize(size);
    doc.setFont("helvetica", "bold");
    doc.text(text, margin, y);
    y += size * 0.5 + 2;
  };

  const label = (lbl: string, val: string) => {
    checkPage(8);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(lbl, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(val, margin + doc.getTextWidth(lbl) + 2, y);
    y += 5;
  };

  const body = (text: string) => {
    checkPage(8);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 4.5;
  };

  const divider = () => {
    checkPage(8);
    y += 2;
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  };

  const mono = (text: string) => {
    checkPage(6);
    doc.setFontSize(10);
    doc.setFont("courier", "normal");
    doc.text(text, margin + 4, y);
    doc.setFont("helvetica", "normal");
    y += 5;
  };

  // Header
  heading(`Decision Export: ${decision.title}`, 16);
  y += 2;
  label("Date: ", decision.decidedAt ?? decision.createdAt);
  label("Type: ", decision.type.replace(/_/g, " "));
  label("Status: ", decision.status);
  if (decision.decidedBy) label("Decided by: ", decision.decidedBy);
  divider();

  // Stage 1: Observe
  heading("Stage 1: Observe — Financial Snapshot", 13);
  const snap = decision.observeData as any;
  if (snap?.consolidated) {
    mono(`Revenue:       ${formatCurrency(snap.consolidated.totalRevenue)}`);
    mono(`Expenses:      ${formatCurrency(snap.consolidated.totalExpenses)}`);
    mono(`Payroll:       ${formatCurrency(snap.consolidated.totalPayroll)}`);
    mono(`Net Profit:    ${formatCurrency(snap.consolidated.netProfit)}`);
    mono(`Payroll Ratio: ${snap.consolidated.payrollToRevenueRatio?.toFixed(1)}%`);
  }
  divider();

  // Stage 2: Orient
  heading("Stage 2: Orient — AI Analysis", 13);
  const orient = decision.orientAnalysis as any;
  if (orient?.recommendation) {
    label("Recommendation: ", "");
    body(orient.recommendation);
  }
  if (orient?.riskAssessment?.overallRiskLevel) {
    label("Risk Level: ", orient.riskAssessment.overallRiskLevel);
  }
  if (orient?.automationAssessment?.totalAutomationCost !== undefined) {
    mono(`Automation cost: ${formatCurrency(orient.automationAssessment.totalAutomationCost)}/mo`);
    mono(`Savings vs salary: ${formatCurrency(orient.automationAssessment.automationSavingsVsSalary)}/mo`);
  }
  divider();

  // Stage 3: Decide
  heading("Stage 3: Decide — Options Evaluated", 13);
  const opts = decision.decideOptions as any;
  if (opts?.options) {
    for (const opt of opts.options) {
      checkPage(25);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`Option ${opt.id}: ${opt.title}${opt.recommended ? " ★ RECOMMENDED" : ""}`, margin, y);
      y += 5;
      body(opt.description);
      mono(`Monthly: ${formatCurrency(opt.monthlySavings)}  |  Annual: ${formatCurrency(opt.annualImpact)}  |  Timeline: ${opt.timeToImplement}`);
      if (opt.implementationSteps?.length) {
        for (const step of opt.implementationSteps) {
          body(`  • ${step}`);
        }
      }
      y += 2;
    }
  }

  if (Object.keys(decision.adminVotes).length > 0) {
    y += 2;
    label("Votes:", "");
    for (const [uid, vote] of Object.entries(decision.adminVotes) as [string, any][]) {
      body(`  ${uid}: ${vote.vote}${vote.note ? ` — "${vote.note}"` : ""}`);
    }
  }
  divider();

  // Stage 4: Act
  heading("Stage 4: Act — Decision Made", 13);
  const act = decision.actOutcome as any;
  if (act?.chosenOption) {
    label("Chosen: ", act.chosenOption);
  }
  if (act?.outcomeNotes) {
    body(act.outcomeNotes);
  }
  if (act?.implementationSteps?.length) {
    label("Implementation:", "");
    for (const step of act.implementationSteps) {
      body(`  • ${step}`);
    }
  }

  // Footer
  divider();
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    `Exported from Executive Decision Intelligence Dashboard — ${new Date().toLocaleString()}`,
    margin,
    doc.internal.pageSize.getHeight() - 10
  );

  const safeName = decision.title.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 40);
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Decision-Export-${safeName}-${dateStr}.pdf`);
}
