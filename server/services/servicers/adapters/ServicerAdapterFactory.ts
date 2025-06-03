/**
 * @ai-context Creates servicer-specific adapters for submission
 * @ai-extendable Add new servicers by implementing ServicerAdapter interface
 */

import { ServicerAdapter } from './ServicerAdapter';
import { ChaseAdapter } from './ChaseAdapter';
import { BofAAdapter } from './BofAAdapter';
import { WellsFargoAdapter } from './WellsFargoAdapter';
import { GenericAdapter } from './GenericAdapter';
import { ServicerIntelligenceEngine } from '../ServicerIntelligenceEngine';
import { Logger } from '../../logger';

export interface ServicerConfig {
  id: string;
  name: string;
  type: 'api' | 'portal' | 'email' | 'fax';
  endpoint?: string;
  credentials?: {
    username?: string;
    password?: string;
    apiKey?: string;
  };
  requirements?: Record<string, any>;
}

export class ServicerAdapterFactory {
  private adapters: Map<string, ServicerAdapter>;
  private intelligenceEngine: ServicerIntelligenceEngine;
  private logger: Logger;
  
  constructor() {
    this.adapters = new Map();
    this.intelligenceEngine = new ServicerIntelligenceEngine();
    this.logger = new Logger('ServicerAdapterFactory');
    this.registerAdapters();
  }
  
  /**
   * @ai-instruction To add new servicer:
   * 1. Create new adapter class implementing ServicerAdapter
   * 2. Register in this method
   * 3. Add servicer-specific logic
   */
  private registerAdapters() {
    // Chase adapter - API-based submission
    this.adapters.set('chase', new ChaseAdapter({
      id: 'chase',
      name: 'Chase',
      type: 'api',
      apiEndpoint: process.env.CHASE_API_ENDPOINT || 'https://api.chase.com/loss-mitigation',
      apiKey: process.env.CHASE_API_KEY || '',
      specificRequirements: {
        documentOrder: ['cover_letter', 'hardship_letter', 'financial_docs'],
        dateFormat: 'MM/DD/YYYY',
        requiresWetSignature: false,
        maxFileSize: 25 * 1024 * 1024, // 25MB
        supportedFormats: ['pdf', 'jpg', 'png', 'tiff'],
        namingConvention: '{DOCTYPE}_{LASTNAME}_{DATE}.{EXT}'
      }
    }));
    
    // Bank of America adapter - Portal-based submission
    this.adapters.set('bofa', new BofAAdapter({
      id: 'bofa',
      name: 'Bank of America',
      type: 'portal',
      portalUrl: process.env.BOFA_PORTAL_URL || 'https://secure.bankofamerica.com/loss-mitigation',
      credentials: {
        username: process.env.BOFA_USERNAME || '',
        password: process.env.BOFA_PASSWORD || ''
      },
      specificRequirements: {
        maxFileSize: 10 * 1024 * 1024, // 10MB per file
        maxTotalSize: 50 * 1024 * 1024, // 50MB total
        supportedFormats: ['pdf', 'jpg', 'png'],
        requiresCoverSheet: true,
        coverSheetTemplate: 'bofa_standard',
        sessionTimeout: 15 * 60 * 1000, // 15 minutes
        requiresHardshipReason: true
      }
    }));
    
    // Wells Fargo adapter - Email-based submission
    this.adapters.set('wells_fargo', new WellsFargoAdapter({
      id: 'wells_fargo',
      name: 'Wells Fargo',
      type: 'email',
      submissionMethod: 'email',
      emailAddress: process.env.WF_EMAIL || 'loss_mitigation@wellsfargo.com',
      specificRequirements: {
        subjectLineFormat: 'Loss Mit - {LOAN_NUMBER} - {BORROWER_LAST_NAME}',
        attachmentNaming: '{DOCTYPE}_{LOAN_NUMBER}_{DATE}.pdf',
        maxAttachmentSize: 20 * 1024 * 1024, // 20MB total
        requiresPDFOnly: true,
        bodyTemplate: 'wells_fargo_standard',
        ccAddresses: ['confirmation@wellsfargo.com'],
        readReceiptRequired: true
      }
    }));

    this.logger.info('Registered servicer adapters', {
      adapters: Array.from(this.adapters.keys())
    });
  }
  
  /**
   * @ai-purpose Get adapter for servicer with fallback
   */
  async getAdapter(servicerId: string): Promise<ServicerAdapter> {
    // Check if we have a specific adapter
    const adapter = this.adapters.get(servicerId.toLowerCase());
    
    if (adapter) {
      this.logger.debug(`Using specific adapter for ${servicerId}`);
      return adapter;
    }
    
    // Use generic adapter with learned intelligence
    this.logger.info(`No specific adapter for ${servicerId}, using generic adapter with intelligence`);
    
    try {
      // Get learned intelligence for this servicer
      const recommendations = await this.intelligenceEngine.getRecommendations(servicerId);
      const successRate = await this.intelligenceEngine.getSuccessRate(servicerId);
      
      const config: ServicerConfig = {
        id: servicerId,
        name: servicerId,
        type: 'portal', // Default to portal
        requirements: {
          recommendations,
          successRate,
          learned: true
        }
      };
      
      return new GenericAdapter(config, this.intelligenceEngine);
    } catch (error) {
      this.logger.error(`Failed to load intelligence for ${servicerId}`, error);
      
      // Return basic generic adapter
      return new GenericAdapter({
        id: servicerId,
        name: servicerId,
        type: 'portal',
        requirements: {}
      });
    }
  }

  /**
   * @ai-purpose Get all registered servicers
   */
  getRegisteredServicers(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * @ai-purpose Register a new adapter at runtime
   */
  registerAdapter(servicerId: string, adapter: ServicerAdapter): void {
    this.adapters.set(servicerId.toLowerCase(), adapter);
    this.logger.info(`Registered new adapter for ${servicerId}`);
  }

  /**
   * @ai-purpose Get servicer configuration
   */
  async getServicerConfig(servicerId: string): Promise<ServicerConfig | null> {
    const adapter = await this.getAdapter(servicerId);
    if (!adapter) return null;

    return adapter.getConfig();
  }

  /**
   * @ai-purpose Test adapter connectivity
   */
  async testAdapter(servicerId: string): Promise<{ success: boolean; message: string }> {
    try {
      const adapter = await this.getAdapter(servicerId);
      return await adapter.testConnection();
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Test failed'
      };
    }
  }
}