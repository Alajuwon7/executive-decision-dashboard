"use client";
import { useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { usePulseStore } from "@/lib/stores/pulseStore";
import { cn } from "@/lib/utils/formatters";
import { AlertCard } from "./AlertCard";

export function AlertBell() {
  const { alerts, isBellOpen, toggleBell, closeBell, fetchAlerts, markAsRead, dismissAlert, subscribeToAlerts } = usePulseStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAlerts();
    const unsubscribe = subscribeToAlerts();
    return unsubscribe;
  }, [fetchAlerts, subscribeToAlerts]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) closeBell();
    };
    if (isBellOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isBellOpen, closeBell]);

  const unread = alerts.filter((a) => !a.isRead).length;
  const latest = alerts.slice(0, 5);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggleBell}
        className="relative w-9 h-9 flex items-center justify-center rounded-[8px] bg-surface-elevated text-text-muted hover:text-text-primary transition-colors border border-border-subtle"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className={cn(
            "absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center rounded-full text-[9px] font-bold bg-danger text-white"
          )}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {isBellOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-card p-3 shadow-xl z-50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Pulse Alerts</p>
            <span className="text-[10px] text-text-faint">{alerts.length} total</span>
          </div>
          {latest.length === 0 ? (
            <p className="text-xs text-text-faint py-4 text-center">No alerts</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {latest.map((a) => (
                <AlertCard key={a.id} alert={a} onRead={() => markAsRead(a.id)} onDismiss={() => dismissAlert(a.id)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
