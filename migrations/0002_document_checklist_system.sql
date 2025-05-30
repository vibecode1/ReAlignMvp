-- Dynamic Document Checklist System
-- This migration creates tables for managing lender-specific document requirements

-- Lenders table
CREATE TABLE IF NOT EXISTS lenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('servicer', 'investor', 'government')),
  is_active BOOLEAN DEFAULT true,
  fannie_mae_compliant BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Document requirements catalog
CREATE TABLE IF NOT EXISTS document_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL CHECK (category IN (
    'income_verification',
    'hardship_documentation',
    'property_information',
    'financial_statements',
    'legal_documents',
    'identity_verification',
    'bankruptcy_documents',
    'military_documents',
    'business_documents',
    'other'
  )),
  form_number VARCHAR(50), -- e.g., 'Form 710', 'IRS 4506-C'
  max_age_days INTEGER, -- Maximum age of document in days (e.g., 90 days)
  is_fannie_mae_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lender-specific requirements with conditional logic
CREATE TABLE IF NOT EXISTS lender_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id UUID REFERENCES lenders(id) ON DELETE CASCADE,
  document_id UUID REFERENCES document_requirements(id) ON DELETE CASCADE,
  case_type VARCHAR(50) NOT NULL CHECK (case_type IN (
    'short_sale',
    'loan_modification',
    'forbearance',
    'repayment_plan',
    'deed_in_lieu',
    'payment_deferral',
    'all'
  )),
  property_type VARCHAR(50) CHECK (property_type IN (
    'primary_residence',
    'second_home',
    'investment_property',
    'all'
  )),
  is_required BOOLEAN DEFAULT true,
  conditions JSONB, -- Stores complex conditional logic
  priority VARCHAR(20) DEFAULT 'required' CHECK (priority IN ('required', 'conditional', 'optional')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(lender_id, document_id, case_type, property_type)
);

-- Document checklist templates
CREATE TABLE IF NOT EXISTS document_checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  lender_id UUID REFERENCES lenders(id),
  case_type VARCHAR(50),
  property_type VARCHAR(50),
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT false,
  is_organization_template BOOLEAN DEFAULT false,
  organization_id UUID,
  template_data JSONB, -- Stores the full template configuration
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transaction-specific document checklists
CREATE TABLE IF NOT EXISTS transaction_document_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  template_id UUID REFERENCES document_checklist_templates(id),
  lender_id UUID REFERENCES lenders(id),
  case_type VARCHAR(50) NOT NULL,
  property_type VARCHAR(50) NOT NULL,
  delinquency_status VARCHAR(50),
  hardship_type VARCHAR(100),
  employment_status VARCHAR(50),
  bankruptcy_status VARCHAR(50),
  military_status VARCHAR(50),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Individual checklist items for a transaction
CREATE TABLE IF NOT EXISTS transaction_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID REFERENCES transaction_document_checklists(id) ON DELETE CASCADE,
  document_requirement_id UUID REFERENCES document_requirements(id),
  document_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('required', 'conditional', 'optional')),
  status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN (
    'not_started',
    'uploaded',
    'ai_verified',
    'expert_approved',
    'rejected',
    'needs_attention'
  )),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  uploaded_document_id UUID REFERENCES documents(id),
  uploaded_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  ai_confidence_score DECIMAL(3,2) CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
  ai_extracted_data JSONB,
  notes TEXT,
  due_date DATE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Document checklist reminders
CREATE TABLE IF NOT EXISTS document_checklist_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_item_id UUID REFERENCES transaction_checklist_items(id) ON DELETE CASCADE,
  reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN (
    'initial',
    'gentle',
    'urgent',
    'critical',
    'overdue'
  )),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'sms', 'in_app', 'ai_chat')),
  recipient_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_lender_requirements_lender_id ON lender_requirements(lender_id);
CREATE INDEX idx_lender_requirements_document_id ON lender_requirements(document_id);
CREATE INDEX idx_lender_requirements_case_type ON lender_requirements(case_type);
CREATE INDEX idx_transaction_checklists_transaction_id ON transaction_document_checklists(transaction_id);
CREATE INDEX idx_checklist_items_checklist_id ON transaction_checklist_items(checklist_id);
CREATE INDEX idx_checklist_items_status ON transaction_checklist_items(status);
CREATE INDEX idx_checklist_reminders_scheduled_for ON document_checklist_reminders(scheduled_for);

-- Insert initial lenders
INSERT INTO lenders (name, type) VALUES
  ('Fannie Mae', 'investor'),
  ('Chase', 'servicer'),
  ('Bank of America', 'servicer'),
  ('Wells Fargo', 'servicer'),
  ('Quicken Loans / Rocket Mortgage', 'servicer'),
  ('CitiMortgage', 'servicer')
ON CONFLICT (name) DO NOTHING;

-- Insert base document requirements based on Fannie Mae guidelines
INSERT INTO document_requirements (name, description, category, form_number, max_age_days, is_fannie_mae_required) VALUES
  -- Core BRP documents
  ('Mortgage Assistance Application', 'Form 710 - Uniform Borrower Assistance Form', 'financial_statements', 'Form 710', NULL, true),
  ('IRS Form 4506-C', 'IRS Request for Transcript of Tax Return', 'income_verification', 'IRS 4506-C', NULL, true),
  
  -- Income documentation
  ('Paystubs', 'Most recent 2 months of paystubs', 'income_verification', NULL, 90, true),
  ('W-2 Forms', 'Last 2 years of W-2 forms', 'income_verification', NULL, NULL, true),
  ('Tax Returns', 'Last 2 years of filed tax returns', 'income_verification', NULL, NULL, true),
  ('Bank Statements', 'Last 2 months of bank statements for all accounts', 'financial_statements', NULL, 90, true),
  ('Profit & Loss Statement', 'Year-to-date profit & loss statement for self-employed', 'business_documents', NULL, 90, true),
  ('Social Security Award Letter', 'Current award letter for SS benefits', 'income_verification', NULL, 365, false),
  ('Disability Award Letter', 'Current disability benefits award letter', 'income_verification', NULL, 365, false),
  ('Pension Statement', 'Current pension/retirement income statement', 'income_verification', NULL, 180, false),
  ('Unemployment Benefits Statement', 'Current unemployment benefits statement', 'income_verification', NULL, 30, false),
  ('Rental Income Documentation', 'Lease agreements and proof of rental income', 'income_verification', NULL, 365, false),
  
  -- Hardship documentation
  ('Hardship Letter', 'Detailed explanation of financial hardship', 'hardship_documentation', NULL, NULL, true),
  ('Unemployment Notice', 'Termination letter or unemployment documentation', 'hardship_documentation', NULL, NULL, false),
  ('Medical Bills', 'Documentation of medical expenses causing hardship', 'hardship_documentation', NULL, NULL, false),
  ('Divorce Decree', 'Final divorce decree if applicable', 'hardship_documentation', NULL, NULL, false),
  ('Death Certificate', 'Death certificate of co-borrower or wage earner', 'hardship_documentation', NULL, NULL, false),
  ('Utility Shut-off Notices', 'Notices of utility disconnection', 'hardship_documentation', NULL, 90, false),
  
  -- Property documentation
  ('Property Tax Bill', 'Most recent property tax statement', 'property_information', NULL, 365, false),
  ('Homeowners Insurance', 'Current homeowners insurance declarations page', 'property_information', NULL, 365, false),
  ('HOA Statement', 'Current HOA fee statement if applicable', 'property_information', NULL, 90, false),
  ('Property Photos', 'Current photos of property exterior and interior', 'property_information', NULL, 30, false),
  ('Purchase Agreement', 'Signed purchase agreement for short sale', 'property_information', NULL, NULL, false),
  ('Listing Agreement', 'Signed listing agreement with real estate agent', 'property_information', NULL, NULL, false),
  
  -- Bankruptcy documents
  ('Bankruptcy Schedules', 'Complete bankruptcy schedules if applicable', 'bankruptcy_documents', NULL, 90, false),
  ('Bankruptcy Discharge', 'Proof of Chapter 7 discharge if applicable', 'bankruptcy_documents', NULL, NULL, false),
  
  -- Military documents
  ('Military Orders', 'PCS orders or deployment documentation', 'military_documents', NULL, NULL, false),
  ('Leave and Earnings Statement', 'Military LES for income verification', 'military_documents', NULL, 90, false),
  
  -- Legal/Identity
  ('Photo ID', 'Valid government-issued photo identification', 'identity_verification', NULL, NULL, true),
  ('Short Sale Affidavit', 'Form 191 - Short Sale Affidavit', 'legal_documents', 'Form 191', NULL, false),
  ('Authorization to Release Information', 'Third-party authorization form', 'legal_documents', NULL, NULL, false)
ON CONFLICT DO NOTHING;

-- Insert Fannie Mae baseline requirements
INSERT INTO lender_requirements (lender_id, document_id, case_type, property_type, is_required, priority, conditions)
SELECT 
  l.id,
  d.id,
  'all',
  'all',
  d.is_fannie_mae_required,
  CASE WHEN d.is_fannie_mae_required THEN 'required' ELSE 'conditional' END,
  NULL
FROM lenders l
CROSS JOIN document_requirements d
WHERE l.name = 'Fannie Mae'
ON CONFLICT DO NOTHING;

-- Add specific conditional requirements for Fannie Mae based on guidelines
-- Short sale specific requirements
INSERT INTO lender_requirements (lender_id, document_id, case_type, property_type, is_required, priority, conditions)
SELECT 
  l.id,
  d.id,
  'short_sale',
  'all',
  true,
  'required',
  '{"delinquency": "< 18 months"}'::jsonb
FROM lenders l
CROSS JOIN document_requirements d
WHERE l.name = 'Fannie Mae' 
  AND d.name IN ('Mortgage Assistance Application', 'Purchase Agreement', 'Listing Agreement', 'Short Sale Affidavit')
ON CONFLICT DO NOTHING;

-- Self-employed specific requirements
INSERT INTO lender_requirements (lender_id, document_id, case_type, property_type, is_required, priority, conditions)
SELECT 
  l.id,
  d.id,
  'all',
  'all',
  true,
  'required',
  '{"employment_status": "self_employed"}'::jsonb
FROM lenders l
CROSS JOIN document_requirements d
WHERE l.name = 'Fannie Mae' 
  AND d.name IN ('Profit & Loss Statement', 'Tax Returns', 'Bank Statements')
ON CONFLICT DO NOTHING;