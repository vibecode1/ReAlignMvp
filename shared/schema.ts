import { pgTable, uuid, text, timestamp, integer, boolean, pgEnum, foreignKey, uniqueIndex, index } from "drizzle-orm/pg-core";
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