import { Skeleton } from "@/components/ui/Skeleton";
import type { LayoutItem } from "@/lib/data/types";

// Must mirror the values passed to ResponsiveGridLayout in DashboardGrid so the
// skeleton occupies the exact footprint the real widgets will.
const ROW_HEIGHT = 80;
const MARGIN = 16;
const COLS = 12;

/** Body treatments that echo the real shape of each widget. */
function WidgetBody({ id }: { id: string }) {
  switch (id) {
    case "financial":
      return (
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-surface-elevated rounded-[12px] p-4 space-y-2">
                <Skeleton className="h-2.5 w-14 rounded-[4px]" />
                <Skeleton className="h-6 w-24 rounded-[6px]" />
              </div>
            ))}
          </div>
          <BarRow />
        </div>
      );
    case "scenarios":
      return (
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          <div className="flex gap-2">
            <Skeleton className="h-7 w-28 rounded-button" />
            <Skeleton className="h-7 w-28 rounded-button" />
          </div>
          <BarRow />
        </div>
      );
    case "goals":
      return (
        <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface-elevated rounded-[12px] p-4 space-y-3">
              <Skeleton className="h-3 w-32 rounded-[4px]" />
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-2.5 w-20 rounded-[4px]" />
            </div>
          ))}
        </div>
      );
    default:
      return <RowList />;
  }
}

/** Deterministic bar heights — Math.random() here would break hydration. */
const BAR_HEIGHTS = [46, 62, 38, 74, 55, 88, 43, 67, 51, 79];

function BarRow() {
  return (
    <div className="flex items-end gap-2 flex-1 min-h-[80px]">
      {BAR_HEIGHTS.map((h, i) => (
        <Skeleton key={i} className="flex-1 rounded-[4px]" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

function RowList() {
  return (
    <div className="space-y-2.5 flex-1 min-h-0">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 bg-surface-elevated rounded-[10px] p-3"
        >
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-2.5 w-1/3 rounded-[4px]" />
            <Skeleton className="h-2 w-1/2 rounded-[4px]" />
          </div>
          <Skeleton className="h-5 w-14 rounded-[6px] shrink-0" />
        </div>
      ))}
    </div>
  );
}

function WidgetCard({ item }: { item: LayoutItem }) {
  return (
    <div
      className="bg-surface border border-border rounded-card p-5 flex flex-col overflow-hidden"
      style={{
        gridColumn: `${item.x + 1} / span ${item.w}`,
        gridRow: `${item.y + 1} / span ${item.h}`,
      }}
    >
      {/* Mirrors WidgetWrapper's header: title left, two icon buttons right */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-44 rounded-[6px]" />
        <div className="flex items-center gap-1">
          <Skeleton className="h-6 w-6 rounded-[6px]" />
          <Skeleton className="h-6 w-6 rounded-[6px]" />
        </div>
      </div>
      <WidgetBody id={item.i} />
    </div>
  );
}

interface DashboardSkeletonProps {
  layout: LayoutItem[];
}

export function DashboardSkeleton({ layout }: DashboardSkeletonProps) {
  return (
    <div aria-busy="true" aria-label="Loading dashboard">
      {/* ≥768px matches ResponsiveGridLayout's `lg` breakpoint — reproduce the
          real grid exactly so nothing shifts when the widgets swap in. */}
      <div
        className="hidden md:grid"
        style={{
          gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
          gridAutoRows: `${ROW_HEIGHT}px`,
          gap: `${MARGIN}px`,
        }}
      >
        {layout.map((item) => (
          <WidgetCard key={item.i} item={item} />
        ))}
      </div>

      {/* Below the grid breakpoint widgets stack full-width. */}
      <div className="md:hidden space-y-4">
        {layout.slice(0, 3).map((item) => (
          <div
            key={item.i}
            className="bg-surface border border-border rounded-card p-5 flex flex-col overflow-hidden"
            style={{ height: item.h * ROW_HEIGHT + (item.h - 1) * MARGIN }}
          >
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-40 rounded-[6px]" />
              <div className="flex items-center gap-1">
                <Skeleton className="h-6 w-6 rounded-[6px]" />
                <Skeleton className="h-6 w-6 rounded-[6px]" />
              </div>
            </div>
            <WidgetBody id={item.i} />
          </div>
        ))}
      </div>
    </div>
  );
}
