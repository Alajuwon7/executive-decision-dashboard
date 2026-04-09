import type { DataRepository } from "./repository";
import type { Business, CreateBusiness, Employee, Expense, CreateExpense, RevenueEntry, CreateRevenue, DashboardLayout } from "./types";
import { seedBusinesses, seedEmployees, seedExpenses, seedRevenueEntries } from "./seed-data";
import { generateId } from "@/lib/utils/formatters";

const KEYS = {
  businesses: "edi_businesses",
  employees: "edi_employees",
  expenses: "edi_expenses",
  revenue: "edi_revenue",
  layout: "edi_layout",
  seeded: "edi_seeded",
};

function getItem<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function setItem<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

let listeners: (() => void)[] = [];

function notifyListeners() {
  listeners.forEach((cb) => cb());
}

function ensureSeeded() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(KEYS.seeded)) return;
  setItem(KEYS.businesses, seedBusinesses);
  setItem(KEYS.employees, seedEmployees);
  setItem(KEYS.expenses, seedExpenses);
  setItem(KEYS.revenue, seedRevenueEntries);
  localStorage.setItem(KEYS.seeded, "true");
}

export const localRepository: DataRepository = {
  async getBusinesses() {
    ensureSeeded();
    return getItem<Business>(KEYS.businesses);
  },

  async addBusiness(data: CreateBusiness) {
    const businesses = getItem<Business>(KEYS.businesses);
    const newBiz: Business = {
      id: generateId(),
      ...data,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    businesses.push(newBiz);
    setItem(KEYS.businesses, businesses);
    notifyListeners();
    return newBiz;
  },

  async updateBusiness(id: string, data: Partial<Business>) {
    const businesses = getItem<Business>(KEYS.businesses);
    const idx = businesses.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error("Business not found");
    businesses[idx] = { ...businesses[idx], ...data };
    setItem(KEYS.businesses, businesses);
    notifyListeners();
    return businesses[idx];
  },

  async getExpenses(businessId?: string) {
    ensureSeeded();
    const expenses = getItem<Expense>(KEYS.expenses);
    return businessId ? expenses.filter((e) => e.businessId === businessId) : expenses;
  },

  async addExpense(data: CreateExpense) {
    const expenses = getItem<Expense>(KEYS.expenses);
    const newExpense: Expense = {
      id: generateId(),
      ...data,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    expenses.push(newExpense);
    setItem(KEYS.expenses, expenses);
    notifyListeners();
    return newExpense;
  },

  async deleteExpense(id: string) {
    const expenses = getItem<Expense>(KEYS.expenses);
    setItem(KEYS.expenses, expenses.filter((e) => e.id !== id));
    notifyListeners();
  },

  async getRevenueEntries(businessId?: string) {
    ensureSeeded();
    const entries = getItem<RevenueEntry>(KEYS.revenue);
    return businessId ? entries.filter((e) => e.businessId === businessId) : entries;
  },

  async addRevenue(data: CreateRevenue) {
    const entries = getItem<RevenueEntry>(KEYS.revenue);
    const newEntry: RevenueEntry = {
      id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    entries.push(newEntry);
    setItem(KEYS.revenue, entries);
    notifyListeners();
    return newEntry;
  },

  async deleteRevenue(id: string) {
    const entries = getItem<RevenueEntry>(KEYS.revenue);
    setItem(KEYS.revenue, entries.filter((e) => e.id !== id));
    notifyListeners();
  },

  async getEmployees(businessId?: string) {
    ensureSeeded();
    const employees = getItem<Employee>(KEYS.employees);
    return businessId ? employees.filter((e) => e.businessId === businessId) : employees;
  },

  getLayout() {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(KEYS.layout);
    return raw ? JSON.parse(raw) : null;
  },

  saveLayout(layout: DashboardLayout) {
    localStorage.setItem(KEYS.layout, JSON.stringify(layout));
  },

  onChange(callback: () => void) {
    listeners.push(callback);
    return () => {
      listeners = listeners.filter((cb) => cb !== callback);
    };
  },
};
