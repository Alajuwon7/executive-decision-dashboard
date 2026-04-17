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
import type {
  OODADecision,
  CreateOODADecision,
  DecisionLogEntry,
  CreateDecisionLogEntry,
} from "./ooda-types";
import { createClient } from "@/lib/supabase/client";

function mapBusiness(row: any): Business {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name ?? row.name,
    currency: row.currency,
    revenueLow: Number(row.revenue_low) || 0,
    revenueHigh: Number(row.revenue_high) || 0,
    status: row.status ?? "active",
    createdAt: row.created_at,
  };
}

function mapEmployee(row: any): Employee {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    roleTitle: row.role_title,
    roleDescription: row.role_description ?? null,
    compensationType: row.compensation_type,
    rate: Number(row.rate),
    currency: row.currency,
    hoursPerWeek: row.hours_per_week ? Number(row.hours_per_week) : null,
    startDate: row.start_date ?? null,
    performanceNotes: row.performance_notes ?? null,
    status: row.status ?? "active",
    createdAt: row.created_at,
  };
}

function mapExpense(row: any): Expense {
  return {
    id: row.id,
    businessId: row.business_id,
    category: row.category,
    name: row.name,
    amount: Number(row.amount),
    currency: row.currency,
    frequency: row.frequency ?? "monthly",
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    source: row.source ?? "manual",
  };
}

function mapRevenue(row: any): RevenueEntry {
  return {
    id: row.id,
    businessId: row.business_id,
    amount: Number(row.amount),
    currency: row.currency,
    source: row.source ?? "manual",
    description: row.description ?? "",
    date: row.date,
    createdAt: row.created_at,
  };
}

function mapOODADecision(row: any): OODADecision {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    stage: row.stage,
    observeData: row.observe_data ?? {},
    orientAnalysis: row.orient_analysis ?? {},
    decideOptions: row.decide_options ?? {},
    actOutcome: row.act_outcome ?? {},
    adminVotes: row.admin_votes ?? {},
    financialImpact: row.financial_impact ?? {},
    aiAutomationAssessment: row.ai_automation_assessment ?? null,
    relatedEmployeeId: row.related_employee_id ?? null,
    relatedBusinessId: row.related_business_id ?? null,
    status: row.status ?? "in_progress",
    decidedBy: row.decided_by ?? null,
    decidedAt: row.decided_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDecisionLog(row: any): DecisionLogEntry {
  return {
    id: row.id,
    oodaDecisionId: row.ooda_decision_id,
    action: row.action,
    snapshot: row.snapshot ?? {},
    outcomeNotes: row.outcome_notes ?? null,
    performedBy: row.performed_by ?? null,
    createdAt: row.created_at,
  };
}

function mapGoal(row: any): Goal {
  return {
    id: row.id,
    owner: row.owner,
    title: row.title,
    description: row.description ?? null,
    type: row.type,
    targetValue: row.target_value !== null && row.target_value !== undefined ? Number(row.target_value) : null,
    targetDate: row.target_date ?? null,
    currentValue: Number(row.current_value ?? 0),
    status: row.status ?? "active",
    dependencies: Array.isArray(row.dependencies) ? row.dependencies : [],
    metadata: row.metadata ?? {},
    feasibility: row.feasibility && Object.keys(row.feasibility).length > 0 ? row.feasibility : null,
    lastFeasibilityCheck: row.last_feasibility_check ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMilestone(row: any): GoalMilestone {
  return {
    id: row.id,
    goalId: row.goal_id,
    title: row.title,
    targetDate: row.target_date ?? null,
    isCompleted: row.is_completed ?? false,
    completedAt: row.completed_at ?? null,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
  };
}

function mapPatternAlert(row: any): PatternAlert {
  return {
    id: row.id,
    type: row.type,
    severity: row.severity,
    title: row.title,
    message: row.message,
    data: row.data ?? {},
    relatedGoalId: row.related_goal_id ?? null,
    isRead: row.is_read ?? false,
    isDismissed: row.is_dismissed ?? false,
    createdAt: row.created_at,
  };
}

function mapScenario(row: any): Scenario {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    baseSnapshot: row.base_snapshot ?? {},
    modifications: Array.isArray(row.modifications) ? row.modifications : [],
    projectedOutcome: row.projected_outcome && Object.keys(row.projected_outcome).length > 0 ? row.projected_outcome : null,
    monteCarloResults: row.monte_carlo_results && Object.keys(row.monte_carlo_results).length > 0 ? row.monte_carlo_results : null,
    probabilityScore: row.probability_score !== null && row.probability_score !== undefined ? Number(row.probability_score) : null,
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapIntegration(row: any): BusinessIntegration {
  return {
    id: row.id,
    businessId: row.business_id,
    provider: row.provider,
    tokenExpiresAt: row.token_expires_at ?? null,
    realmId: row.realm_id ?? null,
    externalAccountId: row.external_account_id ?? null,
    lastSyncAt: row.last_sync_at ?? null,
    lastSyncStatus: row.last_sync_status ?? null,
    lastSyncError: row.last_sync_error ?? null,
    isActive: row.is_active ?? true,
    syncFrequency: row.sync_frequency ?? "15min",
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSyncLog(row: any): SyncLogEntry {
  return {
    id: row.id,
    integrationId: row.integration_id,
    businessId: row.business_id,
    provider: row.provider,
    syncType: row.sync_type,
    status: row.status,
    recordsFetched: row.records_fetched ?? 0,
    recordsCreated: row.records_created ?? 0,
    recordsUpdated: row.records_updated ?? 0,
    recordsSkipped: row.records_skipped ?? 0,
    errorsCount: row.errors_count ?? 0,
    errorDetails: row.error_details ?? [],
    metadata: row.metadata ?? {},
    startedAt: row.started_at,
    completedAt: row.completed_at ?? null,
  };
}

function mapPulseAlert(row: any): PulseAlert {
  return {
    id: row.id,
    type: row.type,
    severity: row.severity,
    title: row.title,
    message: row.message,
    data: row.data ?? {},
    relatedGoalId: row.related_goal_id ?? null,
    relatedEmployeeId: row.related_employee_id ?? null,
    relatedBusinessId: row.related_business_id ?? null,
    relatedDecisionId: row.related_decision_id ?? null,
    isRead: row.is_read ?? false,
    isDismissed: row.is_dismissed ?? false,
    createdAt: row.created_at,
  };
}

let listeners: (() => void)[] = [];

function notifyListeners() {
  listeners.forEach((cb) => cb());
}

export const supabaseRepository: DataRepository = {
  async getBusinesses() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .order("created_at");
    if (error) throw error;
    return (data ?? []).map(mapBusiness);
  },

  async addBusiness(input: CreateBusiness) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("businesses")
      .insert({
        name: input.name,
        display_name: input.displayName,
        currency: input.currency,
        revenue_low: input.revenueLow,
        revenue_high: input.revenueHigh,
      })
      .select()
      .single();
    if (error) throw error;
    notifyListeners();
    return mapBusiness(data);
  },

  async updateBusiness(id: string, input: Partial<Business>) {
    const supabase = createClient();
    const updates: any = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.displayName !== undefined) updates.display_name = input.displayName;
    if (input.currency !== undefined) updates.currency = input.currency;
    if (input.revenueLow !== undefined) updates.revenue_low = input.revenueLow;
    if (input.revenueHigh !== undefined) updates.revenue_high = input.revenueHigh;
    if (input.status !== undefined) updates.status = input.status;

    const { data, error } = await supabase
      .from("businesses")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    notifyListeners();
    return mapBusiness(data);
  },

  async getExpenses(businessId?: string) {
    const supabase = createClient();
    let query = supabase.from("expenses").select("*").order("created_at");
    if (businessId) query = query.eq("business_id", businessId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapExpense);
  },

  async addExpense(input: CreateExpense) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        business_id: input.businessId,
        category: input.category,
        name: input.name,
        amount: input.amount,
        currency: input.currency,
        frequency: input.frequency,
      })
      .select()
      .single();
    if (error) throw error;
    notifyListeners();
    return mapExpense(data);
  },

  async deleteExpense(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) throw error;
    notifyListeners();
  },

  async getRevenueEntries(businessId?: string) {
    const supabase = createClient();
    let query = supabase.from("revenue_entries").select("*").order("date");
    if (businessId) query = query.eq("business_id", businessId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapRevenue);
  },

  async addRevenue(input: CreateRevenue) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("revenue_entries")
      .insert({
        business_id: input.businessId,
        amount: input.amount,
        currency: input.currency,
        source: input.source,
        description: input.description,
        date: input.date,
      })
      .select()
      .single();
    if (error) throw error;
    notifyListeners();
    return mapRevenue(data);
  },

  async deleteRevenue(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("revenue_entries")
      .delete()
      .eq("id", id);
    if (error) throw error;
    notifyListeners();
  },

  async getEmployees(businessId?: string) {
    const supabase = createClient();
    let query = supabase.from("employees").select("*").order("created_at");
    if (businessId) query = query.eq("business_id", businessId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapEmployee);
  },

  async addEmployee(input: CreateEmployee) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("employees")
      .insert({
        business_id: input.businessId,
        name: input.name,
        role_title: input.roleTitle,
        role_description: input.roleDescription ?? null,
        compensation_type: input.compensationType,
        rate: input.rate,
        currency: input.currency,
        hours_per_week: input.hoursPerWeek,
        start_date: input.startDate ?? null,
        performance_notes: input.performanceNotes ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    notifyListeners();
    return mapEmployee(data);
  },

  async updateEmployee(id: string, input: Partial<Employee>) {
    const supabase = createClient();
    const updates: any = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.roleTitle !== undefined) updates.role_title = input.roleTitle;
    if (input.roleDescription !== undefined) updates.role_description = input.roleDescription;
    if (input.compensationType !== undefined) updates.compensation_type = input.compensationType;
    if (input.rate !== undefined) updates.rate = input.rate;
    if (input.currency !== undefined) updates.currency = input.currency;
    if (input.hoursPerWeek !== undefined) updates.hours_per_week = input.hoursPerWeek;
    if (input.startDate !== undefined) updates.start_date = input.startDate;
    if (input.performanceNotes !== undefined) updates.performance_notes = input.performanceNotes;
    if (input.status !== undefined) updates.status = input.status;

    const { data, error } = await supabase
      .from("employees")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    notifyListeners();
    return mapEmployee(data);
  },

  async deleteEmployee(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) throw error;
    notifyListeners();
  },

  getLayout() {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("edi_layout");
    return raw ? JSON.parse(raw) : null;
  },

  saveLayout(layout: DashboardLayout) {
    localStorage.setItem("edi_layout", JSON.stringify(layout));
  },

  onChange(callback: () => void) {
    listeners.push(callback);
    return () => {
      listeners = listeners.filter((cb) => cb !== callback);
    };
  },

  async getOODADecisions(status?: string) {
    const supabase = createClient();
    let query = supabase.from("ooda_decisions").select("*").order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapOODADecision);
  },

  async getOODADecision(id: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ooda_decisions")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return mapOODADecision(data);
  },

  async createOODADecision(input: CreateOODADecision) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ooda_decisions")
      .insert({
        title: input.title,
        type: input.type,
        related_employee_id: input.relatedEmployeeId ?? null,
        related_business_id: input.relatedBusinessId ?? null,
        observe_data: input.observeData ?? {},
      })
      .select()
      .single();
    if (error) throw error;
    notifyListeners();
    return mapOODADecision(data);
  },

  async updateOODADecision(id: string, input: Partial<OODADecision>) {
    const supabase = createClient();
    const updates: any = {};
    if (input.stage !== undefined) updates.stage = input.stage;
    if (input.observeData !== undefined) updates.observe_data = input.observeData;
    if (input.orientAnalysis !== undefined) updates.orient_analysis = input.orientAnalysis;
    if (input.decideOptions !== undefined) updates.decide_options = input.decideOptions;
    if (input.actOutcome !== undefined) updates.act_outcome = input.actOutcome;
    if (input.adminVotes !== undefined) updates.admin_votes = input.adminVotes;
    if (input.financialImpact !== undefined) updates.financial_impact = input.financialImpact;
    if (input.aiAutomationAssessment !== undefined) updates.ai_automation_assessment = input.aiAutomationAssessment;
    if (input.status !== undefined) updates.status = input.status;
    if (input.decidedBy !== undefined) updates.decided_by = input.decidedBy;
    if (input.decidedAt !== undefined) updates.decided_at = input.decidedAt;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("ooda_decisions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    notifyListeners();
    return mapOODADecision(data);
  },

  async deleteOODADecision(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("ooda_decisions").delete().eq("id", id);
    if (error) throw error;
    notifyListeners();
  },

  async addDecisionLogEntry(input: CreateDecisionLogEntry) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("decision_log")
      .insert({
        ooda_decision_id: input.oodaDecisionId,
        action: input.action,
        snapshot: input.snapshot,
        outcome_notes: input.outcomeNotes ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    notifyListeners();
    return mapDecisionLog(data);
  },

  async getDecisionLog(decisionId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("decision_log")
      .select("*")
      .eq("ooda_decision_id", decisionId)
      .order("created_at");
    if (error) throw error;
    return (data ?? []).map(mapDecisionLog);
  },

  async getGoals() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapGoal);
  },

  async createGoal(input: CreateGoal) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("goals")
      .insert({
        owner: input.owner,
        title: input.title,
        description: input.description ?? null,
        type: input.type,
        target_value: input.targetValue ?? null,
        target_date: input.targetDate ?? null,
        current_value: input.currentValue ?? 0,
        dependencies: input.dependencies ?? [],
        metadata: input.metadata ?? {},
      })
      .select()
      .single();
    if (error) throw error;
    notifyListeners();
    return mapGoal(data);
  },

  async updateGoal(id: string, input: Partial<Goal>) {
    const supabase = createClient();
    const updates: any = {};
    if (input.owner !== undefined) updates.owner = input.owner;
    if (input.title !== undefined) updates.title = input.title;
    if (input.description !== undefined) updates.description = input.description;
    if (input.type !== undefined) updates.type = input.type;
    if (input.targetValue !== undefined) updates.target_value = input.targetValue;
    if (input.targetDate !== undefined) updates.target_date = input.targetDate;
    if (input.currentValue !== undefined) updates.current_value = input.currentValue;
    if (input.status !== undefined) updates.status = input.status;
    if (input.dependencies !== undefined) updates.dependencies = input.dependencies;
    if (input.metadata !== undefined) updates.metadata = input.metadata;
    if (input.feasibility !== undefined) updates.feasibility = input.feasibility ?? {};
    if (input.lastFeasibilityCheck !== undefined) updates.last_feasibility_check = input.lastFeasibilityCheck;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("goals")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    notifyListeners();
    return mapGoal(data);
  },

  async deleteGoal(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (error) throw error;
    notifyListeners();
  },

  async getMilestones(goalId?: string) {
    const supabase = createClient();
    let query = supabase.from("goal_milestones").select("*").order("sort_order");
    if (goalId) query = query.eq("goal_id", goalId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapMilestone);
  },

  async createMilestone(input: CreateGoalMilestone) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("goal_milestones")
      .insert({
        goal_id: input.goalId,
        title: input.title,
        target_date: input.targetDate ?? null,
        sort_order: input.sortOrder ?? 0,
      })
      .select()
      .single();
    if (error) throw error;
    notifyListeners();
    return mapMilestone(data);
  },

  async updateMilestone(id: string, input: Partial<GoalMilestone>) {
    const supabase = createClient();
    const updates: any = {};
    if (input.title !== undefined) updates.title = input.title;
    if (input.targetDate !== undefined) updates.target_date = input.targetDate;
    if (input.isCompleted !== undefined) {
      updates.is_completed = input.isCompleted;
      updates.completed_at = input.isCompleted ? new Date().toISOString() : null;
    }
    if (input.sortOrder !== undefined) updates.sort_order = input.sortOrder;

    const { data, error } = await supabase
      .from("goal_milestones")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    notifyListeners();
    return mapMilestone(data);
  },

  async deleteMilestone(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("goal_milestones").delete().eq("id", id);
    if (error) throw error;
    notifyListeners();
  },

  async getPatternAlerts() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("pattern_alerts")
      .select("*")
      .eq("is_dismissed", false)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapPatternAlert);
  },

  async createPatternAlert(input: CreatePatternAlert) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("pattern_alerts")
      .insert({
        type: input.type,
        severity: input.severity,
        title: input.title,
        message: input.message,
        data: input.data ?? {},
        related_goal_id: input.relatedGoalId ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    notifyListeners();
    return mapPatternAlert(data);
  },

  async dismissPatternAlert(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("pattern_alerts")
      .update({ is_dismissed: true })
      .eq("id", id);
    if (error) throw error;
    notifyListeners();
  },

  async getPersonalDraw() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("dashboard_layouts")
      .select("personal_draw")
      .limit(1)
      .maybeSingle();
    if (error || !data) return { his: 0, hers: 0 };
    const pd = (data as any).personal_draw ?? {};
    return { his: Number(pd.his ?? 0), hers: Number(pd.hers ?? 0) };
  },

  async setPersonalDraw(draw: PersonalDraw) {
    const supabase = createClient();
    const { data: existing } = await supabase
      .from("dashboard_layouts")
      .select("id")
      .limit(1)
      .maybeSingle();
    if (existing) {
      await supabase
        .from("dashboard_layouts")
        .update({ personal_draw: draw })
        .eq("id", (existing as any).id);
    } else {
      await supabase
        .from("dashboard_layouts")
        .insert({ personal_draw: draw, layout_config: {} });
    }
    notifyListeners();
  },

  async getScenarios() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("scenarios")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapScenario);
  },

  async createScenario(input: CreateScenario) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("scenarios")
      .insert({
        name: input.name,
        description: input.description ?? null,
        base_snapshot: input.baseSnapshot,
        modifications: input.modifications,
        projected_outcome: input.projectedOutcome ?? {},
        monte_carlo_results: input.monteCarloResults ?? {},
        probability_score: input.probabilityScore ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    notifyListeners();
    return mapScenario(data);
  },

  async updateScenario(id: string, input: Partial<Scenario>) {
    const supabase = createClient();
    const updates: any = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.description !== undefined) updates.description = input.description;
    if (input.modifications !== undefined) updates.modifications = input.modifications;
    if (input.projectedOutcome !== undefined) updates.projected_outcome = input.projectedOutcome ?? {};
    if (input.monteCarloResults !== undefined) updates.monte_carlo_results = input.monteCarloResults ?? {};
    if (input.probabilityScore !== undefined) updates.probability_score = input.probabilityScore;
    if (input.isActive !== undefined) updates.is_active = input.isActive;
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from("scenarios")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    notifyListeners();
    return mapScenario(data);
  },

  async deleteScenario(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("scenarios").delete().eq("id", id);
    if (error) throw error;
    notifyListeners();
  },

  async getPulseAlerts() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("pulse_alerts")
      .select("*")
      .eq("is_dismissed", false)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapPulseAlert);
  },

  async createPulseAlert(input: CreatePulseAlert) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("pulse_alerts")
      .insert({
        type: input.type,
        severity: input.severity,
        title: input.title,
        message: input.message,
        data: input.data ?? {},
        related_goal_id: input.relatedGoalId ?? null,
        related_employee_id: input.relatedEmployeeId ?? null,
        related_business_id: input.relatedBusinessId ?? null,
        related_decision_id: input.relatedDecisionId ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    notifyListeners();
    return mapPulseAlert(data);
  },

  async markPulseAlertRead(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("pulse_alerts")
      .update({ is_read: true })
      .eq("id", id);
    if (error) throw error;
    notifyListeners();
  },

  async dismissPulseAlert(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("pulse_alerts")
      .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    notifyListeners();
  },

  async getIntegrations(businessId?: string) {
    const supabase = createClient();
    let query = supabase.from("business_integrations").select("*").order("created_at");
    if (businessId) query = query.eq("business_id", businessId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapIntegration);
  },

  async getIntegration(businessId: string, provider: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("business_integrations")
      .select("*")
      .eq("business_id", businessId)
      .eq("provider", provider)
      .maybeSingle();
    if (error) throw error;
    return data ? mapIntegration(data) : null;
  },

  async upsertIntegration(input: CreateBusinessIntegration) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("business_integrations")
      .upsert(
        {
          business_id: input.businessId,
          provider: input.provider,
          access_token: input.accessToken,
          refresh_token: input.refreshToken,
          token_expires_at: input.tokenExpiresAt,
          realm_id: input.realmId ?? null,
          external_account_id: input.externalAccountId ?? null,
          is_active: true,
          sync_frequency: input.syncFrequency ?? "15min",
          metadata: input.metadata ?? {},
          last_sync_status: "pending",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "business_id,provider" }
      )
      .select()
      .single();
    if (error) throw error;
    notifyListeners();
    return mapIntegration(data);
  },

  async updateIntegration(id: string, input: Partial<BusinessIntegration>) {
    const supabase = createClient();
    const updates: any = {};
    if (input.lastSyncAt !== undefined) updates.last_sync_at = input.lastSyncAt;
    if (input.lastSyncStatus !== undefined) updates.last_sync_status = input.lastSyncStatus;
    if (input.lastSyncError !== undefined) updates.last_sync_error = input.lastSyncError;
    if (input.isActive !== undefined) updates.is_active = input.isActive;
    if (input.syncFrequency !== undefined) updates.sync_frequency = input.syncFrequency;
    if (input.metadata !== undefined) updates.metadata = input.metadata;
    if (input.tokenExpiresAt !== undefined) updates.token_expires_at = input.tokenExpiresAt;
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from("business_integrations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    notifyListeners();
    return mapIntegration(data);
  },

  async deactivateIntegration(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("business_integrations")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    notifyListeners();
  },

  async getSyncLog(integrationId: string, limit = 20) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sync_log")
      .select("*")
      .eq("integration_id", integrationId)
      .order("started_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(mapSyncLog);
  },

  async createSyncLog(input: CreateSyncLogEntry) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sync_log")
      .insert({
        integration_id: input.integrationId,
        business_id: input.businessId,
        provider: input.provider,
        sync_type: input.syncType,
        status: input.status,
      })
      .select()
      .single();
    if (error) throw error;
    return mapSyncLog(data);
  },

  async updateSyncLog(id: string, input: Partial<SyncLogEntry>) {
    const supabase = createClient();
    const updates: any = {};
    if (input.status !== undefined) updates.status = input.status;
    if (input.recordsFetched !== undefined) updates.records_fetched = input.recordsFetched;
    if (input.recordsCreated !== undefined) updates.records_created = input.recordsCreated;
    if (input.recordsUpdated !== undefined) updates.records_updated = input.recordsUpdated;
    if (input.recordsSkipped !== undefined) updates.records_skipped = input.recordsSkipped;
    if (input.errorsCount !== undefined) updates.errors_count = input.errorsCount;
    if (input.errorDetails !== undefined) updates.error_details = input.errorDetails;
    if (input.completedAt !== undefined) updates.completed_at = input.completedAt;
    const { data, error } = await supabase
      .from("sync_log")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapSyncLog(data);
  },
};
