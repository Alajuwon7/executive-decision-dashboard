"use client";
import { memo } from "react";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils/currency";
import { calculateMonthlyCost } from "@/lib/utils/workforce-calculations";
import type { Employee, Business } from "@/lib/data/types";

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
  const statusInfo = STATUS_BADGE[employee.status] ?? STATUS_BADGE.active;
  const isMyers = business?.name?.toLowerCase().includes("myers");

  return (
    <button
      onClick={onSelect}
      className="w-full text-left bg-surface border border-border rounded-card p-5 transition-all duration-200 hover:border-border-subtle hover:bg-surface-elevated"
    >
      {/* Header: name + status */}
      <div className="flex items-start justify-between mb-1">
        <h4 className="text-base font-bold text-text-primary">{employee.name}</h4>
        <Badge variant={statusInfo.variant} className="text-[10px] ml-2 shrink-0">{statusInfo.label}</Badge>
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
        <div className="bg-bg rounded-[8px] p-2.5 text-center">
          <p className="text-[10px] text-text-faint uppercase tracking-wider mb-1">Rate</p>
          <p className="font-mono text-sm font-semibold text-text-primary">
            {employee.compensationType === "hourly"
              ? `${formatCurrency(employee.rate, employee.currency)}/hr`
              : formatCurrency(employee.rate, employee.currency)}
          </p>
        </div>
        <div className="bg-bg rounded-[8px] p-2.5 text-center">
          <p className="text-[10px] text-text-faint uppercase tracking-wider mb-1">Hours/wk</p>
          <p className="font-mono text-sm font-semibold text-text-primary">
            {employee.compensationType === "hourly" ? `${employee.hoursPerWeek ?? 0}` : "Salaried"}
          </p>
        </div>
        <div className="bg-bg rounded-[8px] p-2.5 text-center">
          <p className="text-[10px] text-text-faint uppercase tracking-wider mb-1">Monthly</p>
          <p className="font-mono text-sm font-semibold text-accent">
            {formatCurrency(monthlyCost)}
          </p>
        </div>
      </div>
    </button>
  );
});
