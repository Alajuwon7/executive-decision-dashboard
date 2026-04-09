import { create } from "zustand";
import type { Business, CreateBusiness, Employee, Expense, CreateExpense, RevenueEntry, CreateRevenue, ConsolidatedPL, BusinessBreakdownItem, ExpenseByCategory } from "@/lib/data/types";
import { repository } from "@/lib/data";
import { calculateConsolidatedPL, calculateBusinessBreakdown, calculateExpensesByCategory, calculatePayrollToRevenueRatio, getMonthlyRevenueTrend } from "@/lib/utils/calculations";
import { toast } from "sonner";

interface FinancialState {
  businesses: Business[];
  expenses: Expense[];
  revenueEntries: RevenueEntry[];
  employees: Employee[];
  isLoading: boolean;
  error: string | null;

  fetchAll: () => Promise<void>;
  addBusiness: (data: CreateBusiness) => Promise<void>;
  addExpense: (data: CreateExpense) => Promise<void>;
  addRevenue: (data: CreateRevenue) => Promise<void>;

  getConsolidatedPL: () => ConsolidatedPL;
  getBusinessBreakdown: () => BusinessBreakdownItem[];
  getExpensesByCategory: () => ExpenseByCategory[];
  getPayrollToRevenueRatio: () => number;
  getMonthlyRevenueTrend: (businessId?: string) => { month: string; amount: number }[];
}

export const useFinancialStore = create<FinancialState>((set, get) => ({
  businesses: [],
  expenses: [],
  revenueEntries: [],
  employees: [],
  isLoading: true,
  error: null,

  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const [businesses, expenses, revenueEntries, employees] = await Promise.all([
        repository.getBusinesses(),
        repository.getExpenses(),
        repository.getRevenueEntries(),
        repository.getEmployees(),
      ]);
      set({ businesses, expenses, revenueEntries, employees, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load data";
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  addBusiness: async (data) => {
    try {
      await repository.addBusiness(data);
      await get().fetchAll();
      toast.success("Business added");
    } catch (err) {
      toast.error("Failed to add business");
    }
  },

  addExpense: async (data) => {
    try {
      await repository.addExpense(data);
      await get().fetchAll();
      toast.success("Expense added");
    } catch (err) {
      toast.error("Failed to add expense");
    }
  },

  addRevenue: async (data) => {
    try {
      await repository.addRevenue(data);
      await get().fetchAll();
      toast.success("Revenue entry added");
    } catch (err) {
      toast.error("Failed to add revenue entry");
    }
  },

  getConsolidatedPL: () => {
    const { businesses, expenses, revenueEntries, employees } = get();
    return calculateConsolidatedPL(businesses, expenses, revenueEntries, employees);
  },

  getBusinessBreakdown: () => {
    const { businesses, expenses, revenueEntries, employees } = get();
    return calculateBusinessBreakdown(businesses, expenses, revenueEntries, employees);
  },

  getExpensesByCategory: () => {
    const { expenses } = get();
    return calculateExpensesByCategory(expenses);
  },

  getPayrollToRevenueRatio: () => {
    const pl = get().getConsolidatedPL();
    return calculatePayrollToRevenueRatio(pl.totalPayroll, pl.totalRevenue);
  },

  getMonthlyRevenueTrend: (businessId?: string) => {
    const { revenueEntries } = get();
    return getMonthlyRevenueTrend(revenueEntries, businessId);
  },
}));
