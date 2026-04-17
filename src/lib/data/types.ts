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
  source?: string;
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

// ─── Phase 4: Goals ──────────────────────────────────────────────

export type GoalOwner = "his" | "hers" | "shared" | "company";
export type GoalType = "personal" | "company" | "operational";
export type GoalStatus = "active" | "achieved" | "at_risk" | "behind" | "abandoned";

export interface GoalMetadata {
  itemName?: string;
  estimatedPrice?: number;
  downPayment?: number;
  financeMonths?: number;
  revenueTarget?: number;
  isMilestoneBased?: boolean;
  relatedBusinessId?: string;
  notes?: string;
  category?: string;
  wwitCards?: WhatWouldItTakeCard[];
  wwitGeneratedAt?: string;
  wwitGapAtGeneration?: number;
}

export interface FeasibilityBreakdown {
  totalRevenue: number;
  totalExpenses: number;
  totalPayroll: number;
  personalDraw: number;
  availableSurplus: number;
}

export interface FeasibilityResult {
  isAchievable: boolean;
  monthlyTarget: number;
  currentMonthlySurplus: number;
  gap: number;
  monthsNeeded: number;
  monthsRemaining: number;
  projectedAchieveDate: string | null;
  confidence: "high" | "medium" | "low";
  breakdown: FeasibilityBreakdown;
  calculatedAt: string;
  note?: string;
}

export interface Goal {
  id: string;
  owner: GoalOwner;
  title: string;
  description: string | null;
  type: GoalType;
  targetValue: number | null;
  targetDate: string | null;
  currentValue: number;
  status: GoalStatus;
  dependencies: string[];
  metadata: GoalMetadata;
  feasibility: FeasibilityResult | null;
  lastFeasibilityCheck: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoal {
  owner: GoalOwner;
  title: string;
  description?: string;
  type: GoalType;
  targetValue?: number;
  targetDate?: string;
  currentValue?: number;
  dependencies?: string[];
  metadata?: GoalMetadata;
}

export interface GoalMilestone {
  id: string;
  goalId: string;
  title: string;
  targetDate: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface CreateGoalMilestone {
  goalId: string;
  title: string;
  targetDate?: string;
  sortOrder?: number;
}

export type PatternAlertKind =
  | "spending_trend"
  | "revenue_momentum"
  | "goal_pacing"
  | "anomaly"
  | "ratio_breach";

export type PatternAlertSeverity = "info" | "warning" | "critical";

export interface PatternAlert {
  id: string;
  type: PatternAlertKind;
  severity: PatternAlertSeverity;
  title: string;
  message: string;
  data: Record<string, any>;
  relatedGoalId: string | null;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
}

export interface CreatePatternAlert {
  type: PatternAlertKind;
  severity: PatternAlertSeverity;
  title: string;
  message: string;
  data?: Record<string, any>;
  relatedGoalId?: string | null;
}

export interface WhatWouldItTakeCard {
  id: string;
  title: string;
  description: string;
  category: "reduce_cost" | "increase_revenue" | "restructure" | "timeline_shift";
  monthlySavingsOrRevenue: number;
  implementationSteps: string[];
  timeToImpact: string;
  difficulty: "easy" | "medium" | "hard";
  newProjectedDate: string | null;
}

export interface WWITResponse {
  cards: WhatWouldItTakeCard[];
  summary: string;
}

export interface PersonalDraw {
  his: number;
  hers: number;
}

// ─── Phase 6: Scenarios + Pulse ──────────────────────────────────

export type ScenarioModification =
  | { type: "adjust_employee"; employeeId: string; employeeName: string; field: "hoursPerWeek" | "rate"; oldValue: number; newValue: number }
  | { type: "remove_employee"; employeeId: string; employeeName: string; monthlySavings: number }
  | { type: "add_employee"; name: string; role: string; monthlyCost: number }
  | { type: "adjust_expense"; expenseId: string; expenseName: string; oldAmount: number; newAmount: number }
  | { type: "remove_expense"; expenseId: string; expenseName: string; monthlySavings: number }
  | { type: "add_expense"; name: string; category: string; amount: number }
  | { type: "add_revenue"; description: string; monthlyAmount: number; businessId: string; businessName: string }
  | { type: "adjust_draw"; oldDraw: number; newDraw: number }
  | { type: "custom"; label: string; monthlyImpact: number; description: string };

export interface ScenarioGoalImpact {
  goalId: string;
  goalTitle: string;
  currentProjectedDate: string | null;
  newProjectedDate: string | null;
  isNowAchievable: boolean;
  monthsGained: number;
}

export interface ProjectedOutcome {
  totalRevenue: number;
  totalExpenses: number;
  totalPayroll: number;
  personalDraw: number;
  netProfit: number;
  monthlySurplus: number;
  payrollToRevenueRatio: number;
  revenueDelta: number;
  expenseDelta: number;
  payrollDelta: number;
  surplusDelta: number;
  goalImpacts: ScenarioGoalImpact[];
}

export interface MonteCarloResults {
  simulations: number;
  revenueVariance: {
    mean: number;
    stdDev: number;
    low: number;
    high: number;
  };
  goalProbabilities: Array<{
    goalId: string;
    goalTitle: string;
    targetDate: string;
    probabilityOfSuccess: number;
    p10Date: string;
    p50Date: string;
    p90Date: string;
  }>;
  surplusDistribution: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
  histogram: Array<{ bucketMin: number; bucketMax: number; count: number }>;
}

export interface Scenario {
  id: string;
  name: string;
  description: string | null;
  baseSnapshot: any;
  modifications: ScenarioModification[];
  projectedOutcome: ProjectedOutcome | null;
  monteCarloResults: MonteCarloResults | null;
  probabilityScore: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScenario {
  name: string;
  description?: string;
  baseSnapshot: any;
  modifications: ScenarioModification[];
  projectedOutcome?: ProjectedOutcome;
  monteCarloResults?: MonteCarloResults | null;
  probabilityScore?: number | null;
}

export type PulseAlertKind =
  | "ratio_breach"
  | "goal_at_risk"
  | "spending_trend"
  | "revenue_drop"
  | "revenue_momentum"
  | "anomaly"
  | "decision_stalled"
  | "goal_pacing";

export type PulseSeverity = "info" | "warning" | "critical";

export interface PulseAlert {
  id: string;
  type: PulseAlertKind;
  severity: PulseSeverity;
  title: string;
  message: string;
  data: Record<string, any>;
  relatedGoalId: string | null;
  relatedEmployeeId: string | null;
  relatedBusinessId: string | null;
  relatedDecisionId: string | null;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
}

export interface CreatePulseAlert {
  type: PulseAlertKind;
  severity: PulseSeverity;
  title: string;
  message: string;
  data?: Record<string, any>;
  relatedGoalId?: string | null;
  relatedEmployeeId?: string | null;
  relatedBusinessId?: string | null;
  relatedDecisionId?: string | null;
}

// ─── Phase 5A: Integrations ─────────────────────────────────────

export type IntegrationProvider = "quickbooks" | "stripe" | "outlook";
export type SyncFrequency = "realtime" | "15min" | "hourly" | "daily" | "manual";
export type SyncStatus = "success" | "partial" | "failed" | "pending";
export type SyncLogStatus = "started" | "success" | "partial" | "failed";

export interface BusinessIntegration {
  id: string;
  businessId: string;
  provider: IntegrationProvider;
  tokenExpiresAt: string | null;
  realmId: string | null;
  externalAccountId: string | null;
  lastSyncAt: string | null;
  lastSyncStatus: SyncStatus | null;
  lastSyncError: string | null;
  isActive: boolean;
  syncFrequency: SyncFrequency;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBusinessIntegration {
  businessId: string;
  provider: IntegrationProvider;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: string;
  realmId?: string;
  externalAccountId?: string;
  syncFrequency?: SyncFrequency;
  metadata?: Record<string, any>;
}

export interface SyncLogEntry {
  id: string;
  integrationId: string;
  businessId: string;
  provider: string;
  syncType: "full" | "incremental" | "manual";
  status: SyncLogStatus;
  recordsFetched: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errorsCount: number;
  errorDetails: any[];
  metadata: Record<string, any>;
  startedAt: string;
  completedAt: string | null;
}

export interface CreateSyncLogEntry {
  integrationId: string;
  businessId: string;
  provider: string;
  syncType: "full" | "incremental" | "manual";
  status: SyncLogStatus;
}
