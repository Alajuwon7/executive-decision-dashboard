export const SYSTEM_PROMPT = `You are an executive business analyst for a small multi-business portfolio. You provide direct, data-driven analysis with concrete dollar figures. You never hedge or use vague language. Every recommendation includes specific numbers, timelines, and implementation steps.

When analyzing workforce decisions, you evaluate:
1. The financial impact (monthly/annual savings or costs)
2. What tasks this role handles and which can be automated with AI tools
3. The risk of removing or changing this role
4. Concrete alternatives ranked by net financial impact

When analyzing purchase decisions, you evaluate:
1. Whether the business can afford it based on current cash flow
2. What trade-offs are required (reduced spending, increased revenue)
3. Timeline feasibility
4. Alternative approaches to achieve the same goal

Always respond in valid JSON matching the requested schema. No markdown, no preamble, no explanation outside the JSON structure.`;

export function buildOrientPrompt(type: string, snapshot: any, employee?: any, employeeROI?: any): string {
  if (type === "termination") {
    return `Given the following business snapshot and employee data, provide a termination assessment.

BUSINESS SNAPSHOT:
${JSON.stringify(snapshot, null, 2)}

EMPLOYEE UNDER REVIEW:
${JSON.stringify(employee, null, 2)}
${employeeROI ? `\nEMPLOYEE ROI SCORE (factor this into your risk + recommendation — lower ROI suggests termination is lower-risk):\n${JSON.stringify(employeeROI, null, 2)}` : ""}

Respond with this exact JSON structure:
{
  "roleImpactSummary": {
    "overview": "2-3 sentence summary of what this person does",
    "taskBreakdown": [
      { "task": "task name", "hoursPerWeek": number, "category": "client-facing|operational|administrative|technical" }
    ]
  },
  "automationAssessment": {
    "automatable": [
      { "task": "task name", "tool": "specific AI tool or service", "monthlyCost": number, "confidence": "high|medium|low" }
    ],
    "requiresHuman": [
      { "task": "task name", "reason": "why it cannot be automated" }
    ],
    "totalAutomationCost": number,
    "automationSavingsVsSalary": number
  },
  "financialTradeoffMatrix": {
    "currentMonthlyCost": number,
    "savingsIfTerminated": number,
    "replacementCosts": {
      "aiTools": number,
      "contractor": number,
      "redistributedWorkload": "description of impact on remaining team"
    }
  },
  "riskAssessment": {
    "immediateRisks": ["risk 1", "risk 2"],
    "mitigationStrategies": ["strategy 1", "strategy 2"],
    "overallRiskLevel": "low|medium|high"
  },
  "recommendation": "1-2 sentence direct recommendation"
}`;
  }

  if (type === "large_purchase") {
    return `Given the following business snapshot, evaluate whether this purchase is financially feasible.

BUSINESS SNAPSHOT:
${JSON.stringify(snapshot, null, 2)}

PROPOSED PURCHASE:
${JSON.stringify(employee, null, 2)}

Respond with this exact JSON structure:
{
  "feasibilityAssessment": {
    "canAfford": true or false,
    "monthlyBudgetImpact": number,
    "monthsToSave": number,
    "requiredMonthlySurplus": number,
    "currentMonthlySurplus": number,
    "gapAmount": number
  },
  "tradeOffs": [
    { "action": "what to change", "savings": number, "impact": "consequence" }
  ],
  "alternativeApproaches": [
    { "approach": "description", "totalCost": number, "timeline": "timeframe" }
  ],
  "recommendation": "1-2 sentence direct recommendation"
}`;
  }

  // Generic for new_hire, new_business, new_product, partnership, other
  return `Given the following business snapshot, evaluate this proposed initiative.

BUSINESS SNAPSHOT:
${JSON.stringify(snapshot, null, 2)}

PROPOSED INITIATIVE:
Type: ${type}
Details: ${JSON.stringify(employee, null, 2)}

Respond with this exact JSON structure:
{
  "feasibilityAssessment": {
    "financiallyViable": true or false,
    "estimatedMonthlyCost": number,
    "estimatedMonthlyRevenue": number,
    "breakEvenTimeline": "timeframe",
    "requiredUpfrontInvestment": number
  },
  "strategicAnalysis": {
    "strengths": ["strength 1", "strength 2"],
    "risks": ["risk 1", "risk 2"],
    "dependencies": ["dependency 1"],
    "marketContext": "1-2 sentence market observation"
  },
  "implementationRoadmap": [
    { "phase": "Phase 1", "duration": "timeframe", "actions": ["action 1"], "cost": number }
  ],
  "recommendation": "1-2 sentence direct recommendation"
}`;
}

export function buildWhatWouldItTakePrompt(goal: any, snapshot: any, feasibility: any): string {
  return `Given the following financial snapshot and an at-risk goal, generate 3-5 concrete, actionable recovery paths. Each path must include specific dollar amounts, timelines, and implementation steps. Be direct and specific — no vague suggestions.

FINANCIAL SNAPSHOT:
${JSON.stringify(snapshot, null, 2)}

AT-RISK GOAL:
Title: ${goal.title}
Type: ${goal.type}
Target: $${goal.targetValue ?? 0} by ${goal.targetDate ?? "(no date)"}
Current Progress: $${goal.currentValue ?? 0}
Monthly Surplus Available: $${feasibility.currentMonthlySurplus ?? 0}
Monthly Target Needed: $${feasibility.monthlyTarget ?? 0}
Monthly Gap: $${feasibility.gap ?? 0}

Respond with this exact JSON structure:
{
  "cards": [
    {
      "title": "short action title",
      "description": "1-2 sentence description of what to do",
      "category": "reduce_cost|increase_revenue|restructure|timeline_shift",
      "monthlySavingsOrRevenue": number,
      "implementationSteps": ["step 1", "step 2", "step 3"],
      "timeToImpact": "e.g., Immediate, 2 weeks, 1 month",
      "difficulty": "easy|medium|hard",
      "newProjectedDate": "YYYY-MM-DD or null"
    }
  ],
  "summary": "1-2 sentence executive summary"
}`;
}

export function buildPatternAnalysisPrompt(snapshot: any): string {
  return `Given the following financial snapshot, identify the most significant patterns and provide executive-level insights.

SNAPSHOT:
${JSON.stringify(snapshot, null, 2)}

Respond with this exact JSON structure:
{
  "insights": [
    {
      "type": "trend|anomaly|opportunity|risk",
      "title": "short title",
      "description": "1-2 sentence insight",
      "severity": "info|warning|critical",
      "suggestedAction": "what to do about it"
    }
  ],
  "overallHealth": "strong|stable|concerning|critical",
  "healthSummary": "2-3 sentence overall financial health assessment"
}`;
}

export function buildDecidePrompt(orientAnalysis: any, snapshot: any): string {
  return `Based on the following analysis, generate 3-5 concrete decision options ranked by net financial impact.

ORIENT ANALYSIS:
${JSON.stringify(orientAnalysis, null, 2)}

BUSINESS CONTEXT:
${JSON.stringify(snapshot, null, 2)}

Respond with this exact JSON structure:
{
  "options": [
    {
      "id": "A",
      "title": "short title",
      "description": "1-2 sentence description",
      "monthlySavings": number,
      "annualImpact": number,
      "implementationSteps": ["step 1", "step 2", "step 3"],
      "risks": ["risk 1"],
      "timeToImplement": "e.g., Immediate, 2 weeks, 1 month",
      "recommended": true or false
    }
  ],
  "summary": "1-2 sentence executive summary of the options landscape"
}`;
}
