"use client";
import { useState } from "react";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { formatCurrency } from "@/lib/utils/currency";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils/formatters";

const BIZ_COLORS = ["#F59E0B", "#8B5CF6", "#22C55E", "#3B82F6"];

export function BusinessBreakdown() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const breakdown = useFinancialStore((s) => s.getBusinessBreakdown());
  return (
    <div>
      <p className="text-base font-bold text-text-primary mb-3">Businesses</p>
      <div className="space-y-2">
        {breakdown.map((item, i) => (
          <button key={item.business.id} onClick={() => setExpanded(expanded === item.business.id ? null : item.business.id)} className="w-full text-left bg-surface-elevated rounded-[10px] p-3.5 transition-all duration-150 hover:bg-[#1E1E1E]">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: BIZ_COLORS[i] }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-secondary truncate">{item.business.displayName}</p>
                <p className="text-xs text-text-muted mt-0.5">Revenue: {formatCurrency(item.revenue)}/mo</p>
              </div>
              <p className={cn("font-mono text-sm font-semibold", item.netIncome >= 0 ? "text-success" : "text-danger")}>{item.netIncome >= 0 ? "+" : ""}{formatCurrency(item.netIncome)}</p>
              {expanded === item.business.id ? <ChevronUp className="w-3.5 h-3.5 text-text-faint" /> : <ChevronDown className="w-3.5 h-3.5 text-text-faint" />}
            </div>
            {expanded === item.business.id && (
              <div className="mt-3 pt-3 border-t border-border space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-text-muted">Revenue</span><span className="font-mono text-text-secondary">{formatCurrency(item.revenue)}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Expenses</span><span className="font-mono text-text-secondary">{formatCurrency(item.expenses)}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Payroll</span><span className="font-mono text-text-secondary">{formatCurrency(item.payroll)}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Margin</span><span className="font-mono text-text-secondary">{item.margin.toFixed(1)}%</span></div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
