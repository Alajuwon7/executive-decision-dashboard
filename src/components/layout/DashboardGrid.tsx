"use client";
import { useCallback, useEffect, useState } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import { useDashboardStore } from "@/lib/stores/dashboardStore";
import type { LayoutItem } from "@/lib/data/types";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardGridProps {
  children: React.ReactNode;
  defaultLayouts: Record<string, LayoutItem[]>;
}

export function DashboardGrid({ children, defaultLayouts }: DashboardGridProps) {
  const layouts = useDashboardStore((s) => s.layouts);
  const setLayouts = useDashboardStore((s) => s.setLayouts);
  const loadLayout = useDashboardStore((s) => s.loadLayout);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    loadLayout();
    setMounted(true);
  }, [loadLayout]);

  const handleLayoutChange = useCallback(
    (_layout: LayoutItem[], allLayouts: Record<string, LayoutItem[]>) => {
      setLayouts(allLayouts);
    },
    [setLayouts]
  );

  const activeLayouts = Object.keys(layouts).length > 0 ? layouts : defaultLayouts;

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={activeLayouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
      rowHeight={80}
      containerPadding={[0, 0]}
      margin={[16, 16]}
      onLayoutChange={handleLayoutChange}
      draggableHandle=".drag-handle"
      isResizable={true}
      isDraggable={true}
      useCSSTransforms={mounted}
    >
      {children}
    </ResponsiveGridLayout>
  );
}
