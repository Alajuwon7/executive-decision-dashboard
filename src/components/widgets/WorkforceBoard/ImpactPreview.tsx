"use client";
import { useMemo } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useWorkforceStore } from "@/lib/stores/workforceStore";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { calculateCostDelta, calculateTotalPayroll, calculateAdjustedPayroll } from "@/lib/utils/workforce-calculations";
import { calculateTotalRevenue, calculatePayrollToRevenueRatio } from "@/lib/utils/calculations";
import { formatCurrency } from "@/lib/utils/currency";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/formatters";
import type { Employee } from "@/lib/data/types";

interface ImpactPreviewProps {
  employee?: Employee; // If provided, show single-employee impact; otherwise show aggregate
  onSave?: () => void;
  onDiscard?: () => void;
}

export function ImpactPreview({ employee, onSave, onDiscard }: ImpactPreviewProps) {
  const adjustments = useWorkforceStore((s) => s.adjustments);
  const clearAllAdjustments = useWorkforceStore((s) => s.clearAllAdjustments);
  const { employees, revenueEntries, updateEmployee } = useFinancialStore();

  const hasAdjustments = employee
    ? !!adjustments[employee.id]
    : Object.keys(adjustments).length > 0;

  const impact = useMemo(() => {
    if (employee) {
      const adj = adjustments[employee.id];
      if (!adj) return null;
      const delta = calculateCostDelta(employee, adj.rate, adj.hours);
      return delta;
    }
    // Aggregate across all adjustments
    const currentPayroll = calculateTotalPayroll(employees);
    const adjustedPayroll = calculateAdjustedPayroll(employees, adjustments);
    const monthly = adjustedPayroll - currentPayroll;
    return { monthly, annual: monthly * 12 };
  }, [employee, adjustments, employees]);

  const ratioImpact = useMemo(() => {
    const totalRevenue = calculateTotalRevenue(revenueEntries);
    const currentPayroll = calculateTotalPayroll(employees);
    const adjustedPayroll = calculateAdjustedPayroll(employees, adjustments);
    const currentRatio = calculatePayrollToRevenueRatio(currentPayroll, totalRevenue);
    const newRatio = calculatePayrollToRevenueRatio(adjustedPayroll, totalRevenue);
    return { current: currentRatio, new: newRatio, improved: newRatio < currentRatio };
  }, [employees, revenueEntries, adjustments]);

  if (!hasAdjustments || !impact) return null;

  const isIncrease = impact.monthly > 0;

  const handleSave = async () => {
    for (const [empId, adj] of Object.entries(adjustments)) {
      const updates: any = {};
      if (adj.rate !== undefined) updates.rate = adj.rate;
      if (adj.hours !== undefined) updates.hoursPerWeek = adj.hours;
      if (Object.keys(updates).length > 0) {
        await updateEmployee(empId, updates);
      }
    }
    clearAllAdjustments();
    onSave?.();
  };

  const handleDiscard = () => {
    clearAllAdjustments();
    onDiscard?.();
  };

  return (
    <div className="border-l-4 border-accent bg-surface-elevated rounded-r-[12px] p-4 mt-4">
      <p className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-3">Financial Impact Preview</p>

      <div className="flex items-center gap-6 mb-3">
        {/* Monthly delta */}
        <div>
          <p className="text-[10px] text-text-faint uppercase tracking-wider mb-0.5">Monthly</p>
          <p className={cn("font-mono text-lg font-bold", isIncrease ? "text-danger" : "text-success")}>
            {isIncrease ? "+" : ""}{formatCurrency(impact.monthly)}/mo
          </p>
        </div>

        {/* Annual delta */}
        <div>
          <p className="text-[10px] text-text-faint uppercase tracking-wider mb-0.5">Annual</p>
          <p className={cn("font-mono text-lg font-bold", isIncrease ? "text-danger" : "text-success")}>
            {isIncrease ? "+" : ""}{formatCurrency(impact.annual)}/yr
          </p>
        </div>

        {/* Payroll ratio */}
        <div>
          <p className="text-[10px] text-text-faint uppercase tracking-wider mb-0.5">Payroll Ratio</p>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-sm text-text-muted">{ratioImpact.current.toFixed(1)}%</span>
            <span className="text-text-faint">→</span>
            <span className={cn("font-mono text-sm font-semibold", ratioImpact.improved ? "text-success" : "text-danger")}>
              {ratioImpact.new.toFixed(1)}%
            </span>
            {ratioImpact.improved
              ? <ArrowDown className="w-3 h-3 text-success" />
              : <ArrowUp className="w-3 h-3 text-danger" />
            }
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave}>Save Changes</Button>
        <Button size="sm" variant="ghost" onClick={handleDiscard}>Discard</Button>
      </div>
    </div>
  );
}
