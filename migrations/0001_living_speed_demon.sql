CREATE TYPE "public"."loe_status" AS ENUM('draft', 'in_review', 'approved', 'sent', 'archived');--> statement-breakpoint
CREATE TYPE "public"."loe_template_type" AS ENUM('unemployment', 'medical_hardship', 'divorce_separation', 'death_of_spouse', 'income_reduction', 'business_failure', 'military_service', 'natural_disaster', 'increased_expenses', 'other_hardship');--> statement-breakpoint
CREATE TABLE "loe_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"uba_form_data_id" uuid,
	"created_by_user_id" uuid NOT NULL,
	"template_type" "loe_template_type" NOT NULL,
	"custom_template_name" text,
	"letter_title" text DEFAULT 'Letter of Explanation' NOT NULL,
	"letter_content" text NOT NULL,
	"ai_generated" boolean DEFAULT false,
	"ai_model_used" text,
	"ai_prompt_used" text,
	"ai_confidence_score" integer,
	"status" "loe_status" DEFAULT 'draft' NOT NULL,
	"current_version" integer DEFAULT 1 NOT NULL,
	"last_exported_at" timestamp,
	"export_formats" text[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loe_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_type" "loe_template_type" NOT NULL,
	"template_name" text NOT NULL,
	"template_description" text,
	"template_content" text NOT NULL,
	"placeholder_mappings" text NOT NULL,
	"usage_count" integer DEFAULT 0,
	"success_rate" integer,
	"is_active" boolean DEFAULT true,
	"created_by_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loe_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loe_draft_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"letter_content" text NOT NULL,
	"change_summary" text,
	"edited_by_user_id" uuid NOT NULL,
	"ai_assisted_edit" boolean DEFAULT false,
	"ai_suggestions_applied" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "loe_drafts" ADD CONSTRAINT "loe_drafts_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loe_drafts" ADD CONSTRAINT "loe_drafts_uba_form_data_id_uba_form_data_id_fk" FOREIGN KEY ("uba_form_data_id") REFERENCES "public"."uba_form_data"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loe_drafts" ADD CONSTRAINT "loe_drafts_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loe_templates" ADD CONSTRAINT "loe_templates_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loe_versions" ADD CONSTRAINT "loe_versions_loe_draft_id_loe_drafts_id_fk" FOREIGN KEY ("loe_draft_id") REFERENCES "public"."loe_drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loe_versions" ADD CONSTRAINT "loe_versions_edited_by_user_id_users_id_fk" FOREIGN KEY ("edited_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "loe_drafts_transaction_idx" ON "loe_drafts" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "loe_drafts_status_idx" ON "loe_drafts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "loe_drafts_created_by_idx" ON "loe_drafts" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "loe_templates_type_idx" ON "loe_templates" USING btree ("template_type");--> statement-breakpoint
CREATE INDEX "loe_versions_draft_idx" ON "loe_versions" USING btree ("loe_draft_id");--> statement-breakpoint
CREATE UNIQUE INDEX "loe_versions_unique_idx" ON "loe_versions" USING btree ("loe_draft_id","version_number");