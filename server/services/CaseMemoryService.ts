/**
 * @ai-context Core memory system for ReAlign 3.0 AI architecture
 * @ai-critical This service maintains complete case context for AI decision making
 * @ai-modifiable true
 * @test-coverage required
 */

import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '../../shared/schema';
import { case_memory, temporal_context, type CaseMemory, type InsertCaseMemory, type TemporalContext } from '../../shared/schema';

// Initialize PostgreSQL client pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
});

// Initialize Drizzle ORM
const database = drizzle(pool, { schema });

// Types for AI-friendly development
export interface MemoryUpdate {
  type: 'conversation' | 'document' | 'financial' | 'interaction' | 'learning';
  data: Record<string, any>;
  source: string;
  confidence?: number;
  timestamp?: Date;
}

export interface MemorySummary {
  totalConversations: number;
  documentsCollected: number;
  interactionCount: number;
  lastActivity: Date;
  completionScore: number;
}

export interface ConversationContext {
  summary: string;
  keyTopics: string[];
  unresolvedQuestions: any[];
  emotionalJourney: any[];
  preferredStyle: string;
}

export interface DocumentContext {
  collected: number;
  missing: string[];
  extractionConfidence: Record<string, number>;
  discrepancies: any[];
  timeline: any[];
}

export interface FinancialContext {
  currentSnapshot: any;
  historicalData: any[];
  trends: any;
  projections: any;
}

/**
 * @ai-purpose Complete case memory management system
 * @debug-point All operations include trace IDs for debugging
 */
export class CaseMemoryService {
  private generateTraceId(): string {
    return `MEMORY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * @ai-purpose Initialize case memory for new case
   * @ai-inputs caseId: UUID of the case
   * @ai-outputs Complete CaseMemory object
   * @debug-trace Logs memory initialization
   */
  async initializeCaseMemory(caseId: string): Promise<CaseMemory> {
    const traceId = this.generateTraceId();
    console.log(`[${traceId}] Initializing case memory for case ${caseId}`);

    try {
      // Check if memory already exists
      const existing = await this.getMemory(caseId);
      if (existing) {
        console.log(`[${traceId}] Memory already exists for case ${caseId}`);
        return existing;
      }

      // Create new case memory
      const memoryData: InsertCaseMemory = {
        case_id: caseId,
        total_conversations: 0,
        conversation_summaries: JSON.stringify([]),
        key_topics_discussed: [],
        unresolved_questions: JSON.stringify([]),
        communication_preferences: JSON.stringify({}),
        documents_collected: 0,
        documents_missing: [],
        extraction_confidence: JSON.stringify({}),
        data_discrepancies: JSON.stringify([]),
        document_timeline: JSON.stringify([]),
        current_snapshot: null,
        historical_snapshots: JSON.stringify([]),
        trend_analysis: JSON.stringify({}),
        projection_models: JSON.stringify({}),
        servicer_interactions: JSON.stringify([]),
        submission_history: JSON.stringify([]),
        follow_up_activities: JSON.stringify([]),
        escalation_history: JSON.stringify([]),
        pattern_matches: JSON.stringify([]),
        success_factors: JSON.stringify([]),
        risk_indicators: JSON.stringify([]),
        next_best_actions: JSON.stringify([])
      };

      const [newMemory] = await database
        .insert(case_memory)
        .values(memoryData)
        .returning();

      // Initialize temporal context
      await this.initializeTemporalContext(caseId);

      console.log(`[${traceId}] Successfully initialized case memory for case ${caseId}`);
      return newMemory;

    } catch (error) {
      console.error(`[${traceId}] Failed to initialize case memory:`, error);
      throw new Error(`Failed to initialize case memory: ${error.message}`);
    }
  }

  /**
   * @ai-purpose Get complete case memory
   * @ai-inputs caseId: UUID of the case
   * @ai-outputs Complete CaseMemory object or null
   */
  async getMemory(caseId: string): Promise<CaseMemory | null> {
    const traceId = this.generateTraceId();
    console.log(`[${traceId}] Retrieving case memory for case ${caseId}`);

    try {
      const memory = await database
        .select()
        .from(case_memory)
        .where(eq(case_memory.case_id, caseId))
        .limit(1);

      if (memory.length === 0) {
        console.log(`[${traceId}] No memory found for case ${caseId}`);
        return null;
      }

      console.log(`[${traceId}] Successfully retrieved case memory for case ${caseId}`);
      return memory[0];

    } catch (error) {
      console.error(`[${traceId}] Failed to retrieve case memory:`, error);
      throw new Error(`Failed to retrieve case memory: ${error.message}`);
    }
  }

  /**
   * @ai-purpose Update case memory with new information
   * @ai-inputs caseId: UUID, update: MemoryUpdate object
   * @ai-outputs Updated CaseMemory object
   * @debug-point Logs before/after state for comparison
   */
  async updateMemory(caseId: string, update: MemoryUpdate): Promise<CaseMemory> {
    const traceId = this.generateTraceId();
    console.log(`[${traceId}] Updating memory for case ${caseId}`, {
      updateType: update.type,
      source: update.source,
      confidence: update.confidence
    });

    try {
      // Get current memory state
      const before = await this.getMemory(caseId);
      if (!before) {
        throw new Error('Case memory not found - initialize first');
      }

      // Apply update based on type
      const updatedData = await this.applyUpdate(before, update);

      // Update in database
      const [updated] = await database
        .update(case_memory)
        .set(updatedData)
        .where(eq(case_memory.case_id, caseId))
        .returning();

      // Log the change for debugging
      console.log(`[${traceId}] Memory updated successfully`, {
        updateType: update.type,
        fieldsChanged: this.getChangedFields(before, updated)
      });

      return updated;

    } catch (error) {
      console.error(`[${traceId}] Memory update failed:`, error);
      throw new Error(`Memory update failed: ${error.message}`);
    }
  }

  /**
   * @ai-purpose Apply specific update type to memory
   * @debug-point Each update type has specific logging
   */
  private async applyUpdate(memory: CaseMemory, update: MemoryUpdate): Promise<Partial<CaseMemory>> {
    const updates: Partial<CaseMemory> = {
      updated_at: new Date()
    };

    switch (update.type) {
      case 'conversation':
        updates.total_conversations = (memory.total_conversations || 0) + 1;
        
        const summaries = JSON.parse(memory.conversation_summaries || '[]');
        summaries.push({
          timestamp: update.timestamp || new Date(),
          summary: update.data.summary,
          topics: update.data.topics,
          emotional_state: update.data.emotionalState,
          source: update.source
        });
        updates.conversation_summaries = JSON.stringify(summaries);

        // Update key topics
        const existingTopics = memory.key_topics_discussed || [];
        const newTopics = update.data.topics || [];
        const combinedTopics = [...new Set([...existingTopics, ...newTopics])];
        updates.key_topics_discussed = combinedTopics;

        // Update unresolved questions
        if (update.data.unresolvedQuestions) {
          const unresolved = JSON.parse(memory.unresolved_questions || '[]');
          unresolved.push(...update.data.unresolvedQuestions);
          updates.unresolved_questions = JSON.stringify(unresolved);
        }

        console.log(`Applied conversation update: +1 conversation, ${newTopics.length} new topics`);
        break;

      case 'document':
        updates.documents_collected = (memory.documents_collected || 0) + 1;

        // Update document timeline
        const timeline = JSON.parse(memory.document_timeline || '[]');
        timeline.push({
          timestamp: update.timestamp || new Date(),
          documentType: update.data.type,
          confidence: update.confidence,
          source: update.source
        });
        updates.document_timeline = JSON.stringify(timeline);

        // Update extraction confidence
        const confidence = JSON.parse(memory.extraction_confidence || '{}');
        confidence[update.data.type] = update.confidence || 0;
        updates.extraction_confidence = JSON.stringify(confidence);

        console.log(`Applied document update: +1 document (${update.data.type}), confidence: ${update.confidence}`);
        break;

      case 'financial':
        // Update current snapshot
        updates.current_snapshot = JSON.stringify(update.data.snapshot);

        // Add to historical data
        const historical = JSON.parse(memory.historical_snapshots || '[]');
        historical.push({
          timestamp: update.timestamp || new Date(),
          snapshot: update.data.snapshot,
          source: update.source
        });
        updates.historical_snapshots = JSON.stringify(historical);

        // Update trends if provided
        if (update.data.trends) {
          updates.trend_analysis = JSON.stringify(update.data.trends);
        }

        console.log(`Applied financial update: new snapshot, ${historical.length} historical records`);
        break;

      case 'interaction':
        // Update servicer interactions
        const interactions = JSON.parse(memory.servicer_interactions || '[]');
        interactions.push({
          timestamp: update.timestamp || new Date(),
          type: update.data.type,
          details: update.data.details,
          outcome: update.data.outcome,
          source: update.source
        });
        updates.servicer_interactions = JSON.stringify(interactions);

        console.log(`Applied interaction update: +1 ${update.data.type} interaction`);
        break;

      case 'learning':
        // Update pattern matches
        if (update.data.patterns) {
          const patterns = JSON.parse(memory.pattern_matches || '[]');
          patterns.push(...update.data.patterns);
          updates.pattern_matches = JSON.stringify(patterns);
        }

        // Update success factors
        if (update.data.successFactors) {
          const factors = JSON.parse(memory.success_factors || '[]');
          factors.push(...update.data.successFactors);
          updates.success_factors = JSON.stringify(factors);
        }

        // Update risk indicators
        if (update.data.riskIndicators) {
          const risks = JSON.parse(memory.risk_indicators || '[]');
          risks.push(...update.data.riskIndicators);
          updates.risk_indicators = JSON.stringify(risks);
        }

        console.log(`Applied learning update: patterns, factors, and risks updated`);
        break;

      default:
        throw new Error(`Unknown update type: ${update.type}`);
    }

    return updates;
  }

  /**
   * @ai-purpose Get conversation context for AI
   * @ai-outputs Structured conversation context
   */
  async getConversationContext(caseId: string): Promise<ConversationContext> {
    const memory = await this.getMemory(caseId);
    if (!memory) {
      throw new Error('Case memory not found');
    }

    const summaries = JSON.parse(memory.conversation_summaries || '[]');
    const preferences = JSON.parse(memory.communication_preferences || '{}');
    const unresolved = JSON.parse(memory.unresolved_questions || '[]');

    return {
      summary: summaries.map((s: any) => s.summary).join(' '),
      keyTopics: memory.key_topics_discussed || [],
      unresolvedQuestions: unresolved,
      emotionalJourney: summaries.map((s: any) => s.emotional_state).filter(Boolean),
      preferredStyle: preferences.style || 'professional'
    };
  }

  /**
   * @ai-purpose Get document context for AI
   * @ai-outputs Structured document context
   */
  async getDocumentContext(caseId: string): Promise<DocumentContext> {
    const memory = await this.getMemory(caseId);
    if (!memory) {
      throw new Error('Case memory not found');
    }

    return {
      collected: memory.documents_collected || 0,
      missing: memory.documents_missing || [],
      extractionConfidence: JSON.parse(memory.extraction_confidence || '{}'),
      discrepancies: JSON.parse(memory.data_discrepancies || '[]'),
      timeline: JSON.parse(memory.document_timeline || '[]')
    };
  }

  /**
   * @ai-purpose Get financial context for AI
   * @ai-outputs Structured financial context
   */
  async getFinancialContext(caseId: string): Promise<FinancialContext> {
    const memory = await this.getMemory(caseId);
    if (!memory) {
      throw new Error('Case memory not found');
    }

    return {
      currentSnapshot: memory.current_snapshot ? JSON.parse(memory.current_snapshot) : null,
      historicalData: JSON.parse(memory.historical_snapshots || '[]'),
      trends: JSON.parse(memory.trend_analysis || '{}'),
      projections: JSON.parse(memory.projection_models || '{}')
    };
  }

  /**
   * @ai-purpose Generate memory summary for quick access
   * @ai-outputs MemorySummary object
   */
  async getMemorySummary(caseId: string): Promise<MemorySummary> {
    const memory = await this.getMemory(caseId);
    if (!memory) {
      throw new Error('Case memory not found');
    }

    const interactions = JSON.parse(memory.servicer_interactions || '[]');
    const timeline = JSON.parse(memory.document_timeline || '[]');

    // Calculate completion score
    const completionScore = this.calculateCompletionScore(memory);

    return {
      totalConversations: memory.total_conversations || 0,
      documentsCollected: memory.documents_collected || 0,
      interactionCount: interactions.length,
      lastActivity: memory.updated_at || memory.created_at,
      completionScore
    };
  }

  /**
   * @ai-purpose Initialize temporal context for case
   */
  private async initializeTemporalContext(caseId: string): Promise<void> {
    try {
      await database
        .insert(temporal_context)
        .values({
          case_id: caseId,
          response_deadlines: JSON.stringify({}),
          internal_deadlines: JSON.stringify({}),
          bottlenecks: JSON.stringify([]),
          best_contact_times: JSON.stringify({}),
          servicer_response_pattern: JSON.stringify({}),
          optimal_follow_up_intervals: JSON.stringify({})
        });
    } catch (error) {
      console.error('Failed to initialize temporal context:', error);
      // Non-critical error, don't throw
    }
  }

  /**
   * @ai-purpose Calculate case completion score
   */
  private calculateCompletionScore(memory: CaseMemory): number {
    let score = 0;
    let maxScore = 100;

    // Conversation score (20 points)
    if ((memory.total_conversations || 0) > 0) score += 20;

    // Document score (30 points)
    const docScore = Math.min(30, (memory.documents_collected || 0) * 5);
    score += docScore;

    // Financial data score (25 points)
    if (memory.current_snapshot) score += 25;

    // Interaction score (15 points)
    const interactions = JSON.parse(memory.servicer_interactions || '[]');
    if (interactions.length > 0) score += 15;

    // Learning score (10 points)
    const patterns = JSON.parse(memory.pattern_matches || '[]');
    if (patterns.length > 0) score += 10;

    return Math.round((score / maxScore) * 100);
  }

  /**
   * @ai-purpose Identify changed fields for debugging
   */
  private getChangedFields(before: CaseMemory, after: CaseMemory): string[] {
    const changed: string[] = [];
    
    for (const key in after) {
      if (key === 'updated_at') continue;
      if (JSON.stringify(before[key as keyof CaseMemory]) !== JSON.stringify(after[key as keyof CaseMemory])) {
        changed.push(key);
      }
    }

    return changed;
  }
}

/**
 * @ai-purpose Singleton instance for use across the application
 */
export const caseMemoryService = new CaseMemoryService();