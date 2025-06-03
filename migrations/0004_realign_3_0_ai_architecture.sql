-- Migration: ReAlign 3.0 AI Architecture
-- Description: Complete transformation to AI-driven loss mitigation platform
-- Version: 3.0
-- Date: June 2, 2025

BEGIN;

-- ============================================================================
-- CASE MEMORY SYSTEM
-- ============================================================================

-- Complete case memory system for AI context awareness
CREATE TABLE case_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Conversation Memory
  total_conversations INTEGER DEFAULT 0,
  conversation_summaries JSONB DEFAULT '[]'::jsonb,
  key_topics_discussed TEXT[] DEFAULT '{}',
  unresolved_questions JSONB DEFAULT '[]'::jsonb,
  communication_preferences JSONB DEFAULT '{}'::jsonb,
  
  -- Document Intelligence
  documents_collected INTEGER DEFAULT 0,
  documents_missing TEXT[] DEFAULT '{}',
  extraction_confidence JSONB DEFAULT '{}'::jsonb,
  data_discrepancies JSONB DEFAULT '[]'::jsonb,
  document_timeline JSONB DEFAULT '[]'::jsonb,
  
  -- Financial Snapshot
  current_snapshot JSONB,
  historical_snapshots JSONB[] DEFAULT '{}',
  trend_analysis JSONB DEFAULT '{}'::jsonb,
  projection_models JSONB DEFAULT '{}'::jsonb,
  
  -- Interaction History
  servicer_interactions JSONB DEFAULT '[]'::jsonb,
  submission_history JSONB DEFAULT '[]'::jsonb,
  follow_up_activities JSONB DEFAULT '[]'::jsonb,
  escalation_history JSONB DEFAULT '[]'::jsonb,
  
  -- Learning Insights
  pattern_matches JSONB DEFAULT '[]'::jsonb,
  success_factors JSONB DEFAULT '[]'::jsonb,
  risk_indicators JSONB DEFAULT '[]'::jsonb,
  next_best_actions JSONB DEFAULT '[]'::jsonb,
  
  CONSTRAINT case_memory_case_unique UNIQUE (case_id)
);

-- ============================================================================
-- CONVERSATION SYSTEM
-- ============================================================================

-- Enhanced conversation tracking with AI context
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Conversation State
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'escalated')),
  channel VARCHAR(20) DEFAULT 'web_chat' CHECK (channel IN ('web_chat', 'phone', 'email', 'sms')),
  participant_type VARCHAR(30) DEFAULT 'homeowner' CHECK (participant_type IN ('homeowner', 'co_borrower', 'authorized_third_party')),
  
  -- AI Analysis
  emotional_state JSONB DEFAULT '{}'::jsonb,
  comprehension_level DECIMAL(3,2) DEFAULT 0.5,
  urgency_score DECIMAL(3,2) DEFAULT 0.0,
  topics_covered TEXT[] DEFAULT '{}',
  action_items JSONB DEFAULT '[]'::jsonb,
  
  -- Context
  previous_conversation_id UUID REFERENCES conversations(id),
  momentum_score DECIMAL(3,2) DEFAULT 0.5,
  language_preference VARCHAR(10) DEFAULT 'en',
  accessibility_needs JSONB DEFAULT '{}'::jsonb,
  
  -- Summary
  summary TEXT,
  ai_assessment JSONB DEFAULT '{}'::jsonb
);

-- Individual messages with AI processing
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Message Data
  sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'ai', 'system')),
  sender_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  
  -- AI Processing
  intent_classification JSONB DEFAULT '{}'::jsonb,
  entities_extracted JSONB DEFAULT '{}'::jsonb,
  emotional_indicators JSONB DEFAULT '{}'::jsonb,
  action_triggers JSONB DEFAULT '[]'::jsonb,
  requires_follow_up BOOLEAN DEFAULT false,
  
  -- Metadata
  model_used VARCHAR(50),
  processing_time_ms INTEGER,
  confidence_score DECIMAL(3,2),
  citations JSONB DEFAULT '[]'::jsonb
);

-- ============================================================================
-- AI INTERACTION TRACKING
-- ============================================================================

-- Comprehensive AI interaction logging
CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN (
    'conversation', 'document_analysis', 'decision', 'recommendation', 
    'follow_up_call', 'form_fill', 'pattern_recognition'
  )),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  session_id UUID NOT NULL,
  
  -- AI Processing Details
  model_used VARCHAR(100) NOT NULL,
  model_version VARCHAR(50),
  prompt_template_id UUID,
  context_provided JSONB DEFAULT '{}'::jsonb,
  tokens_used INTEGER DEFAULT 0,
  processing_time_ms INTEGER DEFAULT 0,
  
  -- Input/Output
  user_input TEXT,
  ai_output TEXT NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.0,
  alternative_outputs JSONB DEFAULT '[]'::jsonb,
  decision_reasoning JSONB DEFAULT '{}'::jsonb,
  
  -- Quality & Learning
  user_feedback VARCHAR(20) CHECK (user_feedback IN ('helpful', 'not_helpful', 'escalated')),
  feedback_text TEXT,
  outcome_tracking_id UUID,
  included_in_training BOOLEAN DEFAULT false,
  
  -- Compliance
  bias_check_performed BOOLEAN DEFAULT false,
  bias_check_results JSONB DEFAULT '{}'::jsonb,
  explanation_available BOOLEAN DEFAULT true,
  human_review_required BOOLEAN DEFAULT false
);

-- ============================================================================
-- SERVICER INTELLIGENCE SYSTEM
-- ============================================================================

-- Enhanced servicer profiles with AI learning
ALTER TABLE servicers ADD COLUMN IF NOT EXISTS intelligence_last_updated TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE servicers ADD COLUMN IF NOT EXISTS success_metrics JSONB DEFAULT '{}'::jsonb;
ALTER TABLE servicers ADD COLUMN IF NOT EXISTS communication_patterns JSONB DEFAULT '{}'::jsonb;

-- Dynamic servicer intelligence learning
CREATE TABLE servicer_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servicer_id UUID NOT NULL REFERENCES servicers(id) ON DELETE CASCADE,
  intelligence_type VARCHAR(50) NOT NULL CHECK (intelligence_type IN (
    'requirement', 'pattern', 'success_factor', 'contact_protocol', 'timing_preference'
  )),
  discovered_date TIMESTAMPTZ DEFAULT NOW(),
  last_observed TIMESTAMPTZ DEFAULT NOW(),
  
  -- Intelligence Data
  description TEXT NOT NULL,
  evidence JSONB DEFAULT '[]'::jsonb,
  confidence_score DECIMAL(3,2) NOT NULL DEFAULT 0.0,
  occurrence_count INTEGER DEFAULT 1,
  contradicts UUID[] DEFAULT '{}',
  
  -- Validation
  human_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES users(id),
  verification_date TIMESTAMPTZ,
  verification_notes TEXT,
  
  -- Effectiveness
  success_rate_impact DECIMAL(3,2) DEFAULT 0.0,
  time_saved_hours DECIMAL(5,2) DEFAULT 0.0,
  cases_helped INTEGER DEFAULT 0
);

-- ============================================================================
-- LEARNING AND PATTERN SYSTEM
-- ============================================================================

-- System-wide learning patterns
CREATE TABLE learning_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type VARCHAR(50) NOT NULL CHECK (pattern_type IN (
    'success_factor', 'failure_indicator', 'servicer_behavior', 
    'document_requirement', 'timing_optimization', 'emotional_response'
  )),
  discovered_date TIMESTAMPTZ DEFAULT NOW(),
  last_observed TIMESTAMPTZ DEFAULT NOW(),
  
  -- Pattern Details
  description TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  observed_outcomes JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence_score DECIMAL(3,2) NOT NULL DEFAULT 0.0,
  observation_count INTEGER DEFAULT 1,
  
  -- Evidence
  supporting_cases UUID[] DEFAULT '{}',
  contradicting_cases UUID[] DEFAULT '{}',
  statistical_significance DECIMAL(3,2) DEFAULT 0.0,
  correlation_strength DECIMAL(3,2) DEFAULT 0.0,
  
  -- Application
  recommendation_text TEXT,
  automated_action_possible BOOLEAN DEFAULT false,
  risk_level VARCHAR(10) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  expected_impact JSONB DEFAULT '{}'::jsonb,
  
  -- Validation
  human_validated BOOLEAN DEFAULT false,
  validation_method TEXT,
  active_experiment BOOLEAN DEFAULT false,
  superseded_by UUID REFERENCES learning_patterns(id)
);

-- ============================================================================
-- PHONE CALL SYSTEM
-- ============================================================================

-- AI-driven phone call tracking
CREATE TABLE phone_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  call_direction VARCHAR(10) NOT NULL CHECK (call_direction IN ('outbound', 'inbound')),
  caller_type VARCHAR(10) NOT NULL CHECK (caller_type IN ('ai', 'human', 'blended')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Participants
  from_party_id UUID REFERENCES parties(id),
  to_party_id UUID REFERENCES parties(id),
  transferred_to UUID REFERENCES parties(id),
  conference_participants UUID[] DEFAULT '{}',
  
  -- Call Details
  purpose VARCHAR(20) CHECK (purpose IN ('follow_up', 'document_request', 'status_check', 'negotiation', 'escalation')),
  script_template_id UUID,
  recording_url TEXT,
  transcript TEXT,
  ivr_path_taken JSONB DEFAULT '[]'::jsonb,
  
  -- AI Analysis
  sentiment_timeline JSONB DEFAULT '[]'::jsonb,
  key_points_discussed TEXT[] DEFAULT '{}',
  commitments_made JSONB DEFAULT '[]'::jsonb,
  success_indicators JSONB DEFAULT '[]'::jsonb,
  follow_up_required BOOLEAN DEFAULT false,
  
  -- Outcomes
  objective_achieved BOOLEAN DEFAULT false,
  information_gathered JSONB DEFAULT '{}'::jsonb,
  next_steps TEXT[] DEFAULT '{}',
  escalation_triggered BOOLEAN DEFAULT false
);

-- ============================================================================
-- ESCALATION SYSTEM
-- ============================================================================

-- Human intervention and escalation tracking
CREATE TABLE escalation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'resolved', 'cancelled')),
  
  -- Escalation Details
  reason VARCHAR(30) NOT NULL CHECK (reason IN (
    'emotional_distress', 'complex_situation', 'ai_uncertainty', 
    'user_request', 'compliance_required', 'technical_issue'
  )),
  trigger_description TEXT NOT NULL,
  ai_attempted_actions JSONB DEFAULT '[]'::jsonb,
  context_summary TEXT,
  recommended_actions TEXT[] DEFAULT '{}',
  
  -- Assignment
  assigned_to UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ,
  expertise_required TEXT[] DEFAULT '{}',
  estimated_duration_minutes INTEGER,
  
  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  actions_taken JSONB DEFAULT '[]'::jsonb,
  returned_to_ai BOOLEAN DEFAULT false,
  learning_points TEXT[] DEFAULT '{}'
);

-- ============================================================================
-- TEMPORAL CONTEXT TRACKING
-- ============================================================================

-- Time-sensitive case context
CREATE TABLE temporal_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Critical Deadlines
  foreclosure_sale_date TIMESTAMPTZ,
  auction_date TIMESTAMPTZ,
  response_deadlines JSONB DEFAULT '{}'::jsonb,
  internal_deadlines JSONB DEFAULT '{}'::jsonb,
  
  -- Process Timing
  average_response_time_hours DECIMAL(5,2) DEFAULT 24.0,
  expected_completion_date TIMESTAMPTZ,
  bottlenecks JSONB DEFAULT '[]'::jsonb,
  velocity_trend VARCHAR(15) DEFAULT 'steady' CHECK (velocity_trend IN ('accelerating', 'steady', 'slowing')),
  
  -- Historical Patterns
  best_contact_times JSONB DEFAULT '{}'::jsonb,
  servicer_response_pattern JSONB DEFAULT '{}'::jsonb,
  optimal_follow_up_intervals JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT temporal_context_case_unique UNIQUE (case_id)
);

-- ============================================================================
-- PROMPT TEMPLATES FOR AI
-- ============================================================================

-- Reusable AI prompt templates
CREATE TABLE prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(20) NOT NULL CHECK (category IN ('conversation', 'analysis', 'generation', 'decision')),
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Template Content
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  required_context TEXT[] DEFAULT '{}',
  optional_context TEXT[] DEFAULT '{}',
  output_format JSONB DEFAULT '{}'::jsonb,
  
  -- Configuration
  model_preferences TEXT[] DEFAULT '{}',
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  other_parameters JSONB DEFAULT '{}'::jsonb,
  safety_checks JSONB DEFAULT '[]'::jsonb,
  
  -- Performance
  usage_count INTEGER DEFAULT 0,
  average_satisfaction DECIMAL(3,2) DEFAULT 0.0,
  average_confidence DECIMAL(3,2) DEFAULT 0.0,
  common_issues TEXT[] DEFAULT '{}',
  
  CONSTRAINT prompt_templates_name_version_unique UNIQUE (name, version)
);

-- ============================================================================
-- ENHANCED DOCUMENT PROCESSING
-- ============================================================================

-- Add AI processing fields to existing documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS processing_model VARCHAR(100);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS processing_confidence DECIMAL(3,2) DEFAULT 0.0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_extracted_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS validation_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS extraction_warnings TEXT[] DEFAULT '{}';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS requires_human_review BOOLEAN DEFAULT false;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS cross_reference_results JSONB DEFAULT '{}'::jsonb;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS servicer_requirements_met BOOLEAN DEFAULT false;

-- ============================================================================
-- ACTIVITY LOGGING FOR AI AUDIT
-- ============================================================================

-- Comprehensive audit trail for all system activities
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  case_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  session_id UUID,
  
  -- Activity Details
  category VARCHAR(20) NOT NULL CHECK (category IN (
    'case_management', 'document', 'communication', 'ai_interaction', 'system', 'security'
  )),
  action TEXT NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  changes JSONB DEFAULT '{}'::jsonb,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  api_endpoint TEXT,
  request_id UUID,
  
  -- Security
  risk_score DECIMAL(3,2) DEFAULT 0.0,
  requires_review BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Case Memory Indexes
CREATE INDEX idx_case_memory_case_id ON case_memory(case_id);
CREATE INDEX idx_case_memory_updated ON case_memory(updated_at);

-- Conversation Indexes
CREATE INDEX idx_conversations_case_id ON conversations(case_id);
CREATE INDEX idx_conversations_started_at ON conversations(started_at DESC);
CREATE INDEX idx_conversations_status ON conversations(status) WHERE status IN ('active', 'paused');

-- Message Indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX idx_messages_sender_type ON messages(sender_type);

-- AI Interaction Indexes
CREATE INDEX idx_ai_interactions_case_id ON ai_interactions(case_id);
CREATE INDEX idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_timestamp ON ai_interactions(timestamp DESC);
CREATE INDEX idx_ai_interactions_type ON ai_interactions(interaction_type);
CREATE INDEX idx_ai_interactions_session ON ai_interactions(session_id);

-- Servicer Intelligence Indexes
CREATE INDEX idx_servicer_intelligence_servicer ON servicer_intelligence(servicer_id);
CREATE INDEX idx_servicer_intelligence_type ON servicer_intelligence(intelligence_type);
CREATE INDEX idx_servicer_intelligence_confidence ON servicer_intelligence(confidence_score DESC);

-- Learning Pattern Indexes
CREATE INDEX idx_learning_patterns_type ON learning_patterns(pattern_type);
CREATE INDEX idx_learning_patterns_confidence ON learning_patterns(confidence_score DESC);
CREATE INDEX idx_learning_patterns_observed ON learning_patterns(last_observed DESC);

-- Phone Call Indexes
CREATE INDEX idx_phone_calls_case_id ON phone_calls(case_id);
CREATE INDEX idx_phone_calls_started_at ON phone_calls(started_at DESC);
CREATE INDEX idx_phone_calls_purpose ON phone_calls(purpose);

-- Escalation Indexes
CREATE INDEX idx_escalation_queue_case_id ON escalation_queue(case_id);
CREATE INDEX idx_escalation_queue_status ON escalation_queue(status) WHERE status IN ('pending', 'assigned', 'in_progress');
CREATE INDEX idx_escalation_queue_priority ON escalation_queue(priority);
CREATE INDEX idx_escalation_queue_assigned_to ON escalation_queue(assigned_to) WHERE assigned_to IS NOT NULL;

-- Activity Log Indexes
CREATE INDEX idx_activity_log_timestamp ON activity_log(timestamp DESC);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_case_id ON activity_log(case_id);
CREATE INDEX idx_activity_log_category ON activity_log(category);
CREATE INDEX idx_activity_log_requires_review ON activity_log(requires_review) WHERE requires_review = true;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update case_memory.updated_at on any change
CREATE OR REPLACE FUNCTION update_case_memory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Log the update for debugging
    INSERT INTO activity_log (
        user_id, case_id, category, action, entity_type, entity_id, changes
    ) VALUES (
        COALESCE(NEW.case_id, OLD.case_id),
        NEW.case_id,
        'case_management',
        TG_OP,
        'case_memory',
        NEW.id,
        jsonb_build_object('changes', row_to_json(NEW))
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER case_memory_updated_at_trigger
    BEFORE UPDATE ON case_memory
    FOR EACH ROW
    EXECUTE FUNCTION update_case_memory_timestamp();

-- Update conversations.last_message_at when new message added
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET last_message_at = NEW.timestamp 
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_last_message_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- Auto-increment pattern observation counts
CREATE OR REPLACE FUNCTION increment_pattern_observation()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE learning_patterns
    SET 
        observation_count = observation_count + 1,
        last_observed = NOW()
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA POPULATION
-- ============================================================================

-- Insert default prompt templates
INSERT INTO prompt_templates (name, description, category, system_prompt, user_prompt_template, model_preferences) VALUES
(
    'homeowner_conversation',
    'Primary template for homeowner conversations with empathy and expertise',
    'conversation',
    'You are a compassionate and knowledgeable loss mitigation specialist helping homeowners navigate their mortgage difficulties. Always respond with empathy, clear explanations, and actionable next steps. Remember all previous context and maintain conversation continuity.',
    'User says: {user_message}\n\nCase context: {case_context}\nConversation history: {conversation_history}\nEmotional state: {emotional_state}\n\nRespond with empathy and helpful guidance.',
    ARRAY['gpt-4-turbo', 'claude-3-sonnet']
),
(
    'document_analysis',
    'Template for analyzing uploaded documents and extracting key information',
    'analysis',
    'You are an expert document analyst specializing in mortgage and financial documents. Extract all relevant information accurately and identify any missing or concerning elements.',
    'Analyze this {document_type} document:\n\nDocument content: {document_content}\nRequired fields: {required_fields}\nServicer requirements: {servicer_requirements}\n\nProvide detailed extraction and validation.',
    ARRAY['gpt-4-vision', 'claude-3-opus']
),
(
    'escalation_decision',
    'Template for determining when to escalate to human intervention',
    'decision',
    'You are an escalation decision engine. Analyze the situation and determine if human intervention is needed based on complexity, emotional distress, compliance requirements, or AI uncertainty.',
    'Situation: {situation_description}\nUser emotional state: {emotional_state}\nAI confidence: {ai_confidence}\nCase complexity: {complexity_factors}\n\nDetermine if escalation is needed and provide reasoning.',
    ARRAY['claude-3-opus', 'gpt-4-turbo']
);

-- Insert initial learning patterns
INSERT INTO learning_patterns (pattern_type, description, conditions, observed_outcomes, confidence_score) VALUES
(
    'success_factor',
    'Complete documentation submission increases approval rate',
    '{"documents_complete": true, "submission_method": "api"}',
    '{"approval_rate": 0.85, "processing_time_days": 7}',
    0.9
),
(
    'timing_optimization',
    'Tuesday-Thursday submissions have faster processing times',
    '{"submission_day": ["tuesday", "wednesday", "thursday"]}',
    '{"average_processing_days": 5, "response_rate": 0.95}',
    0.8
),
(
    'emotional_response',
    'Empathetic language reduces user stress and improves engagement',
    '{"empathy_score": ">0.8", "response_time": "<2_hours"}',
    '{"user_satisfaction": 0.92, "completion_rate": 0.88}',
    0.85
);

COMMIT;

-- Add comments for documentation
COMMENT ON TABLE case_memory IS 'Complete memory system for each case, enabling AI to maintain full context across all interactions';
COMMENT ON TABLE conversations IS 'Enhanced conversation tracking with AI emotional intelligence and context awareness';
COMMENT ON TABLE messages IS 'Individual messages with comprehensive AI processing and analysis';
COMMENT ON TABLE ai_interactions IS 'Complete audit trail of all AI activities for learning and debugging';
COMMENT ON TABLE servicer_intelligence IS 'Dynamic learning system that adapts to each servicer''s unique requirements';
COMMENT ON TABLE learning_patterns IS 'System-wide pattern recognition for continuous improvement';
COMMENT ON TABLE phone_calls IS 'AI-driven phone call tracking with sentiment analysis and outcome monitoring';
COMMENT ON TABLE escalation_queue IS 'Intelligent escalation system for human intervention when needed';
COMMENT ON TABLE temporal_context IS 'Time-sensitive case context tracking for deadline management';
COMMENT ON TABLE prompt_templates IS 'Reusable AI prompt templates for consistent high-quality interactions';
COMMENT ON TABLE activity_log IS 'Comprehensive audit trail for compliance and debugging';