"use client";
import { useMemo } from "react";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { formatCurrency } from "@/lib/utils/currency";
import { calculateExpensesByCategory } from "@/lib/utils/calculations";

export function ExpenseCategoryChart() {
  const { expenses } = useFinancialStore();
  const categories = useMemo(() => calculateExpensesByCategory(expenses), [expenses]);
  const maxAmount = Math.max(...categories.map((c) => c.amount), 1);
  return (
    <div>
      <p className="text-base font-bold text-text-primary mb-3">Expense Categories</p>
      <div className="space-y-2.5">
        {categories.map((cat) => (
          <div key={cat.category} className="flex items-center gap-2.5">
            <span className="text-xs text-text-tertiary w-16 shrink-0 font-medium">{cat.category}</span>
            <div className="flex-1 h-2.5 bg-border rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(cat.amount / maxAmount) * 100}%`, background: `linear-gradient(90deg, ${cat.color}, ${cat.color}90)` }} />
            </div>
            <span className="font-mono text-xs text-text-tertiary w-16 text-right shrink-0">{formatCurrency(cat.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
