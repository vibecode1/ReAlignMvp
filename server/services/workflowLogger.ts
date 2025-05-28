
import { storage } from '../storage';

export class WorkflowLogger {
  /**
   * Log user interaction events
   */
  static async logUserInteraction(userId: string, eventData: {
    event_name: string;
    event_description?: string;
    transaction_id?: string;
    session_id?: string;
    metadata?: Record<string, any>;
    execution_time_ms?: number;
    success?: boolean;
  }) {
    try {
      await storage.logWorkflowEvent({
        user_id: userId,
        event_type: 'user_interaction',
        event_severity: 'info',
        event_category: 'user_action',
        event_name: eventData.event_name,
        event_description: eventData.event_description,
        transaction_id: eventData.transaction_id,
        session_id: eventData.session_id,
        event_metadata: eventData.metadata ? JSON.stringify(eventData.metadata) : null,
        execution_time_ms: eventData.execution_time_ms,
        success_indicator: eventData.success ?? true,
      });
    } catch (error) {
      console.error('Failed to log user interaction:', error);
    }
  }

  /**
   * Log UBA form field completion
   */
  static async logUbaFormField(userId: string, eventData: {
    transaction_id: string;
    field_id: string;
    section: string;
    validation_result?: string;
    ai_assistance_used?: boolean;
    completion_time_ms?: number;
  }) {
    try {
      await storage.logWorkflowEvent({
        user_id: userId,
        event_type: 'form_field_filled',
        event_severity: 'info',
        event_category: 'uba_form_completion',
        event_name: `UBA field completed: ${eventData.field_id}`,
        transaction_id: eventData.transaction_id,
        uba_form_section: eventData.section,
        uba_field_id: eventData.field_id,
        uba_validation_result: eventData.validation_result,
        execution_time_ms: eventData.completion_time_ms,
        success_indicator: true,
        event_metadata: JSON.stringify({
          ai_assistance_used: eventData.ai_assistance_used,
        }),
      });
    } catch (error) {
      console.error('Failed to log UBA form field:', error);
    }
  }

  /**
   * Log document upload events
   */
  static async logDocumentUpload(userId: string, eventData: {
    transaction_id: string;
    document_type: string;
    file_name: string;
    file_size: number;
    upload_time_ms?: number;
    success: boolean;
    error_details?: string;
  }) {
    try {
      await storage.logWorkflowEvent({
        user_id: userId,
        event_type: 'document_uploaded',
        event_severity: eventData.success ? 'info' : 'error',
        event_category: 'document_management',
        event_name: `Document uploaded: ${eventData.file_name}`,
        transaction_id: eventData.transaction_id,
        execution_time_ms: eventData.upload_time_ms,
        success_indicator: eventData.success,
        error_details: eventData.error_details,
        event_metadata: JSON.stringify({
          document_type: eventData.document_type,
          file_size: eventData.file_size,
        }),
      });
    } catch (error) {
      console.error('Failed to log document upload:', error);
    }
  }

  /**
   * Log AI recommendation generation
   */
  static async logAiRecommendation(userId: string, eventData: {
    transaction_id?: string;
    context_recipe_id: string;
    model_used: string;
    prompt_tokens: number;
    completion_tokens: number;
    execution_time_ms: number;
    success: boolean;
    error_details?: string;
    confidence_score?: number;
  }) {
    try {
      await storage.logWorkflowEvent({
        user_id: userId,
        event_type: 'ai_recommendation_generated',
        event_severity: eventData.success ? 'info' : 'error',
        event_category: 'ai_assistance',
        event_name: `AI recommendation: ${eventData.context_recipe_id}`,
        transaction_id: eventData.transaction_id,
        context_recipe_id: eventData.context_recipe_id,
        ai_model_used: eventData.model_used,
        ai_prompt_tokens: eventData.prompt_tokens,
        ai_completion_tokens: eventData.completion_tokens,
        execution_time_ms: eventData.execution_time_ms,
        success_indicator: eventData.success,
        error_details: eventData.error_details,
        event_metadata: JSON.stringify({
          confidence_score: eventData.confidence_score,
        }),
      });
    } catch (error) {
      console.error('Failed to log AI recommendation:', error);
    }
  }

  /**
   * Log validation performed
   */
  static async logValidation(userId: string, eventData: {
    transaction_id?: string;
    validation_type: string;
    target_field: string;
    validation_result: 'pass' | 'fail' | 'warning';
    error_details?: string;
    suggestions?: string[];
  }) {
    try {
      await storage.logWorkflowEvent({
        user_id: userId,
        event_type: 'validation_performed',
        event_severity: eventData.validation_result === 'fail' ? 'error' : 
                       eventData.validation_result === 'warning' ? 'warning' : 'info',
        event_category: 'data_validation',
        event_name: `Validation: ${eventData.validation_type}`,
        transaction_id: eventData.transaction_id,
        success_indicator: eventData.validation_result === 'pass',
        error_details: eventData.error_details,
        event_metadata: JSON.stringify({
          target_field: eventData.target_field,
          validation_result: eventData.validation_result,
          suggestions: eventData.suggestions,
        }),
      });
    } catch (error) {
      console.error('Failed to log validation:', error);
    }
  }
}

// Export workflowLogger instance for controller imports
export const workflowLogger = {
  logUserInteraction: WorkflowLogger.logUserInteraction,
  logUbaFormField: WorkflowLogger.logUbaFormField,
  logDocumentUpload: WorkflowLogger.logDocumentUpload,
  logAiRecommendation: WorkflowLogger.logAiRecommendation,
  logValidation: WorkflowLogger.logValidation,
};
