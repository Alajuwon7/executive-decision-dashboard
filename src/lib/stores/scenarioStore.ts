import { create } from "zustand";
import type { Scenario, ScenarioModification, CreateScenario } from "@/lib/data/types";
import { repository } from "@/lib/data";
import { toast } from "sonner";

interface ScenarioState {
  scenarios: Scenario[];
  isLoading: boolean;

  activeScenarioId: string | null;
  isBuilderOpen: boolean;
  isCompareOpen: boolean;

  compareScenarioIds: string[];

  isSimulating: boolean;
  simulationProgress: number;

  pendingModifications: ScenarioModification[];
  pendingName: string;
  pendingDescription: string;

  fetchScenarios: () => Promise<void>;
  openBuilder: (scenarioId?: string) => void;
  closeBuilder: () => void;
  openBuilderWithMods: (mods: ScenarioModification[], name?: string) => void;
  setPendingName: (name: string) => void;
  setPendingDescription: (desc: string) => void;
  addModification: (mod: ScenarioModification) => void;
  removeModification: (index: number) => void;
  clearModifications: () => void;
  openCompare: () => void;
  closeCompare: () => void;
  addToCompare: (scenarioId: string) => void;
  removeFromCompare: (scenarioId: string) => void;
  setSimulating: (isSimulating: boolean, progress?: number) => void;

  saveScenario: (data: CreateScenario) => Promise<Scenario | null>;
  deleteScenario: (id: string) => Promise<void>;
  updateScenario: (id: string, data: Partial<Scenario>) => Promise<void>;
}

export const useScenarioStore = create<ScenarioState>((set, get) => ({
  scenarios: [],
  isLoading: false,
  activeScenarioId: null,
  isBuilderOpen: false,
  isCompareOpen: false,
  compareScenarioIds: [],
  isSimulating: false,
  simulationProgress: 0,
  pendingModifications: [],
  pendingName: "",
  pendingDescription: "",

  fetchScenarios: async () => {
    set({ isLoading: true });
    try {
      const scenarios = await repository.getScenarios();
      set({ scenarios, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  openBuilder: (scenarioId) => {
    if (scenarioId) {
      const existing = get().scenarios.find((s) => s.id === scenarioId);
      set({
        activeScenarioId: scenarioId,
        isBuilderOpen: true,
        pendingModifications: existing?.modifications ?? [],
        pendingName: existing?.name ?? "",
        pendingDescription: existing?.description ?? "",
      });
    } else {
      set({
        activeScenarioId: null,
        isBuilderOpen: true,
        pendingModifications: [],
        pendingName: "",
        pendingDescription: "",
      });
    }
  },

  closeBuilder: () =>
    set({
      isBuilderOpen: false,
      activeScenarioId: null,
      pendingModifications: [],
      pendingName: "",
      pendingDescription: "",
    }),

  openBuilderWithMods: (mods, name) =>
    set({
      isBuilderOpen: true,
      activeScenarioId: null,
      pendingModifications: mods,
      pendingName: name ?? "",
      pendingDescription: "",
    }),

  setPendingName: (name) => set({ pendingName: name }),
  setPendingDescription: (desc) => set({ pendingDescription: desc }),

  addModification: (mod) =>
    set((s) => ({ pendingModifications: [...s.pendingModifications, mod] })),

  removeModification: (index) =>
    set((s) => ({
      pendingModifications: s.pendingModifications.filter((_, i) => i !== index),
    })),

  clearModifications: () => set({ pendingModifications: [] }),

  openCompare: () => set({ isCompareOpen: true }),
  closeCompare: () => set({ isCompareOpen: false, compareScenarioIds: [] }),

  addToCompare: (scenarioId) =>
    set((s) => {
      if (s.compareScenarioIds.includes(scenarioId)) return {};
      if (s.compareScenarioIds.length >= 3) {
        toast.error("Maximum 3 scenarios in comparison");
        return {};
      }
      return { compareScenarioIds: [...s.compareScenarioIds, scenarioId] };
    }),

  removeFromCompare: (scenarioId) =>
    set((s) => ({
      compareScenarioIds: s.compareScenarioIds.filter((id) => id !== scenarioId),
    })),

  setSimulating: (isSimulating, progress = 0) =>
    set({ isSimulating, simulationProgress: progress }),

  saveScenario: async (data) => {
    try {
      const scenario = await repository.createScenario(data);
      await get().fetchScenarios();
      toast.success("Scenario saved");
      return scenario;
    } catch {
      toast.error("Failed to save scenario");
      return null;
    }
  },

  deleteScenario: async (id) => {
    try {
      await repository.deleteScenario(id);
      await get().fetchScenarios();
      toast.success("Scenario deleted");
    } catch {
      toast.error("Failed to delete scenario");
    }
  },

  updateScenario: async (id, data) => {
    try {
      await repository.updateScenario(id, data);
      await get().fetchScenarios();
    } catch {
      toast.error("Failed to update scenario");
    }
  },
}));
