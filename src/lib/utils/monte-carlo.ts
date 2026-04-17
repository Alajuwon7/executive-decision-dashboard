import type {
  MonteCarloResults,
  Scenario,
  Goal,
  Business,
  Expense,
  Employee,
  RevenueEntry,
  PersonalDraw,
  ScenarioModification,
} from "@/lib/data/types";
import { calculateProjectedOutcome } from "./scenario-engine";

interface MonteCarloInput {
  scenario: Scenario;
  goals: Goal[];
  businesses: Business[];
  employees: Employee[];
  expenses: Expense[];
  revenueEntries: RevenueEntry[];
  personalDraw: PersonalDraw;
  simulations?: number;
  monthsForward?: number;
}

function randBetween(low: number, high: number): number {
  return low + Math.random() * (high - low);
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

function dateFromMonths(monthsFromNow: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + Math.ceil(monthsFromNow));
  return d.toISOString().slice(0, 10);
}

export function runMonteCarloSimulation(input: MonteCarloInput): MonteCarloResults {
  const {
    scenario,
    goals,
    businesses,
    employees,
    expenses,
    revenueEntries,
    personalDraw,
    simulations = 1000,
    monthsForward = 12,
  } = input;

  const relevantGoals = goals.filter(
    (g) =>
      g.status !== "achieved" &&
      g.status !== "abandoned" &&
      g.type !== "operational" &&
      g.targetValue &&
      g.targetDate
  );

  const goalAchievedCounts: Record<string, number> = {};
  const goalAchieveMonths: Record<string, number[]> = {};
  const finalSurpluses: number[] = [];

  for (const g of relevantGoals) {
    goalAchievedCounts[g.id] = 0;
    goalAchieveMonths[g.id] = [];
  }

  // Pre-compute deterministic baseline outcome (will be repeated per sim with varying revenue)
  // We'll emulate revenue variance by generating a random monthly revenue per business
  // and replacing the baseline avgRevenue in the outcome calc.

  const baseRevenueMean =
    businesses.reduce((s, b) => s + (b.revenueLow + b.revenueHigh) / 2, 0);
  const baseRevenueStd = Math.sqrt(
    businesses.reduce((s, b) => {
      const range = b.revenueHigh - b.revenueLow;
      return s + (range * range) / 12;
    }, 0)
  );

  for (let sim = 0; sim < simulations; sim++) {
    // Sample monthly revenue for the projection window
    let accumulatedSurplus = 0;
    const goalProgress: Record<string, number> = {};
    for (const g of relevantGoals) goalProgress[g.id] = g.currentValue;

    for (let month = 0; month < monthsForward; month++) {
      const sampledRevenue = businesses.reduce(
        (sum, b) => sum + randBetween(b.revenueLow, b.revenueHigh),
        0
      );

      // Build a synthetic revenue entry list for this month to feed into scenario engine
      const syntheticRevenue: RevenueEntry[] = businesses.map((b) => ({
        id: `mc-${sim}-${month}-${b.id}`,
        businessId: b.id,
        amount: randBetween(b.revenueLow, b.revenueHigh),
        currency: b.currency,
        source: "monte-carlo",
        description: "",
        date: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
      }));
      // use the sampled total revenue directly so avg-based math matches
      const outcome = calculateProjectedOutcome(
        {
          businesses,
          employees,
          expenses,
          revenueEntries: syntheticRevenue,
          goals: [],
          personalDraw,
        },
        scenario.modifications as ScenarioModification[]
      );
      const monthSurplus = outcome.monthlySurplus;
      accumulatedSurplus += monthSurplus;

      // Accumulate toward each goal
      for (const g of relevantGoals) {
        if (goalProgress[g.id] < (g.targetValue ?? 0) && monthSurplus > 0) {
          goalProgress[g.id] += monthSurplus;
          if (goalProgress[g.id] >= (g.targetValue ?? 0) && goalAchieveMonths[g.id].every((m) => m !== month + 1)) {
            goalAchieveMonths[g.id].push(month + 1);
            goalAchievedCounts[g.id]++;
          }
        }
      }
    }

    finalSurpluses.push(accumulatedSurplus / monthsForward);
  }

  const sortedSurpluses = [...finalSurpluses].sort((a, b) => a - b);
  const meanSurplus = finalSurpluses.reduce((a, b) => a + b, 0) / (finalSurpluses.length || 1);
  const variance =
    finalSurpluses.reduce((s, v) => s + (v - meanSurplus) ** 2, 0) / (finalSurpluses.length || 1);
  const stdDev = Math.sqrt(variance);

  const histogramBuckets = 12;
  const min = sortedSurpluses[0] ?? 0;
  const max = sortedSurpluses[sortedSurpluses.length - 1] ?? 0;
  const step = (max - min) / histogramBuckets || 1;
  const histogram: MonteCarloResults["histogram"] = [];
  for (let i = 0; i < histogramBuckets; i++) {
    const bucketMin = min + i * step;
    const bucketMax = bucketMin + step;
    const count = finalSurpluses.filter((v) => v >= bucketMin && (i === histogramBuckets - 1 ? v <= bucketMax : v < bucketMax)).length;
    histogram.push({ bucketMin, bucketMax, count });
  }

  const goalProbabilities = relevantGoals.map((g) => {
    const months = goalAchieveMonths[g.id];
    const sorted = [...months].sort((a, b) => a - b);
    const prob = (goalAchievedCounts[g.id] / simulations) * 100;
    return {
      goalId: g.id,
      goalTitle: g.title,
      targetDate: g.targetDate!,
      probabilityOfSuccess: prob,
      p10Date: sorted.length > 0 ? dateFromMonths(quantile(sorted, 0.1)) : "—",
      p50Date: sorted.length > 0 ? dateFromMonths(quantile(sorted, 0.5)) : "—",
      p90Date: sorted.length > 0 ? dateFromMonths(quantile(sorted, 0.9)) : "—",
    };
  });

  return {
    simulations,
    revenueVariance: {
      mean: baseRevenueMean,
      stdDev: baseRevenueStd,
      low: businesses.reduce((s, b) => s + b.revenueLow, 0),
      high: businesses.reduce((s, b) => s + b.revenueHigh, 0),
    },
    goalProbabilities,
    surplusDistribution: {
      p10: quantile(sortedSurpluses, 0.1),
      p25: quantile(sortedSurpluses, 0.25),
      p50: quantile(sortedSurpluses, 0.5),
      p75: quantile(sortedSurpluses, 0.75),
      p90: quantile(sortedSurpluses, 0.9),
    },
    histogram,
  };
}
