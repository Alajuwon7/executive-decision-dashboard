"use client";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Button } from "./Button";

interface Props {
  icon?: LucideIcon;
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
      <Icon className="w-8 h-8 text-text-faint" />
      <p className="text-sm font-semibold text-text-primary">{title}</p>
      {message && <p className="text-xs text-text-muted max-w-xs">{message}</p>}
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  );
}
