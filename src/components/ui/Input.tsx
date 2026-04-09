"use client";
import { forwardRef } from "react";
import { cn } from "@/lib/utils/formatters";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          "w-full bg-bg border border-border rounded-[8px] px-3 py-2.5 text-sm text-text-primary placeholder:text-text-faint transition-all duration-200 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30",
          error && "border-danger focus:border-danger focus:ring-danger/30",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";
