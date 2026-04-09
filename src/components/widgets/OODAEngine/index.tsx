"use client";
import { useEffect, useState } from "react";
import { useOODAStore } from "@/lib/stores/oodaStore";
import { repository } from "@/lib/data";
import { DecisionCard } from "./DecisionCard";
import { NewDecisionForm } from "./NewDecisionForm";
import { DecisionTimeline } from "./DecisionTimeline";
import { OODAModal } from "./OODAModal";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Plus, History, BrainCircuit, Zap, ShoppingCart, UserPlus, Building2, Package, Handshake } from "lucide-react";
import type { OODADecision } from "@/lib/data/ooda-types";

const TRIGGER_TYPES = [
  { icon: Zap, label: "Termination" },
  { icon: ShoppingCart, label: "Purchase" },
  { icon: UserPlus, label: "New Hire" },
  { icon: Building2, label: "New Business" },
  { icon: Package, label: "New Product" },
  { icon: Handshake, label: "Partnership" },
];

export function OODAEngine() {
  const { showNewDecisionForm, setShowNewDecisionForm, showTimeline, setShowTimeline, openDecision } = useOODAStore();
  const [decisions, setDecisions] = useState<OODADecision[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDecisions = async () => {
    try {
      const all = await repository.getOODADecisions();
      setDecisions(all.filter((d) => d.status === "in_progress"));
    } catch { /* ignore */ }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    loadDecisions();
  }, []);

  // Reload when modal closes
  const { isModalOpen } = useOODAStore();
  useEffect(() => {
    if (!isModalOpen) loadDecisions();
  }, [isModalOpen]);

  return (
    <div>
      {/* New Decision button */}
      <Button size="sm" className="mb-4" onClick={() => setShowNewDecisionForm(true)}>
        <Plus className="w-3.5 h-3.5" /> New Decision
      </Button>

      {/* Active decisions */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
        </div>
      ) : decisions.length > 0 ? (
        <div className="space-y-3 mb-4">
          {decisions.map((d) => (
            <DecisionCard key={d.id} decision={d} onContinue={() => openDecision(d.id, d.stage)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 mb-4">
          <BrainCircuit className="w-8 h-8 text-text-faint mx-auto mb-2 opacity-40" />
          <p className="text-sm text-text-muted mb-1">No active decisions</p>
          <p className="text-xs text-text-faint mb-3">Start one when facing a major business decision.</p>
          <div className="flex flex-wrap justify-center gap-2">
            {TRIGGER_TYPES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 px-2 py-1 rounded-[6px] bg-surface-elevated text-text-faint text-[10px]">
                <Icon className="w-3 h-3" /> {label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History link */}
      <button onClick={() => setShowTimeline(true)} className="text-xs text-accent hover:underline flex items-center gap-1">
        <History className="w-3 h-3" /> View Decision History
      </button>

      {/* Modals */}
      <Modal isOpen={showNewDecisionForm} onClose={() => setShowNewDecisionForm(false)} title="New Decision">
        <NewDecisionForm onClose={() => setShowNewDecisionForm(false)} />
      </Modal>

      <Modal isOpen={showTimeline} onClose={() => setShowTimeline(false)} title="Decision History" className="max-w-2xl">
        <DecisionTimeline />
      </Modal>

      {/* OODA Flow Modal */}
      <OODAModal />
    </div>
  );
}
