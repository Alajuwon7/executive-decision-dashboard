"use client";
import { useMemo } from "react";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { useGoalStore, type OwnerFilter } from "@/lib/stores/goalStore";
import { cn } from "@/lib/utils/formatters";

const TABS: Array<{ value: OwnerFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "his", label: "His" },
  { value: "hers", label: "Hers" },
  { value: "shared", label: "Shared" },
  { value: "company", label: "Company" },
];

export function OwnerTabs() {
  const { goals } = useFinancialStore();
  const ownerFilter = useGoalStore((s) => s.ownerFilter);
  const setOwnerFilter = useGoalStore((s) => s.setOwnerFilter);

  const counts = useMemo(() => {
    const map: Record<OwnerFilter, number> = { all: 0, his: 0, hers: 0, shared: 0, company: 0 };
    for (const g of goals) {
      if (g.status === "abandoned") continue;
      map.all++;
      map[g.owner]++;
    }
    return map;
  }, [goals]);

  return (
    <div className="flex gap-1 flex-wrap mb-3">
      {TABS.map((t) => {
        const isActive = ownerFilter === t.value;
        return (
          <button
            key={t.value}
            onClick={() => setOwnerFilter(t.value)}
            className={cn(
              "px-3 py-1.5 rounded-button text-xs font-semibold transition-all duration-150 border flex items-center gap-1.5",
              isActive
                ? "bg-accent-subtle text-accent border-accent/30"
                : "bg-transparent text-text-muted border-border-subtle hover:border-text-muted"
            )}
          >
            {t.label}
            <span className="font-mono text-[10px] text-text-faint">{counts[t.value]}</span>
          </button>
        );
      })}
    </div>
  );
}
