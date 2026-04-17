import type { DataRepository } from "./repository";
import type {
  Business,
  CreateBusiness,
  Employee,
  CreateEmployee,
  Expense,
  CreateExpense,
  RevenueEntry,
  CreateRevenue,
  DashboardLayout,
  Goal,
  CreateGoal,
  GoalMilestone,
  CreateGoalMilestone,
  PatternAlert,
  CreatePatternAlert,
  PersonalDraw,
  Scenario,
  CreateScenario,
  PulseAlert,
  CreatePulseAlert,
  BusinessIntegration,
  CreateBusinessIntegration,
  SyncLogEntry,
  CreateSyncLogEntry,
} from "./types";
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
  goals: "edi_goals",
  milestones: "edi_goal_milestones",
  patternAlerts: "edi_pattern_alerts",
  personalDraw: "edi_personal_draw",
  scenarios: "edi_scenarios",
  pulseAlerts: "edi_pulse_alerts",
  integrations: "edi_integrations",
  syncLog: "edi_sync_log",
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

  async getGoals() {
    return getItem<Goal>(KEYS.goals);
  },

  async createGoal(input: CreateGoal) {
    const goals = getItem<Goal>(KEYS.goals);
    const now = new Date().toISOString();
    const newGoal: Goal = {
      id: generateId(),
      owner: input.owner,
      title: input.title,
      description: input.description ?? null,
      type: input.type,
      targetValue: input.targetValue ?? null,
      targetDate: input.targetDate ?? null,
      currentValue: input.currentValue ?? 0,
      status: "active",
      dependencies: input.dependencies ?? [],
      metadata: input.metadata ?? {},
      feasibility: null,
      lastFeasibilityCheck: null,
      createdAt: now,
      updatedAt: now,
    };
    goals.push(newGoal);
    setItem(KEYS.goals, goals);
    notifyListeners();
    return newGoal;
  },

  async updateGoal(id: string, data: Partial<Goal>) {
    const goals = getItem<Goal>(KEYS.goals);
    const idx = goals.findIndex((g) => g.id === id);
    if (idx === -1) throw new Error("Goal not found");
    goals[idx] = { ...goals[idx], ...data, updatedAt: new Date().toISOString() };
    setItem(KEYS.goals, goals);
    notifyListeners();
    return goals[idx];
  },

  async deleteGoal(id: string) {
    const goals = getItem<Goal>(KEYS.goals);
    setItem(KEYS.goals, goals.filter((g) => g.id !== id));
    const milestones = getItem<GoalMilestone>(KEYS.milestones);
    setItem(KEYS.milestones, milestones.filter((m) => m.goalId !== id));
    notifyListeners();
  },

  async getMilestones(goalId?: string) {
    const milestones = getItem<GoalMilestone>(KEYS.milestones);
    return goalId ? milestones.filter((m) => m.goalId === goalId) : milestones;
  },

  async createMilestone(input: CreateGoalMilestone) {
    const milestones = getItem<GoalMilestone>(KEYS.milestones);
    const newMilestone: GoalMilestone = {
      id: generateId(),
      goalId: input.goalId,
      title: input.title,
      targetDate: input.targetDate ?? null,
      isCompleted: false,
      completedAt: null,
      sortOrder: input.sortOrder ?? milestones.filter((m) => m.goalId === input.goalId).length,
      createdAt: new Date().toISOString(),
    };
    milestones.push(newMilestone);
    setItem(KEYS.milestones, milestones);
    notifyListeners();
    return newMilestone;
  },

  async updateMilestone(id: string, data: Partial<GoalMilestone>) {
    const milestones = getItem<GoalMilestone>(KEYS.milestones);
    const idx = milestones.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error("Milestone not found");
    milestones[idx] = { ...milestones[idx], ...data };
    setItem(KEYS.milestones, milestones);
    notifyListeners();
    return milestones[idx];
  },

  async deleteMilestone(id: string) {
    const milestones = getItem<GoalMilestone>(KEYS.milestones);
    setItem(KEYS.milestones, milestones.filter((m) => m.id !== id));
    notifyListeners();
  },

  async getPatternAlerts() {
    return getItem<PatternAlert>(KEYS.patternAlerts);
  },

  async createPatternAlert(input: CreatePatternAlert) {
    const alerts = getItem<PatternAlert>(KEYS.patternAlerts);
    const newAlert: PatternAlert = {
      id: generateId(),
      type: input.type,
      severity: input.severity,
      title: input.title,
      message: input.message,
      data: input.data ?? {},
      relatedGoalId: input.relatedGoalId ?? null,
      isRead: false,
      isDismissed: false,
      createdAt: new Date().toISOString(),
    };
    alerts.push(newAlert);
    setItem(KEYS.patternAlerts, alerts);
    notifyListeners();
    return newAlert;
  },

  async dismissPatternAlert(id: string) {
    const alerts = getItem<PatternAlert>(KEYS.patternAlerts);
    const idx = alerts.findIndex((a) => a.id === id);
    if (idx === -1) return;
    alerts[idx] = { ...alerts[idx], isDismissed: true };
    setItem(KEYS.patternAlerts, alerts);
    notifyListeners();
  },

  async getPersonalDraw() {
    if (typeof window === "undefined") return { his: 0, hers: 0 };
    const raw = localStorage.getItem(KEYS.personalDraw);
    return raw ? JSON.parse(raw) : { his: 0, hers: 0 };
  },

  async setPersonalDraw(draw: PersonalDraw) {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEYS.personalDraw, JSON.stringify(draw));
    notifyListeners();
  },

  async getScenarios() {
    return getItem<Scenario>(KEYS.scenarios);
  },

  async createScenario(input: CreateScenario) {
    const scenarios = getItem<Scenario>(KEYS.scenarios);
    const now = new Date().toISOString();
    const newScenario: Scenario = {
      id: generateId(),
      name: input.name,
      description: input.description ?? null,
      baseSnapshot: input.baseSnapshot,
      modifications: input.modifications,
      projectedOutcome: input.projectedOutcome ?? null,
      monteCarloResults: input.monteCarloResults ?? null,
      probabilityScore: input.probabilityScore ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    scenarios.push(newScenario);
    setItem(KEYS.scenarios, scenarios);
    notifyListeners();
    return newScenario;
  },

  async updateScenario(id: string, data: Partial<Scenario>) {
    const scenarios = getItem<Scenario>(KEYS.scenarios);
    const idx = scenarios.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Scenario not found");
    scenarios[idx] = { ...scenarios[idx], ...data, updatedAt: new Date().toISOString() };
    setItem(KEYS.scenarios, scenarios);
    notifyListeners();
    return scenarios[idx];
  },

  async deleteScenario(id: string) {
    const scenarios = getItem<Scenario>(KEYS.scenarios);
    setItem(KEYS.scenarios, scenarios.filter((s) => s.id !== id));
    notifyListeners();
  },

  async getPulseAlerts() {
    return getItem<PulseAlert>(KEYS.pulseAlerts);
  },

  async createPulseAlert(input: CreatePulseAlert) {
    const alerts = getItem<PulseAlert>(KEYS.pulseAlerts);
    const newAlert: PulseAlert = {
      id: generateId(),
      type: input.type,
      severity: input.severity,
      title: input.title,
      message: input.message,
      data: input.data ?? {},
      relatedGoalId: input.relatedGoalId ?? null,
      relatedEmployeeId: input.relatedEmployeeId ?? null,
      relatedBusinessId: input.relatedBusinessId ?? null,
      relatedDecisionId: input.relatedDecisionId ?? null,
      isRead: false,
      isDismissed: false,
      createdAt: new Date().toISOString(),
    };
    alerts.push(newAlert);
    setItem(KEYS.pulseAlerts, alerts);
    notifyListeners();
    return newAlert;
  },

  async markPulseAlertRead(id: string) {
    const alerts = getItem<PulseAlert>(KEYS.pulseAlerts);
    const idx = alerts.findIndex((a) => a.id === id);
    if (idx === -1) return;
    alerts[idx] = { ...alerts[idx], isRead: true };
    setItem(KEYS.pulseAlerts, alerts);
    notifyListeners();
  },

  async dismissPulseAlert(id: string) {
    const alerts = getItem<PulseAlert>(KEYS.pulseAlerts);
    const idx = alerts.findIndex((a) => a.id === id);
    if (idx === -1) return;
    alerts[idx] = { ...alerts[idx], isDismissed: true };
    setItem(KEYS.pulseAlerts, alerts);
    notifyListeners();
  },

  async getIntegrations(businessId?: string) {
    const all = getItem<BusinessIntegration>(KEYS.integrations);
    return businessId ? all.filter((i) => i.businessId === businessId) : all;
  },

  async getIntegration(businessId: string, provider: string) {
    const all = getItem<BusinessIntegration>(KEYS.integrations);
    return all.find((i) => i.businessId === businessId && i.provider === provider) ?? null;
  },

  async upsertIntegration(input: CreateBusinessIntegration) {
    const items = getItem<BusinessIntegration>(KEYS.integrations);
    const existing = items.findIndex((i) => i.businessId === input.businessId && i.provider === input.provider);
    const now = new Date().toISOString();
    const record: BusinessIntegration = {
      id: existing >= 0 ? items[existing].id : generateId(),
      businessId: input.businessId,
      provider: input.provider,
      tokenExpiresAt: input.tokenExpiresAt,
      realmId: input.realmId ?? null,
      externalAccountId: input.externalAccountId ?? null,
      lastSyncAt: null,
      lastSyncStatus: "pending",
      lastSyncError: null,
      isActive: true,
      syncFrequency: input.syncFrequency ?? "15min",
      metadata: input.metadata ?? {},
      createdAt: existing >= 0 ? items[existing].createdAt : now,
      updatedAt: now,
    };
    if (existing >= 0) items[existing] = record;
    else items.push(record);
    setItem(KEYS.integrations, items);
    notifyListeners();
    return record;
  },

  async updateIntegration(id: string, data: Partial<BusinessIntegration>) {
    const items = getItem<BusinessIntegration>(KEYS.integrations);
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error("Integration not found");
    items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
    setItem(KEYS.integrations, items);
    notifyListeners();
    return items[idx];
  },

  async deactivateIntegration(id: string) {
    const items = getItem<BusinessIntegration>(KEYS.integrations);
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return;
    items[idx] = { ...items[idx], isActive: false, updatedAt: new Date().toISOString() };
    setItem(KEYS.integrations, items);
    notifyListeners();
  },

  async getSyncLog(integrationId: string, limit = 20) {
    const all = getItem<SyncLogEntry>(KEYS.syncLog);
    return all.filter((l) => l.integrationId === integrationId).slice(-limit).reverse();
  },

  async createSyncLog(input: CreateSyncLogEntry) {
    const items = getItem<SyncLogEntry>(KEYS.syncLog);
    const entry: SyncLogEntry = {
      id: generateId(),
      ...input,
      recordsFetched: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      errorsCount: 0,
      errorDetails: [],
      metadata: {},
      startedAt: new Date().toISOString(),
      completedAt: null,
    };
    items.push(entry);
    setItem(KEYS.syncLog, items);
    notifyListeners();
    return entry;
  },

  async updateSyncLog(id: string, data: Partial<SyncLogEntry>) {
    const items = getItem<SyncLogEntry>(KEYS.syncLog);
    const idx = items.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error("Sync log not found");
    items[idx] = { ...items[idx], ...data };
    setItem(KEYS.syncLog, items);
    notifyListeners();
    return items[idx];
  },
};
