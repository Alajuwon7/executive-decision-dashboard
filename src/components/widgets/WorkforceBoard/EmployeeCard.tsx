"use client";
import { memo } from "react";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatCompactCurrency } from "@/lib/utils/currency";
import { calculateMonthlyCost } from "@/lib/utils/workforce-calculations";
import { calculateEmployeeROI } from "@/lib/utils/employee-roi";
import { useFinancialStore } from "@/lib/stores/financialStore";
import type { Employee, Business } from "@/lib/data/types";
import { cn } from "@/lib/utils/formatters";

const STATUS_BADGE: Record<string, { variant: "success" | "warning" | "danger"; label: string }> = {
  active: { variant: "success", label: "Active" },
  "on-leave": { variant: "warning", label: "On Leave" },
  terminated: { variant: "danger", label: "Terminated" },
};

interface EmployeeCardProps {
  employee: Employee;
  business: Business | undefined;
  onSelect: () => void;
}

export const EmployeeCard = memo(function EmployeeCard({ employee, business, onSelect }: EmployeeCardProps) {
  const monthlyCost = calculateMonthlyCost(employee);
  const allEmployees = useFinancialStore((s) => s.employees);
  const roi = calculateEmployeeROI(employee, allEmployees);
  const statusInfo = STATUS_BADGE[employee.status] ?? STATUS_BADGE.active;
  const isMyers = business?.name?.toLowerCase().includes("myers");

  return (
    <button
      onClick={onSelect}
      className="w-full text-left bg-surface border border-border rounded-card p-5 transition-all duration-200 hover:border-border-subtle hover:bg-surface-elevated"
    >
      {/* Header: name + ROI + status */}
      <div className="flex items-start justify-between mb-1">
        <h4 className="text-base font-bold text-text-primary">{employee.name}</h4>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <span className={cn("text-[10px] font-mono font-bold", roi.color)} title={`ROI: ${roi.total} — ${roi.label}`}>
            ROI {roi.total}
          </span>
          <Badge variant={statusInfo.variant} className="text-[10px]">{statusInfo.label}</Badge>
        </div>
      </div>

      {/* Role + business badge */}
      <p className="text-sm text-text-muted mb-3">{employee.roleTitle}</p>
      {business && (
        <Badge
          variant={isMyers ? "accent" : "info"}
          className={`text-[10px] mb-3 ${isMyers ? "" : "bg-purple-bg text-purple"}`}
        >
          {business.displayName}
        </Badge>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        <div className="bg-bg rounded-[8px] p-2.5 text-center overflow-hidden">
          <p className="text-[10px] text-text-faint uppercase tracking-wider mb-1">Rate</p>
          <p className="font-mono text-xs font-semibold text-text-primary truncate" title={employee.compensationType === "hourly" ? `${formatCurrency(employee.rate, employee.currency)}/hr` : formatCurrency(employee.rate, employee.currency)}>
            {employee.compensationType === "hourly"
              ? `${formatCompactCurrency(employee.rate)}/hr`
              : formatCompactCurrency(employee.rate)}
          </p>
        </div>
        <div className="bg-bg rounded-[8px] p-2.5 text-center overflow-hidden">
          <p className="text-[10px] text-text-faint uppercase tracking-wider mb-1">Hours/wk</p>
          <p className="font-mono text-xs font-semibold text-text-primary truncate">
            {employee.compensationType === "hourly" ? `${employee.hoursPerWeek ?? 0}` : "Salaried"}
          </p>
        </div>
        <div className="bg-bg rounded-[8px] p-2.5 text-center overflow-hidden">
          <p className="text-[10px] text-text-faint uppercase tracking-wider mb-1">Monthly</p>
          <p className="font-mono text-xs font-semibold text-accent truncate" title={formatCurrency(monthlyCost)}>
            {formatCompactCurrency(monthlyCost)}
          </p>
        </div>
      </div>
    </button>
  );
});
