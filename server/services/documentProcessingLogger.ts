import { storage } from '../storage';

export interface DocumentProcessingEvent {
  fileName: string;
  fileType: string;
  extractionMethod: string;
  success: boolean;
  fieldCount?: number;
  error?: any;
  metadata?: any;
  userId: string;
  transactionId?: string;
}

export interface MappingEvent {
  totalFields: number;
  mappedCount: number;
  unmappedCount: number;
  mappingStrategy: string;
  confidence?: number;
}

export interface ExportEvent {
  formType: string;
  formId: string;
  documentCount: number;
  fieldCount: number;
  success: boolean;
  error?: any;
}

export class DocumentProcessingLogger {
  static async logExtraction(event: DocumentProcessingEvent) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      category: 'document_extraction',
      ...event
    };

    if (event.success) {
      console.log('[DOC_EXTRACTION_SUCCESS]', JSON.stringify({
        fileName: event.fileName,
        method: event.extractionMethod,
        fieldCount: event.fieldCount,
        fileType: event.fileType
      }));
    } else {
      console.error('[DOC_EXTRACTION_FAILURE]', JSON.stringify({
        fileName: event.fileName,
        method: event.extractionMethod,
        error: event.error?.message || 'Unknown error',
        fileType: event.fileType
      }));
    }

    // Log to workflow events
    try {
      await storage.logWorkflowEvent({
        user_id: event.userId,
        event_type: 'document_processed',
        event_category: 'uba_form',
        event_name: event.success ? 'extraction_success' : 'extraction_failure',
        event_description: `Document extraction ${event.success ? 'succeeded' : 'failed'} for ${event.fileName}`,
        success_indicator: event.success,
        error_details: event.error ? JSON.stringify(event.error) : undefined,
        event_metadata: JSON.stringify({
          extraction_method: event.extractionMethod,
          file_type: event.fileType,
          field_count: event.fieldCount,
          transaction_id: event.transactionId,
          ...event.metadata
        })
      });
    } catch (logError) {
      console.warn('Failed to log workflow event (non-blocking):', logError);
    }
  }

  static async logMapping(event: MappingEvent & { userId: string; fileName?: string }) {
    console.log('[FIELD_MAPPING]', JSON.stringify({
      strategy: event.mappingStrategy,
      totalFields: event.totalFields,
      mappedFields: event.mappedCount,
      unmappedFields: event.unmappedCount,
      mappingRatio: `${Math.round((event.mappedCount / event.totalFields) * 100)}%`
    }));

    try {
      await storage.logWorkflowEvent({
        user_id: event.userId,
        event_type: 'field_mapping_completed',
        event_category: 'uba_form',
        event_name: 'field_mapping_applied',
        event_description: `Mapped ${event.mappedCount} of ${event.totalFields} fields using ${event.mappingStrategy}`,
        success_indicator: event.mappedCount > 0,
        event_metadata: JSON.stringify({
          mapping_strategy: event.mappingStrategy,
          total_fields: event.totalFields,
          mapped_count: event.mappedCount,
          unmapped_count: event.unmappedCount,
          mapping_confidence: event.confidence,
          file_name: event.fileName
        })
      });
    } catch (logError) {
      console.warn('Failed to log mapping event (non-blocking):', logError);
    }
  }

  static async logExport(event: ExportEvent & { userId: string }) {
    if (event.success) {
      console.log('[FORM_EXPORT_SUCCESS]', JSON.stringify({
        formType: event.formType,
        documentCount: event.documentCount,
        fieldCount: event.fieldCount
      }));
    } else {
      console.error('[FORM_EXPORT_FAILURE]', JSON.stringify({
        formType: event.formType,
        error: event.error?.message || 'Unknown error'
      }));
    }

    try {
      await storage.logWorkflowEvent({
        user_id: event.userId,
        event_type: 'form_exported',
        event_category: 'uba_form',
        event_name: `exported_to_${event.formType}`,
        event_description: `${event.success ? 'Successfully exported' : 'Failed to export'} UBA form to ${event.formType}`,
        success_indicator: event.success,
        error_details: event.error ? JSON.stringify(event.error) : undefined,
        event_metadata: JSON.stringify({
          form_type: event.formType,
          form_id: event.formId,
          document_count: event.documentCount,
          field_count: event.fieldCount
        })
      });
    } catch (logError) {
      console.warn('Failed to log export event (non-blocking):', logError);
    }
  }

  static async logAggregation(data: {
    transactionId: string;
    documentCount: number;
    fieldCount: number;
    userId: string;
    success: boolean;
    error?: any;
  }) {
    console.log('[DATA_AGGREGATION]', JSON.stringify({
      transactionId: data.transactionId,
      documentCount: data.documentCount,
      fieldCount: data.fieldCount,
      success: data.success
    }));

    try {
      await storage.logWorkflowEvent({
        user_id: data.userId,
        event_type: 'data_aggregation',
        event_category: 'uba_form',
        event_name: data.success ? 'aggregation_success' : 'aggregation_failure',
        event_description: `${data.success ? 'Successfully aggregated' : 'Failed to aggregate'} data from ${data.documentCount} documents`,
        success_indicator: data.success,
        error_details: data.error ? JSON.stringify(data.error) : undefined,
        event_metadata: JSON.stringify({
          transaction_id: data.transactionId,
          document_count: data.documentCount,
          field_count: data.fieldCount
        })
      });
    } catch (logError) {
      console.warn('Failed to log aggregation event (non-blocking):', logError);
    }
  }
}