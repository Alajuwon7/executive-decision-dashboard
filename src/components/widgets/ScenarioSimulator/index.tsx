"use client";
import { useEffect } from "react";
import { Plus, GitBranch, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useScenarioStore } from "@/lib/stores/scenarioStore";
import { ScenarioCard } from "./ScenarioCard";
import { ScenarioBuilder } from "./ScenarioBuilder";
import dynamic from "next/dynamic";
const ComparisonView = dynamic(() => import("./ComparisonView").then((m) => m.ComparisonView), { ssr: false });

export function ScenarioSimulator() {
  const {
    scenarios,
    fetchScenarios,
    openBuilder,
    openCompare,
    deleteScenario,
    compareScenarioIds,
    addToCompare,
    removeFromCompare,
  } = useScenarioStore();

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="font-serif text-sm text-text-muted">
          Scenario Simulator <span className="text-text-faint font-sans">({scenarios.length})</span>
        </p>
        <div className="flex gap-1.5">
          {compareScenarioIds.length > 0 && (
            <Button size="sm" variant="secondary" onClick={openCompare}>
              <GitCompare className="w-3.5 h-3.5" />
              Compare ({compareScenarioIds.length})
            </Button>
          )}
          <Button size="sm" onClick={() => openBuilder()}>
            <Plus className="w-3.5 h-3.5" />
            New Scenario
          </Button>
        </div>
      </div>

      {scenarios.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3 border border-dashed border-border-subtle rounded-card">
          <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-text-faint" />
          </div>
          <div className="text-center">
            <p className="text-sm text-text-muted font-semibold">Model alternative futures</p>
            <p className="text-xs text-text-faint mt-1">Create a scenario to see how changes affect your finances and goals.</p>
          </div>
          <Button size="sm" onClick={() => openBuilder()}>
            <Plus className="w-3.5 h-3.5" />
            New Scenario
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {scenarios.map((s) => (
            <ScenarioCard
              key={s.id}
              scenario={s}
              onOpen={() => openBuilder(s.id)}
              onCompare={() =>
                compareScenarioIds.includes(s.id) ? removeFromCompare(s.id) : addToCompare(s.id)
              }
              onDelete={() => {
                if (confirm("Delete this scenario?")) deleteScenario(s.id);
              }}
              isInCompare={compareScenarioIds.includes(s.id)}
            />
          ))}
        </div>
      )}

      <ScenarioBuilder />
      <ComparisonView />
    </div>
  );
}
