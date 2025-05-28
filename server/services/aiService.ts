
import OpenAI from 'openai';
import { contextRecipeService } from './contextRecipeService';
import { WorkflowLogger } from './workflowLogger';
// Place this code right after your imports in server/services/aiService.ts
// and BEFORE the line: const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---- START OF DEBUGGING ----
console.log('--- aiService.ts ---');
console.log('Attempting to read OPENAI_API_KEY from process.env');
console.log('Value of process.env.OPENAI_API_KEY:', process.env.OPENAI_API_KEY);

if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === "") {
  console.error('ERROR: OPENAI_API_KEY is not found in process.env or is an empty string!');
} else {
  console.log('OPENAI_API_KEY found. Length:', process.env.OPENAI_API_KEY.length);
}
console.log('--- End of OPENAI_API_KEY debug ---');
// ---- END OF DEBUGGING ----

// This is the line that's currently throwing the error
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
      const systemPrompt = this.interpolateTemplate(
        recipe.ai_config.system_prompt_template,
        contextData
      );

      const userPrompt = this.interpolateTemplate(
        recipe.ai_config.user_prompt_template,
        { user_input: request.userInput, ...contextData }
      );

      // Call AI model
      const completion = await openai.chat.completions.create({
        model: recipe.ai_config.preferred_model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: recipe.ai_config.max_tokens,
        temperature: recipe.ai_config.temperature,
      });

      const executionTime = Date.now() - startTime;
      const response: AiResponse = {
        content: completion.choices[0]?.message?.content || '',
        model_used: recipe.ai_config.preferred_model,
        prompt_tokens: completion.usage?.prompt_tokens || 0,
        completion_tokens: completion.usage?.completion_tokens || 0,
        total_tokens: completion.usage?.total_tokens || 0,
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
      
      const suggestions = this.extractSuggestions(aiResponse.content);
      
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
      const value = this.getNestedValue(context, key);
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
