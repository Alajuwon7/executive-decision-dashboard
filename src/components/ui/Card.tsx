import { cn } from "@/lib/utils/formatters";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ className, interactive, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-card p-5",
        interactive && "cursor-pointer transition-all duration-200 hover:border-border-subtle hover:bg-surface-elevated",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
