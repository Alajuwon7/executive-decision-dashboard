"use client";
import { useEffect, useState } from "react";
import { repository } from "@/lib/data";
import { DecisionCard } from "./DecisionCard";
import { useOODAStore } from "@/lib/stores/oodaStore";
import { Skeleton } from "@/components/ui/Skeleton";
import { Select } from "@/components/ui/Select";
import { History } from "lucide-react";
import type { OODADecision } from "@/lib/data/ooda-types";

export function DecisionTimeline() {
  const [decisions, setDecisions] = useState<OODADecision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const { openDecision } = useOODAStore();

  useEffect(() => {
    loadDecisions();
  }, []);

  const loadDecisions = async () => {
    setIsLoading(true);
    try {
      const data = await repository.getOODADecisions();
      setDecisions(data);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = statusFilter
    ? decisions.filter((d) => d.status === statusFilter)
    : decisions;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-text-muted" />
          <p className="text-sm font-bold text-text-primary">Decision History</p>
        </div>
        <Select
          options={[
            { value: "", label: "All Statuses" },
            { value: "in_progress", label: "In Progress" },
            { value: "decided", label: "Decided" },
            { value: "cancelled", label: "Cancelled" },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-32 !py-1.5 text-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-6">No decisions found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => (
            <DecisionCard
              key={d.id}
              decision={d}
              onContinue={() => openDecision(d.id, d.stage)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
