"use client";
import { useEffect, useMemo, useRef } from "react";
import { Activity, CheckCircle2 } from "lucide-react";
import { usePulseStore } from "@/lib/stores/pulseStore";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { repository } from "@/lib/data";
import { runPulseDetection } from "@/lib/utils/pulse-detector";
import { cn } from "@/lib/utils/formatters";
import { AlertCard } from "./AlertCard";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
] as const;

export function PulseAlerts() {
  const { alerts, fetchAlerts, markAsRead, dismissAlert, severityFilter, setSeverityFilter } = usePulseStore();
  const { businesses, employees, expenses, revenueEntries, goals } = useFinancialStore();
  const lastKeyRef = useRef<string>("");

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Debounced pulse detection (3s)
  useEffect(() => {
    const key = `${employees.length}:${expenses.length}:${revenueEntries.length}:${goals.length}`;
    if (key === lastKeyRef.current) return;

    const timer = setTimeout(async () => {
      lastKeyRef.current = key;
      try {
        const existing = await repository.getPulseAlerts();
        const decisions = await repository.getOODADecisions();
        const candidates = runPulseDetection({
          employees,
          expenses,
          revenueEntries,
          goals,
          decisions,
          businesses,
          existingAlerts: existing,
        });
        for (const c of candidates) {
          await repository.createPulseAlert(c);
        }
        if (candidates.length > 0) await fetchAlerts();
      } catch (err) {
        console.error("Pulse detection failed", err);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [employees, expenses, revenueEntries, goals, businesses, fetchAlerts]);

  const visible = useMemo(() => {
    return alerts.filter((a) => severityFilter === "all" || a.severity === severityFilter);
  }, [alerts, severityFilter]);

  const unread = alerts.filter((a) => !a.isRead).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <p className="font-serif text-sm text-text-muted">Pulse</p>
          {unread > 0 && (
            <span className="text-[10px] font-bold bg-danger text-white rounded-full px-1.5 py-0.5">
              {unread}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-1 mb-3">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setSeverityFilter(f.value)}
            className={cn(
              "px-2.5 py-1 rounded-button text-[10px] font-semibold border transition-colors",
              severityFilter === f.value
                ? "bg-accent-subtle text-accent border-accent/30"
                : "bg-transparent text-text-muted border-border-subtle hover:border-text-muted"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <CheckCircle2 className="w-8 h-8 text-success" />
          <p className="text-sm text-text-muted font-semibold">All clear</p>
          <p className="text-xs text-text-faint">No alerts to report.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((a) => (
            <AlertCard key={a.id} alert={a} onRead={() => markAsRead(a.id)} onDismiss={() => dismissAlert(a.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
