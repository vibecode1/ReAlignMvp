/**
 * @ai-context Document Intelligence Controller for ReAlign 3.0
 * @ai-critical Handles document analysis and extraction
 * @ai-modifiable true
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { DocumentIntelligenceSystem } from '../services/documents/DocumentIntelligenceSystem';
import { caseMemoryService } from '../services/CaseMemoryService';
import { eq, desc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '../../shared/schema';
import { promises as fs } from 'fs';
import path from 'path';

// Initialize PostgreSQL client pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialize Drizzle ORM
const db = drizzle(pool, { schema });

// Request validation schemas
const analyzeDocumentSchema = z.object({
  documentId: z.string().uuid().optional(),
  filePath: z.string().optional(),
  fileUrl: z.string().url().optional(),
  documentType: z.enum(['income_verification', 'hardship_letter', 'financial_statement', 'property_documents', 'correspondence']),
  caseId: z.string().uuid(),
  extractionOptions: z.object({
    detectTables: z.boolean().default(true),
    extractDates: z.boolean().default(true),
    extractAmounts: z.boolean().default(true),
    validateData: z.boolean().default(true)
  }).optional()
});

const batchAnalysisSchema = z.object({
  caseId: z.string().uuid(),
  documentIds: z.array(z.string().uuid()).min(1).max(50)
});

const extractDataSchema = z.object({
  documentId: z.string().uuid(),
  extractionType: z.enum(['structured', 'unstructured', 'mixed']).default('mixed'),
  targetFields: z.array(z.string()).optional(),
  outputFormat: z.enum(['json', 'csv', 'uba_compatible']).default('json')
});

/**
 * @ai-purpose Document intelligence and analysis controller
 */
export const documentIntelligenceController = {
  /**
   * @api {post} /api/v1/documents/analyze Analyze document
   * @apiDescription Analyzes a document using AI to extract information
   */
  async analyzeDocument(req: Request, res: Response) {
    const traceId = `DOC-ANALYZE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${traceId}] Analyzing document`);

    try {
      const validatedData = analyzeDocumentSchema.parse(req.body);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Initialize document intelligence system
      const docIntelligence = new DocumentIntelligenceSystem();

      // Prepare document for analysis
      let documentContent: Buffer | string;
      let fileName: string;

      if (validatedData.filePath) {
        // Read from local file
        documentContent = await fs.readFile(validatedData.filePath);
        fileName = path.basename(validatedData.filePath);
      } else if (validatedData.fileUrl) {
        // Fetch from URL
        const response = await fetch(validatedData.fileUrl);
        documentContent = Buffer.from(await response.arrayBuffer());
        fileName = validatedData.fileUrl.split('/').pop() || 'document';
      } else if (validatedData.documentId) {
        // Get from database
        const [upload] = await db
          .select()
          .from(schema.uploads)
          .where(eq(schema.uploads.id, validatedData.documentId))
          .limit(1);

        if (!upload) {
          return res.status(404).json({ error: 'Document not found' });
        }

        // Fetch document content from storage
        const response = await fetch(upload.file_url);
        documentContent = Buffer.from(await response.arrayBuffer());
        fileName = upload.file_name;
      } else {
        return res.status(400).json({ error: 'No document source provided' });
      }

      // Analyze document
      const analysis = await docIntelligence.analyzeDocument({
        content: documentContent,
        fileName,
        documentType: validatedData.documentType,
        options: validatedData.extractionOptions
      });

      // Store analysis results
      if (validatedData.documentId) {
        await db.insert(schema.uba_document_attachments).values({
          uba_form_data_id: validatedData.caseId, // This should be UBA form ID
          document_type: validatedData.documentType,
          document_title: fileName,
          file_url: validatedData.fileUrl || '',
          file_name: fileName,
          file_size_bytes: documentContent.length,
          content_type: analysis.mimeType || 'application/octet-stream',
          processing_status: 'processed',
          extraction_confidence: Math.round(analysis.confidence * 100),
          extracted_data: JSON.stringify(analysis.extractedData),
          uba_compliance_check: JSON.stringify(analysis.complianceCheck || {}),
          meets_uba_requirements: analysis.meetsRequirements || false
        });
      }

      // Update case memory with document intelligence
      await caseMemoryService.updateMemory(validatedData.caseId, {
        type: 'document',
        data: {
          type: validatedData.documentType,
          fileName,
          extractedData: analysis.extractedData,
          confidence: analysis.confidence,
          insights: analysis.insights
        },
        source: 'document_intelligence',
        confidence: analysis.confidence
      });

      // Create AI interaction record
      await db.insert(schema.ai_interactions).values({
        case_id: validatedData.caseId,
        user_id: userId,
        interaction_type: 'document_analysis',
        session_id: traceId,
        model_used: analysis.modelUsed || 'gpt-4-vision',
        user_input: fileName,
        ai_output: JSON.stringify(analysis),
        confidence_score: String(analysis.confidence),
        tokens_used: analysis.tokensUsed || 0,
        processing_time_ms: analysis.processingTime || 0
      });

      console.log(`[${traceId}] Document analyzed successfully`);

      return res.json({
        documentId: validatedData.documentId,
        fileName,
        documentType: validatedData.documentType,
        confidence: analysis.confidence,
        extractedData: analysis.extractedData,
        insights: analysis.insights,
        complianceCheck: analysis.complianceCheck,
        meetsRequirements: analysis.meetsRequirements,
        processingTime: analysis.processingTime
      });

    } catch (error) {
      console.error(`[${traceId}] Document analysis error:`, error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid request data',
          details: error.errors 
        });
      }

      return res.status(500).json({ 
        error: 'Failed to analyze document',
        details: error.message 
      });
    }
  },

  /**
   * @api {post} /api/v1/documents/extract Extract data from document
   * @apiDescription Extracts specific data fields from a document
   */
  async extractData(req: Request, res: Response) {
    const traceId = `DOC-EXTRACT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${traceId}] Extracting data from document ${req.body.documentId}`);

    try {
      const validatedData = extractDataSchema.parse(req.body);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get document attachment
      const [attachment] = await db
        .select()
        .from(schema.uba_document_attachments)
        .where(eq(schema.uba_document_attachments.id, validatedData.documentId))
        .limit(1);

      if (!attachment) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Parse existing extracted data
      const existingData = JSON.parse(attachment.extracted_data || '{}');

      // Format based on requested output
      let formattedData: any;

      switch (validatedData.outputFormat) {
        case 'csv':
          // Convert to CSV format
          const headers = validatedData.targetFields || Object.keys(existingData);
          const values = headers.map(field => existingData[field] || '');
          formattedData = [headers.join(','), values.join(',')].join('\n');
          break;

        case 'uba_compatible':
          // Format for UBA form compatibility
          formattedData = {
            borrower_name: existingData.borrowerName || existingData.name,
            monthly_gross_income: existingData.monthlyIncome || existingData.income,
            property_address: existingData.propertyAddress || existingData.address,
            loan_number: existingData.loanNumber,
            hardship_description: existingData.hardshipReason || existingData.description,
            // Add more UBA field mappings
          };
          break;

        default:
          // JSON format
          if (validatedData.targetFields) {
            formattedData = {};
            validatedData.targetFields.forEach(field => {
              formattedData[field] = existingData[field] || null;
            });
          } else {
            formattedData = existingData;
          }
      }

      console.log(`[${traceId}] Data extracted successfully`);

      return res.json({
        documentId: validatedData.documentId,
        extractionType: validatedData.extractionType,
        outputFormat: validatedData.outputFormat,
        data: formattedData,
        confidence: attachment.extraction_confidence ? attachment.extraction_confidence / 100 : 0
      });

    } catch (error) {
      console.error(`[${traceId}] Data extraction error:`, error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid request data',
          details: error.errors 
        });
      }

      return res.status(500).json({ 
        error: 'Failed to extract data',
        details: error.message 
      });
    }
  },

  /**
   * @api {get} /api/v1/documents/:documentId/insights Get document insights
   * @apiDescription Gets AI-generated insights about a document
   */
  async getDocumentInsights(req: Request, res: Response) {
    const traceId = `DOC-INSIGHTS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${traceId}] Getting insights for document ${req.params.documentId}`);

    try {
      const documentId = req.params.documentId;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get document attachment
      const [attachment] = await db
        .select()
        .from(schema.uba_document_attachments)
        .where(eq(schema.uba_document_attachments.id, documentId))
        .limit(1);

      if (!attachment) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Parse data
      const extractedData = JSON.parse(attachment.extracted_data || '{}');
      const complianceCheck = JSON.parse(attachment.uba_compliance_check || '{}');

      // Generate insights
      const insights = {
        summary: extractedData.summary || 'Document processed successfully',
        keyFindings: extractedData.keyFindings || [],
        dataQuality: {
          completeness: calculateCompleteness(extractedData),
          accuracy: attachment.extraction_confidence ? attachment.extraction_confidence / 100 : 0,
          consistency: checkConsistency(extractedData)
        },
        compliance: {
          meetsRequirements: attachment.meets_uba_requirements,
          issues: complianceCheck.issues || [],
          recommendations: complianceCheck.recommendations || []
        },
        nextSteps: generateNextSteps(attachment.document_type, extractedData),
        relatedDocuments: await findRelatedDocuments(attachment.uba_form_data_id, attachment.document_type)
      };

      console.log(`[${traceId}] Insights generated successfully`);

      return res.json({
        documentId,
        documentType: attachment.document_type,
        insights
      });

    } catch (error) {
      console.error(`[${traceId}] Failed to get document insights:`, error);
      return res.status(500).json({ 
        error: 'Failed to retrieve document insights',
        details: error.message 
      });
    }
  },

  /**
   * @api {post} /api/v1/documents/batch-analyze Batch analyze documents
   * @apiDescription Analyzes multiple documents in batch
   */
  async batchAnalyzeDocuments(req: Request, res: Response) {
    const traceId = `DOC-BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${traceId}] Batch analyzing documents`);

    try {
      const validatedData = batchAnalysisSchema.parse(req.body);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get all documents
      const documents = await db
        .select()
        .from(schema.uploads)
        .where(eq(schema.uploads.transaction_id, validatedData.caseId))
        .limit(validatedData.documentIds.length);

      const results = [];
      const docIntelligence = new DocumentIntelligenceSystem();

      // Process each document
      for (const doc of documents) {
        try {
          const analysis = await docIntelligence.analyzeDocument({
            content: doc.file_url, // This would need to fetch content
            fileName: doc.file_name,
            documentType: doc.doc_type as any,
            options: {
              detectTables: true,
              extractDates: true,
              extractAmounts: true,
              validateData: true
            }
          });

          results.push({
            documentId: doc.id,
            fileName: doc.file_name,
            status: 'success',
            confidence: analysis.confidence,
            insights: analysis.insights
          });

        } catch (error) {
          results.push({
            documentId: doc.id,
            fileName: doc.file_name,
            status: 'failed',
            error: error.message
          });
        }
      }

      // Update case memory with batch results
      await caseMemoryService.updateMemory(validatedData.caseId, {
        type: 'document',
        data: {
          batchAnalysis: true,
          totalDocuments: documents.length,
          successCount: results.filter(r => r.status === 'success').length,
          averageConfidence: results
            .filter(r => r.status === 'success')
            .reduce((sum, r) => sum + r.confidence, 0) / results.filter(r => r.status === 'success').length
        },
        source: 'batch_document_intelligence',
        confidence: 0.9
      });

      console.log(`[${traceId}] Batch analysis completed`);

      return res.json({
        caseId: validatedData.caseId,
        totalDocuments: documents.length,
        results
      });

    } catch (error) {
      console.error(`[${traceId}] Batch analysis error:`, error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid request data',
          details: error.errors 
        });
      }

      return res.status(500).json({ 
        error: 'Failed to batch analyze documents',
        details: error.message 
      });
    }
  },

  /**
   * @api {get} /api/v1/documents/case/:caseId/summary Get case document summary
   * @apiDescription Gets a summary of all documents for a case
   */
  async getCaseDocumentSummary(req: Request, res: Response) {
    const traceId = `DOC-SUMMARY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${traceId}] Getting document summary for case ${req.params.caseId}`);

    try {
      const caseId = req.params.caseId;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get all document attachments for the case
      const attachments = await db
        .select()
        .from(schema.uba_document_attachments)
        .orderBy(desc(schema.uba_document_attachments.uploaded_at));

      // Get document context from case memory
      const documentContext = await caseMemoryService.getDocumentContext(caseId);

      // Categorize documents
      const categorized = {
        income_verification: attachments.filter(a => a.document_type === 'income_verification'),
        hardship_letter: attachments.filter(a => a.document_type === 'hardship_letter'),
        financial_statement: attachments.filter(a => a.document_type === 'financial_statement'),
        property_documents: attachments.filter(a => a.document_type === 'property_documents'),
        correspondence: attachments.filter(a => a.document_type === 'correspondence')
      };

      // Calculate completeness
      const requiredTypes = ['income_verification', 'hardship_letter', 'financial_statement'];
      const completeness = requiredTypes.filter(type => categorized[type].length > 0).length / requiredTypes.length;

      console.log(`[${traceId}] Document summary generated`);

      return res.json({
        caseId,
        summary: {
          totalDocuments: attachments.length,
          processedDocuments: attachments.filter(a => a.processing_status === 'processed').length,
          averageConfidence: attachments
            .filter(a => a.extraction_confidence)
            .reduce((sum, a) => sum + (a.extraction_confidence || 0), 0) / attachments.filter(a => a.extraction_confidence).length / 100 || 0,
          completeness,
          categorized,
          missingDocuments: documentContext.missing,
          lastUpdated: attachments[0]?.uploaded_at || null
        }
      });

    } catch (error) {
      console.error(`[${traceId}] Failed to get document summary:`, error);
      return res.status(500).json({ 
        error: 'Failed to retrieve document summary',
        details: error.message 
      });
    }
  }
};

// Helper functions
function calculateCompleteness(data: any): number {
  const fields = Object.keys(data);
  const filledFields = fields.filter(field => data[field] !== null && data[field] !== undefined && data[field] !== '');
  return fields.length > 0 ? filledFields.length / fields.length : 0;
}

function checkConsistency(data: any): number {
  // Basic consistency check - can be enhanced
  let score = 1.0;
  
  // Check date consistency
  if (data.dates) {
    const dates = Object.values(data.dates).map((d: any) => new Date(d).getTime());
    if (dates.some((d: number) => d > Date.now())) {
      score -= 0.2; // Future dates reduce consistency
    }
  }
  
  // Check amount consistency
  if (data.amounts) {
    const amounts = Object.values(data.amounts).map((a: any) => parseFloat(a));
    if (amounts.some((a: number) => a < 0)) {
      score -= 0.1; // Negative amounts might be inconsistent
    }
  }
  
  return Math.max(0, score);
}

function generateNextSteps(documentType: string, extractedData: any): string[] {
  const steps = [];
  
  switch (documentType) {
    case 'income_verification':
      if (!extractedData.monthlyIncome) {
        steps.push('Verify monthly income amount');
      }
      if (!extractedData.employerName) {
        steps.push('Confirm employer information');
      }
      break;
      
    case 'hardship_letter':
      if (!extractedData.hardshipDate) {
        steps.push('Specify when hardship began');
      }
      if (!extractedData.hardshipType) {
        steps.push('Clarify type of hardship');
      }
      break;
      
    case 'financial_statement':
      if (!extractedData.totalAssets) {
        steps.push('Calculate total assets');
      }
      if (!extractedData.totalLiabilities) {
        steps.push('Calculate total liabilities');
      }
      break;
  }
  
  if (steps.length === 0) {
    steps.push('Document appears complete - ready for review');
  }
  
  return steps;
}

async function findRelatedDocuments(formId: string, documentType: string): Promise<any[]> {
  // This would query for related documents
  // For now, return empty array
  return [];
}