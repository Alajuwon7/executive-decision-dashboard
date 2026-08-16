"use client";
import { catchError, type ErrorInfo } from "next/error";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Fallback shown when a single widget throws. Keeps the failure contained to
 * that card so the rest of the dashboard stays interactive.
 */
function WidgetErrorFallback({ title }: { title?: string }, { error, retry }: ErrorInfo) {
  // `error` is typed `unknown` — anything can be thrown, not just an Error.
  const message =
    error instanceof Error && error.message
      ? error.message
      : "An unexpected error occurred.";

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center text-center py-8 px-4"
    >
      <div className="w-10 h-10 rounded-full bg-danger-bg flex items-center justify-center mb-3">
        <AlertTriangle className="w-5 h-5 text-danger" />
      </div>
      <p className="text-sm font-semibold text-text-secondary mb-1">
        {title ? `${title} couldn't load` : "This widget couldn't load"}
      </p>
      <p className="text-xs text-text-faint mb-4 max-w-xs line-clamp-2" title={message}>
        {message}
      </p>
      <Button size="sm" variant="secondary" onClick={() => retry()}>
        <RotateCw className="w-3.5 h-3.5" />
        Retry
      </Button>
    </div>
  );
}

export const WidgetErrorBoundary = catchError(WidgetErrorFallback);
