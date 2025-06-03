/**
 * @ai-context Test suite for CaseMemoryService
 * @test-coverage Complete test coverage for all CaseMemoryService methods
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CaseMemoryService, type MemoryUpdate } from '../CaseMemoryService';

// Mock the database
vi.mock('drizzle-orm/node-postgres', () => ({
  drizzle: vi.fn(() => mockDb)
}));

vi.mock('pg', () => ({
  default: {
    Pool: vi.fn(() => ({}))
  }
}));

// Mock database instance
const mockDb = {
  insert: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  values: vi.fn(),
  returning: vi.fn(),
  limit: vi.fn(),
  set: vi.fn()
};

// Mock data
const mockCaseId = 'test-case-id-123';
const mockCaseMemory = {
  id: 'memory-id-123',
  case_id: mockCaseId,
  created_at: new Date(),
  updated_at: new Date(),
  total_conversations: 1,
  conversation_summaries: JSON.stringify([{
    timestamp: new Date(),
    summary: 'Initial conversation',
    topics: ['hardship', 'mortgage'],
    emotional_state: { distress: 0.7 }
  }]),
  key_topics_discussed: ['hardship', 'mortgage'],
  unresolved_questions: JSON.stringify([]),
  communication_preferences: JSON.stringify({ style: 'professional' }),
  documents_collected: 2,
  documents_missing: ['bank_statement'],
  extraction_confidence: JSON.stringify({ paystub: 0.95, tax_return: 0.88 }),
  data_discrepancies: JSON.stringify([]),
  document_timeline: JSON.stringify([
    { timestamp: new Date(), documentType: 'paystub', confidence: 0.95 }
  ]),
  current_snapshot: JSON.stringify({
    monthly_income: 4500,
    monthly_expenses: 3200,
    liquid_assets: 2000
  }),
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

describe('CaseMemoryService', () => {
  let caseMemoryService: CaseMemoryService;

  beforeEach(() => {
    caseMemoryService = new CaseMemoryService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initializeCaseMemory', () => {
    it('should initialize new case memory successfully', async () => {
      // Setup mocks for new case
      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.limit.mockResolvedValue([]); // No existing memory

      mockDb.insert.mockReturnValue(mockDb);
      mockDb.values.mockReturnValue(mockDb);
      mockDb.returning.mockResolvedValue([mockCaseMemory]);

      const result = await caseMemoryService.initializeCaseMemory(mockCaseId);

      expect(result).toEqual(mockCaseMemory);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalled();
      expect(mockDb.returning).toHaveBeenCalled();
    });

    it('should return existing memory if already initialized', async () => {
      // Setup mocks for existing case
      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.limit.mockResolvedValue([mockCaseMemory]);

      const result = await caseMemoryService.initializeCaseMemory(mockCaseId);

      expect(result).toEqual(mockCaseMemory);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.limit.mockRejectedValue(new Error('Database error'));

      await expect(caseMemoryService.initializeCaseMemory(mockCaseId))
        .rejects.toThrow('Failed to initialize case memory');
    });
  });

  describe('getMemory', () => {
    it('should retrieve case memory successfully', async () => {
      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.limit.mockResolvedValue([mockCaseMemory]);

      const result = await caseMemoryService.getMemory(mockCaseId);

      expect(result).toEqual(mockCaseMemory);
    });

    it('should return null for non-existent case', async () => {
      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.limit.mockResolvedValue([]);

      const result = await caseMemoryService.getMemory(mockCaseId);

      expect(result).toBeNull();
    });

    it('should handle retrieval errors', async () => {
      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.limit.mockRejectedValue(new Error('Database error'));

      await expect(caseMemoryService.getMemory(mockCaseId))
        .rejects.toThrow('Failed to retrieve case memory');
    });
  });

  describe('updateMemory', () => {
    beforeEach(() => {
      // Mock getMemory to return existing memory
      vi.spyOn(caseMemoryService, 'getMemory').mockResolvedValue(mockCaseMemory);
    });

    it('should update memory with conversation data', async () => {
      const conversationUpdate: MemoryUpdate = {
        type: 'conversation',
        data: {
          summary: 'Discussed payment options',
          topics: ['payment', 'modification'],
          emotionalState: { hope: 0.8 },
          unresolvedQuestions: [{ question: 'What documents needed?', priority: 'high' }]
        },
        source: 'ai_conversation',
        confidence: 0.9
      };

      const updatedMemory = {
        ...mockCaseMemory,
        total_conversations: 2,
        updated_at: new Date()
      };

      mockDb.update.mockReturnValue(mockDb);
      mockDb.set.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.returning.mockResolvedValue([updatedMemory]);

      const result = await caseMemoryService.updateMemory(mockCaseId, conversationUpdate);

      expect(result.total_conversations).toBe(2);
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalled();
      expect(mockDb.returning).toHaveBeenCalled();
    });

    it('should update memory with document data', async () => {
      const documentUpdate: MemoryUpdate = {
        type: 'document',
        data: {
          type: 'bank_statement',
          extractedData: { account_balance: 1500 }
        },
        source: 'document_processor',
        confidence: 0.92
      };

      const updatedMemory = {
        ...mockCaseMemory,
        documents_collected: 3,
        updated_at: new Date()
      };

      mockDb.update.mockReturnValue(mockDb);
      mockDb.set.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.returning.mockResolvedValue([updatedMemory]);

      const result = await caseMemoryService.updateMemory(mockCaseId, documentUpdate);

      expect(result.documents_collected).toBe(3);
    });

    it('should update memory with financial data', async () => {
      const financialUpdate: MemoryUpdate = {
        type: 'financial',
        data: {
          snapshot: {
            monthly_income: 4200,
            monthly_expenses: 3100,
            liquid_assets: 1800
          },
          trends: { income_trend: 'declining' }
        },
        source: 'financial_analyzer',
        confidence: 0.85
      };

      mockDb.update.mockReturnValue(mockDb);
      mockDb.set.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.returning.mockResolvedValue([mockCaseMemory]);

      const result = await caseMemoryService.updateMemory(mockCaseId, financialUpdate);

      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          current_snapshot: expect.any(String),
          updated_at: expect.any(Date)
        })
      );
    });

    it('should handle unknown update types', async () => {
      const invalidUpdate = {
        type: 'invalid_type',
        data: {},
        source: 'test'
      } as any;

      await expect(caseMemoryService.updateMemory(mockCaseId, invalidUpdate))
        .rejects.toThrow('Unknown update type: invalid_type');
    });

    it('should handle missing case memory', async () => {
      vi.spyOn(caseMemoryService, 'getMemory').mockResolvedValue(null);

      const update: MemoryUpdate = {
        type: 'conversation',
        data: {},
        source: 'test'
      };

      await expect(caseMemoryService.updateMemory(mockCaseId, update))
        .rejects.toThrow('Case memory not found - initialize first');
    });
  });

  describe('getConversationContext', () => {
    it('should return conversation context', async () => {
      vi.spyOn(caseMemoryService, 'getMemory').mockResolvedValue(mockCaseMemory);

      const context = await caseMemoryService.getConversationContext(mockCaseId);

      expect(context).toEqual({
        summary: 'Initial conversation',
        keyTopics: ['hardship', 'mortgage'],
        unresolvedQuestions: [],
        emotionalJourney: [{ distress: 0.7 }],
        preferredStyle: 'professional'
      });
    });

    it('should handle missing memory', async () => {
      vi.spyOn(caseMemoryService, 'getMemory').mockResolvedValue(null);

      await expect(caseMemoryService.getConversationContext(mockCaseId))
        .rejects.toThrow('Case memory not found');
    });
  });

  describe('getDocumentContext', () => {
    it('should return document context', async () => {
      vi.spyOn(caseMemoryService, 'getMemory').mockResolvedValue(mockCaseMemory);

      const context = await caseMemoryService.getDocumentContext(mockCaseId);

      expect(context).toEqual({
        collected: 2,
        missing: ['bank_statement'],
        extractionConfidence: { paystub: 0.95, tax_return: 0.88 },
        discrepancies: [],
        timeline: [{ timestamp: expect.any(Date), documentType: 'paystub', confidence: 0.95 }]
      });
    });
  });

  describe('getFinancialContext', () => {
    it('should return financial context', async () => {
      vi.spyOn(caseMemoryService, 'getMemory').mockResolvedValue(mockCaseMemory);

      const context = await caseMemoryService.getFinancialContext(mockCaseId);

      expect(context).toEqual({
        currentSnapshot: {
          monthly_income: 4500,
          monthly_expenses: 3200,
          liquid_assets: 2000
        },
        historicalData: [],
        trends: {},
        projections: {}
      });
    });
  });

  describe('getMemorySummary', () => {
    it('should return memory summary with completion score', async () => {
      vi.spyOn(caseMemoryService, 'getMemory').mockResolvedValue(mockCaseMemory);

      const summary = await caseMemoryService.getMemorySummary(mockCaseId);

      expect(summary).toEqual({
        totalConversations: 1,
        documentsCollected: 2,
        interactionCount: 0,
        lastActivity: expect.any(Date),
        completionScore: expect.any(Number)
      });

      // Completion score should be reasonable
      expect(summary.completionScore).toBeGreaterThan(50);
      expect(summary.completionScore).toBeLessThanOrEqual(100);
    });
  });
});

/**
 * @ai-instruction Run tests with: npm test CaseMemoryService.test.ts
 * Tests verify all public methods and error handling
 */