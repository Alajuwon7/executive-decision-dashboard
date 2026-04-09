"use client";
import { ConsolidatedPL } from "./ConsolidatedPL";
import { CashFlowChart } from "./CashFlowChart";
import { BusinessBreakdown } from "./BusinessBreakdown";
import { ExpenseCategoryChart } from "./ExpenseCategoryChart";
import { RevenueTracker } from "./RevenueTracker";
import { PayrollGauge } from "./PayrollGauge";

export function FinancialCommandCenter() {
  return (
    <div>
      <ConsolidatedPL />
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="col-span-2"><CashFlowChart /></div>
        <div><BusinessBreakdown /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div><ExpenseCategoryChart /></div>
        <div><RevenueTracker /></div>
        <div><PayrollGauge /></div>
      </div>
    </div>
  );
}
