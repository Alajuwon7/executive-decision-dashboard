import type { Employee } from "@/lib/data/types";
import { normalizeToUSD } from "./currency";

export function calculateMonthlyCost(employee: Employee): number {
  if (employee.status !== "active") return 0;
  const usd = normalizeToUSD(employee.rate, employee.currency);
  if (employee.compensationType === "salary") {
    return usd / 12;
  }
  return usd * (employee.hoursPerWeek ?? 0) * 4.33;
}

export function calculateAdjustedMonthlyCost(
  employee: Employee,
  adjRate?: number,
  adjHours?: number
): number {
  const rate = adjRate ?? employee.rate;
  const hours = adjHours ?? employee.hoursPerWeek ?? 0;
  const usd = normalizeToUSD(rate, employee.currency);
  if (employee.compensationType === "salary") {
    return usd / 12;
  }
  return usd * hours * 4.33;
}

export function calculateTotalPayroll(employees: Employee[]): number {
  return employees
    .filter((e) => e.status === "active")
    .reduce((sum, e) => sum + calculateMonthlyCost(e), 0);
}

export function calculateAdjustedPayroll(
  employees: Employee[],
  adjustments: Record<string, { rate?: number; hours?: number }>
): number {
  return employees
    .filter((e) => e.status === "active")
    .reduce((sum, e) => {
      const adj = adjustments[e.id];
      if (adj) {
        return sum + calculateAdjustedMonthlyCost(e, adj.rate, adj.hours);
      }
      return sum + calculateMonthlyCost(e);
    }, 0);
}

export function calculateCostDelta(
  employee: Employee,
  adjRate?: number,
  adjHours?: number
): { monthly: number; annual: number } {
  const current = calculateMonthlyCost(employee);
  const adjusted = calculateAdjustedMonthlyCost(employee, adjRate, adjHours);
  const monthly = adjusted - current;
  return { monthly, annual: monthly * 12 };
}

export function calculateAverageCost(employees: Employee[]): number {
  const active = employees.filter((e) => e.status === "active");
  if (active.length === 0) return 0;
  return calculateTotalPayroll(active) / active.length;
}

export function calculateFTE(employees: Employee[]): number {
  return employees
    .filter((e) => e.status === "active")
    .reduce((sum, e) => {
      if (e.compensationType === "salary") return sum + 1;
      return sum + (e.hoursPerWeek ?? 0) / 40;
    }, 0);
}
