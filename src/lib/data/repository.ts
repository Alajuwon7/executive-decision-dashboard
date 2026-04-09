import type { Business, CreateBusiness, Employee, Expense, CreateExpense, RevenueEntry, CreateRevenue, DashboardLayout } from "./types";

export interface DataRepository {
  getBusinesses(): Promise<Business[]>;
  addBusiness(data: CreateBusiness): Promise<Business>;
  updateBusiness(id: string, data: Partial<Business>): Promise<Business>;

  getExpenses(businessId?: string): Promise<Expense[]>;
  addExpense(data: CreateExpense): Promise<Expense>;
  deleteExpense(id: string): Promise<void>;

  getRevenueEntries(businessId?: string): Promise<RevenueEntry[]>;
  addRevenue(data: CreateRevenue): Promise<RevenueEntry>;
  deleteRevenue(id: string): Promise<void>;

  getEmployees(businessId?: string): Promise<Employee[]>;

  getLayout(): DashboardLayout | null;
  saveLayout(layout: DashboardLayout): void;

  onChange(callback: () => void): () => void;
}
