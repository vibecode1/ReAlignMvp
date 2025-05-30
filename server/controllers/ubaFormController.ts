
import { Request, Response } from 'express';
import { storage } from '../storage';
import { AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';
import { aiService } from '../services/aiService';
import { ENHANCED_DOCUMENT_EXTRACTION_PROMPT, AI_SERVICE_CONFIG } from '../services/aiServiceConfig';
import { mapExtractedToUbaFields } from '@shared/ubaFieldMappings';
import { UbaFormExportService } from '../services/ubaFormExportService';
// PDF processing will use pdfjs-dist

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
  ubaGuideRules: z.record(z.any()).optional(),
  conversationHistory: z.array(z.object({
    type: z.string(),
    content: z.string(),
    timestamp: z.string().or(z.date())
  })).optional()
});

export const ubaFormController = {
  /**
   * Enhanced document content extraction with better error handling
   */
  async extractDocumentContent(fileContent: string, fileType: string, fileName: string): Promise<{
    content: string;
    isImage: boolean;
    extractionMethod: string;
  }> {
    // For images, return as-is for Claude's vision capabilities
    if (fileType?.startsWith('image/')) {
      return {
        content: fileContent,
        isImage: true,
        extractionMethod: 'claude_vision'
      };
    }

    // Enhanced PDF processing
    if (fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
      try {
        // Extract buffer from base64 content
        let pdfBuffer;
        if (fileContent.startsWith('data:application/pdf;base64,')) {
          const base64Data = fileContent.replace('data:application/pdf;base64,', '');
          pdfBuffer = Buffer.from(base64Data, 'base64');
        } else if (fileContent.length > 100 && !fileContent.includes(' ')) {
          pdfBuffer = Buffer.from(fileContent, 'base64');
        } else {
          throw new Error('PDF content format not recognized');
        }

        const bufferSizeMB = pdfBuffer.length / (1024 * 1024);
        if (bufferSizeMB > 50) {
          throw new Error(`PDF file too large (${bufferSizeMB.toFixed(1)}MB). Maximum size is 50MB.`);
        }

        // Import PDF.js
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
        
        // Load PDF document
        const loadingTask = pdfjsLib.getDocument({
          data: pdfBuffer,
          verbosity: 0
        });
        
        const pdfDocument = await loadingTask.promise;
        const numPages = Math.min(pdfDocument.numPages, 50); // Process up to 50 pages
        
        let extractedText = '';
        const pageTexts = [];
        
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const page = await pdfDocument.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Improved text extraction with better spacing
          const items = textContent.items as any[];
          let pageText = '';
          let lastY = null;
          
          for (const item of items) {
            // Add newline if Y position changed significantly (new line)
            if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
              pageText += '\n';
            }
            pageText += item.str + ' ';
            lastY = item.transform[5];
          }
          
          pageTexts.push(`--- Page ${pageNum} ---\n${pageText.trim()}`);
          
          // Limit total text to 500KB
          if (extractedText.length + pageText.length > 500000) break;
          extractedText += pageText + '\n\n';
        }
        
        const fullText = pageTexts.join('\n\n');
        
        // Check if we got meaningful text
        if (fullText.trim().length < 100) {
          console.log('PDF text extraction yielded minimal content');
          throw new Error('Scanned PDF detected - minimal text extracted');
        }
        
        return {
          content: fullText,
          isImage: false,
          extractionMethod: 'pdfjs_text'
        };
        
      } catch (error) {
        console.error('PDF processing error:', error);
        // Return error state for fallback processing
        return {
          content: '',
          isImage: false,
          extractionMethod: 'failed'
        };
      }
    }
    
    // Plain text content
    return {
      content: fileContent,
      isImage: false,
      extractionMethod: 'raw_text'
    };
  },
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
   * Process uploaded document with AI to extract UBA form data
   */
  async processDocument(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      const { fileName, fileContent, documentType, fileType } = req.body;

      if (!fileName || !fileContent) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'File name and content are required',
          }
        });
      }

      const contentSizeMB = (fileContent.length / 1024 / 1024).toFixed(2);
      console.log(`Processing document: ${fileName}, type: ${fileType}, docType: ${documentType}, content size: ${contentSizeMB}MB`);
      console.log(`File content starts with:`, fileContent.substring(0, 100));
      console.log(`Is image file:`, fileType?.startsWith('image/'));
      console.log(`Is PDF file:`, fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf'));

      // Extract document content with enhanced processing
      const extractionResult = await this.extractDocumentContent(fileContent, fileType, fileName);
      let processedContent = extractionResult.content;
      const isImageDocument = extractionResult.isImage;
      const extractionMethod = extractionResult.extractionMethod;

      // Handle PDF files - check if content is base64 encoded PDF
      if (fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
        try {
          // Check if content is base64 encoded
          let pdfBuffer;
          if (fileContent.startsWith('data:application/pdf;base64,')) {
            // Remove data URL prefix
            const base64Data = fileContent.replace('data:application/pdf;base64,', '');
            pdfBuffer = Buffer.from(base64Data, 'base64');
          } else if (fileContent.length > 100 && !fileContent.includes(' ')) {
            // Likely base64 without prefix
            pdfBuffer = Buffer.from(fileContent, 'base64');
          } else {
            throw new Error('PDF content format not recognized');
          }

          // Check buffer size to prevent memory issues
          const bufferSizeMB = pdfBuffer.length / (1024 * 1024);
          if (bufferSizeMB > 50) {
            throw new Error(`PDF file too large (${bufferSizeMB.toFixed(1)}MB). Maximum size is 50MB.`);
          }

          // Extract text from PDF using pdfjs-dist with timeout
          const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
          
          // Set up timeout for PDF processing
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('PDF processing timeout after 30 seconds')), 30000);
          });

          const pdfProcessingPromise = (async () => {
            const pdfDocument = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
            
            let allText = '';
            const maxPages = Math.min(pdfDocument.numPages, 10); // Limit to 10 pages max
            
            for (let i = 1; i <= maxPages; i++) {
              const page = await pdfDocument.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
              allText += pageText + '\n';
              
              // Break if we have enough text
              if (allText.length > 50000) break;
            }
            
            return allText.trim();
          })();

          processedContent = await Promise.race([pdfProcessingPromise, timeoutPromise]) as string;
          console.log(`Extracted ${processedContent.length} characters from PDF`);

          if (!processedContent || processedContent.trim().length < 10) {
            throw new Error('PDF appears to be empty or contains no extractable text. Try uploading as an image instead.');
          }

        } catch (pdfError) {
          console.error('PDF processing error:', pdfError);
          
          // For PDF failures, try to continue with manual extraction instead of failing
          console.log('PDF processing failed, attempting fallback processing...');
          processedContent = 'PDF_PROCESSING_FAILED';
          
          // Don't return error immediately - let it fall through to manual extraction
        }
      }

      // Use enhanced prompt from config
      const systemPrompt = ENHANCED_DOCUMENT_EXTRACTION_PROMPT;

      try {
        // Skip AI processing if content failed to process
        if (extractionMethod === 'failed') {
          throw new Error('Document processing failed - using manual extraction');
        }
        
        // Use centralized AI service for document processing
        console.log('Processing document with AI service...');
        console.log('Document type:', documentType);
        console.log('File name:', fileName);
        console.log('Extraction method:', extractionMethod);
        
        const aiResponse = await aiService.generateRecommendation({
          userId: req.user.id,
          contextRecipeId: 'document_extraction',
          userInput: isImageDocument ? 'Process this document image' : processedContent,
          additionalContext: {
            systemPrompt: systemPrompt,
            documentType,
            fileName,
            fileType,
            extractionMethod,
            isImage: isImageDocument,
            imageData: isImageDocument ? processedContent : undefined,
            // Use the newer Claude model for better extraction
            preferredModel: AI_SERVICE_CONFIG.taskConfigs.document_extraction.model,
            maxTokens: AI_SERVICE_CONFIG.taskConfigs.document_extraction.maxTokens,
            temperature: AI_SERVICE_CONFIG.taskConfigs.document_extraction.temperature
          }
        });

        console.log('Claude API call successful, extracted content length:', aiResponse.content.length);
        console.log('Raw Claude response:', aiResponse.content);

        // Enhanced parsing with better error handling
        let extractedData;
        try {
          // Clean up the AI response - remove any markdown formatting
          const cleanContent = aiResponse.content.trim()
            .replace(/^```(?:json)?\n?/, '')
            .replace(/\n?```$/, '')
            .trim();
          
          console.log('Cleaned content for parsing:', cleanContent);
          extractedData = JSON.parse(cleanContent);
          console.log('Successfully parsed extracted data:', extractedData);
        } catch (parseError) {
          console.log('JSON parse failed, attempting manual extraction from AI response');
          
          // Try to extract key-value pairs from the text if JSON parsing fails
          extractedData = ubaFormController.extractKeyValuePairs(aiResponse.content);
          
          if (Object.keys(extractedData).length === 0) {
            // Last resort: try manual pattern extraction from original content
            extractedData = ubaFormController.extractMortgageDataManually(processedContent, fileName);
          }
        }

        // Apply field mapping to extracted data
        const mappingResult = mapExtractedToUbaFields(extractedData);
        console.log(`Field mapping: ${mappingResult.mappingStats.mappedCount} of ${mappingResult.mappingStats.totalFields} fields mapped to UBA fields`);

        // Save complete extracted data if UBA form ID provided
        let attachmentId = null;
        if (req.body.ubaFormId) {
          const attachment = await storage.createUbaDocumentAttachment({
            uba_form_data_id: req.body.ubaFormId,
            document_type: this.mapToUbaDocumentType(documentType),
            document_title: fileName,
            file_url: req.body.fileUrl || `data:${fileType};base64,processed`,
            file_name: fileName,
            file_size_bytes: fileContent.length,
            content_type: fileType,
            processing_status: 'processed',
            extraction_confidence: 85, // Can be calculated based on AI response
            extracted_data: JSON.stringify(extractedData), // Store ALL extracted data
            uba_compliance_check: JSON.stringify({
              extracted_fields: Object.keys(extractedData),
              mapped_fields: Object.keys(mappingResult.mappedFields),
              unmapped_fields: Object.keys(mappingResult.unmappedFields),
              extraction_method: extractionMethod,
              extraction_timestamp: new Date().toISOString()
            }),
            meets_uba_requirements: mappingResult.mappingStats.mappedCount > 0
          });
          attachmentId = attachment.id;
          console.log(`Saved document attachment ${attachmentId} with ${Object.keys(extractedData).length} extracted fields`);
        }

        // Log document processing
        await storage.logWorkflowEvent({
          user_id: req.user.id,
          event_type: 'document_processed',
          event_category: 'uba_form',
          event_name: 'document_data_extracted',
          event_description: `Extracted data from ${fileName}`,
          success_indicator: true,
          event_metadata: JSON.stringify({
            file_name: fileName,
            document_type: documentType,
            file_type: fileType,
            fields_extracted: Object.keys(extractedData).length,
            fields_mapped: mappingResult.mappingStats.mappedCount,
            fields_unmapped: mappingResult.mappingStats.unmappedCount,
            extraction_method: extractionMethod,
            attachment_id: attachmentId
          })
        });

        return res.status(200).json({
          fileName,
          extractedData: mappingResult.mappedFields, // Return mapped fields for form population
          allExtractedData: extractedData, // Also return all extracted data
          mappingStats: mappingResult.mappingStats,
          message: `Successfully processed ${fileName}`,
          fieldsExtracted: Object.keys(extractedData).filter(k => !['raw_text', 'extraction_failed'].includes(k)),
          fileType,
          processingMethod: 'ai_extraction',
          attachmentId
        });

      } catch (aiError) {
        console.error('Document AI processing error:', aiError);
        console.error('Error type:', typeof aiError);
        console.error('Error name:', aiError instanceof Error ? aiError.name : 'Unknown');
        console.error('Error message:', aiError instanceof Error ? aiError.message : String(aiError));
        console.error('Error stack:', aiError instanceof Error ? aiError.stack : 'No stack trace');
        
        // Check if it's a specific type of error
        if (aiError instanceof Error) {
          if (aiError.message.includes('timeout')) {
            console.error('TIMEOUT ERROR: Claude API call timed out');
          } else if (aiError.message.includes('API key')) {
            console.error('API KEY ERROR: Claude API key issue');
          } else if (aiError.message.includes('rate limit')) {
            console.error('RATE LIMIT ERROR: Claude API rate limited');
          } else if (aiError.message.includes('content_policy')) {
            console.error('CONTENT POLICY ERROR: Claude rejected content');
          }
        }
        
        // Fallback: Manual pattern extraction
        const manualExtraction = ubaFormController.extractMortgageDataManually(processedContent, fileName);
        
        return res.status(200).json({
          fileName,
          extractedData: manualExtraction,
          message: manualExtraction && Object.keys(manualExtraction).length > 0 
            ? `Processed ${fileName} with manual extraction` 
            : `Document uploaded but automatic extraction failed. Please review and enter information manually.`,
          fieldsExtracted: Object.keys(manualExtraction || {}),
          fileType,
          processingMethod: 'manual_extraction',
          ai_available: false
        });
      }

    } catch (error) {
      console.error('Process document error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('Error details:', {
        fileName,
        fileType,
        documentType,
        contentLength: typeof processedContent === 'string' ? processedContent.length : 'unknown'
      });
      
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: `Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  },

  // Helper method to map document type to UBA document type enum
  mapToUbaDocumentType(documentType: string): 'income_verification' | 'hardship_letter' | 'financial_statement' | 'property_documents' | 'correspondence' {
    const typeMap: Record<string, any> = {
      'pay_stub': 'income_verification',
      'paystub': 'income_verification',
      'w2': 'income_verification',
      'tax_return': 'income_verification',
      'bank_statement': 'financial_statement',
      'mortgage_statement': 'property_documents',
      'hardship_letter': 'hardship_letter',
      'loe': 'hardship_letter',
      'property_tax': 'property_documents',
      'insurance': 'property_documents',
      'hoa': 'property_documents',
      'correspondence': 'correspondence'
    };
    
    const normalizedType = documentType?.toLowerCase().replace(/[^a-z0-9]/g, '_') || '';
    return typeMap[normalizedType] || 'correspondence';
  },

  // Helper method for manual mortgage data extraction
  extractMortgageDataManually(content: string, fileName: string) {
    const data: Record<string, string> = {};
    
    console.log(`Starting manual extraction for ${fileName}`);
    console.log(`Content length: ${content.length} characters`);
    console.log(`Content preview (first 500 chars): ${content.substring(0, 500)}`);
    
    // Enhanced patterns for mortgage statements with multiple variations
    const patterns = {
      loan_number: [
        // Primary patterns based on mortgage statement format
        /account\s*number\s*:?\s*([A-Z0-9-]{8,20})/i,
        /account\s*#\s*:?\s*([A-Z0-9-]{8,20})/i,
        /loan\s*(?:number|#)\s*:?\s*([A-Z0-9-]{8,20})/i,
        // Fallback patterns
        /(?:reference|ref)\s*(?:number|#|no)\s*:?\s*([A-Z0-9-]{8,20})/i,
        /account\s*([A-Z0-9-]{8,20})/i,
        /^([0-9]{10,15})$/m,
        // Pattern for numbers that appear after common mortgage terms
        /(?:mtg|mortgage|home\s*loan).*?([0-9]{8,15})/i
      ],
      servicer_name: [
        // Primary patterns for bank name at top of statement
        /^([A-Z][A-Za-z\s&.,Inc]{3,50}(?:Bank|Mortgage|Financial|Corp|Inc|LLC))/m,
        // Common mortgage servicer patterns (specific banks)
        /(Wells\s*Fargo|Bank\s*of\s*America|Chase|Quicken|Rocket|Freedom|Mr\s*Cooper|Nationstar|Ocwen|Green\s*Tree|PNC|Truist|US\s*Bank|SunTrust)/i,
        // Pattern for company names at the top of statements
        /^([A-Z][A-Za-z\s&.,]{10,50})(?:Bank|Mortgage|Home\s*Loans|Financial)/im,
        // Fallback patterns
        /(?:servicer|lender|company)\s*:?\s*([A-Za-z\s&.,Inc]+?)(?:\n|\r|$)/i,
        /(?:from|bank)\s*:?\s*([A-Za-z\s&.,Inc]+?)(?:\n|\r|$)/i
      ],
      borrower_name: [
        /(?:borrower|name|customer|account\s*holder)\s*:?\s*([A-Za-z\s.,]+?)(?:\n|\r|$)/i,
        /(?:dear|to)\s+([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
        // Pattern for names that appear after mortgage account info
        /(?:account\s*holder|borrower).*?([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i
      ],
      property_address: [
        /(?:property|subject|collateral)\s*(?:address|location)\s*:?\s*([0-9A-Za-z\s.,#-]+?)(?:\n|\r|$)/i,
        /(?:located\s*at|address)\s*:?\s*([0-9A-Za-z\s.,#-]+?)(?:\n|\r|$)/i,
        // Pattern for addresses that start with numbers
        /^([0-9]+\s+[A-Za-z\s.,#-]+?)(?:\n|\r|$)/m
      ],
      mortgage_balance: [
        // Primary patterns based on mortgage statement format
        /outstanding\s*principal\s*:?\s*\$?([\d,]+\.?\d*)/i,
        /principal\s*balance\s*:?\s*\$?([\d,]+\.?\d*)/i,
        /current\s*balance\s*:?\s*\$?([\d,]+\.?\d*)/i,
        /unpaid\s*principal\s*balance\s*:?\s*\$?([\d,]+\.?\d*)/i,
        // Fallback patterns
        /(?:outstanding|current|unpaid)\s*(?:principal|balance)\s*:?\s*\$?([\d,]+\.?\d*)/i,
        /balance\s*:?\s*\$?([\d,]+\.?\d*)/i,
        // Pattern for large dollar amounts (likely balance)
        /\$\s*([1-9]\d{5,}\.\d{2})/
      ],
      monthly_payment: [
        // Primary patterns based on mortgage statement format
        /regular\s*payment\s*:?\s*\$?([\d,]+\.?\d*)/i,
        /amount\s*due\s*:?\s*\$?([\d,]+\.?\d*)/i,
        /monthly\s*payment\s*:?\s*\$?([\d,]+\.?\d*)/i,
        /payment\s*amount\s*:?\s*\$?([\d,]+\.?\d*)/i,
        // Principal and interest pattern
        /p\s*&\s*i.*?\$?([\d,]+\.?\d*)/i,
        // Fallback patterns
        /payment\s*:?\s*\$?([\d,]+\.?\d*)/i,
        /due\s*:?\s*\$?([\d,]+\.?\d*)/i,
        /next\s*payment.*?\$?([\d,]+\.?\d*)/i
      ],
      interest_rate: [
        // Interest rate patterns from mortgage statements
        /interest\s*rate\s*:?\s*([\d.]+%?)/i,
        /current\s*rate\s*:?\s*([\d.]+%?)/i,
        /rate\s*:?\s*([\d.]+%)/i,
        // Pattern for percentage values
        /([\d.]+)%/
      ],
      // SERVICER CONTACT INFORMATION
      loan_officer_name: [
        /loan\s*officer\s*(?:name)?\s*:?\s*([A-Za-z\s.,]+?)(?:\n|\r|$)/i,
        /(?:contact|officer)\s*(?:name)?\s*:?\s*([A-Za-z\s.,]+?)(?:\n|\r|$)/i,
        /name\s*:?\s*([A-Za-z\s.,]+?)(?:\s*title|\n|\r|$)/i
      ],
      loan_officer_phone: [
        /office\s*phone\s*:?\s*([\d\s\-\(\)\.]+)/i,
        /contact\s*phone\s*:?\s*([\d\s\-\(\)\.]+)/i,
        /phone\s*:?\s*([\d\s\-\(\)\.]+)/i
      ],
      loan_officer_email: [
        /email\s*:?\s*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/i,
        /contact\s*email\s*:?\s*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/i
      ],
      loan_officer_nmls: [
        /nmls\s*(?:number|#)\s*:?\s*([0-9]+)/i,
        /nmls\s*:?\s*([0-9]+)/i
      ],
      // PAYMENT BREAKDOWN
      principal_payment: [
        /principal\s*:?\s*\$?([\d,]+\.?\d*)/i,
        /principal\s*amount\s*:?\s*\$?([\d,]+\.?\d*)/i
      ],
      interest_payment: [
        /interest\s*:?\s*\$?([\d,]+\.?\d*)/i,
        /interest\s*amount\s*:?\s*\$?([\d,]+\.?\d*)/i
      ],
      escrow_payment: [
        /escrow\s*:?\s*\$?([\d,]+\.?\d*)/i,
        /escrow\s*(?:taxes?\s*and\/or\s*insurance)?\s*:?\s*\$?([\d,]+\.?\d*)/i
      ],
      late_fees: [
        /late\s*fee\s*:?\s*\$?([\d,]+\.?\d*)/i,
        /late\s*charges?\s*:?\s*\$?([\d,]+\.?\d*)/i
      ],
      payment_due_date: [
        /payment\s*due\s*date\s*:?\s*([0-9\/\-]+)/i,
        /due\s*(?:by\s*)?date\s*:?\s*([0-9\/\-]+)/i,
        /due\s*:?\s*([0-9\/\-]+)/i
      ],
      // ADDITIONAL LOAN INFORMATION
      prepayment_penalty: [
        /prepayment\s*penalty\s*:?\s*([A-Za-z0-9\$\s.,]+?)(?:\n|\r|$)/i
      ],
      deferred_balance: [
        /deferred\s*balance\(?s?\)?\s*:?\s*\$?([\d,]+\.?\d*)/i
      ],
      wage_income: [
        /(?:gross\s*pay|salary|wages|income)\s*:?\s*\$?([\d,]+\.?\d*)/i,
        /pay\s*period\s*.*?\$?([\d,]+\.?\d*)/i,
        // Paycheck specific patterns
        /gross\s*earnings.*?\$?([\d,]+\.?\d*)/i,
        /current\s*gross.*?\$?([\d,]+\.?\d*)/i
      ],
      employer_name: [
        /(?:employer|company)\s*:?\s*([A-Za-z\s&.,Inc]+?)(?:\n|\r|$)/i,
        /pay\s*period\s*ending.*?([A-Za-z\s&.,Inc]{3,50})/i,
        // Pattern for employer on pay stubs
        /employer.*?([A-Za-z\s&.,Inc]{3,50})/i
      ]
    };

    for (const [field, patternArray] of Object.entries(patterns)) {
      const patterns_list = Array.isArray(patternArray) ? patternArray : [patternArray];
      
      for (const pattern of patterns_list) {
        const match = content.match(pattern);
        if (match && match[1]) {
          let value = match[1].trim();
          
          // Clean up extracted values
          if (field.includes('name') || field.includes('servicer')) {
            value = value.replace(/[^A-Za-z\s&.,]/g, '').trim();
          }
          if (field.includes('balance') || field.includes('payment') || field.includes('income')) {
            // Remove commas from numbers
            value = value.replace(/,/g, '');
          }
          if (field.includes('address')) {
            // Clean up addresses
            value = value.replace(/\s+/g, ' ').trim();
          }
          
          if (value && value.length > 1) {
            console.log(`Found ${field}: ${value} using pattern: ${pattern}`);
            data[field] = value;
            break; // Found a match, stop trying other patterns for this field
          }
        }
      }
    }

    console.log(`Manual extraction completed. Found ${Object.keys(data).length} fields:`, data);
    return data;
  },

  // Helper method for key-value extraction when JSON parsing fails
  extractKeyValuePairs(text: string) {
    const data: Record<string, string> = {};
    const lines = text.split('\n');
    
    for (const line of lines) {
      const colonMatch = line.match(/^([^:]+):\s*(.+)$/);
      if (colonMatch) {
        const key = colonMatch[1].trim().toLowerCase().replace(/\s+/g, '_');
        const value = colonMatch[2].trim();
        if (value && value !== 'N/A' && value !== 'null' && value !== 'undefined') {
          data[key] = value;
        }
      }
    }
    
    return data;
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
      console.log('=== UBA PROCESS CONVERSATION DEBUG ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('User:', req.user?.id);
      
      const validation = ProcessConversationSchema.safeParse(req.body);
      if (!validation.success) {
        console.log('Validation failed:', validation.error.errors);
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid conversation input',
            details: validation.error.errors,
          }
        });
      }

      const { message, currentFormData = {}, activeSection, caseType, ubaGuideRules, conversationHistory = [] } = validation.data;
      console.log('Parsed data:', { message, currentFormData, activeSection, caseType, historyLength: conversationHistory.length });

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

AVAILABLE UBA FORM FIELDS (use exact field names for extracted_data):
LOAN INFORMATION:
- loan_number, mortgage_insurance_case_number, servicer_name

INTENT & PROPERTY:
- intent, property_type, owner_occupied, renter_occupied, vacant
- property_listed, listing_date, listing_agent_name, listing_agent_phone, listing_price
- for_sale_by_owner, offer_received, offer_amount, offer_date, offer_status

BORROWER INFORMATION:
- borrower_name, borrower_dob, borrower_ssn, borrower_cell_phone, borrower_home_phone, borrower_work_phone
- borrower_email, mailing_address
- has_coborrower, coborrower_name, coborrower_ssn

PROPERTY DETAILS:
- property_address, property_value, mortgage_balance, monthly_payment

EMPLOYMENT:
- employer_name, employment_start_date, employer_phone
- coborrower_employer_name, coborrower_employment_start_date

HARDSHIP:
- hardship_type, hardship_description, hardship_date, hardship_duration

INCOME BREAKDOWN:
- wage_income, overtime_income, child_support_received, social_security_income
- self_employment_income, rental_income, unemployment_income, other_income, other_income_description
- monthly_gross_income, monthly_net_income

EXPENSE BREAKDOWN:
- first_mortgage_payment, second_mortgage_payment, homeowners_insurance, property_taxes
- hoa_fees, utilities, car_payment, car_insurance, credit_card_payments
- child_support_paid, food_groceries, medical_expenses, other_expenses, monthly_expenses

ASSETS:
- checking_account_balance, savings_account_balance, money_market_balance, stocks_bonds_value
- retirement_accounts, other_real_estate_value, cash_on_hand, other_assets, total_assets

LIABILITIES:
- credit_card_debt, auto_loan_balance, student_loan_balance, installment_loans
- personal_loans, other_mortgages, other_liabilities, total_liabilities

LIEN HOLDERS:
- second_lien_holder, second_lien_balance, second_lien_loan_number
- third_lien_holder, third_lien_balance, third_lien_loan_number

HOA INFORMATION:
- has_hoa, hoa_name, hoa_contact_name, hoa_contact_phone, hoa_contact_address, hoa_monthly_fee

ADDITIONAL INFO:
- credit_counseling, credit_counseling_details, military_service, bankruptcy_filed

CONVERSATION HISTORY:
${conversationHistory.length > 0 ? conversationHistory.map(msg => `${msg.type.toUpperCase()}: ${msg.content}`).join('\n') : 'No previous conversation'}

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

IMPORTANT: Review the conversation history above to understand what information has already been provided. Do NOT ask for the same information again.

Current user message: "${message}"

Based on the conversation history and current form data, respond with JSON containing:
- response: conversational text that guides the user naturally
- extracted_data: object with field names and values (use EXACT field names from list above)
- suggestions: object with field suggestions using same field names
- confidence: object with confidence scores (0-1) using same field names  
- next_step: what section or field to focus on next
- document_request: if documents would help (e.g., "recent pay stubs", "tax returns")

EXAMPLE extracted_data format:
{
  "borrower_name": "John Smith",
  "intent": "Keep",
  "property_address": "123 Main St, City, State",
  "monthly_gross_income": "5000"
}

Keep responses natural and conversational while ensuring UBA compliance.`;

      const startTime = Date.now();
      
      try {
        // Process with AI
        console.log('About to call AI service...');
        const aiResponse = await aiService.generateRecommendation({
          userId: req.user!.id,
          contextRecipeId: 'uba_form_completion_v1',
          userInput: `User message: ${message}`,
          additionalContext: {
            currentFormData,
            activeSection,
            caseType,
            ubaGuideRules,
            systemPrompt,
            // Override the user prompt template to avoid interpolation issues
            userPrompt: `User message: ${message}`,
            // Provide context for template interpolation in case it's still needed
            current_section: activeSection || 'conversation',
            current_field: 'chat_input',
            specific_question: 'Please process this conversational input for UBA form completion.',
            user_input: message
          }
        });
        console.log('AI service completed successfully');

        const executionTime = Date.now() - startTime;

        // Parse AI response
      let parsedResponse;
      try {
        console.log('AI response content type:', typeof aiResponse.content);
        console.log('AI response content preview:', aiResponse.content.substring(0, 300));
        
        // Clean the AI response content - remove markdown code blocks if present
        let cleanContent = aiResponse.content.trim();
        if (cleanContent.startsWith('```json') || cleanContent.startsWith('```')) {
          // Remove opening ```json or ``` and closing ```
          cleanContent = cleanContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
        }
        
        parsedResponse = JSON.parse(cleanContent);
        console.log('Parsed AI response extracted_data:', JSON.stringify(parsedResponse.extracted_data, null, 2));
      } catch (parseError) {
        console.log('JSON parse error:', parseError);
        console.log('Raw content that failed to parse:', aiResponse.content);
        
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

      // Log the AI interaction (with error handling)
      try {
        await storage.logWorkflowEvent({
          user_id: req.user!.id,
          event_type: 'ai_recommendation_generated',
          event_category: 'uba_form',
          event_name: 'conversation_processed',
          event_description: 'AI processed user input for UBA form completion',
          success_indicator: true,
          ai_model_used: aiResponse.model_used || 'claude',
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
      } catch (logError) {
        console.warn('Failed to log workflow event (non-blocking):', logError instanceof Error ? logError.message : String(logError));
        // Don't throw - continue with the response
      }

        return res.status(200).json(parsedResponse);
      } catch (aiError) {
        console.error('AI service error:', aiError);
        
        // Log the error (with error handling)
        try {
          await storage.logWorkflowEvent({
            user_id: req.user!.id,
            event_type: 'ai_recommendation_generated',
            event_category: 'uba_form',
            event_name: 'conversation_processing_failed',
            event_description: 'Failed to process conversation with AI',
            success_indicator: false,
            error_details: JSON.stringify({ message: aiError instanceof Error ? aiError.message : 'Unknown error' }),
            event_severity: 'error'
          });
        } catch (logError) {
          console.warn('Failed to log error event (non-blocking):', logError instanceof Error ? logError.message : String(logError));
          // Don't throw - continue with fallback response
        }

        // Provide fallback response without AI
        const fallbackResponses: Record<string, any> = {
          'borrower-info': {
            response: "I understand you need help with your borrower information. Let's start with your full legal name as it appears on your mortgage documents.",
            next_step: 'borrower-info',
            extracted_data: {},
            suggestions: {
              borrower_name: "Enter your full name (First Middle Last)",
              borrower_ssn: "Format: XXX-XX-XXXX"
            }
          },
          'property-info': {
            response: "Now let's gather information about your property. What's the full property address?",
            next_step: 'property-info',
            extracted_data: {},
            suggestions: {
              property_address: "Enter the complete street address",
              property_type: "My Primary Residence"
            }
          },
          'financial-hardship': {
            response: `I see you're ${caseType === 'short_sale' ? 'looking to sell' : 'trying to keep'} your home. Can you tell me about the financial hardship you're experiencing?`,
            next_step: 'financial-hardship',
            extracted_data: {
              hardship_duration: caseType === 'short_sale' ? 'Long-term' : 'Short-term'
            },
            suggestions: {
              hardship_type: "Select the type of hardship",
              hardship_description: "Explain your situation in detail"
            }
          },
          'income-expenses': {
            response: "Let's review your monthly income and expenses. What's your total monthly gross income from all sources?",
            next_step: 'income-expenses',
            extracted_data: {},
            suggestions: {
              monthly_gross_income: "Enter your total monthly income before taxes",
              total_assets: "500"
            }
          }
        };

        const fallbackResponse = fallbackResponses[activeSection || 'borrower-info'] || {
          response: `I understand you're trying to ${caseType === 'short_sale' ? 'sell' : 'keep'} your home. While I'm temporarily unable to process your message with AI assistance, I can guide you through the form step by step.

What information would you like to provide? You can tell me about:
- Your personal information
- Property details
- Financial hardship
- Income and expenses`,
          extracted_data: {},
          suggestions: {},
          next_step: 'borrower-info'
        };

        return res.status(200).json({
          ...fallbackResponse,
          confidence: {},
          document_request: null,
          ai_available: false,
          fallback_mode: true
        });
      }
    } catch (error) {
      console.error('Process conversation error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to process conversation',
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
  },

  /**
   * Process uploaded document using file upload (bypass JSON size limits)
   */
  async processDocumentUpload(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      // This method will be implemented to use multer for file upload
      // instead of sending file content in JSON body
      
      return res.status(501).json({
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'File upload method under development. Please use the standard document processing for now.',
        }
      });

    } catch (error) {
      console.error('Process document upload error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to process document upload',
        }
      });
    }
  },

  /**
   * Export UBA form to servicer form (e.g., Fannie Mae Form 710)
   */
  async exportToServicerForm(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      const { formId, formType } = req.params;
      
      // Validate form type
      const availableForms = await UbaFormExportService.getAvailableForms();
      const formExists = availableForms.find(f => f.id === formType);
      if (!formExists) {
        return res.status(400).json({
          error: {
            code: 'INVALID_FORM_TYPE',
            message: `Form type ${formType} is not supported`,
            availableForms
          }
        });
      }
      
      // Get UBA form data by transaction ID
      const ubaForm = await storage.getUbaFormData(formId, req.user.id);
      if (!ubaForm) {
        return res.status(404).json({ 
          error: {
            code: 'FORM_NOT_FOUND',
            message: 'UBA form not found'
          }
        });
      }
      
      // Get all extracted document data for the transaction
      const documentExtractions = await storage.getTransactionDocumentExtractions(
        ubaForm.transaction_id
      );
      
      // Aggregate all extracted data
      const extractedData = documentExtractions.reduce((acc, doc) => {
        const data = doc.extracted_data || {};
        return { ...acc, ...data };
      }, {});
      
      console.log(`Exporting form ${formId} to ${formType} with ${Object.keys(extractedData).length} extracted fields`);
      
      // Parse UBA form data (convert from DB format)
      const formData = {
        ...ubaForm,
        // Ensure all fields are in the expected format
        assistance_type_requested: ubaForm.assistance_type_requested || [],
      };
      
      // Generate the PDF
      const pdfBuffer = await UbaFormExportService.populateForm(
        formType,
        formData,
        extractedData
      );
      
      // Log the export
      await storage.logWorkflowEvent({
        user_id: req.user.id,
        event_type: 'form_exported',
        event_category: 'uba_form',
        event_name: `exported_to_${formType}`,
        event_description: `Exported UBA form to ${formType}`,
        success_indicator: true,
        event_metadata: JSON.stringify({
          form_id: formId,
          form_type: formType,
          file_size: pdfBuffer.length,
          extracted_fields_count: Object.keys(extractedData).length,
          form_fields_count: Object.keys(formData).length
        })
      });
      
      // Send the PDF
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `form_710_${ubaForm.loan_number || 'draft'}_${timestamp}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length.toString());
      res.send(pdfBuffer);
      
    } catch (error) {
      console.error('Export form error:', error);
      return res.status(500).json({
        error: {
          code: 'EXPORT_ERROR',
          message: 'Failed to export form',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  },

  /**
   * Get available servicer forms for export
   */
  async getAvailableServicerForms(req: AuthenticatedRequest, res: Response) {
    try {
      const forms = await UbaFormExportService.getAvailableForms();
      return res.status(200).json({
        forms,
        message: 'Available forms for export'
      });
    } catch (error) {
      console.error('Get available forms error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve available forms'
        }
      });
    }
  }
};
