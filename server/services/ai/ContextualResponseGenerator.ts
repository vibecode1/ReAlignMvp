/**
 * @ai-context Contextual response generation service
 * @ai-purpose Generate appropriate responses based on intent, emotion, and context
 * @ai-modifiable true
 */

import type { UserInput, EmotionalState, Intent, AIResponse, ConversationHistory } from './ConversationalAIEngine';

export interface ResponseGenerationInput {
  input: UserInput;
  intent: Intent;
  emotionalState: EmotionalState;
  conversationHistory: ConversationHistory;
  caseMemory?: {
    summary: string;
    keyTopics: string[];
    unresolvedQuestions: any[];
    emotionalJourney: any[];
    preferredStyle: string;
  };
  userRole: string;
  caseStage: string;
  traceId: string;
}

export interface ResponseTemplate {
  template: string;
  emotionalTone: 'empathetic' | 'professional' | 'encouraging' | 'urgent';
  variables: Record<string, string>;
  suggestedActions?: Array<{
    type: string;
    label: string;
    data: any;
  }>;
  followUpRequired?: boolean;
  escalationRequired?: boolean;
}

/**
 * @ai-purpose Generate contextual responses based on user intent and emotional state
 * @debug-trace Log response generation decisions and confidence
 */
export class ContextualResponseGenerator {
  private responseTemplates: Map<string, Array<ResponseTemplate>>;
  private emotionalResponseModifiers: Map<string, {
    toneAdjustment: string;
    phraseAdditions: string[];
    urgencyModifier: number;
  }>;

  constructor() {
    this.initializeResponseTemplates();
    this.initializeEmotionalModifiers();
  }

  /**
   * @ai-purpose Generate contextual response
   */
  async generate(input: ResponseGenerationInput): Promise<AIResponse> {
    const { intent, emotionalState, traceId } = input;
    
    console.log(`[${traceId}] Generating response`, {
      intentType: intent.type,
      intentConfidence: intent.confidence,
      distressLevel: emotionalState.distressLevel,
      urgency: intent.urgency
    });

    try {
      // Step 1: Select appropriate response template
      const template = this.selectResponseTemplate(input);
      
      // Step 2: Apply emotional adjustments
      const emotionallyAdjustedTemplate = this.applyEmotionalAdjustments(
        template, 
        emotionalState
      );
      
      // Step 3: Generate response content
      const responseContent = await this.generateResponseContent(
        emotionallyAdjustedTemplate,
        input
      );
      
      // Step 4: Add suggested actions
      const suggestedActions = this.generateSuggestedActions(input);
      
      // Step 5: Determine follow-up requirements
      const followUpRequired = this.shouldRequireFollowUp(input);
      const escalationRequired = this.shouldEscalate(input);
      
      // Step 6: Calculate response confidence
      const confidence = this.calculateResponseConfidence(input, template);

      const response: AIResponse = {
        message: responseContent,
        confidence,
        emotionalTone: emotionallyAdjustedTemplate.emotionalTone,
        suggestedActions,
        escalationRequired,
        followUpRequired,
        nextSteps: this.generateNextSteps(input),
        attachments: this.generateResponseAttachments(input)
      };

      console.log(`[${traceId}] Response generated`, {
        messageLength: response.message.length,
        confidence: response.confidence,
        tone: response.emotionalTone,
        suggestedActionsCount: response.suggestedActions?.length || 0,
        escalationRequired: response.escalationRequired
      });

      return response;

    } catch (error) {
      console.error(`[${traceId}] Response generation failed:`, error);
      
      // Generate fallback response
      return this.generateFallbackResponse(input);
    }
  }

  /**
   * @ai-purpose Select appropriate response template based on intent and context
   */
  private selectResponseTemplate(input: ResponseGenerationInput): ResponseTemplate {
    const { intent, emotionalState, userRole } = input;
    
    // Get templates for this intent type
    const templates = this.responseTemplates.get(intent.type) || [];
    
    if (templates.length === 0) {
      return this.getDefaultTemplate(intent.type);
    }

    // Score templates based on context
    const scoredTemplates = templates.map(template => {
      let score = 0;

      // Score based on emotional appropriateness
      if (emotionalState.distressLevel > 0.7 && template.emotionalTone === 'empathetic') {
        score += 0.4;
      } else if (emotionalState.hopeLevel > 0.7 && template.emotionalTone === 'encouraging') {
        score += 0.3;
      } else if (intent.urgency === 'critical' && template.emotionalTone === 'urgent') {
        score += 0.5;
      } else if (template.emotionalTone === 'professional') {
        score += 0.2; // Default professional tone
      }

      // Score based on user role
      if (userRole === 'negotiator' && template.template.includes('expert')) {
        score += 0.2;
      }

      // Score based on intent subtype match
      if (intent.subtype && template.template.includes(intent.subtype)) {
        score += 0.3;
      }

      return { template, score };
    });

    // Return highest scoring template
    const bestTemplate = scoredTemplates.reduce((best, current) =>
      current.score > best.score ? current : best
    );

    return bestTemplate.template;
  }

  /**
   * @ai-purpose Apply emotional adjustments to response template
   */
  private applyEmotionalAdjustments(
    template: ResponseTemplate,
    emotionalState: EmotionalState
  ): ResponseTemplate {
    const adjustedTemplate = { ...template };
    
    // Apply emotional modifiers based on current state
    if (emotionalState.distressLevel > 0.8) {
      const modifier = this.emotionalResponseModifiers.get('high_distress');
      if (modifier) {
        adjustedTemplate.emotionalTone = 'empathetic';
        adjustedTemplate.template = modifier.phraseAdditions[0] + ' ' + adjustedTemplate.template;
      }
    }

    if (emotionalState.frustrationLevel > 0.8) {
      const modifier = this.emotionalResponseModifiers.get('high_frustration');
      if (modifier) {
        adjustedTemplate.template = modifier.phraseAdditions[0] + ' ' + adjustedTemplate.template;
      }
    }

    if (emotionalState.hopeLevel < 0.3) {
      const modifier = this.emotionalResponseModifiers.get('low_hope');
      if (modifier) {
        adjustedTemplate.template += ' ' + modifier.phraseAdditions[0];
      }
    }

    return adjustedTemplate;
  }

  /**
   * @ai-purpose Generate actual response content from template
   */
  private async generateResponseContent(
    template: ResponseTemplate,
    input: ResponseGenerationInput
  ): Promise<string> {
    let content = template.template;

    // Replace template variables
    Object.entries(template.variables).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{${key}}`, 'g'), value);
    });

    // Replace dynamic content based on input
    content = content.replace(/{user_name}/g, this.extractUserName(input));
    content = content.replace(/{case_stage}/g, input.caseStage);
    content = content.replace(/{user_role}/g, input.userRole);

    // Add entity-specific information
    if (input.intent.entities.length > 0) {
      const entityContext = this.buildEntityContext(input.intent.entities);
      if (entityContext) {
        content += ` ${entityContext}`;
      }
    }

    // Add case-specific context if available
    if (input.caseMemory && input.caseMemory.keyTopics.length > 0) {
      const topicContext = this.buildTopicContext(input.caseMemory.keyTopics);
      if (topicContext) {
        content += ` ${topicContext}`;
      }
    }

    return content.trim();
  }

  /**
   * @ai-purpose Generate suggested actions based on intent and context
   */
  private generateSuggestedActions(input: ResponseGenerationInput): Array<{
    type: string;
    label: string;
    data: any;
  }> {
    const actions: Array<{
      type: string;
      label: string;
      data: any;
    }> = [];

    const { intent, emotionalState } = input;

    switch (intent.type) {
      case 'document_upload':
        actions.push({
          type: 'upload_document',
          label: 'Upload Additional Documents',
          data: { 
            category: intent.subtype || 'general',
            urgency: intent.urgency
          }
        });
        break;

      case 'question':
        actions.push({
          type: 'provide_information',
          label: 'Get More Information',
          data: { 
            topic: intent.entities.find(e => e.type === 'topic')?.value || 'general'
          }
        });
        break;

      case 'help_request':
        actions.push({
          type: 'schedule_consultation',
          label: 'Schedule Consultation',
          data: { urgency: intent.urgency }
        });
        if (emotionalState.distressLevel > 0.6) {
          actions.push({
            type: 'connect_support',
            label: 'Connect with Support Specialist',
            data: { reason: 'emotional_support' }
          });
        }
        break;

      case 'escalation':
        actions.push({
          type: 'escalate_to_human',
          label: 'Connect with Human Expert',
          data: { 
            urgency: 'high',
            reason: intent.subtype || 'user_requested'
          }
        });
        break;

      case 'status_update':
        actions.push({
          type: 'view_case_status',
          label: 'View Complete Case Status',
          data: { caseId: input.caseMemory?.summary || '' }
        });
        break;
    }

    // Add universal actions based on emotional state
    if (emotionalState.distressLevel > 0.8) {
      actions.push({
        type: 'emergency_resources',
        label: 'Access Emergency Resources',
        data: { type: 'crisis_support' }
      });
    }

    return actions;
  }

  /**
   * @ai-purpose Determine if follow-up is required
   */
  private shouldRequireFollowUp(input: ResponseGenerationInput): boolean {
    const { intent, emotionalState } = input;

    // Always follow up on escalation requests
    if (intent.type === 'escalation') {
      return true;
    }

    // Follow up on high distress
    if (emotionalState.distressLevel > 0.8) {
      return true;
    }

    // Follow up on document uploads to verify processing
    if (intent.type === 'document_upload') {
      return true;
    }

    // Follow up on critical urgency
    if (intent.urgency === 'critical') {
      return true;
    }

    return false;
  }

  /**
   * @ai-purpose Determine if escalation is required
   */
  private shouldEscalate(input: ResponseGenerationInput): boolean {
    const { intent, emotionalState } = input;

    // Direct escalation request
    if (intent.type === 'escalation') {
      return true;
    }

    // High emotional distress
    if (emotionalState.distressLevel > 0.9) {
      return true;
    }

    // Critical urgency with high frustration
    if (intent.urgency === 'critical' && emotionalState.frustrationLevel > 0.8) {
      return true;
    }

    // Low confidence in intent classification
    if (intent.confidence < 0.5) {
      return true;
    }

    return false;
  }

  /**
   * @ai-purpose Calculate confidence in response appropriateness
   */
  private calculateResponseConfidence(
    input: ResponseGenerationInput,
    template: ResponseTemplate
  ): number {
    let confidence = 0.8; // Base confidence

    // Adjust based on intent confidence
    confidence *= input.intent.confidence;

    // Adjust based on template match quality
    if (input.intent.subtype && template.template.includes(input.intent.subtype)) {
      confidence += 0.1;
    }

    // Adjust based on emotional state clarity
    if (input.emotionalState.confidence > 0.8) {
      confidence += 0.05;
    }

    // Adjust based on available context
    if (input.caseMemory && input.caseMemory.keyTopics.length > 0) {
      confidence += 0.05;
    }

    return Math.min(confidence, 1);
  }

  /**
   * @ai-purpose Generate next steps for user
   */
  private generateNextSteps(input: ResponseGenerationInput): string[] {
    const steps: string[] = [];
    const { intent, emotionalState } = input;

    switch (intent.type) {
      case 'document_upload':
        steps.push('Review uploaded documents for completeness');
        steps.push('Wait for document processing confirmation');
        if (intent.subtype === 'income_verification') {
          steps.push('Prepare additional income documentation if needed');
        }
        break;

      case 'question':
        steps.push('Review the provided information');
        steps.push('Ask follow-up questions if needed');
        steps.push('Proceed with recommended actions');
        break;

      case 'help_request':
        if (emotionalState.distressLevel > 0.7) {
          steps.push('Connect with a support specialist immediately');
        } else {
          steps.push('Review available resources');
          steps.push('Schedule consultation if needed');
        }
        break;

      case 'escalation':
        steps.push('Prepare case summary for human expert');
        steps.push('Wait for expert assignment');
        steps.push('Be ready to provide additional context');
        break;

      case 'status_update':
        steps.push('Review current case status');
        steps.push('Update any changed information');
        steps.push('Plan next actions based on status');
        break;
    }

    return steps;
  }

  /**
   * @ai-purpose Generate response attachments if needed
   */
  private generateResponseAttachments(input: ResponseGenerationInput): Array<{
    type: string;
    content: any;
  }> {
    const attachments: Array<{
      type: string;
      content: any;
    }> = [];

    const { intent } = input;

    // Add relevant forms or checklists
    if (intent.type === 'document_upload') {
      attachments.push({
        type: 'document_checklist',
        content: {
          title: 'Required Documents Checklist',
          category: intent.subtype || 'general'
        }
      });
    }

    // Add informational resources
    if (intent.type === 'question' && intent.entities.some(e => e.type === 'financial_amount')) {
      attachments.push({
        type: 'financial_calculator',
        content: {
          title: 'Mortgage Payment Calculator',
          type: 'interactive_tool'
        }
      });
    }

    return attachments;
  }

  /**
   * @ai-purpose Extract user name from input or context
   */
  private extractUserName(input: ResponseGenerationInput): string {
    // Try to extract from entities
    const nameEntity = input.intent.entities.find(e => e.type === 'person_name');
    if (nameEntity) {
      return nameEntity.value;
    }

    // Default fallback
    return 'there';
  }

  /**
   * @ai-purpose Build context from extracted entities
   */
  private buildEntityContext(entities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>): string {
    const contexts: string[] = [];

    entities.forEach(entity => {
      switch (entity.type) {
        case 'financial_amount':
          contexts.push(`I see you mentioned ${entity.value}.`);
          break;
        case 'date':
          contexts.push(`Regarding the date ${entity.value} you mentioned.`);
          break;
        case 'loan_number':
          contexts.push(`I have your loan number ${entity.value} on file.`);
          break;
      }
    });

    return contexts.join(' ');
  }

  /**
   * @ai-purpose Build context from case topics
   */
  private buildTopicContext(topics: string[]): string {
    if (topics.length === 0) return '';

    const relevantTopics = topics.slice(0, 3); // Limit to most relevant
    return `Based on our previous discussions about ${relevantTopics.join(', ')}.`;
  }

  /**
   * @ai-purpose Generate fallback response for errors
   */
  private generateFallbackResponse(input: ResponseGenerationInput): AIResponse {
    return {
      message: "I understand you're reaching out, and I want to help. Let me connect you with a human expert who can provide the specific assistance you need right now.",
      confidence: 0.7,
      emotionalTone: 'empathetic',
      escalationRequired: true,
      suggestedActions: [{
        type: 'escalate_to_human',
        label: 'Connect with Expert',
        data: { reason: 'ai_processing_error' }
      }]
    };
  }

  /**
   * @ai-purpose Get default template for intent type
   */
  private getDefaultTemplate(intentType: string): ResponseTemplate {
    const defaultTemplates = {
      question: {
        template: "I understand you have a question. Let me help you with that.",
        emotionalTone: 'professional' as const,
        variables: {}
      },
      document_upload: {
        template: "Thank you for sharing your documents. I'll process these and get back to you shortly.",
        emotionalTone: 'professional' as const,
        variables: {}
      },
      status_update: {
        template: "I appreciate the update. Let me review this information and provide you with next steps.",
        emotionalTone: 'professional' as const,
        variables: {}
      },
      help_request: {
        template: "I'm here to help. Let me understand what you need assistance with.",
        emotionalTone: 'empathetic' as const,
        variables: {}
      },
      escalation: {
        template: "I understand you'd like to speak with a human expert. Let me connect you right away.",
        emotionalTone: 'empathetic' as const,
        variables: {},
        escalationRequired: true
      }
    };

    return defaultTemplates[intentType as keyof typeof defaultTemplates] || defaultTemplates.help_request;
  }

  /**
   * @ai-purpose Initialize response templates
   */
  private initializeResponseTemplates(): void {
    this.responseTemplates = new Map();

    // Question response templates
    this.responseTemplates.set('question', [
      {
        template: "That's a great question about {topic}. Let me explain that for you clearly.",
        emotionalTone: 'professional',
        variables: { topic: 'loss mitigation' }
      },
      {
        template: "I understand you need clarification on this. Here's what you need to know:",
        emotionalTone: 'empathetic',
        variables: {}
      }
    ]);

    // Document upload templates
    this.responseTemplates.set('document_upload', [
      {
        template: "Thank you for uploading your {document_type}. I'm processing this now and will verify all the information.",
        emotionalTone: 'professional',
        variables: { document_type: 'documents' }
      },
      {
        template: "I've received your documents. This is a positive step forward in your case. Let me review these carefully.",
        emotionalTone: 'encouraging',
        variables: {}
      }
    ]);

    // Help request templates
    this.responseTemplates.set('help_request', [
      {
        template: "I'm here to support you through this process. Let me understand exactly what you need help with so I can guide you effectively.",
        emotionalTone: 'empathetic',
        variables: {}
      },
      {
        template: "I can help you with that. Based on your situation, here are your best options:",
        emotionalTone: 'professional',
        variables: {}
      }
    ]);

    // Escalation templates
    this.responseTemplates.set('escalation', [
      {
        template: "I understand you need to speak with a human expert. That's completely reasonable, and I'm connecting you with someone who can provide specialized assistance.",
        emotionalTone: 'empathetic',
        variables: {},
        escalationRequired: true
      }
    ]);

    // Status update templates
    this.responseTemplates.set('status_update', [
      {
        template: "Thank you for the update on your case. Let me review this information and update your file accordingly.",
        emotionalTone: 'professional',
        variables: {}
      }
    ]);
  }

  /**
   * @ai-purpose Initialize emotional response modifiers
   */
  private initializeEmotionalModifiers(): void {
    this.emotionalResponseModifiers = new Map();

    this.emotionalResponseModifiers.set('high_distress', {
      toneAdjustment: 'empathetic',
      phraseAdditions: [
        "I can hear that this is really stressful for you, and I want you to know that you're not alone in this.",
        "I understand this situation is overwhelming, and that's completely understandable."
      ],
      urgencyModifier: 0.3
    });

    this.emotionalResponseModifiers.set('high_frustration', {
      toneAdjustment: 'empathetic',
      phraseAdditions: [
        "I can understand your frustration with this process, and your feelings are completely valid.",
        "I hear your frustration, and I want to help make this easier for you."
      ],
      urgencyModifier: 0.2
    });

    this.emotionalResponseModifiers.set('low_hope', {
      toneAdjustment: 'encouraging',
      phraseAdditions: [
        "I want you to know that there are solutions available, and we're going to work through this together.",
        "Many people in similar situations have found successful paths forward, and I believe we can too."
      ],
      urgencyModifier: 0.1
    });
  }
}