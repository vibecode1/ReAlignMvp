/**
 * @ai-context Chase-specific adapter for API-based submissions
 */

import { 
  ServicerAdapter, 
  PreparedApplication, 
  TransformedApplication, 
  SubmissionResult, 
  ValidationResult 
} from './ServicerAdapter';
import { Logger } from '../../logger';

interface ChaseConfig {
  id: string;
  name: string;
  type: 'api';
  apiEndpoint: string;
  apiKey: string;
  specificRequirements: {
    documentOrder: string[];
    dateFormat: string;
    requiresWetSignature: boolean;
    maxFileSize: number;
    supportedFormats: string[];
    namingConvention: string;
  };
}

export class ChaseAdapter extends ServicerAdapter {
  private logger: Logger;

  constructor(config: ChaseConfig) {
    super(config);
    this.logger = new Logger('ChaseAdapter');
  }

  async validateRequirements(application: PreparedApplication): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    const requirements = this.config.requirements as ChaseConfig['specificRequirements'];

    // Validate document order
    const docTypes = application.documents.map(d => d.type);
    const expectedOrder = requirements.documentOrder;
    
    if (!this.isOrderCorrect(docTypes, expectedOrder)) {
      warnings.push(`Chase prefers documents in this order: ${expectedOrder.join(', ')}`);
      suggestions.push('Reorder documents for faster processing');
    }

    // Validate file sizes
    for (const doc of application.documents) {
      if (!this.validateFileSize(doc.size, requirements.maxFileSize)) {
        errors.push(`${doc.fileName} exceeds max size of ${requirements.maxFileSize / (1024 * 1024)}MB`);
      }

      // Validate formats
      if (!this.validateFileFormat(doc.mimeType, requirements.supportedFormats)) {
        errors.push(`${doc.fileName} format not supported. Accepted: ${requirements.supportedFormats.join(', ')}`);
      }

      // Check naming convention
      const expectedName = this.formatFileName(
        requirements.namingConvention,
        doc.type,
        application.borrowerLastName,
        application.loanNumber,
        doc.fileName.split('.').pop() || 'pdf'
      );
      
      if (doc.fileName !== expectedName) {
        suggestions.push(`Rename ${doc.fileName} to ${expectedName} for better processing`);
      }
    }

    // Check for required documents
    const requiredDocs = ['hardship_letter', 'financial_statement', 'income_verification'];
    const missingDocs = requiredDocs.filter(req => !docTypes.includes(req));
    
    if (missingDocs.length > 0) {
      errors.push(`Missing required documents: ${missingDocs.join(', ')}`);
    }

    // Validate wet signature requirement
    if (!requirements.requiresWetSignature) {
      suggestions.push('Electronic signatures are accepted');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  async transform(application: PreparedApplication): Promise<TransformedApplication> {
    const requirements = this.config.requirements as ChaseConfig['specificRequirements'];

    // Transform to Chase API format
    const chaseData = {
      loanNumber: application.loanNumber,
      borrower: {
        firstName: application.borrowerName.split(' ')[0],
        lastName: application.borrowerLastName,
        fullName: application.borrowerName
      },
      submissionType: 'loss_mitigation',
      submissionDate: this.formatDate(new Date(), requirements.dateFormat),
      documents: application.documents.map((doc, index) => ({
        documentId: `DOC-${Date.now()}-${index}`,
        documentType: this.mapToChaseDocType(doc.type),
        fileName: this.formatFileName(
          requirements.namingConvention,
          doc.type,
          application.borrowerLastName,
          application.loanNumber,
          doc.fileName.split('.').pop() || 'pdf'
        ),
        fileSize: doc.size,
        mimeType: doc.mimeType,
        content: doc.content.toString('base64'),
        uploadDate: new Date().toISOString()
      })),
      metadata: {
        ...application.metadata,
        source: 'realign_platform',
        version: '3.0'
      }
    };

    return {
      servicerId: 'chase',
      format: 'api',
      data: chaseData,
      headers: {
        'Authorization': `Bearer ${(this.config as ChaseConfig).apiKey}`,
        'Content-Type': 'application/json',
        'X-Chase-Client-ID': 'realign-platform',
        'X-Chase-Request-ID': `REQ-${Date.now()}`
      }
    };
  }

  async submit(application: TransformedApplication): Promise<SubmissionResult> {
    const startTime = Date.now();
    const endpoint = (this.config as ChaseConfig).apiEndpoint;

    try {
      this.logger.info('Submitting to Chase API', {
        loanNumber: application.data.loanNumber,
        documentCount: application.data.documents.length
      });

      // Simulate API call - in production, use actual HTTP client
      const response = await this.makeApiCall(endpoint, application);

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        trackingNumber: response.trackingNumber,
        confirmationNumber: response.confirmationNumber,
        submittedAt: new Date(),
        estimatedResponseTime: 48 * 60 * 60 * 1000, // 48 hours
        nextSteps: [
          'You will receive an email confirmation within 24 hours',
          'A Chase representative will review your submission within 2 business days',
          'Additional documents may be requested via secure message'
        ],
        warnings: response.warnings || [],
        rawResponse: response
      };

    } catch (error) {
      this.logger.error('Chase submission failed', error);
      
      return {
        success: false,
        submittedAt: new Date(),
        errors: [
          error instanceof Error ? error.message : 'Submission failed',
          'Please try again or contact support'
        ]
      };
    }
  }

  async checkStatus(trackingNumber: string): Promise<{
    status: 'pending' | 'in_review' | 'accepted' | 'rejected' | 'additional_info_needed';
    message?: string;
    lastUpdated: Date;
  }> {
    try {
      // Simulate status check
      const response = await this.makeApiCall(
        `${(this.config as ChaseConfig).apiEndpoint}/status/${trackingNumber}`,
        { method: 'GET' }
      );

      return {
        status: response.status,
        message: response.message,
        lastUpdated: new Date(response.lastUpdated)
      };
    } catch (error) {
      this.logger.error('Status check failed', error);
      
      return {
        status: 'pending',
        message: 'Unable to retrieve status',
        lastUpdated: new Date()
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.makeApiCall(
        `${(this.config as ChaseConfig).apiEndpoint}/health`,
        { method: 'GET' }
      );

      return {
        success: response.status === 'healthy',
        message: response.message || 'Connection successful'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  private isOrderCorrect(actual: string[], expected: string[]): boolean {
    let expectedIndex = 0;
    
    for (const docType of actual) {
      const index = expected.indexOf(docType);
      if (index !== -1 && index >= expectedIndex) {
        expectedIndex = index;
      } else if (index !== -1) {
        return false;
      }
    }
    
    return true;
  }

  private mapToChaseDocType(docType: string): string {
    const mapping: Record<string, string> = {
      'hardship_letter': 'HARDSHIP_EXPLANATION',
      'financial_statement': 'FINANCIAL_WORKSHEET',
      'income_verification': 'INCOME_DOCS',
      'bank_statement': 'BANK_STATEMENTS',
      'tax_return': 'TAX_RETURNS',
      'paystub': 'PAY_STUBS',
      'cover_letter': 'COVER_SHEET'
    };
    
    return mapping[docType] || 'OTHER_DOCUMENT';
  }

  private async makeApiCall(endpoint: string, options: any): Promise<any> {
    // In production, use proper HTTP client (axios, fetch, etc.)
    // This is a mock implementation
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (Math.random() > 0.1) {
      return {
        success: true,
        trackingNumber: `CHASE-${Date.now()}`,
        confirmationNumber: `CONF-${Date.now()}`,
        status: 'healthy',
        warnings: []
      };
    } else {
      throw new Error('API call failed');
    }
  }
}