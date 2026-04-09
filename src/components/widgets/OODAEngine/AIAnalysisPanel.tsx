"use client";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/formatters";

interface AIAnalysisPanelProps {
  children: React.ReactNode;
  className?: string;
}

export function AIAnalysisPanel({ children, className }: AIAnalysisPanelProps) {
  return (
    <div className={cn("bg-[rgba(245,158,11,0.04)] border border-accent/10 rounded-card p-5", className)}>
      <div className="flex items-center gap-1.5 mb-4">
        <Sparkles className="w-3.5 h-3.5 text-accent" />
        <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">AI Analysis</span>
      </div>
      {children}
    </div>
  );
}
