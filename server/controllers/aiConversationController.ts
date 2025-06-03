/**
 * @ai-context AI Conversation Controller for ReAlign 3.0
 * @ai-critical Handles all conversational AI endpoints
 * @ai-modifiable true
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { ConversationalAIEngine } from '../services/ai/ConversationalAIEngine';
import { caseMemoryService } from '../services/CaseMemoryService';
import { eq, and, desc, sql } from 'drizzle-orm';
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
const conversationRequestSchema = z.object({
  caseId: z.string().uuid(),
  message: z.string().min(1),
  context: z.object({
    previousMessages: z.array(z.any()).optional(),
    timestamp: z.string().optional()
  }).optional()
});

const conversationHistorySchema = z.object({
  limit: z.number().min(1).max(100).optional().default(50),
  since: z.string().datetime().optional()
});

/**
 * @ai-purpose Main conversation controller for AI interactions
 */
export const aiConversationController = {
  /**
   * @api {post} /api/v1/ai/conversation Start or continue an AI conversation
   * @apiDescription Processes user messages through the conversational AI engine
   */
  async handleConversation(req: Request, res: Response) {
    const traceId = `CONV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${traceId}] Handling AI conversation request`);

    try {
      // Validate request
      const validatedData = conversationRequestSchema.parse(req.body);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Initialize AI engine
      const aiEngine = new ConversationalAIEngine();

      // Get case memory context
      const caseMemory = await caseMemoryService.getMemory(validatedData.caseId);
      if (!caseMemory) {
        await caseMemoryService.initializeCaseMemory(validatedData.caseId);
      }

      // Get conversation context
      const conversationContext = await caseMemoryService.getConversationContext(validatedData.caseId);

      // Process the message through AI
      const response = await aiEngine.processMessage({
        message: validatedData.message,
        caseId: validatedData.caseId,
        userId,
        context: {
          ...conversationContext,
          previousMessages: validatedData.context?.previousMessages || []
        }
      });

      // Update case memory with conversation
      await caseMemoryService.updateMemory(validatedData.caseId, {
        type: 'conversation',
        data: {
          summary: response.summary || validatedData.message.substring(0, 100),
          topics: response.topics || [],
          emotionalState: response.emotionalState,
          unresolvedQuestions: response.unresolvedQuestions || []
        },
        source: 'web_chat',
        confidence: response.confidence
      });

      // Create conversation record
      const [conversation] = await db
        .insert(schema.ai_conversations)
        .values({
          case_id: validatedData.caseId,
          status: 'active',
          channel: 'web_chat',
          participant_type: 'homeowner',
          emotional_state: JSON.stringify(response.emotionalState || {}),
          comprehension_level: String(response.comprehensionLevel || 0.5),
          urgency_score: String(response.urgencyScore || 0),
          topics_covered: response.topics || [],
          action_items: JSON.stringify(response.actionItems || [])
        })
        .returning();

      // Create message records
      await db.insert(schema.ai_messages).values([
        {
          conversation_id: conversation.id,
          sender_type: 'user',
          sender_id: userId,
          content: validatedData.message,
          timestamp: new Date()
        },
        {
          conversation_id: conversation.id,
          sender_type: 'ai',
          content: response.response,
          intent_classification: JSON.stringify(response.intent || {}),
          emotional_indicators: JSON.stringify(response.emotionalState || {}),
          requires_follow_up: response.requiresFollowUp || false,
          model_used: response.modelUsed,
          confidence_score: String(response.confidence || 0)
        }
      ]);

      // Create AI interaction record
      await db.insert(schema.ai_interactions).values({
        case_id: validatedData.caseId,
        user_id: userId,
        interaction_type: 'conversation',
        session_id: conversation.id,
        model_used: response.modelUsed || 'gpt-4',
        user_input: validatedData.message,
        ai_output: response.response,
        confidence_score: String(response.confidence || 0),
        decision_reasoning: JSON.stringify(response.reasoning || {})
      });

      console.log(`[${traceId}] AI conversation processed successfully`);

      return res.json({
        conversationId: conversation.id,
        response: response.response,
        confidence: response.confidence,
        emotionalState: response.emotionalState,
        shouldEscalate: response.shouldEscalate,
        topics: response.topics,
        actionItems: response.actionItems
      });

    } catch (error) {
      console.error(`[${traceId}] AI conversation error:`, error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid request data',
          details: error.errors 
        });
      }

      return res.status(500).json({ 
        error: 'Failed to process conversation',
        details: error.message 
      });
    }
  },

  /**
   * @api {get} /api/v1/conversations/:caseId/history Get conversation history
   * @apiDescription Retrieves conversation history for a case
   */
  async getConversationHistory(req: Request, res: Response) {
    const traceId = `HIST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${traceId}] Getting conversation history for case ${req.params.caseId}`);

    try {
      const caseId = req.params.caseId;
      const { limit, since } = conversationHistorySchema.parse(req.query);
      
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get conversations
      let query = db
        .select()
        .from(schema.ai_conversations)
        .where(eq(schema.ai_conversations.case_id, caseId))
        .orderBy(schema.ai_conversations.started_at)
        .limit(limit);

      const conversations = await query;

      // Get messages for each conversation
      const conversationIds = conversations.map(c => c.id);
      const messages = await db
        .select()
        .from(schema.ai_messages)
        .where(sql`${schema.ai_messages.conversation_id} = ANY(${conversationIds})`)
        .orderBy(schema.ai_messages.timestamp);

      // Format response
      const formattedConversations = conversations.map(conv => ({
        id: conv.id,
        startedAt: conv.started_at,
        endedAt: conv.ended_at,
        status: conv.status,
        emotionalState: JSON.parse(conv.emotional_state || '{}'),
        topics: conv.topics_covered,
        messages: messages
          .filter(m => m.conversation_id === conv.id)
          .map(m => ({
            id: m.id,
            content: m.content,
            role: m.sender_type === 'user' ? 'user' : 'assistant',
            timestamp: m.timestamp,
            confidence: m.confidence_score ? parseFloat(m.confidence_score) : undefined,
            emotionalState: m.emotional_indicators ? JSON.parse(m.emotional_indicators) : undefined
          }))
      }));

      console.log(`[${traceId}] Retrieved ${formattedConversations.length} conversations`);

      return res.json({
        conversations: formattedConversations,
        total: formattedConversations.length
      });

    } catch (error) {
      console.error(`[${traceId}] Failed to get conversation history:`, error);
      return res.status(500).json({ 
        error: 'Failed to retrieve conversation history',
        details: error.message 
      });
    }
  },

  /**
   * @api {post} /api/v1/conversations/:conversationId/escalate Escalate conversation
   * @apiDescription Escalates a conversation to human agent
   */
  async escalateConversation(req: Request, res: Response) {
    const traceId = `ESC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${traceId}] Escalating conversation ${req.params.conversationId}`);

    try {
      const conversationId = req.params.conversationId;
      const { reason, urgency } = req.body;

      // Update conversation status
      await db
        .update(schema.ai_conversations)
        .set({ 
          status: 'escalated',
          ended_at: new Date()
        })
        .where(eq(schema.ai_conversations.id, conversationId));

      // Get conversation details
      const [conversation] = await db
        .select()
        .from(schema.ai_conversations)
        .where(eq(schema.ai_conversations.id, conversationId))
        .limit(1);

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Create escalation record
      const [escalation] = await db
        .insert(schema.escalation_queue)
        .values({
          case_id: conversation.case_id,
          priority: urgency || 'medium',
          reason: reason || 'user_request',
          trigger_description: `Conversation ${conversationId} escalated`,
          ai_attempted_actions: JSON.stringify([]),
          context_summary: 'Conversation escalated by user request',
          recommended_actions: ['Review conversation history', 'Contact user directly']
        })
        .returning();

      console.log(`[${traceId}] Conversation escalated successfully`);

      return res.json({
        escalationId: escalation.id,
        status: 'escalated',
        priority: escalation.priority
      });

    } catch (error) {
      console.error(`[${traceId}] Failed to escalate conversation:`, error);
      return res.status(500).json({ 
        error: 'Failed to escalate conversation',
        details: error.message 
      });
    }
  },

  /**
   * @api {get} /api/v1/conversations/active Get active conversations
   * @apiDescription Gets all active conversations for the current user
   */
  async getActiveConversations(req: Request, res: Response) {
    const traceId = `ACTIVE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${traceId}] Getting active conversations`);

    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get user's cases
      const userCases = await db
        .select({ caseId: schema.transaction_participants.transaction_id })
        .from(schema.transaction_participants)
        .where(eq(schema.transaction_participants.user_id, userId));

      const caseIds = userCases.map(uc => uc.caseId);

      // Get active conversations
      const activeConversations = await db
        .select()
        .from(schema.ai_conversations)
        .where(and(
          sql`${schema.ai_conversations.case_id} = ANY(${caseIds})`,
          eq(schema.ai_conversations.status, 'active')
        ))
        .orderBy(schema.ai_conversations.last_message_at);

      console.log(`[${traceId}] Found ${activeConversations.length} active conversations`);

      return res.json({
        conversations: activeConversations.map(conv => ({
          id: conv.id,
          caseId: conv.case_id,
          startedAt: conv.started_at,
          lastMessageAt: conv.last_message_at,
          channel: conv.channel,
          urgencyScore: conv.urgency_score ? parseFloat(conv.urgency_score) : 0,
          topics: conv.topics_covered
        }))
      });

    } catch (error) {
      console.error(`[${traceId}] Failed to get active conversations:`, error);
      return res.status(500).json({ 
        error: 'Failed to retrieve active conversations',
        details: error.message 
      });
    }
  }
};