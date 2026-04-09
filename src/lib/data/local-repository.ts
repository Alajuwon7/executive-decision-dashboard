import type { DataRepository } from "./repository";
import type { Business, CreateBusiness, Employee, CreateEmployee, Expense, CreateExpense, RevenueEntry, CreateRevenue, DashboardLayout } from "./types";
import type { OODADecision, CreateOODADecision, DecisionLogEntry, CreateDecisionLogEntry } from "./ooda-types";
import { seedBusinesses, seedEmployees, seedExpenses, seedRevenueEntries } from "./seed-data";
import { generateId } from "@/lib/utils/formatters";

const KEYS = {
  businesses: "edi_businesses",
  employees: "edi_employees",
  expenses: "edi_expenses",
  revenue: "edi_revenue",
  layout: "edi_layout",
  seeded: "edi_seeded",
  oodaDecisions: "edi_ooda_decisions",
  decisionLog: "edi_decision_log",
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

  async addEmployee(data: CreateEmployee) {
    const employees = getItem<Employee>(KEYS.employees);
    const newEmployee: Employee = {
      id: generateId(),
      businessId: data.businessId,
      name: data.name,
      roleTitle: data.roleTitle,
      roleDescription: data.roleDescription ?? null,
      compensationType: data.compensationType,
      rate: data.rate,
      currency: data.currency,
      hoursPerWeek: data.hoursPerWeek,
      startDate: data.startDate ?? null,
      performanceNotes: data.performanceNotes ?? null,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    employees.push(newEmployee);
    setItem(KEYS.employees, employees);
    notifyListeners();
    return newEmployee;
  },

  async updateEmployee(id: string, data: Partial<Employee>) {
    const employees = getItem<Employee>(KEYS.employees);
    const idx = employees.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error("Employee not found");
    employees[idx] = { ...employees[idx], ...data };
    setItem(KEYS.employees, employees);
    notifyListeners();
    return employees[idx];
  },

  async deleteEmployee(id: string) {
    const employees = getItem<Employee>(KEYS.employees);
    setItem(KEYS.employees, employees.filter((e) => e.id !== id));
    notifyListeners();
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

  async getOODADecisions(status?: string) {
    const decisions = getItem<OODADecision>(KEYS.oodaDecisions);
    return status ? decisions.filter((d) => d.status === status) : decisions;
  },

  async getOODADecision(id: string) {
    const decisions = getItem<OODADecision>(KEYS.oodaDecisions);
    return decisions.find((d) => d.id === id) ?? null;
  },

  async createOODADecision(input: CreateOODADecision) {
    const decisions = getItem<OODADecision>(KEYS.oodaDecisions);
    const now = new Date().toISOString();
    const newDecision: OODADecision = {
      id: generateId(),
      title: input.title,
      type: input.type,
      stage: "observe",
      observeData: input.observeData ?? {},
      orientAnalysis: {},
      decideOptions: {},
      actOutcome: {},
      adminVotes: {},
      financialImpact: {},
      aiAutomationAssessment: null,
      relatedEmployeeId: input.relatedEmployeeId ?? null,
      relatedBusinessId: input.relatedBusinessId ?? null,
      status: "in_progress",
      decidedBy: null,
      decidedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    decisions.push(newDecision);
    setItem(KEYS.oodaDecisions, decisions);
    notifyListeners();
    return newDecision;
  },

  async updateOODADecision(id: string, input: Partial<OODADecision>) {
    const decisions = getItem<OODADecision>(KEYS.oodaDecisions);
    const idx = decisions.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error("Decision not found");
    decisions[idx] = { ...decisions[idx], ...input, updatedAt: new Date().toISOString() };
    setItem(KEYS.oodaDecisions, decisions);
    notifyListeners();
    return decisions[idx];
  },

  async addDecisionLogEntry(input: CreateDecisionLogEntry) {
    const log = getItem<DecisionLogEntry>(KEYS.decisionLog);
    const newEntry: DecisionLogEntry = {
      id: generateId(),
      oodaDecisionId: input.oodaDecisionId,
      action: input.action,
      snapshot: input.snapshot,
      outcomeNotes: input.outcomeNotes ?? null,
      performedBy: null,
      createdAt: new Date().toISOString(),
    };
    log.push(newEntry);
    setItem(KEYS.decisionLog, log);
    notifyListeners();
    return newEntry;
  },

  async getDecisionLog(decisionId: string) {
    const log = getItem<DecisionLogEntry>(KEYS.decisionLog);
    return log.filter((e) => e.oodaDecisionId === decisionId);
  },
};
