import { create } from "zustand";
import type { PulseAlert, CreatePulseAlert, PulseSeverity } from "@/lib/data/types";
import { repository } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type SeverityFilter = "all" | PulseSeverity;

interface PulseState {
  alerts: PulseAlert[];
  isLoading: boolean;
  severityFilter: SeverityFilter;
  isBellOpen: boolean;

  fetchAlerts: () => Promise<void>;
  createAlert: (data: CreatePulseAlert) => Promise<void>;
  markAsRead: (alertId: string) => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;
  setSeverityFilter: (s: SeverityFilter) => void;
  toggleBell: () => void;
  closeBell: () => void;
  subscribeToAlerts: () => () => void;
}

export const usePulseStore = create<PulseState>((set, get) => ({
  alerts: [],
  isLoading: false,
  severityFilter: "all",
  isBellOpen: false,

  fetchAlerts: async () => {
    set({ isLoading: true });
    try {
      const alerts = await repository.getPulseAlerts();
      set({ alerts, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createAlert: async (data) => {
    try {
      await repository.createPulseAlert(data);
      await get().fetchAlerts();
    } catch {
      /* swallow */
    }
  },

  markAsRead: async (alertId) => {
    try {
      await repository.markPulseAlertRead(alertId);
      set((s) => ({
        alerts: s.alerts.map((a) => (a.id === alertId ? { ...a, isRead: true } : a)),
      }));
    } catch {
      /* swallow */
    }
  },

  dismissAlert: async (alertId) => {
    try {
      await repository.dismissPulseAlert(alertId);
      set((s) => ({ alerts: s.alerts.filter((a) => a.id !== alertId) }));
    } catch {
      toast.error("Failed to dismiss alert");
    }
  },

  setSeverityFilter: (severityFilter) => set({ severityFilter }),
  toggleBell: () => set((s) => ({ isBellOpen: !s.isBellOpen })),
  closeBell: () => set({ isBellOpen: false }),

  subscribeToAlerts: () => {
    const supabase = createClient();
    const channel = supabase
      .channel("pulse_alerts_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pulse_alerts" },
        () => {
          get().fetchAlerts();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
