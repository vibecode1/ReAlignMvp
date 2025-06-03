import { pgTable, uuid, text, timestamp, integer, boolean, pgEnum, foreignKey, uniqueIndex, index, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for database constraints
export const userRoleEnum = pgEnum('user_role', ['negotiator', 'seller', 'buyer', 'listing_agent', 'buyers_agent', 'escrow']);

// Phase 0 - Enhanced Data Model 1.0 Enums
export const contextRecipeTypeEnum = pgEnum('context_recipe_type', ['uba_form_completion', 'bfs_document_review', 'hardship_analysis', 'property_valuation']);
export const workflowEventTypeEnum = pgEnum('workflow_event_type', ['form_field_filled', 'document_uploaded', 'ai_recommendation_generated', 'validation_performed', 'user_interaction']);
export const workflowEventSeverityEnum = pgEnum('workflow_event_severity', ['info', 'warning', 'error', 'critical']);
export const ubaFieldStatusEnum = pgEnum('uba_field_status', ['empty', 'in_progress', 'completed', 'validated', 'requires_review']);
export const ubaDocumentTypeEnum = pgEnum('uba_document_type', ['income_verification', 'hardship_letter', 'financial_statement', 'property_documents', 'correspondence']);
export const conversationalIntakeStatusEnum = pgEnum('conversational_intake_status', ['not_started', 'in_progress', 'completed', 'validated']);

// Loan type enum for financial calculator service extensibility
export const loanTypeEnum = pgEnum('loan_type', ['Conventional', 'FHA', 'VA', 'USDA', 'Other']);

// Updated transaction phases for Tracker MVP
export const transactionPhaseEnum = pgEnum('transaction_phase', [
  'Transaction Initiated',
  'Property Listing',
  'Documentation Collection',
  'Hardship Package Submitted',
  'Offer Received',
  'Offer Submitted to Lender',
  'Initial Lender Review',
  'Property Valuation Ordered',
  'Lender Negotiations',
  'Final Approval Received',
  'In Closing',
]);
export const partyStatusEnum = pgEnum('party_status', ['pending', 'complete', 'overdue']);
export const documentStatusEnum = pgEnum('document_status', ['pending', 'complete', 'overdue']);
export const visibilityEnum = pgEnum('visibility', ['private', 'shared']);
export const deviceTokenTypeEnum = pgEnum('device_token_type', ['fcm', 'apn', 'web']);

// LOE Drafter enums
export const loeTemplateTypeEnum = pgEnum('loe_template_type', [
  'unemployment',
  'medical_hardship',
  'divorce_separation',
  'death_of_spouse',
  'income_reduction',
  'business_failure',
  'military_service',
  'natural_disaster',
  'increased_expenses',
  'other_hardship'
]);

export const loeStatusEnum = pgEnum('loe_status', [
  'draft',
  'in_review',
  'approved',
  'sent',
  'archived'
]);

// ReAlign 3.0 AI Architecture Enums
export const conversationStatusEnum = pgEnum('conversation_status', ['active', 'paused', 'completed', 'escalated']);
export const channelEnum = pgEnum('channel', ['web_chat', 'phone', 'email', 'sms']);
export const participantTypeEnum = pgEnum('participant_type', ['homeowner', 'co_borrower', 'authorized_third_party']);
export const senderTypeEnum = pgEnum('sender_type', ['user', 'ai', 'system']);
export const interactionTypeEnum = pgEnum('interaction_type', [
  'conversation', 'document_analysis', 'decision', 'recommendation', 
  'follow_up_call', 'form_fill', 'pattern_recognition'
]);
export const intelligenceTypeEnum = pgEnum('intelligence_type', [
  'requirement', 'pattern', 'success_factor', 'contact_protocol', 'timing_preference'
]);
export const patternTypeEnum = pgEnum('pattern_type', [
  'success_factor', 'failure_indicator', 'servicer_behavior', 
  'document_requirement', 'timing_optimization', 'emotional_response'
]);
export const callDirectionEnum = pgEnum('call_direction', ['outbound', 'inbound']);
export const callerTypeEnum = pgEnum('caller_type', ['ai', 'human', 'blended']);
export const callPurposeEnum = pgEnum('call_purpose', ['follow_up', 'document_request', 'status_check', 'negotiation', 'escalation']);
export const escalationReasonEnum = pgEnum('escalation_reason', [
  'emotional_distress', 'complex_situation', 'ai_uncertainty', 
  'user_request', 'compliance_required', 'technical_issue'
]);
export const escalationStatusEnum = pgEnum('escalation_status', ['pending', 'assigned', 'in_progress', 'resolved', 'cancelled']);
export const escalationPriorityEnum = pgEnum('escalation_priority', ['low', 'medium', 'high', 'critical']);
export const velocityTrendEnum = pgEnum('velocity_trend', ['accelerating', 'steady', 'slowing']);
export const promptCategoryEnum = pgEnum('prompt_category', ['conversation', 'analysis', 'generation', 'decision']);
export const riskLevelEnum = pgEnum('risk_level', ['low', 'medium', 'high']);
export const activityCategoryEnum = pgEnum('activity_category', [
  'case_management', 'document', 'communication', 'ai_interaction', 'system', 'security'
]);

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  name: text('name').notNull(),
  role: userRoleEnum('role').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Phase 0 - Task 0.2: User Context Profile MVP
export const user_context_profiles = pgTable('user_context_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  transaction_id: uuid('transaction_id').references(() => transactions.id, { onDelete: 'cascade' }),
  
  // AI Preference Settings
  preferred_ai_communication_style: text('preferred_ai_communication_style').default('professional'), // professional, friendly, technical
  ai_assistance_level: text('ai_assistance_level').default('balanced'), // minimal, balanced, comprehensive
  
  // Context Recipe Preferences 
  active_context_recipes: text('active_context_recipes').array().default([]), // Array of recipe IDs
  context_recipe_customizations: text('context_recipe_customizations'), // JSON string for custom settings
  
  // UBA Form Interaction Patterns
  uba_completion_patterns: text('uba_completion_patterns'), // JSON: tracks user's completion behaviors
  frequent_form_sections: text('frequent_form_sections').array().default([]), // Sections user works with most
  
  // Workflow Preferences
  notification_preferences: text('notification_preferences'), // JSON: email, push, in-app settings
  workflow_step_preferences: text('workflow_step_preferences'), // JSON: preferred order/skipping patterns
  
  // Learning & Adaptation Data
  ai_interaction_history: text('ai_interaction_history'), // JSON: successful interactions, feedback
  form_completion_velocity: integer('form_completion_velocity').default(0), // Fields per session average
  error_patterns: text('error_patterns'), // JSON: common mistakes for AI to prevent
  
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    user_transaction_idx: uniqueIndex('user_context_profile_user_transaction_idx').on(table.user_id, table.transaction_id),
  };
});

// Transactions table - updated for Tracker MVP
export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  property_address: text('property_address').notNull(),
  current_phase: transactionPhaseEnum('current_phase').notNull().default('Transaction Initiated'),
  negotiator_id: uuid('negotiator_id').notNull().references(() => users.id),
  welcome_email_body: text('welcome_email_body'), // Custom welcome message for email subscriptions
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Transaction phase history table - new for Tracker MVP
export const transaction_phase_history = pgTable('transaction_phase_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  transaction_id: uuid('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  phase_key: transactionPhaseEnum('phase_key').notNull(),
  set_by_negotiator_id: uuid('set_by_negotiator_id').notNull().references(() => users.id),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Transaction participants table
export const transaction_participants = pgTable('transaction_participants', {
  transaction_id: uuid('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role_in_transaction: userRoleEnum('role_in_transaction').notNull(),
  status: partyStatusEnum('status').notNull().default('pending'),
  last_action: text('last_action'),
  welcome_email_sent: boolean('welcome_email_sent').notNull().default(false), // Track email sent status
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    pk: uniqueIndex('transaction_participants_pk').on(table.transaction_id, table.user_id, table.role_in_transaction),
  };
});

// Messages table
export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  transaction_id: uuid('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  sender_id: uuid('sender_id').references(() => users.id, { onDelete: 'set null' }),
  text: text('text').notNull(),
  reply_to: uuid('reply_to'),
  is_seed_message: boolean('is_seed_message').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Document requests table - updated for Tracker MVP (role-based assignment)
export const document_requests = pgTable('document_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  transaction_id: uuid('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  document_name: text('document_name').notNull(), // Changed from doc_type to document_name for flexibility
  assigned_party_role: text('assigned_party_role').notNull(), // Role-based assignment (e.g., 'Seller', 'Buyer Agent')
  status: documentStatusEnum('status').notNull().default('pending'),
  requested_at: timestamp('requested_at').defaultNow().notNull(),
  completed_at: timestamp('completed_at'),
  due_date: timestamp('due_date'),
});

// Tracker notes table - new for Tracker MVP
export const tracker_notes = pgTable('tracker_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  transaction_id: uuid('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  note_text: text('note_text').notNull(), // Can store predefined or custom notes
  negotiator_id: uuid('negotiator_id').notNull().references(() => users.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Email subscriptions table - new for Tracker MVP
export const email_subscriptions = pgTable('email_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  transaction_id: uuid('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  party_email: text('party_email').notNull(),
  party_role: text('party_role').notNull(), // e.g., 'Agent', 'Homeowner'
  is_subscribed: boolean('is_subscribed').notNull().default(true),
  magic_link_token: text('magic_link_token').notNull().unique(), // For view-only access
  token_expires_at: timestamp('token_expires_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Uploads table
export const uploads = pgTable('uploads', {
  id: uuid('id').defaultRandom().primaryKey(),
  transaction_id: uuid('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  uploaded_by_user_id: uuid('uploaded_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  document_request_id: uuid('document_request_id').references(() => document_requests.id, { onDelete: 'set null' }),
  doc_type: text('doc_type').notNull(),
  file_name: text('file_name').notNull(),
  file_url: text('file_url').notNull(),
  content_type: text('content_type').notNull(),
  size_bytes: integer('size_bytes').notNull(),
  visibility: visibilityEnum('visibility').notNull().default('private'),
  uploaded_at: timestamp('uploaded_at').defaultNow().notNull(),
});

// User device tokens table for push notifications
export const user_device_tokens = pgTable('user_device_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  device_token: text('device_token').notNull().unique(),
  token_type: deviceTokenTypeEnum('token_type').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Phase 0 - Task 0.3: Structured Workflow Logging Engine MVP
export const workflow_events = pgTable('workflow_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Event Classification
  event_type: workflowEventTypeEnum('event_type').notNull(),
  event_severity: workflowEventSeverityEnum('event_severity').notNull().default('info'),
  event_category: text('event_category').notNull(), // 'uba_form', 'bfs_processing', 'ai_interaction', 'user_workflow'
  
  // Context Information
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  transaction_id: uuid('transaction_id').references(() => transactions.id, { onDelete: 'set null' }),
  session_id: text('session_id'), // For grouping related events
  
  // Event Details
  event_name: text('event_name').notNull(), // Specific action: 'uba_income_field_filled', 'ai_suggestion_accepted'
  event_description: text('event_description'), // Human-readable description
  event_metadata: text('event_metadata'), // JSON: detailed context, field names, values, etc.
  
  // AI & Context Recipe Tracking
  context_recipe_id: text('context_recipe_id'), // Which recipe was active
  ai_model_used: text('ai_model_used'), // 'gpt-4-turbo', 'claude-sonnet', etc.
  ai_prompt_tokens: integer('ai_prompt_tokens'),
  ai_completion_tokens: integer('ai_completion_tokens'),
  
  // Performance & Error Tracking
  execution_time_ms: integer('execution_time_ms'),
  error_details: text('error_details'), // JSON: error messages, stack traces
  success_indicator: boolean('success_indicator').default(true),
  
  // UBA-Specific Tracking
  uba_form_section: text('uba_form_section'), // Which UBA section was affected
  uba_field_id: text('uba_field_id'), // Specific UBA field identifier
  uba_validation_result: text('uba_validation_result'), // JSON: validation outcomes
  
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  
  // Indexing for performance
}, (table) => {
  return {
    user_timestamp_idx: index('workflow_events_user_timestamp_idx').on(table.user_id, table.timestamp),
    transaction_timestamp_idx: index('workflow_events_transaction_timestamp_idx').on(table.transaction_id, table.timestamp),
    event_type_timestamp_idx: index('workflow_events_type_timestamp_idx').on(table.event_type, table.timestamp),
    session_timestamp_idx: index('workflow_events_session_timestamp_idx').on(table.session_id, table.timestamp),
  };
});

// Phase 0 - Task 0.4: Data Normalization Layer - BFS/UBA Data Structure
export const uba_form_data = pgTable('uba_form_data', {
  id: uuid('id').defaultRandom().primaryKey(),
  transaction_id: uuid('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // UBA Form Structure (Based on UBA Guide annotations)
  // Section 1: Borrower Information
  borrower_name: text('borrower_name'),
  borrower_ssn: text('borrower_ssn'), // Encrypted in production
  property_address: text('property_address'),
  loan_number: text('loan_number'),
  loan_type: loanTypeEnum('loan_type').default('Conventional'), // Added for financial calculator extensibility
  
  // Section 2: Financial Information (UBA Guide conventions)
  monthly_gross_income: integer('monthly_gross_income'), // In cents
  monthly_expenses: integer('monthly_expenses'), // In cents
  liquid_assets: integer('liquid_assets'), // In cents
  total_debt: integer('total_debt'), // In cents
  
  // Section 3: Hardship Details (UBA procedural requirements)
  hardship_type: text('hardship_type'), // unemployment, medical, divorce, etc.
  hardship_date: timestamp('hardship_date'),
  hardship_description: text('hardship_description'),
  hardship_duration_expected: text('hardship_duration_expected'), // temporary, permanent, unknown
  
  // Section 4: Assistance Request (UBA Guide specific options)
  assistance_type_requested: text('assistance_type_requested').array().default([]), // modification, forbearance, short_sale
  preferred_payment_amount: integer('preferred_payment_amount'), // In cents
  
  // Form Completion Tracking
  form_completion_percentage: integer('form_completion_percentage').default(0),
  last_section_completed: text('last_section_completed'),
  validation_errors: text('validation_errors'), // JSON array of field validation issues
  
  // AI Enhancement Fields
  ai_generated_suggestions: text('ai_generated_suggestions'), // JSON: AI recommendations for form completion
  ai_confidence_scores: text('ai_confidence_scores'), // JSON: field-by-field confidence ratings
  
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    transaction_user_idx: uniqueIndex('uba_form_data_transaction_user_idx').on(table.transaction_id, table.user_id),
  };
});

export const uba_document_attachments = pgTable('uba_document_attachments', {
  id: uuid('id').defaultRandom().primaryKey(),
  uba_form_data_id: uuid('uba_form_data_id').notNull().references(() => uba_form_data.id, { onDelete: 'cascade' }),
  
  // Document Classification (UBA Guide requirements)
  document_type: ubaDocumentTypeEnum('document_type').notNull(),
  required_by_uba: boolean('required_by_uba').default(false),
  document_title: text('document_title').notNull(),
  
  // File Information
  file_url: text('file_url').notNull(),
  file_name: text('file_name').notNull(),
  file_size_bytes: integer('file_size_bytes').notNull(),
  content_type: text('content_type').notNull(),
  
  // Processing Status
  processing_status: text('processing_status').default('pending'), // pending, processed, failed
  extraction_confidence: integer('extraction_confidence'), // 0-100 for AI extraction confidence
  extracted_data: text('extracted_data'), // JSON: AI-extracted key information
  
  // UBA Compliance Validation
  uba_compliance_check: text('uba_compliance_check'), // JSON: compliance validation results
  meets_uba_requirements: boolean('meets_uba_requirements'),
  
  uploaded_at: timestamp('uploaded_at').defaultNow().notNull(),
});

export const conversational_intake_sessions = pgTable('conversational_intake_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  transaction_id: uuid('transaction_id').references(() => transactions.id, { onDelete: 'cascade' }),
  
  // Session Management
  session_status: conversationalIntakeStatusEnum('session_status').notNull().default('not_started'),
  current_step: text('current_step'), // Which part of UBA form is being discussed
  
  // Conversation Data
  conversation_history: text('conversation_history'), // JSON: complete chat history
  extracted_form_data: text('extracted_form_data'), // JSON: data extracted from conversation
  confidence_scores: text('confidence_scores'), // JSON: confidence in extracted data
  
  // AI Context
  context_recipe_used: text('context_recipe_used'),
  ai_personality_settings: text('ai_personality_settings'), // JSON: how AI should communicate
  
  // Progress Tracking
  uba_fields_completed: text('uba_fields_completed').array().default([]),
  validation_pending: text('validation_pending').array().default([]),
  
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// LOE Drafter tables
export const loe_drafts = pgTable('loe_drafts', {
  id: uuid('id').defaultRandom().primaryKey(),
  transaction_id: uuid('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  uba_form_data_id: uuid('uba_form_data_id').references(() => uba_form_data.id, { onDelete: 'set null' }),
  created_by_user_id: uuid('created_by_user_id').notNull().references(() => users.id),
  
  // Template and type information
  template_type: loeTemplateTypeEnum('template_type').notNull(),
  custom_template_name: text('custom_template_name'),
  
  // Letter content
  letter_title: text('letter_title').notNull().default('Letter of Explanation'),
  letter_content: text('letter_content').notNull(),
  
  // AI generation metadata
  ai_generated: boolean('ai_generated').default(false),
  ai_model_used: text('ai_model_used'),
  ai_prompt_used: text('ai_prompt_used'),
  ai_confidence_score: integer('ai_confidence_score'), // 0-100
  
  // Status tracking
  status: loeStatusEnum('status').notNull().default('draft'),
  current_version: integer('current_version').notNull().default(1),
  
  // Export tracking
  last_exported_at: timestamp('last_exported_at'),
  export_formats: text('export_formats').array().default([]), // ['pdf', 'docx', 'txt']
  
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    transaction_idx: index('loe_drafts_transaction_idx').on(table.transaction_id),
    status_idx: index('loe_drafts_status_idx').on(table.status),
    created_by_idx: index('loe_drafts_created_by_idx').on(table.created_by_user_id),
  };
});

export const loe_versions = pgTable('loe_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  loe_draft_id: uuid('loe_draft_id').notNull().references(() => loe_drafts.id, { onDelete: 'cascade' }),
  version_number: integer('version_number').notNull(),
  
  // Version content
  letter_content: text('letter_content').notNull(),
  change_summary: text('change_summary'),
  
  // Who made the change
  edited_by_user_id: uuid('edited_by_user_id').notNull().references(() => users.id),
  
  // AI assistance tracking for edits
  ai_assisted_edit: boolean('ai_assisted_edit').default(false),
  ai_suggestions_applied: text('ai_suggestions_applied'), // JSON array of applied suggestions
  
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    draft_idx: index('loe_versions_draft_idx').on(table.loe_draft_id),
    unique_version: uniqueIndex('loe_versions_unique_idx').on(table.loe_draft_id, table.version_number),
  };
});

export const loe_templates = pgTable('loe_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  template_type: loeTemplateTypeEnum('template_type').notNull(),
  template_name: text('template_name').notNull(),
  template_description: text('template_description'),
  
  // Template content with placeholders
  template_content: text('template_content').notNull(),
  placeholder_mappings: text('placeholder_mappings').notNull(), // JSON mapping of placeholders to UBA fields
  
  // Usage tracking
  usage_count: integer('usage_count').default(0),
  success_rate: integer('success_rate'), // 0-100 based on approved letters
  
  // Management
  is_active: boolean('is_active').default(true),
  created_by_user_id: uuid('created_by_user_id').references(() => users.id),
  
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    type_idx: index('loe_templates_type_idx').on(table.template_type),
  };
});

// ============================================================================
// REALIGN 3.0 AI ARCHITECTURE TABLES
// ============================================================================

// Case Memory System
export const case_memory = pgTable('case_memory', {
  id: uuid('id').defaultRandom().primaryKey(),
  case_id: uuid('case_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  
  // Conversation Memory
  total_conversations: integer('total_conversations').default(0),
  conversation_summaries: text('conversation_summaries'), // JSONB as text
  key_topics_discussed: text('key_topics_discussed').array().default([]),
  unresolved_questions: text('unresolved_questions'), // JSONB as text
  communication_preferences: text('communication_preferences'), // JSONB as text
  
  // Document Intelligence
  documents_collected: integer('documents_collected').default(0),
  documents_missing: text('documents_missing').array().default([]),
  extraction_confidence: text('extraction_confidence'), // JSONB as text
  data_discrepancies: text('data_discrepancies'), // JSONB as text
  document_timeline: text('document_timeline'), // JSONB as text
  
  // Financial Snapshot
  current_snapshot: text('current_snapshot'), // JSONB as text
  historical_snapshots: text('historical_snapshots'), // JSONB as text
  trend_analysis: text('trend_analysis'), // JSONB as text
  projection_models: text('projection_models'), // JSONB as text
  
  // Interaction History
  servicer_interactions: text('servicer_interactions'), // JSONB as text
  submission_history: text('submission_history'), // JSONB as text
  follow_up_activities: text('follow_up_activities'), // JSONB as text
  escalation_history: text('escalation_history'), // JSONB as text
  
  // Learning Insights
  pattern_matches: text('pattern_matches'), // JSONB as text
  success_factors: text('success_factors'), // JSONB as text
  risk_indicators: text('risk_indicators'), // JSONB as text
  next_best_actions: text('next_best_actions'), // JSONB as text
}, (table) => {
  return {
    case_unique: uniqueIndex('case_memory_case_unique').on(table.case_id),
    case_id_idx: index('idx_case_memory_case_id').on(table.case_id),
    updated_idx: index('idx_case_memory_updated').on(table.updated_at),
  };
});

// Enhanced Conversations
export const ai_conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  case_id: uuid('case_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  started_at: timestamp('started_at').defaultNow().notNull(),
  ended_at: timestamp('ended_at'),
  last_message_at: timestamp('last_message_at').defaultNow().notNull(),
  
  // Conversation State
  status: conversationStatusEnum('status').default('active'),
  channel: channelEnum('channel').default('web_chat'),
  participant_type: participantTypeEnum('participant_type').default('homeowner'),
  
  // AI Analysis
  emotional_state: text('emotional_state'), // JSONB as text
  comprehension_level: decimal('comprehension_level', { precision: 3, scale: 2 }).default('0.5'),
  urgency_score: decimal('urgency_score', { precision: 3, scale: 2 }).default('0.0'),
  topics_covered: text('topics_covered').array().default([]),
  action_items: text('action_items'), // JSONB as text
  
  // Context
  previous_conversation_id: uuid('previous_conversation_id').references(() => ai_conversations.id),
  momentum_score: decimal('momentum_score', { precision: 3, scale: 2 }).default('0.5'),
  language_preference: text('language_preference').default('en'),
  accessibility_needs: text('accessibility_needs'), // JSONB as text
  
  // Summary
  summary: text('summary'),
  ai_assessment: text('ai_assessment'), // JSONB as text
}, (table) => {
  return {
    case_id_idx: index('idx_conversations_case_id').on(table.case_id),
    started_at_idx: index('idx_conversations_started_at').on(table.started_at),
    status_idx: index('idx_conversations_status').on(table.status),
  };
});

// AI Messages
export const ai_messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversation_id: uuid('conversation_id').notNull().references(() => ai_conversations.id, { onDelete: 'cascade' }),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  
  // Message Data
  sender_type: senderTypeEnum('sender_type').notNull(),
  sender_id: uuid('sender_id').references(() => users.id),
  content: text('content').notNull(),
  
  // AI Processing
  intent_classification: text('intent_classification'), // JSONB as text
  entities_extracted: text('entities_extracted'), // JSONB as text
  emotional_indicators: text('emotional_indicators'), // JSONB as text
  action_triggers: text('action_triggers'), // JSONB as text
  requires_follow_up: boolean('requires_follow_up').default(false),
  
  // Metadata
  model_used: text('model_used'),
  processing_time_ms: integer('processing_time_ms'),
  confidence_score: decimal('confidence_score', { precision: 3, scale: 2 }),
  citations: text('citations'), // JSONB as text
}, (table) => {
  return {
    conversation_id_idx: index('idx_messages_conversation_id').on(table.conversation_id),
    timestamp_idx: index('idx_messages_timestamp').on(table.timestamp),
    sender_type_idx: index('idx_messages_sender_type').on(table.sender_type),
  };
});

// AI Interactions
export const ai_interactions = pgTable('ai_interactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  case_id: uuid('case_id').references(() => transactions.id, { onDelete: 'set null' }),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  interaction_type: interactionTypeEnum('interaction_type').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  session_id: uuid('session_id').notNull(),
  
  // AI Processing Details
  model_used: text('model_used').notNull(),
  model_version: text('model_version'),
  prompt_template_id: uuid('prompt_template_id'),
  context_provided: text('context_provided'), // JSONB as text
  tokens_used: integer('tokens_used').default(0),
  processing_time_ms: integer('processing_time_ms').default(0),
  
  // Input/Output
  user_input: text('user_input'),
  ai_output: text('ai_output').notNull(),
  confidence_score: decimal('confidence_score', { precision: 3, scale: 2 }).default('0.0'),
  alternative_outputs: text('alternative_outputs'), // JSONB as text
  decision_reasoning: text('decision_reasoning'), // JSONB as text
  
  // Quality & Learning
  user_feedback: text('user_feedback'), // 'helpful', 'not_helpful', 'escalated'
  feedback_text: text('feedback_text'),
  outcome_tracking_id: uuid('outcome_tracking_id'),
  included_in_training: boolean('included_in_training').default(false),
  
  // Compliance
  bias_check_performed: boolean('bias_check_performed').default(false),
  bias_check_results: text('bias_check_results'), // JSONB as text
  explanation_available: boolean('explanation_available').default(true),
  human_review_required: boolean('human_review_required').default(false),
}, (table) => {
  return {
    case_id_idx: index('idx_ai_interactions_case_id').on(table.case_id),
    user_id_idx: index('idx_ai_interactions_user_id').on(table.user_id),
    timestamp_idx: index('idx_ai_interactions_timestamp').on(table.timestamp),
    type_idx: index('idx_ai_interactions_type').on(table.interaction_type),
    session_idx: index('idx_ai_interactions_session').on(table.session_id),
  };
});

// Servicer Intelligence
export const servicer_intelligence = pgTable('servicer_intelligence', {
  id: uuid('id').defaultRandom().primaryKey(),
  servicer_id: uuid('servicer_id').notNull(), // References servicers table (to be created)
  intelligence_type: intelligenceTypeEnum('intelligence_type').notNull(),
  discovered_date: timestamp('discovered_date').defaultNow().notNull(),
  last_observed: timestamp('last_observed').defaultNow().notNull(),
  
  // Intelligence Data
  description: text('description').notNull(),
  evidence: text('evidence'), // JSONB as text
  confidence_score: decimal('confidence_score', { precision: 3, scale: 2 }).notNull().default('0.0'),
  occurrence_count: integer('occurrence_count').default(1),
  contradicts: text('contradicts').array().default([]), // UUID array as text array
  
  // Validation
  human_verified: boolean('human_verified').default(false),
  verified_by: uuid('verified_by').references(() => users.id),
  verification_date: timestamp('verification_date'),
  verification_notes: text('verification_notes'),
  
  // Effectiveness
  success_rate_impact: decimal('success_rate_impact', { precision: 3, scale: 2 }).default('0.0'),
  time_saved_hours: decimal('time_saved_hours', { precision: 5, scale: 2 }).default('0.0'),
  cases_helped: integer('cases_helped').default(0),
}, (table) => {
  return {
    servicer_idx: index('idx_servicer_intelligence_servicer').on(table.servicer_id),
    type_idx: index('idx_servicer_intelligence_type').on(table.intelligence_type),
    confidence_idx: index('idx_servicer_intelligence_confidence').on(table.confidence_score),
  };
});

// Learning Patterns
export const learning_patterns = pgTable('learning_patterns', {
  id: uuid('id').defaultRandom().primaryKey(),
  pattern_type: patternTypeEnum('pattern_type').notNull(),
  discovered_date: timestamp('discovered_date').defaultNow().notNull(),
  last_observed: timestamp('last_observed').defaultNow().notNull(),
  
  // Pattern Details
  description: text('description').notNull(),
  conditions: text('conditions').notNull(), // JSONB as text
  observed_outcomes: text('observed_outcomes').notNull(), // JSONB as text
  confidence_score: decimal('confidence_score', { precision: 3, scale: 2 }).notNull().default('0.0'),
  observation_count: integer('observation_count').default(1),
  
  // Evidence
  supporting_cases: text('supporting_cases').array().default([]), // UUID array
  contradicting_cases: text('contradicting_cases').array().default([]), // UUID array
  statistical_significance: decimal('statistical_significance', { precision: 3, scale: 2 }).default('0.0'),
  correlation_strength: decimal('correlation_strength', { precision: 3, scale: 2 }).default('0.0'),
  
  // Application
  recommendation_text: text('recommendation_text'),
  automated_action_possible: boolean('automated_action_possible').default(false),
  risk_level: riskLevelEnum('risk_level').default('low'),
  expected_impact: text('expected_impact'), // JSONB as text
  
  // Validation
  human_validated: boolean('human_validated').default(false),
  validation_method: text('validation_method'),
  active_experiment: boolean('active_experiment').default(false),
  superseded_by: uuid('superseded_by').references(() => learning_patterns.id),
}, (table) => {
  return {
    type_idx: index('idx_learning_patterns_type').on(table.pattern_type),
    confidence_idx: index('idx_learning_patterns_confidence').on(table.confidence_score),
    observed_idx: index('idx_learning_patterns_observed').on(table.last_observed),
  };
});

// Phone Calls
export const phone_calls = pgTable('phone_calls', {
  id: uuid('id').defaultRandom().primaryKey(),
  case_id: uuid('case_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  call_direction: callDirectionEnum('call_direction').notNull(),
  caller_type: callerTypeEnum('caller_type').notNull(),
  started_at: timestamp('started_at').defaultNow().notNull(),
  ended_at: timestamp('ended_at'),
  duration_seconds: integer('duration_seconds'),
  
  // Participants
  from_party_id: uuid('from_party_id'), // References parties table (to be created)
  to_party_id: uuid('to_party_id'), // References parties table (to be created)
  transferred_to: uuid('transferred_to'), // References parties table (to be created)
  conference_participants: text('conference_participants').array().default([]), // UUID array
  
  // Call Details
  purpose: callPurposeEnum('purpose'),
  script_template_id: uuid('script_template_id'),
  recording_url: text('recording_url'),
  transcript: text('transcript'),
  ivr_path_taken: text('ivr_path_taken'), // JSONB as text
  
  // AI Analysis
  sentiment_timeline: text('sentiment_timeline'), // JSONB as text
  key_points_discussed: text('key_points_discussed').array().default([]),
  commitments_made: text('commitments_made'), // JSONB as text
  success_indicators: text('success_indicators'), // JSONB as text
  follow_up_required: boolean('follow_up_required').default(false),
  
  // Outcomes
  objective_achieved: boolean('objective_achieved').default(false),
  information_gathered: text('information_gathered'), // JSONB as text
  next_steps: text('next_steps').array().default([]),
  escalation_triggered: boolean('escalation_triggered').default(false),
}, (table) => {
  return {
    case_id_idx: index('idx_phone_calls_case_id').on(table.case_id),
    started_at_idx: index('idx_phone_calls_started_at').on(table.started_at),
    purpose_idx: index('idx_phone_calls_purpose').on(table.purpose),
  };
});

// Escalation Queue
export const escalation_queue = pgTable('escalation_queue', {
  id: uuid('id').defaultRandom().primaryKey(),
  case_id: uuid('case_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  priority: escalationPriorityEnum('priority').notNull().default('medium'),
  status: escalationStatusEnum('status').notNull().default('pending'),
  
  // Escalation Details
  reason: escalationReasonEnum('reason').notNull(),
  trigger_description: text('trigger_description').notNull(),
  ai_attempted_actions: text('ai_attempted_actions'), // JSONB as text
  context_summary: text('context_summary'),
  recommended_actions: text('recommended_actions').array().default([]),
  
  // Assignment
  assigned_to: uuid('assigned_to').references(() => users.id),
  assigned_at: timestamp('assigned_at'),
  expertise_required: text('expertise_required').array().default([]),
  estimated_duration_minutes: integer('estimated_duration_minutes'),
  
  // Resolution
  resolved_at: timestamp('resolved_at'),
  resolution_notes: text('resolution_notes'),
  actions_taken: text('actions_taken'), // JSONB as text
  returned_to_ai: boolean('returned_to_ai').default(false),
  learning_points: text('learning_points').array().default([]),
}, (table) => {
  return {
    case_id_idx: index('idx_escalation_queue_case_id').on(table.case_id),
    status_idx: index('idx_escalation_queue_status').on(table.status),
    priority_idx: index('idx_escalation_queue_priority').on(table.priority),
    assigned_to_idx: index('idx_escalation_queue_assigned_to').on(table.assigned_to),
  };
});

// Temporal Context
export const temporal_context = pgTable('temporal_context', {
  id: uuid('id').defaultRandom().primaryKey(),
  case_id: uuid('case_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  
  // Critical Deadlines
  foreclosure_sale_date: timestamp('foreclosure_sale_date'),
  auction_date: timestamp('auction_date'),
  response_deadlines: text('response_deadlines'), // JSONB as text
  internal_deadlines: text('internal_deadlines'), // JSONB as text
  
  // Process Timing
  average_response_time_hours: decimal('average_response_time_hours', { precision: 5, scale: 2 }).default('24.0'),
  expected_completion_date: timestamp('expected_completion_date'),
  bottlenecks: text('bottlenecks'), // JSONB as text
  velocity_trend: velocityTrendEnum('velocity_trend').default('steady'),
  
  // Historical Patterns
  best_contact_times: text('best_contact_times'), // JSONB as text
  servicer_response_pattern: text('servicer_response_pattern'), // JSONB as text
  optimal_follow_up_intervals: text('optimal_follow_up_intervals'), // JSONB as text
}, (table) => {
  return {
    case_unique: uniqueIndex('temporal_context_case_unique').on(table.case_id),
  };
});

// Prompt Templates
export const prompt_templates = pgTable('prompt_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  category: promptCategoryEnum('category').notNull(),
  version: integer('version').default(1),
  created_at: timestamp('created_at').defaultNow().notNull(),
  
  // Template Content
  system_prompt: text('system_prompt').notNull(),
  user_prompt_template: text('user_prompt_template').notNull(),
  required_context: text('required_context').array().default([]),
  optional_context: text('optional_context').array().default([]),
  output_format: text('output_format'), // JSONB as text
  
  // Configuration
  model_preferences: text('model_preferences').array().default([]),
  temperature: decimal('temperature', { precision: 3, scale: 2 }).default('0.7'),
  max_tokens: integer('max_tokens').default(1000),
  other_parameters: text('other_parameters'), // JSONB as text
  safety_checks: text('safety_checks'), // JSONB as text
  
  // Performance
  usage_count: integer('usage_count').default(0),
  average_satisfaction: decimal('average_satisfaction', { precision: 3, scale: 2 }).default('0.0'),
  average_confidence: decimal('average_confidence', { precision: 3, scale: 2 }).default('0.0'),
  common_issues: text('common_issues').array().default([]),
}, (table) => {
  return {
    name_version_unique: uniqueIndex('prompt_templates_name_version_unique').on(table.name, table.version),
  };
});

// Activity Log
export const activity_log = pgTable('activity_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  case_id: uuid('case_id').references(() => transactions.id, { onDelete: 'set null' }),
  session_id: uuid('session_id'),
  
  // Activity Details
  category: activityCategoryEnum('category').notNull(),
  action: text('action').notNull(),
  entity_type: text('entity_type'),
  entity_id: uuid('entity_id'),
  changes: text('changes'), // JSONB as text
  
  // Context
  ip_address: text('ip_address'),
  user_agent: text('user_agent'),
  api_endpoint: text('api_endpoint'),
  request_id: uuid('request_id'),
  
  // Security
  risk_score: decimal('risk_score', { precision: 3, scale: 2 }).default('0.0'),
  requires_review: boolean('requires_review').default(false),
  reviewed_by: uuid('reviewed_by').references(() => users.id),
  reviewed_at: timestamp('reviewed_at'),
}, (table) => {
  return {
    timestamp_idx: index('idx_activity_log_timestamp').on(table.timestamp),
    user_id_idx: index('idx_activity_log_user_id').on(table.user_id),
    case_id_idx: index('idx_activity_log_case_id').on(table.case_id),
    category_idx: index('idx_activity_log_category').on(table.category),
    requires_review_idx: index('idx_activity_log_requires_review').on(table.requires_review),
  };
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users, {
  role: z.enum(['negotiator', 'seller', 'buyer', 'listing_agent', 'buyers_agent', 'escrow']),
}).omit({ created_at: true, updated_at: true });

export const insertTransactionSchema = createInsertSchema(transactions, {
  current_phase: z.enum([
    'Transaction Initiated',
    'Property Listing',
    'Documentation Collection',
    'Hardship Package Submitted',
    'Offer Received',
    'Offer Submitted to Lender',
    'Initial Lender Review',
    'Property Valuation Ordered',
    'Lender Negotiations',
    'Final Approval Received',
    'In Closing',
  ]),
}).omit({ id: true, created_at: true, updated_at: true });

export const insertTransactionParticipantSchema = createInsertSchema(transaction_participants, {
  role_in_transaction: z.enum(['negotiator', 'seller', 'buyer', 'listing_agent', 'buyers_agent', 'escrow']),
  status: z.enum(['pending', 'complete', 'overdue']),
}).omit({ created_at: true, updated_at: true });

export const insertMessageSchema = createInsertSchema(messages, {}).omit({ id: true, created_at: true });

export const insertDocumentRequestSchema = createInsertSchema(document_requests, {
  status: z.enum(['pending', 'complete', 'overdue']),
}).omit({ id: true, requested_at: true });

export const insertTransactionPhaseHistorySchema = createInsertSchema(transaction_phase_history, {
  phase_key: z.enum([
    'Transaction Initiated',
    'Property Listing',
    'Documentation Collection',
    'Hardship Package Submitted',
    'Offer Received',
    'Offer Submitted to Lender',
    'Initial Lender Review',
    'Property Valuation Ordered',
    'Lender Negotiations',
    'Final Approval Received',
    'In Closing',
  ]),
}).omit({ id: true, timestamp: true });

export const insertTrackerNoteSchema = createInsertSchema(tracker_notes, {}).omit({ id: true, created_at: true });

export const insertEmailSubscriptionSchema = createInsertSchema(email_subscriptions, {}).omit({ id: true, created_at: true });

export const insertUploadSchema = createInsertSchema(uploads, {
  visibility: z.enum(['private', 'shared']),
}).omit({ id: true, uploaded_at: true });

export const insertUserDeviceTokenSchema = createInsertSchema(user_device_tokens, {
  token_type: z.enum(['fcm', 'apn', 'web']),
}).omit({ id: true, created_at: true });

// Phase 0 Insert Schemas
export const insertUserContextProfileSchema = createInsertSchema(user_context_profiles, {
  ai_assistance_level: z.enum(['minimal', 'balanced', 'comprehensive']).optional(),
  preferred_ai_communication_style: z.enum(['professional', 'friendly', 'technical']).optional(),
}).omit({ id: true, created_at: true, updated_at: true });

export const insertWorkflowEventSchema = createInsertSchema(workflow_events, {
  event_type: z.enum(['form_field_filled', 'document_uploaded', 'ai_recommendation_generated', 'validation_performed', 'user_interaction']),
  event_severity: z.enum(['info', 'warning', 'error', 'critical']),
}).omit({ id: true, timestamp: true });

export const insertUbaFormDataSchema = createInsertSchema(uba_form_data, {
  assistance_type_requested: z.array(z.string()).optional(),
  uba_fields_completed: z.array(z.string()).optional(),
}).omit({ id: true, created_at: true, updated_at: true });

export const insertUbaDocumentAttachmentSchema = createInsertSchema(uba_document_attachments, {
  document_type: z.enum(['income_verification', 'hardship_letter', 'financial_statement', 'property_documents', 'correspondence']),
}).omit({ id: true, uploaded_at: true });

export const insertConversationalIntakeSessionSchema = createInsertSchema(conversational_intake_sessions, {
  session_status: z.enum(['not_started', 'in_progress', 'completed', 'validated']),
  uba_fields_completed: z.array(z.string()).optional(),
  validation_pending: z.array(z.string()).optional(),
}).omit({ id: true, created_at: true, updated_at: true });

// LOE Drafter Insert Schemas
export const insertLoeDraftSchema = createInsertSchema(loe_drafts, {
  template_type: z.enum([
    'unemployment',
    'medical_hardship',
    'divorce_separation',
    'death_of_spouse',
    'income_reduction',
    'business_failure',
    'military_service',
    'natural_disaster',
    'increased_expenses',
    'other_hardship'
  ]),
  status: z.enum(['draft', 'in_review', 'approved', 'sent', 'archived']),
  export_formats: z.array(z.string()).optional(),
}).omit({ id: true, created_at: true, updated_at: true });

export const insertLoeVersionSchema = createInsertSchema(loe_versions, {}).omit({ id: true, created_at: true });

export const insertLoeTemplateSchema = createInsertSchema(loe_templates, {
  template_type: z.enum([
    'unemployment',
    'medical_hardship',
    'divorce_separation',
    'death_of_spouse',
    'income_reduction',
    'business_failure',
    'military_service',
    'natural_disaster',
    'increased_expenses',
    'other_hardship'
  ]),
}).omit({ id: true, created_at: true, updated_at: true });

// ReAlign 3.0 AI Architecture Insert Schemas
export const insertCaseMemorySchema = createInsertSchema(case_memory, {}).omit({ id: true, created_at: true, updated_at: true });

export const insertAIConversationSchema = createInsertSchema(ai_conversations, {
  status: z.enum(['active', 'paused', 'completed', 'escalated']).optional(),
  channel: z.enum(['web_chat', 'phone', 'email', 'sms']).optional(),
  participant_type: z.enum(['homeowner', 'co_borrower', 'authorized_third_party']).optional(),
}).omit({ id: true, started_at: true, last_message_at: true });

export const insertAIMessageSchema = createInsertSchema(ai_messages, {
  sender_type: z.enum(['user', 'ai', 'system']),
}).omit({ id: true, timestamp: true });

export const insertAIInteractionSchema = createInsertSchema(ai_interactions, {
  interaction_type: z.enum(['conversation', 'document_analysis', 'decision', 'recommendation', 'follow_up_call', 'form_fill', 'pattern_recognition']),
  user_feedback: z.enum(['helpful', 'not_helpful', 'escalated']).optional(),
}).omit({ id: true, timestamp: true });

export const insertServicerIntelligenceSchema = createInsertSchema(servicer_intelligence, {
  intelligence_type: z.enum(['requirement', 'pattern', 'success_factor', 'contact_protocol', 'timing_preference']),
}).omit({ id: true, discovered_date: true, last_observed: true });

export const insertLearningPatternSchema = createInsertSchema(learning_patterns, {
  pattern_type: z.enum(['success_factor', 'failure_indicator', 'servicer_behavior', 'document_requirement', 'timing_optimization', 'emotional_response']),
  risk_level: z.enum(['low', 'medium', 'high']).optional(),
}).omit({ id: true, discovered_date: true, last_observed: true });

export const insertPhoneCallSchema = createInsertSchema(phone_calls, {
  call_direction: z.enum(['outbound', 'inbound']),
  caller_type: z.enum(['ai', 'human', 'blended']),
  purpose: z.enum(['follow_up', 'document_request', 'status_check', 'negotiation', 'escalation']).optional(),
}).omit({ id: true, started_at: true });

export const insertEscalationQueueSchema = createInsertSchema(escalation_queue, {
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['pending', 'assigned', 'in_progress', 'resolved', 'cancelled']).optional(),
  reason: z.enum(['emotional_distress', 'complex_situation', 'ai_uncertainty', 'user_request', 'compliance_required', 'technical_issue']),
}).omit({ id: true, created_at: true });

export const insertTemporalContextSchema = createInsertSchema(temporal_context, {
  velocity_trend: z.enum(['accelerating', 'steady', 'slowing']).optional(),
}).omit({ id: true, updated_at: true });

export const insertPromptTemplateSchema = createInsertSchema(prompt_templates, {
  category: z.enum(['conversation', 'analysis', 'generation', 'decision']),
}).omit({ id: true, created_at: true });

export const insertActivityLogSchema = createInsertSchema(activity_log, {
  category: z.enum(['case_management', 'document', 'communication', 'ai_interaction', 'system', 'security']),
}).omit({ id: true, timestamp: true });

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type TransactionParticipant = typeof transaction_participants.$inferSelect;
export type InsertTransactionParticipant = z.infer<typeof insertTransactionParticipantSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type DocumentRequest = typeof document_requests.$inferSelect;
export type InsertDocumentRequest = z.infer<typeof insertDocumentRequestSchema>;

export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = z.infer<typeof insertUploadSchema>;

export type UserDeviceToken = typeof user_device_tokens.$inferSelect;
export type InsertUserDeviceToken = z.infer<typeof insertUserDeviceTokenSchema>;

// New types for Tracker MVP
export type TransactionPhaseHistory = typeof transaction_phase_history.$inferSelect;
export type InsertTransactionPhaseHistory = z.infer<typeof insertTransactionPhaseHistorySchema>;

export type TrackerNote = typeof tracker_notes.$inferSelect;
export type InsertTrackerNote = z.infer<typeof insertTrackerNoteSchema>;

export type EmailSubscription = typeof email_subscriptions.$inferSelect;
export type InsertEmailSubscription = z.infer<typeof insertEmailSubscriptionSchema>;

// Phase 0 - Enhanced Data Model 1.0 Types
export type UserContextProfile = typeof user_context_profiles.$inferSelect;
export type InsertUserContextProfile = z.infer<typeof insertUserContextProfileSchema>;

export type WorkflowEvent = typeof workflow_events.$inferSelect;
export type InsertWorkflowEvent = z.infer<typeof insertWorkflowEventSchema>;

export type UbaFormData = typeof uba_form_data.$inferSelect;
export type InsertUbaFormData = z.infer<typeof insertUbaFormDataSchema>;

export type UbaDocumentAttachment = typeof uba_document_attachments.$inferSelect;
export type InsertUbaDocumentAttachment = z.infer<typeof insertUbaDocumentAttachmentSchema>;

export type ConversationalIntakeSession = typeof conversational_intake_sessions.$inferSelect;
export type InsertConversationalIntakeSession = z.infer<typeof insertConversationalIntakeSessionSchema>;

// LOE Drafter Types
export type LoeDraft = typeof loe_drafts.$inferSelect;
export type InsertLoeDraft = z.infer<typeof insertLoeDraftSchema>;

export type LoeVersion = typeof loe_versions.$inferSelect;
export type InsertLoeVersion = z.infer<typeof insertLoeVersionSchema>;

export type LoeTemplate = typeof loe_templates.$inferSelect;
export type InsertLoeTemplate = z.infer<typeof insertLoeTemplateSchema>;

// ReAlign 3.0 AI Architecture Types
export type CaseMemory = typeof case_memory.$inferSelect;
export type InsertCaseMemory = z.infer<typeof insertCaseMemorySchema>;

export type AIConversation = typeof ai_conversations.$inferSelect;
export type InsertAIConversation = z.infer<typeof insertAIConversationSchema>;

export type AIMessage = typeof ai_messages.$inferSelect;
export type InsertAIMessage = z.infer<typeof insertAIMessageSchema>;

export type AIInteraction = typeof ai_interactions.$inferSelect;
export type InsertAIInteraction = z.infer<typeof insertAIInteractionSchema>;

export type ServicerIntelligence = typeof servicer_intelligence.$inferSelect;
export type InsertServicerIntelligence = z.infer<typeof insertServicerIntelligenceSchema>;

export type LearningPattern = typeof learning_patterns.$inferSelect;
export type InsertLearningPattern = z.infer<typeof insertLearningPatternSchema>;

export type PhoneCall = typeof phone_calls.$inferSelect;
export type InsertPhoneCall = z.infer<typeof insertPhoneCallSchema>;

export type EscalationQueue = typeof escalation_queue.$inferSelect;
export type InsertEscalationQueue = z.infer<typeof insertEscalationQueueSchema>;

export type TemporalContext = typeof temporal_context.$inferSelect;
export type InsertTemporalContext = z.infer<typeof insertTemporalContextSchema>;

export type PromptTemplate = typeof prompt_templates.$inferSelect;
export type InsertPromptTemplate = z.infer<typeof insertPromptTemplateSchema>;

export type ActivityLog = typeof activity_log.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;