# Executive Decision Intelligence Dashboard — Phase 1 Design Spec

## Problem

Two businesses (Myers Immigration Services Inc. and Canstudy Consulting Ltd.) need a unified command center for financial visibility. Currently there's no centralized way to view consolidated P&L, expense breakdowns, payroll ratios, or revenue trends across both businesses. Phase 1 delivers the foundational dashboard with manual data entry and a working Financial Command Center.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Theme | Dark modern fintech | User preference — reference image with dark bg, amber accent, bold typography |
| Navigation | Left sidebar + top bar | Matches reference design, room for future modules |
| Data layer | Repository pattern + localStorage | Mock-first approach; swap to Supabase later by changing one import |
| Persistence | localStorage | Data survives page reloads without backend; easy to reset |
| Access model | Shared view | Both admins see all data for both businesses in Phase 1 |
| Auth | Mock gate (localStorage flag) | Supabase not yet configured; swap in real auth later |
| State management | Zustand | Works outside React tree (for callbacks), no provider nesting |
| Forms | React Hook Form + Zod | Composable validation, good DX, small bundle |

---

## Visual Design

### Color Palette

```
Background:           #0A0A0A (near-black)
Card surfaces:        #141414
Elevated surfaces:    #1A1A1A
Borders:              #1E1E1E
Subtle borders:       #2A2A2A

Text primary:         #FFFFFF
Text secondary:       #D4D4D4
Text tertiary:        #A3A3A3
Text muted:           #737373
Text faint:           #525252

Accent (primary):     #F59E0B (amber)
Accent hover:         #D97706
Accent gradient:      linear-gradient(135deg, #F59E0B, #D97706)
Accent subtle bg:     rgba(245,158,11,0.12)

Success:              #22C55E
Success bg:           rgba(34,197,94,0.12)
Danger:               #EF4444
Danger bg:            rgba(239,68,68,0.12)
Purple (secondary):   #8B5CF6
Blue (tertiary):      #3B82F6
Pink (quaternary):    #F43F5E
```

### Typography

- **Brand/headings:** DM Sans 700 (bold, modern feel — not thin)
- **Body/UI:** DM Sans 500-600
- **Financial figures:** JetBrains Mono 600-700
- **Labels/captions:** DM Sans 600, 11-12px, uppercase, 1.5px letter-spacing, muted color

All loaded via `next/font/google`.

### Spacing & Radius

- Card border-radius: 14px
- Button border-radius: 10px
- Inner elements: 8-12px radius
- Card padding: 20px
- Grid gap: 16px
- Sidebar width: 220px

### Shadows & Effects

- Cards: no visible shadow (dark theme relies on borders)
- Widget drag state: `border-color: #F59E0B` + `box-shadow: 0 0 20px rgba(245,158,11,0.1)` + `transform: translateY(-1px)`
- Modal overlay: `background: rgba(0,0,0,0.7)` + `backdrop-filter: blur(8px)`
- Transitions: 200ms ease on all interactive elements

---

## Architecture

### File Structure

```
src/
├── app/
│   ├── layout.tsx                  # Root layout: fonts, Toaster
│   ├── page.tsx                    # Redirect to /dashboard or /login
│   ├── login/page.tsx              # Mock login page
│   └── dashboard/
│       ├── layout.tsx              # Sidebar + top bar shell
│       └── page.tsx                # Main grid with all widgets
├── components/
│   ├── ui/                         # Reusable primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   ├── Skeleton.tsx
│   │   └── Toast (via sonner)
│   ├── layout/
│   │   ├── Sidebar.tsx             # Left sidebar navigation
│   │   ├── TopBar.tsx              # Top bar with title + actions + avatar
│   │   ├── DashboardGrid.tsx       # react-grid-layout container
│   │   └── WidgetWrapper.tsx       # Universal widget chrome
│   ├── widgets/
│   │   ├── FinancialCommandCenter/
│   │   │   ├── index.tsx           # Orchestrator
│   │   │   ├── ConsolidatedPL.tsx  # 4 metric cards
│   │   │   ├── KPIDetailModal.tsx  # Clickable KPI detail modal
│   │   │   ├── CashFlowChart.tsx   # Bar chart with tabs
│   │   │   ├── BusinessBreakdown.tsx
│   │   │   ├── ExpenseCategoryChart.tsx
│   │   │   ├── RevenueTracker.tsx  # Line chart
│   │   │   └── PayrollGauge.tsx    # Semi-circle gauge
│   │   └── PlaceholderWidget.tsx
│   └── forms/
│       ├── AddBusinessForm.tsx
│       ├── AddExpenseForm.tsx
│       └── AddRevenueForm.tsx
├── lib/
│   ├── data/
│   │   ├── types.ts                # All TypeScript interfaces
│   │   ├── repository.ts           # DataRepository interface
│   │   ├── local-repository.ts     # localStorage implementation
│   │   ├── seed-data.ts            # Mock data for both businesses
│   │   └── index.ts                # Export active repository
│   ├── stores/
│   │   ├── dashboardStore.ts       # Layout, nav state, collapsed/maximized
│   │   └── financialStore.ts       # Business data + computed selectors
│   └── utils/
│       ├── currency.ts             # formatCurrency, normalizeToUSD
│       ├── calculations.ts         # P&L calculations, ratios, insights
│       ├── formatters.ts           # Date, number, cn() class merge
│       └── insights.ts             # Dynamic KPI insight generation
├── hooks/
│   └── useCountUp.ts               # Count-up animation hook
└── styles/
    └── globals.css                  # Tailwind directives, dark theme base
```

### Data Layer (Repository Pattern)

```typescript
// repository.ts
interface DataRepository {
  // Businesses
  getBusinesses(): Promise<Business[]>
  addBusiness(data: CreateBusiness): Promise<Business>
  updateBusiness(id: string, data: Partial<Business>): Promise<Business>

  // Expenses
  getExpenses(businessId?: string): Promise<Expense[]>
  addExpense(data: CreateExpense): Promise<Expense>
  deleteExpense(id: string): Promise<void>

  // Revenue
  getRevenueEntries(businessId?: string): Promise<RevenueEntry[]>
  addRevenue(data: CreateRevenue): Promise<RevenueEntry>
  deleteRevenue(id: string): Promise<void>

  // Employees
  getEmployees(businessId?: string): Promise<Employee[]>

  // Layout
  getLayout(): DashboardLayout | null
  saveLayout(layout: DashboardLayout): void

  // Listeners (for real-time updates when Supabase is wired)
  onChange(callback: () => void): () => void
}
```

`LocalStorageRepository` implements this interface. On first load, it seeds localStorage with mock data from `seed-data.ts`. All reads/writes go through this interface.

**Swap path to Supabase:** Create `SupabaseRepository` implementing the same interface, change the export in `lib/data/index.ts`. No component or store changes needed.

### Zustand Stores

**dashboardStore:**
- `layouts` — react-grid-layout positions
- `activeTab` — current sidebar nav item
- `collapsedWidgets` — Set of widget IDs
- `maximizedWidget` — widget ID or null
- Actions: `setLayouts`, `toggleCollapse`, `setMaximized`, `saveLayout`, `loadLayout`

**financialStore:**
- `businesses`, `expenses`, `revenueEntries`, `employees` — raw data arrays
- `isLoading`, `error` — loading state
- Actions: `fetchAll`, `addBusiness`, `addExpense`, `addRevenue`
- Computed selectors: `getConsolidatedPL()`, `getBusinessBreakdown()`, `getExpensesByCategory()`, `getPayrollToRevenueRatio()`, `getMonthlyRevenueTrend()`, `getKPIInsights(kpiType)`

---

## Components

### Sidebar

- Fixed left, 220px wide, `#111111` background
- Brand logo + "EDI" text at top
- Nav sections: Main (Dashboard, Businesses, Transactions, Employees), Modules (Workforce, OODA, Goals, Scenarios — each with "Soon" badge)
- Active item: amber tint background + amber text
- Bottom: Settings item

### TopBar

- Page title ("Dashboard") bold left
- Right: "Export" outline button, "+ Add Entry" amber button (opens form selector), user avatar circle

### DashboardGrid

- react-grid-layout `ResponsiveGridLayout`
- 12-column grid at lg breakpoint
- Draggable widgets with custom drag handle
- Layout persistence: debounced save to localStorage via dashboardStore (500ms)
- Drag state: amber border highlight + subtle glow

### WidgetWrapper

- Dark card (`#141414`) with `#1E1E1E` border
- Header: widget title (DM Sans 700), drag handle (GripVertical icon), collapse toggle, maximize toggle
- Collapse: smooth height transition to header-only
- Maximize: fixed overlay covering the grid
- Loading: skeleton shimmer
- Empty: editorial message with suggested action

### Financial Command Center

Lives inside a single large widget (spans 8+ columns). Contains:

**1. Consolidated P&L (ConsolidatedPL.tsx)**
- 4 metric cards in a row: Revenue, Expenses, Net Profit, Take-Home
- JetBrains Mono 600 for figures, count-up animation on load (`useCountUp` hook)
- Green/red delta badges with percentage + direction arrow
- **Each card is clickable** — opens KPIDetailModal

**2. KPI Detail Modal (KPIDetailModal.tsx)**
- Opens when any metric card is clicked
- Content (all dynamically generated from actual data):
  - Large KPI value + percentage change vs last month
  - 6-month sparkline (mini bar chart)
  - 2-4 insight bullets generated by `utils/insights.ts`:
    - Which business contributed most
    - Month-over-month growth per business
    - Whether values are within target range
    - Trend direction (consecutive increases/decreases)
  - Business breakdown bar showing each business's share
- Different insights per KPI type (Revenue insights differ from Expense insights)

**3. Cash Flow Chart (CashFlowChart.tsx)**
- Recharts `<BarChart>` with amber gradient bars
- Tab filter: Income / Expense / Saving
- Hover tooltips with JetBrains Mono amounts
- Responsive via `<ResponsiveContainer>`

**4. Business Breakdown (BusinessBreakdown.tsx)**
- Dark cards with colored dot per business (amber for Myers, purple for Canstudy)
- Shows business name, revenue detail, net income in green
- Click to expand for full breakdown (revenue, expenses, payroll, margin)

**5. Expense Category Chart (ExpenseCategoryChart.tsx)**
- Horizontal bars with gradient fills: Payroll (amber), Software (purple), Marketing (green), Rent (blue), Utilities (pink)
- Labels left, dollar amounts right
- Quick action buttons: "+ Add Expense", "+ Add Revenue"

**6. Revenue Tracker (RevenueTracker.tsx)**
- Recharts `<LineChart>` with one line per business
- Amber line for Myers, purple for Canstudy
- Responsive, editorial tooltips
- Empty state: "Add your first revenue entry"

**7. Payroll-to-Revenue Gauge (PayrollGauge.tsx)**
- SVG semi-circle with green/yellow/red zones
- Active fill showing current ratio
- Large percentage center (JetBrains Mono 700)
- Status badge: "Healthy Range" (green), "Caution" (yellow), "Warning" (red)

### Placeholder Widgets

5 coming-soon widgets: Workforce Intelligence, OODA Decision Engine, Goal Tracker, Scenario Simulator, Pulse & Alerts.

Each renders: faded icon, title (DM Sans 600), brief description, "Coming Soon" badge. Dark card with standard WidgetWrapper chrome.

### Forms

All rendered in Modal overlays, using React Hook Form + Zod validation.

**AddBusinessForm:** name (required, min 2), display_name, currency (dropdown: USD/CAD/GBP/EUR), revenue_low, revenue_high

**AddExpenseForm:** business_id (dropdown), category (dropdown: Payroll/Software/Marketing/Rent/Utilities/Other), name, amount (positive number), currency, frequency (monthly/weekly/yearly/one-time)

**AddRevenueForm:** business_id (dropdown), amount (positive number), currency, source (text), description, date (date picker)

All forms: dark-themed inputs with `#1E1E1E` borders, amber focus ring, toast on success/error via sonner.

---

## Authentication (Mock)

- `/login` page: dark centered card, DM Sans 700 "Executive Decision Intelligence" heading, email + password inputs, amber "Sign In" button
- Mock auth: any email/password sets a `session` cookie (via `document.cookie`) and `user` object in localStorage
- Next.js middleware reads the `session` cookie — redirects unauthenticated to `/login`, authenticated away from `/login`
- localStorage stores user display info (name/email for avatar); cookie handles the server-side redirect check
- Dashboard header shows user avatar with first initial, sign-out button clears both cookie and localStorage
- **Swap path:** Replace mock check with `supabase.auth.signInWithPassword()` and Supabase session middleware

---

## Mock Seed Data

Two businesses pre-seeded in localStorage on first load:

**Myers Immigration Services Inc.**
- Revenue range: $10,000-$25,000/mo
- 6 months of revenue entries ($28K-$35K range)
- Expenses: payroll ($12,000), software ($2,400), marketing ($1,800), rent ($1,500), utilities ($400)
- 2 employees: Immigration Attorney ($85K salary), Legal Assistant ($22/hr)

**Canstudy Consulting Ltd.**
- Revenue range: $2,000-$8,000/mo
- 6 months of revenue entries ($8K-$12K range)
- Expenses: payroll ($6,000), software ($800), marketing ($600)
- 1 employee: Education Consultant ($55K salary)

---

## Dynamic KPI Insights Engine

`utils/insights.ts` generates contextual bullet points for each KPI type:

**Revenue insights:**
- Largest business contributor + percentage share
- Month-over-month change per business
- Whether current revenue exceeds the business's target range
- Streak detection (consecutive monthly increases/decreases)

**Expense insights:**
- Largest expense category + percentage of total
- Fastest-growing category vs last month
- Payroll as percentage of total expenses
- Any category that changed significantly

**Net Profit insights:**
- Margin percentage
- Which business is most/least profitable
- Trend direction over recent months

**Take-Home insights:**
- After-payroll amount
- How much payroll consumes of net profit
- Comparison to previous months

Each insight has: icon (with semantic color), primary text with highlighted figures, and a secondary detail line.

---

## Interactions & Animations

- **Count-up:** `useCountUp` hook — requestAnimationFrame with easeOutCubic, 1.5s duration. Fires on initial load and when values change.
- **Widget drag:** `border-color: #F59E0B` + `box-shadow: 0 0 20px rgba(245,158,11,0.1)` + `translateY(-1px)`
- **Card hover:** border shifts to `#2A2A2A`, subtle background lighten to `#1A1A1A`
- **KPI card click:** amber border highlight, opens modal with scale + fade animation
- **Collapse:** smooth height transition (200ms ease)
- **Modal:** fade in backdrop + scale-up card (200ms ease-out)
- **Chart hover:** tooltip appears, bar/dot highlighted
- **Loading:** skeleton shimmer with dark tone pulse (#1A1A1A to #1E1E1E)
- **Empty states:** editorial message + suggested action button

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 3.4+ |
| Layout | react-grid-layout |
| State | Zustand |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Fonts | DM Sans, JetBrains Mono (Google Fonts) |
| Toasts | Sonner |
| Utils | clsx + tailwind-merge |

---

## Verification Plan

1. `npm run dev` starts without errors
2. Visit `/` — redirects to `/login`
3. Sign in with any credentials — redirects to `/dashboard`
4. Dashboard renders with sidebar, top bar, and widget grid
5. Financial Command Center shows P&L with count-up animation
6. Click any KPI card — modal opens with dynamic insights and sparkline
7. Cash flow chart renders with amber gradient bars, tab switching works
8. Business breakdown shows both seeded businesses, expandable
9. Expense category bars render with correct proportions
10. Payroll gauge shows ratio with correct color zone
11. Drag widgets — layout persists after page reload
12. Collapse/maximize widgets — transitions are smooth
13. "+ Add Entry" → Add Business form → submit → appears in breakdown
14. Add Expense → appears in expense chart, P&L recalculates
15. Add Revenue → appears in revenue tracker, P&L recalculates
16. All 5 placeholder widgets render with "Coming Soon" badges
17. All figures use JetBrains Mono; all headings use DM Sans bold
18. No console errors, no TypeScript errors
19. Responsive: sidebar collapses on smaller screens
