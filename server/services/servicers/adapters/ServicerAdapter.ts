/**
 * @ai-context Base interface for all servicer adapters
 * @ai-extendable Implement this interface to add new servicer support
 */

export interface ServicerConfig {
  id: string;
  name: string;
  type: 'api' | 'portal' | 'email' | 'fax';
  endpoint?: string;
  credentials?: Record<string, any>;
  requirements?: Record<string, any>;
}

export interface PreparedApplication {
  caseId: string;
  loanNumber: string;
  borrowerName: string;
  borrowerLastName: string;
  documents: {
    type: string;
    fileName: string;
    content: Buffer | string;
    mimeType: string;
    size: number;
  }[];
  metadata: Record<string, any>;
}

export interface TransformedApplication {
  servicerId: string;
  format: 'api' | 'email' | 'portal' | 'fax';
  data: any; // Servicer-specific format
  attachments?: any[];
  headers?: Record<string, string>;
}

export interface SubmissionResult {
  success: boolean;
  trackingNumber?: string;
  confirmationNumber?: string;
  submittedAt: Date;
  estimatedResponseTime?: number;
  nextSteps?: string[];
  warnings?: string[];
  errors?: string[];
  rawResponse?: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export abstract class ServicerAdapter {
  protected config: ServicerConfig;

  constructor(config: ServicerConfig) {
    this.config = config;
  }

  /**
   * @ai-purpose Validate application meets servicer requirements
   */
  abstract validateRequirements(application: PreparedApplication): Promise<ValidationResult>;

  /**
   * @ai-purpose Transform application to servicer-specific format
   */
  abstract transform(application: PreparedApplication): Promise<TransformedApplication>;

  /**
   * @ai-purpose Submit application to servicer
   */
  abstract submit(application: TransformedApplication): Promise<SubmissionResult>;

  /**
   * @ai-purpose Check submission status
   */
  abstract checkStatus(trackingNumber: string): Promise<{
    status: 'pending' | 'in_review' | 'accepted' | 'rejected' | 'additional_info_needed';
    message?: string;
    lastUpdated: Date;
  }>;

  /**
   * @ai-purpose Test connection to servicer
   */
  abstract testConnection(): Promise<{ success: boolean; message: string }>;

  /**
   * @ai-purpose Get adapter configuration
   */
  getConfig(): ServicerConfig {
    return this.config;
  }

  /**
   * @ai-purpose Get servicer-specific requirements
   */
  getRequirements(): Record<string, any> {
    return this.config.requirements || {};
  }

  /**
   * @ai-purpose Format date according to servicer preference
   */
  protected formatDate(date: Date, format?: string): string {
    const defaultFormat = format || 'MM/DD/YYYY';
    const pad = (n: number) => n.toString().padStart(2, '0');
    
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const year = date.getFullYear();
    
    return defaultFormat
      .replace('MM', month)
      .replace('DD', day)
      .replace('YYYY', year.toString())
      .replace('YY', year.toString().slice(-2));
  }

  /**
   * @ai-purpose Format file name according to servicer convention
   */
  protected formatFileName(
    template: string,
    docType: string,
    lastName: string,
    loanNumber: string,
    extension: string
  ): string {
    const date = this.formatDate(new Date(), 'MMDDYYYY');
    
    return template
      .replace('{DOCTYPE}', docType.toUpperCase().replace(/\s+/g, '_'))
      .replace('{LASTNAME}', lastName.toUpperCase())
      .replace('{LOAN_NUMBER}', loanNumber)
      .replace('{DATE}', date)
      .replace('{EXT}', extension.toLowerCase());
  }

  /**
   * @ai-purpose Validate file size against requirements
   */
  protected validateFileSize(size: number, maxSize?: number): boolean {
    if (!maxSize) return true;
    return size <= maxSize;
  }

  /**
   * @ai-purpose Validate file format against requirements
   */
  protected validateFileFormat(mimeType: string, supportedFormats?: string[]): boolean {
    if (!supportedFormats || supportedFormats.length === 0) return true;
    
    const formatMap: Record<string, string[]> = {
      'pdf': ['application/pdf'],
      'jpg': ['image/jpeg', 'image/jpg'],
      'jpeg': ['image/jpeg', 'image/jpg'],
      'png': ['image/png'],
      'tiff': ['image/tiff'],
      'doc': ['application/msword'],
      'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    };
    
    return supportedFormats.some(format => {
      const mimeTypes = formatMap[format.toLowerCase()];
      return mimeTypes && mimeTypes.includes(mimeType.toLowerCase());
    });
  }
}