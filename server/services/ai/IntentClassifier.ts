/**
 * @ai-context Intent classification service for understanding user intent
 * @ai-purpose Classify user messages to determine appropriate response type
 * @ai-modifiable true
 */

import type { EmotionalState } from './EmotionalAnalyzer';

export interface IntentClassificationInput {
  message: string;
  attachments?: Array<{
    id: string;
    type: string;
    url: string;
  }>;
  conversationHistory: Array<{
    content: string;
    timestamp: Date;
    sender: 'user' | 'ai';
  }>;
  emotionalContext: EmotionalState;
  caseId: string;
}

export interface Intent {
  type: 'question' | 'document_upload' | 'status_update' | 'help_request' | 'escalation';
  subtype?: string;
  confidence: number;
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
    position?: number;
  }>;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  context?: {
    previousIntents?: string[];
    relatedTopics?: string[];
    timeContext?: string;
  };
}

/**
 * @ai-purpose Classify user intent from messages and context
 * @debug-trace Log classification decisions and confidence scores
 */
export class IntentClassifier {
  private intentPatterns: Map<string, Array<{
    pattern: RegExp;
    weight: number;
    subtype?: string;
  }>>;

  private entityExtractors: Map<string, RegExp>;

  constructor() {
    this.initializeIntentPatterns();
    this.initializeEntityExtractors();
  }

  /**
   * @ai-purpose Classify user intent from input
   */
  async classify(input: IntentClassificationInput): Promise<Intent> {
    console.log('[IntentClassifier] Starting intent classification', {
      messageLength: input.message.length,
      hasAttachments: input.attachments && input.attachments.length > 0,
      historyLength: input.conversationHistory.length,
      emotionalDistress: input.emotionalContext.distressLevel
    });

    try {
      // Step 1: Check for explicit attachment-based intents
      if (input.attachments && input.attachments.length > 0) {
        const attachmentIntent = this.classifyAttachmentIntent(input);
        if (attachmentIntent.confidence > 0.8) {
          console.log('[IntentClassifier] High-confidence attachment intent detected', {
            type: attachmentIntent.type,
            confidence: attachmentIntent.confidence
          });
          return attachmentIntent;
        }
      }

      // Step 2: Analyze message content for patterns
      const patternAnalysis = await this.analyzeMessagePatterns(input.message);

      // Step 3: Extract entities
      const entities = this.extractEntities(input.message);

      // Step 4: Analyze conversational context
      const contextAnalysis = this.analyzeConversationContext(input.conversationHistory);

      // Step 5: Factor in emotional context
      const emotionalFactors = this.analyzeEmotionalFactors(input.emotionalContext);

      // Step 6: Combine all analyses
      const finalIntent = this.combineAnalyses({
        patternAnalysis,
        entities,
        contextAnalysis,
        emotionalFactors,
        hasAttachments: input.attachments && input.attachments.length > 0
      });

      console.log('[IntentClassifier] Intent classification completed', {
        type: finalIntent.type,
        subtype: finalIntent.subtype,
        confidence: finalIntent.confidence,
        urgency: finalIntent.urgency,
        entityCount: finalIntent.entities.length
      });

      return finalIntent;

    } catch (error) {
      console.error('[IntentClassifier] Classification failed:', error);
      
      // Return safe fallback intent
      return {
        type: 'help_request',
        confidence: 0.3,
        entities: [],
        urgency: 'medium',
        context: {
          previousIntents: [],
          relatedTopics: [],
          timeContext: 'error_fallback'
        }
      };
    }
  }

  /**
   * @ai-purpose Classify intent based on attachments
   */
  private classifyAttachmentIntent(input: IntentClassificationInput): Intent {
    const documentTypes = input.attachments?.map(att => att.type) || [];
    const entities: Array<{
      type: string;
      value: string;
      confidence: number;
    }> = [];

    // Add document types as entities
    documentTypes.forEach(type => {
      entities.push({
        type: 'document_type',
        value: type,
        confidence: 0.9
      });
    });

    // Check message for context about the documents
    const message = input.message.toLowerCase();
    let subtype = 'general';
    let urgency: 'low' | 'medium' | 'high' | 'critical' = 'medium';

    if (message.includes('paystub') || message.includes('pay stub')) {
      subtype = 'income_verification';
    } else if (message.includes('bank statement') || message.includes('statement')) {
      subtype = 'financial_documentation';
    } else if (message.includes('tax') || message.includes('1040')) {
      subtype = 'tax_documentation';
    } else if (message.includes('hardship') || message.includes('letter')) {
      subtype = 'hardship_documentation';
    }

    // Determine urgency from emotional context and message content
    if (input.emotionalContext.distressLevel > 0.7) {
      urgency = 'high';
    } else if (message.includes('urgent') || message.includes('asap')) {
      urgency = 'high';
    } else if (message.includes('deadline') || message.includes('due')) {
      urgency = 'high';
    }

    return {
      type: 'document_upload',
      subtype,
      confidence: 0.95,
      entities,
      urgency,
      context: {
        relatedTopics: [subtype],
        timeContext: 'immediate'
      }
    };
  }

  /**
   * @ai-purpose Analyze message content for intent patterns
   */
  private async analyzeMessagePatterns(message: string): Promise<{
    scores: Record<string, number>;
    matchedPatterns: Array<{
      type: string;
      pattern: string;
      weight: number;
      subtype?: string;
    }>;
  }> {
    const scores: Record<string, number> = {
      question: 0,
      document_upload: 0,
      status_update: 0,
      help_request: 0,
      escalation: 0
    };

    const matchedPatterns: Array<{
      type: string;
      pattern: string;
      weight: number;
      subtype?: string;
    }> = [];

    const lowerMessage = message.toLowerCase();

    // Check each intent type against patterns
    for (const [intentType, patterns] of this.intentPatterns.entries()) {
      for (const patternObj of patterns) {
        if (patternObj.pattern.test(lowerMessage)) {
          scores[intentType] += patternObj.weight;
          matchedPatterns.push({
            type: intentType,
            pattern: patternObj.pattern.source,
            weight: patternObj.weight,
            subtype: patternObj.subtype
          });
        }
      }
    }

    return { scores, matchedPatterns };
  }

  /**
   * @ai-purpose Extract entities from message
   */
  private extractEntities(message: string): Array<{
    type: string;
    value: string;
    confidence: number;
    position?: number;
  }> {
    const entities: Array<{
      type: string;
      value: string;
      confidence: number;
      position?: number;
    }> = [];

    // Extract using predefined patterns
    for (const [entityType, pattern] of this.entityExtractors.entries()) {
      const matches = message.matchAll(new RegExp(pattern, 'gi'));
      
      for (const match of matches) {
        if (match[0] && match.index !== undefined) {
          entities.push({
            type: entityType,
            value: match[0],
            confidence: 0.8,
            position: match.index
          });
        }
      }
    }

    // Extract financial amounts
    const amountPattern = /\$[\d,]+(?:\.\d{2})?|\d+\s*dollars?/gi;
    const amountMatches = message.matchAll(amountPattern);
    
    for (const match of amountMatches) {
      if (match[0] && match.index !== undefined) {
        entities.push({
          type: 'financial_amount',
          value: match[0],
          confidence: 0.9,
          position: match.index
        });
      }
    }

    // Extract dates
    const datePattern = /\b(?:\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4})\b/gi;
    const dateMatches = message.matchAll(datePattern);
    
    for (const match of dateMatches) {
      if (match[0] && match.index !== undefined) {
        entities.push({
          type: 'date',
          value: match[0],
          confidence: 0.8,
          position: match.index
        });
      }
    }

    return entities;
  }

  /**
   * @ai-purpose Analyze conversation context for intent clues
   */
  private analyzeConversationContext(conversationHistory: Array<{
    content: string;
    timestamp: Date;
    sender: 'user' | 'ai';
  }>): {
    previousIntents: string[];
    contextBoost: Record<string, number>;
    relatedTopics: string[];
  } {
    const previousIntents: string[] = [];
    const contextBoost: Record<string, number> = {};
    const relatedTopics: string[] = [];

    // Analyze recent AI messages for context
    const recentAIMessages = conversationHistory
      .filter(msg => msg.sender === 'ai')
      .slice(-3);

    recentAIMessages.forEach(message => {
      const content = message.content.toLowerCase();
      
      // If AI asked a question, user might be responding
      if (content.includes('?')) {
        contextBoost.question = (contextBoost.question || 0) + 0.2;
      }
      
      // If AI mentioned documents, user might upload
      if (content.includes('document') || content.includes('upload')) {
        contextBoost.document_upload = (contextBoost.document_upload || 0) + 0.3;
      }
      
      // If AI mentioned status, user might provide update
      if (content.includes('status') || content.includes('update')) {
        contextBoost.status_update = (contextBoost.status_update || 0) + 0.2;
      }

      // Extract topics
      if (content.includes('paystub')) relatedTopics.push('income');
      if (content.includes('mortgage')) relatedTopics.push('loan');
      if (content.includes('hardship')) relatedTopics.push('financial_difficulty');
    });

    return {
      previousIntents,
      contextBoost,
      relatedTopics: [...new Set(relatedTopics)]
    };
  }

  /**
   * @ai-purpose Factor in emotional context for intent analysis
   */
  private analyzeEmotionalFactors(emotionalState: EmotionalState): {
    urgencyBoost: number;
    intentModifiers: Record<string, number>;
  } {
    const intentModifiers: Record<string, number> = {};
    let urgencyBoost = 0;

    // High distress indicates help request or escalation
    if (emotionalState.distressLevel > 0.7) {
      intentModifiers.help_request = 0.3;
      intentModifiers.escalation = 0.4;
      urgencyBoost += 0.5;
    }

    // High frustration might indicate escalation
    if (emotionalState.frustrationLevel > 0.8) {
      intentModifiers.escalation = 0.5;
      urgencyBoost += 0.3;
    }

    // Low hope with high distress is critical
    if (emotionalState.hopeLevel < 0.3 && emotionalState.distressLevel > 0.6) {
      intentModifiers.help_request = 0.4;
      urgencyBoost += 0.6;
    }

    return {
      urgencyBoost,
      intentModifiers
    };
  }

  /**
   * @ai-purpose Combine all analyses into final intent
   */
  private combineAnalyses(analyses: {
    patternAnalysis: {
      scores: Record<string, number>;
      matchedPatterns: Array<any>;
    };
    entities: Array<any>;
    contextAnalysis: {
      previousIntents: string[];
      contextBoost: Record<string, number>;
      relatedTopics: string[];
    };
    emotionalFactors: {
      urgencyBoost: number;
      intentModifiers: Record<string, number>;
    };
    hasAttachments: boolean;
  }): Intent {
    const finalScores: Record<string, number> = { ...analyses.patternAnalysis.scores };

    // Apply context boost
    Object.entries(analyses.contextAnalysis.contextBoost).forEach(([intent, boost]) => {
      finalScores[intent] = (finalScores[intent] || 0) + boost;
    });

    // Apply emotional modifiers
    Object.entries(analyses.emotionalFactors.intentModifiers).forEach(([intent, modifier]) => {
      finalScores[intent] = (finalScores[intent] || 0) + modifier;
    });

    // Boost document_upload if attachments present
    if (analyses.hasAttachments) {
      finalScores.document_upload = (finalScores.document_upload || 0) + 0.5;
    }

    // Find highest scoring intent
    const topIntent = Object.entries(finalScores).reduce((max, [intent, score]) => 
      score > max.score ? { intent, score } : max,
      { intent: 'help_request', score: 0 }
    );

    // Determine subtype from matched patterns
    const relevantPatterns = analyses.patternAnalysis.matchedPatterns
      .filter(p => p.type === topIntent.intent);
    const subtype = relevantPatterns.find(p => p.subtype)?.subtype;

    // Calculate confidence
    const confidence = Math.min(topIntent.score, 1);

    // Determine urgency
    let urgency: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    const urgencyScore = analyses.emotionalFactors.urgencyBoost;
    
    if (urgencyScore > 0.8) {
      urgency = 'critical';
    } else if (urgencyScore > 0.5) {
      urgency = 'high';
    } else if (urgencyScore > 0.2) {
      urgency = 'medium';
    } else {
      urgency = 'low';
    }

    // Override urgency for escalation intent
    if (topIntent.intent === 'escalation') {
      urgency = urgency === 'low' ? 'medium' : urgency;
    }

    return {
      type: topIntent.intent as any,
      subtype,
      confidence,
      entities: analyses.entities,
      urgency,
      context: {
        previousIntents: analyses.contextAnalysis.previousIntents,
        relatedTopics: analyses.contextAnalysis.relatedTopics,
        timeContext: urgency === 'critical' ? 'immediate' : 'normal'
      }
    };
  }

  /**
   * @ai-purpose Initialize intent recognition patterns
   */
  private initializeIntentPatterns(): void {
    this.intentPatterns = new Map();

    // Question patterns
    this.intentPatterns.set('question', [
      { pattern: /^what\s+(?:is|are|does|do|can|will|should|would)/i, weight: 0.8 },
      { pattern: /^how\s+(?:do|does|can|will|should|would|long|much|many)/i, weight: 0.8 },
      { pattern: /^when\s+(?:do|does|can|will|should|would)/i, weight: 0.8 },
      { pattern: /^where\s+(?:do|does|can|will|should|would)/i, weight: 0.8 },
      { pattern: /^why\s+(?:do|does|can|will|should|would)/i, weight: 0.8 },
      { pattern: /^who\s+(?:do|does|can|will|should|would)/i, weight: 0.8 },
      { pattern: /\?$/i, weight: 0.6 },
      { pattern: /can you (?:tell me|explain|help)/i, weight: 0.7 },
      { pattern: /i (?:don't understand|need to know|want to know)/i, weight: 0.7 }
    ]);

    // Document upload patterns
    this.intentPatterns.set('document_upload', [
      { pattern: /(?:here is|here's|attached|uploading|sending)/i, weight: 0.7 },
      { pattern: /(?:paystub|pay stub)/i, weight: 0.8, subtype: 'income_verification' },
      { pattern: /bank statement/i, weight: 0.8, subtype: 'financial_documentation' },
      { pattern: /tax return|1040/i, weight: 0.8, subtype: 'tax_documentation' },
      { pattern: /hardship letter/i, weight: 0.8, subtype: 'hardship_documentation' },
      { pattern: /(?:document|file|form).*(?:attached|uploaded|sent)/i, weight: 0.7 }
    ]);

    // Status update patterns
    this.intentPatterns.set('status_update', [
      { pattern: /(?:update|status|progress|news)/i, weight: 0.6 },
      { pattern: /(?:got|received|heard from)/i, weight: 0.5 },
      { pattern: /(?:they said|lender said|bank said)/i, weight: 0.7 },
      { pattern: /(?:approved|denied|rejected|accepted)/i, weight: 0.8 },
      { pattern: /(?:changed|updated|new)/i, weight: 0.4 }
    ]);

    // Help request patterns
    this.intentPatterns.set('help_request', [
      { pattern: /(?:help|assist|support)/i, weight: 0.8 },
      { pattern: /(?:i need|i want|can you)/i, weight: 0.6 },
      { pattern: /(?:stuck|confused|lost|don't know)/i, weight: 0.7 },
      { pattern: /(?:what should i|how do i|where do i)/i, weight: 0.7 },
      { pattern: /(?:next step|what now|what next)/i, weight: 0.8 }
    ]);

    // Escalation patterns
    this.intentPatterns.set('escalation', [
      { pattern: /(?:speak to|talk to|transfer|escalate)/i, weight: 0.9 },
      { pattern: /(?:human|person|someone|agent|representative)/i, weight: 0.8 },
      { pattern: /(?:supervisor|manager|expert)/i, weight: 0.9 },
      { pattern: /(?:this isn't working|not helping|frustrated)/i, weight: 0.7 },
      { pattern: /(?:urgent|emergency|critical|asap)/i, weight: 0.8 }
    ]);
  }

  /**
   * @ai-purpose Initialize entity extraction patterns
   */
  private initializeEntityExtractors(): void {
    this.entityExtractors = new Map();

    this.entityExtractors.set('loan_number', /loan\s*#?\s*(\d{10,})/i);
    this.entityExtractors.set('phone_number', /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/);
    this.entityExtractors.set('email', /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    this.entityExtractors.set('ssn', /\b\d{3}-?\d{2}-?\d{4}\b/);
    this.entityExtractors.set('property_address', /\b\d+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct|way|place|pl)\b/i);
  }
}