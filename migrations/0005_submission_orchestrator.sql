-- Submission Orchestrator Tables
-- This migration adds support for the intelligent submission engine

-- Submission tasks table
CREATE TABLE IF NOT EXISTS submission_tasks (
  id TEXT PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  servicer_id TEXT NOT NULL,
  document_type TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'escalated')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER NOT NULL,
  submission_channel TEXT CHECK (submission_channel IN ('api', 'portal', 'email', 'manual')),
  confirmation_number TEXT,
  metadata JSONB DEFAULT '{}',
  error_history JSONB DEFAULT '[]',
  last_attempt TIMESTAMPTZ,
  next_retry TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_submission_tasks_transaction_id ON submission_tasks(transaction_id);
CREATE INDEX idx_submission_tasks_servicer_id ON submission_tasks(servicer_id);
CREATE INDEX idx_submission_tasks_status ON submission_tasks(status);
CREATE INDEX idx_submission_tasks_priority_status ON submission_tasks(priority, status);
CREATE INDEX idx_submission_tasks_next_retry ON submission_tasks(next_retry) WHERE status = 'pending';

-- Submission performance metrics
CREATE TABLE IF NOT EXISTS submission_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servicer_id TEXT NOT NULL,
  document_type TEXT NOT NULL,
  submission_channel TEXT NOT NULL,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  total_duration_ms BIGINT DEFAULT 0,
  average_retry_count DECIMAL(5,2) DEFAULT 0,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(servicer_id, document_type, submission_channel)
);

-- Circuit breaker states
CREATE TABLE IF NOT EXISTS circuit_breaker_states (
  servicer_id TEXT PRIMARY KEY,
  state TEXT NOT NULL CHECK (state IN ('closed', 'open', 'half-open')),
  failure_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  last_failure_time TIMESTAMPTZ,
  last_state_change TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submission patterns for machine learning
CREATE TABLE IF NOT EXISTS submission_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servicer_id TEXT NOT NULL,
  pattern_type TEXT NOT NULL,
  pattern_data JSONB NOT NULL,
  occurrence_count INTEGER DEFAULT 1,
  success_rate DECIMAL(5,2),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE submission_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuit_breaker_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_patterns ENABLE ROW LEVEL SECURITY;

-- Policy for submission_tasks: Users can see tasks for their transactions
CREATE POLICY "Users can view their submission tasks" ON submission_tasks
  FOR SELECT
  USING (
    transaction_id IN (
      SELECT t.id FROM transactions t
      JOIN transaction_parties tp ON t.id = tp.transaction_id
      WHERE tp.user_id = auth.uid()
    )
  );

-- Policy for service users to manage all submission tasks
CREATE POLICY "Service users can manage all submission tasks" ON submission_tasks
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Policies for metrics and circuit breakers (read-only for authenticated users)
CREATE POLICY "Authenticated users can view submission metrics" ON submission_metrics
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service users can manage submission metrics" ON submission_metrics
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Authenticated users can view circuit breaker states" ON circuit_breaker_states
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service users can manage circuit breaker states" ON circuit_breaker_states
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service users can manage submission patterns" ON submission_patterns
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to update submission metrics
CREATE OR REPLACE FUNCTION update_submission_metrics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    INSERT INTO submission_metrics (
      servicer_id, 
      document_type, 
      submission_channel,
      success_count,
      total_duration_ms,
      last_success_at
    )
    VALUES (
      NEW.servicer_id,
      NEW.document_type,
      COALESCE(NEW.submission_channel, 'unknown'),
      1,
      EXTRACT(EPOCH FROM (NEW.submitted_at - NEW.created_at)) * 1000,
      NEW.submitted_at
    )
    ON CONFLICT (servicer_id, document_type, submission_channel)
    DO UPDATE SET
      success_count = submission_metrics.success_count + 1,
      total_duration_ms = submission_metrics.total_duration_ms + EXCLUDED.total_duration_ms,
      last_success_at = EXCLUDED.last_success_at,
      updated_at = NOW();
      
  ELSIF NEW.status = 'failed' AND OLD.status != 'failed' THEN
    INSERT INTO submission_metrics (
      servicer_id, 
      document_type, 
      submission_channel,
      failure_count,
      average_retry_count,
      last_failure_at
    )
    VALUES (
      NEW.servicer_id,
      NEW.document_type,
      COALESCE(NEW.submission_channel, 'unknown'),
      1,
      NEW.retry_count,
      NOW()
    )
    ON CONFLICT (servicer_id, document_type, submission_channel)
    DO UPDATE SET
      failure_count = submission_metrics.failure_count + 1,
      average_retry_count = (
        (submission_metrics.average_retry_count * submission_metrics.failure_count + NEW.retry_count) / 
        (submission_metrics.failure_count + 1)
      ),
      last_failure_at = NOW(),
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for metrics updates
CREATE TRIGGER update_submission_metrics_trigger
  AFTER UPDATE ON submission_tasks
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_submission_metrics();

-- Add updated_at triggers
CREATE TRIGGER set_submission_tasks_updated_at
  BEFORE UPDATE ON submission_tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_submission_metrics_updated_at
  BEFORE UPDATE ON submission_metrics
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_circuit_breaker_states_updated_at
  BEFORE UPDATE ON circuit_breaker_states
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_submission_patterns_updated_at
  BEFORE UPDATE ON submission_patterns
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();