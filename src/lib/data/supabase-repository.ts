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
};
