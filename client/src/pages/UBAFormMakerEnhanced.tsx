import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertCircle, 
  CheckCircle, 
  MessageSquare, 
  FileText, 
  Send, 
  Upload,
  Bot,
  User,
  Paperclip,
  Info,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
  Home,
  Download,
  FileDown
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import ErrorBoundary from '@/components/ErrorBoundary';
import { mapExtractedToUbaFields, type FieldMappingResult, UBA_FIELD_MAPPINGS } from '@shared/ubaFieldMappings';

// Types for UBA Form sections following the UBA Guide rules
interface UBAFormSection {
  id: string;
  title: string;
  description: string;
  fields: UBAField[];
  completed: boolean;
  validationErrors: string[];
  ubaGuideRules?: string[];
}

interface UBAField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'date' | 'currency' | 'phone' | 'ssn' | 'email';
  label: string;
  value: string;
  required: boolean;
  options?: string[];
  validation?: string;
  aiSuggestion?: string;
  confidence?: number;
  placeholder?: string;
  helpText?: string;
  ubaRule?: string;
}

interface ConversationMessage {
  id: string;
  type: 'user' | 'ai' | 'system' | 'document';
  content: string;
  timestamp: Date;
  metadata?: {
    extractedData?: Record<string, any>;
    documentType?: string;
    fileName?: string;
    confidence?: Record<string, number>;
    nextStep?: string;
  };
}

interface DocumentUpload {
  id: string;
  fileName: string;
  fileType: string;
  uploadedAt: Date;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  extractedData?: Record<string, any>;
}

const UBA_GUIDE_RULES = {
  intent: "Never use 'Undecided' - must be 'Sell' for short sale or 'Keep' for modification",
  propertyType: "Default to 'My Primary Residence' unless specified otherwise",
  ownerOccupied: "Default to 'Yes' unless lease/renter is present",
  phone: "Use ONE cell number for all borrowers; enter 'N/A' for home phone",
  email: "Enter 'Attorney Only' and use Nadia's email for borrower communications",
  coborrower: "All fields 'N/A' if no co-borrower exists",
  creditCounseling: "Always 'No' and 'N/A' across all lines",
  militaryService: "Usually 'No' - if 'Yes', notify Nadia",
  bankruptcy: "If marked 'Yes' but details missing, leave detail fields blank and ask expert",
  blankFields: "MUST use 'N/A' instead of leaving blank",
  income: {
    retention: "Report Gross income only",
    shortSale: "Report both Gross AND Net income"
  },
  assets: "Default to '$500 in checking account' and '$500 total assets'",
  hardshipDuration: {
    shortSale: "Long-term",
    retention: "Short-term",
    never: "Medium-term"
  }
};

export const UBAFormMakerEnhanced: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // State management
  const [activeSection, setActiveSection] = useState<string>('loan-info');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [viewMode, setViewMode] = useState<'conversation' | 'preview' | 'form'>('conversation');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [showDataPreview, setShowDataPreview] = useState<boolean>(true);
  const [caseType, setCaseType] = useState<'short_sale' | 'retention' | null>(null);
  const [documentExtractions, setDocumentExtractions] = useState<Record<string, Record<string, any>>>({});
  const [currentFormId, setCurrentFormId] = useState<string | null>(null);
  const [dataViewMode, setDataViewMode] = useState<'uba' | 'all'>('uba');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Enhanced UBA Form Sections with UBA Guide rules
  const formSections: UBAFormSection[] = [
    {
      id: 'loan-info',
      title: 'Loan Information',
      description: 'Basic loan and servicer details',
      completed: false,
      validationErrors: [],
      fields: [
        {
          id: 'loan_number',
          name: 'loan_number',
          type: 'text',
          label: 'Loan Number',
          value: '',
          required: true,
          placeholder: 'Enter your loan number'
        },
        {
          id: 'mortgage_insurance_case_number',
          name: 'mortgage_insurance_case_number',
          type: 'text',
          label: 'Mortgage Insurance Case Number',
          value: '',
          required: false,
          placeholder: 'If applicable'
        },
        {
          id: 'servicer_name',
          name: 'servicer_name',
          type: 'text',
          label: 'Servicer/Lender Name',
          value: '',
          required: true,
          placeholder: 'Name of your mortgage servicer'
        }
      ]
    },
    {
      id: 'intent-selection',
      title: 'Intent & Case Type',
      description: 'Determine if this is a short sale or retention case',
      completed: false,
      validationErrors: [],
      ubaGuideRules: [UBA_GUIDE_RULES.intent],
      fields: [
        {
          id: 'intent',
          name: 'intent',
          type: 'select',
          label: 'Borrower Intent',
          value: '',
          required: true,
          options: ['Sell', 'Keep'],
          ubaRule: UBA_GUIDE_RULES.intent
        },
        {
          id: 'property_type',
          name: 'property_type',
          type: 'select',
          label: 'Property Type',
          value: 'My Primary Residence',
          required: true,
          options: ['My Primary Residence', 'Second Home', 'Investment Property'],
          ubaRule: UBA_GUIDE_RULES.propertyType
        },
        {
          id: 'owner_occupied',
          name: 'owner_occupied',
          type: 'select',
          label: 'Owner Occupied',
          value: 'Yes',
          required: true,
          options: ['Yes', 'No'],
          ubaRule: UBA_GUIDE_RULES.ownerOccupied
        },
        {
          id: 'renter_occupied',
          name: 'renter_occupied',
          type: 'select',
          label: 'Renter Occupied',
          value: 'No',
          required: true,
          options: ['Yes', 'No']
        },
        {
          id: 'vacant',
          name: 'vacant',
          type: 'select',
          label: 'Property Vacant',
          value: 'No',
          required: true,
          options: ['Yes', 'No']
        }
      ]
    },
    {
      id: 'borrower-info',
      title: 'Borrower Information',
      description: 'Primary borrower details and contact information',
      completed: false,
      validationErrors: [],
      ubaGuideRules: [UBA_GUIDE_RULES.phone, UBA_GUIDE_RULES.email],
      fields: [
        {
          id: 'borrower_name',
          name: 'borrower_name',
          type: 'text',
          label: 'Borrower Full Name',
          value: '',
          required: true,
          placeholder: 'First Middle Last'
        },
        {
          id: 'borrower_dob',
          name: 'borrower_dob',
          type: 'date',
          label: 'Date of Birth',
          value: '',
          required: true
        },
        {
          id: 'borrower_ssn',
          name: 'borrower_ssn',
          type: 'ssn',
          label: 'Social Security Number',
          value: '',
          required: true,
          validation: 'SSN format required',
          placeholder: 'XXX-XX-XXXX'
        },
        {
          id: 'borrower_cell_phone',
          name: 'borrower_cell_phone',
          type: 'phone',
          label: 'Cell Phone Number',
          value: '',
          required: true,
          ubaRule: UBA_GUIDE_RULES.phone,
          placeholder: '(XXX) XXX-XXXX'
        },
        {
          id: 'borrower_home_phone',
          name: 'borrower_home_phone',
          type: 'text',
          label: 'Home Phone Number',
          value: 'N/A',
          required: true,
          ubaRule: UBA_GUIDE_RULES.phone
        },
        {
          id: 'borrower_work_phone',
          name: 'borrower_work_phone',
          type: 'phone',
          label: 'Work Phone Number',
          value: '',
          required: false,
          placeholder: '(XXX) XXX-XXXX'
        },
        {
          id: 'borrower_email',
          name: 'borrower_email',
          type: 'email',
          label: 'Email Address',
          value: 'Attorney Only',
          required: true,
          ubaRule: UBA_GUIDE_RULES.email,
          helpText: 'Use "Attorney Only" per UBA Guide'
        },
        {
          id: 'mailing_address',
          name: 'mailing_address',
          type: 'textarea',
          label: 'Mailing Address (if different from property)',
          value: '',
          required: false,
          placeholder: 'Street Address, City, State ZIP'
        }
      ]
    },
    {
      id: 'coborrower-info',
      title: 'Co-Borrower Information',
      description: 'Co-borrower details if applicable',
      completed: false,
      validationErrors: [],
      ubaGuideRules: [UBA_GUIDE_RULES.coborrower],
      fields: [
        {
          id: 'has_coborrower',
          name: 'has_coborrower',
          type: 'select',
          label: 'Is there a co-borrower?',
          value: 'No',
          required: true,
          options: ['Yes', 'No']
        },
        {
          id: 'coborrower_name',
          name: 'coborrower_name',
          type: 'text',
          label: 'Co-Borrower Full Name',
          value: 'N/A',
          required: true,
          ubaRule: UBA_GUIDE_RULES.coborrower
        },
        {
          id: 'coborrower_ssn',
          name: 'coborrower_ssn',
          type: 'text',
          label: 'Co-Borrower SSN',
          value: 'N/A',
          required: true,
          ubaRule: UBA_GUIDE_RULES.coborrower
        }
      ]
    },
    {
      id: 'property-info',
      title: 'Property Information',
      description: 'Details about the property',
      completed: false,
      validationErrors: [],
      fields: [
        {
          id: 'property_address',
          name: 'property_address',
          type: 'textarea',
          label: 'Property Address',
          value: '',
          required: true,
          placeholder: 'Street Address, City, State ZIP'
        },
        {
          id: 'property_value',
          name: 'property_value',
          type: 'currency',
          label: 'Current Property Value',
          value: '',
          required: true,
          placeholder: '$0.00'
        },
        {
          id: 'mortgage_balance',
          name: 'mortgage_balance',
          type: 'currency',
          label: 'Outstanding Mortgage Balance',
          value: '',
          required: true,
          placeholder: '$0.00'
        },
        {
          id: 'monthly_payment',
          name: 'monthly_payment',
          type: 'currency',
          label: 'Monthly Mortgage Payment',
          value: '',
          required: true,
          placeholder: '$0.00'
        },
        {
          id: 'property_listed',
          name: 'property_listed',
          type: 'select',
          label: 'Is Property Listed for Sale?',
          value: 'No',
          required: true,
          options: ['Yes', 'No']
        },
        {
          id: 'listing_date',
          name: 'listing_date',
          type: 'date',
          label: 'Listing Date',
          value: '',
          required: false,
          helpText: 'Required if property is listed'
        },
        {
          id: 'listing_agent_name',
          name: 'listing_agent_name',
          type: 'text',
          label: 'Listing Agent Name',
          value: '',
          required: false,
          placeholder: 'Agent full name'
        },
        {
          id: 'listing_agent_phone',
          name: 'listing_agent_phone',
          type: 'phone',
          label: 'Listing Agent Phone',
          value: '',
          required: false,
          placeholder: '(XXX) XXX-XXXX'
        },
        {
          id: 'listing_price',
          name: 'listing_price',
          type: 'currency',
          label: 'Listing Price',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'for_sale_by_owner',
          name: 'for_sale_by_owner',
          type: 'select',
          label: 'For Sale By Owner?',
          value: 'No',
          required: true,
          options: ['Yes', 'No'],
          ubaRule: 'Always "No" per UBA Guide'
        },
        {
          id: 'offer_received',
          name: 'offer_received',
          type: 'select',
          label: 'Offer Received?',
          value: 'No',
          required: false,
          options: ['Yes', 'No']
        },
        {
          id: 'offer_amount',
          name: 'offer_amount',
          type: 'currency',
          label: 'Offer Amount',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'offer_date',
          name: 'offer_date',
          type: 'date',
          label: 'Offer Date',
          value: '',
          required: false
        },
        {
          id: 'offer_status',
          name: 'offer_status',
          type: 'select',
          label: 'Offer Status',
          value: '',
          required: false,
          options: ['', 'Pending', 'Accepted', 'Rejected', 'Countered']
        }
      ]
    },
    {
      id: 'financial-hardship',
      title: 'Financial Hardship',
      description: 'Details about the financial difficulties',
      completed: false,
      validationErrors: [],
      ubaGuideRules: [
        caseType === 'short_sale' ? UBA_GUIDE_RULES.hardshipDuration.shortSale : UBA_GUIDE_RULES.hardshipDuration.retention
      ],
      fields: [
        {
          id: 'hardship_type',
          name: 'hardship_type',
          type: 'select',
          label: 'Type of Hardship',
          value: '',
          required: true,
          options: [
            'Job Loss/Unemployment',
            'Reduced Income',
            'Medical Bills/Illness',
            'Divorce/Separation',
            'Death of Co-borrower',
            'Business Failure',
            'Disaster/Emergency',
            'Other'
          ]
        },
        {
          id: 'hardship_description',
          name: 'hardship_description',
          type: 'textarea',
          label: 'Detailed Description of Hardship',
          value: '',
          required: true,
          placeholder: 'Please describe your hardship situation in detail...'
        },
        {
          id: 'hardship_date',
          name: 'hardship_date',
          type: 'date',
          label: 'Date Hardship Began',
          value: '',
          required: true
        },
        {
          id: 'hardship_duration',
          name: 'hardship_duration',
          type: 'select',
          label: 'Expected Duration',
          value: caseType === 'short_sale' ? 'Long-term' : 'Short-term',
          required: true,
          options: ['Short-term', 'Long-term'],
          ubaRule: caseType === 'short_sale' ? UBA_GUIDE_RULES.hardshipDuration.shortSale : UBA_GUIDE_RULES.hardshipDuration.retention
        }
      ]
    },
    {
      id: 'employment',
      title: 'Employment Information',
      description: 'Current employment details',
      completed: false,
      validationErrors: [],
      fields: [
        {
          id: 'employer_name',
          name: 'employer_name',
          type: 'text',
          label: 'Current Employer Name',
          value: '',
          required: true,
          placeholder: 'Company name'
        },
        {
          id: 'employment_start_date',
          name: 'employment_start_date',
          type: 'date',
          label: 'Employment Start Date',
          value: '',
          required: true
        },
        {
          id: 'employer_phone',
          name: 'employer_phone',
          type: 'phone',
          label: 'Employer Phone',
          value: '',
          required: false,
          placeholder: '(XXX) XXX-XXXX'
        },
        {
          id: 'coborrower_employer_name',
          name: 'coborrower_employer_name',
          type: 'text',
          label: 'Co-Borrower Employer Name',
          value: 'N/A',
          required: false,
          placeholder: 'Company name'
        },
        {
          id: 'coborrower_employment_start_date',
          name: 'coborrower_employment_start_date',
          type: 'date',
          label: 'Co-Borrower Employment Start Date',
          value: '',
          required: false
        }
      ]
    },
    {
      id: 'income-expenses',
      title: 'Income & Expenses',
      description: 'Detailed monthly income and expense breakdown',
      completed: false,
      validationErrors: [],
      ubaGuideRules: [
        caseType === 'retention' ? UBA_GUIDE_RULES.income.retention : UBA_GUIDE_RULES.income.shortSale
      ],
      fields: [
        {
          id: 'wage_income',
          name: 'wage_income',
          type: 'currency',
          label: 'Wages/Salary',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'overtime_income',
          name: 'overtime_income',
          type: 'currency',
          label: 'Overtime',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'child_support_received',
          name: 'child_support_received',
          type: 'currency',
          label: 'Child Support/Alimony Received',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'social_security_income',
          name: 'social_security_income',
          type: 'currency',
          label: 'Social Security/SSDI',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'self_employment_income',
          name: 'self_employment_income',
          type: 'currency',
          label: 'Self-Employment Income',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'rental_income',
          name: 'rental_income',
          type: 'currency',
          label: 'Rental Income',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'unemployment_income',
          name: 'unemployment_income',
          type: 'currency',
          label: 'Unemployment Benefits',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'other_income',
          name: 'other_income',
          type: 'currency',
          label: 'Other Income',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'other_income_description',
          name: 'other_income_description',
          type: 'text',
          label: 'Other Income Description',
          value: '',
          required: false,
          placeholder: 'Describe other income source'
        },
        {
          id: 'monthly_gross_income',
          name: 'monthly_gross_income',
          type: 'currency',
          label: 'Total Monthly Gross Income',
          value: '',
          required: true,
          placeholder: '$0.00',
          ubaRule: caseType === 'retention' ? UBA_GUIDE_RULES.income.retention : UBA_GUIDE_RULES.income.shortSale
        },
        {
          id: 'monthly_net_income',
          name: 'monthly_net_income',
          type: 'currency',
          label: 'Total Monthly Net Income',
          value: caseType === 'retention' ? 'N/A' : '',
          required: caseType === 'short_sale',
          placeholder: '$0.00',
          ubaRule: caseType === 'retention' ? 'N/A for retention files' : UBA_GUIDE_RULES.income.shortSale
        },
        {
          id: 'first_mortgage_payment',
          name: 'first_mortgage_payment',
          type: 'currency',
          label: 'First Mortgage Payment',
          value: '',
          required: true,
          placeholder: '$0.00'
        },
        {
          id: 'second_mortgage_payment',
          name: 'second_mortgage_payment',
          type: 'currency',
          label: 'Second Mortgage Payment',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'homeowners_insurance',
          name: 'homeowners_insurance',
          type: 'currency',
          label: 'Homeowners Insurance',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'property_taxes',
          name: 'property_taxes',
          type: 'currency',
          label: 'Property Taxes',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'hoa_fees',
          name: 'hoa_fees',
          type: 'currency',
          label: 'HOA/Condo Fees',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'utilities',
          name: 'utilities',
          type: 'currency',
          label: 'Utilities (Electric, Gas, Water, etc.)',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'car_payment',
          name: 'car_payment',
          type: 'currency',
          label: 'Car Payment(s)',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'car_insurance',
          name: 'car_insurance',
          type: 'currency',
          label: 'Car Insurance',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'credit_card_payments',
          name: 'credit_card_payments',
          type: 'currency',
          label: 'Credit Card Payments (Minimum)',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'child_support_paid',
          name: 'child_support_paid',
          type: 'currency',
          label: 'Child Support/Alimony Paid',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'food_groceries',
          name: 'food_groceries',
          type: 'currency',
          label: 'Food/Groceries',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'medical_expenses',
          name: 'medical_expenses',
          type: 'currency',
          label: 'Medical/Health Expenses',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'other_expenses',
          name: 'other_expenses',
          type: 'currency',
          label: 'Other Expenses',
          value: '',
          required: false,
          placeholder: '$0.00',
          helpText: 'Combined food/utilities on condensed UBA page'
        },
        {
          id: 'monthly_expenses',
          name: 'monthly_expenses',
          type: 'currency',
          label: 'Total Monthly Expenses',
          value: '',
          required: true,
          placeholder: '$0.00'
        }
      ]
    },
    {
      id: 'assets-liabilities',
      title: 'Assets & Liabilities',
      description: 'Current assets and other debts',
      completed: false,
      validationErrors: [],
      ubaGuideRules: [UBA_GUIDE_RULES.assets],
      fields: [
        {
          id: 'checking_account_balance',
          name: 'checking_account_balance',
          type: 'currency',
          label: 'Checking Account Balance',
          value: '500',
          required: true,
          ubaRule: UBA_GUIDE_RULES.assets
        },
        {
          id: 'savings_account_balance',
          name: 'savings_account_balance',
          type: 'currency',
          label: 'Savings Account Balance',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'money_market_balance',
          name: 'money_market_balance',
          type: 'currency',
          label: 'Money Market/CDs',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'stocks_bonds_value',
          name: 'stocks_bonds_value',
          type: 'currency',
          label: 'Stocks/Bonds Value',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'retirement_accounts',
          name: 'retirement_accounts',
          type: 'currency',
          label: 'Retirement Accounts (401k, IRA)',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'other_real_estate_value',
          name: 'other_real_estate_value',
          type: 'currency',
          label: 'Other Real Estate Value',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'cash_on_hand',
          name: 'cash_on_hand',
          type: 'currency',
          label: 'Cash on Hand',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'other_assets',
          name: 'other_assets',
          type: 'currency',
          label: 'Other Assets',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'total_assets',
          name: 'total_assets',
          type: 'currency',
          label: 'Total Assets',
          value: '500',
          required: true,
          ubaRule: UBA_GUIDE_RULES.assets
        },
        {
          id: 'credit_card_debt',
          name: 'credit_card_debt',
          type: 'currency',
          label: 'Total Credit Card Debt',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'auto_loan_balance',
          name: 'auto_loan_balance',
          type: 'currency',
          label: 'Auto Loan Balance(s)',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'student_loan_balance',
          name: 'student_loan_balance',
          type: 'currency',
          label: 'Student Loan Balance',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'installment_loans',
          name: 'installment_loans',
          type: 'currency',
          label: 'Installment Loans (furniture, etc.)',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'personal_loans',
          name: 'personal_loans',
          type: 'currency',
          label: 'Personal Loans (unsecured)',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'other_mortgages',
          name: 'other_mortgages',
          type: 'currency',
          label: 'Other Mortgages (on other properties)',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'other_liabilities',
          name: 'other_liabilities',
          type: 'currency',
          label: 'Other Liabilities',
          value: '',
          required: false,
          placeholder: '$0.00'
        },
        {
          id: 'total_liabilities',
          name: 'total_liabilities',
          type: 'currency',
          label: 'Total Liabilities',
          value: '',
          required: false,
          placeholder: '$0.00'
        }
      ]
    },
    {
      id: 'lien-holders',
      title: 'Lien Holder Information',
      description: 'Information about second/third mortgages or liens',
      completed: false,
      validationErrors: [],
      fields: [
        {
          id: 'second_lien_holder',
          name: 'second_lien_holder',
          type: 'text',
          label: 'Second Lien Holder Name',
          value: caseType === 'retention' ? 'N/A' : '',
          required: false,
          placeholder: 'Lender name',
          ubaRule: 'N/A for retention files'
        },
        {
          id: 'second_lien_balance',
          name: 'second_lien_balance',
          type: 'currency',
          label: 'Second Lien Balance',
          value: caseType === 'retention' ? 'N/A' : '',
          required: false,
          placeholder: '$0.00',
          ubaRule: 'N/A for retention files'
        },
        {
          id: 'second_lien_loan_number',
          name: 'second_lien_loan_number',
          type: 'text',
          label: 'Second Lien Loan Number',
          value: caseType === 'retention' ? 'N/A' : '',
          required: false,
          placeholder: 'Loan number',
          ubaRule: 'N/A for retention files'
        },
        {
          id: 'third_lien_holder',
          name: 'third_lien_holder',
          type: 'text',
          label: 'Third Lien Holder Name',
          value: caseType === 'retention' ? 'N/A' : '',
          required: false,
          placeholder: 'Lender name',
          ubaRule: 'N/A for retention files'
        },
        {
          id: 'third_lien_balance',
          name: 'third_lien_balance',
          type: 'currency',
          label: 'Third Lien Balance',
          value: caseType === 'retention' ? 'N/A' : '',
          required: false,
          placeholder: '$0.00',
          ubaRule: 'N/A for retention files'
        },
        {
          id: 'third_lien_loan_number',
          name: 'third_lien_loan_number',
          type: 'text',
          label: 'Third Lien Loan Number',
          value: caseType === 'retention' ? 'N/A' : '',
          required: false,
          placeholder: 'Loan number',
          ubaRule: 'N/A for retention files'
        }
      ]
    },
    {
      id: 'hoa-info',
      title: 'HOA Information',
      description: 'Homeowners Association details if applicable',
      completed: false,
      validationErrors: [],
      fields: [
        {
          id: 'has_hoa',
          name: 'has_hoa',
          type: 'select',
          label: 'Does property have HOA?',
          value: 'No',
          required: true,
          options: ['Yes', 'No']
        },
        {
          id: 'hoa_name',
          name: 'hoa_name',
          type: 'text',
          label: 'HOA Name',
          value: 'N/A',
          required: false,
          placeholder: 'Association name'
        },
        {
          id: 'hoa_contact_name',
          name: 'hoa_contact_name',
          type: 'text',
          label: 'HOA Contact Name',
          value: 'N/A',
          required: false,
          placeholder: 'Contact person'
        },
        {
          id: 'hoa_contact_phone',
          name: 'hoa_contact_phone',
          type: 'phone',
          label: 'HOA Contact Phone',
          value: '',
          required: false,
          placeholder: '(XXX) XXX-XXXX'
        },
        {
          id: 'hoa_contact_address',
          name: 'hoa_contact_address',
          type: 'textarea',
          label: 'HOA Contact Address',
          value: 'N/A',
          required: false,
          placeholder: 'Street Address, City, State ZIP'
        },
        {
          id: 'hoa_monthly_fee',
          name: 'hoa_monthly_fee',
          type: 'currency',
          label: 'HOA Monthly Fee',
          value: '',
          required: false,
          placeholder: '$0.00'
        }
      ]
    },
    {
      id: 'additional-info',
      title: 'Additional Information',
      description: 'Other relevant information',
      completed: false,
      validationErrors: [],
      ubaGuideRules: [UBA_GUIDE_RULES.creditCounseling, UBA_GUIDE_RULES.militaryService, UBA_GUIDE_RULES.bankruptcy],
      fields: [
        {
          id: 'credit_counseling',
          name: 'credit_counseling',
          type: 'select',
          label: 'Have you received credit counseling?',
          value: 'No',
          required: true,
          options: ['Yes', 'No'],
          ubaRule: UBA_GUIDE_RULES.creditCounseling
        },
        {
          id: 'credit_counseling_details',
          name: 'credit_counseling_details',
          type: 'text',
          label: 'Credit Counseling Details',
          value: 'N/A',
          required: true,
          ubaRule: UBA_GUIDE_RULES.creditCounseling
        },
        {
          id: 'military_service',
          name: 'military_service',
          type: 'select',
          label: 'Active Military Service?',
          value: 'No',
          required: true,
          options: ['Yes', 'No'],
          ubaRule: UBA_GUIDE_RULES.militaryService
        },
        {
          id: 'bankruptcy_filed',
          name: 'bankruptcy_filed',
          type: 'select',
          label: 'Have you filed for bankruptcy?',
          value: 'No',
          required: true,
          options: ['Yes', 'No'],
          ubaRule: UBA_GUIDE_RULES.bankruptcy
        }
      ]
    }
  ];

  const [sections, setSections] = useState<UBAFormSection[]>(formSections);

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Initialize conversation
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          type: 'ai',
          content: `Hello! I'm here to help you complete your Borrower Financial Statement (UBA form) for mortgage assistance. This conversation will guide you through each section step by step.

First, let me gather some basic loan information. What is your mortgage loan number? This helps ensure we're working with the correct account.

If you have documents like your mortgage statement or recent correspondence from your lender, you can upload them using the paperclip button and I'll extract the information automatically.`,
          timestamp: new Date()
        }
      ]);
      // Set a delay to prevent initial scroll
      setTimeout(() => setIsInitialLoad(false), 1000);
    }
  }, []);

  // Scroll to bottom of messages when new messages arrive (but not on initial load)
  useEffect(() => {
    if (!isInitialLoad && messages.length > 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isInitialLoad]);

  // Calculate completion percentage
  useEffect(() => {
    const totalFields = sections.reduce((total, section) => total + section.fields.length, 0);
    const completedFields = sections.reduce((completed, section) => 
      completed + section.fields.filter(field => 
        field.value && field.value.trim() !== '' && field.value !== 'N/A'
      ).length, 0
    );
    setCompletionPercentage(Math.round((completedFields / totalFields) * 100));
  }, [sections]);

  // Update form sections when case type changes
  useEffect(() => {
    if (caseType) {
      setSections(prevSections => 
        prevSections.map(section => {
          if (section.id === 'financial-hardship') {
            return {
              ...section,
              ubaGuideRules: [
                caseType === 'short_sale' ? UBA_GUIDE_RULES.hardshipDuration.shortSale : UBA_GUIDE_RULES.hardshipDuration.retention
              ],
              fields: section.fields.map(field => {
                if (field.id === 'hardship_duration') {
                  return {
                    ...field,
                    value: caseType === 'short_sale' ? 'Long-term' : 'Short-term',
                    ubaRule: caseType === 'short_sale' ? UBA_GUIDE_RULES.hardshipDuration.shortSale : UBA_GUIDE_RULES.hardshipDuration.retention
                  };
                }
                return field;
              })
            };
          }
          if (section.id === 'income-expenses') {
            return {
              ...section,
              ubaGuideRules: [
                caseType === 'retention' ? UBA_GUIDE_RULES.income.retention : UBA_GUIDE_RULES.income.shortSale
              ],
              fields: section.fields.map(field => {
                if (field.id === 'monthly_net_income') {
                  return {
                    ...field,
                    value: caseType === 'retention' ? 'N/A' : '',
                    required: caseType === 'short_sale',
                    ubaRule: caseType === 'retention' ? 'N/A for retention files' : UBA_GUIDE_RULES.income.shortSale
                  };
                }
                return field;
              })
            };
          }
          return section;
        })
      );
    }
  }, [caseType]);

  // AI Processing for conversational input
  const processConversationalInput = useMutation({
    mutationFn: async (input: string) => {
      // Get recent conversation history (last 10 messages)
      const recentMessages = messages.slice(-10).map(msg => ({
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp
      }));
      
      const response = await apiRequest('POST', '/api/v1/uba-forms/process-conversation', {
        message: input,
        currentFormData: formData,
        activeSection: activeSection,
        caseType: caseType,
        ubaGuideRules: UBA_GUIDE_RULES,
        conversationHistory: recentMessages
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Add AI response to conversation
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        metadata: {
          extractedData: data.extracted_data,
          confidence: data.confidence,
          nextStep: data.next_step
        }
      }]);

      // Update form data if AI extracted information
      if (data.extracted_data) {
        console.log('AI extracted data received:', data.extracted_data);
        
        // Store AI extracted data in documentExtractions with a special ID
        const aiExtractionId = `ai-conversation-${Date.now()}`;
        setDocumentExtractions(prev => ({
          ...prev,
          [aiExtractionId]: data.extracted_data
        }));
        
        // Map extracted fields to UBA form fields
        const mappingResult = mapExtractedToUbaFields(data.extracted_data);
        console.log('AI field mapping result:', mappingResult);
        
        // Update form data with mapped fields
        setFormData(prev => {
          const updated = { ...prev, ...mappingResult.mappedFields };
          console.log('Updated form data:', updated);
          return updated;
        });
        
        // Update sections with mapped data
        setSections(prevSections => 
          prevSections.map(section => ({
            ...section,
            fields: section.fields.map(field => {
              const rawValue = mappingResult.mappedFields[field.name];
              const newValue = rawValue ? (typeof rawValue === 'object' && rawValue !== null 
                ? JSON.stringify(rawValue) 
                : String(rawValue)) : field.value;
              
              if (rawValue) {
                console.log(`Updating field ${field.name}: "${field.value}" -> "${newValue}"`);
              }
              
              return {
                ...field,
                value: newValue,
                aiSuggestion: typeof data.suggestions?.[field.name] === 'object' 
                  ? JSON.stringify(data.suggestions[field.name]) 
                  : String(data.suggestions?.[field.name] || ''),
                confidence: data.confidence?.[field.name]
              };
            })
          }))
        );

        // Check if case type was determined
        if (mappingResult.mappedFields.intent) {
          setCaseType(mappingResult.mappedFields.intent === 'Sell' ? 'short_sale' : 'retention');
        }
        
        // Auto-save after AI updates the form
        setTimeout(() => autoSaveForm.mutate(), 500);
        
        // Log unmapped fields for debugging
        if (mappingResult.mappingStats.unmappedCount > 0) {
          console.log('AI unmapped fields:', mappingResult.unmappedFields);
        }
      }
      
      // Check if AI is not available
      if (data.ai_available === false) {
        toast({
          title: "AI Assistant Limited",
          description: "AI features are currently unavailable, but I can still guide you through the form.",
          variant: "default",
        });
      }

      // Check if we should prompt for document upload
      if (data.document_request) {
        setMessages(prev => [...prev, {
          id: Date.now().toString() + '-doc',
          type: 'system',
          content: `📎 Would you like to upload ${data.document_request}? This will help me fill out the form more accurately.`,
          timestamp: new Date(),
          metadata: { documentType: data.document_request }
        }]);
      }

      setIsProcessing(false);
    },
    onError: (error) => {
      console.error('Conversation processing error:', error);
      toast({
        title: "Connection Error",
        description: "Unable to connect to the server. Please check your connection and try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  });

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    // Add user message
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    }]);

    setIsProcessing(true);
    processConversationalInput.mutate(currentMessage);
    setCurrentMessage('');
  };

  // Apply UBA Guide rules to form data
  const applyUBAGuideRules = (data: Record<string, any>): Record<string, any> => {
    const updatedData = { ...data };
    
    // Rule 1: Intent Selection - Never use 'Undecided'
    if (updatedData.intent && updatedData.intent !== 'Sell' && updatedData.intent !== 'Keep') {
      updatedData.intent = ''; // Force selection
    }
    
    // Rule 2: Property Type - Default to 'My Primary Residence'
    if (!updatedData.property_type) {
      updatedData.property_type = 'My Primary Residence';
    }
    
    // Rule 3: Owner Occupied - Default to 'Yes'
    if (!updatedData.owner_occupied) {
      updatedData.owner_occupied = 'Yes';
    }
    
    // Rule 4: Phone Numbers - Home phone must be 'N/A'
    updatedData.borrower_home_phone = 'N/A';
    updatedData.coborrower_home_phone = 'N/A';
    
    // Rule 5: Email - Always 'Attorney Only'
    updatedData.borrower_email = 'Attorney Only';
    updatedData.coborrower_email = 'Attorney Only';
    
    // Rule 6: Co-borrower - All fields 'N/A' if no co-borrower
    if (updatedData.has_coborrower === 'No' || !updatedData.has_coborrower) {
      updatedData.coborrower_name = 'N/A';
      updatedData.coborrower_ssn = 'N/A';
      updatedData.coborrower_cell_phone = 'N/A';
      updatedData.coborrower_home_phone = 'N/A';
      updatedData.coborrower_email = 'Attorney Only';
    }
    
    // Rule 7: Credit Counseling - Always 'No' and 'N/A'
    updatedData.credit_counseling = 'No';
    updatedData.credit_counseling_agency = 'N/A';
    updatedData.credit_counseling_date = 'N/A';
    
    // Rule 8: Military Service - Default to 'No'
    if (!updatedData.military_service) {
      updatedData.military_service = 'No';
    }
    
    // Rule 9: Income Reporting - Based on case type
    if (caseType === 'retention') {
      updatedData.monthly_net_income = 'N/A';
    }
    
    // Rule 10: Default Assets
    if (!updatedData.checking_account_balance) {
      updatedData.checking_account_balance = '500';
    }
    if (!updatedData.total_assets) {
      updatedData.total_assets = '500';
    }
    
    // Rule 11: Hardship Duration - Based on case type
    if (caseType === 'short_sale') {
      updatedData.hardship_duration = 'Long-term';
    } else if (caseType === 'retention') {
      updatedData.hardship_duration = 'Short-term';
    }
    
    // Rule 12: Replace all empty fields with 'N/A'
    Object.keys(updatedData).forEach(key => {
      if (updatedData[key] === '' || updatedData[key] === null || updatedData[key] === undefined) {
        updatedData[key] = 'N/A';
      }
    });
    
    return updatedData;
  };

  const handleFieldChange = (sectionId: string, fieldId: string, value: string) => {
    // Update the field value
    let updatedFormData = { ...formData, [fieldId]: value };
    
    // Apply UBA rules when certain fields change
    if (fieldId === 'intent') {
      setCaseType(value === 'Sell' ? 'short_sale' : 'retention');
    }
    
    if (fieldId === 'has_coborrower' && value === 'No') {
      // Apply co-borrower rules immediately
      updatedFormData = applyUBAGuideRules(updatedFormData);
    }
    
    setSections(prevSections =>
      prevSections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              fields: section.fields.map(field =>
                field.id === fieldId ? { ...field, value: updatedFormData[fieldId] || value } : 
                { ...field, value: updatedFormData[field.id] || field.value }
              )
            }
          : section
      )
    );
    
    setFormData(updatedFormData);
    
    // Auto-save after manual field changes
    setTimeout(() => autoSaveForm.mutate(), 1000);
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const supportedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'text/plain'];
    if (!supportedTypes.includes(file.type)) {
      try {
        toast({
          title: "Unsupported File Type",
          description: `File type ${file.type} is not supported. Please upload PDF, image, or text files.`,
          variant: "destructive",
        });
      } catch (toastError) {
        console.error('Error showing unsupported file type toast:', toastError);
      }
      return;
    }

    // Validate file size (100MB limit - very generous for homeowners)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      try {
        toast({
          title: "File Too Large",
          description: `File size is ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size is 100MB.`,
          variant: "destructive",
        });
      } catch (toastError) {
        console.error('Error showing file too large toast:', toastError);
      }
      return;
    }

    const newDocument: DocumentUpload = {
      id: Date.now().toString(),
      fileName: file.name,
      fileType: file.type,
      uploadedAt: new Date(),
      processingStatus: 'processing'
    };

    setDocuments(prev => [...prev, newDocument]);

    // Add system message about document upload
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'document',
      content: `📄 Uploaded: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`,
      timestamp: new Date(),
      metadata: { fileName: file.name }
    }]);

    // Read file content
    const reader = new FileReader();
    
    // Add error handler for FileReader
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === newDocument.id 
            ? { ...doc, processingStatus: 'failed' }
            : doc
        )
      );
      
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '-reader-error',
        type: 'system',
        content: `❌ Failed to read file: ${file.name}. Please try again.`,
        timestamp: new Date()
      }]);
      
      try {
        toast({
          title: "File Read Error",
          description: "Unable to read the uploaded file. Please try again.",
          variant: "destructive",
        });
      } catch (toastError) {
        console.error('Error showing file read error toast:', toastError);
      }
    };
    
    reader.onload = async (e) => {
      // Add null checks for FileReader result
      if (!e.target?.result) {
        console.error('FileReader returned null result');
        setDocuments(prev => 
          prev.map(doc => 
            doc.id === newDocument.id 
              ? { ...doc, processingStatus: 'failed' }
              : doc
          )
        );
        
        try {
          toast({
            title: "File Read Error",
            description: "File could not be read. Please try again.",
            variant: "destructive",
          });
        } catch (toastError) {
          console.error('Error showing file read null error toast:', toastError);
        }
        return;
      }
      
      const fileContent = e.target.result as string;
      
      try {
        // Check if file content is very large and might hit limits
        const contentSizeMB = fileContent.length / 1024 / 1024;
        console.log(`File content size: ${contentSizeMB.toFixed(2)}MB`);
        
        // Client-side validation before sending to server
        if (contentSizeMB > 25) {
          throw new Error(`File too large (${contentSizeMB.toFixed(1)}MB). Maximum size is 25MB.`);
        }
        
        // Add processing indicator
        setMessages(prev => [...prev, {
          id: Date.now().toString() + '-processing',
          type: 'system',
          content: `🔄 Processing ${file.name}...`,
          timestamp: new Date()
        }]);
        
        // Process document with AI - with timeout and error handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 60000); // 60 second timeout
        
        let response;
        try {
          response = await apiRequest('POST', '/api/v1/uba-forms/process-document-simple', {
            fileName: file.name,
            fileContent: fileContent,
            fileType: file.type
          }, {
            signal: controller.signal
          });
        } finally {
          clearTimeout(timeoutId);
        }
        
        let result;
        try {
          result = await response.json();
        } catch (jsonError) {
          throw new Error('Server returned invalid response. Please try again.');
        }
        
        // Check if the response indicates an error
        if (!response.ok) {
          throw new Error(result?.error?.message || result?.message || `Server error: ${response.status}`);
        }
        
        // Update document status - with error protection
        try {
          setDocuments(prev => {
            if (!Array.isArray(prev)) {
              console.error('Documents state is not an array:', prev);
              return [{ ...newDocument, processingStatus: 'completed', extractedData: result.extractedData }];
            }
            return prev.map(doc => 
              doc.id === newDocument.id 
                ? { ...doc, processingStatus: 'completed', extractedData: result.extractedData }
                : doc
            );
          });
        } catch (docError) {
          console.error('Error updating document status:', docError);
        }

        // Remove processing indicator and add result message - with error protection
        try {
          setMessages(prev => {
            if (!Array.isArray(prev)) {
              console.error('Messages state is not an array:', prev);
              return [{
                id: Date.now().toString() + '-processed',
                type: 'ai',
                content: result.message || `Successfully processed ${file.name}`,
                timestamp: new Date(),
                metadata: { extractedData: result.extractedData }
              }];
            }
            const filtered = prev.filter(msg => !msg.content.includes(`🔄 Processing ${file.name}`));
            return [...filtered, {
              id: Date.now().toString() + '-processed',
              type: 'ai',
              content: result.message || `Successfully processed ${file.name}`,
              timestamp: new Date(),
              metadata: { extractedData: result.extractedData }
            }];
          });
        } catch (msgError) {
          console.error('Error updating messages:', msgError);
        }

        // Update form data with extracted information
        if (result.extractedData && typeof result.extractedData === 'object' && Object.keys(result.extractedData).length > 0) {
          try {
            // Store the complete extracted data for this document
            setDocumentExtractions(prev => ({
              ...prev,
              [newDocument.id]: result.extractedData
            }));

            // Map extracted fields to UBA form fields
            const mappingResult = mapExtractedToUbaFields(result.extractedData);
            console.log('Field mapping result:', mappingResult);
            
            // Only update form with mapped UBA fields
            const updatedData = { ...formData, ...mappingResult.mappedFields };
            setFormData(updatedData);
            
            // Update sections with mapped data - with error protection
            setSections(prevSections => {
              try {
                return prevSections.map(section => ({
                  ...section,
                  fields: section.fields.map(field => {
                    const newValue = updatedData[field.id] || field.value;
                    return {
                      ...field,
                      value: typeof newValue === 'object' && newValue !== null 
                        ? JSON.stringify(newValue) 
                        : String(newValue || field.value)
                    };
                  })
                }));
              } catch (sectionError) {
                console.error('Error updating sections:', sectionError);
                return prevSections; // Return unchanged if error
              }
            });
            
            // Show detailed success message
            try {
              toast({
                title: "Document Processed",
                description: `Extracted ${mappingResult.mappingStats.totalFields} fields from ${file.name}. Mapped ${mappingResult.mappingStats.mappedCount} to UBA form.`,
              });
            } catch (toastError) {
              console.error('Error showing success toast:', toastError);
            }

            // Log unmapped fields for debugging
            if (mappingResult.mappingStats.unmappedCount > 0) {
              console.log('Unmapped fields:', mappingResult.unmappedFields);
            }
          } catch (updateError) {
            console.error('Error updating form data:', updateError);
            try {
              toast({
                title: "Partial Success",
                description: `${file.name} was processed but there was an issue updating the form. Please check manually.`,
                variant: "destructive",
              });
            } catch (toastError) {
              console.error('Error showing partial success toast:', toastError);
            }
          }
        } else {
          // Even if no data extracted, still show success
          try {
            toast({
              title: "Document Uploaded",
              description: `${file.name} was processed but no extractable data was found. You can continue filling the form manually.`,
            });
          } catch (toastError) {
            console.error('Error showing upload success toast:', toastError);
          }
        }
        
      } catch (error) {
        console.error('Document processing error:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: typeof error,
          stack: error instanceof Error ? error.stack : undefined
        });
        
        // Update document status to failed - with error protection
        try {
          setDocuments(prev => {
            if (!Array.isArray(prev)) {
              console.error('Documents state is not an array in error handler:', prev);
              return [{ ...newDocument, processingStatus: 'failed' }];
            }
            return prev.map(doc => 
              doc.id === newDocument.id 
                ? { ...doc, processingStatus: 'failed' }
                : doc
            );
          });
        } catch (docError) {
          console.error('Error updating document status in error handler:', docError);
        }
        
        // Remove any processing indicator - with error protection
        try {
          setMessages(prev => {
            if (!Array.isArray(prev)) {
              console.error('Messages state is not an array in error handler:', prev);
              return [];
            }
            return prev.filter(msg => !msg.content.includes(`🔄 Processing ${file.name}`));
          });
        } catch (msgError) {
          console.error('Error filtering messages in error handler:', msgError);
        }
        
        // Provide specific error feedback
        let errorMessage = "Processing Failed";
        let description = "Please try again or enter information manually";
        
        if (error instanceof Error) {
          console.log('Analyzing error message:', error.message);
          
          if (error.name === 'AbortError' || error.message.includes('timeout')) {
            errorMessage = "Processing Timeout";
            description = "Document processing took too long. Please try with a smaller file or enter information manually.";
          } else if (error.message.includes('413') || error.message.includes('entity too large') || error.message.includes('too large')) {
            errorMessage = "File Too Large";
            description = "File size exceeds limits. Please try a smaller file or enter information manually.";
          } else if (error.message.includes('PDF_PROCESSING_ERROR') || error.message.includes('PDF')) {
            errorMessage = "PDF Processing Error";
            description = "Unable to extract text from PDF. Please ensure the PDF contains selectable text or try uploading as an image.";
          } else if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
            errorMessage = "Connection Error";
            description = "Unable to connect to processing service. Please check your connection and try again.";
          } else if (error.message.includes('Unsupported') || error.message.includes('format') || error.message.includes('Invalid')) {
            errorMessage = "File Format Error";
            description = error.message;
          } else if (error.message.includes('Server error')) {
            errorMessage = "Server Error";
            description = error.message;
          } else if (error.message) {
            description = error.message;
          }
        }
        
        // Show error message in chat - with error protection
        try {
          setMessages(prev => {
            if (!Array.isArray(prev)) {
              console.error('Messages state is not an array when adding error message:', prev);
              return [{
                id: Date.now().toString() + '-error',
                type: 'system',
                content: `❌ ${errorMessage}: ${file.name}. ${description}`,
                timestamp: new Date()
              }];
            }
            return [...prev, {
              id: Date.now().toString() + '-error',
              type: 'system',
              content: `❌ ${errorMessage}: ${file.name}. ${description}`,
              timestamp: new Date()
            }];
          });
        } catch (msgError) {
          console.error('Error adding error message to chat:', msgError);
        }

        // Show toast notification - with error protection
        try {
          toast({
            title: errorMessage,
            description: description,
            variant: "destructive",
          });
        } catch (toastError) {
          console.error('Error showing toast notification:', toastError);
        }
      }
    };
    
    // Determine how to read the file based on type
    if (file.type === 'application/pdf') {
      // Handle PDF files - convert to base64 for backend processing
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('image/')) {
      // Handle images - convert to base64
      reader.readAsDataURL(file);
    } else {
      // Handle text files
      reader.readAsText(file);
    }
  };
  
  // Helper function to determine document type
  const determineDocumentType = (fileName: string): string => {
    const lowerName = fileName.toLowerCase();
    if (lowerName.includes('uba') || lowerName.includes('710') || lowerName.includes('uniform') || lowerName.includes('applicant')) {
      return 'uba_form';
    } else if (lowerName.includes('pay') || lowerName.includes('stub') || lowerName.includes('income')) {
      return 'income_verification';
    } else if (lowerName.includes('hardship') || lowerName.includes('letter')) {
      return 'hardship_letter';
    } else if (lowerName.includes('bank') || lowerName.includes('statement')) {
      return 'financial_statement';
    } else if (lowerName.includes('tax') || lowerName.includes('w2') || lowerName.includes('1099')) {
      return 'tax_document';
    } else if (lowerName.includes('mortgage') || lowerName.includes('deed')) {
      return 'property_documents';
    }
    return 'general_document';
  };

  // Auto-save mutation (silent, no toast notifications)
  const autoSaveForm = useMutation({
    mutationFn: async () => {
      // Apply UBA rules before saving
      const finalFormData = applyUBAGuideRules(formData);
      
      // Update sections with final data
      const updatedSections = sections.map(section => ({
        ...section,
        fields: section.fields.map(field => ({
          ...field,
          value: finalFormData[field.id] || field.value
        }))
      }));
      
      const response = await apiRequest('POST', '/api/v1/uba-forms', {
        form_data: finalFormData,
        completion_percentage: completionPercentage,
        sections: updatedSections,
        case_type: caseType
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Capture the form ID when saving
      if (data.id) {
        setCurrentFormId(data.id);
      }
    },
    onError: (error) => {
      console.warn('Auto-save failed (non-blocking):', error);
      // Don't show error toast for auto-save failures to avoid annoying users
    }
  });

  const validateForm = useMutation({
    mutationFn: async () => {
      // Apply UBA rules before validation
      const finalFormData = applyUBAGuideRules(formData);
      
      const response = await apiRequest('POST', '/api/v1/uba-forms/validate', {
        form_data: finalFormData,
        case_type: caseType
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.errors.length > 0) {
        toast({
          title: "Validation Errors",
          description: `Found ${data.errors.length} errors. Please review and correct them.`,
          variant: "destructive",
        });
        
        // Update sections with validation errors
        setSections(prevSections =>
          prevSections.map(section => ({
            ...section,
            validationErrors: data.errors.filter((error: string) => 
              section.fields.some(field => error.includes(field.label))
            )
          }))
        );
      } else {
        toast({
          title: "Validation Successful",
          description: "Your form passes all validation checks and UBA Guide rules!",
        });
      }
    }
  });

  const [, navigate] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const transactionId = urlParams.get('transactionId');

  // Export all extracted data as JSON
  const exportExtractedData = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      formId: currentFormId,
      caseType: caseType,
      completionPercentage: completionPercentage,
      ubaFormData: formData,
      documentExtractions: documentExtractions,
      mappingSummary: Object.entries(documentExtractions).reduce((acc, [docId, data]) => {
        const result = mapExtractedToUbaFields(data);
        acc[docId] = {
          source: docId.startsWith('ai-conversation-') ? 'AI Conversation' : documents.find(d => d.id === docId)?.fileName || 'Unknown',
          stats: result.mappingStats,
          mappedFields: Object.keys(result.mappedFields),
          unmappedFields: Object.keys(result.unmappedFields)
        };
        return acc;
      }, {} as Record<string, any>)
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uba-form-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Data Exported",
      description: "All extracted data has been exported as JSON",
    });
  };

  // Export UBA form to Fannie Mae Form 710 PDF
  const exportToFannieMae710 = async () => {
    // First, ensure the form is saved
    if (!currentFormId) {
      toast({
        title: "Saving form...",
        description: "Please wait while we save your form data.",
      });
      
      // Trigger auto-save and wait for it
      try {
        await autoSaveForm.mutateAsync();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save form. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsExporting(true);
    try {
      // Get auth token for the request
      const authToken = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {};
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

      const response = await fetch(`/api/v1/uba-forms/export/${currentFormId}/fannie_mae_710`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Create a download link
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fannie_mae_form_710_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Fannie Mae Form 710 PDF has been downloaded",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export form to PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="container max-w-7xl mx-auto p-6 space-y-6 min-h-screen">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/')}
          className="px-2"
        >
          <Home className="w-4 h-4 mr-1" />
          Dashboard
        </Button>
        <span>/</span>
        {transactionId && (
          <>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(`/transactions/${transactionId}`)}
              className="px-2"
            >
              Transaction
            </Button>
            <span>/</span>
          </>
        )}
        <span className="font-medium text-foreground">UBA Form Maker</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {transactionId && (
            <Button 
              variant="outline" 
              onClick={() => navigate(`/transactions/${transactionId}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Transaction
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold">UBA Form Maker</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Progress:</span>
            <Progress value={completionPercentage} className="w-32" />
            <span className="text-sm font-medium">{completionPercentage}%</span>
          </div>
          <Button
            variant="outline"
            onClick={() => validateForm.mutate()}
            disabled={validateForm.isPending}
          >
            Validate
          </Button>
          {currentFormId && completionPercentage >= 70 && (
            <Button
              variant="outline"
              onClick={() => exportToFannieMae710()}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 mr-2" />
                  Export to Form 710
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="conversation">
            <MessageSquare className="w-4 h-4 mr-2" />
            Conversation
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="form">
            <FileText className="w-4 h-4 mr-2" />
            Form View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversation" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Conversation Panel */}
            <div className="lg:col-span-8">
              <Card className="h-[60vh] min-h-[400px] max-h-[600px] flex flex-col relative">
                <CardHeader className="pb-3 flex-shrink-0">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5" />
                      AI Assistant
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDataPreview(!showDataPreview)}
                    >
                      {showDataPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    I'll help you complete your BFS/UBA form step by step
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0 min-h-0">
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4 min-h-0">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.type === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`flex gap-3 max-w-[85%] ${
                              message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                            }`}
                          >
                            <div className="flex-shrink-0">
                              {message.type === 'user' ? (
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                  <User className="w-4 h-4 text-primary-foreground" />
                                </div>
                              ) : message.type === 'ai' ? (
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                                  <Bot className="w-4 h-4 text-white" />
                                </div>
                              ) : message.type === 'document' ? (
                                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                  <Paperclip className="w-4 h-4 text-white" />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                  <Info className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div
                              className={`px-4 py-2 rounded-lg ${
                                message.type === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : message.type === 'system'
                                  ? 'bg-muted border border-border'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              <div className="text-xs opacity-70 mt-1">
                                {format(message.timestamp, 'h:mm a')}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {isProcessing && (
                        <div className="flex justify-start">
                          <div className="flex gap-3 max-w-[85%]">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                              <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-muted px-4 py-2 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Thinking...</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input Area */}
                  <div className="p-4 border-t flex-shrink-0">
                    <div className="flex gap-2">
                      <Input
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        placeholder="Type your response..."
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        onFocus={(e) => {
                          // Prevent viewport jumping on mobile devices
                          e.target.style.transform = 'translateZ(0)';
                        }}
                        onBlur={(e) => {
                          e.target.style.transform = '';
                        }}
                        disabled={isProcessing}
                        className="flex-1"
                      />
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={handleDocumentUpload}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        disabled={isProcessing}
                      >
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Button 
                        onClick={handleSendMessage} 
                        disabled={isProcessing || !currentMessage.trim()}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Data Preview Sidebar */}
            {showDataPreview && (
              <div className="lg:col-span-4">
                <div className="space-y-4">
                  {/* Current Data Preview */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {dataViewMode === 'uba' ? 'Current Form Data' : 'All Extracted Data'}
                          </CardTitle>
                          <CardDescription>
                            {dataViewMode === 'uba' 
                              ? 'Data mapped to UBA form fields' 
                              : 'All data extracted from documents'}
                          </CardDescription>
                        </div>
                        {Object.keys(documentExtractions).length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={exportExtractedData}
                            title="Export all extracted data as JSON"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-3">
                          {dataViewMode === 'uba' ? (
                            // Show only UBA form data
                            Object.entries(formData).map(([key, value]) => (
                              <div key={key} className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Label>
                                <div className="text-sm font-medium">
                                  {typeof value === 'object' && value !== null 
                                    ? JSON.stringify(value, null, 2) 
                                    : (value || 'Not provided')
                                  }
                                </div>
                              </div>
                            ))
                          ) : (
                            // Show all extracted data from all documents
                            <>
                              {Object.keys(documentExtractions).length === 0 ? (
                                <div className="text-sm text-muted-foreground text-center py-4">
                                  No documents uploaded yet
                                </div>
                              ) : (
                                Object.entries(documentExtractions).map(([docId, extractedData]) => {
                                  const doc = documents.find(d => d.id === docId);
                                  const mappingResult = mapExtractedToUbaFields(extractedData);
                                  const isAiExtraction = docId.startsWith('ai-conversation-');
                                  
                                  return (
                                    <div key={docId} className="space-y-2 pb-4 border-b last:border-0">
                                      <Label className="text-sm font-semibold text-primary">
                                        {isAiExtraction ? '💬 AI Conversation' : doc?.fileName || 'Unknown Document'}
                                      </Label>
                                      
                                      {/* Mapping Summary */}
                                      <div className="bg-muted p-2 rounded text-xs">
                                        <div className="flex justify-between">
                                          <span>Total Fields: {mappingResult.mappingStats.totalFields}</span>
                                          <span className="text-green-600">Mapped: {mappingResult.mappingStats.mappedCount}</span>
                                          <span className="text-orange-600">Unmapped: {mappingResult.mappingStats.unmappedCount}</span>
                                        </div>
                                      </div>
                                      
                                      {/* Mapped Fields */}
                                      {Object.keys(mappingResult.mappedFields).length > 0 && (
                                        <div className="space-y-1">
                                          <Label className="text-xs font-medium text-green-600">✓ Mapped to UBA Form</Label>
                                          {Object.entries(extractedData).map(([key, value]) => {
                                            const normalizedKey = key.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
                                            const mappedField = Object.entries(UBA_FIELD_MAPPINGS).find(([k, v]) => k === normalizedKey)?.[1];
                                            if (!mappedField && !Object.values(mappingResult.mappedFields).includes(value)) return null;
                                            
                                            return (
                                              <div key={`${docId}-${key}`} className="space-y-1 pl-4">
                                                <Label className="text-xs text-muted-foreground">
                                                  {key} → {mappedField || 'auto-mapped'}
                                                </Label>
                                                <div className="text-sm font-medium">
                                                  {typeof value === 'object' && value !== null 
                                                    ? JSON.stringify(value, null, 2) 
                                                    : (value || 'Not provided')
                                                  }
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                      
                                      {/* Unmapped Fields */}
                                      {Object.keys(mappingResult.unmappedFields).length > 0 && (
                                        <div className="space-y-1">
                                          <Label className="text-xs font-medium text-orange-600">⚠ Not Mapped</Label>
                                          {Object.entries(mappingResult.unmappedFields).map(([key, value]) => (
                                            <div key={`${docId}-unmapped-${key}`} className="space-y-1 pl-4">
                                              <Label className="text-xs text-muted-foreground">
                                                {key}
                                              </Label>
                                              <div className="text-sm font-medium">
                                                {typeof value === 'object' && value !== null 
                                                  ? JSON.stringify(value, null, 2) 
                                                  : (value || 'Not provided')
                                                }
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* UBA Guide Rules */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        UBA Guide Rules
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {sections
                          .find(s => s.id === activeSection)
                          ?.ubaGuideRules?.map((rule, index) => (
                            <Alert key={index}>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="text-xs">
                                {rule}
                              </AlertDescription>
                            </Alert>
                          ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Document Uploads */}
                  {documents.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Uploaded Documents</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {documents.map(doc => (
                            <div key={doc.id} className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="truncate">{doc.fileName}</span>
                                <Badge variant={
                                  doc.processingStatus === 'completed' ? 'default' :
                                  doc.processingStatus === 'processing' ? 'secondary' :
                                  'outline'
                                }>
                                  {doc.processingStatus}
                                </Badge>
                              </div>
                              {doc.processingStatus === 'completed' && documentExtractions[doc.id] && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full text-xs"
                                  onClick={() => {
                                    setDataViewMode(dataViewMode === 'uba' ? 'all' : 'uba');
                                  }}
                                >
                                  {dataViewMode === 'uba' ? 'Show All Extracted Data' : 'Show Only UBA Fields'}
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Preview</CardTitle>
              <CardDescription>
                Review all the information collected so far
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {sections.map(section => {
                  const sectionData = section.fields.filter(f => f.value && f.value !== 'N/A');
                  if (sectionData.length === 0) return null;

                  return (
                    <div key={section.id} className="space-y-3">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        {section.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-500" />
                        )}
                        {section.title}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {section.fields.map(field => {
                          if (!field.value || field.value === 'N/A') return null;
                          return (
                            <div key={field.id} className="space-y-1">
                              <Label className="text-sm text-muted-foreground">
                                {field.label}
                              </Label>
                              <div className="text-sm font-medium">
                                {typeof field.value === 'object' && field.value !== null 
                                  ? JSON.stringify(field.value, null, 2) 
                                  : field.value
                                }
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form" className="mt-6">
          <div className="space-y-6">
            {sections.map((section) => (
              <Card key={section.id}>
                <CardHeader>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {section.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                      )}
                      {section.title}
                    </CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                    {section.validationErrors && section.validationErrors.length > 0 && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Validation Errors:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {section.validationErrors.map((error, index) => (
                            <li key={index} className="text-sm">{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {section.fields.map((field) => (
                        <div key={field.id} className="space-y-2">
                          <Label htmlFor={field.id}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          {field.type === 'select' ? (
                            <Select
                              value={field.value}
                              onValueChange={(value) => handleFieldChange(section.id, field.id, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options?.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : field.type === 'textarea' ? (
                            <Textarea
                              id={field.id}
                              value={field.value}
                              onChange={(e) => handleFieldChange(section.id, field.id, e.target.value)}
                              placeholder={field.placeholder}
                              rows={3}
                            />
                          ) : (
                            <Input
                              id={field.id}
                              type={field.type === 'currency' ? 'number' : field.type}
                              value={field.value}
                              onChange={(e) => handleFieldChange(section.id, field.id, e.target.value)}
                              placeholder={field.placeholder}
                            />
                          )}
                          {field.aiSuggestion && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              AI: {typeof field.aiSuggestion === 'object' && field.aiSuggestion !== null 
                                ? JSON.stringify(field.aiSuggestion) 
                                : field.aiSuggestion
                              }
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </ErrorBoundary>
  );
};

export default UBAFormMakerEnhanced;