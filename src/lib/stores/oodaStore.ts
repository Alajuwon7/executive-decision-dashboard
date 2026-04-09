import { create } from "zustand";

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
  reset: () => void;
}

export const useOODAStore = create<OODAState>((set) => ({
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
