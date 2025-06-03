-- Intelligent Escalation Manager Tables
-- This migration adds support for smart escalation with multi-factor triggers

-- Escalations table
CREATE TABLE IF NOT EXISTS escalations (
  id TEXT PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  score DECIMAL(5,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'assigned', 'in_progress', 'resolved', 'auto_resolved')),
  assigned_to TEXT,
  triggers JSONB NOT NULL DEFAULT '[]',
  context JSONB NOT NULL DEFAULT '{}',
  resolution JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Experts table
CREATE TABLE IF NOT EXISTS experts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  specialties TEXT[] NOT NULL DEFAULT '{}',
  availability TEXT NOT NULL DEFAULT 'available' CHECK (availability IN ('available', 'busy', 'offline')),
  current_load INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0.0,
  average_resolution_time INTEGER DEFAULT 0, -- in minutes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Escalation patterns for learning
CREATE TABLE IF NOT EXISTS escalation_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT NOT NULL,
  triggers TEXT[] NOT NULL,
  severity TEXT NOT NULL,
  issue_keywords TEXT[] NOT NULL DEFAULT '{}',
  resolution_automatic BOOLEAN DEFAULT false,
  resolution_action TEXT,
  resolution_time INTEGER, -- in milliseconds
  success BOOLEAN NOT NULL,
  occurrence_count INTEGER DEFAULT 1,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert performance metrics
CREATE TABLE IF NOT EXISTS expert_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id TEXT NOT NULL REFERENCES experts(id),
  escalation_id TEXT NOT NULL REFERENCES escalations(id),
  resolution_time INTEGER NOT NULL, -- in minutes
  outcome TEXT NOT NULL CHECK (outcome IN ('resolved', 'escalated', 'transferred')),
  user_satisfaction INTEGER CHECK (user_satisfaction >= 1 AND user_satisfaction <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Escalation notifications
CREATE TABLE IF NOT EXISTS escalation_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escalation_id TEXT NOT NULL REFERENCES escalations(id),
  expert_id TEXT NOT NULL REFERENCES experts(id),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'sms', 'push', 'in_app')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'acknowledged')),
  sent_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_escalations_transaction_id ON escalations(transaction_id);
CREATE INDEX idx_escalations_status ON escalations(status);
CREATE INDEX idx_escalations_severity_status ON escalations(severity, status);
CREATE INDEX idx_escalations_assigned_to ON escalations(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_escalations_created_at ON escalations(created_at);

CREATE INDEX idx_experts_availability ON experts(availability);
CREATE INDEX idx_experts_specialties ON experts USING GIN(specialties);

CREATE INDEX idx_escalation_patterns_triggers ON escalation_patterns USING GIN(triggers);
CREATE INDEX idx_escalation_patterns_keywords ON escalation_patterns USING GIN(issue_keywords);

CREATE INDEX idx_expert_performance_expert_id ON expert_performance(expert_id);
CREATE INDEX idx_expert_performance_created_at ON expert_performance(created_at);

-- Enable RLS
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Escalations: Users can see escalations for their transactions
CREATE POLICY "Users can view their escalations" ON escalations
  FOR SELECT
  USING (
    transaction_id IN (
      SELECT t.id FROM transactions t
      JOIN transaction_parties tp ON t.id = tp.transaction_id
      WHERE tp.user_id = auth.uid()
    )
  );

-- Service users can manage all escalations
CREATE POLICY "Service users can manage all escalations" ON escalations
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Experts: All authenticated users can view experts
CREATE POLICY "Authenticated users can view experts" ON experts
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service users can manage experts" ON experts
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Patterns and performance: Service role only
CREATE POLICY "Service users can manage escalation patterns" ON escalation_patterns
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service users can manage expert performance" ON expert_performance
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service users can manage notifications" ON escalation_notifications
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to update expert metrics
CREATE OR REPLACE FUNCTION update_expert_metrics()
RETURNS TRIGGER AS $$
DECLARE
  v_total_cases INTEGER;
  v_resolved_cases INTEGER;
  v_total_time INTEGER;
BEGIN
  -- Only update on resolution
  IF NEW.outcome = 'resolved' THEN
    -- Get total cases and resolution times
    SELECT 
      COUNT(*),
      COUNT(*) FILTER (WHERE outcome = 'resolved'),
      AVG(resolution_time) FILTER (WHERE outcome = 'resolved')
    INTO v_total_cases, v_resolved_cases, v_total_time
    FROM expert_performance
    WHERE expert_id = NEW.expert_id;
    
    -- Update expert metrics
    UPDATE experts
    SET
      success_rate = CASE 
        WHEN v_total_cases > 0 THEN v_resolved_cases::DECIMAL / v_total_cases 
        ELSE 0 
      END,
      average_resolution_time = COALESCE(v_total_time, 0),
      updated_at = NOW()
    WHERE id = NEW.expert_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for expert metrics
CREATE TRIGGER update_expert_metrics_trigger
  AFTER INSERT ON expert_performance
  FOR EACH ROW
  EXECUTE FUNCTION update_expert_metrics();

-- Function to record escalation patterns
CREATE OR REPLACE FUNCTION record_escalation_pattern()
RETURNS TRIGGER AS $$
DECLARE
  v_issue_keywords TEXT[];
  v_triggers TEXT[];
BEGIN
  -- Only record on resolution
  IF NEW.status IN ('resolved', 'auto_resolved') AND OLD.status != NEW.status THEN
    -- Extract keywords from issue (simple word extraction)
    v_issue_keywords := string_to_array(
      lower(regexp_replace(NEW.context->>'issue', '[^a-zA-Z0-9\s]', '', 'g')), 
      ' '
    );
    
    -- Extract trigger types
    SELECT array_agg(t->>'type')
    INTO v_triggers
    FROM jsonb_array_elements(NEW.triggers) t;
    
    -- Insert or update pattern
    INSERT INTO escalation_patterns (
      pattern_type,
      triggers,
      severity,
      issue_keywords,
      resolution_automatic,
      resolution_action,
      resolution_time,
      success
    )
    VALUES (
      'escalation_resolution',
      v_triggers,
      NEW.severity,
      v_issue_keywords,
      NEW.status = 'auto_resolved',
      NEW.resolution->>'action',
      EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.created_at)) * 1000,
      true
    )
    ON CONFLICT ON CONSTRAINT escalation_patterns_pkey
    DO UPDATE SET
      occurrence_count = escalation_patterns.occurrence_count + 1,
      last_seen = NOW(),
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for pattern recording
CREATE TRIGGER record_escalation_pattern_trigger
  AFTER UPDATE ON escalations
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION record_escalation_pattern();

-- Sample experts data
INSERT INTO experts (id, name, email, specialties, availability, current_load, success_rate, average_resolution_time)
VALUES
  ('exp_001', 'Sarah Johnson', 'sarah.j@realign.com', ARRAY['mortgage', 'compliance', 'documentation'], 'available', 2, 0.92, 45),
  ('exp_002', 'Michael Chen', 'michael.c@realign.com', ARRAY['technical', 'integration', 'api'], 'available', 1, 0.88, 60),
  ('exp_003', 'Emily Rodriguez', 'emily.r@realign.com', ARRAY['servicer', 'submission', 'escalation'], 'available', 3, 0.95, 30),
  ('exp_004', 'David Kim', 'david.k@realign.com', ARRAY['legal', 'compliance', 'regulatory'], 'available', 0, 0.90, 90),
  ('exp_005', 'Lisa Wang', 'lisa.w@realign.com', ARRAY['customer', 'communication', 'resolution'], 'available', 1, 0.94, 25)
ON CONFLICT (email) DO NOTHING;

-- Add updated_at triggers
CREATE TRIGGER set_escalations_updated_at
  BEFORE UPDATE ON escalations
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_experts_updated_at
  BEFORE UPDATE ON experts
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_escalation_patterns_updated_at
  BEFORE UPDATE ON escalation_patterns
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();