import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';
import { storage } from '../storage';
import { documentChecklistService } from '../services/documentChecklistService';
import { aiService } from '../services/aiService';
import { workflowLogger } from '../services/workflowLogger';

// Schemas
const GenerateChecklistSchema = z.object({
  transaction_id: z.string().uuid(),
  lender_name: z.string().optional(),
  case_type: z.enum([
    'short_sale',
    'loan_modification',
    'forbearance',
    'repayment_plan',
    'deed_in_lieu',
    'payment_deferral'
  ]),
  property_type: z.enum([
    'primary_residence',
    'second_home',
    'investment_property'
  ]),
  employment_status: z.enum([
    'w2_employed',
    'self_employed',
    'retired',
    'unemployed',
    'other'
  ]).optional(),
  hardship_type: z.string().optional(),
  delinquency_status: z.string().optional(),
  bankruptcy_status: z.enum(['none', 'chapter_7', 'chapter_13', 'discharged']).optional(),
  military_status: z.enum(['none', 'active_duty', 'veteran', 'pcs_orders']).optional(),
  has_rental_income: z.boolean().optional(),
  has_coborrower: z.boolean().optional(),
  uba_form_data: z.record(z.any()).optional()
});

const UpdateChecklistItemSchema = z.object({
  status: z.enum([
    'not_started',
    'uploaded',
    'ai_verified',
    'expert_approved',
    'rejected',
    'needs_attention'
  ]).optional(),
  uploaded_document_id: z.string().uuid().optional(),
  rejection_reason: z.string().optional(),
  notes: z.string().optional()
});

const CreateTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  lender_id: z.string().uuid().optional(),
  case_type: z.string().optional(),
  property_type: z.string().optional(),
  is_public: z.boolean().optional(),
  template_data: z.record(z.any())
});

export const documentChecklistController = {
  /**
   * Generate a dynamic document checklist for a transaction
   */
  async generateChecklist(req: AuthenticatedRequest, res: Response) {
    try {
      const validation = GenerateChecklistSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid checklist generation request',
            details: validation.error.errors,
          }
        });
      }

      const data = validation.data;

      // Get transaction details
      const transaction = await storage.getTransactionById(data.transaction_id);
      if (!transaction) {
        return res.status(404).json({
          error: {
            code: 'TRANSACTION_NOT_FOUND',
            message: 'Transaction not found',
          }
        });
      }

      // Check if user has access to this transaction
      const hasAccess = await storage.userHasTransactionAccess(req.user!.id, data.transaction_id);
      if (!hasAccess) {
        return res.status(403).json({
          error: {
            code: 'ACCESS_DENIED',
            message: 'You do not have access to this transaction',
          }
        });
      }

      // Generate the checklist using the service
      const checklist = await documentChecklistService.generateChecklist({
        transaction_id: data.transaction_id,
        lender_name: data.lender_name || 'Fannie Mae', // Default to Fannie Mae
        case_type: data.case_type,
        property_type: data.property_type,
        employment_status: data.employment_status,
        hardship_type: data.hardship_type,
        delinquency_status: data.delinquency_status,
        bankruptcy_status: data.bankruptcy_status,
        military_status: data.military_status,
        has_rental_income: data.has_rental_income,
        has_coborrower: data.has_coborrower,
        uba_form_data: data.uba_form_data
      });

      // Log the checklist generation
      await workflowLogger.logChecklistGeneration({
        userId: req.user!.id,
        transactionId: data.transaction_id,
        checklistId: checklist.id,
        lenderName: data.lender_name || 'Fannie Mae',
        caseType: data.case_type,
        itemCount: checklist.items.length
      });

      // Use AI to provide personalized guidance
      if (data.uba_form_data) {
        const aiGuidance = await aiService.generateRecommendation({
          userId: req.user!.id,
          contextRecipeId: 'document_checklist_guidance_v1',
          userInput: JSON.stringify({
            case_type: data.case_type,
            hardship_type: data.hardship_type,
            employment_status: data.employment_status,
            checklist_items: checklist.items.map(item => ({
              name: item.document_name,
              priority: item.priority
            }))
          }),
          additionalContext: {
            transaction_id: data.transaction_id,
            lender_name: data.lender_name || 'Fannie Mae'
          }
        });

        checklist.ai_guidance = aiGuidance.content;
      }

      return res.status(200).json({
        checklist,
        message: 'Document checklist generated successfully'
      });

    } catch (error) {
      console.error('Generate checklist error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to generate document checklist',
        }
      });
    }
  },

  /**
   * Get checklist for a transaction
   */
  async getChecklist(req: AuthenticatedRequest, res: Response) {
    try {
      const { transactionId } = req.params;

      // Check if user has access to this transaction
      const hasAccess = await storage.userHasTransactionAccess(req.user!.id, transactionId);
      if (!hasAccess) {
        return res.status(403).json({
          error: {
            code: 'ACCESS_DENIED',
            message: 'You do not have access to this transaction',
          }
        });
      }

      const checklist = await documentChecklistService.getTransactionChecklist(transactionId);
      if (!checklist) {
        return res.status(404).json({
          error: {
            code: 'CHECKLIST_NOT_FOUND',
            message: 'No checklist found for this transaction',
          }
        });
      }

      return res.status(200).json(checklist);

    } catch (error) {
      console.error('Get checklist error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve document checklist',
        }
      });
    }
  },

  /**
   * Update a checklist item status
   */
  async updateChecklistItem(req: AuthenticatedRequest, res: Response) {
    try {
      const { itemId } = req.params;

      const validation = UpdateChecklistItemSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update request',
            details: validation.error.errors,
          }
        });
      }

      // Get the checklist item to verify access
      const item = await documentChecklistService.getChecklistItem(itemId);
      if (!item) {
        return res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Checklist item not found',
          }
        });
      }

      // Verify user has access to the transaction
      const hasAccess = await storage.userHasTransactionAccess(req.user!.id, item.transaction_id);
      if (!hasAccess) {
        return res.status(403).json({
          error: {
            code: 'ACCESS_DENIED',
            message: 'You do not have access to this checklist',
          }
        });
      }

      // Update the checklist item
      const updatedItem = await documentChecklistService.updateChecklistItem(itemId, validation.data);

      // If a document was uploaded, trigger AI verification
      if (validation.data.uploaded_document_id && validation.data.status === 'uploaded') {
        // Trigger AI document analysis asynchronously
        documentChecklistService.analyzeUploadedDocument(
          itemId,
          validation.data.uploaded_document_id,
          req.user!.id
        ).catch(error => {
          console.error('Document analysis error:', error);
        });
      }

      // Log the update
      await workflowLogger.logChecklistItemUpdate({
        userId: req.user!.id,
        itemId: itemId,
        status: validation.data.status,
        documentId: validation.data.uploaded_document_id
      });

      return res.status(200).json({
        item: updatedItem,
        message: 'Checklist item updated successfully'
      });

    } catch (error) {
      console.error('Update checklist item error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to update checklist item',
        }
      });
    }
  },

  /**
   * Get available lenders
   */
  async getLenders(req: AuthenticatedRequest, res: Response) {
    try {
      const lenders = await documentChecklistService.getActiveLenders();
      return res.status(200).json(lenders);
    } catch (error) {
      console.error('Get lenders error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve lenders',
        }
      });
    }
  },

  /**
   * Create a checklist template
   */
  async createTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const validation = CreateTemplateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid template data',
            details: validation.error.errors,
          }
        });
      }

      const template = await documentChecklistService.createTemplate({
        ...validation.data,
        created_by: req.user!.id
      });

      return res.status(201).json({
        template,
        message: 'Template created successfully'
      });

    } catch (error) {
      console.error('Create template error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to create template',
        }
      });
    }
  },

  /**
   * Get templates available to the user
   */
  async getTemplates(req: AuthenticatedRequest, res: Response) {
    try {
      const templates = await documentChecklistService.getTemplatesForUser(req.user!.id);
      return res.status(200).json(templates);
    } catch (error) {
      console.error('Get templates error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve templates',
        }
      });
    }
  },

  /**
   * Get checklist progress analytics
   */
  async getChecklistProgress(req: AuthenticatedRequest, res: Response) {
    try {
      const { transactionId } = req.params;

      // Check if user has access to this transaction
      const hasAccess = await storage.userHasTransactionAccess(req.user!.id, transactionId);
      if (!hasAccess) {
        return res.status(403).json({
          error: {
            code: 'ACCESS_DENIED',
            message: 'You do not have access to this transaction',
          }
        });
      }

      const progress = await documentChecklistService.getChecklistProgress(transactionId);
      return res.status(200).json(progress);

    } catch (error) {
      console.error('Get checklist progress error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve checklist progress',
        }
      });
    }
  }
};