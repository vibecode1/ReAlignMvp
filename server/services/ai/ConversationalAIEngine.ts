/**
 * @ai-context Primary AI conversation engine for ReAlign 3.0
 * @ai-critical Core system component - all user interactions flow through here
 * @test-requirement 100% coverage for conversation flows
 * @ai-modifiable true
 */

import { caseMemoryService as CaseMemoryService, type MemoryUpdate } from '../CaseMemoryService';
import { ModelOrchestrator } from './ModelOrchestrator';
import { EmotionalAnalyzer } from './EmotionalAnalyzer';
import { IntentClassifier } from './IntentClassifier';
import { ContextualResponseGenerator } from './ContextualResponseGenerator';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import config from '../../config';

export interface UserInput {
  message: string;
  attachments?: Array<{
    id: string;
    type: string;
    url: string;
  }>;
  metadata?: {
    platform: string;
    timestamp: Date;
    userAgent?: string;
  };
}

export interface ConversationContext {
  userId: string;
  caseId: string;
  userRole: string;
  caseStage: string;
  interactionCount: number;
  emotionalState?: EmotionalState;
  sessionId: string;
  timestamp: Date;
  userRequestedHuman?: boolean;
  aiConfidence?: number;
}

export interface EmotionalState {
  distressLevel: number;
  hopeLevel: number;
  frustrationLevel: number;
  confidence: number;
  shouldEscalate: boolean;
  trends: Array<{
    timestamp: Date;
    distress: number;
    hope: number;
    frustration: number;
  }>;
}

export interface AIResponse {
  message: string;
  confidence: number;
  emotionalTone: 'empathetic' | 'professional' | 'encouraging' | 'urgent';
  suggestedActions?: Array<{
    type: string;
    label: string;
    data: any;
  }>;
  escalationRequired?: boolean;
  followUpRequired?: boolean;
  nextSteps?: string[];
  attachments?: Array<{
    type: string;
    content: any;
  }>;
}

export interface ProcessMessageOptions {
  message: string;
  caseId: string;
  userId: string;
  context?: any;
}

export interface ConversationHistory {
  messages: Array<{
    id: string;
    sender: 'user' | 'ai';
    content: string;
    timestamp: Date;
    metadata?: any;
  }>;
  caseId: string;
  getRecent(count: number): Array<any>;
}

export interface Intent {
  type: 'question' | 'document_upload' | 'status_update' | 'help_request' | 'escalation';
  subtype?: string;
  confidence: number;
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * @ai-purpose Core conversational AI system with emotional intelligence
 * @debug-trace All operations include trace IDs for debugging
 */
export class ConversationalAIEngine {
  private models: ModelOrchestrator;
  private memory: typeof CaseMemoryService;
  private emotionalAnalyzer: EmotionalAnalyzer;
  private intentClassifier: IntentClassifier;
  private responseGenerator: ContextualResponseGenerator;
  private openai: OpenAI | null;
  private anthropic: Anthropic | null;

  constructor() {
    this.models = new ModelOrchestrator();
    this.memory = CaseMemoryService;
    this.emotionalAnalyzer = new EmotionalAnalyzer();
    this.intentClassifier = new IntentClassifier();
    this.responseGenerator = new ContextualResponseGenerator();
    
    // Initialize AI clients if API keys are available
    this.openai = config.openaiApiKey ? new OpenAI({
      apiKey: config.openaiApiKey,
      organization: config.ai.openai.organization
    }) : null;
    
    this.anthropic = config.anthropicApiKey ? new Anthropic({
      apiKey: config.anthropicApiKey
    }) : null;
  }

  private generateTraceId(userId: string): string {
    return `CONV-${Date.now()}-${userId.slice(0, 8)}`;
  }

  /**
   * @ai-purpose Simplified message processing for API integration
   */
  async processMessage(options: ProcessMessageOptions): Promise<any> {
    const traceId = this.generateTraceId(options.userId);
    console.log(`[${traceId}] Processing message via simplified API`);

    try {
      // Get case memory context
      const caseMemory = await this.memory.getMemory(options.caseId);
      const conversationContext = caseMemory ? 
        await this.memory.getConversationContext(options.caseId) : null;

      // Build system prompt with context
      const systemPrompt = this.buildSystemPrompt(conversationContext);

      // Call AI based on available services
      let response;
      let modelUsed = 'fallback';
      let tokensUsed = 0;

      if (this.openai && config.ai.defaultModel.startsWith('gpt')) {
        // Use OpenAI
        const completion = await this.openai.chat.completions.create({
          model: config.ai.defaultModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: options.message }
          ],
          temperature: config.ai.temperature,
          max_tokens: config.ai.maxTokens
        });

        response = completion.choices[0].message.content;
        modelUsed = config.ai.defaultModel;
        tokensUsed = completion.usage?.total_tokens || 0;

      } else if (this.anthropic && config.ai.defaultModel.startsWith('claude')) {
        // Use Anthropic
        const completion = await this.anthropic.messages.create({
          model: config.ai.claudeModel,
          messages: [
            { role: 'user', content: options.message }
          ],
          system: systemPrompt,
          max_tokens: config.ai.maxTokens
        });

        response = completion.content[0].type === 'text' ? completion.content[0].text : '';
        modelUsed = config.ai.claudeModel;
        tokensUsed = completion.usage?.input_tokens + completion.usage?.output_tokens || 0;

      } else {
        // Fallback response
        response = "I understand you need help. While I'm currently operating in limited mode, I can still assist you with basic questions about your case. What specific information are you looking for?";
      }

      // Analyze response for emotional tone and next steps
      const analysis = this.analyzeResponse(response, options.message);

      return {
        response,
        modelUsed,
        tokensUsed,
        confidence: analysis.confidence,
        emotionalState: analysis.emotionalState,
        shouldEscalate: analysis.shouldEscalate,
        topics: analysis.topics,
        actionItems: analysis.actionItems,
        summary: this.generateSummary(options.message, response),
        intent: analysis.intent,
        requiresFollowUp: analysis.requiresFollowUp,
        reasoning: analysis.reasoning,
        comprehensionLevel: analysis.comprehensionLevel,
        urgencyScore: analysis.urgencyScore
      };

    } catch (error) {
      console.error(`[${traceId}] AI processing error:`, error);
      throw error;
    }
  }

  /**
   * @ai-purpose Original detailed message processing
   * @debug-trace Track conversation flow with detailed logging
   */
  async processDetailedMessage(
    input: UserInput,
    context: ConversationContext
  ): Promise<AIResponse> {
    const traceId = this.generateTraceId(context.userId);
    
    console.log(`[${traceId}] Starting conversation processing`, {
      userId: context.userId,
      caseId: context.caseId,
      messageLength: input.message.length,
      hasAttachments: input.attachments?.length > 0,
      sessionId: context.sessionId
    });

    try {
      // Step 1: Load complete conversation history
      const history = await this.loadConversationHistory(context.caseId);
      console.log(`[${traceId}] History loaded`, {
        messageCount: history.messages.length,
        oldestMessage: history.messages[0]?.timestamp
      });

      // Step 2: Analyze emotional state
      const emotionalState = await this.analyzeEmotionalState(input, history, traceId);
      console.log(`[${traceId}] Emotion analyzed`, {
        distressLevel: emotionalState.distressLevel,
        shouldEscalate: emotionalState.shouldEscalate
      });

      // Step 3: Understand intent with context
      const intent = await this.understandIntent(input, history, emotionalState, traceId);
      console.log(`[${traceId}] Intent understood`, {
        type: intent.type,
        confidence: intent.confidence,
        urgency: intent.urgency
      });

      // Step 4: Generate contextual response
      const response = await this.generateResponse({
        input,
        history,
        emotionalState,
        intent,
        context,
        traceId
      });

      // Step 5: Update memory system
      await this.updateCaseMemory(context.caseId, {
        type: 'conversation',
        data: {
          message: input,
          response,
          emotionalState,
          intent,
          summary: this.generateConversationSummary(input, response, intent),
          topics: intent.entities.map(e => e.value),
          emotionalState: {
            distress: emotionalState.distressLevel,
            hope: emotionalState.hopeLevel,
            frustration: emotionalState.frustrationLevel
          },
          unresolvedQuestions: await this.extractUnresolvedQuestions(input, response)
        },
        source: 'conversational_ai',
        confidence: response.confidence,
        timestamp: new Date()
      });

      console.log(`[${traceId}] Conversation processed successfully`, {
        responseLength: response.message.length,
        confidence: response.confidence,
        escalationRequired: response.escalationRequired
      });

      return response;

    } catch (error) {
      console.error(`[${traceId}] Conversation processing failed`, {
        error: error.message,
        stack: error.stack,
        stage: error.stage || 'unknown',
        context: this.summarizeContext(context)
      });

      // Graceful fallback
      return this.generateFallbackResponse(error, context, traceId);
    }
  }

  /**
   * @ai-purpose Analyze emotional indicators in user input
   * @test-case Test with various emotional states
   */
  private async analyzeEmotionalState(
    input: UserInput,
    history: ConversationHistory,
    traceId: string
  ): Promise<EmotionalState> {
    console.log(`[${traceId}] Analyzing emotional state`);

    const analysis = await this.emotionalAnalyzer.analyze({
      currentMessage: input.message,
      recentMessages: history.getRecent(5),
      linguisticMarkers: this.extractLinguisticMarkers(input.message),
      attachments: input.attachments
    });

    // Track emotional journey in case memory
    await this.memory.appendEmotionalJourney(history.caseId, analysis);

    return {
      distressLevel: analysis.distress || 0,
      hopeLevel: analysis.hope || 0,
      frustrationLevel: analysis.frustration || 0,
      confidence: analysis.confidence || 0.8,
      shouldEscalate: analysis.distress > 0.8 || analysis.frustration > 0.9,
      trends: analysis.trends || []
    };
  }

  /**
   * @ai-purpose Understand user intent with context
   */
  private async understandIntent(
    input: UserInput,
    history: ConversationHistory,
    emotionalState: EmotionalState,
    traceId: string
  ): Promise<Intent> {
    console.log(`[${traceId}] Understanding intent`);

    return await this.intentClassifier.classify({
      message: input.message,
      attachments: input.attachments,
      conversationHistory: history.getRecent(3),
      emotionalContext: emotionalState,
      caseId: history.caseId
    });
  }

  /**
   * @ai-purpose Generate contextual response based on all available data
   */
  private async generateResponse(params: {
    input: UserInput;
    history: ConversationHistory;
    emotionalState: EmotionalState;
    intent: Intent;
    context: ConversationContext;
    traceId: string;
  }): Promise<AIResponse> {
    const { input, history, emotionalState, intent, context, traceId } = params;
    
    console.log(`[${traceId}] Generating contextual response`);

    // Get case memory for full context
    const caseMemory = await this.memory.getMemory(context.caseId);
    const conversationContext = caseMemory ? 
      await this.memory.getConversationContext(context.caseId) : null;

    return await this.responseGenerator.generate({
      input,
      intent,
      emotionalState,
      conversationHistory: history,
      caseMemory: conversationContext,
      userRole: context.userRole,
      caseStage: context.caseStage,
      traceId
    });
  }

  /**
   * @ai-purpose Load complete conversation history for context
   */
  private async loadConversationHistory(caseId: string): Promise<ConversationHistory> {
    // This would integrate with the existing message system
    // For now, creating a basic structure
    return {
      messages: [], // Would load from database
      caseId,
      getRecent: (count: number) => []
    };
  }

  /**
   * @ai-purpose Update case memory with conversation details
   */
  private async updateCaseMemory(caseId: string, update: MemoryUpdate): Promise<void> {
    try {
      await this.memory.updateMemory(caseId, update);
    } catch (error) {
      console.error(`Failed to update case memory for ${caseId}:`, error);
      // Non-critical error, don't fail the conversation
    }
  }

  /**
   * @ai-purpose Extract linguistic markers for emotional analysis
   */
  private extractLinguisticMarkers(message: string): Array<{
    type: string;
    value: string;
    position: number;
  }> {
    const markers: Array<{ type: string; value: string; position: number }> = [];
    
    // Distress markers
    const distressWords = ['help', 'desperate', 'urgent', 'crisis', 'emergency', 'struggling'];
    const hopeWords = ['hope', 'optimistic', 'confident', 'positive', 'trust'];
    const frustrationWords = ['frustrated', 'angry', 'disappointed', 'fed up', 'ridiculous'];

    const words = message.toLowerCase().split(/\s+/);
    
    words.forEach((word, index) => {
      if (distressWords.includes(word)) {
        markers.push({ type: 'distress', value: word, position: index });
      } else if (hopeWords.includes(word)) {
        markers.push({ type: 'hope', value: word, position: index });
      } else if (frustrationWords.includes(word)) {
        markers.push({ type: 'frustration', value: word, position: index });
      }
    });

    return markers;
  }

  /**
   * @ai-purpose Generate conversation summary for memory
   */
  private generateConversationSummary(
    input: UserInput,
    response: AIResponse,
    intent: Intent
  ): string {
    return `User ${intent.type}: ${input.message.slice(0, 100)}... | AI responded with ${response.emotionalTone} tone, confidence: ${response.confidence}`;
  }

  /**
   * @ai-purpose Extract unresolved questions from conversation
   */
  private async extractUnresolvedQuestions(
    input: UserInput,
    response: AIResponse
  ): Promise<Array<{
    question: string;
    priority: 'high' | 'medium' | 'low';
    category: string;
  }>> {
    const questions: Array<{
      question: string;
      priority: 'high' | 'medium' | 'low';
      category: string;
    }> = [];

    // Simple regex to find questions
    const questionRegex = /[.!?]*\s*([^.!?]*\?)/g;
    let match;

    while ((match = questionRegex.exec(input.message)) !== null) {
      questions.push({
        question: match[1].trim(),
        priority: 'medium',
        category: 'general'
      });
    }

    // Check if response addresses all questions
    if (questions.length > 0 && !response.message.includes('?')) {
      // Some questions may remain unresolved
      return questions.filter(q => 
        !response.message.toLowerCase().includes(q.question.toLowerCase().slice(0, 20))
      );
    }

    return [];
  }

  /**
   * @ai-purpose Summarize context for debugging
   */
  private summarizeContext(context: ConversationContext): any {
    return {
      userId: context.userId.slice(0, 8),
      caseId: context.caseId.slice(0, 8),
      userRole: context.userRole,
      caseStage: context.caseStage,
      interactionCount: context.interactionCount,
      sessionId: context.sessionId.slice(0, 8)
    };
  }

  /**
   * @ai-purpose Generate fallback response when errors occur
   */
  private generateFallbackResponse(
    error: Error,
    context: ConversationContext,
    traceId: string
  ): AIResponse {
    console.log(`[${traceId}] Generating fallback response due to error`);

    return {
      message: "I apologize, but I'm experiencing some technical difficulties right now. Let me connect you with a human expert who can assist you immediately.",
      confidence: 0.9,
      emotionalTone: 'empathetic',
      escalationRequired: true,
      suggestedActions: [{
        type: 'escalate_to_human',
        label: 'Connect with Expert',
        data: {
          reason: 'technical_error',
          error: error.message,
          urgency: 'high'
        }
      }]
    };
  }

  /**
   * @ai-purpose Build system prompt with case context
   */
  private buildSystemPrompt(context: any): string {
    const basePrompt = `You are an AI assistant helping homeowners navigate the loss mitigation process. You should be empathetic, professional, and helpful.

Your role is to:
1. Provide clear, actionable guidance
2. Show understanding and empathy for their situation
3. Help them understand their options
4. Guide them through documentation requirements
5. Escalate to humans when needed

Important guidelines:
- Be concise but thorough
- Use simple language, avoid jargon
- Always maintain a supportive tone
- If unsure, recommend speaking with a human expert`;

    if (context) {
      return `${basePrompt}

Case Context:
- Topics discussed: ${context.keyTopics.join(', ')}
- Unresolved questions: ${context.unresolvedQuestions.length}
- Communication style: ${context.preferredStyle}

Previous conversation summary: ${context.summary}`;
    }

    return basePrompt;
  }

  /**
   * @ai-purpose Analyze AI response for metadata
   */
  private analyzeResponse(response: string, userMessage: string): any {
    // Basic analysis - in production this would use NLP
    const analysis = {
      confidence: 0.85,
      emotionalState: {
        primary: 'neutral',
        intensity: 0.5,
        confidence: 0.8
      },
      shouldEscalate: false,
      topics: [],
      actionItems: [],
      intent: {
        type: 'general_inquiry',
        confidence: 0.8
      },
      requiresFollowUp: false,
      reasoning: {},
      comprehensionLevel: 0.8,
      urgencyScore: 0.3
    };

    // Check for escalation triggers
    const escalationTriggers = ['speak to human', 'talk to someone', 'emergency', 'urgent', 'crisis'];
    if (escalationTriggers.some(trigger => userMessage.toLowerCase().includes(trigger))) {
      analysis.shouldEscalate = true;
      analysis.urgencyScore = 0.9;
    }

    // Extract topics (simple keyword extraction)
    const topicKeywords = ['mortgage', 'payment', 'hardship', 'documents', 'deadline', 'servicer'];
    analysis.topics = topicKeywords.filter(keyword => 
      userMessage.toLowerCase().includes(keyword) || response.toLowerCase().includes(keyword)
    );

    // Check if follow-up is needed
    if (response.includes('?') || response.includes('please provide') || response.includes('let me know')) {
      analysis.requiresFollowUp = true;
    }

    return analysis;
  }

  /**
   * @ai-purpose Generate conversation summary
   */
  private generateSummary(userMessage: string, aiResponse: string): string {
    const userSummary = userMessage.length > 100 ? 
      userMessage.substring(0, 97) + '...' : userMessage;
    const aiSummary = aiResponse.length > 100 ? 
      aiResponse.substring(0, 97) + '...' : aiResponse;
    
    return `User: ${userSummary} | AI: ${aiSummary}`;
  }
}

/**
 * @ai-purpose Singleton instance for use across the application
 */
export const conversationalAI = new ConversationalAIEngine();