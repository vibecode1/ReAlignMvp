import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SubmissionOrchestrator } from '../submission/SubmissionOrchestrator';

// Mock dependencies
jest.mock('../logger');
jest.mock('../servicers/ServicerAdapterFactory');
jest.mock('../CaseMemoryService');
jest.mock('../../lib/supabase');

describe('SubmissionOrchestrator', () => {
  let orchestrator: SubmissionOrchestrator;

  beforeEach(() => {
    jest.clearAllMocks();
    orchestrator = new SubmissionOrchestrator();
  });

  describe('submitDocument', () => {
    it('should create and queue a submission task', async () => {
      const params = {
        transactionId: 'trans_123',
        servicerId: 'chase',
        documentType: 'tax_return',
        documentData: { year: 2023 },
        priority: 'high' as const
      };

      const result = await orchestrator.submitDocument(params);

      expect(result.success).toBe(true);
      expect(result.taskId).toBeDefined();
      expect(result.taskId).toMatch(/^sub_/);
    });

    it('should process urgent tasks immediately', async () => {
      const params = {
        transactionId: 'trans_123',
        servicerId: 'chase',
        documentType: 'tax_return',
        documentData: { year: 2023 },
        priority: 'urgent' as const
      };

      const result = await orchestrator.submitDocument(params);

      expect(result.success).toBeDefined();
      expect(result.taskId).toBeDefined();
    });

    it('should handle submission failures with retry', async () => {
      // Mock adapter to throw error
      const mockAdapter = {
        submitDocument: jest.fn().mockRejectedValue(new Error('Network timeout'))
      };

      // Configure factory mock
      jest.spyOn(orchestrator['adapterFactory'], 'getAdapter')
        .mockResolvedValue(mockAdapter);

      const params = {
        transactionId: 'trans_123',
        servicerId: 'wells_fargo',
        documentType: 'bank_statement',
        documentData: { month: '2024-01' },
        priority: 'normal' as const
      };

      const result = await orchestrator.submitDocument(params);

      expect(result.success).toBe(true); // Task queued
      expect(result.taskId).toBeDefined();
      expect(result.nextSteps).toContain('Document queued for submission');
    });
  });

  describe('retry logic', () => {
    it('should apply exponential backoff', () => {
      const strategy = orchestrator['retryStrategy'];
      
      expect(strategy.calculateDelay(1)).toBeGreaterThanOrEqual(5000);
      expect(strategy.calculateDelay(1)).toBeLessThan(7000); // With jitter
      
      expect(strategy.calculateDelay(2)).toBeGreaterThanOrEqual(10000);
      expect(strategy.calculateDelay(2)).toBeLessThan(13000);
      
      expect(strategy.calculateDelay(3)).toBeGreaterThanOrEqual(20000);
      expect(strategy.calculateDelay(3)).toBeLessThan(26000);
    });

    it('should cap delay at maximum', () => {
      const strategy = orchestrator['retryStrategy'];
      const delay = strategy.calculateDelay(10); // Very high attempt number
      
      expect(delay).toBeLessThanOrEqual(300000 * 1.3); // Max delay with jitter
    });

    it('should not retry non-retryable errors', () => {
      const strategy = orchestrator['retryStrategy'];
      const task = {
        retryCount: 0,
        maxRetries: 3
      };

      const authError = new Error('authentication failed');
      expect(strategy.shouldRetry(task as any, authError)).toBe(false);

      const validationError = new Error('invalid document format');
      expect(strategy.shouldRetry(task as any, validationError)).toBe(false);
    });

    it('should retry network errors', () => {
      const strategy = orchestrator['retryStrategy'];
      const task = {
        retryCount: 0,
        maxRetries: 3
      };

      const networkError = new Error('Network timeout');
      expect(strategy.shouldRetry(task as any, networkError)).toBe(true);
    });
  });

  describe('circuit breaker', () => {
    it('should open after threshold failures', () => {
      const breaker = orchestrator['getCircuitBreaker']('test_servicer');
      
      expect(breaker.isOpen()).toBe(false);
      
      // Record failures
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure();
      }
      
      expect(breaker.isOpen()).toBe(true);
    });

    it('should close after successful requests in half-open state', () => {
      const breaker = orchestrator['getCircuitBreaker']('test_servicer');
      
      // Open the breaker
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure();
      }
      expect(breaker.isOpen()).toBe(true);
      
      // Wait for timeout (simulate)
      breaker['lastFailureTime'] = new Date(Date.now() - 61000);
      expect(breaker.isOpen()).toBe(false); // Half-open
      
      // Record successes
      for (let i = 0; i < 3; i++) {
        breaker.recordSuccess();
      }
      
      expect(breaker['state']).toBe('closed');
    });
  });

  describe('escalation criteria', () => {
    it('should escalate urgent priority failures', () => {
      const task = {
        priority: 'urgent',
        errorHistory: [{ error: 'Failed' }]
      };
      
      const shouldEscalate = orchestrator['checkEscalationCriteria'](task as any);
      expect(shouldEscalate).toBe(true);
    });

    it('should escalate repeated same errors', () => {
      const task = {
        priority: 'normal',
        errorHistory: [
          { error: 'Portal unavailable' },
          { error: 'Portal unavailable' },
          { error: 'Portal unavailable' }
        ],
        metadata: {}
      };
      
      const shouldEscalate = orchestrator['checkEscalationCriteria'](task as any);
      expect(shouldEscalate).toBe(true);
    });

    it('should escalate when deadline approaching', () => {
      const task = {
        priority: 'normal',
        errorHistory: [{ error: 'Failed' }],
        metadata: {
          deadline: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours from now
        }
      };
      
      const shouldEscalate = orchestrator['checkEscalationCriteria'](task as any);
      expect(shouldEscalate).toBe(true);
    });
  });

  describe('queue statistics', () => {
    it('should calculate queue statistics', async () => {
      // Add some tasks to queue
      await orchestrator.submitDocument({
        transactionId: 'trans_1',
        servicerId: 'chase',
        documentType: 'tax_return',
        documentData: {},
        priority: 'high'
      });

      await orchestrator.submitDocument({
        transactionId: 'trans_2',
        servicerId: 'bofa',
        documentType: 'bank_statement',
        documentData: {},
        priority: 'normal'
      });

      const stats = await orchestrator.getQueueStats();

      expect(stats.queueSize).toBe(2);
      expect(stats.byPriority).toBeDefined();
      expect(stats.byStatus).toBeDefined();
      expect(stats.byServicer).toBeDefined();
      expect(stats.averageRetries).toBeDefined();
      expect(stats.successRate).toBeDefined();
    });
  });

  describe('submission channel selection', () => {
    it('should select channel with highest success rate', () => {
      const intelligence = {
        patterns: {
          submissionChannels: {
            api: { successRate: 0.95 },
            portal: { successRate: 0.80 },
            email: { successRate: 0.70 }
          }
        }
      };

      const channel = orchestrator['selectSubmissionChannel'](intelligence);
      expect(channel).toBe('api');
    });

    it('should fallback to portal when no intelligence', () => {
      const channel = orchestrator['selectSubmissionChannel'](null);
      expect(channel).toBe('portal');
    });
  });
});