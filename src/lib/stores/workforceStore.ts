import { create } from "zustand";

interface SliderAdjustment {
  rate?: number;
  hours?: number;
}

interface WorkforceState {
  businessFilter: string | null;
  sortBy: "name" | "cost" | "startDate" | "status";
  sortDirection: "asc" | "desc";
  viewMode: "grid" | "list";
  adjustments: Record<string, SliderAdjustment>;
  selectedEmployeeId: string | null;
  editingEmployeeId: string | null;

  setBusinessFilter: (id: string | null) => void;
  setSortBy: (field: "name" | "cost" | "startDate" | "status") => void;
  toggleSortDirection: () => void;
  setViewMode: (mode: "grid" | "list") => void;
  setAdjustment: (employeeId: string, adj: SliderAdjustment) => void;
  clearAdjustment: (employeeId: string) => void;
  clearAllAdjustments: () => void;
  setSelectedEmployee: (id: string | null) => void;
  setEditingEmployee: (id: string | null) => void;
}

export const useWorkforceStore = create<WorkforceState>((set) => ({
  businessFilter: null,
  sortBy: "name",
  sortDirection: "asc",
  viewMode: "grid",
  adjustments: {},
  selectedEmployeeId: null,
  editingEmployeeId: null,

  setBusinessFilter: (id) => set({ businessFilter: id }),
  setSortBy: (field) => set({ sortBy: field }),
  toggleSortDirection: () =>
    set((state) => ({ sortDirection: state.sortDirection === "asc" ? "desc" : "asc" })),
  setViewMode: (mode) => set({ viewMode: mode }),
  setAdjustment: (employeeId, adj) =>
    set((state) => ({
      adjustments: { ...state.adjustments, [employeeId]: { ...state.adjustments[employeeId], ...adj } },
    })),
  clearAdjustment: (employeeId) =>
    set((state) => {
      const next = { ...state.adjustments };
      delete next[employeeId];
      return { adjustments: next };
    }),
  clearAllAdjustments: () => set({ adjustments: {} }),
  setSelectedEmployee: (id) => set({ selectedEmployeeId: id }),
  setEditingEmployee: (id) => set({ editingEmployeeId: id }),
}));
