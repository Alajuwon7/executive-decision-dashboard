-- Phase 5A: QuickBooks Integration
-- Run after phase7_views.sql.

CREATE TABLE IF NOT EXISTS business_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('quickbooks', 'stripe', 'outlook')),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  realm_id TEXT,
  external_account_id TEXT,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'partial', 'failed', 'pending')),
  last_sync_error TEXT,
  is_active BOOLEAN DEFAULT true,
  sync_frequency TEXT DEFAULT '15min' CHECK (sync_frequency IN ('realtime', '15min', 'hourly', 'daily', 'manual')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, provider)
);

ALTER TABLE business_integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access" ON business_integrations;
CREATE POLICY "Authenticated access" ON business_integrations FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES business_integrations(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual')),
  status TEXT NOT NULL CHECK (status IN ('started', 'success', 'partial', 'failed')),
  records_fetched INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_skipped INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  error_details JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access" ON sync_log;
CREATE POLICY "Authenticated access" ON sync_log FOR ALL USING (auth.role() = 'authenticated');

-- Add sync tracking columns to existing tables
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS quickbooks_entity_type TEXT;

ALTER TABLE revenue_entries ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;
ALTER TABLE revenue_entries ADD COLUMN IF NOT EXISTS quickbooks_entity_type TEXT;

ALTER PUBLICATION supabase_realtime ADD TABLE business_integrations;
ALTER PUBLICATION supabase_realtime ADD TABLE sync_log;
