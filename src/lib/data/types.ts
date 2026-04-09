export interface Business {
  id: string;
  name: string;
  displayName: string;
  currency: string;
  revenueLow: number;
  revenueHigh: number;
  status: "active" | "inactive";
  createdAt: string;
}

export interface CreateBusiness {
  name: string;
  displayName: string;
  currency: string;
  revenueLow: number;
  revenueHigh: number;
}

export interface Employee {
  id: string;
  businessId: string;
  name: string;
  roleTitle: string;
  roleDescription: string | null;
  compensationType: "hourly" | "salary";
  rate: number;
  currency: string;
  hoursPerWeek: number | null;
  startDate: string | null;
  performanceNotes: string | null;
  status: "active" | "on-leave" | "terminated";
  createdAt: string;
}

export interface CreateEmployee {
  businessId: string;
  name: string;
  roleTitle: string;
  roleDescription?: string;
  compensationType: "hourly" | "salary";
  rate: number;
  currency: string;
  hoursPerWeek: number | null;
  startDate?: string;
  performanceNotes?: string;
}

export interface Expense {
  id: string;
  businessId: string;
  category: string;
  name: string;
  amount: number;
  currency: string;
  frequency: "monthly" | "weekly" | "yearly" | "one-time";
  isActive: boolean;
  createdAt: string;
}

export interface CreateExpense {
  businessId: string;
  category: string;
  name: string;
  amount: number;
  currency: string;
  frequency: "monthly" | "weekly" | "yearly" | "one-time";
}

export interface RevenueEntry {
  id: string;
  businessId: string;
  amount: number;
  currency: string;
  source: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface CreateRevenue {
  businessId: string;
  amount: number;
  currency: string;
  source: string;
  description: string;
  date: string;
}

export interface DashboardLayout {
  layouts: Record<string, LayoutItem[]>;
}

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface ConsolidatedPL {
  totalRevenue: number;
  totalExpenses: number;
  totalPayroll: number;
  netProfit: number;
  takeHome: number;
  revenueChange: number;
  expenseChange: number;
  profitChange: number;
  takeHomeChange: number;
}

export interface BusinessBreakdownItem {
  business: Business;
  revenue: number;
  expenses: number;
  payroll: number;
  netIncome: number;
  margin: number;
}

export interface ExpenseByCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface KPIInsight {
  icon: string;
  iconColor: string;
  iconBg: string;
  text: string;
  highlight: string;
  detail: string;
}

export type KPIType = "revenue" | "expenses" | "netProfit" | "takeHome";
