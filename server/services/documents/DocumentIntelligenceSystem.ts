/**
 * @ai-context Document intelligence system for ReAlign 3.0
 * @ai-purpose Processes all document types with AI extraction and validation
 * @test-coverage Requires test documents for each supported type
 * @ai-modifiable true
 */

import { ModelOrchestrator } from '../ai/ModelOrchestrator';
import { CaseMemoryService } from '../CaseMemoryService';

export interface DocumentUpload {
  id: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  userId: string;
  metadata?: {
    originalName?: string;
    encoding?: string;
    fieldName?: string;
  };
}

export interface ProcessedDocument {
  id: string;
  type: DocumentType;
  extracted: ExtractedData;
  confidence: ConfidenceScores;
  validation: ValidationResult;
  warnings: string[];
  processingTime: number;
  ocrText?: string;
  metadata?: {
    pageCount?: number;
    resolution?: string;
    fileFormat?: string;
  };
}

export interface ExtractedData {
  [key: string]: any;
  // Common fields across all documents
  documentDate?: string;
  documentType?: string;
  confidence?: number;
}

export interface ConfidenceScores {
  overall: number;
  fieldConfidence: Record<string, number>;
  ocrConfidence?: number;
  typeDetectionConfidence: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    error: string;
    severity: 'error' | 'warning' | 'info';
    suggestion?: string;
  }>;
  warnings: string[];
  completeness: number; // 0-1 scale
  accuracy: number; // 0-1 scale
}

export type DocumentType = 
  | 'paystub' 
  | 'bank_statement' 
  | 'tax_return' 
  | 'hardship_letter' 
  | 'mortgage_statement'
  | 'w2'
  | 'id_document'
  | 'utility_bill'
  | 'insurance_document'
  | 'other';

export interface DocumentProcessor {
  type: DocumentType;
  requiredFields: string[];
  optionalFields: string[];
  validationRules: ValidationRule[];
  extract(upload: DocumentUpload, options: ProcessingOptions): Promise<ExtractionResult>;
  validate(extracted: ExtractionResult, requirements: any): Promise<ValidationResult>;
}

export interface ValidationRule {
  field: string;
  rule: 'required' | 'numeric' | 'date' | 'currency' | 'percentage' | 'custom';
  reference?: string;
  customValidator?: (value: any, data: any) => boolean;
  message?: string;
}

export interface ProcessingOptions {
  enhanceContrast?: boolean;
  ocrLanguages?: string[];
  confidenceThreshold?: number;
  extractTables?: boolean;
  detectHandwriting?: boolean;
  preserveFormatting?: boolean;
}

export interface ExtractionResult {
  data: ExtractedData;
  confidence: ConfidenceScores;
  warnings: string[];
  averageConfidence: number;
  ocrText?: string;
  tables?: Array<{
    headers: string[];
    rows: string[][];
    confidence: number;
  }>;
}

/**
 * @ai-purpose Core document intelligence system with specialized processors
 * @debug-trace Log all processing steps with confidence and validation results
 */
export class DocumentIntelligenceSystem {
  private processors: Map<DocumentType, DocumentProcessor>;
  private modelOrchestrator: ModelOrchestrator;
  private caseMemoryService: CaseMemoryService;
  private typeDetector: DocumentTypeDetector;

  constructor() {
    this.processors = new Map();
    this.modelOrchestrator = new ModelOrchestrator();
    this.caseMemoryService = new CaseMemoryService();
    this.typeDetector = new DocumentTypeDetector();
    this.initializeProcessors();
  }

  private generateProcessId(uploadId: string): string {
    return `DOC-${uploadId}-${Date.now()}`;
  }

  /**
   * @ai-purpose Process uploaded document with type detection and extraction
   * @debug-trace Log extraction confidence and validation results
   */
  async processDocument(
    upload: DocumentUpload,
    caseId: string
  ): Promise<ProcessedDocument> {
    const processId = this.generateProcessId(upload.id);
    const startTime = Date.now();
    
    console.log(`[${processId}] Starting document processing`, {
      fileName: upload.fileName,
      fileSize: upload.size,
      mimeType: upload.mimeType,
      caseId
    });

    try {
      // Step 1: Detect document type
      const docType = await this.detectDocumentType(upload, processId);
      console.log(`[${processId}] Document type detected: ${docType}`);

      // Step 2: Get appropriate processor
      const processor = this.processors.get(docType);
      if (!processor) {
        throw new UnsupportedDocumentError(`No processor available for document type: ${docType}`);
      }

      // Step 3: Extract data with confidence scoring
      const extracted = await processor.extract(upload, {
        enhanceContrast: true,
        ocrLanguages: ['en', 'es'],
        confidenceThreshold: 0.85,
        extractTables: true,
        detectHandwriting: true,
        preserveFormatting: false
      });

      console.log(`[${processId}] Data extraction completed`, {
        fieldsExtracted: Object.keys(extracted.data).length,
        averageConfidence: extracted.averageConfidence,
        warningCount: extracted.warnings.length
      });

      // Step 4: Validate against case requirements
      const caseRequirements = await this.getCaseRequirements(caseId);
      const validation = await processor.validate(extracted, caseRequirements);

      console.log(`[${processId}] Validation completed`, {
        isValid: validation.isValid,
        errorCount: validation.errors.length,
        completeness: validation.completeness,
        accuracy: validation.accuracy
      });

      // Step 5: Store in case memory
      await this.updateDocumentMemory(caseId, {
        document: upload,
        extracted,
        validation,
        processId
      });

      // Step 6: Trigger learning if high confidence
      if (extracted.averageConfidence > 0.9) {
        await this.triggerLearning(docType, extracted, validation);
      }

      const processingTime = Date.now() - startTime;
      
      console.log(`[${processId}] Document processing completed`, {
        success: true,
        processingTime,
        finalConfidence: extracted.confidence.overall
      });

      return {
        id: processId,
        type: docType,
        extracted: extracted.data,
        confidence: extracted.confidence,
        validation,
        warnings: [...extracted.warnings, ...validation.warnings],
        processingTime,
        ocrText: extracted.ocrText,
        metadata: {
          pageCount: await this.getPageCount(upload),
          fileFormat: upload.mimeType,
          resolution: await this.getImageResolution(upload)
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      console.error(`[${processId}] Document processing failed`, {
        error: error.message,
        processingTime,
        fileName: upload.fileName
      });

      // Store failed processing attempt for debugging
      await this.storeProcessingError(caseId, upload, error, processId);

      throw new DocumentProcessingError(error.message, {
        processId,
        documentId: upload.id,
        caseId,
        fileName: upload.fileName
      });
    }
  }

  /**
   * @ai-purpose Detect document type using AI vision
   */
  private async detectDocumentType(
    upload: DocumentUpload,
    processId: string
  ): Promise<DocumentType> {
    console.log(`[${processId}] Detecting document type`);

    try {
      // Use AI model to detect document type
      const result = await this.modelOrchestrator.executeTask({
        type: 'document',
        input: {
          filePath: upload.filePath,
          fileName: upload.fileName,
          mimeType: upload.mimeType
        },
        options: {
          temperature: 0.1, // Low temperature for accuracy
          maxTokens: 200
        }
      }, {
        requiresAccuracy: true,
        urgency: 'medium'
      });

      // Extract document type from AI response
      const detectedType = this.parseDocumentType(result.data);
      
      // Fallback to filename-based detection if AI confidence is low
      if (result.confidence < 0.7) {
        const fileNameType = this.detectTypeFromFileName(upload.fileName);
        if (fileNameType !== 'other') {
          console.log(`[${processId}] Using filename-based detection as fallback`);
          return fileNameType;
        }
      }

      return detectedType;

    } catch (error) {
      console.warn(`[${processId}] AI type detection failed, using filename fallback`, {
        error: error.message
      });
      
      // Fallback to filename-based detection
      return this.detectTypeFromFileName(upload.fileName);
    }
  }

  /**
   * @ai-purpose Parse document type from AI response
   */
  private parseDocumentType(aiResponse: any): DocumentType {
    const responseText = aiResponse.documentType || aiResponse.type || '';
    const lowerResponse = responseText.toLowerCase();

    if (lowerResponse.includes('paystub') || lowerResponse.includes('pay stub')) {
      return 'paystub';
    } else if (lowerResponse.includes('bank statement')) {
      return 'bank_statement';
    } else if (lowerResponse.includes('tax return') || lowerResponse.includes('1040')) {
      return 'tax_return';
    } else if (lowerResponse.includes('hardship letter')) {
      return 'hardship_letter';
    } else if (lowerResponse.includes('mortgage statement')) {
      return 'mortgage_statement';
    } else if (lowerResponse.includes('w2') || lowerResponse.includes('w-2')) {
      return 'w2';
    } else if (lowerResponse.includes('id') || lowerResponse.includes('license')) {
      return 'id_document';
    } else if (lowerResponse.includes('utility') || lowerResponse.includes('bill')) {
      return 'utility_bill';
    } else if (lowerResponse.includes('insurance')) {
      return 'insurance_document';
    }

    return 'other';
  }

  /**
   * @ai-purpose Detect document type from filename
   */
  private detectTypeFromFileName(fileName: string): DocumentType {
    const lowerFileName = fileName.toLowerCase();

    if (lowerFileName.includes('paystub') || lowerFileName.includes('paycheck')) {
      return 'paystub';
    } else if (lowerFileName.includes('bank') || lowerFileName.includes('statement')) {
      return 'bank_statement';
    } else if (lowerFileName.includes('tax') || lowerFileName.includes('1040')) {
      return 'tax_return';
    } else if (lowerFileName.includes('hardship')) {
      return 'hardship_letter';
    } else if (lowerFileName.includes('mortgage')) {
      return 'mortgage_statement';
    } else if (lowerFileName.includes('w2')) {
      return 'w2';
    } else if (lowerFileName.includes('id') || lowerFileName.includes('license')) {
      return 'id_document';
    } else if (lowerFileName.includes('utility') || lowerFileName.includes('bill')) {
      return 'utility_bill';
    } else if (lowerFileName.includes('insurance')) {
      return 'insurance_document';
    }

    return 'other';
  }

  /**
   * @ai-purpose Get case requirements for validation
   */
  private async getCaseRequirements(caseId: string): Promise<any> {
    try {
      const caseMemory = await this.caseMemoryService.getMemory(caseId);
      return {
        requiredDocuments: caseMemory?.documents_missing || [],
        minimumConfidence: 0.8,
        requiresAllFields: false
      };
    } catch (error) {
      console.warn(`Failed to get case requirements for ${caseId}:`, error);
      return {
        requiredDocuments: [],
        minimumConfidence: 0.8,
        requiresAllFields: false
      };
    }
  }

  /**
   * @ai-purpose Update case memory with document processing results
   */
  private async updateDocumentMemory(
    caseId: string,
    data: {
      document: DocumentUpload;
      extracted: ExtractionResult;
      validation: ValidationResult;
      processId: string;
    }
  ): Promise<void> {
    try {
      await this.caseMemoryService.updateMemory(caseId, {
        type: 'document',
        data: {
          type: data.document.fileName,
          extractedData: data.extracted.data,
          confidence: data.extracted.confidence.overall,
          validation: data.validation,
          processId: data.processId
        },
        source: 'document_processor',
        confidence: data.extracted.confidence.overall,
        timestamp: new Date()
      });
    } catch (error) {
      console.error(`Failed to update document memory for case ${caseId}:`, error);
      // Non-critical error, don't fail the processing
    }
  }

  /**
   * @ai-purpose Trigger learning from successful processing
   */
  private async triggerLearning(
    docType: DocumentType,
    extracted: ExtractionResult,
    validation: ValidationResult
  ): Promise<void> {
    try {
      // This would integrate with the learning pipeline
      console.log(`[LEARNING] High-confidence processing for ${docType}`, {
        confidence: extracted.confidence.overall,
        validationScore: validation.accuracy
      });
      
      // Store patterns for future improvements
      // Implementation would depend on learning pipeline
    } catch (error) {
      console.warn('Failed to trigger learning:', error);
    }
  }

  /**
   * @ai-purpose Store processing error for debugging
   */
  private async storeProcessingError(
    caseId: string,
    upload: DocumentUpload,
    error: Error,
    processId: string
  ): Promise<void> {
    try {
      await this.caseMemoryService.updateMemory(caseId, {
        type: 'interaction',
        data: {
          type: 'document_processing_error',
          details: {
            fileName: upload.fileName,
            fileSize: upload.size,
            error: error.message,
            processId
          },
          outcome: 'failed'
        },
        source: 'document_processor',
        confidence: 1.0,
        timestamp: new Date()
      });
    } catch (memoryError) {
      console.error('Failed to store processing error:', memoryError);
    }
  }

  /**
   * @ai-purpose Get page count for document
   */
  private async getPageCount(upload: DocumentUpload): Promise<number> {
    // Placeholder implementation - would use PDF library or image analysis
    return 1;
  }

  /**
   * @ai-purpose Get image resolution
   */
  private async getImageResolution(upload: DocumentUpload): Promise<string> {
    // Placeholder implementation - would analyze image metadata
    return 'unknown';
  }

  /**
   * @ai-purpose Initialize specialized processors for each document type
   */
  private initializeProcessors(): void {
    console.log('[DocumentIntelligenceSystem] Initializing document processors');

    // Paystub processor
    this.processors.set('paystub', new PaystubProcessor());
    
    // Bank statement processor
    this.processors.set('bank_statement', new BankStatementProcessor());
    
    // Tax return processor
    this.processors.set('tax_return', new TaxReturnProcessor());
    
    // Hardship letter processor
    this.processors.set('hardship_letter', new HardshipLetterProcessor());
    
    // Mortgage statement processor
    this.processors.set('mortgage_statement', new MortgageStatementProcessor());
    
    // W2 processor
    this.processors.set('w2', new W2Processor());
    
    // ID document processor
    this.processors.set('id_document', new IdDocumentProcessor());
    
    // Utility bill processor
    this.processors.set('utility_bill', new UtilityBillProcessor());
    
    // Insurance document processor
    this.processors.set('insurance_document', new InsuranceDocumentProcessor());
    
    // Generic processor for unknown types
    this.processors.set('other', new GenericDocumentProcessor());

    console.log('[DocumentIntelligenceSystem] Document processors initialized');
  }

  /**
   * @ai-purpose Get list of supported document types
   */
  getSupportedDocumentTypes(): DocumentType[] {
    return Array.from(this.processors.keys());
  }

  /**
   * @ai-purpose Get processing statistics
   */
  async getProcessingStatistics(): Promise<{
    totalProcessed: number;
    averageConfidence: number;
    successRate: number;
    processingTimes: Record<DocumentType, number>;
  }> {
    // This would aggregate statistics from the case memory system
    return {
      totalProcessed: 0,
      averageConfidence: 0,
      successRate: 0,
      processingTimes: {}
    };
  }
}

// Document type detector helper class
class DocumentTypeDetector {
  // Implementation for advanced document type detection
}

// Specialized processor implementations (placeholder implementations)
class PaystubProcessor implements DocumentProcessor {
  type: DocumentType = 'paystub';
  requiredFields = ['employerName', 'employeeName', 'payPeriodStart', 'payPeriodEnd', 'grossPay', 'netPay'];
  optionalFields = ['overtime', 'bonuses', 'deductions', 'taxes', 'ytdGross'];
  validationRules: ValidationRule[] = [
    { field: 'netPay', rule: 'numeric', message: 'Net pay must be a valid number' },
    { field: 'grossPay', rule: 'numeric', message: 'Gross pay must be a valid number' },
    { field: 'payPeriodStart', rule: 'date', message: 'Pay period start must be a valid date' },
    { field: 'payPeriodEnd', rule: 'date', message: 'Pay period end must be a valid date' }
  ];

  async extract(upload: DocumentUpload, options: ProcessingOptions): Promise<ExtractionResult> {
    // Placeholder implementation - would use AI/OCR for actual extraction
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing

    return {
      data: {
        employerName: 'Sample Employer Inc.',
        employeeName: 'John Doe',
        payPeriodStart: '2024-01-01',
        payPeriodEnd: '2024-01-15',
        grossPay: '2500.00',
        netPay: '1850.00',
        ytdGross: '5000.00',
        documentType: 'paystub'
      },
      confidence: {
        overall: 0.92,
        fieldConfidence: {
          employerName: 0.95,
          employeeName: 0.90,
          grossPay: 0.88,
          netPay: 0.90
        },
        typeDetectionConfidence: 0.95,
        ocrConfidence: 0.85
      },
      warnings: [],
      averageConfidence: 0.92
    };
  }

  async validate(extracted: ExtractionResult, requirements: any): Promise<ValidationResult> {
    const errors: ValidationResult['errors'] = [];
    const warnings: string[] = [];

    // Validate required fields
    for (const field of this.requiredFields) {
      if (!extracted.data[field]) {
        errors.push({
          field,
          error: `${field} is required but not found`,
          severity: 'error',
          suggestion: `Please ensure the ${field} is clearly visible in the document`
        });
      }
    }

    // Validate numeric fields
    if (extracted.data.grossPay && extracted.data.netPay) {
      const gross = parseFloat(extracted.data.grossPay);
      const net = parseFloat(extracted.data.netPay);
      
      if (net > gross) {
        errors.push({
          field: 'netPay',
          error: 'Net pay cannot be greater than gross pay',
          severity: 'error',
          suggestion: 'Please verify the pay amounts in the document'
        });
      }
    }

    const completeness = (this.requiredFields.length - errors.filter(e => e.severity === 'error').length) / this.requiredFields.length;
    const accuracy = extracted.confidence.overall;

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      warnings,
      completeness,
      accuracy
    };
  }
}

class BankStatementProcessor implements DocumentProcessor {
  type: DocumentType = 'bank_statement';
  requiredFields = ['accountNumber', 'routingNumber', 'statementPeriod', 'beginningBalance', 'endingBalance'];
  optionalFields = ['transactions', 'averageBalance', 'minimumBalance'];
  validationRules: ValidationRule[] = [];

  async extract(upload: DocumentUpload, options: ProcessingOptions): Promise<ExtractionResult> {
    await new Promise(resolve => setTimeout(resolve, 1200));

    return {
      data: {
        accountNumber: 'XXXX1234',
        routingNumber: '123456789',
        statementPeriod: 'January 2024',
        beginningBalance: '1500.00',
        endingBalance: '1750.00',
        averageBalance: '1625.00',
        documentType: 'bank_statement'
      },
      confidence: {
        overall: 0.88,
        fieldConfidence: {
          accountNumber: 0.92,
          routingNumber: 0.85,
          beginningBalance: 0.90,
          endingBalance: 0.88
        },
        typeDetectionConfidence: 0.93,
        ocrConfidence: 0.82
      },
      warnings: ['Some transaction details may be unclear'],
      averageConfidence: 0.88
    };
  }

  async validate(extracted: ExtractionResult, requirements: any): Promise<ValidationResult> {
    return {
      isValid: true,
      errors: [],
      warnings: [],
      completeness: 0.9,
      accuracy: 0.88
    };
  }
}

// Additional processor classes would be implemented similarly...
class TaxReturnProcessor implements DocumentProcessor {
  type: DocumentType = 'tax_return';
  requiredFields = ['taxYear', 'filingStatus', 'agi', 'totalIncome'];
  optionalFields = ['refundAmount', 'taxOwed', 'schedules'];
  validationRules: ValidationRule[] = [];

  async extract(upload: DocumentUpload, options: ProcessingOptions): Promise<ExtractionResult> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      data: { taxYear: '2023', filingStatus: 'Single', agi: '45000', documentType: 'tax_return' },
      confidence: { overall: 0.85, fieldConfidence: {}, typeDetectionConfidence: 0.90 },
      warnings: [],
      averageConfidence: 0.85
    };
  }

  async validate(extracted: ExtractionResult, requirements: any): Promise<ValidationResult> {
    return { isValid: true, errors: [], warnings: [], completeness: 0.85, accuracy: 0.85 };
  }
}

class HardshipLetterProcessor implements DocumentProcessor {
  type: DocumentType = 'hardship_letter';
  requiredFields = ['hardshipReason', 'dateOfHardship', 'requestedAssistance'];
  optionalFields = ['supportingDetails', 'contactInformation'];
  validationRules: ValidationRule[] = [];

  async extract(upload: DocumentUpload, options: ProcessingOptions): Promise<ExtractionResult> {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      data: { hardshipReason: 'Job Loss', dateOfHardship: '2024-01-01', documentType: 'hardship_letter' },
      confidence: { overall: 0.80, fieldConfidence: {}, typeDetectionConfidence: 0.85 },
      warnings: [],
      averageConfidence: 0.80
    };
  }

  async validate(extracted: ExtractionResult, requirements: any): Promise<ValidationResult> {
    return { isValid: true, errors: [], warnings: [], completeness: 0.80, accuracy: 0.80 };
  }
}

class MortgageStatementProcessor implements DocumentProcessor {
  type: DocumentType = 'mortgage_statement';
  requiredFields = ['loanNumber', 'currentBalance', 'monthlyPayment', 'nextDueDate'];
  optionalFields = ['interestRate', 'escrowBalance', 'paymentHistory'];
  validationRules: ValidationRule[] = [];

  async extract(upload: DocumentUpload, options: ProcessingOptions): Promise<ExtractionResult> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      data: { loanNumber: '1234567890', currentBalance: '250000', monthlyPayment: '1800', documentType: 'mortgage_statement' },
      confidence: { overall: 0.90, fieldConfidence: {}, typeDetectionConfidence: 0.92 },
      warnings: [],
      averageConfidence: 0.90
    };
  }

  async validate(extracted: ExtractionResult, requirements: any): Promise<ValidationResult> {
    return { isValid: true, errors: [], warnings: [], completeness: 0.90, accuracy: 0.90 };
  }
}

class W2Processor implements DocumentProcessor {
  type: DocumentType = 'w2';
  requiredFields = ['employerName', 'employeeSSN', 'wagesAndTips', 'federalIncomeTax'];
  optionalFields = ['stateTax', 'socialSecurityWages', 'medicareWages'];
  validationRules: ValidationRule[] = [];

  async extract(upload: DocumentUpload, options: ProcessingOptions): Promise<ExtractionResult> {
    await new Promise(resolve => setTimeout(resolve, 900));
    return {
      data: { employerName: 'Sample Corp', wagesAndTips: '45000', federalIncomeTax: '5000', documentType: 'w2' },
      confidence: { overall: 0.87, fieldConfidence: {}, typeDetectionConfidence: 0.90 },
      warnings: [],
      averageConfidence: 0.87
    };
  }

  async validate(extracted: ExtractionResult, requirements: any): Promise<ValidationResult> {
    return { isValid: true, errors: [], warnings: [], completeness: 0.87, accuracy: 0.87 };
  }
}

class IdDocumentProcessor implements DocumentProcessor {
  type: DocumentType = 'id_document';
  requiredFields = ['fullName', 'dateOfBirth', 'documentNumber'];
  optionalFields = ['address', 'expirationDate', 'issuingState'];
  validationRules: ValidationRule[] = [];

  async extract(upload: DocumentUpload, options: ProcessingOptions): Promise<ExtractionResult> {
    await new Promise(resolve => setTimeout(resolve, 700));
    return {
      data: { fullName: 'John Doe', dateOfBirth: '1980-01-01', documentNumber: 'D123456789', documentType: 'id_document' },
      confidence: { overall: 0.89, fieldConfidence: {}, typeDetectionConfidence: 0.92 },
      warnings: [],
      averageConfidence: 0.89
    };
  }

  async validate(extracted: ExtractionResult, requirements: any): Promise<ValidationResult> {
    return { isValid: true, errors: [], warnings: [], completeness: 0.89, accuracy: 0.89 };
  }
}

class UtilityBillProcessor implements DocumentProcessor {
  type: DocumentType = 'utility_bill';
  requiredFields = ['serviceAddress', 'billingPeriod', 'amountDue', 'dueDate'];
  optionalFields = ['accountNumber', 'previousBalance', 'usageAmount'];
  validationRules: ValidationRule[] = [];

  async extract(upload: DocumentUpload, options: ProcessingOptions): Promise<ExtractionResult> {
    await new Promise(resolve => setTimeout(resolve, 600));
    return {
      data: { serviceAddress: '123 Main St', billingPeriod: 'Jan 2024', amountDue: '120.50', documentType: 'utility_bill' },
      confidence: { overall: 0.83, fieldConfidence: {}, typeDetectionConfidence: 0.88 },
      warnings: [],
      averageConfidence: 0.83
    };
  }

  async validate(extracted: ExtractionResult, requirements: any): Promise<ValidationResult> {
    return { isValid: true, errors: [], warnings: [], completeness: 0.83, accuracy: 0.83 };
  }
}

class InsuranceDocumentProcessor implements DocumentProcessor {
  type: DocumentType = 'insurance_document';
  requiredFields = ['policyNumber', 'coverageAmount', 'policyPeriod'];
  optionalFields = ['deductible', 'premiumAmount', 'beneficiaries'];
  validationRules: ValidationRule[] = [];

  async extract(upload: DocumentUpload, options: ProcessingOptions): Promise<ExtractionResult> {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      data: { policyNumber: 'POL123456', coverageAmount: '100000', policyPeriod: '2024', documentType: 'insurance_document' },
      confidence: { overall: 0.81, fieldConfidence: {}, typeDetectionConfidence: 0.85 },
      warnings: [],
      averageConfidence: 0.81
    };
  }

  async validate(extracted: ExtractionResult, requirements: any): Promise<ValidationResult> {
    return { isValid: true, errors: [], warnings: [], completeness: 0.81, accuracy: 0.81 };
  }
}

class GenericDocumentProcessor implements DocumentProcessor {
  type: DocumentType = 'other';
  requiredFields = [];
  optionalFields = ['textContent', 'documentTitle'];
  validationRules: ValidationRule[] = [];

  async extract(upload: DocumentUpload, options: ProcessingOptions): Promise<ExtractionResult> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      data: { textContent: 'General document content', documentType: 'other' },
      confidence: { overall: 0.70, fieldConfidence: {}, typeDetectionConfidence: 0.60 },
      warnings: ['Unable to determine specific document type'],
      averageConfidence: 0.70
    };
  }

  async validate(extracted: ExtractionResult, requirements: any): Promise<ValidationResult> {
    return { isValid: true, errors: [], warnings: ['Document type not specifically supported'], completeness: 0.70, accuracy: 0.70 };
  }
}

// Error classes
export class DocumentProcessingError extends Error {
  constructor(message: string, public context: any) {
    super(message);
    this.name = 'DocumentProcessingError';
  }
}

export class UnsupportedDocumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedDocumentError';
  }
}

/**
 * @ai-purpose Singleton instance for use across the application
 */
export const documentIntelligence = new DocumentIntelligenceSystem();