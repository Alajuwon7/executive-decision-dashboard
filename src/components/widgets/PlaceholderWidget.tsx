import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function PlaceholderWidget({ title, description, icon: Icon }: { title: string; description: string; icon: LucideIcon }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center h-full">
      <Icon className="w-8 h-8 text-text-faint mb-3 opacity-40" />
      <p className="text-sm font-semibold text-text-muted">{title}</p>
      <p className="text-xs text-text-faint mt-1 max-w-[180px]">{description}</p>
      <Badge className="mt-3 text-[10px]">Coming Soon</Badge>
    </div>
  );
}
