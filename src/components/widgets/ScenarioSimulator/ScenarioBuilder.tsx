"use client";
import { useMemo, useState } from "react";
import { Play } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { useScenarioStore } from "@/lib/stores/scenarioStore";
import { calculateProjectedOutcome } from "@/lib/utils/scenario-engine";
import { runMonteCarloSimulation } from "@/lib/utils/monte-carlo";
import { buildFinancialSnapshot } from "@/lib/utils/snapshot";
import { formatCompactCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/formatters";
import { ModificationControls } from "./ModificationControls";
import dynamic from "next/dynamic";
const MonteCarloChart = dynamic(() => import("./MonteCarloChart").then((m) => m.MonteCarloChart), { ssr: false });
import type { MonteCarloResults } from "@/lib/data/types";

export function ScenarioBuilder() {
  const { businesses, employees, expenses, revenueEntries, goals, personalDraw } = useFinancialStore();
  const {
    isBuilderOpen,
    closeBuilder,
    pendingModifications,
    pendingName,
    pendingDescription,
    setPendingName,
    setPendingDescription,
    saveScenario,
    activeScenarioId,
    updateScenario,
    isSimulating,
    setSimulating,
  } = useScenarioStore();

  const [mcResults, setMcResults] = useState<MonteCarloResults | null>(null);

  const current = useMemo(
    () =>
      calculateProjectedOutcome(
        { businesses, employees, expenses, revenueEntries, goals, personalDraw },
        []
      ),
    [businesses, employees, expenses, revenueEntries, goals, personalDraw]
  );

  const projected = useMemo(
    () =>
      calculateProjectedOutcome(
        { businesses, employees, expenses, revenueEntries, goals, personalDraw },
        pendingModifications
      ),
    [businesses, employees, expenses, revenueEntries, goals, personalDraw, pendingModifications]
  );

  const runMonteCarlo = () => {
    setSimulating(true, 0);
    // Run on a microtask so UI can paint the loading state
    setTimeout(() => {
      try {
        const results = runMonteCarloSimulation({
          scenario: {
            id: "tmp",
            name: pendingName,
            description: null,
            baseSnapshot: null,
            modifications: pendingModifications,
            projectedOutcome: null,
            monteCarloResults: null,
            probabilityScore: null,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          goals,
          businesses,
          employees,
          expenses,
          revenueEntries,
          personalDraw,
          simulations: 1000,
          monthsForward: 12,
        });
        setMcResults(results);
      } finally {
        setSimulating(false, 100);
      }
    }, 50);
  };

  const handleSave = async () => {
    if (!pendingName.trim()) return;
    const snapshot = buildFinancialSnapshot(businesses, employees, expenses, revenueEntries, goals);
    if (activeScenarioId) {
      await updateScenario(activeScenarioId, {
        name: pendingName,
        description: pendingDescription,
        modifications: pendingModifications,
        projectedOutcome: projected,
        monteCarloResults: mcResults,
        probabilityScore: mcResults?.goalProbabilities[0]?.probabilityOfSuccess ?? null,
      });
    } else {
      await saveScenario({
        name: pendingName,
        description: pendingDescription,
        baseSnapshot: snapshot,
        modifications: pendingModifications,
        projectedOutcome: projected,
        monteCarloResults: mcResults,
        probabilityScore: mcResults?.goalProbabilities[0]?.probabilityOfSuccess ?? null,
      });
    }
    setMcResults(null);
    closeBuilder();
  };

  const SideRow = ({ label, v }: { label: string; v: number }) => (
    <div className="flex justify-between text-xs py-1">
      <span className="text-text-muted">{label}</span>
      <span className="font-mono text-text-primary">{formatCompactCurrency(v)}</span>
    </div>
  );

  const DeltaCell = ({ d }: { d: number }) => (
    <span className={cn("font-mono text-[10px]", d > 0 ? "text-success" : d < 0 ? "text-danger" : "text-text-faint")}>
      {d === 0 ? "—" : `${d > 0 ? "+" : ""}${formatCompactCurrency(d)}`}
    </span>
  );

  return (
    <Modal isOpen={isBuilderOpen} onClose={closeBuilder} title="Build Scenario" className="!max-w-4xl">
      <div className="space-y-4">
        <input
          value={pendingName}
          onChange={(e) => setPendingName(e.target.value)}
          placeholder="Scenario name"
          className="w-full bg-surface border border-border-subtle rounded-button px-3 py-2 text-sm text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent"
        />
        <input
          value={pendingDescription}
          onChange={(e) => setPendingDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full bg-surface border border-border-subtle rounded-button px-3 py-2 text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="bg-surface-elevated border border-border-subtle rounded-card p-3">
            <p className="text-[10px] font-semibold text-text-faint uppercase tracking-wider mb-2">Current</p>
            <SideRow label="Revenue" v={current.totalRevenue} />
            <SideRow label="Expenses" v={current.totalExpenses} />
            <SideRow label="Payroll" v={current.totalPayroll} />
            <SideRow label="Draw" v={current.personalDraw} />
            <div className="h-px bg-border-subtle my-1" />
            <SideRow label="Surplus" v={current.monthlySurplus} />
          </div>

          <div className="bg-surface-elevated border border-border-subtle rounded-card p-3">
            <p className="text-[10px] font-semibold text-text-faint uppercase tracking-wider mb-2">Modified</p>
            <SideRow label="Revenue" v={projected.totalRevenue} />
            <SideRow label="Expenses" v={projected.totalExpenses} />
            <SideRow label="Payroll" v={projected.totalPayroll} />
            <SideRow label="Draw" v={projected.personalDraw} />
            <div className="h-px bg-border-subtle my-1" />
            <SideRow label="Surplus" v={projected.monthlySurplus} />
          </div>

          <div className="bg-surface-elevated border border-border-subtle rounded-card p-3">
            <p className="text-[10px] font-semibold text-text-faint uppercase tracking-wider mb-2">Delta</p>
            <div className="flex justify-between text-xs py-1"><span className="text-text-muted">Revenue</span><DeltaCell d={projected.revenueDelta} /></div>
            <div className="flex justify-between text-xs py-1"><span className="text-text-muted">Expenses</span><DeltaCell d={-projected.expenseDelta} /></div>
            <div className="flex justify-between text-xs py-1"><span className="text-text-muted">Payroll</span><DeltaCell d={-projected.payrollDelta} /></div>
            <div className="flex justify-between text-xs py-1"><span className="text-text-muted">Draw</span><DeltaCell d={-(projected.personalDraw - current.personalDraw)} /></div>
            <div className="h-px bg-border-subtle my-1" />
            <div className="flex justify-between text-xs py-1"><span className="text-text-muted">Surplus</span><DeltaCell d={projected.surplusDelta} /></div>
          </div>
        </div>

        <ModificationControls />

        {projected.goalImpacts.length > 0 && (
          <div className="bg-surface-elevated border border-border-subtle rounded-card p-3">
            <p className="text-[10px] font-semibold text-text-faint uppercase tracking-wider mb-2">Goal Impact</p>
            <div className="space-y-1">
              {projected.goalImpacts.map((gi) => (
                <div key={gi.goalId} className="flex justify-between text-xs">
                  <span className="text-text-muted truncate max-w-[50%]">{gi.goalTitle}</span>
                  <span className="font-mono">
                    {gi.currentProjectedDate ?? "—"} → <span className={cn(gi.monthsGained > 0 ? "text-success" : gi.monthsGained < 0 ? "text-danger" : "text-text-muted")}>
                      {gi.newProjectedDate ?? "—"}
                    </span>
                    {gi.monthsGained !== 0 && (
                      <span className={cn("ml-2 text-[10px]", gi.monthsGained > 0 ? "text-success" : "text-danger")}>
                        ({gi.monthsGained > 0 ? "+" : ""}{gi.monthsGained}mo)
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
          <Button variant="secondary" size="sm" onClick={runMonteCarlo} isLoading={isSimulating}>
            <Play className="w-3.5 h-3.5" />
            Run Monte Carlo (1,000)
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={closeBuilder}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={!pendingName.trim()}>Save Scenario</Button>
          </div>
        </div>

        {mcResults && <MonteCarloChart results={mcResults} />}
      </div>
    </Modal>
  );
}
