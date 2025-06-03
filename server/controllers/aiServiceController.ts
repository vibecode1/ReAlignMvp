/**
 * @ai-context General AI Service Controller for ReAlign 3.0
 * @ai-critical Handles AI service management and orchestration
 * @ai-modifiable true
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { ModelOrchestrator } from '../services/ai/ModelOrchestrator';
import { IntentClassifier } from '../services/ai/IntentClassifier';
import { EmotionalAnalyzer } from '../services/ai/EmotionalAnalyzer';
import { ContextualResponseGenerator } from '../services/ai/ContextualResponseGenerator';
import { eq, and, desc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '../../shared/schema';

// Initialize PostgreSQL client pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialize Drizzle ORM
const db = drizzle(pool, { schema });

// Request validation schemas
const analyzeTextSchema = z.object({
  text: z.string().min(1),
  caseId: z.string().uuid().optional(),
  analysisType: z.enum(['intent', 'emotion', 'both']).default('both')
});

const generateResponseSchema = z.object({
  prompt: z.string().min(1),
  context: z.record(z.any()).optional(),
  responseType: z.enum(['informative', 'supportive', 'action-oriented']).default('informative'),
  maxTokens: z.number().min(1).max(4000).optional()
});

const aiInteractionQuerySchema = z.object({
  caseId: z.string().uuid().optional(),
  type: z.enum(['conversation', 'document_analysis', 'decision', 'recommendation', 'follow_up_call', 'form_fill', 'pattern_recognition']).optional(),
  limit: z.number().min(1).max(100).default(50),
  since: z.string().datetime().optional()
});

/**
 * @ai-purpose General AI service management controller
 */
export const aiServiceController = {
  /**
   * @api {post} /api/v1/ai/analyze Analyze text
   * @apiDescription Analyzes text for intent and emotion
   */
  async analyzeText(req: Request, res: Response) {
    const traceId = `AI-ANALYZE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${traceId}] Analyzing text`);

    try {
      const validatedData = analyzeTextSchema.parse(req.body);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const results: any = {};

      // Perform intent classification
      if (validatedData.analysisType === 'intent' || validatedData.analysisType === 'both') {
        const intentClassifier = new IntentClassifier();
        const intent = await intentClassifier.classifyIntent(validatedData.text);
        results.intent = intent;
      }

      // Perform emotional analysis
      if (validatedData.analysisType === 'emotion' || validatedData.analysisType === 'both') {
        const emotionalAnalyzer = new EmotionalAnalyzer();
        const emotion = await emotionalAnalyzer.analyzeEmotion(validatedData.text);
        results.emotion = emotion;
      }

      // Record interaction if caseId provided
      if (validatedData.caseId) {
        await db.insert(schema.ai_interactions).values({
          case_id: validatedData.caseId,
          user_id: userId,
          interaction_type: 'conversation',
          session_id: crypto.randomUUID(),
          model_used: 'gpt-4',
          user_input: validatedData.text,
          ai_output: JSON.stringify(results),
          confidence_score: String(results.intent?.confidence || results.emotion?.confidence || 0)
        });
      }

      console.log(`[${traceId}] Text analysis completed`);

      return res.json(results);

    } catch (error) {
      console.error(`[${traceId}] Text analysis error:`, error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid request data',
          details: error.errors 
        });
      }

      return res.status(500).json({ 
        error: 'Failed to analyze text',
        details: error.message 
      });
    }
  },

  /**
   * @api {post} /api/v1/ai/generate Generate AI response
   * @apiDescription Generates contextual AI response
   */
  async generateResponse(req: Request, res: Response) {
    const traceId = `AI-GENERATE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${traceId}] Generating AI response`);

    try {
      const validatedData = generateResponseSchema.parse(req.body);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Initialize response generator
      const responseGenerator = new ContextualResponseGenerator();

      // Generate response
      const response = await responseGenerator.generateResponse({
        prompt: validatedData.prompt,
        context: validatedData.context || {},
        responseType: validatedData.responseType,
        maxTokens: validatedData.maxTokens
      });

      console.log(`[${traceId}] AI response generated successfully`);

      return res.json({
        response: response.text,
        confidence: response.confidence,
        modelUsed: response.modelUsed,
        tokensUsed: response.tokensUsed
      });

    } catch (error) {
      console.error(`[${traceId}] Response generation error:`, error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid request data',
          details: error.errors 
        });
      }

      return res.status(500).json({ 
        error: 'Failed to generate response',
        details: error.message 
      });
    }
  },

  /**
   * @api {get} /api/v1/ai/interactions Get AI interactions
   * @apiDescription Retrieves AI interaction history
   */
  async getAIInteractions(req: Request, res: Response) {
    const traceId = `AI-INTERACTIONS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${traceId}] Getting AI interactions`);

    try {
      const query = aiInteractionQuerySchema.parse(req.query);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Build query
      let whereConditions = [eq(schema.ai_interactions.user_id, userId)];

      if (query.caseId) {
        whereConditions.push(eq(schema.ai_interactions.case_id, query.caseId));
      }

      if (query.type) {
        whereConditions.push(eq(schema.ai_interactions.interaction_type, query.type));
      }

      const dbQuery = db
        .select()
        .from(schema.ai_interactions)
        .where(and(...whereConditions))
        .orderBy(desc(schema.ai_interactions.timestamp))
        .limit(query.limit);

      const interactions = await dbQuery;

      // Format interactions
      const formattedInteractions = interactions.map(interaction => ({
        id: interaction.id,
        caseId: interaction.case_id,
        type: interaction.interaction_type,
        timestamp: interaction.timestamp,
        modelUsed: interaction.model_used,
        input: interaction.user_input,
        output: interaction.ai_output,
        confidence: interaction.confidence_score ? parseFloat(interaction.confidence_score) : null,
        tokensUsed: interaction.tokens_used,
        processingTimeMs: interaction.processing_time_ms,
        feedback: interaction.user_feedback
      }));

      console.log(`[${traceId}] Retrieved ${formattedInteractions.length} AI interactions`);

      return res.json({
        interactions: formattedInteractions,
        total: formattedInteractions.length
      });

    } catch (error) {
      console.error(`[${traceId}] Failed to get AI interactions:`, error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid query parameters',
          details: error.errors 
        });
      }

      return res.status(500).json({ 
        error: 'Failed to retrieve AI interactions',
        details: error.message 
      });
    }
  },

  /**
   * @api {post} /api/v1/ai/interactions/:interactionId/feedback Submit feedback
   * @apiDescription Submits user feedback for an AI interaction
   */
  async submitFeedback(req: Request, res: Response) {
    const traceId = `AI-FEEDBACK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${traceId}] Submitting feedback for interaction ${req.params.interactionId}`);

    try {
      const interactionId = req.params.interactionId;
      const { feedback, feedbackText } = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validate feedback
      if (!['helpful', 'not_helpful', 'escalated'].includes(feedback)) {
        return res.status(400).json({ error: 'Invalid feedback value' });
      }

      // Update interaction with feedback
      await db
        .update(schema.ai_interactions)
        .set({
          user_feedback: feedback,
          feedback_text: feedbackText
        })
        .where(schema.and(
          schema.eq(schema.ai_interactions.id, interactionId),
          schema.eq(schema.ai_interactions.user_id, userId)
        ));

      console.log(`[${traceId}] Feedback submitted successfully`);

      return res.json({
        success: true,
        feedback: feedback
      });

    } catch (error) {
      console.error(`[${traceId}] Failed to submit feedback:`, error);
      return res.status(500).json({ 
        error: 'Failed to submit feedback',
        details: error.message 
      });
    }
  },

  /**
   * @api {get} /api/v1/ai/models Get available models
   * @apiDescription Returns list of available AI models
   */
  async getAvailableModels(req: Request, res: Response) {
    const traceId = `AI-MODELS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${traceId}] Getting available AI models`);

    try {
      const orchestrator = new ModelOrchestrator();
      const models = await orchestrator.getAvailableModels();

      console.log(`[${traceId}] Retrieved ${models.length} available models`);

      return res.json({
        models: models,
        defaultModel: 'gpt-4'
      });

    } catch (error) {
      console.error(`[${traceId}] Failed to get available models:`, error);
      return res.status(500).json({ 
        error: 'Failed to retrieve available models',
        details: error.message 
      });
    }
  },

  /**
   * @api {get} /api/v1/ai/health Health check
   * @apiDescription Checks AI service health
   */
  async healthCheck(req: Request, res: Response) {
    const traceId = `AI-HEALTH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${traceId}] AI service health check`);

    try {
      const orchestrator = new ModelOrchestrator();
      const health = await orchestrator.checkHealth();

      console.log(`[${traceId}] Health check completed`);

      return res.json({
        status: health.healthy ? 'healthy' : 'degraded',
        services: health.services,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error(`[${traceId}] Health check failed:`, error);
      return res.status(503).json({ 
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
};