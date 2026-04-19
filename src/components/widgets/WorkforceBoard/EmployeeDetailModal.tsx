"use client";
import { useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useWorkforceStore } from "@/lib/stores/workforceStore";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { CompensationSliders } from "./CompensationSliders";
import { ImpactPreview } from "./ImpactPreview";
import { calculateMonthlyCost } from "@/lib/utils/workforce-calculations";
import { calculateEmployeeROI } from "@/lib/utils/employee-roi";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/formatters";
import { Zap, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useOODAStore } from "@/lib/stores/oodaStore";

const STATUS_BADGE: Record<string, { variant: "success" | "warning" | "danger"; label: string }> = {
  active: { variant: "success", label: "Active" },
  "on-leave": { variant: "warning", label: "On Leave" },
  terminated: { variant: "danger", label: "Terminated" },
};

export function EmployeeDetailModal() {
  const selectedId = useWorkforceStore((s) => s.selectedEmployeeId);
  const setSelectedEmployee = useWorkforceStore((s) => s.setSelectedEmployee);
  const setEditingEmployee = useWorkforceStore((s) => s.setEditingEmployee);
  const { employees, businesses } = useFinancialStore();
  const { openNewDecisionWithPrefill } = useOODAStore();

  const employee = useMemo(
    () => employees.find((e) => e.id === selectedId),
    [employees, selectedId]
  );

  const business = useMemo(
    () => businesses.find((b) => b.id === employee?.businessId),
    [businesses, employee]
  );

  if (!employee) return null;

  const monthlyCost = calculateMonthlyCost(employee);
  const statusInfo = STATUS_BADGE[employee.status] ?? STATUS_BADGE.active;
  const isMyers = business?.name?.toLowerCase().includes("myers");

  const roi = useMemo(() => calculateEmployeeROI(employee, employees), [employee, employees]);

  const handleClose = () => setSelectedEmployee(null);

  return (
    <Modal isOpen={!!selectedId} onClose={handleClose} title={employee.name} className="max-w-xl">
      {/* Header info */}
      <div className="flex items-center gap-2 mb-4">
        <Badge variant={statusInfo.variant} className="text-[10px]">{statusInfo.label}</Badge>
        {business && (
          <Badge variant={isMyers ? "accent" : "info"} className={`text-[10px] ${isMyers ? "" : "bg-purple-bg text-purple"}`}>
            {business.displayName}
          </Badge>
        )}
        {employee.startDate && (
          <span className="text-xs text-text-muted">Since {formatDate(employee.startDate)}</span>
        )}
      </div>

      {/* Role */}
      <p className="text-sm text-text-secondary mb-4">{employee.roleTitle}</p>

      {/* Compensation info */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-bg rounded-[10px] p-3 text-center">
          <p className="text-[10px] text-text-faint uppercase tracking-wider mb-1">Type</p>
          <p className="font-mono text-sm font-semibold text-text-primary capitalize">{employee.compensationType}</p>
        </div>
        <div className="bg-bg rounded-[10px] p-3 text-center">
          <p className="text-[10px] text-text-faint uppercase tracking-wider mb-1">Rate</p>
          <p className="font-mono text-sm font-semibold text-text-primary">
            {employee.compensationType === "hourly"
              ? `${formatCurrency(employee.rate, employee.currency)}/hr`
              : formatCurrency(employee.rate, employee.currency)}
          </p>
        </div>
        <div className="bg-bg rounded-[10px] p-3 text-center">
          <p className="text-[10px] text-text-faint uppercase tracking-wider mb-1">Monthly Cost</p>
          <p className="font-mono text-sm font-semibold text-accent">{formatCurrency(monthlyCost)}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border mb-5" />

      {/* Compensation Sliders */}
      <CompensationSliders employee={employee} />

      {/* Impact Preview */}
      <ImpactPreview employee={employee} onSave={handleClose} />

      {/* ROI Breakdown */}
      <div className="mt-5 pt-5 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-text-faint uppercase tracking-wider">ROI Score</p>
          <div className="flex items-center gap-2">
            <span className={`font-mono text-base font-bold ${roi.color}`}>{roi.total}</span>
            <Badge variant="info" className="text-[10px]">{roi.label}</Badge>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-surface-elevated rounded-button px-2 py-2">
            <p className="text-[10px] text-text-faint uppercase tracking-wider">Activity</p>
            <p className="font-mono text-sm font-semibold text-text-primary">{roi.activityScore}</p>
          </div>
          <div className="bg-surface-elevated rounded-button px-2 py-2">
            <p className="text-[10px] text-text-faint uppercase tracking-wider">Tenure</p>
            <p className="font-mono text-sm font-semibold text-text-primary">{roi.tenureScore}</p>
          </div>
          <div className="bg-surface-elevated rounded-button px-2 py-2">
            <p className="text-[10px] text-text-faint uppercase tracking-wider">Role</p>
            <p className="font-mono text-sm font-semibold text-text-primary">{roi.roleWeightScore}</p>
          </div>
          <div className="bg-surface-elevated rounded-button px-2 py-2">
            <p className="text-[10px] text-text-faint uppercase tracking-wider">Cost</p>
            <p className="font-mono text-sm font-semibold text-text-primary">{roi.costScore}</p>
          </div>
        </div>
      </div>

      {/* Performance Notes */}
      {employee.performanceNotes && (
        <div className="mt-5 pt-5 border-t border-border">
          <p className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-2">Performance Notes</p>
          <p className="text-sm text-text-muted whitespace-pre-wrap">{employee.performanceNotes}</p>
        </div>
      )}

      {/* Role Description */}
      {employee.roleDescription && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-2">Role Description</p>
          <p className="text-sm text-text-muted whitespace-pre-wrap">{employee.roleDescription}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-5 pt-5 border-t border-border">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setEditingEmployee(employee.id);
            setSelectedEmployee(null);
          }}
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="bg-[rgba(245,158,11,0.08)] border-accent/20 text-accent hover:bg-accent-subtle"
          onClick={() => {
            openNewDecisionWithPrefill("termination", employee.id, employee.businessId);
            setSelectedEmployee(null);
          }}
        >
          <Zap className="w-3.5 h-3.5" />
          Initiate Review
        </Button>
      </div>
    </Modal>
  );
}
