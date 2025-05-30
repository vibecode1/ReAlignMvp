-- Migration to add loan_type enum and field for financial calculator extensibility
-- Generated: 2025-05-30
-- Purpose: Support future multi-loan-type calculations in FinancialCalculatorService

-- Create loan_type enum
CREATE TYPE "public"."loan_type" AS ENUM('Conventional', 'FHA', 'VA', 'USDA', 'Other');

-- Add loan_type field to uba_form_data table with default value
ALTER TABLE "uba_form_data" 
ADD COLUMN "loan_type" "loan_type" DEFAULT 'Conventional';

-- Add comment explaining the field's purpose
COMMENT ON COLUMN "uba_form_data"."loan_type" IS 'Loan type for financial calculator service extensibility (Fannie Mae, FHA, VA, USDA, Other)';

-- Update existing records to have Conventional as default (already handled by DEFAULT clause)
-- No additional data migration needed as DEFAULT clause will apply to existing NULL values