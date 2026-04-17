import { create } from "zustand";
import { toast } from "sonner";
import { repository } from "@/lib/data";

interface OODAState {
  activeDecisionId: string | null;
  activeStage: "observe" | "orient" | "decide" | "act" | null;
  isModalOpen: boolean;
  isAnalyzing: boolean;
  isGeneratingOptions: boolean;
  analysisError: string | null;
  showNewDecisionForm: boolean;
  showTimeline: boolean;
  prefillType: string | null;
  prefillEmployeeId: string | null;
  prefillBusinessId: string | null;

  openDecision: (decisionId: string, stage: string) => void;
  closeModal: () => void;
  setStage: (stage: "observe" | "orient" | "decide" | "act") => void;
  setAnalyzing: (isAnalyzing: boolean) => void;
  setGeneratingOptions: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  setShowNewDecisionForm: (show: boolean) => void;
  setShowTimeline: (show: boolean) => void;
  openNewDecisionWithPrefill: (type: string, employeeId?: string, businessId?: string) => void;
  withdrawDecision: (id: string) => Promise<void>;
  deleteDecision: (id: string) => Promise<void>;
  reset: () => void;
}

export const useOODAStore = create<OODAState>((set, get) => ({
  activeDecisionId: null,
  activeStage: null,
  isModalOpen: false,
  isAnalyzing: false,
  isGeneratingOptions: false,
  analysisError: null,
  showNewDecisionForm: false,
  showTimeline: false,
  prefillType: null,
  prefillEmployeeId: null,
  prefillBusinessId: null,

  openDecision: (decisionId, stage) =>
    set({
      activeDecisionId: decisionId,
      activeStage: stage as any,
      isModalOpen: true,
      analysisError: null,
    }),

  closeModal: () =>
    set({
      activeDecisionId: null,
      activeStage: null,
      isModalOpen: false,
      isAnalyzing: false,
      isGeneratingOptions: false,
      analysisError: null,
    }),

  setStage: (stage) => set({ activeStage: stage }),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setGeneratingOptions: (isGenerating) => set({ isGeneratingOptions: isGenerating }),
  setError: (error) => set({ analysisError: error }),
  setShowNewDecisionForm: (show) => set({ showNewDecisionForm: show }),
  setShowTimeline: (show) => set({ showTimeline: show }),

  openNewDecisionWithPrefill: (type, employeeId, businessId) =>
    set({
      showNewDecisionForm: true,
      prefillType: type,
      prefillEmployeeId: employeeId ?? null,
      prefillBusinessId: businessId ?? null,
    }),

  withdrawDecision: async (id) => {
    try {
      const decision = await repository.getOODADecision(id);
      if (!decision) throw new Error("Decision not found");
      await repository.updateOODADecision(id, {
        status: "cancelled",
        stage: "completed",
      });
      await repository.addDecisionLogEntry({
        oodaDecisionId: id,
        action: "cancelled",
        snapshot: decision.observeData,
        outcomeNotes: "Decision withdrawn by admin",
      });
      toast.info("Decision withdrawn");
      if (get().activeDecisionId === id) {
        set({
          activeDecisionId: null,
          activeStage: null,
          isModalOpen: false,
          isAnalyzing: false,
          isGeneratingOptions: false,
          analysisError: null,
        });
      }
    } catch (err: any) {
      toast.error(`Withdraw failed: ${err?.message ?? "unknown error"}`);
    }
  },

  deleteDecision: async (id) => {
    try {
      await repository.deleteOODADecision(id);
      toast.success("Decision deleted");
      if (get().activeDecisionId === id) {
        set({
          activeDecisionId: null,
          activeStage: null,
          isModalOpen: false,
          isAnalyzing: false,
          isGeneratingOptions: false,
          analysisError: null,
        });
      }
    } catch (err: any) {
      toast.error(`Delete failed: ${err?.message ?? "unknown error"}`);
    }
  },

  reset: () =>
    set({
      activeDecisionId: null,
      activeStage: null,
      isModalOpen: false,
      isAnalyzing: false,
      isGeneratingOptions: false,
      analysisError: null,
      showNewDecisionForm: false,
      showTimeline: false,
      prefillType: null,
      prefillEmployeeId: null,
      prefillBusinessId: null,
    }),
}));
