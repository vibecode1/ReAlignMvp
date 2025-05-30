import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { contextRecipeService } from './contextRecipeService';
import { WorkflowLogger } from './workflowLogger';
import { AI_SERVICE_CONFIG } from './aiServiceConfig';

// ---- START OF DEBUGGING ----
console.log('--- aiService.ts ---');
console.log('Attempting to read API keys from process.env');
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('ANTHROPIC_API_KEY exists:', !!process.env.ANTHROPIC_API_KEY);

if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === "") {
  console.log('OpenAI API key not found, will check for Claude fallback');
} else {
  console.log('OPENAI_API_KEY found. Length:', process.env.OPENAI_API_KEY.length);
}

if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.trim() === "") {
  console.log('Anthropic API key not found');
} else {
  console.log('ANTHROPIC_API_KEY found. Length:', process.env.ANTHROPIC_API_KEY.length);
}
console.log('--- End of API key debug ---');
// ---- END OF DEBUGGING ----

// Initialize AI clients with graceful handling
let openai: OpenAI | null = null;
let anthropic: Anthropic | null = null;

if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log('OpenAI client initialized successfully');
} else {
  console.warn('OpenAI API key not found.');
}

if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim() !== '') {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  console.log('Anthropic client initialized successfully');
} else {
  console.warn('Anthropic API key not found.');
}

if (!openai && !anthropic) {
  console.error('WARNING: No AI API keys configured. AI features will be disabled.');
}

export interface AiRequest {
  userId: string;
  transactionId?: string;
  contextRecipeId: string;
  userInput: string;
  additionalContext?: Record<string, any>;
}

export interface AiResponse {
  content: string;
  model_used: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  execution_time_ms: number;
  confidence_score?: number;
  suggestions?: string[];
}

export class AiService {
  /**
   * Generate AI recommendation using context recipe
   */
  static async generateRecommendation(request: AiRequest): Promise<AiResponse> {
    const startTime = Date.now();

    try {
      // Get context recipe configuration
      const recipe = contextRecipeService.getRecipe(request.contextRecipeId);
      if (!recipe) {
        throw new Error(`Context recipe not found: ${request.contextRecipeId}`);
      }

      // Build context data
      const contextData = await contextRecipeService.buildContextData(
        request.contextRecipeId,
        request.userId,
        request.transactionId,
        request.additionalContext
      );

      // Prepare prompt with context
      // Use custom system prompt if provided in additionalContext, otherwise use recipe template
      const systemPrompt = request.additionalContext?.systemPrompt || 
        AiService.interpolateTemplate(
          recipe.ai_config.system_prompt_template,
          contextData
        );

      const userPrompt = request.additionalContext?.userPrompt || 
        AiService.interpolateTemplate(
          recipe.ai_config.user_prompt_template,
          { user_input: request.userInput, ...contextData }
        );

      // Override model if specified in additional context
      const preferredModel = request.additionalContext?.preferredModel || recipe.ai_config.preferred_model;
      const maxTokens = request.additionalContext?.maxTokens || recipe.ai_config.max_tokens;
      const temperature = request.additionalContext?.temperature !== undefined ? request.additionalContext.temperature : recipe.ai_config.temperature;

      // Try OpenAI first, fallback to Claude if needed
      let aiResponse: any;
      let modelUsed: string;

      if (openai && !request.additionalContext?.isImage) {
        try {
          console.log('Calling OpenAI with model:', preferredModel);
          const completion = await openai.chat.completions.create({
            model: preferredModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            max_tokens: maxTokens,
            temperature: temperature,
          });

          aiResponse = completion;
          modelUsed = preferredModel;

        } catch (openaiError) {
          console.error('OpenAI API error, attempting Claude fallback:', openaiError);
          if (!anthropic) {
            throw openaiError;
          }
          // Continue to Claude fallback
          aiResponse = null;
        }
      }

      // Use Claude as fallback if OpenAI failed or is not available, or for image processing
      if (!aiResponse && anthropic) {
        try {
          console.log('Using Claude');
          // Use specified model or map from config
          let claudeModel = preferredModel;
          if (preferredModel.startsWith('gpt-')) {
            claudeModel = preferredModel.includes('gpt-4') 
              ? AI_SERVICE_CONFIG.providers.anthropic.models.powerful
              : AI_SERVICE_CONFIG.providers.anthropic.models.balanced;
          }

          console.log('Claude model:', claudeModel);

          // Handle image documents
          if (request.additionalContext?.isImage && request.additionalContext?.imageData) {
            console.log('Processing image with Claude vision');
            const imageData = request.additionalContext.imageData;
            let base64Data = imageData;

            // Extract base64 if it's a data URL
            if (imageData.startsWith('data:')) {
              const parts = imageData.split(',');
              if (parts.length > 1) {
                base64Data = parts[1];
              }
            }

            const claudeResponse = await anthropic.messages.create({
              model: claudeModel,
              max_tokens: maxTokens,
              temperature: temperature,
              messages: [
                { 
                  role: 'user', 
                  content: [
                    {
                      type: 'text',
                      text: systemPrompt
                    },
                    {
                      type: 'image',
                      source: {
                        type: 'base64',
                        media_type: request.additionalContext.fileType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                        data: base64Data
                      }
                    }
                  ]
                }
              ],
            });

            // Transform response to match expected format
            const textContent = claudeResponse.content.find(block => block.type === 'text') as any;
            aiResponse = {
              choices: [{
                message: { content: textContent?.text || '' }
              }],
              usage: {
                prompt_tokens: claudeResponse.usage?.input_tokens || 0,
                completion_tokens: claudeResponse.usage?.output_tokens || 0,
                total_tokens: (claudeResponse.usage?.input_tokens || 0) + (claudeResponse.usage?.output_tokens || 0)
              }
            };
            modelUsed = claudeModel;
          } else {
            // Regular text processing
            const claudeResponse = await anthropic.messages.create({
              model: claudeModel,
              max_tokens: maxTokens,
              temperature: temperature,
              messages: [
                { 
                  role: 'user', 
                  content: `${systemPrompt}\n\n${userPrompt}`
                }
              ],
            });

          // Transform Claude response to match OpenAI format
          const textContent = claudeResponse.content.find(block => block.type === 'text') as any;
          aiResponse = {
            choices: [{
              message: { content: textContent?.text || '' }
            }],
            usage: {
              prompt_tokens: claudeResponse.usage?.input_tokens || 0,
              completion_tokens: claudeResponse.usage?.output_tokens || 0,
              total_tokens: (claudeResponse.usage?.input_tokens || 0) + (claudeResponse.usage?.output_tokens || 0)
            }
          };
          modelUsed = claudeModel;
        }
        } catch (claudeError) {
          console.error('Claude API error:', claudeError);
          throw new Error('Both OpenAI and Claude APIs failed. Please check API configurations.');
        }
      }

      if (!aiResponse) {
        throw new Error('No AI service available. Please configure either OpenAI or Anthropic API key.');
      }

      const executionTime = Date.now() - startTime;
      const response: AiResponse = {
        content: aiResponse.choices[0]?.message?.content || '',
        model_used: modelUsed!,
        prompt_tokens: aiResponse.usage?.prompt_tokens || 0,
        completion_tokens: aiResponse.usage?.completion_tokens || 0,
        total_tokens: aiResponse.usage?.total_tokens || 0,
        execution_time_ms: executionTime,
      };

      // Log successful AI interaction
      await WorkflowLogger.logAiRecommendation(request.userId, {
        transaction_id: request.transactionId,
        context_recipe_id: request.contextRecipeId,
        model_used: response.model_used,
        prompt_tokens: response.prompt_tokens,
        completion_tokens: response.completion_tokens,
        execution_time_ms: response.execution_time_ms,
        success: true,
      });

      return response;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('AI Service Error:', error);

      // Log failed AI interaction
      await WorkflowLogger.logAiRecommendation(request.userId, {
        transaction_id: request.transactionId,
        context_recipe_id: request.contextRecipeId,
        model_used: 'unknown',
        prompt_tokens: 0,
        completion_tokens: 0,
        execution_time_ms: executionTime,
        success: false,
        error_details: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Validate UBA form field with AI assistance
   */
  static async validateUbaField(request: {
    userId: string;
    transactionId: string;
    fieldId: string;
    fieldValue: any;
    section: string;
  }): Promise<{
    isValid: boolean;
    suggestions: string[];
    confidence: number;
  }> {
    try {
      const aiResponse = await this.generateRecommendation({
        userId: request.userId,
        transactionId: request.transactionId,
        contextRecipeId: 'uba_form_completion_v1',
        userInput: `Validate field ${request.fieldId} with value: ${request.fieldValue}`,
        additionalContext: {
          current_section: request.section,
          current_field: request.fieldId,
          specific_question: 'Please validate this field and provide suggestions if needed.',
        },
      });

      // Parse AI response for validation result
      const isValid = !aiResponse.content.toLowerCase().includes('error') && 
                     !aiResponse.content.toLowerCase().includes('invalid');

      const suggestions = AiService.extractSuggestions(aiResponse.content);

      // Log validation event
      await WorkflowLogger.logValidation(request.userId, {
        transaction_id: request.transactionId,
        validation_type: 'uba_field_ai_validation',
        target_field: request.fieldId,
        validation_result: isValid ? 'pass' : 'warning',
        suggestions,
      });

      return {
        isValid,
        suggestions,
        confidence: aiResponse.confidence_score || 0.8,
      };

    } catch (error) {
      console.error('AI validation error:', error);
      return {
        isValid: true, // Default to valid if AI fails
        suggestions: ['AI validation temporarily unavailable'],
        confidence: 0,
      };
    }
  }

  /**
   * Interpolate template with context data
   */
  private static interpolateTemplate(template: string, context: any): string {
    return template.replace(/\{([^}]+)\}/g, (match, key) => {
      const value = AiService.getNestedValue(context, key);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Get nested value from object using dot notation
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Extract suggestions from AI response
   */
  private static extractSuggestions(content: string): string[] {
    // Simple regex to extract bullet points or numbered lists
    const suggestionMatches = content.match(/[-•*]\s+(.+?)(?=\n|$)/g) || 
                             content.match(/\d+\.\s+(.+?)(?=\n|$)/g) || [];

    return suggestionMatches.map(match => 
      match.replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, '').trim()
    ).slice(0, 5); // Limit to 5 suggestions
  }
}

// Export aiService instance for controller imports
export const aiService = {
  generateRecommendation: AiService.generateRecommendation,
  validateUbaField: AiService.validateUbaField,
};

// Also export as default for compatibility
export default aiService;