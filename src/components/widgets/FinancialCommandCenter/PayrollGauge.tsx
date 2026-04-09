"use client";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { Badge } from "@/components/ui/Badge";

export function PayrollGauge() {
  const ratio = useFinancialStore((s) => s.getPayrollToRevenueRatio());
  const clampedRatio = Math.min(ratio, 100);
  const angle = (clampedRatio / 100) * 180;
  const radians = ((180 - angle) * Math.PI) / 180;
  const cx = 70, cy = 65, r = 50;
  const endX = cx + r * Math.cos(radians);
  const endY = cy - r * Math.sin(radians);

  const getColor = () => {
    if (ratio < 30) return { color: "#22C55E", label: "Healthy Range", variant: "success" as const };
    if (ratio < 40) return { color: "#F59E0B", label: "Caution", variant: "warning" as const };
    return { color: "#EF4444", label: "Warning", variant: "danger" as const };
  };
  const { color, label, variant } = getColor();

  return (
    <div className="flex flex-col items-center py-2">
      <p className="text-base font-bold text-text-primary mb-3">Payroll / Revenue</p>
      <svg viewBox="0 0 140 80" width="140" height="80">
        <path d="M 15 65 A 55 55 0 0 1 125 65" fill="none" stroke="#1E1E1E" strokeWidth="10" strokeLinecap="round" />
        <path d={`M 15 65 A 55 55 0 0 1 ${endX} ${endY}`} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />
      </svg>
      <p className="font-mono text-3xl font-bold mt-1" style={{ color }}>{ratio.toFixed(0)}%</p>
      <p className="text-xs text-text-muted mt-1">of revenue goes to payroll</p>
      <Badge variant={variant} className="mt-2 text-[10px]">{"\u2713"} {label}</Badge>
    </div>
  );
}
