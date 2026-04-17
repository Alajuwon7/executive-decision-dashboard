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
  addEmployee(data: CreateEmployee): Promise<Employee>;
  updateEmployee(id: string, data: Partial<Employee>): Promise<Employee>;
  deleteEmployee(id: string): Promise<void>;

  getLayout(): DashboardLayout | null;
  saveLayout(layout: DashboardLayout): void;

  onChange(callback: () => void): () => void;

  getOODADecisions(status?: string): Promise<OODADecision[]>;
  getOODADecision(id: string): Promise<OODADecision | null>;
  createOODADecision(data: CreateOODADecision): Promise<OODADecision>;
  updateOODADecision(id: string, data: Partial<OODADecision>): Promise<OODADecision>;
  addDecisionLogEntry(data: CreateDecisionLogEntry): Promise<DecisionLogEntry>;
  getDecisionLog(decisionId: string): Promise<DecisionLogEntry[]>;

  // Phase 4: Goals
  getGoals(): Promise<Goal[]>;
  createGoal(data: CreateGoal): Promise<Goal>;
  updateGoal(id: string, data: Partial<Goal>): Promise<Goal>;
  deleteGoal(id: string): Promise<void>;

  getMilestones(goalId?: string): Promise<GoalMilestone[]>;
  createMilestone(data: CreateGoalMilestone): Promise<GoalMilestone>;
  updateMilestone(id: string, data: Partial<GoalMilestone>): Promise<GoalMilestone>;
  deleteMilestone(id: string): Promise<void>;

  getPatternAlerts(): Promise<PatternAlert[]>;
  createPatternAlert(data: CreatePatternAlert): Promise<PatternAlert>;
  dismissPatternAlert(id: string): Promise<void>;

  getPersonalDraw(): Promise<PersonalDraw>;
  setPersonalDraw(draw: PersonalDraw): Promise<void>;

  // Phase 6: Scenarios
  getScenarios(): Promise<Scenario[]>;
  createScenario(data: CreateScenario): Promise<Scenario>;
  updateScenario(id: string, data: Partial<Scenario>): Promise<Scenario>;
  deleteScenario(id: string): Promise<void>;

  // Phase 6: Pulse alerts
  getPulseAlerts(): Promise<PulseAlert[]>;
  createPulseAlert(data: CreatePulseAlert): Promise<PulseAlert>;
  markPulseAlertRead(id: string): Promise<void>;
  dismissPulseAlert(id: string): Promise<void>;

  // Phase 5A: Integrations
  getIntegrations(businessId?: string): Promise<BusinessIntegration[]>;
  getIntegration(businessId: string, provider: string): Promise<BusinessIntegration | null>;
  upsertIntegration(data: CreateBusinessIntegration): Promise<BusinessIntegration>;
  updateIntegration(id: string, data: Partial<BusinessIntegration>): Promise<BusinessIntegration>;
  deactivateIntegration(id: string): Promise<void>;
  getSyncLog(integrationId: string, limit?: number): Promise<SyncLogEntry[]>;
  createSyncLog(data: CreateSyncLogEntry): Promise<SyncLogEntry>;
  updateSyncLog(id: string, data: Partial<SyncLogEntry>): Promise<SyncLogEntry>;
}
