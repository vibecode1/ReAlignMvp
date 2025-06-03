/**
 * @ai-context Wells Fargo adapter for email-based submissions
 */

import { 
  ServicerAdapter, 
  PreparedApplication, 
  TransformedApplication, 
  SubmissionResult, 
  ValidationResult 
} from './ServicerAdapter';
import { Logger } from '../../logger';

interface WellsFargoConfig {
  id: string;
  name: string;
  type: 'email';
  submissionMethod: 'email';
  emailAddress: string;
  specificRequirements: {
    subjectLineFormat: string;
    attachmentNaming: string;
    maxAttachmentSize: number;
    requiresPDFOnly: boolean;
    bodyTemplate: string;
    ccAddresses: string[];
    readReceiptRequired: boolean;
  };
}

export class WellsFargoAdapter extends ServicerAdapter {
  private logger: Logger;

  constructor(config: WellsFargoConfig) {
    super(config);
    this.logger = new Logger('WellsFargoAdapter');
  }

  async validateRequirements(application: PreparedApplication): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    const requirements = this.config.requirements as WellsFargoConfig['specificRequirements'];

    // Check total attachment size
    const totalSize = application.documents.reduce((sum, doc) => sum + doc.size, 0);
    if (totalSize > requirements.maxAttachmentSize) {
      errors.push(
        `Total attachment size ${(totalSize / (1024 * 1024)).toFixed(2)}MB exceeds ` +
        `Wells Fargo limit of ${requirements.maxAttachmentSize / (1024 * 1024)}MB`
      );
      suggestions.push('Consider compressing PDFs or splitting into multiple emails');
    }

    // Validate PDF requirement
    if (requirements.requiresPDFOnly) {
      const nonPdfDocs = application.documents.filter(doc => 
        doc.mimeType !== 'application/pdf'
      );
      
      if (nonPdfDocs.length > 0) {
        errors.push('Wells Fargo requires all documents to be in PDF format');
        nonPdfDocs.forEach(doc => {
          suggestions.push(`Convert ${doc.fileName} to PDF format`);
        });
      }
    }

    // Check required documents
    const requiredTypes = ['hardship_letter', 'financial_statement', 'income_verification'];
    const docTypes = application.documents.map(d => d.type);
    const missingDocs = requiredTypes.filter(req => !docTypes.includes(req));
    
    if (missingDocs.length > 0) {
      errors.push(`Missing required documents: ${missingDocs.join(', ')}`);
    }

    // Validate naming convention
    application.documents.forEach(doc => {
      const expectedName = this.formatFileName(
        requirements.attachmentNaming,
        doc.type,
        application.borrowerLastName,
        application.loanNumber,
        'pdf'
      );
      
      if (doc.fileName !== expectedName) {
        warnings.push(`Consider renaming ${doc.fileName} to ${expectedName}`);
      }
    });

    // Email-specific suggestions
    suggestions.push('Email will be sent with read receipt requested');
    suggestions.push('Keep email size under 20MB for reliable delivery');
    
    if (application.documents.length > 10) {
      warnings.push('Large number of attachments may trigger spam filters');
      suggestions.push('Consider combining related documents into single PDFs');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  async transform(application: PreparedApplication): Promise<TransformedApplication> {
    const requirements = this.config.requirements as WellsFargoConfig['specificRequirements'];

    // Format subject line
    const subject = requirements.subjectLineFormat
      .replace('{LOAN_NUMBER}', application.loanNumber)
      .replace('{BORROWER_LAST_NAME}', application.borrowerLastName.toUpperCase());

    // Generate email body
    const emailBody = this.generateEmailBody(application, requirements.bodyTemplate);

    // Prepare attachments with proper naming
    const attachments = application.documents.map(doc => ({
      filename: this.formatFileName(
        requirements.attachmentNaming,
        doc.type,
        application.borrowerLastName,
        application.loanNumber,
        'pdf'
      ),
      content: doc.content,
      contentType: doc.mimeType,
      size: doc.size
    }));

    // Email data structure
    const emailData = {
      to: (this.config as WellsFargoConfig).emailAddress,
      cc: requirements.ccAddresses,
      subject,
      body: emailBody,
      attachments,
      headers: {
        'Return-Receipt-To': application.metadata.contactEmail || 'noreply@realign.com',
        'Disposition-Notification-To': application.metadata.contactEmail || 'noreply@realign.com',
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      },
      metadata: {
        loanNumber: application.loanNumber,
        submissionType: 'loss_mitigation',
        totalAttachments: attachments.length,
        totalSize: attachments.reduce((sum, a) => sum + a.size, 0)
      }
    };

    return {
      servicerId: 'wells_fargo',
      format: 'email',
      data: emailData,
      attachments
    };
  }

  async submit(application: TransformedApplication): Promise<SubmissionResult> {
    try {
      this.logger.info('Submitting to Wells Fargo via email', {
        loanNumber: application.data.metadata.loanNumber,
        attachmentCount: application.data.attachments.length,
        totalSize: application.data.metadata.totalSize
      });

      // Simulate email sending
      // In production, use actual email service (SendGrid, AWS SES, etc.)
      await this.sendEmail(application.data);

      const messageId = `WF-EMAIL-${Date.now()}`;

      return {
        success: true,
        trackingNumber: messageId,
        confirmationNumber: messageId,
        submittedAt: new Date(),
        estimatedResponseTime: 96 * 60 * 60 * 1000, // 96 hours (4 business days)
        nextSteps: [
          'Email sent successfully with read receipt requested',
          'Wells Fargo typically acknowledges receipt within 24-48 hours',
          'Initial review completed within 4-5 business days',
          'You may receive follow-up requests via email or phone',
          'Check spam folder for any Wells Fargo communications'
        ],
        warnings: [
          'Save the email confirmation for your records',
          'Do not send duplicate submissions'
        ]
      };

    } catch (error) {
      this.logger.error('Wells Fargo email submission failed', error);
      
      return {
        success: false,
        submittedAt: new Date(),
        errors: [
          error instanceof Error ? error.message : 'Email submission failed',
          'Check email configuration and try again',
          'Consider calling Wells Fargo directly if issues persist'
        ]
      };
    }
  }

  async checkStatus(trackingNumber: string): Promise<{
    status: 'pending' | 'in_review' | 'accepted' | 'rejected' | 'additional_info_needed';
    message?: string;
    lastUpdated: Date;
  }> {
    // Email submissions don't have real-time status checking
    // Would need to integrate with email tracking or parse response emails
    
    return {
      status: 'pending',
      message: 'Email submissions require manual status checks. Please call Wells Fargo or check your email for updates.',
      lastUpdated: new Date()
    };
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const config = this.config as WellsFargoConfig;
      
      // Validate email configuration
      if (!config.emailAddress || !config.emailAddress.includes('@wellsfargo.com')) {
        return {
          success: false,
          message: 'Invalid Wells Fargo email address'
        };
      }

      // In production, would test SMTP connection
      return {
        success: true,
        message: 'Email configuration valid'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  private generateEmailBody(application: PreparedApplication, template: string): string {
    const currentDate = new Date().toLocaleDateString();
    
    const body = `
Dear Wells Fargo Loss Mitigation Department,

I am submitting the attached documentation for loss mitigation review on the following account:

Loan Number: ${application.loanNumber}
Borrower Name: ${application.borrowerName}
Date: ${currentDate}

ATTACHED DOCUMENTS:
${application.documents.map((doc, i) => 
  `${i + 1}. ${doc.type.replace(/_/g, ' ').toUpperCase()} (${doc.fileName})`
).join('\n')}

Total Attachments: ${application.documents.length}

I am experiencing financial hardship and am requesting assistance with my mortgage. All required documentation is attached for your review.

Please confirm receipt of this submission and advise if any additional information is needed.

Contact Information:
${application.metadata.contactEmail ? `Email: ${application.metadata.contactEmail}` : ''}
${application.metadata.contactPhone ? `Phone: ${application.metadata.contactPhone}` : ''}

Thank you for your consideration.

Sincerely,
${application.borrowerName}

---
This submission was prepared and sent via ReAlign Platform
Submission ID: ${application.caseId}
    `.trim();

    return body;
  }

  private async sendEmail(emailData: any): Promise<void> {
    // Simulate email sending
    this.logger.debug('Sending email', {
      to: emailData.to,
      subject: emailData.subject,
      attachments: emailData.attachments.length
    });

    // In production, integrate with email service
    // Example: SendGrid, AWS SES, Nodemailer, etc.
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate occasional failures
    if (Math.random() < 0.05) {
      throw new Error('Email service temporarily unavailable');
    }
  }
}