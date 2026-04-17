"use client";
import { useMemo } from "react";
import type { Scenario, ProjectedOutcome } from "@/lib/data/types";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { useScenarioStore } from "@/lib/stores/scenarioStore";
import { calculateProjectedOutcome } from "@/lib/utils/scenario-engine";
import { formatCompactCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/formatters";
import { Modal } from "@/components/ui/Modal";
import { X } from "lucide-react";

export function ComparisonView() {
  const { businesses, employees, expenses, revenueEntries, goals, personalDraw } = useFinancialStore();
  const { scenarios, isCompareOpen, compareScenarioIds, closeCompare, removeFromCompare } = useScenarioStore();

  const base = useMemo(() => {
    return calculateProjectedOutcome(
      { businesses, employees, expenses, revenueEntries, goals, personalDraw },
      []
    );
  }, [businesses, employees, expenses, revenueEntries, goals, personalDraw]);

  const columns = useMemo(() => {
    const baseCtx = { businesses, employees, expenses, revenueEntries, goals, personalDraw };
    return compareScenarioIds
      .map((id) => {
        const sc = scenarios.find((s) => s.id === id);
        if (!sc) return null;
        const outcome = calculateProjectedOutcome(baseCtx, sc.modifications);
        return { scenario: sc, outcome };
      })
      .filter((x): x is { scenario: Scenario; outcome: ProjectedOutcome } => !!x);
  }, [compareScenarioIds, scenarios, businesses, employees, expenses, revenueEntries, goals, personalDraw]);

  const row = (label: string, currentVal: number, getVal: (o: ProjectedOutcome) => number, reverse = false) => (
    <tr className="border-b border-border-subtle last:border-0">
      <td className="py-2 text-xs text-text-muted">{label}</td>
      <td className="py-2 font-mono text-xs text-text-primary text-right">{formatCompactCurrency(currentVal)}</td>
      {columns.map(({ scenario, outcome }) => {
        const v = getVal(outcome);
        const delta = v - currentVal;
        const improved = reverse ? delta < 0 : delta > 0;
        return (
          <td key={scenario.id} className="py-2 font-mono text-xs text-right">
            <span className="text-text-primary">{formatCompactCurrency(v)}</span>
            <div className={cn("text-[10px]", improved ? "text-success" : delta === 0 ? "text-text-faint" : "text-danger")}>
              {delta === 0 ? "—" : `${delta > 0 ? "+" : ""}${formatCompactCurrency(delta)}`}
            </div>
          </td>
        );
      })}
    </tr>
  );

  return (
    <Modal isOpen={isCompareOpen} onClose={closeCompare} title="Scenario Comparison" className="!max-w-3xl">
      {columns.length === 0 ? (
        <p className="text-sm text-text-muted py-6 text-center">No scenarios selected for comparison. Pick up to 3 from the scenario list.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left py-2 text-[10px] font-semibold text-text-faint uppercase tracking-wider">Metric</th>
                <th className="text-right py-2 text-[10px] font-semibold text-text-faint uppercase tracking-wider">Current</th>
                {columns.map(({ scenario }) => (
                  <th key={scenario.id} className="text-right py-2 text-[10px] font-semibold text-text-faint uppercase tracking-wider">
                    <div className="flex items-center justify-end gap-1">
                      <span className="truncate max-w-[100px]">{scenario.name}</span>
                      <button onClick={() => removeFromCompare(scenario.id)} className="text-text-faint hover:text-danger">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {row("Revenue", base.totalRevenue, (o) => o.totalRevenue)}
              {row("Expenses", base.totalExpenses, (o) => o.totalExpenses, true)}
              {row("Payroll", base.totalPayroll, (o) => o.totalPayroll, true)}
              {row("Draw", base.personalDraw, (o) => o.personalDraw, true)}
              {row("Monthly Surplus", base.monthlySurplus, (o) => o.monthlySurplus)}
              <tr className="border-b border-border-subtle">
                <td className="py-2 text-xs text-text-muted">Payroll Ratio</td>
                <td className="py-2 font-mono text-xs text-text-primary text-right">{base.payrollToRevenueRatio.toFixed(1)}%</td>
                {columns.map(({ scenario, outcome }) => {
                  const improved = outcome.payrollToRevenueRatio < base.payrollToRevenueRatio;
                  return (
                    <td key={scenario.id} className="py-2 font-mono text-xs text-right">
                      <span className={cn(improved ? "text-success" : "text-danger")}>
                        {outcome.payrollToRevenueRatio.toFixed(1)}%
                      </span>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
