import type {
  ScenarioModification,
  ProjectedOutcome,
  ScenarioGoalImpact,
  Goal,
  PersonalDraw,
  Employee,
  Expense,
  RevenueEntry,
  Business,
} from "@/lib/data/types";
import { calculateFeasibility } from "./feasibility";
import { computeMonthlyPayroll } from "./payroll";
import { calculateTotalRevenue, calculateTotalExpenses, calculateConsolidatedPL } from "./calculations";

interface BaseInputs {
  businesses: Business[];
  employees: Employee[];
  expenses: Expense[];
  revenueEntries: RevenueEntry[];
  goals: Goal[];
  personalDraw: PersonalDraw;
}

interface AdjustedFinancials {
  totalRevenue: number;
  totalExpenses: number;
  totalPayroll: number;
  personalDraw: number;
  employees: Employee[];
  expenses: Expense[];
  extraMonthlyRevenue: number;
}

function applyModifications(
  base: BaseInputs,
  modifications: ScenarioModification[]
): AdjustedFinancials {
  let employees = [...base.employees];
  let expenses = [...base.expenses];
  let personalDraw = (base.personalDraw?.his ?? 0) + (base.personalDraw?.hers ?? 0);
  let extraMonthlyRevenue = 0;

  for (const mod of modifications) {
    switch (mod.type) {
      case "adjust_employee": {
        employees = employees.map((e) =>
          e.id === mod.employeeId
            ? {
                ...e,
                rate: mod.field === "rate" ? mod.newValue : e.rate,
                hoursPerWeek: mod.field === "hoursPerWeek" ? mod.newValue : e.hoursPerWeek,
              }
            : e
        );
        break;
      }
      case "remove_employee": {
        employees = employees.filter((e) => e.id !== mod.employeeId);
        break;
      }
      case "add_employee": {
        // Synthesize an employee with monthlyCost as salary-equivalent.
        employees = [
          ...employees,
          {
            id: `scenario-add-${Math.random().toString(36).slice(2, 9)}`,
            businessId: base.businesses[0]?.id ?? "",
            name: mod.name,
            roleTitle: mod.role,
            roleDescription: null,
            compensationType: "salary",
            rate: mod.monthlyCost * 12,
            currency: "USD",
            hoursPerWeek: null,
            startDate: null,
            performanceNotes: null,
            status: "active",
            createdAt: new Date().toISOString(),
          },
        ];
        break;
      }
      case "adjust_expense": {
        expenses = expenses.map((e) =>
          e.id === mod.expenseId ? { ...e, amount: mod.newAmount } : e
        );
        break;
      }
      case "remove_expense": {
        expenses = expenses.filter((e) => e.id !== mod.expenseId);
        break;
      }
      case "add_expense": {
        expenses = [
          ...expenses,
          {
            id: `scenario-exp-${Math.random().toString(36).slice(2, 9)}`,
            businessId: base.businesses[0]?.id ?? "",
            category: mod.category,
            name: mod.name,
            amount: mod.amount,
            currency: "USD",
            frequency: "monthly",
            isActive: true,
            createdAt: new Date().toISOString(),
          },
        ];
        break;
      }
      case "add_revenue": {
        extraMonthlyRevenue += mod.monthlyAmount;
        break;
      }
      case "adjust_draw": {
        personalDraw = mod.newDraw;
        break;
      }
      case "custom": {
        // Interpret custom as an additive surplus adjustment.
        extraMonthlyRevenue += mod.monthlyImpact;
        break;
      }
    }
  }

  // Align with Financial Command Center: current-month revenue with all-time fallback
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthRevenue = calculateTotalRevenue(base.revenueEntries, thisMonth);
  const baseRevenue = currentMonthRevenue > 0 ? currentMonthRevenue : calculateTotalRevenue(base.revenueEntries);
  const totalRevenue = baseRevenue + extraMonthlyRevenue;
  const totalExpenses = calculateTotalExpenses(expenses);
  const totalPayroll = computeMonthlyPayroll(employees);

  return {
    totalRevenue,
    totalExpenses,
    totalPayroll,
    personalDraw,
    employees,
    expenses,
    extraMonthlyRevenue,
  };
}

export function calculateProjectedOutcome(
  base: BaseInputs,
  modifications: ScenarioModification[]
): ProjectedOutcome {
  const adj = applyModifications(base, modifications);

  const pl = calculateConsolidatedPL(base.businesses, base.expenses, base.revenueEntries, base.employees);
  const baseRevenue = pl.totalRevenue;
  const baseExpenses = pl.totalExpenses;
  const basePayroll = pl.totalPayroll;
  const basePersonalDraw = (base.personalDraw?.his ?? 0) + (base.personalDraw?.hers ?? 0);
  const baseSurplus = baseRevenue - baseExpenses - basePayroll - basePersonalDraw;

  const netProfit = adj.totalRevenue - adj.totalExpenses - adj.totalPayroll;
  const monthlySurplus = netProfit - adj.personalDraw;
  const payrollToRevenueRatio = adj.totalRevenue > 0 ? (adj.totalPayroll / adj.totalRevenue) * 100 : 0;

  // Simulated PersonalDraw for feasibility re-run
  const simulatedDraw: PersonalDraw = {
    his: base.personalDraw?.his ?? 0,
    hers: Math.max(0, adj.personalDraw - (base.personalDraw?.his ?? 0)),
  };

  const goalImpacts: ScenarioGoalImpact[] = base.goals
    .filter((g) => g.status !== "achieved" && g.status !== "abandoned" && g.type !== "operational")
    .map((g) => {
      const before = calculateFeasibility(g, {
        revenueEntries: base.revenueEntries,
        expenses: base.expenses,
        employees: base.employees,
        personalDraw: base.personalDraw,
      });
      const after = calculateFeasibility(g, {
        revenueEntries: base.revenueEntries,
        expenses: adj.expenses,
        employees: adj.employees,
        personalDraw: simulatedDraw,
      });
      // Inject extra revenue effect by adjusting surplus math via a synthetic revenue boost.
      // For goals where extraMonthlyRevenue matters, bump monthsNeeded downward.
      const extraSurplus = adj.extraMonthlyRevenue;
      const adjustedSurplus = after.currentMonthlySurplus + extraSurplus;
      const monthsNeeded = adjustedSurplus > 0 && g.targetValue
        ? Math.max(0, g.targetValue - g.currentValue) / adjustedSurplus
        : Infinity;
      let newDate: string | null = after.projectedAchieveDate;
      if (Number.isFinite(monthsNeeded)) {
        const d = new Date();
        d.setMonth(d.getMonth() + Math.ceil(monthsNeeded));
        newDate = d.toISOString().slice(0, 10);
      }
      const currentDate = before.projectedAchieveDate;
      const monthsGained =
        currentDate && newDate
          ? Math.round(
              (new Date(currentDate).getTime() - new Date(newDate).getTime()) / (1000 * 60 * 60 * 24 * 30.4375)
            )
          : 0;
      const isNowAchievable =
        !!g.targetDate && !!newDate && new Date(newDate) <= new Date(g.targetDate);
      return {
        goalId: g.id,
        goalTitle: g.title,
        currentProjectedDate: currentDate,
        newProjectedDate: newDate,
        isNowAchievable,
        monthsGained,
      };
    });

  return {
    totalRevenue: adj.totalRevenue,
    totalExpenses: adj.totalExpenses,
    totalPayroll: adj.totalPayroll,
    personalDraw: adj.personalDraw,
    netProfit,
    monthlySurplus,
    payrollToRevenueRatio,
    revenueDelta: adj.totalRevenue - baseRevenue,
    expenseDelta: adj.totalExpenses - baseExpenses,
    payrollDelta: adj.totalPayroll - basePayroll,
    surplusDelta: monthlySurplus - baseSurplus,
    goalImpacts,
  };
}
