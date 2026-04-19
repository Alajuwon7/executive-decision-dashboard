"use client";
import { useCallback, useEffect, useRef, useMemo } from "react";
import { ResponsiveGridLayout, useContainerWidth } from "react-grid-layout";
import { useDashboardStore } from "@/lib/stores/dashboardStore";
import type { LayoutItem } from "@/lib/data/types";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

interface DashboardGridProps {
  children: React.ReactNode;
  defaultLayouts: Record<string, LayoutItem[]>;
}

function mergeLayouts(
  saved: Record<string, LayoutItem[]>,
  defaults: Record<string, LayoutItem[]>
): Record<string, LayoutItem[]> {
  const defaultItems = defaults.lg ?? [];
  const result: Record<string, LayoutItem[]> = {};

  // Process every breakpoint that exists in either saved or defaults
  const allBreakpoints = new Set([...Object.keys(saved), ...Object.keys(defaults)]);

  for (const bp of allBreakpoints) {
    const bpSaved = saved[bp] ?? [];
    const bpDefaults = defaults[bp] ?? defaultItems;
    const savedKeys = new Set(bpSaved.map((item) => item.i));

    // Fix broken entries (0-sized from stale saves)
    const fixed = bpSaved.map((item) => {
      if (item.w < 2 || item.h < 2) {
        const def = bpDefaults.find((d) => d.i === item.i);
        if (def) return { ...def, x: item.x, y: item.y };
      }
      return item;
    });

    // Append defaults for any widget keys not in the saved layout
    const missing = bpDefaults.filter((item) => !savedKeys.has(item.i));

    result[bp] = [...fixed, ...missing];
  }

  return result;
}

export function DashboardGrid({ children, defaultLayouts }: DashboardGridProps) {
  const layouts = useDashboardStore((s) => s.layouts);
  const setLayouts = useDashboardStore((s) => s.setLayouts);
  const loadLayout = useDashboardStore((s) => s.loadLayout);
  const { width, containerRef } = useContainerWidth({ initialWidth: 1200 });
  const layoutLoaded = useRef(false);
  const changeCount = useRef(0);

  useEffect(() => {
    loadLayout();
    layoutLoaded.current = true;
  }, [loadLayout]);

  // RGL fires onLayoutChange 1-2 times on mount before any user interaction.
  // Skip those initial fires, then persist all subsequent changes.
  const handleLayoutChange = useCallback(
    (_layout: any, allLayouts: any) => {
      changeCount.current++;
      if (changeCount.current <= 2) return;
      setLayouts(allLayouts as Record<string, LayoutItem[]>);
    },
    [setLayouts]
  );

  const activeLayouts = useMemo(() => {
    return Object.keys(layouts).length > 0
      ? mergeLayouts(layouts, defaultLayouts)
      : defaultLayouts;
  }, [layouts, defaultLayouts]);

  return (
    <div ref={containerRef}>
      <ResponsiveGridLayout
        className="layout"
        width={width}
        layouts={activeLayouts}
        breakpoints={{ lg: 768, md: 640, sm: 480, xs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
        rowHeight={80}
        containerPadding={[0, 0]}
        margin={[16, 16]}
        autoSize
        onLayoutChange={handleLayoutChange}
        dragConfig={{ enabled: true, handle: ".drag-handle" }}
        resizeConfig={{ enabled: true }}
      >
        {children}
      </ResponsiveGridLayout>
    </div>
  );
}
