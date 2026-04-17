"use client";
import { useEffect, useState } from "react";
import type { GoalStatus } from "@/lib/data/types";
import { cn } from "@/lib/utils/formatters";

interface GoalProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  status: GoalStatus;
  label?: string;
}

const statusStroke: Record<GoalStatus, string> = {
  active: "#14B8A6",
  at_risk: "#F59E0B",
  behind: "#EF4444",
  achieved: "#22C55E",
  abandoned: "#525252",
};

export function GoalProgressRing({
  percentage,
  size = 88,
  strokeWidth = 6,
  status,
  label,
}: GoalProgressRingProps) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(Math.max(0, Math.min(100, percentage))), 50);
    return () => clearTimeout(timer);
  }, [percentage]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference * (1 - animated / 100);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2A2A2A"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={statusStroke[status]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("font-mono text-sm font-bold text-text-primary")}>{label ?? `${Math.round(percentage)}%`}</span>
      </div>
    </div>
  );
}
