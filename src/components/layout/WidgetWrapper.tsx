"use client";
import { GripVertical, ChevronDown, ChevronUp, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils/formatters";
import { useDashboardStore } from "@/lib/stores/dashboardStore";

interface WidgetWrapperProps {
  id: string;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function WidgetWrapper({ id, title, children, actions, className }: WidgetWrapperProps) {
  const collapsedWidgets = useDashboardStore((s) => s.collapsedWidgets);
  const maximizedWidget = useDashboardStore((s) => s.maximizedWidget);
  const toggleCollapse = useDashboardStore((s) => s.toggleCollapse);
  const setMaximized = useDashboardStore((s) => s.setMaximized);

  const isCollapsed = collapsedWidgets.has(id);
  const isMaximized = maximizedWidget === id;

  const headerContent = (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="drag-handle cursor-grab active:cursor-grabbing text-text-faint hover:text-text-muted transition-colors">
          <GripVertical className="w-4 h-4" />
        </div>
        <h3 className="text-base font-bold text-text-primary">{title}</h3>
      </div>
      <div className="flex items-center gap-1">
        {actions}
        <button
          onClick={() => toggleCollapse(id)}
          className="w-7 h-7 flex items-center justify-center rounded-[6px] text-text-faint hover:bg-surface-elevated hover:text-text-muted transition-all"
        >
          {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => setMaximized(isMaximized ? null : id)}
          className="w-7 h-7 flex items-center justify-center rounded-[6px] text-text-faint hover:bg-surface-elevated hover:text-text-muted transition-all"
        >
          {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );

  if (isMaximized) {
    return (
      <>
        <div className="bg-surface border border-border rounded-card p-5 opacity-30">
          {headerContent}
        </div>
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-8">
          <div className="bg-surface border border-border rounded-card p-6 w-full max-w-6xl max-h-[90vh] overflow-auto">
            {headerContent}
            {children}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className={cn(
      "bg-surface border border-border rounded-card p-5 transition-all duration-200 h-full",
      className
    )}>
      {headerContent}
      <div className={cn(
        "transition-all duration-200 overflow-hidden",
        isCollapsed ? "max-h-0 opacity-0" : "max-h-[2000px] opacity-100"
      )}>
        {children}
      </div>
    </div>
  );
}
