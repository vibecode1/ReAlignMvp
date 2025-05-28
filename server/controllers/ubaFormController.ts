
import { Request, Response } from 'express';
import { storage } from '../storage';
import { AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';
import { aiService } from '../services/aiService';

// Schema for UBA form data
const CreateUbaFormDataSchema = z.object({
  transaction_id: z.string().uuid(),
  borrower_name: z.string().optional(),
  borrower_ssn: z.string().optional(),
  property_address: z.string().optional(),
  loan_number: z.string().optional(),
  monthly_gross_income: z.number().int().optional(),
  monthly_expenses: z.number().int().optional(),
  liquid_assets: z.number().int().optional(),
  total_debt: z.number().int().optional(),
  hardship_type: z.string().optional(),
  hardship_date: z.string().optional(),
  hardship_description: z.string().optional(),
  hardship_duration_expected: z.string().optional(),
  assistance_type_requested: z.array(z.string()).optional(),
  preferred_payment_amount: z.number().int().optional(),
  form_completion_percentage: z.number().int().min(0).max(100).optional(),
  last_section_completed: z.string().optional(),
  validation_errors: z.string().optional(),
  ai_generated_suggestions: z.string().optional(),
  ai_confidence_scores: z.string().optional(),
});

const UpdateUbaFormDataSchema = CreateUbaFormDataSchema.partial().omit({ transaction_id: true });

const UbaDocumentAttachmentSchema = z.object({
  document_type: z.enum(['income_verification', 'hardship_letter', 'financial_statement', 'property_documents', 'correspondence']),
  required_by_uba: z.boolean().default(false),
  document_title: z.string().min(1, 'Document title is required'),
  file_url: z.string().url('Valid file URL is required'),
  file_name: z.string().min(1, 'File name is required'),
  file_size_bytes: z.number().int().positive('File size must be positive'),
  content_type: z.string().min(1, 'Content type is required'),
  processing_status: z.enum(['pending', 'processed', 'failed']).default('pending'),
  extraction_confidence: z.number().int().min(0).max(100).optional(),
  extracted_data: z.string().optional(),
  uba_compliance_check: z.string().optional(),
  meets_uba_requirements: z.boolean().optional(),
});

// Schema for UBA form creation
const CreateUBAFormSchema = z.object({
  form_data: z.record(z.any()),
  completion_percentage: z.number().min(0).max(100),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    completed: z.boolean(),
    fields: z.array(z.object({
      id: z.string(),
      name: z.string(),
      value: z.string(),
      required: z.boolean()
    }))
  }))
});

// Schema for conversation processing
const ProcessConversationSchema = z.object({
  message: z.string().min(1),
  currentFormData: z.record(z.any()).optional(),
  activeSection: z.string().optional(),
  caseType: z.enum(['short_sale', 'retention']).nullable().optional(),
  ubaGuideRules: z.record(z.any()).optional()
});

export const ubaFormController = {
  /**
   * Create new UBA form data (legacy method)
   */
  async createUbaForm(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      const validation = CreateUbaFormDataSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid UBA form data',
            details: validation.error.errors,
          }
        });
      }

      const formData = {
        user_id: req.user.id,
        ...validation.data,
      };

      const ubaForm = await storage.createUbaFormData(formData);

      return res.status(201).json(ubaForm);
    } catch (error) {
      console.error('Create UBA form error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to create UBA form',
        }
      });
    }
  },

  /**
   * Get UBA form data by transaction (legacy method)
   */
  async getUbaForm(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      const { transactionId } = req.params;

      const ubaForm = await storage.getUbaFormData(transactionId, req.user.id);

      if (!ubaForm) {
        return res.status(404).json({
          error: {
            code: 'UBA_FORM_NOT_FOUND',
            message: 'UBA form not found for this transaction',
          }
        });
      }

      return res.status(200).json(ubaForm);
    } catch (error) {
      console.error('Get UBA form error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve UBA form',
        }
      });
    }
  },

  /**
   * Update UBA form data (legacy method)
   */
  async updateUbaForm(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      const { formId } = req.params;

      const validation = UpdateUbaFormDataSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid UBA form data',
            details: validation.error.errors,
          }
        });
      }

      const updatedForm = await storage.updateUbaFormData(
        formId,
        req.user.id,
        validation.data
      );

      if (!updatedForm) {
        return res.status(404).json({
          error: {
            code: 'UBA_FORM_NOT_FOUND',
            message: 'UBA form not found or access denied',
          }
        });
      }

      return res.status(200).json(updatedForm);
    } catch (error) {
      console.error('Update UBA form error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to update UBA form',
        }
      });
    }
  },

  /**
   * Add document attachment to UBA form
   */
  async addDocumentAttachment(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      const { formId } = req.params;

      const validation = UbaDocumentAttachmentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid document attachment data',
            details: validation.error.errors,
          }
        });
      }

      const attachmentData = {
        uba_form_data_id: formId,
        ...validation.data,
      };

      const attachment = await storage.createUbaDocumentAttachment(attachmentData);

      return res.status(201).json(attachment);
    } catch (error) {
      console.error('Add UBA document attachment error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to add document attachment',
        }
      });
    }
  },

  /**
   * Get UBA form validation status
   */
  async getFormValidationStatus(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      const { formId } = req.params;

      const validationStatus = await storage.getUbaFormValidationStatus(formId, req.user.id);

      if (!validationStatus) {
        return res.status(404).json({
          error: {
            code: 'UBA_FORM_NOT_FOUND',
            message: 'UBA form not found or access denied',
          }
        });
      }

      return res.status(200).json(validationStatus);
    } catch (error) {
      console.error('Get UBA form validation status error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve form validation status',
        }
      });
    }
  },

  /**
   * Create or update a UBA form (new method)
   */
  async createForm(req: AuthenticatedRequest, res: Response) {
    try {
      const validation = CreateUBAFormSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid form data',
            details: validation.error.errors,
          }
        });
      }

      const { form_data, completion_percentage, sections } = validation.data;

      // Create UBA form record
      const formId = await storage.createUBAForm({
        user_id: req.user!.id,
        form_data: JSON.stringify(form_data),
        completion_percentage,
        status: completion_percentage === 100 ? 'completed' : 'in_progress'
      });

      // Log the workflow event
      await storage.logWorkflowEvent({
        user_id: req.user!.id,
        event_type: 'form_field_filled',
        event_category: 'uba_form',
        event_name: 'uba_form_saved',
        event_description: `UBA form saved with ${completion_percentage}% completion`,
        success_indicator: true,
        uba_form_section: sections.find(s => s.completed)?.id,
        event_metadata: JSON.stringify({ 
          completion_percentage, 
          sections_completed: sections.filter(s => s.completed).length 
        })
      });

      return res.status(201).json({
        id: formId,
        message: 'UBA form saved successfully',
        completion_percentage
      });
    } catch (error) {
      console.error('Create UBA form error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to save UBA form',
        }
      });
    }
  },

  /**
   * Get UBA forms for the authenticated user
   */
  async getForms(req: AuthenticatedRequest, res: Response) {
    try {
      const forms = await storage.getUBAFormsByUserId(req.user!.id);
      
      return res.status(200).json(forms);
    } catch (error) {
      console.error('Get UBA forms error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve UBA forms',
        }
      });
    }
  },

  /**
   * Get a specific UBA form by ID
   */
  async getForm(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const form = await storage.getUBAFormById(id);
      if (!form) {
        return res.status(404).json({
          error: {
            code: 'FORM_NOT_FOUND',
            message: 'UBA form not found',
          }
        });
      }

      // Check ownership
      if (form.user_id !== req.user!.id) {
        return res.status(403).json({
          error: {
            code: 'ACCESS_DENIED',
            message: 'You can only access your own forms',
          }
        });
      }

      return res.status(200).json(form);
    } catch (error) {
      console.error('Get UBA form error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve UBA form',
        }
      });
    }
  },

  /**
   * Process conversational input using AI
   */
  async processConversation(req: AuthenticatedRequest, res: Response) {
    try {
      const validation = ProcessConversationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid conversation input',
            details: validation.error.errors,
          }
        });
      }

      const { message, currentFormData = {}, activeSection, caseType, ubaGuideRules } = validation.data;

      // Create UBA-specific prompt for AI with UBA Guide rules
      const systemPrompt = `You are an expert assistant helping users complete a Borrower Financial Statement (UBA form) for mortgage assistance. You MUST follow UBA Guide rules strictly.

CRITICAL UBA GUIDE RULES:
${JSON.stringify(ubaGuideRules, null, 2)}

Your role is to:
1. Guide users through form completion in a conversational manner
2. Extract structured data from their responses
3. Apply UBA Guide rules automatically (e.g., default values, N/A fields)
4. Provide helpful suggestions and clarifications
5. Ensure all required fields are properly filled according to UBA guidelines

Current case type: ${caseType || 'not determined'}
Current form data: ${JSON.stringify(currentFormData)}
Active section: ${activeSection || 'none'}

IMPORTANT BEHAVIORS:
- When user indicates they want to keep their home, set intent="Keep" and case_type="retention"
- When user indicates they want to sell their home, set intent="Sell" and case_type="short_sale"
- Apply appropriate income reporting rules based on case type
- Set hardship duration based on case type (short sale = Long-term, retention = Short-term)
- Default property_type to "My Primary Residence" unless user specifies otherwise
- Default owner_occupied to "Yes" unless user mentions renting/leasing
- Use "N/A" for all blank fields, never leave empty
- For email, always use "Attorney Only"
- For home phone, always use "N/A"
- If no co-borrower, set all co-borrower fields to "N/A"

User message: "${message}"

Respond with JSON containing:
- response: conversational text that guides the user naturally
- extracted_data: object with field names and values (apply UBA rules)
- suggestions: object with field suggestions
- confidence: object with confidence scores (0-1)
- next_step: what section or field to focus on next
- document_request: if documents would help (e.g., "recent pay stubs", "tax returns")

Keep responses natural and conversational while ensuring UBA compliance.`;

      const startTime = Date.now();
      
      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY) {
        console.error('OpenAI API key is not configured');
        
        // Return a helpful response without AI
        return res.status(200).json({
          response: `I understand you're trying to ${caseType === 'short_sale' ? 'sell' : 'keep'} your home. While I can't process your request with AI assistance right now due to missing configuration, I can guide you through the form manually.

Let's start with your basic information. What's your full legal name?`,
          extracted_data: {},
          suggestions: {},
          confidence: {},
          next_step: 'borrower-info',
          document_request: null,
          ai_available: false
        });
      }
      
      // Process with AI
      const aiResponse = await aiService.generateRecommendation({
        userId: req.user!.id,
        contextRecipeId: 'uba_form_completion_v1',
        userInput: message,
        additionalContext: {
          currentFormData,
          activeSection,
          caseType,
          ubaGuideRules,
          systemPrompt
        }
      });

      const executionTime = Date.now() - startTime;

      // Parse AI response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(aiResponse.content);
      } catch (parseError) {
        // Fallback if AI doesn't return valid JSON
        parsedResponse = {
          response: aiResponse.content,
          extracted_data: {},
          suggestions: {},
          confidence: {},
          next_step: null,
          document_request: null
        };
      }

      // Apply UBA Guide rules to extracted data
      if (parsedResponse.extracted_data) {
        // Apply email rule
        if ('borrower_email' in parsedResponse.extracted_data) {
          parsedResponse.extracted_data.borrower_email = 'Attorney Only';
        }
        
        // Apply home phone rule
        if ('borrower_home_phone' in parsedResponse.extracted_data) {
          parsedResponse.extracted_data.borrower_home_phone = 'N/A';
        }
        
        // Apply co-borrower rules if no co-borrower
        if (parsedResponse.extracted_data.has_coborrower === 'No') {
          parsedResponse.extracted_data.coborrower_name = 'N/A';
          parsedResponse.extracted_data.coborrower_ssn = 'N/A';
        }
        
        // Apply case type specific rules
        if (caseType === 'retention') {
          parsedResponse.extracted_data.monthly_net_income = 'N/A';
          parsedResponse.extracted_data.hardship_duration = 'Short-term';
        } else if (caseType === 'short_sale') {
          parsedResponse.extracted_data.hardship_duration = 'Long-term';
        }
        
        // Apply default assets rule
        if (!currentFormData.checking_account_balance) {
          parsedResponse.extracted_data.checking_account_balance = '500';
        }
        if (!currentFormData.total_assets) {
          parsedResponse.extracted_data.total_assets = '500';
        }
      }

      // Log the AI interaction
      await storage.logWorkflowEvent({
        user_id: req.user!.id,
        event_type: 'ai_recommendation_generated',
        event_category: 'uba_form',
        event_name: 'conversation_processed',
        event_description: 'AI processed user input for UBA form completion',
        success_indicator: true,
        ai_model_used: 'gpt-4',
        ai_prompt_tokens: aiResponse.prompt_tokens,
        ai_completion_tokens: aiResponse.completion_tokens,
        execution_time_ms: executionTime,
        uba_form_section: activeSection,
        event_metadata: JSON.stringify({ 
          user_message_length: message.length,
          extracted_fields: Object.keys(parsedResponse.extracted_data || {}).length,
          case_type: caseType
        })
      });

      return res.status(200).json(parsedResponse);
    } catch (error) {
      console.error('Process conversation error:', error);
      
      // Log the error
      await storage.logWorkflowEvent({
        user_id: req.user!.id,
        event_type: 'ai_recommendation_generated',
        event_category: 'uba_form',
        event_name: 'conversation_processing_failed',
        event_description: 'Failed to process conversation with AI',
        success_indicator: false,
        error_details: JSON.stringify({ message: error instanceof Error ? error.message : 'Unknown error' }),
        event_severity: 'error'
      });

      return res.status(500).json({
        error: {
          code: 'AI_PROCESSING_ERROR',
          message: 'Failed to process conversation with AI',
        }
      });
    }
  },

  /**
   * Validate UBA form data
   */
  async validateForm(req: AuthenticatedRequest, res: Response) {
    try {
      const { form_data } = req.body;

      // UBA validation rules based on UBA Guide
      const validationResults = {
        errors: [] as string[],
        warnings: [] as string[],
        completeness: 0,
        missing_required: [] as string[]
      };

      const requiredFields = [
        'borrower_name',
        'borrower_ssn', 
        'borrower_phone',
        'property_address',
        'mortgage_balance',
        'monthly_payment',
        'hardship_type',
        'hardship_description',
        'monthly_income',
        'monthly_expenses'
      ];

      // Check required fields
      for (const field of requiredFields) {
        if (!form_data[field] || form_data[field].toString().trim() === '') {
          validationResults.missing_required.push(field);
        }
      }

      // Calculate completeness
      const completedRequired = requiredFields.length - validationResults.missing_required.length;
      validationResults.completeness = Math.round((completedRequired / requiredFields.length) * 100);

      // Field-specific validations
      if (form_data.borrower_ssn && !/^\d{3}-?\d{2}-?\d{4}$/.test(form_data.borrower_ssn)) {
        validationResults.errors.push('SSN must be in format XXX-XX-XXXX');
      }

      if (form_data.borrower_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form_data.borrower_email)) {
        validationResults.errors.push('Invalid email format');
      }

      // Financial validations
      if (form_data.monthly_income && form_data.monthly_expenses) {
        const income = parseFloat(form_data.monthly_income);
        const expenses = parseFloat(form_data.monthly_expenses);
        if (expenses > income * 1.5) {
          validationResults.warnings.push('Monthly expenses significantly exceed income - this may require additional documentation');
        }
      }

      // Log validation event
      await storage.logWorkflowEvent({
        user_id: req.user!.id,
        event_type: 'validation_performed',
        event_category: 'uba_form',
        event_name: 'form_validated',
        event_description: `UBA form validation completed with ${validationResults.completeness}% completeness`,
        success_indicator: validationResults.errors.length === 0,
        uba_validation_result: JSON.stringify(validationResults),
        event_metadata: JSON.stringify({
          errors_count: validationResults.errors.length,
          warnings_count: validationResults.warnings.length,
          missing_fields_count: validationResults.missing_required.length
        })
      });

      return res.status(200).json(validationResults);
    } catch (error) {
      console.error('Validate UBA form error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to validate UBA form',
        }
      });
    }
  }
};
