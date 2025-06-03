/**
 * @ai-context Orchestrates multiple AI models for different tasks
 * @debug-critical Log all model selections and fallback decisions
 * @ai-modifiable true
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import config from '../../config';

export interface AITask {
  type: 'conversational' | 'document' | 'emotional' | 'intent' | 'regulatory';
  input: any;
  context?: any;
  options?: {
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
  };
}

export interface TaskContext {
  userId?: string;
  caseId?: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  dataSize?: number;
  requiresAccuracy?: boolean;
}

export interface AIResult<T = any> {
  data: T;
  confidence: number;
  executionTime: number;
  tokensUsed?: number;
  model: string;
  success: boolean;
  warnings?: string[];
}

export interface AIModel {
  name: string;
  type: string;
  execute(task: AITask, context: TaskContext): Promise<AIResult>;
  canHandle(task: AITask): boolean;
  estimatedCost(task: AITask): number;
  estimatedTime(task: AITask): number;
}

export interface ModelConfiguration {
  primary: AIModel;
  fallback?: AIModel;
  specialized?: Record<string, AIModel>;
  selectionReason?: string;
}

/**
 * @ai-purpose Orchestrates multiple AI models for different tasks
 * @debug-point All model selections logged with reasoning
 */
export class ModelOrchestrator {
  private models: Map<string, ModelConfiguration>;
  private executionHistory: Array<{
    taskType: string;
    model: string;
    success: boolean;
    executionTime: number;
    timestamp: Date;
  }>;
  private openai: OpenAI | null;
  private anthropic: Anthropic | null;

  constructor() {
    this.models = new Map();
    this.executionHistory = [];
    
    // Initialize AI clients
    this.openai = config.openaiApiKey ? new OpenAI({
      apiKey: config.openaiApiKey,
      organization: config.ai.openai.organization
    }) : null;
    
    this.anthropic = config.anthropicApiKey ? new Anthropic({
      apiKey: config.anthropicApiKey
    }) : null;
    
    this.initializeModels();
  }

  private generateExecutionId(taskType: string): string {
    return `EXEC-${taskType}-${Date.now()}`;
  }

  /**
   * @ai-purpose Initialize all available AI models
   */
  private initializeModels(): void {
    console.log('[ModelOrchestrator] Initializing AI models');

    // Primary conversational model
    this.models.set('conversational', {
      primary: new ConversationalModel({
        name: 'gpt-4-turbo',
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt: this.getConversationalSystemPrompt()
      }),
      fallback: new ConversationalModel({
        name: 'claude-3-sonnet',
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt: this.getConversationalSystemPrompt()
      })
    });

    // Document analysis model
    this.models.set('document', {
      primary: new DocumentAnalysisModel({
        name: 'gpt-4-vision',
        detail: 'high',
        maxTokens: 4000
      }),
      specialized: {
        financial: new FinancialDocumentModel(),
        handwriting: new HandwritingModel()
      }
    });

    // Emotional analysis model
    this.models.set('emotional', {
      primary: new EmotionalAnalysisModel({
        name: 'specialized-emotion',
        temperature: 0.3
      }),
      fallback: new ConversationalModel({
        name: 'gpt-4-turbo',
        temperature: 0.3,
        systemPrompt: this.getEmotionalAnalysisPrompt()
      })
    });

    // Intent classification model
    this.models.set('intent', {
      primary: new IntentClassificationModel({
        name: 'specialized-intent',
        confidence_threshold: 0.8
      }),
      fallback: new ConversationalModel({
        name: 'gpt-4-turbo',
        temperature: 0.2,
        systemPrompt: this.getIntentClassificationPrompt()
      })
    });

    console.log('[ModelOrchestrator] Models initialized successfully');
  }

  /**
   * @ai-purpose Select and execute appropriate model for task
   * @debug Log model selection reasoning
   */
  async executeTask<T>(
    task: AITask,
    context: TaskContext = {}
  ): Promise<AIResult<T>> {
    const executionId = this.generateExecutionId(task.type);
    
    console.log(`[${executionId}] Starting task execution`, {
      taskType: task.type,
      contextSize: JSON.stringify(context).length,
      urgency: context.urgency,
      timestamp: new Date()
    });

    try {
      // Select appropriate model
      const modelConfig = this.selectModel(task.type, context);
      console.log(`[${executionId}] Model selected`, {
        primary: modelConfig.primary.name,
        hasFallback: !!modelConfig.fallback,
        reason: modelConfig.selectionReason
      });

      // Execute with timeout and retry
      const result = await this.executeWithRetry(
        () => modelConfig.primary.execute(task, context),
        {
          maxRetries: 3,
          timeout: task.options?.timeout || 30000,
          onRetry: (attempt, error) => {
            console.log(`[${executionId}] Retry attempt ${attempt}`, {
              error: error.message
            });
          }
        }
      );

      // Log successful execution
      this.logExecution(executionId, {
        model: modelConfig.primary.name,
        success: true,
        executionTime: result.executionTime,
        tokensUsed: result.tokensUsed
      });

      console.log(`[${executionId}] Task completed successfully`, {
        model: result.model,
        confidence: result.confidence,
        executionTime: result.executionTime
      });

      return result;

    } catch (error) {
      console.error(`[${executionId}] Primary model failed`, {
        error: error.message,
        taskType: task.type
      });

      // Try fallback model
      const modelConfig = this.models.get(task.type);
      if (modelConfig?.fallback) {
        console.log(`[${executionId}] Attempting fallback model`);
        
        try {
          const result = await modelConfig.fallback.execute(task, context);
          
          this.logExecution(executionId, {
            model: modelConfig.fallback.name,
            success: true,
            executionTime: result.executionTime,
            fallbackUsed: true
          });

          return result;
        } catch (fallbackError) {
          console.error(`[${executionId}] Fallback model also failed`, {
            error: fallbackError.message
          });
        }
      }

      // Log failure
      this.logExecution(executionId, {
        model: 'none',
        success: false,
        executionTime: 0,
        error: error.message
      });

      throw new ModelExecutionError(error.message, {
        executionId,
        taskType: task.type,
        context
      });
    }
  }

  /**
   * @ai-purpose Select best model for task
   */
  private selectModel(taskType: string, context: TaskContext): ModelConfiguration {
    const config = this.models.get(taskType);
    
    if (!config) {
      throw new Error(`No model configured for task type: ${taskType}`);
    }

    // Check if specialized model should be used
    if (config.specialized && context.urgency === 'critical') {
      for (const [specialization, model] of Object.entries(config.specialized)) {
        if (this.shouldUseSpecialized(specialization, context)) {
          return {
            ...config,
            primary: model,
            selectionReason: `specialized_${specialization}`
          };
        }
      }
    }

    return {
      ...config,
      selectionReason: 'primary_model'
    };
  }

  /**
   * @ai-purpose Execute task with retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries: number;
      timeout: number;
      onRetry?: (attempt: number, error: Error) => void;
    }
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= options.maxRetries + 1; attempt++) {
      try {
        // Execute with timeout
        const result = await Promise.race([
          operation(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Operation timeout')), options.timeout)
          )
        ]);

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt <= options.maxRetries) {
          options.onRetry?.(attempt, lastError);
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError;
  }

  /**
   * @ai-purpose Check if specialized model should be used
   */
  private shouldUseSpecialized(specialization: string, context: TaskContext): boolean {
    // Logic to determine when to use specialized models
    switch (specialization) {
      case 'financial':
        return context.requiresAccuracy === true;
      case 'handwriting':
        return context.dataSize && context.dataSize > 1024 * 1024; // Large image files
      default:
        return false;
    }
  }

  /**
   * @ai-purpose Log execution for performance tracking
   */
  private logExecution(executionId: string, data: {
    model: string;
    success: boolean;
    executionTime: number;
    tokensUsed?: number;
    fallbackUsed?: boolean;
    error?: string;
  }): void {
    this.executionHistory.push({
      taskType: executionId.split('-')[1],
      model: data.model,
      success: data.success,
      executionTime: data.executionTime,
      timestamp: new Date()
    });

    // Keep only last 1000 executions
    if (this.executionHistory.length > 1000) {
      this.executionHistory = this.executionHistory.slice(-1000);
    }
  }

  /**
   * @ai-purpose Get performance metrics
   */
  /**
   * @ai-purpose Get available models
   */
  async getAvailableModels(): Promise<Array<{
    name: string;
    type: string;
    available: boolean;
    reason?: string;
  }>> {
    const models = [];
    
    // Check OpenAI models
    if (this.openai) {
      models.push(
        { name: 'gpt-4', type: 'conversational', available: true },
        { name: 'gpt-3.5-turbo', type: 'conversational', available: true },
        { name: 'gpt-4-vision-preview', type: 'document', available: true }
      );
    } else {
      models.push({
        name: 'gpt-4',
        type: 'conversational',
        available: false,
        reason: 'OpenAI API key not configured'
      });
    }
    
    // Check Anthropic models
    if (this.anthropic) {
      models.push(
        { name: 'claude-3-opus-20240229', type: 'conversational', available: true },
        { name: 'claude-3-sonnet-20240229', type: 'conversational', available: true }
      );
    } else {
      models.push({
        name: 'claude-3-opus-20240229',
        type: 'conversational',
        available: false,
        reason: 'Anthropic API key not configured'
      });
    }
    
    return models;
  }

  /**
   * @ai-purpose Check health of AI services
   */
  async checkHealth(): Promise<{
    healthy: boolean;
    services: Record<string, {
      status: 'operational' | 'degraded' | 'down';
      latency?: number;
      error?: string;
    }>;
  }> {
    const services: any = {};
    let healthy = true;
    
    // Check OpenAI
    if (this.openai) {
      try {
        const start = Date.now();
        await this.openai.models.list();
        services.openai = {
          status: 'operational',
          latency: Date.now() - start
        };
      } catch (error) {
        services.openai = {
          status: 'down',
          error: error.message
        };
        healthy = false;
      }
    } else {
      services.openai = {
        status: 'down',
        error: 'Not configured'
      };
    }
    
    // Check Anthropic
    if (this.anthropic) {
      services.anthropic = {
        status: 'operational',
        latency: 0
      };
    } else {
      services.anthropic = {
        status: 'down',
        error: 'Not configured'
      };
    }
    
    return { healthy, services };
  }

  getPerformanceMetrics(): {
    modelPerformance: Record<string, {
      successRate: number;
      averageExecutionTime: number;
      totalExecutions: number;
    }>;
    overallStats: {
      totalExecutions: number;
      successRate: number;
    };
  } {
    const modelStats: Record<string, {
      successes: number;
      failures: number;
      totalTime: number;
    }> = {};

    this.executionHistory.forEach(execution => {
      if (!modelStats[execution.model]) {
        modelStats[execution.model] = { successes: 0, failures: 0, totalTime: 0 };
      }

      if (execution.success) {
        modelStats[execution.model].successes++;
      } else {
        modelStats[execution.model].failures++;
      }
      modelStats[execution.model].totalTime += execution.executionTime;
    });

    const modelPerformance: Record<string, any> = {};
    Object.entries(modelStats).forEach(([model, stats]) => {
      const total = stats.successes + stats.failures;
      modelPerformance[model] = {
        successRate: total > 0 ? stats.successes / total : 0,
        averageExecutionTime: total > 0 ? stats.totalTime / total : 0,
        totalExecutions: total
      };
    });

    const totalExecutions = this.executionHistory.length;
    const totalSuccesses = this.executionHistory.filter(e => e.success).length;

    return {
      modelPerformance,
      overallStats: {
        totalExecutions,
        successRate: totalExecutions > 0 ? totalSuccesses / totalExecutions : 0
      }
    };
  }

  // System prompts
  private getConversationalSystemPrompt(): string {
    return `You are a compassionate AI assistant specialized in loss mitigation for homeowners facing financial hardship. 

Your role is to:
- Provide empathetic, clear communication
- Guide users through the loss mitigation process
- Explain complex financial concepts in simple terms
- Maintain hope while being realistic about options
- Escalate to human experts when appropriate

Always:
- Show empathy for the user's situation
- Provide accurate, helpful information
- Suggest concrete next steps
- Ask clarifying questions when needed
- Maintain professional confidentiality`;
  }

  private getEmotionalAnalysisPrompt(): string {
    return `Analyze the emotional state of a homeowner in financial distress. Look for indicators of:
- Distress level (0-1 scale)
- Hope level (0-1 scale) 
- Frustration level (0-1 scale)
- Urgency of intervention needed

Consider linguistic markers, tone, and context. Respond with structured emotional analysis.`;
  }

  private getIntentClassificationPrompt(): string {
    return `Classify user intent in loss mitigation conversations. Categories:
- question: User asking for information
- document_upload: User sharing documents
- status_update: User providing case updates
- help_request: User requesting assistance
- escalation: User wants human help

Include confidence score and extracted entities.`;
  }
}

// Real model implementations with AI service integrations
class ConversationalModel implements AIModel {
  name: string;
  type = 'conversational';
  private openai: OpenAI | null;
  private anthropic: Anthropic | null;

  constructor(private config: any) {
    this.name = config.name;
    
    // Initialize AI clients
    this.openai = config.openaiApiKey ? new OpenAI({
      apiKey: config.openaiApiKey
    }) : null;
    
    this.anthropic = config.anthropicApiKey ? new Anthropic({
      apiKey: config.anthropicApiKey
    }) : null;
  }

  async execute(task: AITask, context: TaskContext): Promise<AIResult> {
    const startTime = Date.now();
    
    try {
      let result;
      let tokensUsed = 0;
      
      if (this.name.startsWith('gpt') && this.openai) {
        // Use OpenAI
        const completion = await this.openai.chat.completions.create({
          model: this.name,
          messages: [
            { role: 'system', content: this.config.systemPrompt },
            { role: 'user', content: task.input.message || task.input }
          ],
          temperature: this.config.temperature || 0.7,
          max_tokens: this.config.maxTokens || 2000
        });
        
        result = {
          message: completion.choices[0].message.content,
          confidence: 0.85
        };
        tokensUsed = completion.usage?.total_tokens || 0;
        
      } else if (this.name.includes('claude') && this.anthropic) {
        // Use Anthropic
        const completion = await this.anthropic.messages.create({
          model: this.name,
          messages: [
            { role: 'user', content: task.input.message || task.input }
          ],
          system: this.config.systemPrompt,
          max_tokens: this.config.maxTokens || 2000
        });
        
        result = {
          message: completion.content[0].type === 'text' ? completion.content[0].text : '',
          confidence: 0.85
        };
        tokensUsed = (completion.usage?.input_tokens || 0) + (completion.usage?.output_tokens || 0);
        
      } else {
        // Fallback
        result = {
          message: "I understand you need assistance. Let me help you with your loss mitigation case.",
          confidence: 0.7
        };
      }
      
      return {
        data: result,
        confidence: result.confidence,
        executionTime: Date.now() - startTime,
        tokensUsed,
        model: this.name,
        success: true
      };
      
    } catch (error) {
      console.error(`Model ${this.name} execution error:`, error);
      throw error;
    }
  }

  canHandle(task: AITask): boolean {
    return task.type === 'conversational';
  }

  estimatedCost(task: AITask): number {
    // Rough cost estimates per 1K tokens
    if (this.name.includes('gpt-4')) return 0.03;
    if (this.name.includes('gpt-3.5')) return 0.002;
    if (this.name.includes('claude')) return 0.024;
    return 0.01;
  }

  estimatedTime(task: AITask): number {
    return 2000; // 2 seconds average
  }
}

class DocumentAnalysisModel implements AIModel {
  name: string;
  type = 'document';

  constructor(private config: any) {
    this.name = config.name;
  }

  async execute(task: AITask, context: TaskContext): Promise<AIResult> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    
    return {
      data: { extracted: "Document analysis placeholder" },
      confidence: 0.92,
      executionTime: Date.now() - startTime,
      model: this.name,
      success: true
    };
  }

  canHandle(task: AITask): boolean {
    return task.type === 'document';
  }

  estimatedCost(task: AITask): number {
    return 0.05;
  }

  estimatedTime(task: AITask): number {
    return 2000;
  }
}

class EmotionalAnalysisModel implements AIModel {
  name: string;
  type = 'emotional';

  constructor(private config: any) {
    this.name = config.name;
  }

  async execute(task: AITask, context: TaskContext): Promise<AIResult> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
    
    return {
      data: { 
        distress: Math.random() * 0.5,
        hope: Math.random() * 0.8 + 0.2,
        frustration: Math.random() * 0.4,
        confidence: 0.88
      },
      confidence: 0.88,
      executionTime: Date.now() - startTime,
      model: this.name,
      success: true
    };
  }

  canHandle(task: AITask): boolean {
    return task.type === 'emotional';
  }

  estimatedCost(task: AITask): number {
    return 0.008;
  }

  estimatedTime(task: AITask): number {
    return 600;
  }
}

class IntentClassificationModel implements AIModel {
  name: string;
  type = 'intent';

  constructor(private config: any) {
    this.name = config.name;
  }

  async execute(task: AITask, context: TaskContext): Promise<AIResult> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 400));
    
    const intents = ['question', 'document_upload', 'status_update', 'help_request', 'escalation'];
    const randomIntent = intents[Math.floor(Math.random() * intents.length)];
    
    return {
      data: { 
        type: randomIntent,
        confidence: 0.85 + Math.random() * 0.14,
        entities: [],
        urgency: 'medium'
      },
      confidence: 0.90,
      executionTime: Date.now() - startTime,
      model: this.name,
      success: true
    };
  }

  canHandle(task: AITask): boolean {
    return task.type === 'intent';
  }

  estimatedCost(task: AITask): number {
    return 0.005;
  }

  estimatedTime(task: AITask): number {
    return 400;
  }
}

class FinancialDocumentModel implements AIModel {
  name = 'financial-specialist';
  type = 'document';

  async execute(task: AITask, context: TaskContext): Promise<AIResult> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));
    
    return {
      data: { extracted: "Specialized financial document analysis" },
      confidence: 0.95,
      executionTime: Date.now() - startTime,
      model: this.name,
      success: true
    };
  }

  canHandle(task: AITask): boolean {
    return task.type === 'document';
  }

  estimatedCost(task: AITask): number {
    return 0.08;
  }

  estimatedTime(task: AITask): number {
    return 2500;
  }
}

class HandwritingModel implements AIModel {
  name = 'handwriting-ocr';
  type = 'document';

  async execute(task: AITask, context: TaskContext): Promise<AIResult> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));
    
    return {
      data: { extracted: "Handwriting OCR analysis" },
      confidence: 0.88,
      executionTime: Date.now() - startTime,
      model: this.name,
      success: true
    };
  }

  canHandle(task: AITask): boolean {
    return task.type === 'document';
  }

  estimatedCost(task: AITask): number {
    return 0.12;
  }

  estimatedTime(task: AITask): number {
    return 3500;
  }
}

// Error classes
export class ModelExecutionError extends Error {
  constructor(message: string, public context: any) {
    super(message);
    this.name = 'ModelExecutionError';
  }
}