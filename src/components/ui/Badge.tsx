import { cn } from "@/lib/utils/formatters";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "accent";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-elevated text-text-muted",
  success: "bg-success-bg text-success",
  warning: "bg-[rgba(245,158,11,0.12)] text-accent",
  danger: "bg-danger-bg text-danger",
  info: "bg-[rgba(59,130,246,0.12)] text-info",
  accent: "bg-accent-subtle text-accent",
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold",
      variantStyles[variant],
      className
    )}>
      {children}
    </span>
  );
}
