import type {
  Goal,
  FeasibilityResult,
  FeasibilityBreakdown,
  GoalStatus,
  PersonalDraw,
  RevenueEntry,
  Expense,
  Employee,
  GoalMilestone,
} from "@/lib/data/types";
import { computeMonthlyPayroll } from "./payroll";
import { calculateTotalRevenue, calculateTotalExpenses } from "./calculations";

export interface FeasibilityContext {
  revenueEntries: RevenueEntry[];
  expenses: Expense[];
  employees: Employee[];
  personalDraw: PersonalDraw;
  milestones?: GoalMilestone[];
}

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.4375;

export function monthsBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / MS_PER_MONTH;
}

export function calculateAvgMonthlyRevenue(entries: RevenueEntry[], monthsBack = 3): number {
  if (entries.length === 0) return 0;
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const recent = entries.filter((e) => new Date(e.date) >= cutoff);
  if (recent.length === 0) return 0;
  const total = recent.reduce((sum, e) => sum + e.amount, 0);
  return total / monthsBack;
}

export function calculateMonthlyExpenses(expenses: Expense[]): number {
  return expenses
    .filter((e) => e.isActive)
    .reduce((sum, e) => {
      const multiplier =
        e.frequency === "weekly"
          ? 4.345
          : e.frequency === "yearly"
          ? 1 / 12
          : e.frequency === "one-time"
          ? 0
          : 1;
      return sum + e.amount * multiplier;
    }, 0);
}

function personalDrawTotal(draw: PersonalDraw): number {
  return (draw?.his ?? 0) + (draw?.hers ?? 0);
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

export function projectRevenueTrend(
  history: Array<{ month: string; amount: number }>,
  monthsForward: number
): number {
  if (history.length === 0) return 0;
  if (history.length === 1) return history[0].amount;
  // Simple linear regression (least squares)
  const n = history.length;
  const xs = history.map((_, i) => i);
  const ys = history.map((h) => h.amount);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (ys[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  return intercept + slope * (n - 1 + monthsForward);
}

function confidenceFromHistory(history: Array<{ month: string; amount: number }>): FeasibilityResult["confidence"] {
  if (history.length < 3) return "low";
  const amounts = history.map((h) => h.amount);
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  if (mean === 0) return "low";
  const variance = amounts.reduce((sum, a) => sum + (a - mean) ** 2, 0) / amounts.length;
  const cv = Math.sqrt(variance) / mean;
  if (cv < 0.15) return "high";
  if (cv < 0.35) return "medium";
  return "low";
}

function monthsToISODate(monthsFromNow: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + Math.ceil(monthsFromNow));
  return d.toISOString().slice(0, 10);
}

export function calculateFeasibility(goal: Goal, ctx: FeasibilityContext): FeasibilityResult {
  const now = new Date();
  const history = groupRevenueByMonth(ctx.revenueEntries);
  // Align with Financial Command Center: current-month revenue with all-time fallback,
  // USD-normalized expenses, shared payroll helper.
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthRevenue = calculateTotalRevenue(ctx.revenueEntries, thisMonth);
  const avgRevenue = currentMonthRevenue > 0 ? currentMonthRevenue : calculateTotalRevenue(ctx.revenueEntries);
  const totalExpenses = calculateTotalExpenses(ctx.expenses);
  const totalPayroll = computeMonthlyPayroll(ctx.employees);
  const personalDraw = personalDrawTotal(ctx.personalDraw);
  const availableSurplus = avgRevenue - totalExpenses - totalPayroll - personalDraw;

  const breakdown: FeasibilityBreakdown = {
    totalRevenue: avgRevenue,
    totalExpenses,
    totalPayroll,
    personalDraw,
    availableSurplus,
  };

  const confidence = confidenceFromHistory(history);
  const target = goal.targetValue ?? 0;
  const current = goal.currentValue ?? 0;
  const remaining = Math.max(0, target - current);

  const targetDate = goal.targetDate ? new Date(goal.targetDate) : null;
  const monthsRemaining = targetDate ? Math.max(0, monthsBetween(now, targetDate)) : Infinity;

  // OPERATIONAL (milestone-based) -------------------------------------------
  if (goal.type === "operational") {
    const milestones = ctx.milestones ?? [];
    const total = milestones.length;
    const completed = milestones.filter((m) => m.isCompleted).length;
    const completionRate = total > 0 ? completed / total : 0;
    const createdAt = new Date(goal.createdAt);
    const totalSpan = targetDate ? monthsBetween(createdAt, targetDate) : 12;
    const elapsed = monthsBetween(createdAt, now);
    const expectedRate = totalSpan > 0 ? Math.min(1, Math.max(0, elapsed / totalSpan)) : 0;
    const isAchievable = completionRate >= expectedRate - 0.1;
    return {
      isAchievable,
      monthlyTarget: 0,
      currentMonthlySurplus: availableSurplus,
      gap: 0,
      monthsNeeded: total - completed,
      monthsRemaining: monthsRemaining === Infinity ? 0 : monthsRemaining,
      projectedAchieveDate: targetDate ? targetDate.toISOString().slice(0, 10) : null,
      confidence,
      breakdown,
      calculatedAt: new Date().toISOString(),
      note: total === 0 ? "Add milestones to track progress" : undefined,
    };
  }

  // REVENUE goal (company type) ---------------------------------------------
  if (goal.type === "company" && goal.metadata?.revenueTarget) {
    const revTarget = goal.metadata.revenueTarget;
    const projected = projectRevenueTrend(history, Math.max(1, Math.ceil(monthsRemaining)));
    const isAchievable = projected >= revTarget;
    const gap = projected - revTarget;
    return {
      isAchievable,
      monthlyTarget: revTarget,
      currentMonthlySurplus: avgRevenue,
      gap,
      monthsNeeded: 0,
      monthsRemaining: monthsRemaining === Infinity ? 0 : monthsRemaining,
      projectedAchieveDate: targetDate ? targetDate.toISOString().slice(0, 10) : null,
      confidence,
      breakdown,
      calculatedAt: new Date().toISOString(),
    };
  }

  // PERSONAL / PURCHASE / SAVINGS -------------------------------------------
  const monthsRem = monthsRemaining === Infinity ? 12 : monthsRemaining;
  const monthlyTarget = monthsRem > 0 ? remaining / monthsRem : remaining;
  const gap = availableSurplus - monthlyTarget;
  const monthsNeeded = availableSurplus > 0 ? remaining / availableSurplus : Infinity;
  const isAchievable = monthsNeeded <= monthsRem && availableSurplus > 0;
  const projectedAchieveDate =
    availableSurplus > 0 && Number.isFinite(monthsNeeded) ? monthsToISODate(monthsNeeded) : null;

  return {
    isAchievable,
    monthlyTarget,
    currentMonthlySurplus: availableSurplus,
    gap,
    monthsNeeded: Number.isFinite(monthsNeeded) ? monthsNeeded : 0,
    monthsRemaining: monthsRem,
    projectedAchieveDate,
    confidence,
    breakdown,
    calculatedAt: new Date().toISOString(),
    note: history.length < 3 ? "Less than 3 months of revenue history — confidence is low" : undefined,
  };
}

export function determineGoalStatus(goal: Goal, feasibility: FeasibilityResult): GoalStatus {
  if (goal.status === "abandoned") return "abandoned";
  const target = goal.targetValue ?? 0;
  if (target > 0 && goal.currentValue >= target) return "achieved";
  if (goal.type === "operational") {
    return feasibility.isAchievable ? "active" : "at_risk";
  }
  if (!feasibility.isAchievable) {
    if (feasibility.gap < -feasibility.monthlyTarget * 0.5) return "behind";
    return "at_risk";
  }
  return "active";
}
