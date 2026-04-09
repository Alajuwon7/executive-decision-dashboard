export type DecisionType = "termination" | "large_purchase" | "new_hire" | "new_business" | "new_product" | "partnership" | "other";
export type DecisionStage = "observe" | "orient" | "decide" | "act" | "completed";
export type DecisionStatus = "in_progress" | "decided" | "exported" | "cancelled";
export type VoteChoice = "agree" | "disagree" | "flag";

export interface OODADecision {
  id: string;
  title: string;
  type: DecisionType;
  stage: DecisionStage;
  observeData: Record<string, any>;
  orientAnalysis: Record<string, any>;
  decideOptions: Record<string, any>;
  actOutcome: Record<string, any>;
  adminVotes: Record<string, AdminVote>;
  financialImpact: Record<string, any>;
  aiAutomationAssessment: string | null;
  relatedEmployeeId: string | null;
  relatedBusinessId: string | null;
  status: DecisionStatus;
  decidedBy: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOODADecision {
  title: string;
  type: DecisionType;
  relatedEmployeeId?: string | null;
  relatedBusinessId?: string | null;
  observeData?: Record<string, any>;
}

export interface AdminVote {
  vote: VoteChoice;
  note?: string;
  timestamp: string;
}

export interface DecisionLogEntry {
  id: string;
  oodaDecisionId: string;
  action: string;
  snapshot: Record<string, any>;
  outcomeNotes: string | null;
  performedBy: string | null;
  createdAt: string;
}

export interface CreateDecisionLogEntry {
  oodaDecisionId: string;
  action: string;
  snapshot: Record<string, any>;
  outcomeNotes?: string;
}

export interface FinancialSnapshot {
  timestamp: string;
  consolidated: {
    totalRevenue: number;
    totalExpenses: number;
    totalPayroll: number;
    netProfit: number;
    payrollToRevenueRatio: number;
  };
  businesses: Array<{
    id: string;
    name: string;
    revenue: number;
    expenses: number;
    employeeCount: number;
    payroll: number;
  }>;
  employees: Array<{
    id: string;
    name: string;
    roleTitle: string;
    monthlyCost: number;
    currency: string;
    hoursPerWeek: number | null;
    compensationType: string;
    businessName: string;
  }>;
  expenseCategories: Array<{
    category: string;
    totalMonthly: number;
  }>;
}

export interface DecisionOption {
  id: string;
  title: string;
  description: string;
  monthlySavings: number;
  annualImpact: number;
  implementationSteps: string[];
  risks: string[];
  timeToImplement: string;
  recommended: boolean;
}
