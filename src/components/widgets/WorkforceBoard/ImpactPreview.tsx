"use client";
import { useMemo } from "react";
import { ArrowDown, ArrowUp, Target } from "lucide-react";
import { useWorkforceStore } from "@/lib/stores/workforceStore";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { calculateCostDelta, calculateTotalPayroll, calculateAdjustedPayroll } from "@/lib/utils/workforce-calculations";
import { calculateTotalRevenue, calculatePayrollToRevenueRatio } from "@/lib/utils/calculations";
import { calculateFeasibility } from "@/lib/utils/feasibility";
import { formatCompactCurrency } from "@/lib/utils/currency";
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
  const clearAdjustment = useWorkforceStore((s) => s.clearAdjustment);
  const { employees, revenueEntries, expenses, goals, personalDraw, updateEmployee } = useFinancialStore();

  const hasAdjustments = employee
    ? !!adjustments[employee.id]
    : Object.keys(adjustments).length > 0;

  // In single-employee mode every projection below must reflect only this
  // person's pending change — that's exactly what Save will commit.
  const scopedAdjustments = useMemo(() => {
    if (!employee) return adjustments;
    const adj = adjustments[employee.id];
    return adj ? { [employee.id]: adj } : {};
  }, [employee, adjustments]);

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
    const adjustedPayroll = calculateAdjustedPayroll(employees, scopedAdjustments);
    const currentRatio = calculatePayrollToRevenueRatio(currentPayroll, totalRevenue);
    const newRatio = calculatePayrollToRevenueRatio(adjustedPayroll, totalRevenue);
    return { current: currentRatio, new: newRatio, improved: newRatio < currentRatio };
  }, [employees, revenueEntries, scopedAdjustments]);

  const goalImpact = useMemo(() => {
    if (!hasAdjustments) return [];
    // Build a simulated employee roster reflecting pending adjustments
    const simulated: Employee[] = employees.map((e) => {
      const adj = scopedAdjustments[e.id];
      if (!adj) return e;
      return {
        ...e,
        rate: adj.rate ?? e.rate,
        hoursPerWeek: adj.hours ?? e.hoursPerWeek,
      };
    });

    const atRisk = goals.filter(
      (g) =>
        (g.status === "at_risk" || g.status === "behind") &&
        g.type !== "operational" &&
        g.targetValue &&
        g.targetDate
    );
    return atRisk.slice(0, 3).map((g) => {
      const before = calculateFeasibility(g, {
        revenueEntries,
        expenses,
        employees,
        personalDraw,
      });
      const after = calculateFeasibility(g, {
        revenueEntries,
        expenses,
        employees: simulated,
        personalDraw,
      });
      return { goal: g, before, after };
    });
  }, [hasAdjustments, employees, scopedAdjustments, goals, revenueEntries, expenses, personalDraw]);

  if (!hasAdjustments || !impact) return null;

  const isIncrease = impact.monthly > 0;

  const handleSave = async () => {
    // Single-employee mode commits only that person's pending change; the
    // aggregate view (no `employee` prop) still commits everything at once.
    for (const [empId, adj] of Object.entries(scopedAdjustments)) {
      const updates: Partial<Employee> = {};
      if (adj.rate !== undefined) updates.rate = adj.rate;
      if (adj.hours !== undefined) updates.hoursPerWeek = adj.hours;
      if (Object.keys(updates).length > 0) {
        await updateEmployee(empId, updates);
      }
    }

    if (employee) clearAdjustment(employee.id);
    else clearAllAdjustments();

    onSave?.();
  };

  const handleDiscard = () => {
    if (employee) clearAdjustment(employee.id);
    else clearAllAdjustments();
    onDiscard?.();
  };

  return (
    <div className="border-l-4 border-accent bg-surface-elevated rounded-r-[12px] p-4 mt-4">
      <p className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-3">Financial Impact Preview</p>

      <div className="grid grid-cols-3 gap-4 mb-3">
        {/* Monthly delta */}
        <div className="min-w-0">
          <p className="text-[10px] text-text-faint uppercase tracking-wider mb-0.5">Monthly</p>
          <p className={cn("font-mono text-base font-bold truncate", isIncrease ? "text-danger" : "text-success")}>
            {isIncrease ? "+" : ""}{formatCompactCurrency(impact.monthly)}/mo
          </p>
        </div>

        {/* Annual delta */}
        <div className="min-w-0">
          <p className="text-[10px] text-text-faint uppercase tracking-wider mb-0.5">Annual</p>
          <p className={cn("font-mono text-base font-bold truncate", isIncrease ? "text-danger" : "text-success")}>
            {isIncrease ? "+" : ""}{formatCompactCurrency(impact.annual)}/yr
          </p>
        </div>

        {/* Payroll ratio */}
        <div className="min-w-0">
          <p className="text-[10px] text-text-faint uppercase tracking-wider mb-0.5">Payroll Ratio</p>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-base font-bold text-text-muted">{ratioImpact.current.toFixed(0)}%</span>
            <span className="text-text-faint">→</span>
            <span className={cn("font-mono text-base font-bold", ratioImpact.improved ? "text-success" : "text-danger")}>
              {ratioImpact.new.toFixed(1)}%
            </span>
            {ratioImpact.improved
              ? <ArrowDown className="w-3 h-3 text-success" />
              : <ArrowUp className="w-3 h-3 text-danger" />
            }
          </div>
        </div>
      </div>

      {goalImpact.length > 0 && (
        <div className="border-t border-border-subtle pt-3 mb-3">
          <p className="text-[10px] text-text-faint uppercase tracking-wider mb-2 flex items-center gap-1">
            <Target className="w-3 h-3" />
            Goal Impact
          </p>
          <div className="space-y-1">
            {goalImpact.map(({ goal, before, after }) => {
              const beforeDate = before.projectedAchieveDate;
              const afterDate = after.projectedAchieveDate;
              const isImproved =
                (afterDate && beforeDate && new Date(afterDate) < new Date(beforeDate)) ||
                (afterDate && !beforeDate) ||
                after.gap > before.gap;
              const fmt = (d: string | null) =>
                d ? new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—";
              return (
                <div key={goal.id} className="flex items-center justify-between text-xs">
                  <span className="text-text-muted truncate max-w-[50%]">{goal.title}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-text-faint">{fmt(beforeDate)}</span>
                    <span className="text-text-faint">→</span>
                    <span className={cn("font-mono font-semibold", isImproved ? "text-success" : "text-accent")}>
                      {fmt(afterDate)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave}>Save Changes</Button>
        <Button size="sm" variant="ghost" onClick={handleDiscard}>Discard</Button>
      </div>
    </div>
  );
}
