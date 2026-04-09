"use client";
import { cn } from "@/lib/utils/formatters";

interface SliderProps {
  label?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  className?: string;
  disabled?: boolean;
}

export function Slider({ label, min, max, step, value, onChange, formatValue, className, disabled }: SliderProps) {
  const percentage = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</span>
          <span className="font-mono text-sm text-text-primary font-medium">
            {formatValue ? formatValue(value) : value}
          </span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: `linear-gradient(to right, #F59E0B ${percentage}%, #1E1E1E ${percentage}%)`,
        }}
      />
      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #F59E0B;
          border: 2px solid #0A0A0A;
          box-shadow: 0 0 6px rgba(245, 158, 11, 0.3);
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #F59E0B;
          border: 2px solid #0A0A0A;
          box-shadow: 0 0 6px rgba(245, 158, 11, 0.3);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
