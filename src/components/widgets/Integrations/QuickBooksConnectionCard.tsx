"use client";
import { useState } from "react";
import { RefreshCw, Unplug, Settings, ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { BusinessIntegration, Business } from "@/lib/data/types";
import { useIntegrationStore } from "@/lib/stores/integrationStore";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/formatters";

interface Props {
  business: Business;
  integration: BusinessIntegration | null;
}

export function QuickBooksConnectionCard({ business, integration }: Props) {
  const { triggerSync, disconnect, isSyncing, fetchIntegrations } = useIntegrationStore();
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch(`/api/integrations/quickbooks/connect?businessId=${business.id}`);
      const data = await res.json();
      if (data.authUrl) {
        // Open in popup — avoids the Intuit "Connection Successful" page blocking redirect
        const w = 600, h = 700;
        const left = window.screenX + (window.outerWidth - w) / 2;
        const top = window.screenY + (window.outerHeight - h) / 2;
        const popup = window.open(
          data.authUrl,
          "quickbooks-connect",
          `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no`
        );

        // Listen for the callback page to signal completion
        const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === "quickbooks-connected") {
            window.removeEventListener("message", handleMessage);
            setConnecting(false);
            // Refresh integration state
            fetchIntegrations();
          }
        };
        window.addEventListener("message", handleMessage);

        // Also poll in case postMessage doesn't work (popup blocked, etc.)
        const pollInterval = setInterval(() => {
          if (popup?.closed) {
            clearInterval(pollInterval);
            window.removeEventListener("message", handleMessage);
            setConnecting(false);
            fetchIntegrations();
          }
        }, 1000);
      }
    } catch {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!integration || !confirm("Disconnect QuickBooks? Historical data will remain.")) return;
    await disconnect(integration.id);
  };

  const syncing = integration ? isSyncing[integration.id] : false;

  if (!integration || !integration.isActive) {
    return (
      <div className="bg-surface-elevated border border-border-subtle rounded-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <QBLogo />
          <div>
            <p className="font-serif text-sm font-semibold text-text-primary">QuickBooks Online</p>
            <p className="text-xs text-text-faint">{business.displayName}</p>
          </div>
        </div>
        <p className="text-xs text-text-muted mb-3">
          Connect to auto-sync invoices, bills, and expenses.
        </p>
        <Button size="sm" onClick={handleConnect} isLoading={connecting}>
          <ExternalLink className="w-3.5 h-3.5" />
          Connect to QuickBooks
        </Button>
      </div>
    );
  }

  const isError = integration.lastSyncStatus === "failed";
  const isStale = integration.lastSyncAt && Date.now() - new Date(integration.lastSyncAt).getTime() > 2 * 60 * 60 * 1000;
  const statusColor = isError ? "text-danger" : isStale ? "text-accent" : "text-success";
  const statusLabel = isError ? "Error" : isStale ? "Stale" : "Connected";

  return (
    <div className="bg-surface-elevated border border-border-subtle rounded-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <QBLogo />
          <div>
            <p className="font-serif text-sm font-semibold text-text-primary">QuickBooks Online</p>
            <p className="text-xs text-text-faint">{business.displayName}</p>
          </div>
        </div>
        <span className={cn("text-[10px] font-semibold uppercase tracking-wider", statusColor)}>
          {isError ? <AlertTriangle className="inline w-3 h-3 mr-0.5" /> : <CheckCircle2 className="inline w-3 h-3 mr-0.5" />}
          {statusLabel}
        </span>
      </div>

      <div className="space-y-1 text-xs text-text-muted mb-3">
        <p>
          Last synced: {integration.lastSyncAt
            ? new Date(integration.lastSyncAt).toLocaleString("en-US", { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" })
            : "Never"}
        </p>
        <p>Sync frequency: {integration.syncFrequency === "15min" ? "Every 15 minutes" : integration.syncFrequency}</p>
        {integration.lastSyncError && (
          <p className="text-danger text-[11px]">{integration.lastSyncError}</p>
        )}
      </div>

      <div className="flex gap-1.5">
        <Button size="sm" variant="secondary" onClick={() => triggerSync(integration.id)} isLoading={syncing}>
          <RefreshCw className={cn("w-3 h-3", syncing && "animate-spin")} />
          Sync Now
        </Button>
        <button
          onClick={handleDisconnect}
          className="text-xs text-text-faint hover:text-danger border border-border-subtle rounded-button px-2.5 py-1.5 transition-colors"
        >
          <Unplug className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function QBLogo() {
  return (
    <div className="w-8 h-8 rounded-[8px] bg-[#2CA01C] flex items-center justify-center text-white font-bold text-xs">
      QB
    </div>
  );
}
