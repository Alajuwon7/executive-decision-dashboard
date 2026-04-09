"use client";
import { useMemo } from "react";
import { useWorkforceStore } from "@/lib/stores/workforceStore";
import { EmployeeCard } from "./EmployeeCard";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils/currency";
import { calculateMonthlyCost } from "@/lib/utils/workforce-calculations";
import { cn } from "@/lib/utils/formatters";
import type { Employee, Business } from "@/lib/data/types";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface EmployeeGridProps {
  employees: Employee[];
  businesses: Business[];
  onAddEmployee: () => void;
}

const STATUS_ORDER: Record<string, number> = { active: 0, "on-leave": 1, terminated: 2 };

export function EmployeeGrid({ employees, businesses, onAddEmployee }: EmployeeGridProps) {
  const { viewMode, sortBy, sortDirection } = useWorkforceStore();
  const setSelectedEmployee = useWorkforceStore((s) => s.setSelectedEmployee);

  const sorted = useMemo(() => {
    const arr = [...employees];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "cost":
          cmp = calculateMonthlyCost(a) - calculateMonthlyCost(b);
          break;
        case "startDate":
          cmp = (a.startDate ?? "").localeCompare(b.startDate ?? "");
          break;
        case "status":
          cmp = (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0);
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [employees, sortBy, sortDirection]);

  const getBusiness = (id: string) => businesses.find((b) => b.id === id);

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="w-10 h-10 text-text-faint mb-3 opacity-40" />
        <p className="text-sm font-semibold text-text-muted mb-1">No team members found</p>
        <p className="text-xs text-text-faint mb-4">Add your first employee to start tracking workforce costs.</p>
        <Button size="sm" onClick={onAddEmployee}>Add Employee</Button>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-1">
        {/* Header */}
        <div className="grid grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-3 px-4 py-2 text-[10px] font-semibold text-text-faint uppercase tracking-wider">
          <span>Name</span>
          <span>Role</span>
          <span className="w-24">Business</span>
          <span className="w-20 text-right">Rate</span>
          <span className="w-20 text-right">Monthly</span>
          <span className="w-16 text-center">Status</span>
        </div>
        {sorted.map((emp) => {
          const biz = getBusiness(emp.businessId);
          const isMyers = biz?.name?.toLowerCase().includes("myers");
          const monthlyCost = calculateMonthlyCost(emp);
          const statusVariant = emp.status === "active" ? "success" : emp.status === "on-leave" ? "warning" : "danger";
          return (
            <button
              key={emp.id}
              onClick={() => setSelectedEmployee(emp.id)}
              className="w-full grid grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-3 px-4 py-3 rounded-[10px] text-left transition-all duration-150 hover:bg-surface-elevated"
            >
              <span className="text-sm font-semibold text-text-secondary truncate">{emp.name}</span>
              <span className="text-sm text-text-muted truncate">{emp.roleTitle}</span>
              <span className="w-24">
                {biz && <Badge variant={isMyers ? "accent" : "info"} className={`text-[10px] ${isMyers ? "" : "bg-purple-bg text-purple"}`}>{biz.displayName}</Badge>}
              </span>
              <span className="w-20 text-right font-mono text-sm text-text-secondary">
                {emp.compensationType === "hourly" ? `${formatCurrency(emp.rate, emp.currency)}/hr` : formatCurrency(emp.rate, emp.currency)}
              </span>
              <span className="w-20 text-right font-mono text-sm text-accent">{formatCurrency(monthlyCost)}</span>
              <span className="w-16 text-center"><Badge variant={statusVariant} className="text-[10px]">{emp.status}</Badge></span>
            </button>
          );
        })}
      </div>
    );
  }

  // Grid view
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {sorted.map((emp) => (
        <EmployeeCard
          key={emp.id}
          employee={emp}
          business={getBusiness(emp.businessId)}
          onSelect={() => setSelectedEmployee(emp.id)}
        />
      ))}
    </div>
  );
}
