# Executive Decision Intelligence Dashboard — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dark-themed executive dashboard with mock auth, draggable widgets, and a working Financial Command Center with CRUD forms for two businesses.

**Architecture:** Next.js 14 App Router with repository pattern over localStorage (Supabase-swappable later). Zustand stores consume the repository and expose computed financial selectors. react-grid-layout provides the draggable widget grid. All UI follows the dark fintech aesthetic with amber accent.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS 3.4, react-grid-layout, Zustand, Recharts, React Hook Form + Zod, Lucide React, Sonner, DM Sans + JetBrains Mono fonts

**Design Spec:** `docs/superpowers/specs/2026-04-08-executive-dashboard-phase1-design.md`

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json` (via create-next-app)
- Create: `.env.local.example`
- Create: `.gitignore` additions

- [ ] **Step 1: Initialize Next.js project**

```bash
cd "/Users/AlajuwonThomas/Desktop/TechSouth/Executive Decision Intelligence - Dashboard"
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

Select defaults when prompted. The `--no-git` flag avoids nested git init since we'll init git ourselves.

- [ ] **Step 2: Install all dependencies**

```bash
npm install zustand recharts react-grid-layout react-hook-form @hookform/resolvers zod lucide-react sonner clsx tailwind-merge
npm install -D @types/react-grid-layout
```

- [ ] **Step 3: Initialize git and create .env.local.example**

Create `.env.local.example`:
```
# Supabase (not needed for Phase 1 — using localStorage mock)
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

```bash
git init
echo ".superpowers/" >> .gitignore
git add -A
git commit -m "feat: scaffold Next.js project with all Phase 1 dependencies"
```

- [ ] **Step 4: Verify scaffold works**

Run: `npm run dev`
Expected: Next.js dev server starts on localhost:3000, default page loads.

---

## Task 2: Tailwind Config + Global Styles + Fonts

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/styles/globals.css` (or `src/app/globals.css` — wherever create-next-app placed it)
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Configure Tailwind with dark fintech design tokens**

Replace `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0A",
        surface: "#141414",
        "surface-elevated": "#1A1A1A",
        border: "#1E1E1E",
        "border-subtle": "#2A2A2A",
        "text-primary": "#FFFFFF",
        "text-secondary": "#D4D4D4",
        "text-tertiary": "#A3A3A3",
        "text-muted": "#737373",
        "text-faint": "#525252",
        accent: "#F59E0B",
        "accent-hover": "#D97706",
        "accent-subtle": "rgba(245,158,11,0.12)",
        success: "#22C55E",
        "success-bg": "rgba(34,197,94,0.12)",
        danger: "#EF4444",
        "danger-bg": "rgba(239,68,68,0.12)",
        purple: "#8B5CF6",
        "purple-bg": "rgba(139,92,246,0.12)",
        info: "#3B82F6",
        pink: "#F43F5E",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      borderRadius: {
        card: "14px",
        button: "10px",
      },
      animation: {
        "shimmer": "shimmer 2s infinite linear",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 2: Write global styles**

Replace `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-bg text-text-primary font-sans antialiased;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: #0A0A0A;
  }
  ::-webkit-scrollbar-thumb {
    background: #2A2A2A;
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #3A3A3A;
  }
}

@layer components {
  .skeleton {
    @apply bg-gradient-to-r from-surface via-surface-elevated to-surface bg-[length:200%_100%] animate-shimmer rounded-card;
  }
}
```

- [ ] **Step 3: Configure fonts in root layout**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Executive Decision Intelligence",
  description: "Dual-business command center dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#141414",
              border: "1px solid #1E1E1E",
              color: "#E5E5E5",
            },
          }}
        />
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Create a minimal root page to verify**

Replace `src/app/page.tsx`:

```tsx
export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold text-accent">
        Executive Decision Intelligence
      </h1>
    </div>
  );
}
```

- [ ] **Step 5: Verify and commit**

Run: `npm run dev`
Expected: Dark background (#0A0A0A), amber text "Executive Decision Intelligence" centered, DM Sans font rendering.

```bash
git add -A
git commit -m "feat: configure Tailwind dark theme, Google Fonts, and global styles"
```

---

## Task 3: TypeScript Types

**Files:**
- Create: `src/lib/data/types.ts`

- [ ] **Step 1: Define all entity types**

```typescript
// src/lib/data/types.ts

export interface Business {
  id: string;
  name: string;
  displayName: string;
  currency: string;
  revenueLow: number;
  revenueHigh: number;
  status: "active" | "inactive";
  createdAt: string;
}

export interface CreateBusiness {
  name: string;
  displayName: string;
  currency: string;
  revenueLow: number;
  revenueHigh: number;
}

export interface Employee {
  id: string;
  businessId: string;
  name: string;
  roleTitle: string;
  compensationType: "hourly" | "salary";
  rate: number;
  currency: string;
  hoursPerWeek: number | null;
  status: "active" | "inactive";
  createdAt: string;
}

export interface Expense {
  id: string;
  businessId: string;
  category: string;
  name: string;
  amount: number;
  currency: string;
  frequency: "monthly" | "weekly" | "yearly" | "one-time";
  isActive: boolean;
  createdAt: string;
}

export interface CreateExpense {
  businessId: string;
  category: string;
  name: string;
  amount: number;
  currency: string;
  frequency: "monthly" | "weekly" | "yearly" | "one-time";
}

export interface RevenueEntry {
  id: string;
  businessId: string;
  amount: number;
  currency: string;
  source: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface CreateRevenue {
  businessId: string;
  amount: number;
  currency: string;
  source: string;
  description: string;
  date: string;
}

export interface DashboardLayout {
  layouts: Record<string, LayoutItem[]>;
}

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

// Computed types
export interface ConsolidatedPL {
  totalRevenue: number;
  totalExpenses: number;
  totalPayroll: number;
  netProfit: number;
  takeHome: number;
  revenueChange: number; // percentage vs last month
  expenseChange: number;
  profitChange: number;
  takeHomeChange: number;
}

export interface BusinessBreakdownItem {
  business: Business;
  revenue: number;
  expenses: number;
  payroll: number;
  netIncome: number;
  margin: number;
}

export interface ExpenseByCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface KPIInsight {
  icon: string;
  iconColor: string;
  iconBg: string;
  text: string;
  highlight: string;
  detail: string;
}

export type KPIType = "revenue" | "expenses" | "netProfit" | "takeHome";
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/data/types.ts
git commit -m "feat: define TypeScript types for all entities and computed data"
```

---

## Task 4: Utility Functions

**Files:**
- Create: `src/lib/utils/formatters.ts`
- Create: `src/lib/utils/currency.ts`
- Create: `src/lib/utils/calculations.ts`

- [ ] **Step 1: Create formatters utility**

```typescript
// src/lib/utils/formatters.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatMonthYear(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatPercentage(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

export function generateId(): string {
  return crypto.randomUUID();
}
```

- [ ] **Step 2: Create currency utility**

```typescript
// src/lib/utils/currency.ts

const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  CAD: 0.74,
  GBP: 1.27,
  EUR: 1.09,
};

export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyDetailed(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function normalizeToUSD(amount: number, currency: string): number {
  const rate = EXCHANGE_RATES[currency] ?? 1;
  return amount * rate;
}
```

- [ ] **Step 3: Create calculations utility**

```typescript
// src/lib/utils/calculations.ts
import type { Business, Employee, Expense, RevenueEntry, ConsolidatedPL, BusinessBreakdownItem, ExpenseByCategory } from "@/lib/data/types";
import { normalizeToUSD } from "./currency";

const CATEGORY_COLORS: Record<string, string> = {
  Payroll: "#F59E0B",
  Software: "#8B5CF6",
  Marketing: "#22C55E",
  Rent: "#3B82F6",
  Utilities: "#F43F5E",
  Other: "#737373",
};

export function calculateMonthlyPayroll(employees: Employee[]): number {
  return employees
    .filter((e) => e.status === "active")
    .reduce((sum, e) => {
      const usd = normalizeToUSD(e.rate, e.currency);
      if (e.compensationType === "salary") return sum + usd / 12;
      return sum + usd * (e.hoursPerWeek ?? 0) * 4.33;
    }, 0);
}

export function calculateTotalExpenses(expenses: Expense[]): number {
  return expenses
    .filter((e) => e.isActive)
    .reduce((sum, e) => {
      const usd = normalizeToUSD(e.amount, e.currency);
      switch (e.frequency) {
        case "yearly": return sum + usd / 12;
        case "weekly": return sum + usd * 4.33;
        case "one-time": return sum; // not recurring
        default: return sum + usd; // monthly
      }
    }, 0);
}

export function calculateTotalRevenue(entries: RevenueEntry[], month?: Date): number {
  let filtered = entries;
  if (month) {
    const y = month.getFullYear();
    const m = month.getMonth();
    filtered = entries.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === y && d.getMonth() === m;
    });
  }
  return filtered.reduce((sum, e) => sum + normalizeToUSD(e.amount, e.currency), 0);
}

export function calculateConsolidatedPL(
  businesses: Business[],
  expenses: Expense[],
  revenueEntries: RevenueEntry[],
  employees: Employee[]
): ConsolidatedPL {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const currentRevenue = calculateTotalRevenue(revenueEntries, thisMonth);
  const previousRevenue = calculateTotalRevenue(revenueEntries, lastMonth);
  const totalExpenses = calculateTotalExpenses(expenses);
  const totalPayroll = calculateMonthlyPayroll(employees);
  const netProfit = currentRevenue - totalExpenses;
  const takeHome = netProfit - totalPayroll;

  // Use current month if it has data, otherwise use latest month with data
  const effectiveRevenue = currentRevenue > 0 ? currentRevenue : calculateTotalRevenue(revenueEntries);

  const revenueChange = previousRevenue > 0 ? ((effectiveRevenue - previousRevenue) / previousRevenue) * 100 : 0;

  return {
    totalRevenue: effectiveRevenue,
    totalExpenses,
    totalPayroll,
    netProfit: effectiveRevenue - totalExpenses,
    takeHome: effectiveRevenue - totalExpenses - totalPayroll,
    revenueChange,
    expenseChange: 3.2, // mock delta for now
    profitChange: revenueChange * 0.67, // simplified
    takeHomeChange: revenueChange * 0.42,
  };
}

export function calculateBusinessBreakdown(
  businesses: Business[],
  expenses: Expense[],
  revenueEntries: RevenueEntry[],
  employees: Employee[]
): BusinessBreakdownItem[] {
  return businesses.map((biz) => {
    const bizExpenses = expenses.filter((e) => e.businessId === biz.id);
    const bizRevenue = revenueEntries.filter((e) => e.businessId === biz.id);
    const bizEmployees = employees.filter((e) => e.businessId === biz.id);

    const revenue = calculateTotalRevenue(bizRevenue);
    const exp = calculateTotalExpenses(bizExpenses);
    const payroll = calculateMonthlyPayroll(bizEmployees);
    const netIncome = revenue - exp;

    return {
      business: biz,
      revenue,
      expenses: exp,
      payroll,
      netIncome,
      margin: revenue > 0 ? (netIncome / revenue) * 100 : 0,
    };
  });
}

export function calculateExpensesByCategory(expenses: Expense[]): ExpenseByCategory[] {
  const activeExpenses = expenses.filter((e) => e.isActive);
  const total = calculateTotalExpenses(activeExpenses);

  const byCategory: Record<string, number> = {};
  activeExpenses.forEach((e) => {
    const usd = normalizeToUSD(e.amount, e.currency);
    byCategory[e.category] = (byCategory[e.category] ?? 0) + usd;
  });

  return Object.entries(byCategory)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      color: CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function calculatePayrollToRevenueRatio(payroll: number, revenue: number): number {
  if (revenue === 0) return 0;
  return (payroll / revenue) * 100;
}

export function getMonthlyRevenueTrend(
  revenueEntries: RevenueEntry[],
  businessId?: string
): { month: string; amount: number }[] {
  const filtered = businessId
    ? revenueEntries.filter((e) => e.businessId === businessId)
    : revenueEntries;

  const byMonth: Record<string, number> = {};
  filtered.forEach((e) => {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth[key] = (byMonth[key] ?? 0) + normalizeToUSD(e.amount, e.currency);
  });

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/utils/
git commit -m "feat: add currency, calculation, and formatter utilities"
```

---

## Task 5: Repository Pattern + Seed Data

**Files:**
- Create: `src/lib/data/repository.ts`
- Create: `src/lib/data/seed-data.ts`
- Create: `src/lib/data/local-repository.ts`
- Create: `src/lib/data/index.ts`

- [ ] **Step 1: Define the DataRepository interface**

```typescript
// src/lib/data/repository.ts
import type { Business, CreateBusiness, Employee, Expense, CreateExpense, RevenueEntry, CreateRevenue, DashboardLayout } from "./types";

export interface DataRepository {
  getBusinesses(): Promise<Business[]>;
  addBusiness(data: CreateBusiness): Promise<Business>;
  updateBusiness(id: string, data: Partial<Business>): Promise<Business>;

  getExpenses(businessId?: string): Promise<Expense[]>;
  addExpense(data: CreateExpense): Promise<Expense>;
  deleteExpense(id: string): Promise<void>;

  getRevenueEntries(businessId?: string): Promise<RevenueEntry[]>;
  addRevenue(data: CreateRevenue): Promise<RevenueEntry>;
  deleteRevenue(id: string): Promise<void>;

  getEmployees(businessId?: string): Promise<Employee[]>;

  getLayout(): DashboardLayout | null;
  saveLayout(layout: DashboardLayout): void;

  onChange(callback: () => void): () => void;
}
```

- [ ] **Step 2: Create seed data**

```typescript
// src/lib/data/seed-data.ts
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
    compensationType: "salary",
    rate: 85000,
    currency: "USD",
    hoursPerWeek: null,
    status: "active",
    createdAt: "2024-01-15T00:00:00Z",
  },
  {
    id: generateId(),
    businessId: MYERS_ID,
    name: "James Wilson",
    roleTitle: "Legal Assistant",
    compensationType: "hourly",
    rate: 22,
    currency: "USD",
    hoursPerWeek: 35,
    status: "active",
    createdAt: "2024-04-01T00:00:00Z",
  },
  {
    id: generateId(),
    businessId: CANSTUDY_ID,
    name: "Maria Santos",
    roleTitle: "Education Consultant",
    compensationType: "salary",
    rate: 55000,
    currency: "USD",
    hoursPerWeek: null,
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
  // Myers Immigration
  { id: generateId(), businessId: MYERS_ID, category: "Payroll", name: "Staff payroll", amount: 12000, currency: "USD", frequency: "monthly", isActive: true, createdAt: "2024-01-15T00:00:00Z" },
  { id: generateId(), businessId: MYERS_ID, category: "Software", name: "Legal case management", amount: 2400, currency: "USD", frequency: "monthly", isActive: true, createdAt: "2024-01-15T00:00:00Z" },
  { id: generateId(), businessId: MYERS_ID, category: "Marketing", name: "Google Ads + SEO", amount: 1800, currency: "USD", frequency: "monthly", isActive: true, createdAt: "2024-02-01T00:00:00Z" },
  { id: generateId(), businessId: MYERS_ID, category: "Rent", name: "Office lease", amount: 1500, currency: "USD", frequency: "monthly", isActive: true, createdAt: "2024-01-15T00:00:00Z" },
  { id: generateId(), businessId: MYERS_ID, category: "Utilities", name: "Internet + phone", amount: 400, currency: "USD", frequency: "monthly", isActive: true, createdAt: "2024-01-15T00:00:00Z" },
  // Canstudy Consulting
  { id: generateId(), businessId: CANSTUDY_ID, category: "Payroll", name: "Staff payroll", amount: 6000, currency: "USD", frequency: "monthly", isActive: true, createdAt: "2024-03-01T00:00:00Z" },
  { id: generateId(), businessId: CANSTUDY_ID, category: "Software", name: "CRM + tools", amount: 800, currency: "USD", frequency: "monthly", isActive: true, createdAt: "2024-03-01T00:00:00Z" },
  { id: generateId(), businessId: CANSTUDY_ID, category: "Marketing", name: "Social media ads", amount: 600, currency: "USD", frequency: "monthly", isActive: true, createdAt: "2024-03-15T00:00:00Z" },
];
```

- [ ] **Step 3: Implement LocalStorageRepository**

```typescript
// src/lib/data/local-repository.ts
import type { DataRepository } from "./repository";
import type { Business, CreateBusiness, Employee, Expense, CreateExpense, RevenueEntry, CreateRevenue, DashboardLayout } from "./types";
import { seedBusinesses, seedEmployees, seedExpenses, seedRevenueEntries } from "./seed-data";
import { generateId } from "@/lib/utils/formatters";

const KEYS = {
  businesses: "edi_businesses",
  employees: "edi_employees",
  expenses: "edi_expenses",
  revenue: "edi_revenue",
  layout: "edi_layout",
  seeded: "edi_seeded",
};

function getItem<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function setItem<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

let listeners: (() => void)[] = [];

function notifyListeners() {
  listeners.forEach((cb) => cb());
}

function ensureSeeded() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(KEYS.seeded)) return;
  setItem(KEYS.businesses, seedBusinesses);
  setItem(KEYS.employees, seedEmployees);
  setItem(KEYS.expenses, seedExpenses);
  setItem(KEYS.revenue, seedRevenueEntries);
  localStorage.setItem(KEYS.seeded, "true");
}

export const localRepository: DataRepository = {
  async getBusinesses() {
    ensureSeeded();
    return getItem<Business>(KEYS.businesses);
  },

  async addBusiness(data: CreateBusiness) {
    const businesses = getItem<Business>(KEYS.businesses);
    const newBiz: Business = {
      id: generateId(),
      ...data,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    businesses.push(newBiz);
    setItem(KEYS.businesses, businesses);
    notifyListeners();
    return newBiz;
  },

  async updateBusiness(id: string, data: Partial<Business>) {
    const businesses = getItem<Business>(KEYS.businesses);
    const idx = businesses.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error("Business not found");
    businesses[idx] = { ...businesses[idx], ...data };
    setItem(KEYS.businesses, businesses);
    notifyListeners();
    return businesses[idx];
  },

  async getExpenses(businessId?: string) {
    ensureSeeded();
    const expenses = getItem<Expense>(KEYS.expenses);
    return businessId ? expenses.filter((e) => e.businessId === businessId) : expenses;
  },

  async addExpense(data: CreateExpense) {
    const expenses = getItem<Expense>(KEYS.expenses);
    const newExpense: Expense = {
      id: generateId(),
      ...data,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    expenses.push(newExpense);
    setItem(KEYS.expenses, expenses);
    notifyListeners();
    return newExpense;
  },

  async deleteExpense(id: string) {
    const expenses = getItem<Expense>(KEYS.expenses);
    setItem(KEYS.expenses, expenses.filter((e) => e.id !== id));
    notifyListeners();
  },

  async getRevenueEntries(businessId?: string) {
    ensureSeeded();
    const entries = getItem<RevenueEntry>(KEYS.revenue);
    return businessId ? entries.filter((e) => e.businessId === businessId) : entries;
  },

  async addRevenue(data: CreateRevenue) {
    const entries = getItem<RevenueEntry>(KEYS.revenue);
    const newEntry: RevenueEntry = {
      id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    entries.push(newEntry);
    setItem(KEYS.revenue, entries);
    notifyListeners();
    return newEntry;
  },

  async deleteRevenue(id: string) {
    const entries = getItem<RevenueEntry>(KEYS.revenue);
    setItem(KEYS.revenue, entries.filter((e) => e.id !== id));
    notifyListeners();
  },

  async getEmployees(businessId?: string) {
    ensureSeeded();
    const employees = getItem<Employee>(KEYS.employees);
    return businessId ? employees.filter((e) => e.businessId === businessId) : employees;
  },

  getLayout() {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(KEYS.layout);
    return raw ? JSON.parse(raw) : null;
  },

  saveLayout(layout: DashboardLayout) {
    localStorage.setItem(KEYS.layout, JSON.stringify(layout));
  },

  onChange(callback: () => void) {
    listeners.push(callback);
    return () => {
      listeners = listeners.filter((cb) => cb !== callback);
    };
  },
};
```

- [ ] **Step 4: Create the repository barrel export**

```typescript
// src/lib/data/index.ts
export { localRepository as repository } from "./local-repository";
export type { DataRepository } from "./repository";
export * from "./types";
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/
git commit -m "feat: implement repository pattern with localStorage and seed data"
```

---

## Task 6: Zustand Stores

**Files:**
- Create: `src/lib/stores/dashboardStore.ts`
- Create: `src/lib/stores/financialStore.ts`

- [ ] **Step 1: Create dashboard store**

```typescript
// src/lib/stores/dashboardStore.ts
import { create } from "zustand";
import type { DashboardLayout, LayoutItem } from "@/lib/data/types";
import { repository } from "@/lib/data";

interface DashboardState {
  layouts: Record<string, LayoutItem[]>;
  activeTab: string;
  collapsedWidgets: Set<string>;
  maximizedWidget: string | null;
  setLayouts: (layouts: Record<string, LayoutItem[]>) => void;
  setActiveTab: (tab: string) => void;
  toggleCollapse: (widgetId: string) => void;
  setMaximized: (widgetId: string | null) => void;
  saveLayout: () => void;
  loadLayout: () => void;
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const useDashboardStore = create<DashboardState>((set, get) => ({
  layouts: {},
  activeTab: "financial",
  collapsedWidgets: new Set(),
  maximizedWidget: null,

  setLayouts: (layouts) => {
    set({ layouts });
    // Debounced save
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().saveLayout(), 500);
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  toggleCollapse: (widgetId) =>
    set((state) => {
      const next = new Set(state.collapsedWidgets);
      if (next.has(widgetId)) next.delete(widgetId);
      else next.add(widgetId);
      return { collapsedWidgets: next };
    }),

  setMaximized: (widgetId) => set({ maximizedWidget: widgetId }),

  saveLayout: () => {
    const { layouts } = get();
    repository.saveLayout({ layouts });
  },

  loadLayout: () => {
    const saved = repository.getLayout();
    if (saved) set({ layouts: saved.layouts });
  },
}));
```

- [ ] **Step 2: Create financial store**

```typescript
// src/lib/stores/financialStore.ts
import { create } from "zustand";
import type { Business, CreateBusiness, Employee, Expense, CreateExpense, RevenueEntry, CreateRevenue, ConsolidatedPL, BusinessBreakdownItem, ExpenseByCategory } from "@/lib/data/types";
import { repository } from "@/lib/data";
import { calculateConsolidatedPL, calculateBusinessBreakdown, calculateExpensesByCategory, calculatePayrollToRevenueRatio, getMonthlyRevenueTrend } from "@/lib/utils/calculations";
import { toast } from "sonner";

interface FinancialState {
  businesses: Business[];
  expenses: Expense[];
  revenueEntries: RevenueEntry[];
  employees: Employee[];
  isLoading: boolean;
  error: string | null;

  fetchAll: () => Promise<void>;
  addBusiness: (data: CreateBusiness) => Promise<void>;
  addExpense: (data: CreateExpense) => Promise<void>;
  addRevenue: (data: CreateRevenue) => Promise<void>;

  getConsolidatedPL: () => ConsolidatedPL;
  getBusinessBreakdown: () => BusinessBreakdownItem[];
  getExpensesByCategory: () => ExpenseByCategory[];
  getPayrollToRevenueRatio: () => number;
  getMonthlyRevenueTrend: (businessId?: string) => { month: string; amount: number }[];
}

export const useFinancialStore = create<FinancialState>((set, get) => ({
  businesses: [],
  expenses: [],
  revenueEntries: [],
  employees: [],
  isLoading: true,
  error: null,

  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const [businesses, expenses, revenueEntries, employees] = await Promise.all([
        repository.getBusinesses(),
        repository.getExpenses(),
        repository.getRevenueEntries(),
        repository.getEmployees(),
      ]);
      set({ businesses, expenses, revenueEntries, employees, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load data";
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  addBusiness: async (data) => {
    try {
      await repository.addBusiness(data);
      await get().fetchAll();
      toast.success("Business added");
    } catch (err) {
      toast.error("Failed to add business");
    }
  },

  addExpense: async (data) => {
    try {
      await repository.addExpense(data);
      await get().fetchAll();
      toast.success("Expense added");
    } catch (err) {
      toast.error("Failed to add expense");
    }
  },

  addRevenue: async (data) => {
    try {
      await repository.addRevenue(data);
      await get().fetchAll();
      toast.success("Revenue entry added");
    } catch (err) {
      toast.error("Failed to add revenue entry");
    }
  },

  getConsolidatedPL: () => {
    const { businesses, expenses, revenueEntries, employees } = get();
    return calculateConsolidatedPL(businesses, expenses, revenueEntries, employees);
  },

  getBusinessBreakdown: () => {
    const { businesses, expenses, revenueEntries, employees } = get();
    return calculateBusinessBreakdown(businesses, expenses, revenueEntries, employees);
  },

  getExpensesByCategory: () => {
    const { expenses } = get();
    return calculateExpensesByCategory(expenses);
  },

  getPayrollToRevenueRatio: () => {
    const pl = get().getConsolidatedPL();
    return calculatePayrollToRevenueRatio(pl.totalPayroll, pl.totalRevenue);
  },

  getMonthlyRevenueTrend: (businessId?: string) => {
    const { revenueEntries } = get();
    return getMonthlyRevenueTrend(revenueEntries, businessId);
  },
}));
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/stores/
git commit -m "feat: add Zustand stores for dashboard layout and financial data"
```

---

## Task 7: UI Primitives

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Card.tsx`
- Create: `src/components/ui/Input.tsx`
- Create: `src/components/ui/Select.tsx`
- Create: `src/components/ui/Modal.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/Skeleton.tsx`

- [ ] **Step 1: Create Button component**

```tsx
// src/components/ui/Button.tsx
"use client";
import { forwardRef } from "react";
import { cn } from "@/lib/utils/formatters";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-gradient-to-r from-accent to-accent-hover text-bg font-semibold hover:opacity-90",
  secondary: "bg-transparent border border-border-subtle text-text-tertiary hover:border-text-muted hover:text-text-secondary",
  ghost: "bg-transparent text-text-tertiary hover:bg-surface-elevated hover:text-text-secondary",
  danger: "bg-danger-bg text-danger hover:bg-danger/20",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-2.5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-button font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
);
Button.displayName = "Button";
```

- [ ] **Step 2: Create Card component**

```tsx
// src/components/ui/Card.tsx
import { cn } from "@/lib/utils/formatters";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ className, interactive, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-card p-5",
        interactive && "cursor-pointer transition-all duration-200 hover:border-border-subtle hover:bg-surface-elevated",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Create Input component**

```tsx
// src/components/ui/Input.tsx
"use client";
import { forwardRef } from "react";
import { cn } from "@/lib/utils/formatters";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          "w-full bg-bg border border-border rounded-[8px] px-3 py-2.5 text-sm text-text-primary placeholder:text-text-faint transition-all duration-200 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30",
          error && "border-danger focus:border-danger focus:ring-danger/30",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";
```

- [ ] **Step 4: Create Select component**

```tsx
// src/components/ui/Select.tsx
"use client";
import { forwardRef } from "react";
import { cn } from "@/lib/utils/formatters";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          "w-full bg-bg border border-border rounded-[8px] px-3 py-2.5 text-sm text-text-primary transition-all duration-200 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30",
          error && "border-danger",
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
);
Select.displayName = "Select";
```

- [ ] **Step 5: Create Modal component**

```tsx
// src/components/ui/Modal.tsx
"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/formatters";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className={cn(
        "bg-surface border border-border rounded-card p-6 w-full max-w-lg mx-4 animate-in zoom-in-95 duration-200",
        className
      )}>
        {title && (
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-surface-elevated text-text-muted hover:text-text-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create Badge component**

```tsx
// src/components/ui/Badge.tsx
import { cn } from "@/lib/utils/formatters";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "accent";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-elevated text-text-muted",
  success: "bg-success-bg text-success",
  warning: "bg-[rgba(245,158,11,0.12)] text-accent",
  danger: "bg-danger-bg text-danger",
  info: "bg-[rgba(59,130,246,0.12)] text-info",
  accent: "bg-accent-subtle text-accent",
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold",
      variantStyles[variant],
      className
    )}>
      {children}
    </span>
  );
}
```

- [ ] **Step 7: Create Skeleton component**

```tsx
// src/components/ui/Skeleton.tsx
import { cn } from "@/lib/utils/formatters";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("skeleton", className)} />;
}

export function MetricSkeleton() {
  return (
    <div className="bg-surface-elevated rounded-[12px] p-4 space-y-2">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-7 w-28" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-4 w-24" />
      <div className="flex items-end gap-1.5 h-32">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="flex-1" style={{ height: `${30 + Math.random() * 60}%` }} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add dark-themed UI primitive components"
```

---

## Task 8: Mock Authentication

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/login/page.tsx`
- Create: `src/middleware.ts`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create auth utility**

```typescript
// src/lib/auth.ts
export interface MockUser {
  email: string;
  name: string;
  initials: string;
}

export function login(email: string): MockUser {
  const name = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const user: MockUser = { email, name, initials };

  localStorage.setItem("edi_user", JSON.stringify(user));
  document.cookie = "edi_session=active; path=/; max-age=86400";
  return user;
}

export function logout() {
  localStorage.removeItem("edi_user");
  document.cookie = "edi_session=; path=/; max-age=0";
}

export function getUser(): MockUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("edi_user");
  return raw ? JSON.parse(raw) : null;
}
```

- [ ] **Step 2: Create login page**

```tsx
// src/app/login/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setIsLoading(true);
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 600));
    login(email);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent-hover rounded-[12px] flex items-center justify-center mx-auto mb-4">
            <span className="text-bg font-bold text-lg">ED</span>
          </div>
          <h1 className="text-xl font-bold text-text-primary">
            Executive Decision Intelligence
          </h1>
          <p className="text-sm text-text-muted mt-1">Sign in to your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-card p-6 space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        <p className="text-xs text-text-faint text-center mt-4">
          Phase 1: Mock auth — any credentials accepted
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create middleware**

```typescript
// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("edi_session");
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!session && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
```

- [ ] **Step 4: Update root page to redirect**

```tsx
// src/app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
```

- [ ] **Step 5: Verify and commit**

Run: `npm run dev`
Expected: Visit `/` redirects to `/login`. Enter any email/password → redirects to `/dashboard` (404 for now is fine).

```bash
git add src/lib/auth.ts src/app/login/ src/middleware.ts src/app/page.tsx
git commit -m "feat: add mock authentication with login page and middleware"
```

---

## Task 9: Dashboard Layout Shell (Sidebar + TopBar)

**Files:**
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/TopBar.tsx`
- Create: `src/app/dashboard/layout.tsx`
- Create: `src/app/dashboard/page.tsx` (minimal)

- [ ] **Step 1: Create Sidebar**

```tsx
// src/components/layout/Sidebar.tsx
"use client";
import { LayoutDashboard, Building2, ArrowLeftRight, Users, BrainCircuit, Target, GitBranch, Activity, Settings } from "lucide-react";
import { cn } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/Badge";
import { useDashboardStore } from "@/lib/stores/dashboardStore";

const mainNav = [
  { id: "financial", label: "Dashboard", icon: LayoutDashboard },
  { id: "businesses", label: "Businesses", icon: Building2, disabled: true },
  { id: "transactions", label: "Transactions", icon: ArrowLeftRight, disabled: true },
  { id: "employees", label: "Employees", icon: Users, disabled: true },
];

const moduleNav = [
  { id: "workforce", label: "Workforce", icon: Users, soon: true },
  { id: "ooda", label: "OODA Loop", icon: BrainCircuit, soon: true },
  { id: "goals", label: "Goals", icon: Target, soon: true },
  { id: "scenarios", label: "Scenarios", icon: GitBranch, soon: true },
  { id: "pulse", label: "Pulse", icon: Activity, soon: true },
];

export function Sidebar() {
  const activeTab = useDashboardStore((s) => s.activeTab);
  const setActiveTab = useDashboardStore((s) => s.setActiveTab);

  return (
    <aside className="w-[220px] bg-[#111111] border-r border-border flex flex-col h-screen sticky top-0 shrink-0">
      {/* Brand */}
      <div className="px-4 py-5 flex items-center gap-2.5">
        <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent-hover rounded-[8px] flex items-center justify-center">
          <span className="text-bg font-extrabold text-xs">ED</span>
        </div>
        <span className="text-text-primary font-bold text-base">EDI</span>
      </div>

      {/* Main Nav */}
      <nav className="px-3 flex-1">
        <p className="text-[11px] font-semibold text-text-faint uppercase tracking-[1.5px] px-2 mb-2 mt-4">Main</p>
        {mainNav.map((item) => (
          <button
            key={item.id}
            onClick={() => !item.disabled && setActiveTab(item.id)}
            disabled={item.disabled}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-150 mb-0.5",
              activeTab === item.id
                ? "bg-accent-subtle text-accent font-semibold"
                : "text-text-muted hover:bg-surface-elevated hover:text-text-secondary",
              item.disabled && "opacity-40 cursor-not-allowed"
            )}
          >
            <item.icon className="w-[18px] h-[18px]" />
            {item.label}
          </button>
        ))}

        <p className="text-[11px] font-semibold text-text-faint uppercase tracking-[1.5px] px-2 mb-2 mt-6">Modules</p>
        {moduleNav.map((item) => (
          <button
            key={item.id}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-sm font-medium text-text-muted opacity-40 cursor-not-allowed mb-0.5"
            disabled
          >
            <item.icon className="w-[18px] h-[18px]" />
            {item.label}
            {item.soon && <Badge className="ml-auto text-[10px]">Soon</Badge>}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4">
        <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-sm font-medium text-text-muted hover:bg-surface-elevated hover:text-text-secondary transition-all duration-150">
          <Settings className="w-[18px] h-[18px]" />
          Settings
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Create TopBar**

```tsx
// src/components/layout/TopBar.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getUser, logout } from "@/lib/auth";
import { Modal } from "@/components/ui/Modal";

interface TopBarProps {
  onAddEntry: () => void;
}

export function TopBar({ onAddEntry }: TopBarProps) {
  const router = useRouter();
  const user = getUser();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg/80 backdrop-blur-sm sticky top-0 z-40">
      <h1 className="text-xl font-bold text-text-primary">Dashboard</h1>

      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm">
          <Download className="w-3.5 h-3.5" />
          Export
        </Button>
        <Button size="sm" onClick={onAddEntry}>
          <Plus className="w-3.5 h-3.5" />
          Add Entry
        </Button>
        <div className="flex items-center gap-2 ml-2 pl-3 border-l border-border">
          <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent-hover rounded-full flex items-center justify-center">
            <span className="text-bg text-xs font-bold">{user?.initials ?? "?"}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-text-muted hover:text-text-secondary transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Create dashboard layout**

```tsx
// src/app/dashboard/layout.tsx
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Create minimal dashboard page**

```tsx
// src/app/dashboard/page.tsx
"use client";
import { TopBar } from "@/components/layout/TopBar";

export default function DashboardPage() {
  return (
    <div>
      <TopBar onAddEntry={() => {}} />
      <div className="p-6">
        <p className="text-text-muted">Dashboard widgets will go here.</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify and commit**

Run: `npm run dev`
Expected: Login → dashboard with dark sidebar (EDI brand, nav items) and top bar (title, export button, add entry button, avatar). Sidebar highlights "Dashboard" in amber.

```bash
git add src/components/layout/ src/app/dashboard/
git commit -m "feat: add Sidebar, TopBar, and dashboard layout shell"
```

---

## Task 10: WidgetWrapper + DashboardGrid

**Files:**
- Create: `src/components/layout/WidgetWrapper.tsx`
- Create: `src/components/layout/DashboardGrid.tsx`

- [ ] **Step 1: Create WidgetWrapper**

```tsx
// src/components/layout/WidgetWrapper.tsx
"use client";
import { GripVertical, ChevronDown, ChevronUp, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils/formatters";
import { useDashboardStore } from "@/lib/stores/dashboardStore";
import { Modal } from "@/components/ui/Modal";

interface WidgetWrapperProps {
  id: string;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function WidgetWrapper({ id, title, children, actions, className }: WidgetWrapperProps) {
  const collapsedWidgets = useDashboardStore((s) => s.collapsedWidgets);
  const maximizedWidget = useDashboardStore((s) => s.maximizedWidget);
  const toggleCollapse = useDashboardStore((s) => s.toggleCollapse);
  const setMaximized = useDashboardStore((s) => s.setMaximized);

  const isCollapsed = collapsedWidgets.has(id);
  const isMaximized = maximizedWidget === id;

  const headerContent = (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="drag-handle cursor-grab active:cursor-grabbing text-text-faint hover:text-text-muted transition-colors">
          <GripVertical className="w-4 h-4" />
        </div>
        <h3 className="text-base font-bold text-text-primary">{title}</h3>
      </div>
      <div className="flex items-center gap-1">
        {actions}
        <button
          onClick={() => toggleCollapse(id)}
          className="w-7 h-7 flex items-center justify-center rounded-[6px] text-text-faint hover:bg-surface-elevated hover:text-text-muted transition-all"
        >
          {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => setMaximized(isMaximized ? null : id)}
          className="w-7 h-7 flex items-center justify-center rounded-[6px] text-text-faint hover:bg-surface-elevated hover:text-text-muted transition-all"
        >
          {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );

  const widgetContent = (
    <div className={cn(
      "bg-surface border border-border rounded-card p-5 transition-all duration-200 h-full",
      className
    )}>
      {headerContent}
      <div className={cn(
        "transition-all duration-200 overflow-hidden",
        isCollapsed && !isMaximized ? "max-h-0 opacity-0" : "max-h-[2000px] opacity-100"
      )}>
        {children}
      </div>
    </div>
  );

  if (isMaximized) {
    return (
      <>
        {/* Placeholder in grid */}
        <div className="bg-surface border border-border rounded-card p-5 opacity-30">
          {headerContent}
        </div>
        {/* Maximized overlay */}
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-8">
          <div className="bg-surface border border-border rounded-card p-6 w-full max-w-6xl max-h-[90vh] overflow-auto">
            {headerContent}
            {children}
          </div>
        </div>
      </>
    );
  }

  return widgetContent;
}
```

- [ ] **Step 2: Create DashboardGrid**

```tsx
// src/components/layout/DashboardGrid.tsx
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
```

- [ ] **Step 3: Add grid CSS overrides to globals.css**

Append to `src/app/globals.css`:

```css
/* react-grid-layout overrides */
.react-grid-item.react-draggable-dragging {
  z-index: 100;
  opacity: 0.95;
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.1);
  border-color: #F59E0B !important;
  transform: scale(1.01);
}

.react-grid-item > .react-resizable-handle::after {
  border-right-color: #2A2A2A;
  border-bottom-color: #2A2A2A;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/WidgetWrapper.tsx src/components/layout/DashboardGrid.tsx src/app/globals.css
git commit -m "feat: add WidgetWrapper and DashboardGrid with drag/collapse/maximize"
```

---

## Task 11: useCountUp Hook

**Files:**
- Create: `src/hooks/useCountUp.ts`

- [ ] **Step 1: Implement count-up animation hook**

```typescript
// src/hooks/useCountUp.ts
"use client";
import { useEffect, useRef, useState } from "react";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function useCountUp(
  endValue: number,
  duration: number = 1500,
  decimals: number = 0
): string {
  const [displayValue, setDisplayValue] = useState(0);
  const prevEndRef = useRef(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const startValue = prevEndRef.current;
    prevEndRef.current = endValue;

    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const current = startValue + (endValue - startValue) * easedProgress;

      setDisplayValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [endValue, duration]);

  return displayValue.toFixed(decimals);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useCountUp.ts
git commit -m "feat: add useCountUp hook with easeOutCubic animation"
```

---

## Task 12: KPI Insights Engine

**Files:**
- Create: `src/lib/utils/insights.ts`

- [ ] **Step 1: Implement dynamic insight generation**

```typescript
// src/lib/utils/insights.ts
import type { Business, Expense, RevenueEntry, Employee, KPIInsight, KPIType } from "@/lib/data/types";
import { formatCurrency } from "./currency";
import { formatPercentage } from "./formatters";
import { calculateTotalExpenses, calculateMonthlyPayroll, calculateTotalRevenue, calculateExpensesByCategory, getMonthlyRevenueTrend } from "./calculations";

export function generateKPIInsights(
  kpiType: KPIType,
  businesses: Business[],
  expenses: Expense[],
  revenueEntries: RevenueEntry[],
  employees: Employee[]
): KPIInsight[] {
  switch (kpiType) {
    case "revenue":
      return generateRevenueInsights(businesses, revenueEntries);
    case "expenses":
      return generateExpenseInsights(businesses, expenses);
    case "netProfit":
      return generateProfitInsights(businesses, expenses, revenueEntries);
    case "takeHome":
      return generateTakeHomeInsights(businesses, expenses, revenueEntries, employees);
    default:
      return [];
  }
}

function generateRevenueInsights(businesses: Business[], entries: RevenueEntry[]): KPIInsight[] {
  const insights: KPIInsight[] = [];
  const total = calculateTotalRevenue(entries);

  // Largest contributor
  let maxBiz: Business | null = null;
  let maxRevenue = 0;
  businesses.forEach((biz) => {
    const bizRevenue = calculateTotalRevenue(entries.filter((e) => e.businessId === biz.id));
    if (bizRevenue > maxRevenue) {
      maxRevenue = bizRevenue;
      maxBiz = biz;
    }
  });

  if (maxBiz && total > 0) {
    const pct = ((maxRevenue / total) * 100).toFixed(0);
    insights.push({
      icon: "\u2191",
      iconColor: "#F59E0B",
      iconBg: "rgba(245,158,11,0.12)",
      text: `${(maxBiz as Business).displayName} contributed ${formatCurrency(maxRevenue)}`,
      highlight: `${pct}% of total`,
      detail: `Out of ${formatCurrency(total)} total revenue across ${businesses.length} businesses`,
    });
  }

  // Per-business growth
  businesses.forEach((biz) => {
    const trend = getMonthlyRevenueTrend(entries.filter((e) => e.businessId === biz.id));
    if (trend.length >= 2) {
      const current = trend[trend.length - 1].amount;
      const previous = trend[trend.length - 2].amount;
      const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
      if (change !== 0) {
        insights.push({
          icon: change > 0 ? "\u2197" : "\u2198",
          iconColor: change > 0 ? "#8B5CF6" : "#EF4444",
          iconBg: change > 0 ? "rgba(139,92,246,0.12)" : "rgba(239,68,68,0.12)",
          text: `${biz.displayName} ${change > 0 ? "grew" : "declined"} ${formatPercentage(Math.abs(change))} month-over-month`,
          highlight: formatCurrency(current),
          detail: `${formatCurrency(previous)} last month \u2192 ${formatCurrency(current)} this month`,
        });
      }
    }
  });

  // Target range check
  businesses.forEach((biz) => {
    const bizRevenue = calculateTotalRevenue(entries.filter((e) => e.businessId === biz.id));
    const monthlyAvg = bizRevenue / Math.max(getMonthlyRevenueTrend(entries.filter((e) => e.businessId === biz.id)).length, 1);
    if (monthlyAvg > biz.revenueHigh) {
      insights.push({
        icon: "\u2713",
        iconColor: "#22C55E",
        iconBg: "rgba(34,197,94,0.12)",
        text: `${biz.displayName} is exceeding its target range`,
        highlight: `${formatCurrency(biz.revenueLow)}\u2013${formatCurrency(biz.revenueHigh)}`,
        detail: `Averaging ${formatCurrency(monthlyAvg)}/mo vs target of ${formatCurrency(biz.revenueLow)}\u2013${formatCurrency(biz.revenueHigh)}`,
      });
    }
  });

  return insights.slice(0, 4);
}

function generateExpenseInsights(businesses: Business[], expenses: Expense[]): KPIInsight[] {
  const insights: KPIInsight[] = [];
  const categories = calculateExpensesByCategory(expenses);

  if (categories.length > 0) {
    const top = categories[0];
    insights.push({
      icon: "\u25A0",
      iconColor: top.color,
      iconBg: `${top.color}20`,
      text: `${top.category} is your largest expense category`,
      highlight: `${top.percentage.toFixed(0)}% of total`,
      detail: `${formatCurrency(top.amount)}/mo across all businesses`,
    });
  }

  // Payroll as % of expenses
  const payrollCategory = categories.find((c) => c.category === "Payroll");
  if (payrollCategory) {
    insights.push({
      icon: "\u2139",
      iconColor: "#3B82F6",
      iconBg: "rgba(59,130,246,0.12)",
      text: `Payroll accounts for ${payrollCategory.percentage.toFixed(0)}% of total expenses`,
      highlight: formatCurrency(payrollCategory.amount),
      detail: "Consider this ratio when evaluating new hires",
    });
  }

  // Per-business expense split
  businesses.forEach((biz) => {
    const bizExpenses = expenses.filter((e) => e.businessId === biz.id);
    const total = calculateTotalExpenses(bizExpenses);
    insights.push({
      icon: "\u25CB",
      iconColor: biz.id.includes("myers") ? "#F59E0B" : "#8B5CF6",
      iconBg: biz.id.includes("myers") ? "rgba(245,158,11,0.12)" : "rgba(139,92,246,0.12)",
      text: `${biz.displayName} monthly burn rate`,
      highlight: formatCurrency(total),
      detail: `Across ${bizExpenses.length} active expense items`,
    });
  });

  return insights.slice(0, 4);
}

function generateProfitInsights(businesses: Business[], expenses: Expense[], revenue: RevenueEntry[]): KPIInsight[] {
  const insights: KPIInsight[] = [];
  const totalRev = calculateTotalRevenue(revenue);
  const totalExp = calculateTotalExpenses(expenses);
  const margin = totalRev > 0 ? ((totalRev - totalExp) / totalRev) * 100 : 0;

  insights.push({
    icon: "\u2261",
    iconColor: margin > 20 ? "#22C55E" : margin > 0 ? "#F59E0B" : "#EF4444",
    iconBg: margin > 20 ? "rgba(34,197,94,0.12)" : margin > 0 ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)",
    text: `Overall profit margin is ${margin.toFixed(1)}%`,
    highlight: margin > 20 ? "Strong" : margin > 0 ? "Moderate" : "Negative",
    detail: `${formatCurrency(totalRev)} revenue \u2212 ${formatCurrency(totalExp)} expenses`,
  });

  // Most/least profitable business
  businesses.forEach((biz) => {
    const bizRev = calculateTotalRevenue(revenue.filter((e) => e.businessId === biz.id));
    const bizExp = calculateTotalExpenses(expenses.filter((e) => e.businessId === biz.id));
    const bizMargin = bizRev > 0 ? ((bizRev - bizExp) / bizRev) * 100 : 0;
    insights.push({
      icon: bizMargin > 20 ? "\u2191" : "\u2193",
      iconColor: bizMargin > 20 ? "#22C55E" : "#F59E0B",
      iconBg: bizMargin > 20 ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)",
      text: `${biz.displayName} margin: ${bizMargin.toFixed(1)}%`,
      highlight: formatCurrency(bizRev - bizExp),
      detail: `${formatCurrency(bizRev)} revenue \u2212 ${formatCurrency(bizExp)} expenses`,
    });
  });

  return insights.slice(0, 4);
}

function generateTakeHomeInsights(businesses: Business[], expenses: Expense[], revenue: RevenueEntry[], employees: Employee[]): KPIInsight[] {
  const insights: KPIInsight[] = [];
  const totalRev = calculateTotalRevenue(revenue);
  const totalExp = calculateTotalExpenses(expenses);
  const payroll = calculateMonthlyPayroll(employees);
  const netProfit = totalRev - totalExp;
  const takeHome = netProfit - payroll;

  insights.push({
    icon: "\u2261",
    iconColor: takeHome > 0 ? "#22C55E" : "#EF4444",
    iconBg: takeHome > 0 ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
    text: `After payroll of ${formatCurrency(payroll)}, your take-home is ${formatCurrency(takeHome)}`,
    highlight: takeHome > 0 ? "Positive" : "Negative",
    detail: `${formatCurrency(netProfit)} net profit \u2212 ${formatCurrency(payroll)} payroll`,
  });

  const payrollPct = netProfit > 0 ? (payroll / netProfit) * 100 : 0;
  insights.push({
    icon: "\u2139",
    iconColor: "#3B82F6",
    iconBg: "rgba(59,130,246,0.12)",
    text: `Payroll consumes ${payrollPct.toFixed(0)}% of net profit`,
    highlight: payrollPct < 50 ? "Sustainable" : "Heavy",
    detail: payrollPct < 50 ? "Healthy ratio \u2014 room for growth" : "Consider revenue growth or payroll optimization",
  });

  return insights.slice(0, 4);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/utils/insights.ts
git commit -m "feat: add dynamic KPI insights engine"
```

---

## Task 13: Financial Command Center — ConsolidatedPL + KPIDetailModal

**Files:**
- Create: `src/components/widgets/FinancialCommandCenter/ConsolidatedPL.tsx`
- Create: `src/components/widgets/FinancialCommandCenter/KPIDetailModal.tsx`

- [ ] **Step 1: Create ConsolidatedPL with clickable KPI cards**

```tsx
// src/components/widgets/FinancialCommandCenter/ConsolidatedPL.tsx
"use client";
import { useState } from "react";
import { useCountUp } from "@/hooks/useCountUp";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { formatCurrency } from "@/lib/utils/currency";
import { Badge } from "@/components/ui/Badge";
import { KPIDetailModal } from "./KPIDetailModal";
import type { KPIType } from "@/lib/data/types";
import { cn } from "@/lib/utils/formatters";

interface MetricCardProps {
  label: string;
  value: number;
  change: number;
  kpiType: KPIType;
  onClick: (type: KPIType) => void;
}

function MetricCard({ label, value, change, kpiType, onClick }: MetricCardProps) {
  const animatedValue = useCountUp(value);
  const isPositive = change >= 0;

  return (
    <button
      onClick={() => onClick(kpiType)}
      className="bg-surface-elevated rounded-[12px] p-4 text-left transition-all duration-200 hover:border-accent border border-transparent cursor-pointer"
    >
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-2xl font-semibold text-text-primary">
          {formatCurrency(parseFloat(animatedValue))}
        </span>
        <Badge variant={isPositive ? "success" : "danger"} className="text-[10px]">
          {isPositive ? "\u2191" : "\u2193"} {Math.abs(change).toFixed(1)}%
        </Badge>
      </div>
    </button>
  );
}

export function ConsolidatedPL() {
  const [selectedKPI, setSelectedKPI] = useState<KPIType | null>(null);
  const pl = useFinancialStore((s) => s.getConsolidatedPL());

  return (
    <>
      <div className="grid grid-cols-4 gap-3 mb-5">
        <MetricCard label="Total Revenue" value={pl.totalRevenue} change={pl.revenueChange} kpiType="revenue" onClick={setSelectedKPI} />
        <MetricCard label="Total Expenses" value={pl.totalExpenses} change={pl.expenseChange} kpiType="expenses" onClick={setSelectedKPI} />
        <MetricCard label="Net Profit" value={pl.netProfit} change={pl.profitChange} kpiType="netProfit" onClick={setSelectedKPI} />
        <MetricCard label="Take-Home" value={pl.takeHome} change={pl.takeHomeChange} kpiType="takeHome" onClick={setSelectedKPI} />
      </div>

      <KPIDetailModal
        kpiType={selectedKPI}
        onClose={() => setSelectedKPI(null)}
      />
    </>
  );
}
```

- [ ] **Step 2: Create KPIDetailModal**

```tsx
// src/components/widgets/FinancialCommandCenter/KPIDetailModal.tsx
"use client";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { generateKPIInsights } from "@/lib/utils/insights";
import { formatCurrency } from "@/lib/utils/currency";
import { formatPercentage, formatMonthYear } from "@/lib/utils/formatters";
import { getMonthlyRevenueTrend, calculateTotalExpenses, calculateMonthlyPayroll, calculateTotalRevenue } from "@/lib/utils/calculations";
import type { KPIType } from "@/lib/data/types";

interface KPIDetailModalProps {
  kpiType: KPIType | null;
  onClose: () => void;
}

const KPI_LABELS: Record<KPIType, string> = {
  revenue: "Total Revenue",
  expenses: "Total Expenses",
  netProfit: "Net Profit",
  takeHome: "Take-Home",
};

export function KPIDetailModal({ kpiType, onClose }: KPIDetailModalProps) {
  const { businesses, expenses, revenueEntries, employees } = useFinancialStore();
  const pl = useFinancialStore((s) => s.getConsolidatedPL());

  if (!kpiType) return null;

  const values: Record<KPIType, { value: number; change: number }> = {
    revenue: { value: pl.totalRevenue, change: pl.revenueChange },
    expenses: { value: pl.totalExpenses, change: pl.expenseChange },
    netProfit: { value: pl.netProfit, change: pl.profitChange },
    takeHome: { value: pl.takeHome, change: pl.takeHomeChange },
  };

  const { value, change } = values[kpiType];
  const insights = generateKPIInsights(kpiType, businesses, expenses, revenueEntries, employees);

  // Sparkline data (last 6 months of revenue trend as proxy)
  const trend = getMonthlyRevenueTrend(revenueEntries);
  const last6 = trend.slice(-6);
  const maxVal = Math.max(...last6.map((d) => d.amount), 1);

  // Business split for revenue
  const bizSplit = businesses.map((biz) => {
    const bizRevenue = calculateTotalRevenue(revenueEntries.filter((e) => e.businessId === biz.id));
    return { name: biz.displayName, amount: bizRevenue, pct: pl.totalRevenue > 0 ? (bizRevenue / pl.totalRevenue) * 100 : 0 };
  });

  const bizColors = ["#F59E0B", "#8B5CF6", "#22C55E", "#3B82F6"];

  return (
    <Modal isOpen onClose={onClose} className="max-w-md">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">{KPI_LABELS[kpiType]}</p>
          <p className="font-mono text-3xl font-bold text-text-primary">{formatCurrency(value)}</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-surface-elevated text-text-muted hover:text-text-secondary transition-colors">
          &times;
        </button>
      </div>

      {/* Delta */}
      <div className="flex items-center gap-2 mb-5">
        <Badge variant={change >= 0 ? "success" : "danger"}>
          {change >= 0 ? "\u2191" : "\u2193"} {Math.abs(change).toFixed(1)}% vs last month
        </Badge>
      </div>

      {/* Sparkline */}
      {last6.length > 1 && (
        <div className="bg-bg rounded-[12px] p-4 mb-5">
          <p className="text-[11px] font-semibold text-text-faint uppercase tracking-wider mb-2">Last 6 months</p>
          <div className="flex items-end gap-1 h-12">
            {last6.map((d, i) => (
              <div
                key={d.month}
                className="flex-1 rounded-[3px]"
                style={{
                  height: `${(d.amount / maxVal) * 100}%`,
                  background: i === last6.length - 1
                    ? "linear-gradient(to top, #F59E0B, rgba(245,158,11,0.6))"
                    : `rgba(245,158,11,${0.1 + (i / last6.length) * 0.2})`,
                }}
                title={`${formatMonthYear(d.month + "-01")}: ${formatCurrency(d.amount)}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="mb-5">
          <p className="text-[11px] font-semibold text-text-faint uppercase tracking-wider mb-3">Key Insights</p>
          <div className="space-y-1">
            {insights.map((insight, i) => (
              <div key={i} className="flex gap-2.5 py-2.5 border-b border-border last:border-0">
                <div
                  className="w-7 h-7 rounded-[8px] flex items-center justify-center text-xs shrink-0 mt-0.5"
                  style={{ background: insight.iconBg, color: insight.iconColor }}
                >
                  {insight.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-text-secondary font-medium leading-snug">
                    {insight.text.split(insight.highlight).map((part, j, arr) => (
                      <span key={j}>
                        {part}
                        {j < arr.length - 1 && <span className="font-mono font-semibold text-accent">{insight.highlight}</span>}
                      </span>
                    ))}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{insight.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Business breakdown */}
      {kpiType === "revenue" && bizSplit.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-text-faint uppercase tracking-wider mb-3">By Business</p>
          {bizSplit.map((biz, i) => (
            <div key={biz.name} className="flex items-center gap-2.5 mb-2">
              <span className="text-xs text-text-tertiary w-28 truncate font-medium">{biz.name}</span>
              <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${biz.pct}%`, background: `linear-gradient(90deg, ${bizColors[i]}, ${bizColors[i]}90)` }}
                />
              </div>
              <span className="font-mono text-xs text-text-tertiary w-16 text-right">{formatCurrency(biz.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/FinancialCommandCenter/
git commit -m "feat: add ConsolidatedPL with clickable KPI cards and detail modal"
```

---

## Task 14: Financial Charts — CashFlow, ExpenseCategory, RevenueTracker, PayrollGauge

**Files:**
- Create: `src/components/widgets/FinancialCommandCenter/CashFlowChart.tsx`
- Create: `src/components/widgets/FinancialCommandCenter/ExpenseCategoryChart.tsx`
- Create: `src/components/widgets/FinancialCommandCenter/RevenueTracker.tsx`
- Create: `src/components/widgets/FinancialCommandCenter/PayrollGauge.tsx`
- Create: `src/components/widgets/FinancialCommandCenter/BusinessBreakdown.tsx`

- [ ] **Step 1: Create CashFlowChart**

```tsx
// src/components/widgets/FinancialCommandCenter/CashFlowChart.tsx
"use client";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { formatCurrency } from "@/lib/utils/currency";
import { formatMonthYear } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/formatters";

const tabs = ["Income", "Expense", "Saving"] as const;

export function CashFlowChart() {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Income");
  const trend = useFinancialStore((s) => s.getMonthlyRevenueTrend());
  const pl = useFinancialStore((s) => s.getConsolidatedPL());

  const data = trend.map((d) => ({
    month: formatMonthYear(d.month + "-01"),
    amount: d.amount,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-base font-bold text-text-primary">Cash Flow</p>
          <p className="font-mono text-xl font-semibold text-text-primary mt-0.5">{formatCurrency(pl.totalRevenue)}</p>
        </div>
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3 py-1.5 rounded-[8px] text-xs font-semibold border transition-all duration-150",
                activeTab === tab
                  ? "bg-text-primary text-bg border-text-primary"
                  : "bg-transparent text-text-muted border-border-subtle hover:border-text-muted"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
          <XAxis
            dataKey="month"
            tick={{ fill: "#737373", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#737373", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
          />
          <Tooltip
            cursor={{ fill: "rgba(245,158,11,0.05)" }}
            contentStyle={{
              background: "#2A2A2A",
              border: "none",
              borderRadius: "8px",
              color: "#FFFFFF",
              fontSize: "12px",
              fontFamily: "var(--font-jetbrains-mono)",
            }}
            formatter={(value: number) => [formatCurrency(value), "Revenue"]}
          />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={i === data.length - 1
                  ? "url(#amberGradientStrong)"
                  : `rgba(245,158,11,${0.1 + (i / data.length) * 0.25})`
                }
              />
            ))}
          </Bar>
          <defs>
            <linearGradient id="amberGradientStrong" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.3} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Create BusinessBreakdown**

```tsx
// src/components/widgets/FinancialCommandCenter/BusinessBreakdown.tsx
"use client";
import { useState } from "react";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { formatCurrency } from "@/lib/utils/currency";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils/formatters";

const BIZ_COLORS = ["#F59E0B", "#8B5CF6", "#22C55E", "#3B82F6"];

export function BusinessBreakdown() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const breakdown = useFinancialStore((s) => s.getBusinessBreakdown());

  return (
    <div>
      <p className="text-base font-bold text-text-primary mb-3">Businesses</p>
      <div className="space-y-2">
        {breakdown.map((item, i) => (
          <button
            key={item.business.id}
            onClick={() => setExpanded(expanded === item.business.id ? null : item.business.id)}
            className="w-full text-left bg-surface-elevated rounded-[10px] p-3.5 transition-all duration-150 hover:bg-[#1E1E1E]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: BIZ_COLORS[i] }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-secondary truncate">{item.business.displayName}</p>
                <p className="text-xs text-text-muted mt-0.5">Revenue: {formatCurrency(item.revenue)}/mo</p>
              </div>
              <div className="text-right">
                <p className={cn("font-mono text-sm font-semibold", item.netIncome >= 0 ? "text-success" : "text-danger")}>
                  {item.netIncome >= 0 ? "+" : ""}{formatCurrency(item.netIncome)}
                </p>
              </div>
              {expanded === item.business.id ? (
                <ChevronUp className="w-3.5 h-3.5 text-text-faint" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-text-faint" />
              )}
            </div>
            {expanded === item.business.id && (
              <div className="mt-3 pt-3 border-t border-border space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-text-muted">Revenue</span><span className="font-mono text-text-secondary">{formatCurrency(item.revenue)}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Expenses</span><span className="font-mono text-text-secondary">{formatCurrency(item.expenses)}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Payroll</span><span className="font-mono text-text-secondary">{formatCurrency(item.payroll)}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Margin</span><span className="font-mono text-text-secondary">{item.margin.toFixed(1)}%</span></div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create ExpenseCategoryChart**

```tsx
// src/components/widgets/FinancialCommandCenter/ExpenseCategoryChart.tsx
"use client";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { formatCurrency } from "@/lib/utils/currency";

export function ExpenseCategoryChart() {
  const categories = useFinancialStore((s) => s.getExpensesByCategory());
  const maxAmount = Math.max(...categories.map((c) => c.amount), 1);

  return (
    <div>
      <p className="text-base font-bold text-text-primary mb-3">Expense Categories</p>
      <div className="space-y-2.5">
        {categories.map((cat) => (
          <div key={cat.category} className="flex items-center gap-2.5">
            <span className="text-xs text-text-tertiary w-16 shrink-0 font-medium">{cat.category}</span>
            <div className="flex-1 h-2.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(cat.amount / maxAmount) * 100}%`,
                  background: `linear-gradient(90deg, ${cat.color}, ${cat.color}90)`,
                }}
              />
            </div>
            <span className="font-mono text-xs text-text-tertiary w-16 text-right shrink-0">{formatCurrency(cat.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create RevenueTracker**

```tsx
// src/components/widgets/FinancialCommandCenter/RevenueTracker.tsx
"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { formatCurrency } from "@/lib/utils/currency";
import { formatMonthYear } from "@/lib/utils/formatters";

export function RevenueTracker() {
  const { businesses, revenueEntries } = useFinancialStore();
  const trend1 = useFinancialStore((s) => s.getMonthlyRevenueTrend(businesses[0]?.id));
  const trend2 = useFinancialStore((s) => s.getMonthlyRevenueTrend(businesses[1]?.id));

  // Merge into single dataset
  const months = new Set([...trend1.map((d) => d.month), ...trend2.map((d) => d.month)]);
  const data = Array.from(months).sort().map((month) => ({
    month: formatMonthYear(month + "-01"),
    [businesses[0]?.displayName ?? "Business 1"]: trend1.find((d) => d.month === month)?.amount ?? 0,
    [businesses[1]?.displayName ?? "Business 2"]: trend2.find((d) => d.month === month)?.amount ?? 0,
  }));

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-text-muted text-sm">No revenue entries yet</p>
        <p className="text-text-faint text-xs mt-1">Add your first revenue entry to see trends</p>
      </div>
    );
  }

  const biz1Name = businesses[0]?.displayName ?? "Business 1";
  const biz2Name = businesses[1]?.displayName ?? "Business 2";

  return (
    <div>
      <div className="flex items-center gap-4 mb-3">
        <p className="text-base font-bold text-text-primary">Revenue Trend</p>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-accent" /><span className="text-[10px] text-text-muted">{biz1Name}</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-purple" /><span className="text-[10px] text-text-muted">{biz2Name}</span></div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
          <XAxis dataKey="month" tick={{ fill: "#737373", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#737373", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
          <Tooltip
            contentStyle={{
              background: "#2A2A2A",
              border: "none",
              borderRadius: "8px",
              color: "#FFFFFF",
              fontSize: "12px",
              fontFamily: "var(--font-jetbrains-mono)",
            }}
            formatter={(value: number) => formatCurrency(value)}
          />
          <Line type="monotone" dataKey={biz1Name} stroke="#F59E0B" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#F59E0B" }} />
          <Line type="monotone" dataKey={biz2Name} stroke="#8B5CF6" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#8B5CF6" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 5: Create PayrollGauge**

```tsx
// src/components/widgets/FinancialCommandCenter/PayrollGauge.tsx
"use client";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { Badge } from "@/components/ui/Badge";

export function PayrollGauge() {
  const ratio = useFinancialStore((s) => s.getPayrollToRevenueRatio());

  const clampedRatio = Math.min(ratio, 100);
  // Arc math: 180 degrees total, ratio maps to angle
  const angle = (clampedRatio / 100) * 180;
  const radians = ((180 - angle) * Math.PI) / 180;
  const cx = 70, cy = 65, r = 50;
  const endX = cx + r * Math.cos(radians);
  const endY = cy - r * Math.sin(radians);

  const getColor = () => {
    if (ratio < 30) return { color: "#22C55E", label: "Healthy Range", variant: "success" as const };
    if (ratio < 40) return { color: "#F59E0B", label: "Caution", variant: "warning" as const };
    return { color: "#EF4444", label: "Warning", variant: "danger" as const };
  };

  const { color, label, variant } = getColor();

  return (
    <div className="flex flex-col items-center py-2">
      <p className="text-base font-bold text-text-primary mb-3">Payroll / Revenue</p>
      <svg viewBox="0 0 140 80" width="140" height="80">
        {/* Background arc */}
        <path d="M 15 65 A 55 55 0 0 1 125 65" fill="none" stroke="#1E1E1E" strokeWidth="10" strokeLinecap="round" />
        {/* Colored arc */}
        <path
          d={`M 15 65 A 55 55 0 0 1 ${endX} ${endY}`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
        />
      </svg>
      <p className="font-mono text-3xl font-bold mt-1" style={{ color }}>{ratio.toFixed(0)}%</p>
      <p className="text-xs text-text-muted mt-1">of revenue goes to payroll</p>
      <Badge variant={variant} className="mt-2 text-[10px]">{"\u2713"} {label}</Badge>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/widgets/FinancialCommandCenter/
git commit -m "feat: add all Financial Command Center chart components"
```

---

## Task 15: Financial Command Center Orchestrator

**Files:**
- Create: `src/components/widgets/FinancialCommandCenter/index.tsx`

- [ ] **Step 1: Create the orchestrator component**

```tsx
// src/components/widgets/FinancialCommandCenter/index.tsx
"use client";
import { ConsolidatedPL } from "./ConsolidatedPL";
import { CashFlowChart } from "./CashFlowChart";
import { BusinessBreakdown } from "./BusinessBreakdown";
import { ExpenseCategoryChart } from "./ExpenseCategoryChart";
import { RevenueTracker } from "./RevenueTracker";
import { PayrollGauge } from "./PayrollGauge";

export function FinancialCommandCenter() {
  return (
    <div>
      {/* P&L Summary */}
      <ConsolidatedPL />

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="col-span-2">
          <CashFlowChart />
        </div>
        <div>
          <BusinessBreakdown />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <ExpenseCategoryChart />
        </div>
        <div>
          <RevenueTracker />
        </div>
        <div>
          <PayrollGauge />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/widgets/FinancialCommandCenter/index.tsx
git commit -m "feat: add Financial Command Center orchestrator"
```

---

## Task 16: CRUD Forms

**Files:**
- Create: `src/components/forms/AddBusinessForm.tsx`
- Create: `src/components/forms/AddExpenseForm.tsx`
- Create: `src/components/forms/AddRevenueForm.tsx`

- [ ] **Step 1: Create AddBusinessForm**

```tsx
// src/components/forms/AddBusinessForm.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useFinancialStore } from "@/lib/stores/financialStore";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  displayName: z.string().min(1, "Display name is required"),
  currency: z.string().min(1, "Currency is required"),
  revenueLow: z.coerce.number().min(0, "Must be positive"),
  revenueHigh: z.coerce.number().min(0, "Must be positive"),
});

type FormData = z.infer<typeof schema>;

interface AddBusinessFormProps {
  onClose: () => void;
}

export function AddBusinessForm({ onClose }: AddBusinessFormProps) {
  const addBusiness = useFinancialStore((s) => s.addBusiness);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { currency: "USD", revenueLow: 0, revenueHigh: 0 },
  });

  const onSubmit = async (data: FormData) => {
    await addBusiness(data);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Business Name" {...register("name")} error={errors.name?.message} placeholder="e.g. Acme Corp" />
      <Input label="Display Name" {...register("displayName")} error={errors.displayName?.message} placeholder="e.g. Acme" />
      <Select
        label="Currency"
        {...register("currency")}
        error={errors.currency?.message}
        options={[
          { value: "USD", label: "USD ($)" },
          { value: "CAD", label: "CAD (CA$)" },
          { value: "GBP", label: "GBP (\u00a3)" },
          { value: "EUR", label: "EUR (\u20ac)" },
        ]}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Revenue Low" type="number" {...register("revenueLow")} error={errors.revenueLow?.message} placeholder="0" />
        <Input label="Revenue High" type="number" {...register("revenueHigh")} error={errors.revenueHigh?.message} placeholder="0" />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" isLoading={isSubmitting} className="flex-1">Add Business</Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Create AddExpenseForm**

```tsx
// src/components/forms/AddExpenseForm.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useFinancialStore } from "@/lib/stores/financialStore";

const schema = z.object({
  businessId: z.string().min(1, "Select a business"),
  category: z.string().min(1, "Select a category"),
  name: z.string().min(1, "Name is required"),
  amount: z.coerce.number().positive("Must be positive"),
  currency: z.string().default("USD"),
  frequency: z.enum(["monthly", "weekly", "yearly", "one-time"]),
});

type FormData = z.infer<typeof schema>;

interface AddExpenseFormProps {
  onClose: () => void;
}

export function AddExpenseForm({ onClose }: AddExpenseFormProps) {
  const addExpense = useFinancialStore((s) => s.addExpense);
  const businesses = useFinancialStore((s) => s.businesses);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { currency: "USD", frequency: "monthly" },
  });

  const onSubmit = async (data: FormData) => {
    await addExpense(data);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select
        label="Business"
        {...register("businessId")}
        error={errors.businessId?.message}
        placeholder="Select business"
        options={businesses.map((b) => ({ value: b.id, label: b.displayName }))}
      />
      <Select
        label="Category"
        {...register("category")}
        error={errors.category?.message}
        placeholder="Select category"
        options={["Payroll", "Software", "Marketing", "Rent", "Utilities", "Other"].map((c) => ({ value: c, label: c }))}
      />
      <Input label="Name" {...register("name")} error={errors.name?.message} placeholder="e.g. Office lease" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Amount" type="number" step="0.01" {...register("amount")} error={errors.amount?.message} placeholder="0.00" />
        <Select
          label="Frequency"
          {...register("frequency")}
          error={errors.frequency?.message}
          options={[
            { value: "monthly", label: "Monthly" },
            { value: "weekly", label: "Weekly" },
            { value: "yearly", label: "Yearly" },
            { value: "one-time", label: "One-time" },
          ]}
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" isLoading={isSubmitting} className="flex-1">Add Expense</Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Create AddRevenueForm**

```tsx
// src/components/forms/AddRevenueForm.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useFinancialStore } from "@/lib/stores/financialStore";

const schema = z.object({
  businessId: z.string().min(1, "Select a business"),
  amount: z.coerce.number().positive("Must be positive"),
  currency: z.string().default("USD"),
  source: z.string().min(1, "Source is required"),
  description: z.string().default(""),
  date: z.string().min(1, "Date is required"),
});

type FormData = z.infer<typeof schema>;

interface AddRevenueFormProps {
  onClose: () => void;
}

export function AddRevenueForm({ onClose }: AddRevenueFormProps) {
  const addRevenue = useFinancialStore((s) => s.addRevenue);
  const businesses = useFinancialStore((s) => s.businesses);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { currency: "USD", source: "manual", date: new Date().toISOString().split("T")[0] },
  });

  const onSubmit = async (data: FormData) => {
    await addRevenue(data);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select
        label="Business"
        {...register("businessId")}
        error={errors.businessId?.message}
        placeholder="Select business"
        options={businesses.map((b) => ({ value: b.id, label: b.displayName }))}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Amount" type="number" step="0.01" {...register("amount")} error={errors.amount?.message} placeholder="0.00" />
        <Input label="Date" type="date" {...register("date")} error={errors.date?.message} />
      </div>
      <Input label="Source" {...register("source")} error={errors.source?.message} placeholder="e.g. Client payment" />
      <Input label="Description" {...register("description")} placeholder="Optional notes" />
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" isLoading={isSubmitting} className="flex-1">Add Revenue</Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/forms/
git commit -m "feat: add CRUD forms for business, expense, and revenue with Zod validation"
```

---

## Task 17: Placeholder Widgets

**Files:**
- Create: `src/components/widgets/PlaceholderWidget.tsx`

- [ ] **Step 1: Create PlaceholderWidget**

```tsx
// src/components/widgets/PlaceholderWidget.tsx
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface PlaceholderWidgetProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function PlaceholderWidget({ title, description, icon: Icon }: PlaceholderWidgetProps) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center h-full">
      <Icon className="w-8 h-8 text-text-faint mb-3 opacity-40" />
      <p className="text-sm font-semibold text-text-muted">{title}</p>
      <p className="text-xs text-text-faint mt-1 max-w-[180px]">{description}</p>
      <Badge className="mt-3 text-[10px]">Coming Soon</Badge>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/widgets/PlaceholderWidget.tsx
git commit -m "feat: add PlaceholderWidget for coming-soon modules"
```

---

## Task 18: Wire Everything into Dashboard Page

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Complete the dashboard page with all widgets**

```tsx
// src/app/dashboard/page.tsx
"use client";
import { useEffect, useState } from "react";
import { Users, BrainCircuit, Target, GitBranch, Activity, Plus } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { DashboardGrid } from "@/components/layout/DashboardGrid";
import { WidgetWrapper } from "@/components/layout/WidgetWrapper";
import { FinancialCommandCenter } from "@/components/widgets/FinancialCommandCenter";
import { PlaceholderWidget } from "@/components/widgets/PlaceholderWidget";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AddBusinessForm } from "@/components/forms/AddBusinessForm";
import { AddExpenseForm } from "@/components/forms/AddExpenseForm";
import { AddRevenueForm } from "@/components/forms/AddRevenueForm";
import { MetricSkeleton } from "@/components/ui/Skeleton";
import type { LayoutItem } from "@/lib/data/types";

const defaultLayouts: Record<string, LayoutItem[]> = {
  lg: [
    { i: "financial", x: 0, y: 0, w: 12, h: 8, minW: 6, minH: 4 },
    { i: "workforce", x: 0, y: 8, w: 4, h: 3, minW: 3, minH: 2 },
    { i: "ooda", x: 4, y: 8, w: 4, h: 3, minW: 3, minH: 2 },
    { i: "goals", x: 8, y: 8, w: 4, h: 3, minW: 3, minH: 2 },
    { i: "scenarios", x: 0, y: 11, w: 6, h: 3, minW: 3, minH: 2 },
    { i: "pulse", x: 6, y: 11, w: 6, h: 3, minW: 3, minH: 2 },
  ],
};

type FormType = "business" | "expense" | "revenue" | null;

export default function DashboardPage() {
  const fetchAll = useFinancialStore((s) => s.fetchAll);
  const isLoading = useFinancialStore((s) => s.isLoading);
  const [formType, setFormType] = useState<FormType>(null);
  const [showFormPicker, setShowFormPicker] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleAddEntry = () => setShowFormPicker(true);
  const closeForm = () => { setFormType(null); setShowFormPicker(false); };

  return (
    <div>
      <TopBar onAddEntry={handleAddEntry} />
      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-4 gap-3">
            <MetricSkeleton /><MetricSkeleton /><MetricSkeleton /><MetricSkeleton />
          </div>
        ) : (
          <DashboardGrid defaultLayouts={defaultLayouts}>
            <div key="financial">
              <WidgetWrapper id="financial" title="Financial Command Center">
                <FinancialCommandCenter />
              </WidgetWrapper>
            </div>
            <div key="workforce">
              <WidgetWrapper id="workforce" title="Workforce Intelligence">
                <PlaceholderWidget title="Workforce Intelligence" description="Team analytics, org charts, and capacity planning" icon={Users} />
              </WidgetWrapper>
            </div>
            <div key="ooda">
              <WidgetWrapper id="ooda" title="OODA Decision Loop">
                <PlaceholderWidget title="OODA Decision Loop" description="Observe, Orient, Decide, Act framework" icon={BrainCircuit} />
              </WidgetWrapper>
            </div>
            <div key="goals">
              <WidgetWrapper id="goals" title="Strategic Goals">
                <PlaceholderWidget title="Strategic Goals" description="OKR tracking and goal alignment" icon={Target} />
              </WidgetWrapper>
            </div>
            <div key="scenarios">
              <WidgetWrapper id="scenarios" title="Scenario Planning">
                <PlaceholderWidget title="Scenario Planning" description="What-if analysis and financial modeling" icon={GitBranch} />
              </WidgetWrapper>
            </div>
            <div key="pulse">
              <WidgetWrapper id="pulse" title="Business Pulse">
                <PlaceholderWidget title="Business Pulse" description="Real-time health scores and alerts" icon={Activity} />
              </WidgetWrapper>
            </div>
          </DashboardGrid>
        )}
      </div>

      {/* Form Picker Modal */}
      <Modal isOpen={showFormPicker && !formType} onClose={closeForm} title="Add Entry">
        <div className="space-y-2">
          <Button variant="secondary" className="w-full justify-start" onClick={() => { setShowFormPicker(false); setFormType("business"); }}>
            <Plus className="w-4 h-4" /> Add Business
          </Button>
          <Button variant="secondary" className="w-full justify-start" onClick={() => { setShowFormPicker(false); setFormType("expense"); }}>
            <Plus className="w-4 h-4" /> Add Expense
          </Button>
          <Button variant="secondary" className="w-full justify-start" onClick={() => { setShowFormPicker(false); setFormType("revenue"); }}>
            <Plus className="w-4 h-4" /> Add Revenue Entry
          </Button>
        </div>
      </Modal>

      {/* Actual Forms */}
      <Modal isOpen={formType === "business"} onClose={closeForm} title="Add Business">
        <AddBusinessForm onClose={closeForm} />
      </Modal>
      <Modal isOpen={formType === "expense"} onClose={closeForm} title="Add Expense">
        <AddExpenseForm onClose={closeForm} />
      </Modal>
      <Modal isOpen={formType === "revenue"} onClose={closeForm} title="Add Revenue Entry">
        <AddRevenueForm onClose={closeForm} />
      </Modal>
    </div>
  );
}
```

- [ ] **Step 2: Verify the full dashboard**

Run: `npm run dev`

Verify all items from the spec's verification plan:
1. Login works → redirects to dashboard
2. Sidebar with nav items, amber active state
3. Financial Command Center with P&L cards + count-up animation
4. Click KPI card → modal with insights and sparkline
5. Cash flow chart with amber gradient bars
6. Business breakdown with both seeded businesses
7. Expense category horizontal bars
8. Revenue tracker line chart
9. Payroll gauge with percentage
10. Drag widgets → layout persists
11. Collapse/maximize widgets
12. Add Entry → Business/Expense/Revenue forms work
13. 5 placeholder widgets with "Coming Soon"
14. All fonts correct (DM Sans bold headings, JetBrains Mono figures)
15. Dark theme throughout

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: wire complete dashboard with all widgets, forms, and grid layout"
```

---

## Task 19: Final Polish + TypeScript Check

**Files:**
- Possibly minor fixes across multiple files

- [ ] **Step 1: Run TypeScript type check**

```bash
npx tsc --noEmit
```

Fix any type errors that surface.

- [ ] **Step 2: Run ESLint**

```bash
npm run lint
```

Fix any lint errors.

- [ ] **Step 3: Add .superpowers/ to .gitignore if not already done**

Verify `.superpowers/` is in `.gitignore`.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: fix TypeScript and lint errors, final Phase 1 polish"
```

- [ ] **Step 5: Final verification**

Run: `npm run dev`
Run through the full verification checklist from the spec one final time.
