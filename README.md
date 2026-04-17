# Executive Decision Intelligence Dashboard

An AI-powered executive command center for multi-business financial oversight, workforce management, and strategic decision-making.

## Features

- **Financial Command Center** — Consolidated P&L across multiple businesses with real-time KPIs
- **Workforce Intelligence** — Employee management with compensation modeling, ROI scoring, and impact preview
- **OODA Decision Engine** — AI-powered 4-stage decision framework (Observe → Orient → Decide → Act) with Claude integration
- **Goal Tracker** — Backward feasibility calculations, "What Would It Take" recovery cards, pattern detection, dependency mapping
- **Scenario Simulator** — What-if modeling with Monte Carlo probability analysis (1,000 simulations)
- **Pulse Alerts** — Real-time financial health monitoring with 8 detection algorithms

## Tech Stack

Next.js 15 | Supabase | Claude API | Tailwind CSS | react-grid-layout | Recharts | D3.js | Zustand

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in credentials
3. Run SQL migrations in Supabase SQL editor (in order):
   - `supabase/schema.sql`
   - `supabase/phase4_goals.sql`
   - `supabase/phase6_scenarios_pulse.sql`
   - `supabase/phase7_views.sql`
4. Create admin accounts in Supabase Auth
5. `npm install && npm run dev`

## Environment Variables

See `.env.example` for required variables.

## Deployment

Configured for Netlify. Set environment variables in the Netlify dashboard.

## License

Proprietary — All rights reserved. See LICENSE file.
