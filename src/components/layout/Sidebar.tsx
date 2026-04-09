"use client";
import { LayoutDashboard, Building2, ArrowLeftRight, Users, BrainCircuit, Target, GitBranch, Activity, Settings } from "lucide-react";
import { cn } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/Badge";
import { useDashboardStore } from "@/lib/stores/dashboardStore";

const mainNav = [
  { id: "financial", label: "Dashboard", icon: LayoutDashboard },
  { id: "businesses", label: "Businesses", icon: Building2, disabled: true },
  { id: "transactions", label: "Transactions", icon: ArrowLeftRight, disabled: true },
  { id: "employees", label: "Employees", icon: Users, disabled: true },
];

const moduleNav = [
  { id: "workforce", label: "Workforce", icon: Users, soon: true },
  { id: "ooda", label: "OODA Loop", icon: BrainCircuit, soon: true },
  { id: "goals", label: "Goals", icon: Target, soon: true },
  { id: "scenarios", label: "Scenarios", icon: GitBranch, soon: true },
  { id: "pulse", label: "Pulse", icon: Activity, soon: true },
];

export function Sidebar() {
  const activeTab = useDashboardStore((s) => s.activeTab);
  const setActiveTab = useDashboardStore((s) => s.setActiveTab);

  return (
    <aside className="w-[220px] bg-[#111111] border-r border-border flex flex-col h-screen sticky top-0 shrink-0">
      <div className="px-4 py-5 flex items-center gap-2.5">
        <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent-hover rounded-[8px] flex items-center justify-center">
          <span className="text-bg font-extrabold text-xs">ED</span>
        </div>
        <span className="text-text-primary font-bold text-base">EDI</span>
      </div>

      <nav className="px-3 flex-1">
        <p className="text-[11px] font-semibold text-text-faint uppercase tracking-[1.5px] px-2 mb-2 mt-4">Main</p>
        {mainNav.map((item) => (
          <button
            key={item.id}
            onClick={() => !item.disabled && setActiveTab(item.id)}
            disabled={item.disabled}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-150 mb-0.5",
              activeTab === item.id
                ? "bg-accent-subtle text-accent font-semibold"
                : "text-text-muted hover:bg-surface-elevated hover:text-text-secondary",
              item.disabled && "opacity-40 cursor-not-allowed"
            )}
          >
            <item.icon className="w-[18px] h-[18px]" />
            {item.label}
          </button>
        ))}

        <p className="text-[11px] font-semibold text-text-faint uppercase tracking-[1.5px] px-2 mb-2 mt-6">Modules</p>
        {moduleNav.map((item) => (
          <button
            key={item.id}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-sm font-medium text-text-muted opacity-40 cursor-not-allowed mb-0.5"
            disabled
          >
            <item.icon className="w-[18px] h-[18px]" />
            {item.label}
            {item.soon && <Badge className="ml-auto text-[10px]">Soon</Badge>}
          </button>
        ))}
      </nav>

      <div className="px-3 pb-4">
        <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-sm font-medium text-text-muted hover:bg-surface-elevated hover:text-text-secondary transition-all duration-150">
          <Settings className="w-[18px] h-[18px]" />
          Settings
        </button>
      </div>
    </aside>
  );
}
