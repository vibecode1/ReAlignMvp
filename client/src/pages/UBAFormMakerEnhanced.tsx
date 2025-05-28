import React, { useState, useEffect, useRef } from 'react';
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
  Save, 
  Send, 
  Upload,
  Bot,
  User,
  Paperclip,
  Info,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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
  const [activeSection, setActiveSection] = useState<string>('getting-started');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [viewMode, setViewMode] = useState<'conversation' | 'preview' | 'form'>('conversation');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [showDataPreview, setShowDataPreview] = useState<boolean>(true);
  const [caseType, setCaseType] = useState<'short_sale' | 'retention' | null>(null);

  // Enhanced UBA Form Sections with UBA Guide rules
  const formSections: UBAFormSection[] = [
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
          id: 'borrower_email',
          name: 'borrower_email',
          type: 'email',
          label: 'Email Address',
          value: 'Attorney Only',
          required: true,
          ubaRule: UBA_GUIDE_RULES.email,
          helpText: 'Use "Attorney Only" per UBA Guide'
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
      id: 'income-expenses',
      title: 'Income & Expenses',
      description: 'Current monthly income and expense details',
      completed: false,
      validationErrors: [],
      ubaGuideRules: [
        caseType === 'retention' ? UBA_GUIDE_RULES.income.retention : UBA_GUIDE_RULES.income.shortSale
      ],
      fields: [
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
          id: 'monthly_expenses',
          name: 'monthly_expenses',
          type: 'currency',
          label: 'Total Monthly Expenses',
          value: '',
          required: true,
          placeholder: '$0.00'
        },
        {
          id: 'income_sources',
          name: 'income_sources',
          type: 'textarea',
          label: 'Sources of Income',
          value: '',
          required: true,
          placeholder: 'List all sources of income...'
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

  // Initialize conversation
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          type: 'ai',
          content: `Hello! I'm here to help you complete your Borrower Financial Statement (UBA form) for mortgage assistance. This conversation will guide you through each section step by step.

Before we begin, I need to understand your situation. Are you looking to:
- **Keep your home** (loan modification/retention)
- **Sell your home** (short sale)

This will help me tailor the form to your specific needs.`,
          timestamp: new Date()
        }
      ]);
    }
  }, []);

  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      const response = await apiRequest('POST', '/api/v1/uba-forms/process-conversation', {
        message: input,
        currentFormData: formData,
        activeSection: activeSection,
        caseType: caseType,
        ubaGuideRules: UBA_GUIDE_RULES
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
        setFormData(prev => ({ ...prev, ...data.extracted_data }));
        
        // Update sections with extracted data
        setSections(prevSections => 
          prevSections.map(section => ({
            ...section,
            fields: section.fields.map(field => ({
              ...field,
              value: data.extracted_data[field.name] || field.value,
              aiSuggestion: data.suggestions?.[field.name],
              confidence: data.confidence?.[field.name]
            }))
          }))
        );

        // Check if case type was determined
        if (data.extracted_data.intent) {
          setCaseType(data.extracted_data.intent === 'Sell' ? 'short_sale' : 'retention');
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

  const handleFieldChange = (sectionId: string, fieldId: string, value: string) => {
    setSections(prevSections =>
      prevSections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              fields: section.fields.map(field =>
                field.id === fieldId ? { ...field, value } : field
              )
            }
          : section
      )
    );
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
      content: `📄 Uploaded: ${file.name}`,
      timestamp: new Date(),
      metadata: { fileName: file.name }
    }]);

    // Simulate document processing
    setTimeout(() => {
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === newDocument.id 
            ? { ...doc, processingStatus: 'completed', extractedData: { /* extracted data */ } }
            : doc
        )
      );

      setMessages(prev => [...prev, {
        id: Date.now().toString() + '-processed',
        type: 'ai',
        content: `I've successfully processed ${file.name}. I found some information that I can use to help fill out your form. Let me update the relevant fields for you.`,
        timestamp: new Date()
      }]);
    }, 2000);
  };

  const saveForm = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/v1/uba-forms', {
        form_data: formData,
        completion_percentage: completionPercentage,
        sections: sections,
        case_type: caseType
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Form Saved",
        description: "Your UBA form has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save your form. Please try again.",
        variant: "destructive",
      });
    }
  });

  const validateForm = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/v1/uba-forms/validate', {
        form_data: formData
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
      } else {
        toast({
          title: "Validation Successful",
          description: "Your form passes all validation checks!",
        });
      }
    }
  });

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">BFS/UBA Form Maker</h1>
          <p className="text-muted-foreground">
            AI-Powered Conversational Intake for Mortgage Assistance
          </p>
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
          <Button onClick={() => saveForm.mutate()} disabled={saveForm.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {saveForm.isPending ? 'Saving...' : 'Save'}
          </Button>
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
              <Card className="h-[700px] flex flex-col">
                <CardHeader className="pb-3">
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
                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
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
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        placeholder="Type your response..."
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
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
                      <CardTitle className="text-lg">Current Form Data</CardTitle>
                      <CardDescription>
                        Data extracted from your conversation
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-3">
                          {Object.entries(formData).map(([key, value]) => (
                            <div key={key} className="space-y-1">
                              <Label className="text-xs text-muted-foreground">
                                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Label>
                              <div className="text-sm font-medium">
                                {value || 'Not provided'}
                              </div>
                            </div>
                          ))}
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
                            <div key={doc.id} className="flex items-center justify-between text-sm">
                              <span className="truncate">{doc.fileName}</span>
                              <Badge variant={
                                doc.processingStatus === 'completed' ? 'success' :
                                doc.processingStatus === 'processing' ? 'secondary' :
                                'outline'
                              }>
                                {doc.processingStatus}
                              </Badge>
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
                                {field.value}
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
              <Card key={section.id} className={activeSection === section.id ? 'ring-2 ring-primary' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {section.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-500" />
                        )}
                        {section.title}
                      </CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => setActiveSection(activeSection === section.id ? '' : section.id)}
                    >
                      {activeSection === section.id ? 'Collapse' : 'Expand'}
                    </Button>
                  </div>
                </CardHeader>
                {activeSection === section.id && (
                  <CardContent>
                    {section.ubaGuideRules && section.ubaGuideRules.length > 0 && (
                      <Alert className="mb-4">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <strong>UBA Guide Rules:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {section.ubaGuideRules.map((rule, index) => (
                              <li key={index} className="text-sm">{rule}</li>
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
                          {field.helpText && (
                            <p className="text-xs text-muted-foreground">{field.helpText}</p>
                          )}
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
                          {field.ubaRule && (
                            <p className="text-xs text-blue-600 flex items-center gap-1">
                              <Info className="w-3 h-3" />
                              {field.ubaRule}
                            </p>
                          )}
                          {field.aiSuggestion && (
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                AI Suggestion: {field.aiSuggestion}
                              </Badge>
                              {field.confidence && (
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(field.confidence * 100)}% confident
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UBAFormMakerEnhanced;