"use client";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
      <AlertTriangle className="w-8 h-8 text-danger" />
      <p className="text-sm font-semibold text-text-primary">{title}</p>
      {message && <p className="text-xs text-text-muted max-w-xs">{message}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-2">
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}
