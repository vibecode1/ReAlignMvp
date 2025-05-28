CREATE TYPE "public"."context_recipe_type" AS ENUM('uba_form_completion', 'bfs_document_review', 'hardship_analysis', 'property_valuation');--> statement-breakpoint
CREATE TYPE "public"."conversational_intake_status" AS ENUM('not_started', 'in_progress', 'completed', 'validated');--> statement-breakpoint
CREATE TYPE "public"."device_token_type" AS ENUM('fcm', 'apn', 'web');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('pending', 'complete', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."party_status" AS ENUM('pending', 'complete', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."transaction_phase" AS ENUM('Transaction Initiated', 'Property Listing', 'Documentation Collection', 'Hardship Package Submitted', 'Offer Received', 'Offer Submitted to Lender', 'Initial Lender Review', 'Property Valuation Ordered', 'Lender Negotiations', 'Final Approval Received', 'In Closing');--> statement-breakpoint
CREATE TYPE "public"."uba_document_type" AS ENUM('income_verification', 'hardship_letter', 'financial_statement', 'property_documents', 'correspondence');--> statement-breakpoint
CREATE TYPE "public"."uba_field_status" AS ENUM('empty', 'in_progress', 'completed', 'validated', 'requires_review');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('negotiator', 'seller', 'buyer', 'listing_agent', 'buyers_agent', 'escrow');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('private', 'shared');--> statement-breakpoint
CREATE TYPE "public"."workflow_event_severity" AS ENUM('info', 'warning', 'error', 'critical');--> statement-breakpoint
CREATE TYPE "public"."workflow_event_type" AS ENUM('form_field_filled', 'document_uploaded', 'ai_recommendation_generated', 'validation_performed', 'user_interaction');--> statement-breakpoint
CREATE TABLE "conversational_intake_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"transaction_id" uuid,
	"session_status" "conversational_intake_status" DEFAULT 'not_started' NOT NULL,
	"current_step" text,
	"conversation_history" text,
	"extracted_form_data" text,
	"confidence_scores" text,
	"context_recipe_used" text,
	"ai_personality_settings" text,
	"uba_fields_completed" text[] DEFAULT '{}',
	"validation_pending" text[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"document_name" text NOT NULL,
	"assigned_party_role" text NOT NULL,
	"status" "document_status" DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"due_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "email_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"party_email" text NOT NULL,
	"party_role" text NOT NULL,
	"is_subscribed" boolean DEFAULT true NOT NULL,
	"magic_link_token" text NOT NULL,
	"token_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_subscriptions_magic_link_token_unique" UNIQUE("magic_link_token")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"sender_id" uuid,
	"text" text NOT NULL,
	"reply_to" uuid,
	"is_seed_message" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracker_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"note_text" text NOT NULL,
	"negotiator_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_participants" (
	"transaction_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role_in_transaction" "user_role" NOT NULL,
	"status" "party_status" DEFAULT 'pending' NOT NULL,
	"last_action" text,
	"welcome_email_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_phase_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"phase_key" "transaction_phase" NOT NULL,
	"set_by_negotiator_id" uuid NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"property_address" text NOT NULL,
	"current_phase" "transaction_phase" DEFAULT 'Transaction Initiated' NOT NULL,
	"negotiator_id" uuid NOT NULL,
	"welcome_email_body" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uba_document_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"uba_form_data_id" uuid NOT NULL,
	"document_type" "uba_document_type" NOT NULL,
	"required_by_uba" boolean DEFAULT false,
	"document_title" text NOT NULL,
	"file_url" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size_bytes" integer NOT NULL,
	"content_type" text NOT NULL,
	"processing_status" text DEFAULT 'pending',
	"extraction_confidence" integer,
	"extracted_data" text,
	"uba_compliance_check" text,
	"meets_uba_requirements" boolean,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uba_form_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"borrower_name" text,
	"borrower_ssn" text,
	"property_address" text,
	"loan_number" text,
	"monthly_gross_income" integer,
	"monthly_expenses" integer,
	"liquid_assets" integer,
	"total_debt" integer,
	"hardship_type" text,
	"hardship_date" timestamp,
	"hardship_description" text,
	"hardship_duration_expected" text,
	"assistance_type_requested" text[] DEFAULT '{}',
	"preferred_payment_amount" integer,
	"form_completion_percentage" integer DEFAULT 0,
	"last_section_completed" text,
	"validation_errors" text,
	"ai_generated_suggestions" text,
	"ai_confidence_scores" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"uploaded_by_user_id" uuid,
	"document_request_id" uuid,
	"doc_type" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"visibility" "visibility" DEFAULT 'private' NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_context_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"transaction_id" uuid,
	"preferred_ai_communication_style" text DEFAULT 'professional',
	"ai_assistance_level" text DEFAULT 'balanced',
	"active_context_recipes" text[] DEFAULT '{}',
	"context_recipe_customizations" text,
	"uba_completion_patterns" text,
	"frequent_form_sections" text[] DEFAULT '{}',
	"notification_preferences" text,
	"workflow_step_preferences" text,
	"ai_interaction_history" text,
	"form_completion_velocity" integer DEFAULT 0,
	"error_patterns" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_device_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"device_token" text NOT NULL,
	"token_type" "device_token_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_device_tokens_device_token_unique" UNIQUE("device_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"name" text NOT NULL,
	"role" "user_role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workflow_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" "workflow_event_type" NOT NULL,
	"event_severity" "workflow_event_severity" DEFAULT 'info' NOT NULL,
	"event_category" text NOT NULL,
	"user_id" uuid,
	"transaction_id" uuid,
	"session_id" text,
	"event_name" text NOT NULL,
	"event_description" text,
	"event_metadata" text,
	"context_recipe_id" text,
	"ai_model_used" text,
	"ai_prompt_tokens" integer,
	"ai_completion_tokens" integer,
	"execution_time_ms" integer,
	"error_details" text,
	"success_indicator" boolean DEFAULT true,
	"uba_form_section" text,
	"uba_field_id" text,
	"uba_validation_result" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversational_intake_sessions" ADD CONSTRAINT "conversational_intake_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversational_intake_sessions" ADD CONSTRAINT "conversational_intake_sessions_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_subscriptions" ADD CONSTRAINT "email_subscriptions_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_notes" ADD CONSTRAINT "tracker_notes_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_notes" ADD CONSTRAINT "tracker_notes_negotiator_id_users_id_fk" FOREIGN KEY ("negotiator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_participants" ADD CONSTRAINT "transaction_participants_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_participants" ADD CONSTRAINT "transaction_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_phase_history" ADD CONSTRAINT "transaction_phase_history_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_phase_history" ADD CONSTRAINT "transaction_phase_history_set_by_negotiator_id_users_id_fk" FOREIGN KEY ("set_by_negotiator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_negotiator_id_users_id_fk" FOREIGN KEY ("negotiator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uba_document_attachments" ADD CONSTRAINT "uba_document_attachments_uba_form_data_id_uba_form_data_id_fk" FOREIGN KEY ("uba_form_data_id") REFERENCES "public"."uba_form_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uba_form_data" ADD CONSTRAINT "uba_form_data_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uba_form_data" ADD CONSTRAINT "uba_form_data_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_document_request_id_document_requests_id_fk" FOREIGN KEY ("document_request_id") REFERENCES "public"."document_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_context_profiles" ADD CONSTRAINT "user_context_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_context_profiles" ADD CONSTRAINT "user_context_profiles_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_device_tokens" ADD CONSTRAINT "user_device_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_events" ADD CONSTRAINT "workflow_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_events" ADD CONSTRAINT "workflow_events_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_participants_pk" ON "transaction_participants" USING btree ("transaction_id","user_id","role_in_transaction");--> statement-breakpoint
CREATE UNIQUE INDEX "uba_form_data_transaction_user_idx" ON "uba_form_data" USING btree ("transaction_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_context_profile_user_transaction_idx" ON "user_context_profiles" USING btree ("user_id","transaction_id");--> statement-breakpoint
CREATE INDEX "workflow_events_user_timestamp_idx" ON "workflow_events" USING btree ("user_id","timestamp");--> statement-breakpoint
CREATE INDEX "workflow_events_transaction_timestamp_idx" ON "workflow_events" USING btree ("transaction_id","timestamp");--> statement-breakpoint
CREATE INDEX "workflow_events_type_timestamp_idx" ON "workflow_events" USING btree ("event_type","timestamp");--> statement-breakpoint
CREATE INDEX "workflow_events_session_timestamp_idx" ON "workflow_events" USING btree ("session_id","timestamp");