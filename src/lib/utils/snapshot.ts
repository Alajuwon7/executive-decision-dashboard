import type { Business, Employee, Expense, RevenueEntry, Goal } from "@/lib/data/types";
import type { FinancialSnapshot } from "@/lib/data/ooda-types";
import { calculateTotalRevenue, calculateTotalExpenses, calculatePayrollToRevenueRatio } from "./calculations";
import { calculateMonthlyCost, calculateTotalPayroll } from "./workforce-calculations";
import { calculateExpensesByCategory } from "./calculations";
import { normalizeToUSD } from "./currency";

export function buildFinancialSnapshot(
  businesses: Business[],
  employees: Employee[],
  expenses: Expense[],
  revenueEntries: RevenueEntry[],
  goals: Goal[] = []
): FinancialSnapshot {
  const totalRevenue = calculateTotalRevenue(revenueEntries);
  const totalExpenses = calculateTotalExpenses(expenses);
  const activeEmployees = employees.filter((e) => e.status === "active");
  const totalPayroll = calculateTotalPayroll(activeEmployees);
  const payrollRatio = calculatePayrollToRevenueRatio(totalPayroll, totalRevenue);

  const businessData = businesses.map((biz) => {
    const bizEmployees = activeEmployees.filter((e) => e.businessId === biz.id);
    const bizExpenses = expenses.filter((e) => e.businessId === biz.id);
    const bizRevenue = revenueEntries.filter((e) => e.businessId === biz.id);
    return {
      id: biz.id,
      name: biz.displayName,
      revenue: calculateTotalRevenue(bizRevenue),
      expenses: calculateTotalExpenses(bizExpenses),
      employeeCount: bizEmployees.length,
      payroll: calculateTotalPayroll(bizEmployees),
    };
  });

  const employeeData = activeEmployees.map((emp) => {
    const biz = businesses.find((b) => b.id === emp.businessId);
    return {
      id: emp.id,
      name: emp.name,
      roleTitle: emp.roleTitle,
      monthlyCost: calculateMonthlyCost(emp),
      currency: emp.currency,
      hoursPerWeek: emp.hoursPerWeek,
      compensationType: emp.compensationType,
      businessName: biz?.displayName ?? "Unknown",
    };
  });

  const categories = calculateExpensesByCategory(expenses);
  const expenseCategories = categories.map((c) => ({
    category: c.category,
    totalMonthly: c.amount,
  }));

  const activeGoals = goals
    .filter((g) => g.status !== "achieved" && g.status !== "abandoned")
    .map((g) => ({
      id: g.id,
      title: g.title,
      owner: g.owner,
      type: g.type,
      status: g.status,
      targetValue: g.targetValue,
      currentValue: g.currentValue,
      targetDate: g.targetDate,
      feasibility: g.feasibility,
    }));

  return {
    timestamp: new Date().toISOString(),
    consolidated: {
      totalRevenue,
      totalExpenses,
      totalPayroll,
      netProfit: totalRevenue - totalExpenses,
      payrollToRevenueRatio: payrollRatio,
    },
    businesses: businessData,
    employees: employeeData,
    expenseCategories,
    activeGoals,
  };
}
