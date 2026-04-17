import type {
  Employee,
  Expense,
  RevenueEntry,
  Goal,
  Business,
  PulseAlert,
  CreatePulseAlert,
} from "@/lib/data/types";
import type { OODADecision } from "@/lib/data/ooda-types";
import { calculateAvgMonthlyRevenue } from "./feasibility";
import { computeMonthlyPayroll } from "./payroll";

interface DetectionContext {
  employees: Employee[];
  expenses: Expense[];
  revenueEntries: RevenueEntry[];
  goals: Goal[];
  decisions: OODADecision[];
  businesses: Business[];
  existingAlerts: PulseAlert[];
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function isDuplicate(candidate: CreatePulseAlert, existing: PulseAlert[]): boolean {
  const now = Date.now();
  return existing.some((a) => {
    if (a.isDismissed) return false;
    if (a.type !== candidate.type) return false;
    const sameKey =
      JSON.stringify(a.data?.key ?? null) === JSON.stringify(candidate.data?.key ?? null);
    if (!sameKey) return false;
    return now - new Date(a.createdAt).getTime() < SEVEN_DAYS_MS;
  });
}

function groupRevenueByMonth(entries: RevenueEntry[]): Array<{ month: string; amount: number }> {
  const map = new Map<string, number>();
  for (const e of entries) {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, (map.get(key) ?? 0) + e.amount);
  }
  return Array.from(map.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function detectRatioBreach(ctx: DetectionContext): CreatePulseAlert[] {
  const avgRevenue = calculateAvgMonthlyRevenue(ctx.revenueEntries, 3);
  if (avgRevenue <= 0) return [];
  const payroll = computeMonthlyPayroll(ctx.employees);
  const ratio = payroll / avgRevenue;
  if (ratio <= 0.35) return [];
  return [
    {
      type: "ratio_breach",
      severity: ratio > 0.5 ? "critical" : "warning",
      title: "Payroll-to-revenue ratio high",
      message: `Payroll is ${Math.round(ratio * 100)}% of revenue (threshold 35%).`,
      data: { key: "ratio:payroll", ratio },
    },
  ];
}

function detectGoalAtRisk(ctx: DetectionContext): CreatePulseAlert[] {
  return ctx.goals
    .filter((g) => g.status === "at_risk" || g.status === "behind")
    .map((g) => ({
      type: "goal_at_risk" as const,
      severity: (g.status === "behind" ? "critical" : "warning") as "warning" | "critical",
      title: `${g.title} is ${g.status === "behind" ? "behind" : "at risk"}`,
      message: `Goal may not be achieved at current pace.`,
      data: { key: `goal_at_risk:${g.id}` },
      relatedGoalId: g.id,
    }));
}

function detectGoalPacing(ctx: DetectionContext): CreatePulseAlert[] {
  const alerts: CreatePulseAlert[] = [];
  const now = Date.now();
  for (const g of ctx.goals) {
    if (g.status === "achieved" || g.status === "abandoned") continue;
    if (!g.targetValue || !g.targetDate) continue;
    const created = new Date(g.createdAt).getTime();
    const target = new Date(g.targetDate).getTime();
    if (target <= created) continue;
    const elapsed = (now - created) / (target - created);
    const expected = g.targetValue * Math.min(1, Math.max(0, elapsed));
    const behind = expected - g.currentValue;
    if (behind > g.targetValue * 0.1) {
      alerts.push({
        type: "goal_pacing",
        severity: "warning",
        title: `${g.title} behind pace`,
        message: `$${Math.round(behind).toLocaleString()} behind expected progress.`,
        data: { key: `pacing:${g.id}` },
        relatedGoalId: g.id,
      });
    }
  }
  return alerts;
}

function detectRevenueDrop(ctx: DetectionContext): CreatePulseAlert[] {
  const history = groupRevenueByMonth(ctx.revenueEntries);
  if (history.length < 4) return [];
  const last = history[history.length - 1].amount;
  const prior3 = history.slice(-4, -1);
  const avgPrior = prior3.reduce((s, h) => s + h.amount, 0) / prior3.length;
  if (avgPrior === 0) return [];
  const drop = (avgPrior - last) / avgPrior;
  if (drop > 0.2) {
    return [
      {
        type: "revenue_drop",
        severity: drop > 0.35 ? "critical" : "warning",
        title: "Revenue dropped sharply",
        message: `Last month's revenue is ${Math.round(drop * 100)}% below the prior 3-month average.`,
        data: { key: "revenue_drop:latest", drop },
      },
    ];
  }
  return [];
}

function detectRevenueMomentum(ctx: DetectionContext): CreatePulseAlert[] {
  const history = groupRevenueByMonth(ctx.revenueEntries);
  if (history.length < 4) return [];
  const last3 = history.slice(-3);
  const growths: number[] = [];
  for (let i = 1; i < last3.length; i++) {
    const prev = last3[i - 1].amount;
    if (prev > 0) growths.push((last3[i].amount - prev) / prev);
  }
  if (growths.length === 0) return [];
  const avg = growths.reduce((a, b) => a + b, 0) / growths.length;
  if (avg > 0.1) {
    return [
      {
        type: "revenue_momentum",
        severity: "info",
        title: "Revenue momentum positive",
        message: `Revenue up ${Math.round(avg * 100)}% MoM average over the last 3 months.`,
        data: { key: "momentum:positive" },
      },
    ];
  }
  return [];
}

function detectSpendingTrend(ctx: DetectionContext): CreatePulseAlert[] {
  // Lightweight proxy: biggest-category watchlist (same as patterns.ts)
  const byCat: Record<string, number> = {};
  for (const e of ctx.expenses) {
    if (!e.isActive) continue;
    const monthly =
      e.frequency === "weekly" ? e.amount * 4.345 : e.frequency === "yearly" ? e.amount / 12 : e.amount;
    byCat[e.category] = (byCat[e.category] ?? 0) + monthly;
  }
  const total = Object.values(byCat).reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  const alerts: CreatePulseAlert[] = [];
  for (const [cat, monthly] of Object.entries(byCat)) {
    if (monthly / total > 0.3) {
      alerts.push({
        type: "spending_trend",
        severity: "info",
        title: `${cat} is dominant expense category`,
        message: `${cat} is ${Math.round((monthly / total) * 100)}% of monthly expenses.`,
        data: { key: `spending:${cat}` },
      });
    }
  }
  return alerts;
}

function detectAnomaly(ctx: DetectionContext): CreatePulseAlert[] {
  const byCat: Record<string, number[]> = {};
  for (const e of ctx.expenses) {
    if (!e.isActive) continue;
    const monthly =
      e.frequency === "weekly" ? e.amount * 4.345 : e.frequency === "yearly" ? e.amount / 12 : e.amount;
    if (!byCat[e.category]) byCat[e.category] = [];
    byCat[e.category].push(monthly);
  }
  const alerts: CreatePulseAlert[] = [];
  for (const [cat, vals] of Object.entries(byCat)) {
    if (vals.length < 2) continue;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const max = Math.max(...vals);
    if (max > avg * 2 && max > 500) {
      alerts.push({
        type: "anomaly",
        severity: "warning",
        title: `Unusual expense in ${cat}`,
        message: `A $${Math.round(max).toLocaleString()} expense is ${(max / avg).toFixed(1)}× the category average.`,
        data: { key: `anomaly:${cat}` },
      });
    }
  }
  return alerts;
}

function detectDecisionStalled(ctx: DetectionContext): CreatePulseAlert[] {
  const now = Date.now();
  const alerts: CreatePulseAlert[] = [];
  for (const d of ctx.decisions) {
    if (d.status !== "in_progress") continue;
    const updated = new Date(d.updatedAt).getTime();
    const daysSince = (now - updated) / (24 * 60 * 60 * 1000);
    if (daysSince > 7) {
      alerts.push({
        type: "decision_stalled",
        severity: "warning",
        title: `Decision stalled: ${d.title}`,
        message: `This decision has been in "${d.stage}" for ${Math.round(daysSince)} days.`,
        data: { key: `stalled:${d.id}` },
        relatedDecisionId: d.id,
      });
    }
  }
  return alerts;
}

export function runPulseDetection(ctx: DetectionContext): CreatePulseAlert[] {
  const all = [
    ...detectRatioBreach(ctx),
    ...detectGoalAtRisk(ctx),
    ...detectGoalPacing(ctx),
    ...detectRevenueDrop(ctx),
    ...detectRevenueMomentum(ctx),
    ...detectSpendingTrend(ctx),
    ...detectAnomaly(ctx),
    ...detectDecisionStalled(ctx),
  ];
  return all.filter((a) => !isDuplicate(a, ctx.existingAlerts));
}
