-- Migrate pattern_alerts → pulse_alerts (Option A: single source of truth)
-- Run once. Safe to re-run: ON CONFLICT DO NOTHING skips rows already copied.
-- pattern_alerts table is left in place (not dropped) so historical reads still work
-- during the transition. Drop it in a later migration once verified.

INSERT INTO pulse_alerts (
  id,
  type,
  severity,
  title,
  message,
  data,
  related_goal_id,
  related_employee_id,
  related_business_id,
  related_decision_id,
  is_read,
  is_dismissed,
  created_at
)
SELECT
  id,
  type,
  severity,
  title,
  message,
  COALESCE(data, '{}'::jsonb),
  related_goal_id,
  NULL,
  NULL,
  NULL,
  COALESCE(is_read, false),
  COALESCE(is_dismissed, false),
  created_at
FROM pattern_alerts
WHERE type IN (
  'spending_trend',
  'revenue_momentum',
  'goal_pacing',
  'anomaly',
  'ratio_breach'
)
ON CONFLICT (id) DO NOTHING;
