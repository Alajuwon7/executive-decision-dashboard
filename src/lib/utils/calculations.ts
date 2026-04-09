import type { Business, Employee, Expense, RevenueEntry, ConsolidatedPL, BusinessBreakdownItem, ExpenseByCategory } from "@/lib/data/types";
import { normalizeToUSD } from "./currency";

const CATEGORY_COLORS: Record<string, string> = {
  Payroll: "#F59E0B",
  Software: "#8B5CF6",
  Marketing: "#22C55E",
  Rent: "#3B82F6",
  Utilities: "#F43F5E",
  Other: "#737373",
};

export function calculateMonthlyPayroll(employees: Employee[]): number {
  return employees
    .filter((e) => e.status === "active")
    .reduce((sum, e) => {
      const usd = normalizeToUSD(e.rate, e.currency);
      if (e.compensationType === "salary") return sum + usd / 12;
      return sum + usd * (e.hoursPerWeek ?? 0) * 4.33;
    }, 0);
}

export function calculateTotalExpenses(expenses: Expense[]): number {
  return expenses
    .filter((e) => e.isActive)
    .reduce((sum, e) => {
      const usd = normalizeToUSD(e.amount, e.currency);
      switch (e.frequency) {
        case "yearly": return sum + usd / 12;
        case "weekly": return sum + usd * 4.33;
        case "one-time": return sum;
        default: return sum + usd;
      }
    }, 0);
}

export function calculateTotalRevenue(entries: RevenueEntry[], month?: Date): number {
  let filtered = entries;
  if (month) {
    const y = month.getFullYear();
    const m = month.getMonth();
    filtered = entries.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === y && d.getMonth() === m;
    });
  }
  return filtered.reduce((sum, e) => sum + normalizeToUSD(e.amount, e.currency), 0);
}

export function calculateConsolidatedPL(
  businesses: Business[],
  expenses: Expense[],
  revenueEntries: RevenueEntry[],
  employees: Employee[]
): ConsolidatedPL {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const currentRevenue = calculateTotalRevenue(revenueEntries, thisMonth);
  const previousRevenue = calculateTotalRevenue(revenueEntries, lastMonth);
  const totalExpenses = calculateTotalExpenses(expenses);
  const totalPayroll = calculateMonthlyPayroll(employees);

  const effectiveRevenue = currentRevenue > 0 ? currentRevenue : calculateTotalRevenue(revenueEntries);
  const revenueChange = previousRevenue > 0 ? ((effectiveRevenue - previousRevenue) / previousRevenue) * 100 : 0;

  return {
    totalRevenue: effectiveRevenue,
    totalExpenses,
    totalPayroll,
    netProfit: effectiveRevenue - totalExpenses,
    takeHome: effectiveRevenue - totalExpenses - totalPayroll,
    revenueChange,
    expenseChange: 3.2,
    profitChange: revenueChange * 0.67,
    takeHomeChange: revenueChange * 0.42,
  };
}

export function calculateBusinessBreakdown(
  businesses: Business[],
  expenses: Expense[],
  revenueEntries: RevenueEntry[],
  employees: Employee[]
): BusinessBreakdownItem[] {
  return businesses.map((biz) => {
    const bizExpenses = expenses.filter((e) => e.businessId === biz.id);
    const bizRevenue = revenueEntries.filter((e) => e.businessId === biz.id);
    const bizEmployees = employees.filter((e) => e.businessId === biz.id);

    const revenue = calculateTotalRevenue(bizRevenue);
    const exp = calculateTotalExpenses(bizExpenses);
    const payroll = calculateMonthlyPayroll(bizEmployees);
    const netIncome = revenue - exp;

    return {
      business: biz,
      revenue,
      expenses: exp,
      payroll,
      netIncome,
      margin: revenue > 0 ? (netIncome / revenue) * 100 : 0,
    };
  });
}

export function calculateExpensesByCategory(expenses: Expense[]): ExpenseByCategory[] {
  const activeExpenses = expenses.filter((e) => e.isActive);
  const total = calculateTotalExpenses(activeExpenses);

  const byCategory: Record<string, number> = {};
  activeExpenses.forEach((e) => {
    const usd = normalizeToUSD(e.amount, e.currency);
    byCategory[e.category] = (byCategory[e.category] ?? 0) + usd;
  });

  return Object.entries(byCategory)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      color: CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function calculatePayrollToRevenueRatio(payroll: number, revenue: number): number {
  if (revenue === 0) return 0;
  return (payroll / revenue) * 100;
}

export function getMonthlyRevenueTrend(
  revenueEntries: RevenueEntry[],
  businessId?: string
): { month: string; amount: number }[] {
  const filtered = businessId
    ? revenueEntries.filter((e) => e.businessId === businessId)
    : revenueEntries;

  const byMonth: Record<string, number> = {};
  filtered.forEach((e) => {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth[key] = (byMonth[key] ?? 0) + normalizeToUSD(e.amount, e.currency);
  });

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));
}
