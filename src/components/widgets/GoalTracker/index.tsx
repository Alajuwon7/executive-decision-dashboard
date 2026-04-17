"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, GitBranch } from "lucide-react";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { useGoalStore } from "@/lib/stores/goalStore";
import { repository } from "@/lib/data";
import { calculateFeasibility, determineGoalStatus } from "@/lib/utils/feasibility";
import { detectPatterns } from "@/lib/utils/patterns";
import { buildFinancialSnapshot } from "@/lib/utils/snapshot";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AddGoalForm } from "@/components/forms/AddGoalForm";
import { GoalStats } from "./GoalStats";
import { OwnerTabs } from "./OwnerTabs";
import { GoalGrid } from "./GoalGrid";
import { GoalDetailModal } from "./GoalDetailModal";
import { PatternAlerts } from "./PatternAlerts";
import { DependencyMap } from "./DependencyMap";
import { toast } from "sonner";
import type { Goal, FeasibilityResult, Employee, Expense, RevenueEntry, PersonalDraw } from "@/lib/data/types";

function financialHash(
  employees: Employee[],
  expenses: Expense[],
  revenueEntries: RevenueEntry[],
  goals: Goal[],
  personalDraw: PersonalDraw
): string {
  const exp = expenses.reduce((s, e) => s + (e.isActive ? e.amount : 0), 0);
  const rev = revenueEntries.reduce((s, r) => s + r.amount, 0);
  return `${employees.length}:${exp.toFixed(2)}:${rev.toFixed(2)}:${goals.length}:${personalDraw.his}:${personalDraw.hers}`;
}

export function GoalTracker() {
  const {
    businesses,
    employees,
    expenses,
    revenueEntries,
    goals,
    personalDraw,
    fetchAll,
  } = useFinancialStore();

  const {
    ownerFilter,
    selectedGoalId,
    isAddFormOpen,
    isDetailModalOpen,
    feasibilityCache,
    patternAlerts,
    isDependencyMapOpen,
    openAddForm,
    closeAddForm,
    openGoalDetail,
    closeGoalDetail,
    setFeasibilityBatch,
    setWWITCards,
    setGeneratingWWIT,
    toggleDependencyMap,
    fetchMilestones,
    fetchPatternAlerts,
    updateGoal,
  } = useGoalStore();

  const milestones = useGoalStore((s) => s.milestones);
  const wwitCache = useGoalStore((s) => s.wwitCache);

  const lastRunKeyRef = useRef<string>("");
  const [showPersonalDraw, setShowPersonalDraw] = useState(false);

  // Initial fetch for goal-specific data
  useEffect(() => {
    fetchMilestones();
    fetchPatternAlerts();
  }, [fetchMilestones, fetchPatternAlerts]);

  // Debounced feasibility + pattern recalc
  useEffect(() => {
    const key = financialHash(employees, expenses, revenueEntries, goals, personalDraw);
    if (key === lastRunKeyRef.current) return;

    const timer = setTimeout(async () => {
      if (key === lastRunKeyRef.current) return;
      lastRunKeyRef.current = key;

      // Recalculate feasibility for all active goals
      const results: Record<string, FeasibilityResult> = {};
      const statusUpdates: Array<{ id: string; status: Goal["status"] }> = [];
      for (const goal of goals) {
        if (goal.status === "achieved" || goal.status === "abandoned") continue;
        const goalMilestones = milestones.filter((m) => m.goalId === goal.id);
        const feas = calculateFeasibility(goal, {
          revenueEntries,
          expenses,
          employees,
          personalDraw,
          milestones: goalMilestones,
        });
        results[goal.id] = feas;
        const newStatus = determineGoalStatus(goal, feas);
        if (newStatus !== goal.status) {
          statusUpdates.push({ id: goal.id, status: newStatus });
        }
      }
      setFeasibilityBatch(results);

      // Persist status changes (not feasibility — kept ephemeral per plan)
      for (const u of statusUpdates) {
        updateGoal(u.id, { status: u.status });
      }

      // Pattern detection
      try {
        const existing = await repository.getPatternAlerts();
        const candidates = detectPatterns({
          expenses,
          revenueEntries,
          employees,
          goals,
          existingAlerts: existing,
        });
        for (const c of candidates) {
          await repository.createPatternAlert(c);
        }
        if (candidates.length > 0) await fetchPatternAlerts();
      } catch (err) {
        console.error("Pattern detection failed", err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [
    employees,
    expenses,
    revenueEntries,
    goals,
    personalDraw,
    milestones,
    setFeasibilityBatch,
    updateGoal,
    fetchPatternAlerts,
  ]);

  const filteredGoals = useMemo(() => {
    let list = goals.filter((g) => g.status !== "abandoned");
    if (ownerFilter !== "all") list = list.filter((g) => g.owner === ownerFilter);
    return list;
  }, [goals, ownerFilter]);

  const selectedGoal = useMemo(
    () => goals.find((g) => g.id === selectedGoalId) ?? null,
    [goals, selectedGoalId]
  );

  const handleRequestWWIT = async (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    const feas = feasibilityCache[goalId];
    if (!feas) {
      toast.error("Feasibility not yet calculated");
      return;
    }

    // Open detail modal and begin generation
    openGoalDetail(goalId);
    setGeneratingWWIT(true);
    try {
      const snapshot = buildFinancialSnapshot(businesses, employees, expenses, revenueEntries, goals);
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "what_would_it_take",
          goal,
          snapshot,
          feasibility: feas,
        }),
      });
      if (!res.ok) throw new Error("Claude request failed");
      const data = await res.json();
      const cards = data?.analysis?.cards ?? [];
      setWWITCards(goalId, cards);

      // Persist on goal metadata for cross-session availability
      await updateGoal(goalId, {
        metadata: {
          ...goal.metadata,
          wwitCards: cards,
          wwitGeneratedAt: new Date().toISOString(),
          wwitGapAtGeneration: feas.gap,
        },
      });
      await fetchAll();
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate recovery paths");
    } finally {
      setGeneratingWWIT(false);
    }
  };

  const handleOpenWWITFromDetail = (goal: Goal) => {
    handleRequestWWIT(goal.id);
  };

  const selectedMilestones = useMemo(
    () => (selectedGoal ? milestones.filter((m) => m.goalId === selectedGoal.id) : []),
    [milestones, selectedGoal]
  );

  const selectedFeasibility = selectedGoal
    ? feasibilityCache[selectedGoal.id] ?? selectedGoal.feasibility ?? null
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="font-serif text-sm text-text-muted">Strategic Goals</p>
        <div className="flex gap-1.5">
          <button
            onClick={() => setShowPersonalDraw(true)}
            className="text-[10px] font-semibold text-text-muted hover:text-text-primary border border-border-subtle rounded-button px-2.5 py-1.5 transition-colors"
            title="Configure monthly personal draw"
          >
            Personal Draw
          </button>
          <button
            onClick={toggleDependencyMap}
            className="text-[10px] font-semibold text-text-muted hover:text-text-primary border border-border-subtle rounded-button px-2.5 py-1.5 transition-colors flex items-center gap-1"
          >
            <GitBranch className="w-3 h-3" />
            Deps
          </button>
          <Button size="sm" onClick={openAddForm}>
            <Plus className="w-3.5 h-3.5" />
            Add Goal
          </Button>
        </div>
      </div>

      <GoalStats />
      <OwnerTabs />

      {isDependencyMapOpen && (
        <div className="mb-4">
          <DependencyMap goals={goals} onSelectGoal={openGoalDetail} />
        </div>
      )}

      <GoalGrid
        goals={filteredGoals}
        feasibilityCache={feasibilityCache}
        onOpenDetail={openGoalDetail}
        onRequestWWIT={handleRequestWWIT}
        onAdd={openAddForm}
      />

      <PatternAlerts alerts={patternAlerts} />

      <Modal isOpen={isAddFormOpen} onClose={closeAddForm} title="Add Goal">
        <AddGoalForm onClose={closeAddForm} />
      </Modal>

      <GoalDetailModal
        goal={isDetailModalOpen ? selectedGoal : null}
        feasibility={selectedFeasibility}
        milestones={selectedMilestones}
        onClose={closeGoalDetail}
        onRequestWWIT={handleOpenWWITFromDetail}
      />

      <PersonalDrawModal
        isOpen={showPersonalDraw}
        onClose={() => setShowPersonalDraw(false)}
        current={personalDraw}
      />
    </div>
  );
}

// Small inline modal for personal draw configuration.
function PersonalDrawModal({
  isOpen,
  onClose,
  current,
}: {
  isOpen: boolean;
  onClose: () => void;
  current: PersonalDraw;
}) {
  const setPersonalDraw = useGoalStore((s) => s.setPersonalDraw);
  const fetchAll = useFinancialStore((s) => s.fetchAll);
  const [his, setHis] = useState(current.his);
  const [hers, setHers] = useState(current.hers);

  useEffect(() => {
    setHis(current.his);
    setHers(current.hers);
  }, [current.his, current.hers, isOpen]);

  const handleSave = async () => {
    await setPersonalDraw({ his, hers });
    await fetchAll();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Monthly Personal Draw">
      <div className="space-y-4">
        <p className="text-xs text-text-muted">
          Configure monthly take-home for each admin. Feasibility subtracts this from available surplus.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-semibold text-text-faint uppercase tracking-wider">His</label>
            <input
              type="number"
              value={his}
              onChange={(e) => setHis(Number(e.target.value))}
              className="w-full bg-surface border border-border-subtle rounded-button px-3 py-2 font-mono text-sm text-text-primary focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-text-faint uppercase tracking-wider">Hers</label>
            <input
              type="number"
              value={hers}
              onChange={(e) => setHers(Number(e.target.value))}
              className="w-full bg-surface border border-border-subtle rounded-button px-3 py-2 font-mono text-sm text-text-primary focus:outline-none focus:border-accent"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
