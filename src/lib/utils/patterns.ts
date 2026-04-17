import type {
  Expense,
  RevenueEntry,
  Goal,
  Employee,
  PatternAlert,
  CreatePatternAlert,
} from "@/lib/data/types";
import { calculateMonthlyExpenses, calculateAvgMonthlyRevenue } from "./feasibility";
import { computeMonthlyPayroll } from "./payroll";

interface PatternContext {
  expenses: Expense[];
  revenueEntries: RevenueEntry[];
  employees: Employee[];
  goals: Goal[];
  existingAlerts: PatternAlert[];
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function isDuplicate(
  candidate: CreatePatternAlert,
  existing: PatternAlert[]
): boolean {
  const now = Date.now();
  return existing.some((a) => {
    if (a.isDismissed) return false;
    if (a.type !== candidate.type) return false;
    const sameEntity =
      (a.relatedGoalId ?? null) === (candidate.relatedGoalId ?? null) &&
      JSON.stringify(a.data?.key ?? null) === JSON.stringify(candidate.data?.key ?? null);
    if (!sameEntity) return false;
    return now - new Date(a.createdAt).getTime() < SEVEN_DAYS_MS;
  });
}

function groupExpensesByCategoryWindow(
  expenses: Expense[],
  monthsBack: number,
  offset: number
): Record<string, number> {
  // expenses are recurring with frequency; we approximate windowed totals by monthly cost * months
  const map: Record<string, number> = {};
  for (const e of expenses) {
    if (!e.isActive) continue;
    const monthly =
      e.frequency === "weekly"
        ? e.amount * 4.345
        : e.frequency === "yearly"
        ? e.amount / 12
        : e.frequency === "one-time"
        ? 0
        : e.amount;
    map[e.category] = (map[e.category] ?? 0) + monthly * monthsBack;
  }
  return map;
}

function detectSpendingTrends(ctx: PatternContext): CreatePatternAlert[] {
  // Since recurring expenses don't carry historical snapshots here, we use category counts as proxy.
  // Real implementation would need a history table. For now, flag categories whose monthly total
  // is large relative to total — a lightweight "watchlist".
  const alerts: CreatePatternAlert[] = [];
  const recent = groupExpensesByCategoryWindow(ctx.expenses, 3, 0);
  const totalMonthly = Object.values(recent).reduce((a, b) => a + b, 0) / 3;
  if (totalMonthly === 0) return alerts;
  for (const [cat, total3] of Object.entries(recent)) {
    const monthly = total3 / 3;
    if (monthly / totalMonthly > 0.25) {
      alerts.push({
        type: "spending_trend",
        severity: "info",
        title: `${cat} is a major category`,
        message: `${cat} represents ${Math.round((monthly / totalMonthly) * 100)}% of monthly expenses ($${Math.round(monthly).toLocaleString()}/mo).`,
        data: { key: `category:${cat}`, category: cat, monthly },
      });
    }
  }
  return alerts;
}

function detectRevenueMomentum(ctx: PatternContext): CreatePatternAlert[] {
  const alerts: CreatePatternAlert[] = [];
  const byMonth = new Map<string, number>();
  for (const e of ctx.revenueEntries) {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + e.amount);
  }
  const sorted = Array.from(byMonth.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  if (sorted.length < 3) return alerts;
  const last3 = sorted.slice(-3);
  const growths: number[] = [];
  for (let i = 1; i < last3.length; i++) {
    const prev = last3[i - 1][1];
    if (prev > 0) growths.push((last3[i][1] - prev) / prev);
  }
  if (growths.length === 0) return alerts;
  const avg = growths.reduce((a, b) => a + b, 0) / growths.length;
  if (avg > 0.1) {
    alerts.push({
      type: "revenue_momentum",
      severity: "info",
      title: "Revenue momentum is strong",
      message: `Revenue up ${Math.round(avg * 100)}% MoM average over the last 3 months.`,
      data: { key: "momentum:positive", avgGrowth: avg },
    });
  } else if (avg < -0.15) {
    alerts.push({
      type: "revenue_momentum",
      severity: "warning",
      title: "Revenue declining",
      message: `Revenue down ${Math.round(Math.abs(avg) * 100)}% MoM average over the last 3 months.`,
      data: { key: "momentum:negative", avgGrowth: avg },
    });
  }
  return alerts;
}

function detectGoalPacing(ctx: PatternContext): CreatePatternAlert[] {
  const alerts: CreatePatternAlert[] = [];
  const now = Date.now();
  for (const goal of ctx.goals) {
    if (goal.status !== "active" && goal.status !== "at_risk" && goal.status !== "behind") continue;
    if (!goal.targetValue || !goal.targetDate) continue;
    const created = new Date(goal.createdAt).getTime();
    const target = new Date(goal.targetDate).getTime();
    if (target <= created) continue;
    const elapsed = (now - created) / (target - created);
    const expected = goal.targetValue * Math.min(1, Math.max(0, elapsed));
    const behind = expected - goal.currentValue;
    if (behind > goal.targetValue * 0.1) {
      alerts.push({
        type: "goal_pacing",
        severity: "warning",
        title: `${goal.title} is behind pace`,
        message: `$${Math.round(behind).toLocaleString()} behind expected progress for ${goal.title}.`,
        data: { key: `pacing:${goal.id}`, behind },
        relatedGoalId: goal.id,
      });
    }
  }
  return alerts;
}

function detectAnomalies(ctx: PatternContext): CreatePatternAlert[] {
  const alerts: CreatePatternAlert[] = [];
  const byCat: Record<string, number[]> = {};
  for (const e of ctx.expenses) {
    if (!e.isActive) continue;
    const monthly =
      e.frequency === "weekly" ? e.amount * 4.345 : e.frequency === "yearly" ? e.amount / 12 : e.amount;
    if (!byCat[e.category]) byCat[e.category] = [];
    byCat[e.category].push(monthly);
  }
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
        data: { key: `anomaly:${cat}`, max, avg },
      });
    }
  }
  return alerts;
}

function detectRatioBreach(ctx: PatternContext): CreatePatternAlert[] {
  const alerts: CreatePatternAlert[] = [];
  const avgRevenue = calculateAvgMonthlyRevenue(ctx.revenueEntries, 3);
  const payroll = computeMonthlyPayroll(ctx.employees);
  if (avgRevenue <= 0) return alerts;
  const ratio = payroll / avgRevenue;
  if (ratio > 0.35) {
    alerts.push({
      type: "ratio_breach",
      severity: ratio > 0.5 ? "critical" : "warning",
      title: "Payroll-to-revenue ratio high",
      message: `Payroll is ${Math.round(ratio * 100)}% of revenue (threshold 35%).`,
      data: { key: "ratio:payroll", ratio },
    });
  }
  return alerts;
}

export function detectPatterns(ctx: PatternContext): CreatePatternAlert[] {
  const all = [
    ...detectSpendingTrends(ctx),
    ...detectRevenueMomentum(ctx),
    ...detectGoalPacing(ctx),
    ...detectAnomalies(ctx),
    ...detectRatioBreach(ctx),
  ];
  return all.filter((a) => !isDuplicate(a, ctx.existingAlerts));
}
