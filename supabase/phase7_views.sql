-- Phase 7: Performance views
-- Run after phase6_scenarios_pulse.sql.

CREATE OR REPLACE VIEW v_monthly_pl AS
SELECT
  DATE_TRUNC('month', r.date) AS month,
  b.id AS business_id,
  b.display_name AS business_name,
  COALESCE(SUM(r.amount), 0) AS revenue
FROM revenue_entries r
JOIN businesses b ON r.business_id = b.id
GROUP BY DATE_TRUNC('month', r.date), b.id, b.display_name;

CREATE OR REPLACE VIEW v_payroll_summary AS
SELECT
  e.business_id,
  b.display_name AS business_name,
  COUNT(*) AS headcount,
  SUM(
    CASE WHEN e.compensation_type = 'hourly'
      THEN e.rate * COALESCE(e.hours_per_week, 40) * 52 / 12
      ELSE e.rate / 12
    END
  ) AS monthly_payroll
FROM employees e
JOIN businesses b ON e.business_id = b.id
WHERE e.status = 'active'
GROUP BY e.business_id, b.display_name;

CREATE OR REPLACE VIEW v_expense_summary AS
SELECT
  business_id,
  category,
  SUM(amount) AS total_monthly
FROM expenses
WHERE is_active = true
GROUP BY business_id, category;
