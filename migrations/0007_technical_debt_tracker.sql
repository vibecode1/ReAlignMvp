-- Technical Debt Tracker Tables
-- This migration adds support for tracking and managing technical debt

-- Technical debt inventory
CREATE TABLE IF NOT EXISTS technical_debts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('code_smell', 'design_debt', 'documentation_debt', 'test_debt', 'dependency_debt', 'performance_debt')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location JSONB NOT NULL,
  impact JSONB NOT NULL,
  effort JSONB NOT NULL,
  metrics JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refactoring plans
CREATE TABLE IF NOT EXISTS refactoring_plans (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority DECIMAL(5,2) NOT NULL,
  estimated_effort DECIMAL(10,2) NOT NULL,
  expected_benefit JSONB NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]',
  dependencies TEXT[] DEFAULT '{}',
  risks JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link between plans and debts
CREATE TABLE IF NOT EXISTS plan_debts (
  plan_id TEXT NOT NULL REFERENCES refactoring_plans(id),
  debt_id TEXT NOT NULL REFERENCES technical_debts(id),
  PRIMARY KEY (plan_id, debt_id)
);

-- Debt trends over time
CREATE TABLE IF NOT EXISTS debt_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL,
  total_debt INTEGER NOT NULL,
  debt_by_type JSONB NOT NULL,
  debt_by_severity JSONB NOT NULL,
  velocity_metrics JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Debt scan history
CREATE TABLE IF NOT EXISTS debt_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_type TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  files_scanned INTEGER,
  debts_found INTEGER,
  new_debts INTEGER,
  resolved_debts INTEGER,
  scan_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call analytics tables (for voice call system)
CREATE TABLE IF NOT EXISTS voice_calls (
  id TEXT PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  recipient_id UUID NOT NULL REFERENCES users(id),
  purpose TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed', 'failed', 'no_answer')),
  script JSONB NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration INTEGER, -- seconds
  recording TEXT,
  transcript JSONB,
  outcome JSONB,
  ai_metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS call_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id TEXT NOT NULL REFERENCES voice_calls(id),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  metrics JSONB NOT NULL,
  insights JSONB DEFAULT '[]',
  patterns JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  performance_score DECIMAL(3,2),
  comparison_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_technical_debts_type ON technical_debts(type);
CREATE INDEX idx_technical_debts_severity ON technical_debts(severity);
CREATE INDEX idx_technical_debts_resolved ON technical_debts(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX idx_technical_debts_location ON technical_debts USING GIN(location);

CREATE INDEX idx_refactoring_plans_status ON refactoring_plans(status);
CREATE INDEX idx_refactoring_plans_priority ON refactoring_plans(priority DESC);

CREATE INDEX idx_debt_trends_timestamp ON debt_trends(timestamp DESC);

CREATE INDEX idx_voice_calls_transaction ON voice_calls(transaction_id);
CREATE INDEX idx_voice_calls_status ON voice_calls(status);
CREATE INDEX idx_voice_calls_scheduled ON voice_calls(scheduled_at);

CREATE INDEX idx_call_analytics_call ON call_analytics(call_id);
CREATE INDEX idx_call_analytics_score ON call_analytics(performance_score DESC);

-- Enable RLS
ALTER TABLE technical_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE refactoring_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Technical debt policies (service role only for now)
CREATE POLICY "Service users can manage technical debts" ON technical_debts
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service users can manage refactoring plans" ON refactoring_plans
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service users can manage plan debts" ON plan_debts
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service users can manage debt trends" ON debt_trends
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service users can manage debt scans" ON debt_scans
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Voice call policies
CREATE POLICY "Users can view their voice calls" ON voice_calls
  FOR SELECT
  USING (
    recipient_id = auth.uid() OR
    transaction_id IN (
      SELECT t.id FROM transactions t
      JOIN transaction_parties tp ON t.id = tp.transaction_id
      WHERE tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Service users can manage all voice calls" ON voice_calls
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can view analytics for their calls" ON call_analytics
  FOR SELECT
  USING (
    call_id IN (
      SELECT id FROM voice_calls
      WHERE recipient_id = auth.uid() OR
      transaction_id IN (
        SELECT t.id FROM transactions t
        JOIN transaction_parties tp ON t.id = tp.transaction_id
        WHERE tp.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Service users can manage all call analytics" ON call_analytics
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to update debt metrics
CREATE OR REPLACE FUNCTION update_debt_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last_seen timestamp when debt is detected again
  IF TG_OP = 'UPDATE' AND OLD.last_seen IS DISTINCT FROM NEW.last_seen THEN
    NEW.metrics = jsonb_set(
      NEW.metrics,
      '{occurrences}',
      to_jsonb(COALESCE((NEW.metrics->>'occurrences')::int, 0) + 1)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for debt metrics
CREATE TRIGGER update_debt_metrics_trigger
  BEFORE UPDATE ON technical_debts
  FOR EACH ROW
  WHEN (OLD.last_seen IS DISTINCT FROM NEW.last_seen)
  EXECUTE FUNCTION update_debt_metrics();

-- Function to calculate debt velocity
CREATE OR REPLACE FUNCTION calculate_debt_velocity(
  p_period_days INTEGER DEFAULT 30
) RETURNS TABLE (
  created_count INTEGER,
  resolved_count INTEGER,
  net_change INTEGER,
  velocity_per_day DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day' * p_period_days)::INTEGER as created_count,
    COUNT(*) FILTER (WHERE resolved_at >= NOW() - INTERVAL '1 day' * p_period_days)::INTEGER as resolved_count,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day' * p_period_days)::INTEGER -
    COUNT(*) FILTER (WHERE resolved_at >= NOW() - INTERVAL '1 day' * p_period_days)::INTEGER as net_change,
    (COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day' * p_period_days)::DECIMAL -
     COUNT(*) FILTER (WHERE resolved_at >= NOW() - INTERVAL '1 day' * p_period_days)::DECIMAL) / p_period_days as velocity_per_day
  FROM technical_debts;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER set_technical_debts_updated_at
  BEFORE UPDATE ON technical_debts
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_refactoring_plans_updated_at
  BEFORE UPDATE ON refactoring_plans
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_voice_calls_updated_at
  BEFORE UPDATE ON voice_calls
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();