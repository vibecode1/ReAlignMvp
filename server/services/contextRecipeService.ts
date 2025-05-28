
import { z } from 'zod';

// Context Recipe Schema Definition
const ContextRecipeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  type: z.enum(['uba_form_completion', 'bfs_document_review', 'hardship_analysis', 'property_valuation']),
  
  // Context Data Requirements
  required_context: z.object({
    user_profile_fields: z.array(z.string()).optional(),
    transaction_data: z.array(z.string()).optional(),
    uba_form_sections: z.array(z.string()).optional(),
    document_types: z.array(z.string()).optional(),
    workflow_history: z.boolean().optional(),
  }),
  
  // AI Model Configuration
  ai_config: z.object({
    preferred_model: z.enum(['gpt-4', 'gpt-4-turbo', 'claude-sonnet', 'gpt-3.5-turbo']),
    fallback_models: z.array(z.string()).optional(),
    max_tokens: z.number().int().positive(),
    temperature: z.number().min(0).max(2),
    system_prompt_template: z.string(),
    user_prompt_template: z.string(),
  }),
  
  // UBA Guide Integration
  uba_compliance: z.object({
    required_fields: z.array(z.string()).optional(),
    validation_rules: z.array(z.string()).optional(),
    documentation_requirements: z.array(z.string()).optional(),
  }).optional(),
  
  // Customization Options
  customization_options: z.object({
    communication_style: z.array(z.enum(['professional', 'friendly', 'technical'])),
    assistance_level: z.array(z.enum(['minimal', 'balanced', 'comprehensive'])),
    custom_prompts: z.boolean().optional(),
  }).optional(),
});

type ContextRecipe = z.infer<typeof ContextRecipeSchema>;

export class ContextRecipeService {
  private recipes: Map<string, ContextRecipe> = new Map();

  constructor() {
    this.initializeDefaultRecipes();
  }

  /**
   * Initialize default context recipes for Phase 0
   */
  private initializeDefaultRecipes() {
    // UBA Form Completion Recipe
    const ubaFormRecipe: ContextRecipe = {
      id: 'uba_form_completion_v1',
      name: 'UBA Form Completion Assistant',
      description: 'Guides users through UBA form completion with compliance validation',
      version: '1.0.0',
      type: 'uba_form_completion',
      required_context: {
        user_profile_fields: ['uba_completion_patterns', 'frequent_form_sections', 'error_patterns'],
        transaction_data: ['property_address', 'loan_number'],
        uba_form_sections: ['borrower_info', 'financial_info', 'hardship_details', 'assistance_request'],
        workflow_history: true,
      },
      ai_config: {
        preferred_model: 'gpt-4',
        fallback_models: ['claude-sonnet'],
        max_tokens: 2000,
        temperature: 0.3,
        system_prompt_template: `You are a UBA form completion assistant. Help users fill out their Uniform Borrower Assistance (UBA) form accurately and completely. 

Context: {context_data}
User Profile: {user_profile}
Form Progress: {form_progress}

Guidelines:
- Follow UBA Guide compliance requirements
- Provide clear, step-by-step guidance
- Validate input against UBA standards
- Suggest corrections for common errors`,
        user_prompt_template: `Section: {current_section}
Field: {current_field}
User Input: {user_input}

Please help me with this UBA form field. {specific_question}`,
      },
      uba_compliance: {
        required_fields: ['borrower_name', 'property_address', 'hardship_type', 'monthly_gross_income'],
        validation_rules: ['income_documentation_required', 'hardship_date_validation', 'contact_info_verification'],
        documentation_requirements: ['income_verification', 'hardship_letter'],
      },
      customization_options: {
        communication_style: ['professional', 'friendly'],
        assistance_level: ['balanced', 'comprehensive'],
        custom_prompts: true,
      },
    };

    // BFS Document Review Recipe
    const bfsDocumentRecipe: ContextRecipe = {
      id: 'bfs_document_review_v1',
      name: 'BFS Document Review Assistant',
      description: 'Assists with reviewing and validating BFS-related documents',
      version: '1.0.0',
      type: 'bfs_document_review',
      required_context: {
        user_profile_fields: ['ai_assistance_level', 'workflow_step_preferences'],
        transaction_data: ['current_phase', 'property_address'],
        document_types: ['financial_statement', 'income_verification', 'property_documents'],
        workflow_history: true,
      },
      ai_config: {
        preferred_model: 'claude-sonnet',
        fallback_models: ['gpt-4-turbo'],
        max_tokens: 3000,
        temperature: 0.2,
        system_prompt_template: `You are a BFS document review specialist. Help users review and validate Bank of First Steps (BFS) related documents for accuracy and completeness.

Context: {context_data}
Document Type: {document_type}
Review Criteria: {review_criteria}

Guidelines:
- Check for required information completeness
- Validate document formats and standards
- Identify potential issues or discrepancies
- Suggest improvements or corrections`,
        user_prompt_template: `Document: {document_name}
Type: {document_type}
Content: {document_content}

Please review this document and provide feedback.`,
      },
      customization_options: {
        communication_style: ['professional', 'technical'],
        assistance_level: ['minimal', 'balanced', 'comprehensive'],
      },
    };

    this.recipes.set(ubaFormRecipe.id, ubaFormRecipe);
    this.recipes.set(bfsDocumentRecipe.id, bfsDocumentRecipe);
  }

  /**
   * Get a context recipe by ID
   */
  getRecipe(recipeId: string): ContextRecipe | null {
    return this.recipes.get(recipeId) || null;
  }

  /**
   * Get all available recipes
   */
  getAllRecipes(): ContextRecipe[] {
    return Array.from(this.recipes.values());
  }

  /**
   * Get recipes by type
   */
  getRecipesByType(type: ContextRecipe['type']): ContextRecipe[] {
    return Array.from(this.recipes.values()).filter(recipe => recipe.type === type);
  }

  /**
   * Register a new custom recipe
   */
  registerRecipe(recipe: ContextRecipe): boolean {
    try {
      const validatedRecipe = ContextRecipeSchema.parse(recipe);
      this.recipes.set(validatedRecipe.id, validatedRecipe);
      return true;
    } catch (error) {
      console.error('Invalid context recipe:', error);
      return false;
    }
  }

  /**
   * Build context data for a recipe
   */
  async buildContextData(
    recipeId: string,
    userId: string,
    transactionId?: string,
    additionalContext?: Record<string, any>
  ): Promise<Record<string, any> | null> {
    const recipe = this.getRecipe(recipeId);
    if (!recipe) {
      return null;
    }

    const contextData: Record<string, any> = {
      recipe_info: {
        id: recipe.id,
        name: recipe.name,
        type: recipe.type,
      },
      user_id: userId,
      transaction_id: transactionId,
      timestamp: new Date().toISOString(),
      ...additionalContext,
    };

    // Add required context based on recipe requirements
    if (recipe.required_context.user_profile_fields) {
      // This would fetch user profile data
      contextData.user_profile = {
        // Placeholder - would be populated from user context profile
        fields: recipe.required_context.user_profile_fields,
      };
    }

    if (recipe.required_context.transaction_data && transactionId) {
      // This would fetch transaction data
      contextData.transaction_data = {
        // Placeholder - would be populated from transaction data
        fields: recipe.required_context.transaction_data,
      };
    }

    return contextData;
  }

  /**
   * Validate recipe configuration
   */
  validateRecipe(recipe: any): { valid: boolean; errors?: string[] } {
    try {
      ContextRecipeSchema.parse(recipe);
      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
        };
      }
      return { valid: false, errors: ['Unknown validation error'] };
    }
  }
}

export const contextRecipeService = new ContextRecipeService();
