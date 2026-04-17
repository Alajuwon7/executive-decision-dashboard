import type { Employee } from "@/lib/data/types";
import { calculateMonthlyCost } from "./workforce-calculations";

export interface EmployeeROI {
  total: number;
  label: "High Value" | "Average" | "Under Review" | "Low ROI";
  color: string;
  activityScore: number;
  tenureScore: number;
  roleWeightScore: number;
  costScore: number;
}

function tenureScore(employee: Employee): number {
  if (!employee.startDate) return 10;
  const months = (Date.now() - new Date(employee.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
  if (months < 3) return 5;
  if (months < 12) return 10 + Math.min(5, months / 12 * 5);
  if (months < 24) return 20;
  return 25;
}

function roleWeightScore(employee: Employee, allEmployees: Employee[]): number {
  const costs = allEmployees.map((e) => calculateMonthlyCost(e));
  const maxCost = Math.max(...costs, 1);
  const myCost = calculateMonthlyCost(employee);
  return Math.round(10 + (myCost / maxCost) * 15);
}

function costEfficiencyScore(employee: Employee, allEmployees: Employee[]): number {
  const active = allEmployees.filter((e) => e.status === "active");
  if (active.length === 0) return 12;
  const costs = active.map((e) => calculateMonthlyCost(e));
  const avg = costs.reduce((a, b) => a + b, 0) / costs.length;
  if (avg === 0) return 12;
  const myCost = calculateMonthlyCost(employee);
  const ratio = myCost / avg;
  if (ratio <= 0.7) return 25;
  if (ratio <= 1.0) return 18;
  if (ratio <= 1.3) return 10;
  return 5;
}

function labelFor(score: number): EmployeeROI["label"] {
  if (score >= 75) return "High Value";
  if (score >= 50) return "Average";
  if (score >= 25) return "Under Review";
  return "Low ROI";
}

function colorFor(label: EmployeeROI["label"]): string {
  switch (label) {
    case "High Value": return "text-success";
    case "Average": return "text-accent";
    case "Under Review": return "text-warning";
    case "Low ROI": return "text-danger";
  }
}

export function calculateEmployeeROI(employee: Employee, allEmployees: Employee[]): EmployeeROI {
  const activity = 50;
  const tenure = tenureScore(employee);
  const roleWeight = roleWeightScore(employee, allEmployees);
  const cost = costEfficiencyScore(employee, allEmployees);
  const total = Math.min(100, Math.round(activity + tenure + roleWeight + cost) / 4 * 100 / 100);
  const normalized = Math.min(100, Math.round(
    (activity / 100) * 25 + (tenure / 25) * 25 + (roleWeight / 25) * 25 + (cost / 25) * 25
  ));
  const label = labelFor(normalized);
  return {
    total: normalized,
    label,
    color: colorFor(label),
    activityScore: activity,
    tenureScore: tenure,
    roleWeightScore: roleWeight,
    costScore: cost,
  };
}
