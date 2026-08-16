"use client";
import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Route-level safety net. Individual widgets are wrapped in their own
 * boundary (WidgetErrorBoundary), so this only renders if something outside
 * a widget — or the page shell itself — throws.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-danger-bg flex items-center justify-center mb-5">
        <AlertTriangle className="w-7 h-7 text-danger" />
      </div>
      <h1 className="text-xl font-bold text-text-primary mb-2">Something went wrong</h1>
      <p className="text-sm text-text-muted max-w-md mb-1">
        The dashboard hit an unexpected error. Your data is safe — retrying will
        reload just this view.
      </p>
      {error.digest && (
        <p className="font-mono text-[10px] text-text-faint mb-5">
          Ref: {error.digest}
        </p>
      )}
      <div className="mt-4">
        <Button onClick={() => retry()}>
          <RotateCw className="w-4 h-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}
