"use client";
import { forwardRef } from "react";
import { cn } from "@/lib/utils/formatters";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          "w-full bg-bg border border-border rounded-[8px] px-3 py-2.5 text-sm text-text-primary transition-all duration-200 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30",
          error && "border-danger",
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
);
Select.displayName = "Select";
