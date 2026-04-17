import type { Employee } from "@/lib/data/types";
import { calculateTotalPayroll, calculateAdjustedPayroll } from "./workforce-calculations";

export function computeMonthlyPayroll(employees: Employee[]): number {
  return calculateTotalPayroll(employees.filter((e) => e.status === "active"));
}

export function computeAdjustedMonthlyPayroll(
  employees: Employee[],
  adjustments: Record<string, { rate?: number; hours?: number }>
): number {
  return calculateAdjustedPayroll(
    employees.filter((e) => e.status === "active"),
    adjustments
  );
}
