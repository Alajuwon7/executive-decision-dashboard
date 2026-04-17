import { create } from "zustand";
import type { BusinessIntegration, SyncLogEntry } from "@/lib/data/types";
import { repository } from "@/lib/data";
import { toast } from "sonner";

interface IntegrationState {
  integrations: BusinessIntegration[];
  syncLogs: Record<string, SyncLogEntry[]>;
  isLoading: boolean;
  isSyncing: Record<string, boolean>;

  fetchIntegrations: () => Promise<void>;
  fetchSyncLog: (integrationId: string) => Promise<void>;
  triggerSync: (integrationId: string) => Promise<void>;
  disconnect: (integrationId: string) => Promise<void>;
  updateSettings: (integrationId: string, data: Partial<BusinessIntegration>) => Promise<void>;
}

export const useIntegrationStore = create<IntegrationState>((set, get) => ({
  integrations: [],
  syncLogs: {},
  isLoading: false,
  isSyncing: {},

  fetchIntegrations: async () => {
    set({ isLoading: true });
    try {
      const integrations = await repository.getIntegrations();
      set({ integrations, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchSyncLog: async (integrationId) => {
    try {
      const log = await repository.getSyncLog(integrationId);
      set((s) => ({ syncLogs: { ...s.syncLogs, [integrationId]: log } }));
    } catch {
      /* swallow */
    }
  },

  triggerSync: async (integrationId) => {
    set((s) => ({ isSyncing: { ...s.isSyncing, [integrationId]: true } }));
    try {
      const res = await fetch("/api/integrations/quickbooks/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Sync failed");
      }
      toast.success("Sync completed");
      await get().fetchIntegrations();
      await get().fetchSyncLog(integrationId);
    } catch (err: any) {
      toast.error(err.message ?? "Sync failed");
    } finally {
      set((s) => ({ isSyncing: { ...s.isSyncing, [integrationId]: false } }));
    }
  },

  disconnect: async (integrationId) => {
    try {
      const res = await fetch("/api/integrations/quickbooks/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId }),
      });
      if (!res.ok) throw new Error("Disconnect failed");
      toast.success("QuickBooks disconnected");
      await get().fetchIntegrations();
    } catch (err: any) {
      toast.error(err.message ?? "Disconnect failed");
    }
  },

  updateSettings: async (integrationId, data) => {
    try {
      await repository.updateIntegration(integrationId, data);
      await get().fetchIntegrations();
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    }
  },
}));
