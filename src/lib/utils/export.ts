import type { OODADecision, DecisionLogEntry } from "@/lib/data/ooda-types";
import { formatCurrency } from "./currency";
import jsPDF from "jspdf";

/* ------------------------------------------------------------------ *
 * PDF report internals
 *
 * Diagrams are drawn with jsPDF's native vector primitives rather than
 * rasterised from the DOM: no extra dependency, crisp at any zoom, and
 * a fraction of the file size. The palette is deliberately print-first
 * (white ground) rather than the dashboard's dark theme.
 * ------------------------------------------------------------------ */

type RGB = [number, number, number];

const INK: RGB = [40, 40, 40];
const MUTED: RGB = [120, 120, 120];
const FAINT: RGB = [200, 200, 200];
const ACCENT: RGB = [245, 158, 11]; // amber — matches the dashboard accent
const SUCCESS: RGB = [34, 197, 94];

interface Layout {
  margin: number;
  contentWidth: number;
  pageWidth: number;
  pageHeight: number;
}

const STAGES = ["Observe", "Orient", "Decide", "Act"] as const;
const STAGE_INDEX: Record<string, number> = {
  observe: 0,
  orient: 1,
  decide: 2,
  act: 3,
  completed: 4,
};

/** "2h 41m", "1d 3h", "12m" — omits noise below the leading unit. */
export function formatElapsed(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "";
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "under a minute";
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const minutes = mins % 60;
  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  return `${minutes}m`;
}

export interface TimelineEvent {
  at: string;
  label: string;
  note?: string;
}

const LOG_ACTION_LABELS: Record<string, string> = {
  finalized: "Decision finalized",
  cancelled: "Decision withdrawn",
};

/**
 * The decision_log table only records a couple of actions, so a timeline built
 * from it alone would be nearly empty. Merge it with the timestamps carried on
 * the decision itself, de-duplicating events that land at the same instant.
 */
export function buildTimelineEvents(
  decision: OODADecision,
  log: DecisionLogEntry[]
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  if (decision.createdAt) {
    events.push({ at: decision.createdAt, label: "Decision created" });
  }

  for (const entry of log) {
    events.push({
      at: entry.createdAt,
      label: LOG_ACTION_LABELS[entry.action] ?? entry.action.replace(/_/g, " "),
      note: entry.outcomeNotes ?? undefined,
    });
  }

  if (decision.decidedAt) {
    events.push({ at: decision.decidedAt, label: "Decision recorded" });
  }

  // De-duplicate by instant, not by label: a log entry and the decision's own
  // decidedAt describe the same moment, and printing both reads as a glitch.
  // Log entries are pushed first, so their richer label wins.
  const seen = new Set<number>();
  return events
    .filter((e) => {
      const t = new Date(e.at).getTime();
      if (!Number.isFinite(t) || seen.has(t)) return false;
      seen.add(t);
      return true;
    })
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

/**
 * These stage payloads are `Record<string, any>` filled by the model, so a
 * field that is a string in one decision can be an object in the next
 * (`actOutcome.chosenOption` is both, in practice). jsPDF throws on anything
 * that isn't a string, which would fail the whole report — so coerce at the
 * boundary instead of trusting the shape.
 */
export function asText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(", ");
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    // Option-shaped objects read best as "A — Title".
    const title = typeof o.title === "string" ? o.title : undefined;
    const id = typeof o.id === "string" || typeof o.id === "number" ? String(o.id) : undefined;
    if (title) return id ? `${id} - ${title}` : title;
    if (typeof o.name === "string") return o.name;
    if (typeof o.label === "string") return o.label;
    return "";
  }
  return "";
}

/** Header date: "15 August 2026, 3:32 PM". Falls back to the raw value. */
function fmtDateLong(iso: string): string {
  const d = new Date(iso);
  return Number.isFinite(d.getTime())
    ? d.toLocaleString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : iso;
}

function fmtStamp(iso: string): string {
  const d = new Date(iso);
  return Number.isFinite(d.getTime())
    ? d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : iso;
}

export function generateDecisionMarkdown(
  decision: OODADecision,
  log: DecisionLogEntry[] = []
): string {
  const lines: string[] = [];
  const NOT_RECORDED = "_Not yet recorded._";

  // Same coercion as the PDF: any of these model-authored fields can arrive as
  // an object, which would otherwise stringify to "[object Object]".
  const money = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) ? formatCurrency(v) : "n/a";

  lines.push(`# Decision Export: ${asText(decision.title).trim()}`);
  lines.push("");
  lines.push(`**Date:** ${fmtDateLong(decision.decidedAt ?? decision.createdAt)}`);
  lines.push(`**Type:** ${asText(decision.type).replace(/_/g, " ")}`);
  lines.push(`**Status:** ${asText(decision.status).replace(/_/g, " ")}`);
  if (decision.decidedBy) lines.push(`**Decided by:** ${asText(decision.decidedBy)}`);

  const activeStage = STAGE_INDEX[decision.stage] ?? 0;
  lines.push(
    `**Progress:** ${STAGES.map((s, i) => `${s} ${i < activeStage ? "[x]" : "[ ]"}`).join(" -> ")}`
  );
  lines.push("");
  lines.push("---");
  lines.push("");

  // Observe
  lines.push("## Stage 1: Observe — Financial Snapshot");
  lines.push("");
  const snap = decision.observeData as any;
  if (snap?.consolidated) {
    const c = snap.consolidated;
    lines.push(`- Total Revenue: ${money(c.totalRevenue)}`);
    lines.push(`- Total Expenses: ${money(c.totalExpenses)}`);
    lines.push(`- Total Payroll: ${money(c.totalPayroll)}`);
    lines.push(`- Net Profit: ${money(c.netProfit)}`);
    if (typeof c.payrollToRevenueRatio === "number") {
      lines.push(`- Payroll Ratio: ${c.payrollToRevenueRatio.toFixed(1)}%`);
    }
  } else {
    lines.push(NOT_RECORDED);
  }
  lines.push("");

  // Orient
  lines.push("## Stage 2: Orient — AI Analysis");
  lines.push("");
  const orient = decision.orientAnalysis as any;
  const orientRec = asText(orient?.recommendation);
  const orientRisk = asText(orient?.riskAssessment?.overallRiskLevel);
  const autoCost = orient?.automationAssessment?.totalAutomationCost;
  if (orientRec) {
    lines.push(`**Recommendation:** ${orientRec}`);
    lines.push("");
  }
  if (orientRisk) lines.push(`**Risk Level:** ${orientRisk}`);
  if (typeof autoCost === "number") {
    lines.push(`- Automation cost: ${money(autoCost)}/mo`);
    lines.push(
      `- Savings vs salary: ${money(orient?.automationAssessment?.automationSavingsVsSalary)}/mo`
    );
  }
  if (!orientRec && !orientRisk && typeof autoCost !== "number") lines.push(NOT_RECORDED);
  lines.push("");

  // Decide
  lines.push("## Stage 3: Decide — Options Evaluated");
  lines.push("");
  const opts = decision.decideOptions as any;
  const options: any[] = Array.isArray(opts?.options) ? opts.options : [];
  if (options.length === 0) {
    lines.push(NOT_RECORDED);
    lines.push("");
  } else {
    for (const opt of options) {
      const title = asText(opt?.title) || `Option ${asText(opt?.id)}`;
      lines.push(`### Option ${asText(opt?.id)}: ${title}${opt?.recommended ? "  **[RECOMMENDED]**" : ""}`);
      const desc = asText(opt?.description);
      if (desc) {
        lines.push("");
        lines.push(desc);
      }
      lines.push("");
      lines.push(`- Monthly Impact: ${money(opt?.monthlySavings)}`);
      lines.push(`- Annual Impact: ${money(opt?.annualImpact)}`);
      lines.push(`- Timeline: ${asText(opt?.timeToImplement) || "n/a"}`);
      if (Array.isArray(opt?.implementationSteps) && opt.implementationSteps.length > 0) {
        lines.push("- Implementation:");
        for (const step of opt.implementationSteps) {
          const s = asText(step);
          if (s) lines.push(`  - ${s}`);
        }
      }
      lines.push("");
    }
  }

  // Votes — only when there are any, rather than a dangling header.
  const votes = Object.entries(decision.adminVotes ?? {}) as [string, any][];
  if (votes.length > 0) {
    lines.push("**Votes:**");
    for (const [uid, vote] of votes) {
      const note = asText(vote?.note);
      lines.push(`- ${uid}: ${asText(vote?.vote)}${note ? ` — "${note}"` : ""}`);
    }
    lines.push("");
  }

  // Act
  lines.push("## Stage 4: Act — Decision Made");
  lines.push("");
  const act = decision.actOutcome as any;
  const chosen = asText(act?.chosenOption);
  const notes = asText(act?.outcomeNotes);
  const actSteps: any[] = Array.isArray(act?.implementationSteps) ? act.implementationSteps : [];
  if (chosen) lines.push(`**Chosen:** ${chosen}`);
  if (notes) {
    lines.push("");
    lines.push(`**Outcome Notes:** ${notes}`);
  }
  if (actSteps.length > 0) {
    lines.push("");
    lines.push("**Implementation:**");
    for (const step of actSteps) {
      const s = asText(step);
      if (s) lines.push(`- ${s}`);
    }
  }
  if (!chosen && !notes && actSteps.length === 0) lines.push(NOT_RECORDED);
  lines.push("");

  // Timeline — mirrors the PDF's audit trail.
  const timeline = buildTimelineEvents(decision, log);
  if (timeline.length > 0) {
    lines.push("## Decision Timeline");
    lines.push("");
    timeline.forEach((ev, i) => {
      lines.push(`- **${fmtStamp(ev.at)}** — ${ev.label}`);
      if (ev.note) lines.push(`  - ${ev.note}`);
      const next = timeline[i + 1];
      if (next) {
        const gap = formatElapsed(new Date(next.at).getTime() - new Date(ev.at).getTime());
        if (gap) lines.push(`  - _(+${gap})_`);
      }
    });
    lines.push("");
  }

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

/**
 * Four-node progress ribbon mirroring the on-screen stage dots.
 * Fixed height — the caller must page-break before drawing.
 * Returns the y position below the ribbon.
 */
function drawStageRibbon(doc: jsPDF, L: Layout, decision: OODADecision, y: number): number {
  const active = STAGE_INDEX[decision.stage] ?? 0;
  const cancelled = decision.status === "cancelled";
  const radius = 3;
  const span = L.contentWidth - radius * 2;
  const step = span / (STAGES.length - 1);
  const cy = y + radius + 2;

  // Connectors first so the nodes paint over the joins.
  doc.setLineWidth(0.8);
  for (let i = 0; i < STAGES.length - 1; i++) {
    const done = i < active;
    doc.setDrawColor(...(done && !cancelled ? SUCCESS : FAINT));
    const x1 = L.margin + radius + i * step;
    doc.line(x1 + radius + 1, cy, x1 + step - radius - 1, cy);
  }

  STAGES.forEach((name, i) => {
    const cx = L.margin + radius + i * step;
    const done = i < active;
    const current = i === active && decision.stage !== "completed";

    if (cancelled) {
      doc.setFillColor(...FAINT);
      doc.setDrawColor(...FAINT);
      doc.circle(cx, cy, radius, "FD");
    } else if (done) {
      doc.setFillColor(...SUCCESS);
      doc.setDrawColor(...SUCCESS);
      doc.circle(cx, cy, radius, "FD");
    } else if (current) {
      doc.setFillColor(...ACCENT);
      doc.setDrawColor(...ACCENT);
      doc.circle(cx, cy, radius, "FD");
    } else {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...FAINT);
      doc.circle(cx, cy, radius, "FD");
    }

    doc.setFontSize(8);
    doc.setFont("helvetica", done || current ? "bold" : "normal");
    doc.setTextColor(...(done || current ? INK : MUTED));
    doc.text(name, cx, cy + radius + 5, { align: "center" });
  });

  doc.setTextColor(...INK);
  doc.setLineWidth(0.2);
  return cy + radius + 10;
}

/**
 * Horizontal impact bars, one per option, scaled to the largest magnitude.
 * Height grows with option count — page-break before calling.
 */
function drawOptionsChart(doc: jsPDF, L: Layout, options: any[], y: number): number {
  const usable = options.filter(
    (o) => typeof o?.monthlySavings === "number" && Number.isFinite(o.monthlySavings)
  );
  if (usable.length === 0) return y;

  const max = Math.max(...usable.map((o) => Math.abs(o.monthlySavings)));
  if (max === 0) return y;

  const labelW = 34;
  const valueW = 30;
  const trackW = L.contentWidth - labelW - valueW;
  const barH = 4;
  const rowH = 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...INK);
  doc.text("Monthly impact by option", L.margin, y);
  y += 5;

  for (const opt of usable) {
    const chosen = Boolean(opt.recommended);
    const w = Math.max(1, (Math.abs(opt.monthlySavings) / max) * trackW);

    doc.setFontSize(8);
    doc.setFont("helvetica", chosen ? "bold" : "normal");
    doc.setTextColor(...INK);
    const raw = asText(opt.title) || `Option ${asText(opt.id)}`;
    const name = raw.length > 22 ? `${raw.slice(0, 21).trimEnd()}...` : raw;
    doc.text(chosen ? `${name} *` : name, L.margin, y + barH - 0.5);

    // Track, then filled bar.
    doc.setFillColor(238, 238, 238);
    doc.roundedRect(L.margin + labelW, y, trackW, barH, 1, 1, "F");
    doc.setFillColor(...(chosen ? ACCENT : MUTED));
    doc.roundedRect(L.margin + labelW, y, w, barH, 1, 1, "F");

    doc.setFont("courier", chosen ? "bold" : "normal");
    doc.setTextColor(...INK);
    doc.text(formatCurrency(opt.monthlySavings), L.margin + L.contentWidth, y + barH - 0.5, {
      align: "right",
    });

    y += rowH;
  }

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.setFontSize(7);
  doc.text("* selected option", L.margin + labelW, y + 1);
  doc.setTextColor(...INK);
  return y + 5;
}

/** Vertical timeline with elapsed gaps between consecutive events. */
function drawTimeline(
  doc: jsPDF,
  L: Layout,
  events: TimelineEvent[],
  y: number,
  /** Returns `cursor`, or the top of a fresh page if `needed` won't fit. */
  ensureSpace: (cursor: number, needed: number) => number
): number {
  const railX = L.margin + 3;
  const textX = railX + 7;

  events.forEach((ev, i) => {
    y = ensureSpace(y, 16);

    doc.setFillColor(...ACCENT);
    doc.setDrawColor(...ACCENT);
    doc.circle(railX, y - 1.2, 1.4, "FD");

    doc.setFontSize(8);
    doc.setFont("courier", "normal");
    doc.setTextColor(...MUTED);
    doc.text(fmtStamp(ev.at), textX, y);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...INK);
    doc.text(ev.label, textX + 32, y);
    y += 4.5;

    if (ev.note) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      const lines = doc.splitTextToSize(ev.note, L.contentWidth - (textX - L.margin));
      doc.text(lines, textX, y);
      y += lines.length * 3.8;
      doc.setTextColor(...INK);
    }

    const next = events[i + 1];
    if (next) {
      const gap = new Date(next.at).getTime() - new Date(ev.at).getTime();
      const elapsed = formatElapsed(gap);
      doc.setDrawColor(...FAINT);
      doc.setLineWidth(0.4);
      doc.line(railX, y - 2, railX, y + 3.5);
      doc.setLineWidth(0.2);
      if (elapsed) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7);
        doc.setTextColor(...MUTED);
        doc.text(elapsed, textX, y + 2);
        doc.setTextColor(...INK);
      }
      y += 6;
    }
  });

  doc.setFont("helvetica", "normal");
  return y;
}

/**
 * Renders and downloads the decision report. Returns the underlying jsPDF
 * document so the render can be exercised without a browser (callers in the
 * app can ignore it — the download already happened).
 */
export function generateDecisionPDF(
  decision: OODADecision,
  log: DecisionLogEntry[] = []
): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const L: Layout = {
    margin,
    contentWidth,
    pageWidth,
    pageHeight: doc.internal.pageSize.getHeight(),
  };

  // Returns the (possibly reset) cursor so callers that track their own y can
  // stay in sync after a page break.
  const checkPage = (needed: number): number => {
    if (y + needed > L.pageHeight - 20) {
      doc.addPage();
      y = margin;
    }
    return y;
  };

  // Page-break helper for sections that track their own cursor. Unlike
  // checkPage it does not read or write the shared `y`.
  const ensureSpace = (cursor: number, needed: number): number =>
    cursor + needed > L.pageHeight - 20 ? (doc.addPage(), margin) : cursor;

  const heading = (text: string, size: number) => {
    checkPage(12);
    doc.setFontSize(size);
    doc.setFont("helvetica", "bold");
    doc.text(text, margin, y);
    y += size * 0.5 + 2;
  };

  const label = (lbl: string, val: unknown) => {
    checkPage(8);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(lbl, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(asText(val), margin + doc.getTextWidth(lbl) + 2, y);
    y += 5;
  };

  const body = (text: unknown) => {
    const str = asText(text);
    if (!str) return;
    checkPage(8);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(str, contentWidth);
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

  // Stages that haven't happened yet would otherwise render as a bare heading,
  // which reads as a rendering failure rather than "not reached yet".
  const notRecorded = () => {
    checkPage(8);
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150);
    doc.text("Not yet recorded.", margin, y);
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    y += 5;
  };

  const mono = (text: unknown) => {
    checkPage(6);
    doc.setFontSize(10);
    doc.setFont("courier", "normal");
    doc.text(asText(text), margin + 4, y);
    doc.setFont("helvetica", "normal");
    y += 5;
  };

  // Header
  heading(`Decision Export: ${decision.title}`, 16);
  y += 2;
  label("Date: ", fmtDateLong(decision.decidedAt ?? decision.createdAt));
  label("Type: ", decision.type.replace(/_/g, " "));
  label("Status: ", decision.status.replace(/_/g, " "));
  if (decision.decidedBy) label("Decided by: ", decision.decidedBy);
  y += 2;

  // Progress ribbon — fixed-height block, so break first.
  checkPage(20);
  y = drawStageRibbon(doc, L, decision, y);
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
  } else {
    notRecorded();
  }
  divider();

  // Stage 2: Orient
  heading("Stage 2: Orient — AI Analysis", 13);
  const orient = decision.orientAnalysis as any;
  if (
    !orient?.recommendation &&
    !orient?.riskAssessment?.overallRiskLevel &&
    orient?.automationAssessment?.totalAutomationCost === undefined
  ) {
    notRecorded();
  }
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
  if (!opts?.options?.length) {
    notRecorded();
  }
  if (opts?.options) {
    for (const opt of opts.options) {
      checkPage(25);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      // ASCII only: jsPDF's built-in Helvetica is WinAnsi-encoded, and a glyph
      // outside it (e.g. a star) corrupts spacing for the whole run.
      doc.text(
        `Option ${asText(opt.id)}: ${asText(opt.title)}${opt.recommended ? "  [RECOMMENDED]" : ""}`,
        margin,
        y
      );
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

    // Impact comparison — height scales with option count, so break first.
    const chartH = 14 + opts.options.length * 8;
    checkPage(chartH);
    y += 2;
    y = drawOptionsChart(doc, L, opts.options, y);
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
  if (!act?.chosenOption && !act?.outcomeNotes && !act?.implementationSteps?.length) {
    notRecorded();
  }
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

  // Decision timeline — audit trail. Skipped entirely when there is nothing
  // to show rather than printing an empty heading.
  const timeline = buildTimelineEvents(decision, log);
  if (timeline.length > 0) {
    divider();
    heading("Decision Timeline", 13);
    y += 1;
    y = drawTimeline(doc, L, timeline, y, ensureSpace);
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
  return doc;
}
