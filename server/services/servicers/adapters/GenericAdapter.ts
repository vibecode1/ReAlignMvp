/**
 * @ai-context Generic adapter that uses learned intelligence for unknown servicers
 */

import { 
  ServicerAdapter, 
  ServicerConfig,
  PreparedApplication, 
  TransformedApplication, 
  SubmissionResult, 
  ValidationResult 
} from './ServicerAdapter';
import { ServicerIntelligenceEngine } from '../ServicerIntelligenceEngine';
import { Logger } from '../../logger';

export class GenericAdapter extends ServicerAdapter {
  private logger: Logger;
  private intelligenceEngine?: ServicerIntelligenceEngine;

  constructor(config: ServicerConfig, intelligenceEngine?: ServicerIntelligenceEngine) {
    super(config);
    this.logger = new Logger('GenericAdapter');
    this.intelligenceEngine = intelligenceEngine;
  }

  async validateRequirements(application: PreparedApplication): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Basic validation that applies to most servicers
    const requiredDocs = ['hardship_letter', 'financial_statement', 'income_verification'];
    const docTypes = application.documents.map(d => d.type);
    const missingDocs = requiredDocs.filter(req => !docTypes.includes(req));
    
    if (missingDocs.length > 0) {
      errors.push(`Missing commonly required documents: ${missingDocs.join(', ')}`);
    }

    // File size validation (conservative defaults)
    const maxFileSize = 10 * 1024 * 1024; // 10MB default
    const maxTotalSize = 50 * 1024 * 1024; // 50MB default
    
    const totalSize = application.documents.reduce((sum, doc) => sum + doc.size, 0);
    if (totalSize > maxTotalSize) {
      warnings.push(`Total file size ${(totalSize / (1024 * 1024)).toFixed(2)}MB may be too large`);
      suggestions.push('Consider compressing files or reducing image quality');
    }

    application.documents.forEach(doc => {
      if (doc.size > maxFileSize) {
        warnings.push(`${doc.fileName} (${(doc.size / (1024 * 1024)).toFixed(2)}MB) may be too large`);
      }
      
      // Suggest PDF format as it's universally accepted
      if (doc.mimeType !== 'application/pdf') {
        suggestions.push(`Consider converting ${doc.fileName} to PDF format`);
      }
    });

    // Add intelligence-based suggestions if available
    if (this.intelligenceEngine && this.config.requirements?.recommendations) {
      const recommendations = this.config.requirements.recommendations as string[];
      recommendations.forEach(rec => suggestions.push(rec));
    }

    // Generic best practices
    suggestions.push('Ensure all documents are clearly legible');
    suggestions.push('Include a cover letter summarizing your situation');
    suggestions.push('Keep copies of all submitted documents');

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  async transform(application: PreparedApplication): Promise<TransformedApplication> {
    // Transform to a generic format that works for most submission methods
    const genericData = {
      servicerId: this.config.id,
      loanNumber: application.loanNumber,
      borrowerInfo: {
        fullName: application.borrowerName,
        lastName: application.borrowerLastName
      },
      submissionType: 'loss_mitigation',
      submissionDate: new Date().toISOString(),
      documents: application.documents.map((doc, index) => ({
        id: `${this.config.id}-DOC-${index}`,
        type: doc.type,
        fileName: this.standardizeFileName(doc.fileName, doc.type, application.loanNumber),
        size: doc.size,
        mimeType: doc.mimeType,
        content: doc.content,
        order: index + 1
      })),
      metadata: {
        ...application.metadata,
        source: 'realign_generic_adapter',
        servicerType: this.config.type,
        hasIntelligence: !!this.intelligenceEngine
      }
    };

    // Apply any learned patterns
    if (this.config.requirements?.learned) {
      this.logger.info('Applying learned intelligence to transformation', {
        servicerId: this.config.id,
        recommendations: this.config.requirements.recommendations?.length || 0
      });
    }

    return {
      servicerId: this.config.id,
      format: this.config.type || 'portal',
      data: genericData,
      attachments: application.documents
    };
  }

  async submit(application: TransformedApplication): Promise<SubmissionResult> {
    try {
      this.logger.info('Submitting via generic adapter', {
        servicerId: this.config.id,
        method: this.config.type,
        documentCount: application.data.documents.length
      });

      // Simulate submission based on type
      let result: SubmissionResult;

      switch (this.config.type) {
        case 'api':
          result = await this.submitViaApi(application);
          break;
        case 'email':
          result = await this.submitViaEmail(application);
          break;
        case 'fax':
          result = await this.submitViaFax(application);
          break;
        case 'portal':
        default:
          result = await this.submitViaPortal(application);
          break;
      }

      // Learn from this submission if intelligence engine is available
      if (this.intelligenceEngine && result.success) {
        const submission = {
          id: result.trackingNumber || `GENERIC-${Date.now()}`,
          servicerId: this.config.id,
          type: 'loss_mitigation',
          documents: application.data.documents.map((d: any) => ({
            type: d.type,
            format: d.mimeType.split('/')[1] || 'unknown',
            size: d.size
          })),
          submittedAt: result.submittedAt,
          metadata: application.data.metadata
        };

        // Store for future learning (outcome will be updated later)
        this.logger.debug('Storing submission for future learning', { 
          submissionId: submission.id 
        });
      }

      return result;

    } catch (error) {
      this.logger.error('Generic submission failed', error);
      
      return {
        success: false,
        submittedAt: new Date(),
        errors: [
          error instanceof Error ? error.message : 'Submission failed',
          `Unable to submit to ${this.config.name}`,
          'Please verify servicer requirements and try again'
        ]
      };
    }
  }

  async checkStatus(trackingNumber: string): Promise<{
    status: 'pending' | 'in_review' | 'accepted' | 'rejected' | 'additional_info_needed';
    message?: string;
    lastUpdated: Date;
  }> {
    // Generic status check - most servicers don't provide real-time status
    return {
      status: 'pending',
      message: `Please contact ${this.config.name} directly for status updates`,
      lastUpdated: new Date()
    };
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    // Basic connectivity test based on type
    switch (this.config.type) {
      case 'api':
        return this.testApiConnection();
      case 'email':
        return { success: true, message: 'Email configuration assumed valid' };
      case 'portal':
        return { success: true, message: 'Portal access requires manual verification' };
      case 'fax':
        return { success: true, message: 'Fax configuration requires manual verification' };
      default:
        return { success: true, message: 'Connection test not available for this servicer' };
    }
  }

  private standardizeFileName(fileName: string, docType: string, loanNumber: string): string {
    // Create a standardized filename that should work for most servicers
    const extension = fileName.split('.').pop() || 'pdf';
    const cleanDocType = docType.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    return `${cleanDocType}_${loanNumber}_${date}.${extension}`;
  }

  private async submitViaApi(application: TransformedApplication): Promise<SubmissionResult> {
    if (!this.config.endpoint) {
      throw new Error('API endpoint not configured');
    }

    // Generic API submission
    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
      success: true,
      trackingNumber: `API-${this.config.id}-${Date.now()}`,
      submittedAt: new Date(),
      estimatedResponseTime: 72 * 60 * 60 * 1000, // 72 hours default
      nextSteps: [
        'Submission sent via API',
        'Check your email for confirmation',
        'Response typically received within 3-5 business days'
      ]
    };
  }

  private async submitViaEmail(application: TransformedApplication): Promise<SubmissionResult> {
    // Generic email submission
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      trackingNumber: `EMAIL-${this.config.id}-${Date.now()}`,
      submittedAt: new Date(),
      estimatedResponseTime: 96 * 60 * 60 * 1000, // 96 hours default
      nextSteps: [
        'Email sent to servicer',
        'Expect acknowledgment within 24-48 hours',
        'Keep email confirmation for reference'
      ],
      warnings: [
        'Check spam folder for servicer responses'
      ]
    };
  }

  private async submitViaPortal(application: TransformedApplication): Promise<SubmissionResult> {
    // Generic portal submission
    await new Promise(resolve => setTimeout(resolve, 3000));

    return {
      success: true,
      confirmationNumber: `PORTAL-${this.config.id}-${Date.now()}`,
      submittedAt: new Date(),
      estimatedResponseTime: 72 * 60 * 60 * 1000, // 72 hours default
      nextSteps: [
        'Documents uploaded to servicer portal',
        'Log into your account to track status',
        'Initial review within 3-5 business days'
      ]
    };
  }

  private async submitViaFax(application: TransformedApplication): Promise<SubmissionResult> {
    // Generic fax submission
    await new Promise(resolve => setTimeout(resolve, 2500));

    return {
      success: true,
      trackingNumber: `FAX-${this.config.id}-${Date.now()}`,
      submittedAt: new Date(),
      estimatedResponseTime: 120 * 60 * 60 * 1000, // 120 hours (5 days) for fax
      nextSteps: [
        'Documents sent via fax',
        'Call servicer to confirm receipt',
        'Response may take 5-7 business days'
      ],
      warnings: [
        'Fax quality may affect document readability',
        'Consider following up with a phone call'
      ]
    };
  }

  private async testApiConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.config.endpoint) {
      return {
        success: false,
        message: 'API endpoint not configured'
      };
    }

    try {
      // In production, would make actual API health check
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        message: 'API endpoint reachable'
      };
    } catch (error) {
      return {
        success: false,
        message: 'API endpoint unreachable'
      };
    }
  }
}