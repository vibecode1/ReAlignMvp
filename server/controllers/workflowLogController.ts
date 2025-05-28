
import { Request, Response } from 'express';
import { storage } from '../storage';
import { AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';

// Schema for workflow event logging
const LogWorkflowEventSchema = z.object({
  event_type: z.enum(['form_field_filled', 'document_uploaded', 'ai_recommendation_generated', 'validation_performed', 'user_interaction']),
  event_severity: z.enum(['info', 'warning', 'error', 'critical']).default('info'),
  event_category: z.string().min(1, 'Event category is required'),
  transaction_id: z.string().uuid().optional(),
  session_id: z.string().optional(),
  event_name: z.string().min(1, 'Event name is required'),
  event_description: z.string().optional(),
  event_metadata: z.string().optional(),
  context_recipe_id: z.string().optional(),
  ai_model_used: z.string().optional(),
  ai_prompt_tokens: z.number().int().positive().optional(),
  ai_completion_tokens: z.number().int().positive().optional(),
  execution_time_ms: z.number().int().positive().optional(),
  error_details: z.string().optional(),
  success_indicator: z.boolean().default(true),
  uba_form_section: z.string().optional(),
  uba_field_id: z.string().optional(),
  uba_validation_result: z.string().optional(),
});

const GetEventsQuerySchema = z.object({
  transaction_id: z.string().uuid().optional(),
  event_type: z.enum(['form_field_filled', 'document_uploaded', 'ai_recommendation_generated', 'validation_performed', 'user_interaction']).optional(),
  event_category: z.string().optional(),
  session_id: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  limit: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0 && val <= 100).default('50'),
  offset: z.string().transform(val => parseInt(val, 10)).refine(val => val >= 0).default('0'),
});

export const workflowLogController = {
  /**
   * Log a workflow event
   */
  async logEvent(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      const validation = LogWorkflowEventSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid event data',
            details: validation.error.errors,
          }
        });
      }

      const eventData = {
        user_id: req.user.id,
        ...validation.data,
      };

      const loggedEvent = await storage.logWorkflowEvent(eventData);

      return res.status(201).json({
        id: loggedEvent.id,
        message: 'Event logged successfully',
        timestamp: loggedEvent.timestamp,
      });
    } catch (error) {
      console.error('Log workflow event error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to log workflow event',
        }
      });
    }
  },

  /**
   * Get workflow events with filtering
   */
  async getEvents(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      const validation = GetEventsQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: validation.error.errors,
          }
        });
      }

      const filters = {
        user_id: req.user.id,
        ...validation.data,
      };

      const events = await storage.getWorkflowEvents(filters);

      return res.status(200).json(events);
    } catch (error) {
      console.error('Get workflow events error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve workflow events',
        }
      });
    }
  },

  /**
   * Get workflow analytics/summary
   */
  async getEventsSummary(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      const { transaction_id, start_date, end_date } = req.query;

      const summary = await storage.getWorkflowEventsSummary({
        user_id: req.user.id,
        transaction_id: transaction_id as string,
        start_date: start_date as string,
        end_date: end_date as string,
      });

      return res.status(200).json(summary);
    } catch (error) {
      console.error('Get workflow events summary error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve workflow events summary',
        }
      });
    }
  },
};
