import type { Business, Expense, RevenueEntry, Employee, KPIInsight, KPIType } from "@/lib/data/types";
import { formatCurrency } from "./currency";
import { formatPercentage } from "./formatters";
import { calculateTotalExpenses, calculateMonthlyPayroll, calculateTotalRevenue, calculateExpensesByCategory, getMonthlyRevenueTrend } from "./calculations";

export function generateKPIInsights(
  kpiType: KPIType,
  businesses: Business[],
  expenses: Expense[],
  revenueEntries: RevenueEntry[],
  employees: Employee[]
): KPIInsight[] {
  switch (kpiType) {
    case "revenue":
      return generateRevenueInsights(businesses, revenueEntries);
    case "expenses":
      return generateExpenseInsights(businesses, expenses);
    case "netProfit":
      return generateProfitInsights(businesses, expenses, revenueEntries);
    case "takeHome":
      return generateTakeHomeInsights(businesses, expenses, revenueEntries, employees);
    default:
      return [];
  }
}

function generateRevenueInsights(businesses: Business[], entries: RevenueEntry[]): KPIInsight[] {
  const insights: KPIInsight[] = [];
  const total = calculateTotalRevenue(entries);

  let maxBiz: Business | null = null;
  let maxRevenue = 0;
  businesses.forEach((biz) => {
    const bizRevenue = calculateTotalRevenue(entries.filter((e) => e.businessId === biz.id));
    if (bizRevenue > maxRevenue) {
      maxRevenue = bizRevenue;
      maxBiz = biz;
    }
  });

  if (maxBiz && total > 0) {
    const pct = ((maxRevenue / total) * 100).toFixed(0);
    insights.push({
      icon: "\u2191",
      iconColor: "#F59E0B",
      iconBg: "rgba(245,158,11,0.12)",
      text: `${(maxBiz as Business).displayName} contributed ${formatCurrency(maxRevenue)}`,
      highlight: `${pct}% of total`,
      detail: `Out of ${formatCurrency(total)} total revenue across ${businesses.length} businesses`,
    });
  }

  businesses.forEach((biz) => {
    const trend = getMonthlyRevenueTrend(entries.filter((e) => e.businessId === biz.id));
    if (trend.length >= 2) {
      const current = trend[trend.length - 1].amount;
      const previous = trend[trend.length - 2].amount;
      const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
      if (change !== 0) {
        insights.push({
          icon: change > 0 ? "\u2197" : "\u2198",
          iconColor: change > 0 ? "#8B5CF6" : "#EF4444",
          iconBg: change > 0 ? "rgba(139,92,246,0.12)" : "rgba(239,68,68,0.12)",
          text: `${biz.displayName} ${change > 0 ? "grew" : "declined"} ${formatPercentage(Math.abs(change))} month-over-month`,
          highlight: formatCurrency(current),
          detail: `${formatCurrency(previous)} last month \u2192 ${formatCurrency(current)} this month`,
        });
      }
    }
  });

  businesses.forEach((biz) => {
    const bizRevenue = calculateTotalRevenue(entries.filter((e) => e.businessId === biz.id));
    const monthCount = getMonthlyRevenueTrend(entries.filter((e) => e.businessId === biz.id)).length;
    const monthlyAvg = monthCount > 0 ? bizRevenue / monthCount : 0;
    if (monthlyAvg > biz.revenueHigh) {
      insights.push({
        icon: "\u2713",
        iconColor: "#22C55E",
        iconBg: "rgba(34,197,94,0.12)",
        text: `${biz.displayName} is exceeding its target range`,
        highlight: `${formatCurrency(biz.revenueLow)}\u2013${formatCurrency(biz.revenueHigh)}`,
        detail: `Averaging ${formatCurrency(monthlyAvg)}/mo vs target of ${formatCurrency(biz.revenueLow)}\u2013${formatCurrency(biz.revenueHigh)}`,
      });
    }
  });

  return insights.slice(0, 4);
}

function generateExpenseInsights(businesses: Business[], expenses: Expense[]): KPIInsight[] {
  const insights: KPIInsight[] = [];
  const categories = calculateExpensesByCategory(expenses);

  if (categories.length > 0) {
    const top = categories[0];
    insights.push({
      icon: "\u25A0",
      iconColor: top.color,
      iconBg: `${top.color}20`,
      text: `${top.category} is your largest expense category`,
      highlight: `${top.percentage.toFixed(0)}% of total`,
      detail: `${formatCurrency(top.amount)}/mo across all businesses`,
    });
  }

  const payrollCategory = categories.find((c) => c.category === "Payroll");
  if (payrollCategory) {
    insights.push({
      icon: "\u2139",
      iconColor: "#3B82F6",
      iconBg: "rgba(59,130,246,0.12)",
      text: `Payroll accounts for ${payrollCategory.percentage.toFixed(0)}% of total expenses`,
      highlight: formatCurrency(payrollCategory.amount),
      detail: "Consider this ratio when evaluating new hires",
    });
  }

  businesses.forEach((biz) => {
    const bizExpenses = expenses.filter((e) => e.businessId === biz.id);
    const total = calculateTotalExpenses(bizExpenses);
    insights.push({
      icon: "\u25CB",
      iconColor: biz.id.includes("myers") ? "#F59E0B" : "#8B5CF6",
      iconBg: biz.id.includes("myers") ? "rgba(245,158,11,0.12)" : "rgba(139,92,246,0.12)",
      text: `${biz.displayName} monthly burn rate`,
      highlight: formatCurrency(total),
      detail: `Across ${bizExpenses.length} active expense items`,
    });
  });

  return insights.slice(0, 4);
}

function generateProfitInsights(businesses: Business[], expenses: Expense[], revenue: RevenueEntry[]): KPIInsight[] {
  const insights: KPIInsight[] = [];
  const totalRev = calculateTotalRevenue(revenue);
  const totalExp = calculateTotalExpenses(expenses);
  const margin = totalRev > 0 ? ((totalRev - totalExp) / totalRev) * 100 : 0;

  insights.push({
    icon: "\u2261",
    iconColor: margin > 20 ? "#22C55E" : margin > 0 ? "#F59E0B" : "#EF4444",
    iconBg: margin > 20 ? "rgba(34,197,94,0.12)" : margin > 0 ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)",
    text: `Overall profit margin is ${margin.toFixed(1)}%`,
    highlight: margin > 20 ? "Strong" : margin > 0 ? "Moderate" : "Negative",
    detail: `${formatCurrency(totalRev)} revenue \u2212 ${formatCurrency(totalExp)} expenses`,
  });

  businesses.forEach((biz) => {
    const bizRev = calculateTotalRevenue(revenue.filter((e) => e.businessId === biz.id));
    const bizExp = calculateTotalExpenses(expenses.filter((e) => e.businessId === biz.id));
    const bizMargin = bizRev > 0 ? ((bizRev - bizExp) / bizRev) * 100 : 0;
    insights.push({
      icon: bizMargin > 20 ? "\u2191" : "\u2193",
      iconColor: bizMargin > 20 ? "#22C55E" : "#F59E0B",
      iconBg: bizMargin > 20 ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)",
      text: `${biz.displayName} margin: ${bizMargin.toFixed(1)}%`,
      highlight: formatCurrency(bizRev - bizExp),
      detail: `${formatCurrency(bizRev)} revenue \u2212 ${formatCurrency(bizExp)} expenses`,
    });
  });

  return insights.slice(0, 4);
}

function generateTakeHomeInsights(businesses: Business[], expenses: Expense[], revenue: RevenueEntry[], employees: Employee[]): KPIInsight[] {
  const insights: KPIInsight[] = [];
  const totalRev = calculateTotalRevenue(revenue);
  const totalExp = calculateTotalExpenses(expenses);
  const payroll = calculateMonthlyPayroll(employees);
  const netProfit = totalRev - totalExp;
  const takeHome = netProfit - payroll;

  insights.push({
    icon: "\u2261",
    iconColor: takeHome > 0 ? "#22C55E" : "#EF4444",
    iconBg: takeHome > 0 ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
    text: `After payroll of ${formatCurrency(payroll)}, your take-home is ${formatCurrency(takeHome)}`,
    highlight: takeHome > 0 ? "Positive" : "Negative",
    detail: `${formatCurrency(netProfit)} net profit \u2212 ${formatCurrency(payroll)} payroll`,
  });

  const payrollPct = netProfit > 0 ? (payroll / netProfit) * 100 : 0;
  insights.push({
    icon: "\u2139",
    iconColor: "#3B82F6",
    iconBg: "rgba(59,130,246,0.12)",
    text: `Payroll consumes ${payrollPct.toFixed(0)}% of net profit`,
    highlight: payrollPct < 50 ? "Sustainable" : "Heavy",
    detail: payrollPct < 50 ? "Healthy ratio \u2014 room for growth" : "Consider revenue growth or payroll optimization",
  });

  return insights.slice(0, 4);
}
