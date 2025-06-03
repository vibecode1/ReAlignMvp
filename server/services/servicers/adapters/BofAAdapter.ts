/**
 * @ai-context Bank of America adapter for portal-based submissions
 */

import { 
  ServicerAdapter, 
  PreparedApplication, 
  TransformedApplication, 
  SubmissionResult, 
  ValidationResult 
} from './ServicerAdapter';
import { Logger } from '../../logger';

interface BofAConfig {
  id: string;
  name: string;
  type: 'portal';
  portalUrl: string;
  credentials: {
    username: string;
    password: string;
  };
  specificRequirements: {
    maxFileSize: number;
    maxTotalSize: number;
    supportedFormats: string[];
    requiresCoverSheet: boolean;
    coverSheetTemplate: string;
    sessionTimeout: number;
    requiresHardshipReason: boolean;
  };
}

export class BofAAdapter extends ServicerAdapter {
  private logger: Logger;
  private sessionToken?: string;
  private sessionExpiry?: Date;

  constructor(config: BofAConfig) {
    super(config);
    this.logger = new Logger('BofAAdapter');
  }

  async validateRequirements(application: PreparedApplication): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    const requirements = this.config.requirements as BofAConfig['specificRequirements'];

    // Check total size
    const totalSize = application.documents.reduce((sum, doc) => sum + doc.size, 0);
    if (totalSize > requirements.maxTotalSize) {
      errors.push(`Total file size ${(totalSize / (1024 * 1024)).toFixed(2)}MB exceeds limit of ${requirements.maxTotalSize / (1024 * 1024)}MB`);
    }

    // Validate individual files
    for (const doc of application.documents) {
      if (!this.validateFileSize(doc.size, requirements.maxFileSize)) {
        errors.push(`${doc.fileName} exceeds max size of ${requirements.maxFileSize / (1024 * 1024)}MB`);
      }

      if (!this.validateFileFormat(doc.mimeType, requirements.supportedFormats)) {
        errors.push(`${doc.fileName} format not supported. Accepted: ${requirements.supportedFormats.join(', ')}`);
      }
    }

    // Check for cover sheet
    if (requirements.requiresCoverSheet) {
      const hasCoverSheet = application.documents.some(d => 
        d.type === 'cover_sheet' || d.type === 'cover_letter'
      );
      
      if (!hasCoverSheet) {
        errors.push('Bank of America requires a cover sheet for all submissions');
        suggestions.push('Generate a cover sheet using the BofA template');
      }
    }

    // Check hardship reason
    if (requirements.requiresHardshipReason) {
      const hasHardshipLetter = application.documents.some(d => 
        d.type === 'hardship_letter'
      );
      
      if (!hasHardshipLetter) {
        errors.push('Hardship letter is required');
      } else {
        suggestions.push('Ensure hardship letter clearly states the reason for financial difficulty');
      }
    }

    // Portal-specific warnings
    warnings.push(`Portal session timeout is ${requirements.sessionTimeout / 60000} minutes`);
    suggestions.push('Have all documents ready before starting the submission');

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  async transform(application: PreparedApplication): Promise<TransformedApplication> {
    const requirements = this.config.requirements as BofAConfig['specificRequirements'];

    // Generate cover sheet if needed
    let documents = [...application.documents];
    if (requirements.requiresCoverSheet && !documents.some(d => d.type === 'cover_sheet')) {
      const coverSheet = await this.generateCoverSheet(application);
      documents.unshift(coverSheet);
    }

    // Transform to BofA portal format
    const portalData = {
      accountNumber: application.loanNumber,
      borrowerInfo: {
        name: application.borrowerName,
        lastName: application.borrowerLastName
      },
      requestType: 'LOSS_MITIGATION',
      hardshipReason: application.metadata.hardshipReason || 'Financial Hardship',
      submissionDate: new Date().toISOString(),
      documents: documents.map((doc, index) => ({
        id: `BOFA-DOC-${index}`,
        type: this.mapToBofADocType(doc.type),
        name: this.sanitizeFileName(doc.fileName),
        size: doc.size,
        mimeType: doc.mimeType,
        data: doc.content,
        uploadOrder: index + 1
      })),
      sessionInfo: {
        startTime: new Date(),
        expectedDuration: Math.ceil(documents.length * 2), // 2 minutes per document
        requiresManualUpload: true
      }
    };

    return {
      servicerId: 'bofa',
      format: 'portal',
      data: portalData,
      attachments: documents
    };
  }

  async submit(application: TransformedApplication): Promise<SubmissionResult> {
    try {
      // Establish portal session
      await this.establishSession();

      this.logger.info('Submitting to BofA portal', {
        loanNumber: application.data.accountNumber,
        documentCount: application.data.documents.length
      });

      // Simulate portal submission steps
      const steps = [
        'Logging into portal',
        'Navigating to loss mitigation section',
        'Filling account information',
        'Uploading documents',
        'Reviewing submission',
        'Confirming submission'
      ];

      for (const step of steps) {
        this.logger.debug(`Portal automation: ${step}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate step delay
      }

      const confirmationNumber = `BOFA-${Date.now()}`;

      return {
        success: true,
        confirmationNumber,
        submittedAt: new Date(),
        estimatedResponseTime: 72 * 60 * 60 * 1000, // 72 hours
        nextSteps: [
          'Check your email for confirmation',
          'Log into BofA online banking to track status',
          'Expect initial review within 3 business days',
          'Prepare to provide additional documents if requested'
        ],
        warnings: [
          'Keep your confirmation number for reference',
          'Do not submit duplicate applications'
        ]
      };

    } catch (error) {
      this.logger.error('BofA portal submission failed', error);
      
      return {
        success: false,
        submittedAt: new Date(),
        errors: [
          error instanceof Error ? error.message : 'Portal submission failed',
          'The portal may be experiencing issues. Please try again later.'
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
      await this.establishSession();

      // Simulate status check through portal
      const statuses = ['pending', 'in_review', 'additional_info_needed'] as const;
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

      return {
        status: randomStatus,
        message: this.getStatusMessage(randomStatus),
        lastUpdated: new Date()
      };
    } catch (error) {
      return {
        status: 'pending',
        message: 'Unable to retrieve status. Please check the portal directly.',
        lastUpdated: new Date()
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const config = this.config as BofAConfig;
      
      // Test portal accessibility
      // In production, would actually test login
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!config.credentials.username || !config.credentials.password) {
        return {
          success: false,
          message: 'Portal credentials not configured'
        };
      }

      return {
        success: true,
        message: 'Portal connection successful'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  private async establishSession(): Promise<void> {
    if (this.sessionToken && this.sessionExpiry && this.sessionExpiry > new Date()) {
      return; // Session still valid
    }

    const config = this.config as BofAConfig;
    
    // Simulate portal login
    this.logger.debug('Establishing portal session');
    await new Promise(resolve => setTimeout(resolve, 2000));

    this.sessionToken = `SESSION-${Date.now()}`;
    this.sessionExpiry = new Date(Date.now() + config.specificRequirements.sessionTimeout);
  }

  private async generateCoverSheet(application: PreparedApplication): Promise<any> {
    const content = `
BANK OF AMERICA LOSS MITIGATION COVER SHEET

Date: ${new Date().toLocaleDateString()}
Loan Number: ${application.loanNumber}
Borrower Name: ${application.borrowerName}

SUBMISSION CONTENTS:
${application.documents.map((doc, i) => `${i + 1}. ${doc.type.replace(/_/g, ' ').toUpperCase()}`).join('\n')}

This package contains all required documentation for loss mitigation review.
Please contact us if additional information is needed.

Generated by ReAlign Platform
    `.trim();

    return {
      type: 'cover_sheet',
      fileName: 'BofA_Cover_Sheet.pdf',
      content: Buffer.from(content), // In production, generate actual PDF
      mimeType: 'application/pdf',
      size: content.length
    };
  }

  private mapToBofADocType(docType: string): string {
    const mapping: Record<string, string> = {
      'hardship_letter': 'HARDSHIP_AFFIDAVIT',
      'financial_statement': 'RMA_FINANCIAL_WORKSHEET',
      'income_verification': 'PROOF_OF_INCOME',
      'bank_statement': 'BANK_STATEMENTS',
      'tax_return': 'TAX_RETURNS',
      'paystub': 'PAYSTUBS',
      'cover_sheet': 'COVER_SHEET',
      'utility_bill': 'PROOF_OF_OCCUPANCY'
    };
    
    return mapping[docType] || 'OTHER';
  }

  private sanitizeFileName(fileName: string): string {
    // BofA portal has strict filename requirements
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/__+/g, '_')
      .substring(0, 50); // Max 50 chars
  }

  private getStatusMessage(status: string): string {
    const messages: Record<string, string> = {
      'pending': 'Your submission is awaiting review',
      'in_review': 'A specialist is reviewing your documents',
      'additional_info_needed': 'Additional documentation required. Check your messages.',
      'accepted': 'Your loss mitigation request has been approved',
      'rejected': 'Unable to approve at this time. See details in your account.'
    };
    
    return messages[status] || 'Status update pending';
  }
}