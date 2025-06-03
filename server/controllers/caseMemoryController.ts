/**
 * @ai-context Case Memory Controller for ReAlign 3.0
 * @ai-critical Manages case memory endpoints
 * @ai-modifiable true
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { caseMemoryService } from '../services/CaseMemoryService';

// Request validation schemas
const memoryUpdateSchema = z.object({
  type: z.enum(['conversation', 'document', 'financial', 'interaction', 'learning']),
  data: z.record(z.any()),
  source: z.string(),
  confidence: z.number().min(0).max(1).optional(),
  timestamp: z.string().datetime().optional()
});

/**
 * @ai-purpose Case memory management controller
 */
export const caseMemoryController = {
  /**
   * @api {post} /api/v1/memory/:caseId Initialize case memory
   * @apiDescription Creates initial memory structure for a case
   */
  async initializeMemory(req: Request, res: Response) {
    const traceId = `MEM-INIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${traceId}] Initializing case memory for case ${req.params.caseId}`);

    try {
      const caseId = req.params.caseId;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Initialize memory
      const memory = await caseMemoryService.initializeCaseMemory(caseId);

      console.log(`[${traceId}] Case memory initialized successfully`);

      return res.json({
        caseId: memory.case_id,
        initialized: true,
        createdAt: memory.created_at
      });

    } catch (error) {
      console.error(`[${traceId}] Failed to initialize case memory:`, error);
      return res.status(500).json({ 
        error: 'Failed to initialize case memory',
        details: error.message 
      });
    }
  },

  /**
   * @api {get} /api/v1/memory/:caseId Get case memory
   * @apiDescription Retrieves complete case memory
   */
  async getMemory(req: Request, res: Response) {
    const traceId = `MEM-GET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${traceId}] Getting case memory for case ${req.params.caseId}`);

    try {
      const caseId = req.params.caseId;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get memory
      const memory = await caseMemoryService.getMemory(caseId);

      if (!memory) {
        return res.status(404).json({ error: 'Case memory not found' });
      }

      // Parse JSON fields
      const parsedMemory = {
        caseId: memory.case_id,
        totalConversations: memory.total_conversations,
        conversationSummaries: JSON.parse(memory.conversation_summaries || '[]'),
        keyTopicsDiscussed: memory.key_topics_discussed,
        unresolvedQuestions: JSON.parse(memory.unresolved_questions || '[]'),
        communicationPreferences: JSON.parse(memory.communication_preferences || '{}'),
        documentsCollected: memory.documents_collected,
        documentsMissing: memory.documents_missing,
        extractionConfidence: JSON.parse(memory.extraction_confidence || '{}'),
        dataDiscrepancies: JSON.parse(memory.data_discrepancies || '[]'),
        documentTimeline: JSON.parse(memory.document_timeline || '[]'),
        currentSnapshot: memory.current_snapshot ? JSON.parse(memory.current_snapshot) : null,
        historicalSnapshots: JSON.parse(memory.historical_snapshots || '[]'),
        trendAnalysis: JSON.parse(memory.trend_analysis || '{}'),
        projectionModels: JSON.parse(memory.projection_models || '{}'),
        servicerInteractions: JSON.parse(memory.servicer_interactions || '[]'),
        submissionHistory: JSON.parse(memory.submission_history || '[]'),
        followUpActivities: JSON.parse(memory.follow_up_activities || '[]'),
        escalationHistory: JSON.parse(memory.escalation_history || '[]'),
        patternMatches: JSON.parse(memory.pattern_matches || '[]'),
        successFactors: JSON.parse(memory.success_factors || '[]'),
        riskIndicators: JSON.parse(memory.risk_indicators || '[]'),
        nextBestActions: JSON.parse(memory.next_best_actions || '[]'),
        createdAt: memory.created_at,
        updatedAt: memory.updated_at
      };

      console.log(`[${traceId}] Case memory retrieved successfully`);

      return res.json(parsedMemory);

    } catch (error) {
      console.error(`[${traceId}] Failed to get case memory:`, error);
      return res.status(500).json({ 
        error: 'Failed to retrieve case memory',
        details: error.message 
      });
    }
  },

  /**
   * @api {put} /api/v1/memory/:caseId Update case memory
   * @apiDescription Updates case memory with new information
   */
  async updateMemory(req: Request, res: Response) {
    const traceId = `MEM-UPDATE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${traceId}] Updating case memory for case ${req.params.caseId}`);

    try {
      const caseId = req.params.caseId;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validate update data
      const updateData = memoryUpdateSchema.parse(req.body);

      // Update memory
      const updatedMemory = await caseMemoryService.updateMemory(caseId, updateData);

      console.log(`[${traceId}] Case memory updated successfully`);

      return res.json({
        caseId: updatedMemory.case_id,
        updated: true,
        updatedAt: updatedMemory.updated_at
      });

    } catch (error) {
      console.error(`[${traceId}] Failed to update case memory:`, error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid update data',
          details: error.errors 
        });
      }

      return res.status(500).json({ 
        error: 'Failed to update case memory',
        details: error.message 
      });
    }
  },

  /**
   * @api {get} /api/v1/memory/:caseId/summary Get memory summary
   * @apiDescription Gets a summary of case memory
   */
  async getMemorySummary(req: Request, res: Response) {
    const traceId = `MEM-SUMMARY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${traceId}] Getting memory summary for case ${req.params.caseId}`);

    try {
      const caseId = req.params.caseId;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get summary
      const summary = await caseMemoryService.getMemorySummary(caseId);

      console.log(`[${traceId}] Memory summary retrieved successfully`);

      return res.json(summary);

    } catch (error) {
      console.error(`[${traceId}] Failed to get memory summary:`, error);
      return res.status(500).json({ 
        error: 'Failed to retrieve memory summary',
        details: error.message 
      });
    }
  },

  /**
   * @api {get} /api/v1/memory/:caseId/context/conversation Get conversation context
   * @apiDescription Gets conversation context for AI
   */
  async getConversationContext(req: Request, res: Response) {
    const traceId = `MEM-CONV-CTX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${traceId}] Getting conversation context for case ${req.params.caseId}`);

    try {
      const caseId = req.params.caseId;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get context
      const context = await caseMemoryService.getConversationContext(caseId);

      console.log(`[${traceId}] Conversation context retrieved successfully`);

      return res.json(context);

    } catch (error) {
      console.error(`[${traceId}] Failed to get conversation context:`, error);
      return res.status(500).json({ 
        error: 'Failed to retrieve conversation context',
        details: error.message 
      });
    }
  },

  /**
   * @api {get} /api/v1/memory/:caseId/context/document Get document context
   * @apiDescription Gets document context for AI
   */
  async getDocumentContext(req: Request, res: Response) {
    const traceId = `MEM-DOC-CTX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${traceId}] Getting document context for case ${req.params.caseId}`);

    try {
      const caseId = req.params.caseId;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get context
      const context = await caseMemoryService.getDocumentContext(caseId);

      console.log(`[${traceId}] Document context retrieved successfully`);

      return res.json(context);

    } catch (error) {
      console.error(`[${traceId}] Failed to get document context:`, error);
      return res.status(500).json({ 
        error: 'Failed to retrieve document context',
        details: error.message 
      });
    }
  },

  /**
   * @api {get} /api/v1/memory/:caseId/context/financial Get financial context
   * @apiDescription Gets financial context for AI
   */
  async getFinancialContext(req: Request, res: Response) {
    const traceId = `MEM-FIN-CTX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${traceId}] Getting financial context for case ${req.params.caseId}`);

    try {
      const caseId = req.params.caseId;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get context
      const context = await caseMemoryService.getFinancialContext(caseId);

      console.log(`[${traceId}] Financial context retrieved successfully`);

      return res.json(context);

    } catch (error) {
      console.error(`[${traceId}] Failed to get financial context:`, error);
      return res.status(500).json({ 
        error: 'Failed to retrieve financial context',
        details: error.message 
      });
    }
  }
};