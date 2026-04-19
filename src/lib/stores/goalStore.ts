import { create } from "zustand";
import type {
  Goal,
  CreateGoal,
  GoalMilestone,
  CreateGoalMilestone,
  FeasibilityResult,
  WhatWouldItTakeCard,
  PersonalDraw,
  GoalOwner,
  GoalStatus,
} from "@/lib/data/types";
import { repository } from "@/lib/data";
import { toast } from "sonner";

export type OwnerFilter = GoalOwner | "all";
export type StatusFilter = GoalStatus | "all";

interface GoalState {
  // Data
  milestones: GoalMilestone[];

  // Filters
  ownerFilter: OwnerFilter;
  statusFilter: StatusFilter;

  // UI
  selectedGoalId: string | null;
  isAddFormOpen: boolean;
  isDetailModalOpen: boolean;
  isGeneratingWWIT: boolean;
  isDependencyMapOpen: boolean;
  dependencyMapMode: "tree" | "force";
  isAlertsExpanded: boolean;

  // Caches
  feasibilityCache: Record<string, FeasibilityResult>;
  wwitCache: Record<string, WhatWouldItTakeCard[]>;

  // Actions
  fetchMilestones: () => Promise<void>;
  setOwnerFilter: (f: OwnerFilter) => void;
  setStatusFilter: (f: StatusFilter) => void;
  openGoalDetail: (id: string) => void;
  closeGoalDetail: () => void;
  openAddForm: () => void;
  closeAddForm: () => void;
  toggleDependencyMap: () => void;
  setDependencyMapMode: (m: "tree" | "force") => void;
  toggleAlerts: () => void;

  setFeasibility: (goalId: string, result: FeasibilityResult) => void;
  setFeasibilityBatch: (results: Record<string, FeasibilityResult>) => void;
  setWWITCards: (goalId: string, cards: WhatWouldItTakeCard[]) => void;
  clearWWIT: (goalId: string) => void;
  setGeneratingWWIT: (v: boolean) => void;

  // CRUD passthroughs
  createGoal: (data: CreateGoal) => Promise<Goal | null>;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  createMilestone: (data: CreateGoalMilestone) => Promise<void>;
  toggleMilestone: (id: string, isCompleted: boolean) => Promise<void>;
  setPersonalDraw: (draw: PersonalDraw) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  milestones: [],
  ownerFilter: "all",
  statusFilter: "all",
  selectedGoalId: null,
  isAddFormOpen: false,
  isDetailModalOpen: false,
  isGeneratingWWIT: false,
  isDependencyMapOpen: false,
  dependencyMapMode: "tree",
  isAlertsExpanded: false,
  feasibilityCache: {},
  wwitCache: {},

  fetchMilestones: async () => {
    const milestones = await repository.getMilestones();
    set({ milestones });
  },

  setOwnerFilter: (f) => set({ ownerFilter: f }),
  setStatusFilter: (f) => set({ statusFilter: f }),

  openGoalDetail: (id) => set({ selectedGoalId: id, isDetailModalOpen: true }),
  closeGoalDetail: () => set({ isDetailModalOpen: false, selectedGoalId: null }),
  openAddForm: () => set({ isAddFormOpen: true }),
  closeAddForm: () => set({ isAddFormOpen: false }),

  toggleDependencyMap: () => set((s) => ({ isDependencyMapOpen: !s.isDependencyMapOpen })),
  setDependencyMapMode: (m) => set({ dependencyMapMode: m }),
  toggleAlerts: () => set((s) => ({ isAlertsExpanded: !s.isAlertsExpanded })),

  setFeasibility: (goalId, result) =>
    set((s) => ({ feasibilityCache: { ...s.feasibilityCache, [goalId]: result } })),
  setFeasibilityBatch: (results) =>
    set((s) => ({ feasibilityCache: { ...s.feasibilityCache, ...results } })),

  setWWITCards: (goalId, cards) =>
    set((s) => ({ wwitCache: { ...s.wwitCache, [goalId]: cards } })),
  clearWWIT: (goalId) =>
    set((s) => {
      const next = { ...s.wwitCache };
      delete next[goalId];
      return { wwitCache: next };
    }),
  setGeneratingWWIT: (v) => set({ isGeneratingWWIT: v }),

  createGoal: async (data) => {
    try {
      const goal = await repository.createGoal(data);
      toast.success("Goal created");
      return goal;
    } catch {
      toast.error("Failed to create goal");
      return null;
    }
  },

  updateGoal: async (id, data) => {
    try {
      await repository.updateGoal(id, data);
    } catch {
      toast.error("Failed to update goal");
    }
  },

  deleteGoal: async (id) => {
    try {
      await repository.deleteGoal(id);
      toast.success("Goal removed");
    } catch {
      toast.error("Failed to delete goal");
    }
  },

  createMilestone: async (data) => {
    try {
      await repository.createMilestone(data);
      await get().fetchMilestones();
    } catch {
      toast.error("Failed to add milestone");
    }
  },

  toggleMilestone: async (id, isCompleted) => {
    try {
      await repository.updateMilestone(id, { isCompleted });
      await get().fetchMilestones();
    } catch {
      toast.error("Failed to update milestone");
    }
  },


  setPersonalDraw: async (draw) => {
    try {
      await repository.setPersonalDraw(draw);
    } catch {
      toast.error("Failed to save personal draw");
    }
  },
}));
