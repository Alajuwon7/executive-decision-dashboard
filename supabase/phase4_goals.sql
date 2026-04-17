-- Phase 4: Goal Tracker schema additions
-- Run this in the Supabase SQL editor after the base schema.

CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner TEXT NOT NULL CHECK (owner IN ('his', 'hers', 'shared', 'company')),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('personal', 'company', 'operational')),
  target_value NUMERIC(14,2),
  target_date DATE,
  current_value NUMERIC(14,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'at_risk', 'behind', 'abandoned')),
  dependencies JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  feasibility JSONB DEFAULT '{}'::jsonb,
  last_feasibility_check TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access" ON goals;
CREATE POLICY "Authenticated access" ON goals FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS goal_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_date DATE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access" ON goal_milestones;
CREATE POLICY "Authenticated access" ON goal_milestones FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS pattern_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('spending_trend', 'revenue_momentum', 'goal_pacing', 'anomaly', 'ratio_breach')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  related_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE pattern_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access" ON pattern_alerts;
CREATE POLICY "Authenticated access" ON pattern_alerts FOR ALL USING (auth.role() = 'authenticated');

-- Personal draw (monthly take-home) stored per-user on the existing dashboard_layouts row.
ALTER TABLE dashboard_layouts
  ADD COLUMN IF NOT EXISTS personal_draw JSONB DEFAULT '{}'::jsonb;

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE goals;
ALTER PUBLICATION supabase_realtime ADD TABLE goal_milestones;
ALTER PUBLICATION supabase_realtime ADD TABLE pattern_alerts;
