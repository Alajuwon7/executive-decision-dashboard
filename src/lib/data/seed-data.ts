import type { Business, Employee, Expense, RevenueEntry } from "./types";
import { generateId } from "@/lib/utils/formatters";

const MYERS_ID = "biz-myers-immigration";
const CANSTUDY_ID = "biz-canstudy-consulting";

export const seedBusinesses: Business[] = [
  {
    id: MYERS_ID,
    name: "Myers Immigration Services Inc.",
    displayName: "Myers Immigration",
    currency: "USD",
    revenueLow: 10000,
    revenueHigh: 25000,
    status: "active",
    createdAt: "2024-01-15T00:00:00Z",
  },
  {
    id: CANSTUDY_ID,
    name: "Canstudy Consulting Ltd.",
    displayName: "Canstudy Consulting",
    currency: "USD",
    revenueLow: 2000,
    revenueHigh: 8000,
    status: "active",
    createdAt: "2024-03-01T00:00:00Z",
  },
];

export const seedEmployees: Employee[] = [
  {
    id: generateId(),
    businessId: MYERS_ID,
    name: "Sarah Chen",
    roleTitle: "Immigration Attorney",
    roleDescription: null,
    compensationType: "salary",
    rate: 85000,
    currency: "USD",
    hoursPerWeek: null,
    startDate: null,
    performanceNotes: null,
    status: "active",
    createdAt: "2024-01-15T00:00:00Z",
  },
  {
    id: generateId(),
    businessId: MYERS_ID,
    name: "James Wilson",
    roleTitle: "Legal Assistant",
    roleDescription: null,
    compensationType: "hourly",
    rate: 22,
    currency: "USD",
    hoursPerWeek: 35,
    startDate: null,
    performanceNotes: null,
    status: "active",
    createdAt: "2024-04-01T00:00:00Z",
  },
  {
    id: generateId(),
    businessId: CANSTUDY_ID,
    name: "Maria Santos",
    roleTitle: "Education Consultant",
    roleDescription: null,
    compensationType: "salary",
    rate: 55000,
    currency: "USD",
    hoursPerWeek: null,
    startDate: null,
    performanceNotes: null,
    status: "active",
    createdAt: "2024-03-01T00:00:00Z",
  },
];

function generateMonthlyRevenue(
  businessId: string,
  low: number,
  high: number,
  monthsBack: number = 6
): RevenueEntry[] {
  const entries: RevenueEntry[] = [];
  const now = new Date();
  for (let i = monthsBack; i >= 1; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 15);
    const amount = low + Math.round(Math.random() * (high - low));
    entries.push({
      id: generateId(),
      businessId,
      amount,
      currency: "USD",
      source: "manual",
      description: `Revenue for ${date.toLocaleString("default", { month: "long", year: "numeric" })}`,
      date: date.toISOString().split("T")[0],
      createdAt: date.toISOString(),
    });
  }
  return entries;
}

export const seedRevenueEntries: RevenueEntry[] = [
  ...generateMonthlyRevenue(MYERS_ID, 28000, 35000),
  ...generateMonthlyRevenue(CANSTUDY_ID, 8000, 12200),
];

export const seedExpenses: Expense[] = [
  { id: generateId(), businessId: MYERS_ID, category: "Payroll", name: "Staff payroll", amount: 12000, currency: "USD", frequency: "monthly", isActive: true, createdAt: "2024-01-15T00:00:00Z" },
  { id: generateId(), businessId: MYERS_ID, category: "Software", name: "Legal case management", amount: 2400, currency: "USD", frequency: "monthly", isActive: true, createdAt: "2024-01-15T00:00:00Z" },
  { id: generateId(), businessId: MYERS_ID, category: "Marketing", name: "Google Ads + SEO", amount: 1800, currency: "USD", frequency: "monthly", isActive: true, createdAt: "2024-02-01T00:00:00Z" },
  { id: generateId(), businessId: MYERS_ID, category: "Rent", name: "Office lease", amount: 1500, currency: "USD", frequency: "monthly", isActive: true, createdAt: "2024-01-15T00:00:00Z" },
  { id: generateId(), businessId: MYERS_ID, category: "Utilities", name: "Internet + phone", amount: 400, currency: "USD", frequency: "monthly", isActive: true, createdAt: "2024-01-15T00:00:00Z" },
  { id: generateId(), businessId: CANSTUDY_ID, category: "Payroll", name: "Staff payroll", amount: 6000, currency: "USD", frequency: "monthly", isActive: true, createdAt: "2024-03-01T00:00:00Z" },
  { id: generateId(), businessId: CANSTUDY_ID, category: "Software", name: "CRM + tools", amount: 800, currency: "USD", frequency: "monthly", isActive: true, createdAt: "2024-03-01T00:00:00Z" },
  { id: generateId(), businessId: CANSTUDY_ID, category: "Marketing", name: "Social media ads", amount: 600, currency: "USD", frequency: "monthly", isActive: true, createdAt: "2024-03-15T00:00:00Z" },
];
