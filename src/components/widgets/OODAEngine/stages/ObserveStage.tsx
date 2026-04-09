"use client";
import { useMemo } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatCompactCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/formatters";
import type { FinancialSnapshot } from "@/lib/data/ooda-types";
import type { Employee } from "@/lib/data/types";
import { Clock, Building2, Users, DollarSign } from "lucide-react";

interface ObserveStageProps {
  snapshot: FinancialSnapshot;
  relatedEmployee?: Employee | null;
  decisionType: string;
  onContinue: () => void;
}

export function ObserveStage({ snapshot, relatedEmployee, decisionType, onContinue }: ObserveStageProps) {
  return (
    <div>
      {/* Snapshot notice */}
      <div className="flex items-center gap-2 mb-5 text-xs text-text-muted">
        <Clock className="w-3.5 h-3.5" />
        <span>Snapshot taken: {formatDate(snapshot.timestamp)}</span>
        <Badge className="text-[10px]">Read-only</Badge>
      </div>

      {/* Related employee highlight (for termination) */}
      {decisionType === "termination" && relatedEmployee && (
        <div className="border-l-4 border-accent bg-surface-elevated rounded-r-[12px] p-4 mb-5">
          <p className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-2">Employee Under Review</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-bold text-text-primary">{relatedEmployee.name}</p>
              <p className="text-sm text-text-muted">{relatedEmployee.roleTitle}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-lg font-bold text-accent">
                {formatCurrency(relatedEmployee.rate, relatedEmployee.currency)}
                {relatedEmployee.compensationType === "hourly" ? "/hr" : "/yr"}
              </p>
              <p className="text-xs text-text-muted">
                {relatedEmployee.compensationType === "hourly"
                  ? `${relatedEmployee.hoursPerWeek ?? 0} hrs/wk`
                  : "Salaried"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Consolidated P&L */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5" /> Consolidated P&L
        </p>
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Revenue", value: snapshot.consolidated.totalRevenue },
            { label: "Expenses", value: snapshot.consolidated.totalExpenses },
            { label: "Payroll", value: snapshot.consolidated.totalPayroll },
            { label: "Net Profit", value: snapshot.consolidated.netProfit },
            { label: "Payroll Ratio", value: null, display: `${snapshot.consolidated.payrollToRevenueRatio.toFixed(1)}%` },
          ].map((item) => (
            <div key={item.label} className="bg-bg rounded-[10px] p-3 text-center">
              <p className="text-[10px] text-text-faint uppercase tracking-wider mb-1">{item.label}</p>
              <p className="font-mono text-sm font-semibold text-text-primary">
                {item.display ?? formatCompactCurrency(item.value!)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Business breakdown */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" /> Business Breakdown
        </p>
        <div className="space-y-2">
          {snapshot.businesses.map((biz) => (
            <div key={biz.id} className="flex items-center justify-between bg-bg rounded-[10px] p-3">
              <div>
                <p className="text-sm font-semibold text-text-secondary">{biz.name}</p>
                <p className="text-xs text-text-muted">{biz.employeeCount} employees</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-semibold text-text-primary">{formatCompactCurrency(biz.revenue)}</p>
                <p className="text-xs text-text-muted">revenue</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Employee payroll summary */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> Payroll Summary
        </p>
        <div className="space-y-1.5">
          {snapshot.employees.map((emp) => (
            <div key={emp.id} className="flex items-center justify-between px-3 py-2 rounded-[8px] hover:bg-surface-elevated transition-colors">
              <div className="flex-1 min-w-0">
                <span className="text-sm text-text-secondary">{emp.name}</span>
                <span className="text-xs text-text-muted ml-2">{emp.roleTitle}</span>
              </div>
              <span className="font-mono text-sm text-text-primary shrink-0">{formatCompactCurrency(emp.monthlyCost)}/mo</span>
            </div>
          ))}
        </div>
      </div>

      {/* Continue button */}
      <div className="flex justify-end pt-4 border-t border-border">
        <Button onClick={onContinue}>
          Continue to Analysis →
        </Button>
      </div>
    </div>
  );
}
