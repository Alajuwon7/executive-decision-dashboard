-- Phase 6: Scenario Simulator + Pulse Alerts
-- Run after phase4_goals.sql.

CREATE TABLE IF NOT EXISTS scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  base_snapshot JSONB NOT NULL,
  modifications JSONB NOT NULL DEFAULT '[]'::jsonb,
  projected_outcome JSONB DEFAULT '{}'::jsonb,
  monte_carlo_results JSONB DEFAULT '{}'::jsonb,
  probability_score NUMERIC(5,2),
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access" ON scenarios;
CREATE POLICY "Authenticated access" ON scenarios FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS pulse_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('ratio_breach', 'goal_at_risk', 'spending_trend', 'revenue_drop', 'revenue_momentum', 'anomaly', 'decision_stalled', 'goal_pacing')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  related_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  related_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  related_business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  related_decision_id UUID REFERENCES ooda_decisions(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_by UUID,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE pulse_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access" ON pulse_alerts;
CREATE POLICY "Authenticated access" ON pulse_alerts FOR ALL USING (auth.role() = 'authenticated');

ALTER PUBLICATION supabase_realtime ADD TABLE scenarios;
ALTER PUBLICATION supabase_realtime ADD TABLE pulse_alerts;
