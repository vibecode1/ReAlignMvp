
import { Request, Response } from 'express';
import { storage } from '../storage';
import { AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';
import { aiService } from '../services/aiService';
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

      let processedContent = fileContent;

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

      // Enhanced document processing prompt for all file types
      const documentTypeDescription = fileType === 'application/pdf' ? 'PDF document' : 
                                     fileType?.startsWith('image/') ? 'image of a document' : 'document';
      
      const systemPrompt = `Please look at this ${documentTypeDescription} and extract all the data fields and their values.

${fileType?.startsWith('image/') ? 'This is an image of a document. Please read all visible text carefully.' : ''}

Identify what type of document this is and extract ALL data fields and their values that you can see.

Return the results as a JSON object where each field name is a key and the extracted value is the value.

For financial amounts, remove dollar signs and commas (e.g., return "1200" not "$1,200").

Just extract everything you can see - use clear, descriptive field names for what you find.`;

      try {
        // Skip AI processing if content failed to process
        if (processedContent === 'PDF_PROCESSING_FAILED') {
          throw new Error('PDF processing failed - using manual extraction');
        }
        
        // Process with AI using direct Claude call to bypass context recipe issues
        console.log('Attempting direct Claude API call for document processing...');
        console.log('Document type:', documentType);
        console.log('File name:', fileName);
        console.log('System prompt length:', systemPrompt.length);
        
        if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.trim() === '') {
          throw new Error('Anthropic API key not configured - AI processing unavailable');
        }
        
        const { default: Anthropic } = await import('@anthropic-ai/sdk');
        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });

        let claudeResponse;
        
        // Set up timeout for Claude API calls
        const claudeTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Claude API timeout after 45 seconds')), 45000);
        });
        
        const claudeApiCall = async () => {
          // For images, send the image directly to Claude for better OCR
          if (fileType?.startsWith('image/')) {
            console.log('Processing image file with Claude vision...');
            console.log('File type:', fileType);
            console.log('File content starts with data URL:', fileContent.startsWith('data:'));
            console.log('File content length:', fileContent.length);
            
            // Extract base64 data properly
            let base64Data = fileContent;
            if (fileContent.startsWith('data:')) {
              const parts = fileContent.split(',');
              if (parts.length > 1) {
                base64Data = parts[1];
                console.log('Extracted base64 data length:', base64Data.length);
              }
            }
            
            // Validate base64 data
            try {
              const buffer = Buffer.from(base64Data, 'base64');
              const imageSizeMB = buffer.length / (1024 * 1024);
              console.log(`Image size: ${imageSizeMB.toFixed(2)}MB`);
              
              if (imageSizeMB > 20) {
                throw new Error(`Image too large (${imageSizeMB.toFixed(1)}MB). Maximum size is 20MB.`);
              }
              
              console.log('Base64 data is valid');
            } catch (e) {
              console.error('Invalid base64 data:', e);
              throw new Error('Invalid image data format');
            }
            
            return await anthropic.messages.create({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 4000,
              temperature: 0.1,
              messages: [
                { 
                  role: 'user', 
                  content: [
                    {
                      type: 'text',
                      text: systemPrompt
                    },
                    {
                      type: 'image',
                      source: {
                        type: 'base64',
                        media_type: fileType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                        data: base64Data
                      }
                    }
                  ]
                }
              ],
            });
          } else {
            // For PDFs and text, use text-based processing
            // Truncate very long content to prevent API limits
            const maxContentLength = 100000; // 100k chars max
            let contentToProcess = processedContent;
            if (processedContent.length > maxContentLength) {
              contentToProcess = processedContent.substring(0, maxContentLength) + '\n\n[Content truncated due to length]';
            }
            
            return await anthropic.messages.create({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 4000,
              temperature: 0.1,
              messages: [
                { 
                  role: 'user', 
                  content: `${systemPrompt}\n\nDocument content to extract from:\n${contentToProcess}`
                }
              ],
            });
          }
        };

        claudeResponse = await Promise.race([claudeApiCall(), claudeTimeoutPromise]) as any;

        // Transform Claude response to match expected format
        const textContent = claudeResponse.content.find(block => block.type === 'text') as any;
        const aiResponse = {
          content: textContent?.text || '',
          usage: {
            prompt_tokens: claudeResponse.usage?.input_tokens || 0,
            completion_tokens: claudeResponse.usage?.output_tokens || 0,
          }
        };

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
            content_length: processedContent.length
          })
        });

        return res.status(200).json({
          fileName,
          extractedData,
          message: `Successfully processed ${fileName}`,
          fieldsExtracted: Object.keys(extractedData).filter(k => !['raw_text', 'extraction_failed'].includes(k)),
          fileType,
          processingMethod: 'ai_extraction'
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
  }
};
