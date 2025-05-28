
import { Request, Response } from 'express';
import { storage } from '../storage';
import { AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';

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

export const ubaFormController = {
  /**
   * Create new UBA form data
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
   * Get UBA form data by transaction
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
   * Update UBA form data
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
};
