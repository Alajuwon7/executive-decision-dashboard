"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Plus, LogOut, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getUser, logout, type AppUser } from "@/lib/auth";
import { useOODAStore } from "@/lib/stores/oodaStore";
import { AlertBell } from "@/components/widgets/PulseAlerts/AlertBell";

interface TopBarProps {
  onAddEntry: () => void;
}

export function TopBar({ onAddEntry }: TopBarProps) {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const { setShowNewDecisionForm } = useOODAStore();

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg/80 backdrop-blur-sm sticky top-0 z-40">
      <h1 className="text-xl font-bold text-text-primary">Dashboard</h1>

      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm">
          <Download className="w-3.5 h-3.5" />
          Export
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setShowNewDecisionForm(true)}>
          <BrainCircuit className="w-3.5 h-3.5" />
          New Decision
        </Button>
        <Button size="sm" onClick={onAddEntry}>
          <Plus className="w-3.5 h-3.5" />
          Add Entry
        </Button>
        <AlertBell />
        <div className="flex items-center gap-2 ml-2 pl-3 border-l border-border">
          <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent-hover rounded-full flex items-center justify-center">
            <span className="text-bg text-xs font-bold">{user?.initials ?? "?"}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-text-muted hover:text-text-secondary transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
