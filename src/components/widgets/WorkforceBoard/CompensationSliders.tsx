"use client";
import { Slider } from "@/components/ui/Slider";
import { useWorkforceStore } from "@/lib/stores/workforceStore";
import { formatCurrency } from "@/lib/utils/currency";
import type { Employee } from "@/lib/data/types";

interface CompensationSlidersProps {
  employee: Employee;
}

export function CompensationSliders({ employee }: CompensationSlidersProps) {
  const adjustment = useWorkforceStore((s) => s.adjustments[employee.id]);
  const setAdjustment = useWorkforceStore((s) => s.setAdjustment);
  const clearAdjustment = useWorkforceStore((s) => s.clearAdjustment);

  const currentRate = adjustment?.rate ?? employee.rate;
  const currentHours = adjustment?.hours ?? employee.hoursPerWeek ?? 0;

  const isHourly = employee.compensationType === "hourly";
  const hasChanges = adjustment?.rate !== undefined || adjustment?.hours !== undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Compensation Adjustment</p>
        {hasChanges && (
          <button
            onClick={() => clearAdjustment(employee.id)}
            className="text-xs text-accent hover:underline"
          >
            Reset
          </button>
        )}
      </div>

      <Slider
        label={isHourly ? "Hourly Rate" : "Annual Salary"}
        min={0}
        max={isHourly ? 100 : 200000}
        step={isHourly ? 0.5 : 1000}
        value={currentRate}
        onChange={(val) => setAdjustment(employee.id, { ...adjustment, rate: val })}
        formatValue={(v) => isHourly ? `${formatCurrency(v, employee.currency)}/hr` : formatCurrency(v, employee.currency)}
      />

      {isHourly && (
        <Slider
          label="Hours per Week"
          min={0}
          max={60}
          step={1}
          value={currentHours}
          onChange={(val) => setAdjustment(employee.id, { ...adjustment, hours: val })}
          formatValue={(v) => `${v} hrs`}
        />
      )}
    </div>
  );
}
