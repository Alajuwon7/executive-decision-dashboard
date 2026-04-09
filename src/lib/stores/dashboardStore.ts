import { create } from "zustand";
import type { DashboardLayout, LayoutItem } from "@/lib/data/types";
import { repository } from "@/lib/data";

interface DashboardState {
  layouts: Record<string, LayoutItem[]>;
  activeTab: string;
  collapsedWidgets: Set<string>;
  maximizedWidget: string | null;
  setLayouts: (layouts: Record<string, LayoutItem[]>) => void;
  setActiveTab: (tab: string) => void;
  toggleCollapse: (widgetId: string) => void;
  setMaximized: (widgetId: string | null) => void;
  saveLayout: () => void;
  loadLayout: () => void;
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const useDashboardStore = create<DashboardState>((set, get) => ({
  layouts: {},
  activeTab: "financial",
  collapsedWidgets: new Set(),
  maximizedWidget: null,

  setLayouts: (layouts) => {
    set({ layouts });
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().saveLayout(), 500);
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  toggleCollapse: (widgetId) =>
    set((state) => {
      const next = new Set(state.collapsedWidgets);
      if (next.has(widgetId)) next.delete(widgetId);
      else next.add(widgetId);
      return { collapsedWidgets: next };
    }),

  setMaximized: (widgetId) => set({ maximizedWidget: widgetId }),

  saveLayout: () => {
    const { layouts } = get();
    repository.saveLayout({ layouts });
  },

  loadLayout: () => {
    const saved = repository.getLayout();
    if (saved) set({ layouts: saved.layouts });
  },
}));
