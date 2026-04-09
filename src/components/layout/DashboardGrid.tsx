"use client";
import { useCallback, useEffect } from "react";
import { ResponsiveGridLayout, useContainerWidth } from "react-grid-layout";
import { useDashboardStore } from "@/lib/stores/dashboardStore";
import type { LayoutItem } from "@/lib/data/types";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

interface DashboardGridProps {
  children: React.ReactNode;
  defaultLayouts: Record<string, LayoutItem[]>;
}

export function DashboardGrid({ children, defaultLayouts }: DashboardGridProps) {
  const layouts = useDashboardStore((s) => s.layouts);
  const setLayouts = useDashboardStore((s) => s.setLayouts);
  const loadLayout = useDashboardStore((s) => s.loadLayout);
  const { width, mounted } = useContainerWidth({ initialWidth: 1200 });

  useEffect(() => {
    loadLayout();
  }, [loadLayout]);

  const handleLayoutChange = useCallback(
    (_layout: any, allLayouts: any) => {
      setLayouts(allLayouts as Record<string, LayoutItem[]>);
    },
    [setLayouts]
  );

  const activeLayouts = Object.keys(layouts).length > 0 ? layouts : defaultLayouts;

  return (
    <ResponsiveGridLayout
      className="layout"
      width={width}
      layouts={activeLayouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
      rowHeight={80}
      containerPadding={[0, 0]}
      margin={[16, 16]}
      onLayoutChange={handleLayoutChange}
      dragConfig={{ enabled: true, handle: ".drag-handle" }}
      resizeConfig={{ enabled: true }}
    >
      {children}
    </ResponsiveGridLayout>
  );
}
