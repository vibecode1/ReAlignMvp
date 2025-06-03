/**
 * @ai-context Test suite for ConversationalAIEngine
 * @test-coverage Complete test coverage for all ConversationalAIEngine methods
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConversationalAIEngine, type UserInput, type ConversationContext } from '../ai/ConversationalAIEngine';

// Mock dependencies
vi.mock('../ai/ModelOrchestrator');
vi.mock('../CaseMemoryService');
vi.mock('../ai/EmotionalAnalyzer');
vi.mock('../ai/IntentClassifier');
vi.mock('../ai/ContextualResponseGenerator');

describe('ConversationalAIEngine', () => {
  let conversationalAI: ConversationalAIEngine;
  let mockInput: UserInput;
  let mockContext: ConversationContext;

  beforeEach(() => {
    conversationalAI = new ConversationalAIEngine();
    vi.clearAllMocks();

    mockInput = {
      message: "I need help with my mortgage modification",
      metadata: {
        platform: 'web',
        timestamp: new Date()
      }
    };

    mockContext = {
      userId: 'user-123',
      caseId: 'case-456',
      userRole: 'borrower',
      caseStage: 'initial_review',
      interactionCount: 1,
      sessionId: 'session-789',
      timestamp: new Date()
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('processMessage', () => {
    it('should process message successfully with complete workflow', async () => {
      const result = await conversationalAI.processMessage(mockInput, mockContext);

      expect(result).toEqual({
        message: expect.any(String),
        confidence: expect.any(Number),
        emotionalTone: expect.stringMatching(/^(empathetic|professional|encouraging|urgent)$/),
        suggestedActions: expect.any(Array),
        escalationRequired: expect.any(Boolean),
        followUpRequired: expect.any(Boolean)
      });

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle high distress scenario', async () => {
      const distressedInput: UserInput = {
        message: "I'm desperate! I'm about to lose my home and I don't know what to do! Please help me!",
        metadata: {
          platform: 'web',
          timestamp: new Date()
        }
      };

      const result = await conversationalAI.processMessage(distressedInput, mockContext);

      expect(result.escalationRequired).toBe(true);
      expect(result.emotionalTone).toBe('empathetic');
      expect(result.suggestedActions).toContainEqual(
        expect.objectContaining({
          type: 'escalate_to_human'
        })
      );
    });

    it('should handle document upload scenario', async () => {
      const documentInput: UserInput = {
        message: "Here are my paystubs from the last 3 months",
        attachments: [
          {
            id: 'doc-1',
            type: 'paystub',
            url: 'https://example.com/paystub1.pdf'
          }
        ],
        metadata: {
          platform: 'web',
          timestamp: new Date()
        }
      };

      const result = await conversationalAI.processMessage(documentInput, mockContext);

      expect(result.followUpRequired).toBe(true);
      expect(result.suggestedActions).toContainEqual(
        expect.objectContaining({
          type: 'upload_document'
        })
      );
    });

    it('should handle question scenario', async () => {
      const questionInput: UserInput = {
        message: "What is a loan modification and how does it work?",
        metadata: {
          platform: 'web',
          timestamp: new Date()
        }
      };

      const result = await conversationalAI.processMessage(questionInput, mockContext);

      expect(result.message).toContain('modification');
      expect(result.emotionalTone).toMatch(/^(professional|empathetic)$/);
      expect(result.nextSteps).toBeDefined();
      expect(result.nextSteps?.length).toBeGreaterThan(0);
    });

    it('should handle escalation request scenario', async () => {
      const escalationInput: UserInput = {
        message: "I want to speak to a human representative right now",
        metadata: {
          platform: 'web',
          timestamp: new Date()
        }
      };

      const result = await conversationalAI.processMessage(escalationInput, mockContext);

      expect(result.escalationRequired).toBe(true);
      expect(result.suggestedActions).toContainEqual(
        expect.objectContaining({
          type: 'escalate_to_human',
          data: expect.objectContaining({
            reason: expect.any(String)
          })
        })
      );
    });

    it('should handle frustrated user scenario', async () => {
      const frustratedInput: UserInput = {
        message: "This is ridiculous! I've been waiting for weeks and nothing is happening!",
        metadata: {
          platform: 'web',
          timestamp: new Date()
        }
      };

      const result = await conversationalAI.processMessage(frustratedInput, mockContext);

      expect(result.emotionalTone).toBe('empathetic');
      expect(result.message).toMatch(/understand.*frustration|hear.*frustration/i);
    });

    it('should handle processing errors gracefully', async () => {
      // Mock a failure in emotional analysis
      vi.spyOn(conversationalAI as any, 'analyzeEmotionalState').mockRejectedValue(
        new Error('Emotional analysis failed')
      );

      const result = await conversationalAI.processMessage(mockInput, mockContext);

      expect(result).toEqual({
        message: expect.stringContaining('technical difficulties'),
        confidence: 0.9,
        emotionalTone: 'empathetic',
        escalationRequired: true,
        suggestedActions: expect.arrayContaining([
          expect.objectContaining({
            type: 'escalate_to_human',
            data: expect.objectContaining({
              reason: 'technical_error'
            })
          })
        ])
      });
    });

    it('should extract unresolved questions correctly', async () => {
      const questionInput: UserInput = {
        message: "What documents do I need? How long does this process take? When will I hear back?",
        metadata: {
          platform: 'web',
          timestamp: new Date()
        }
      };

      const result = await conversationalAI.processMessage(questionInput, mockContext);

      // Should identify and potentially track unresolved questions
      expect(result.message).toBeDefined();
      expect(result.nextSteps).toBeDefined();
    });

    it('should handle empty or minimal input', async () => {
      const minimalInput: UserInput = {
        message: "help",
        metadata: {
          platform: 'web',
          timestamp: new Date()
        }
      };

      const result = await conversationalAI.processMessage(minimalInput, mockContext);

      expect(result.message).toBeDefined();
      expect(result.message.length).toBeGreaterThan(10);
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('should handle financial urgency indicators', async () => {
      const urgentInput: UserInput = {
        message: "My foreclosure sale is scheduled for next week! I need to submit my application ASAP!",
        metadata: {
          platform: 'web',
          timestamp: new Date()
        }
      };

      const result = await conversationalAI.processMessage(urgentInput, mockContext);

      expect(result.escalationRequired).toBe(true);
      expect(result.emotionalTone).toBe('empathetic');
      expect(result.suggestedActions).toContainEqual(
        expect.objectContaining({
          type: expect.stringMatching(/escalate|emergency/)
        })
      );
    });

    it('should maintain conversation context across interactions', async () => {
      // First interaction
      const firstInput: UserInput = {
        message: "I submitted my paystubs last week",
        metadata: {
          platform: 'web',
          timestamp: new Date()
        }
      };

      const firstResult = await conversationalAI.processMessage(firstInput, mockContext);
      expect(firstResult).toBeDefined();

      // Second interaction referencing the first
      const secondInput: UserInput = {
        message: "Have you processed those documents yet?",
        metadata: {
          platform: 'web',
          timestamp: new Date()
        }
      };

      const contextWithHistory = {
        ...mockContext,
        interactionCount: 2
      };

      const secondResult = await conversationalAI.processMessage(secondInput, contextWithHistory);
      
      expect(secondResult.message).toBeDefined();
      expect(secondResult.confidence).toBeGreaterThan(0.5);
    });

    it('should handle mixed emotional states appropriately', async () => {
      const mixedEmotionInput: UserInput = {
        message: "I'm frustrated with how long this is taking, but I'm hopeful we can work something out. I trust you to help me.",
        metadata: {
          platform: 'web',
          timestamp: new Date()
        }
      };

      const result = await conversationalAI.processMessage(mixedEmotionInput, mockContext);

      expect(result.emotionalTone).toMatch(/^(empathetic|encouraging|professional)$/);
      expect(result.message).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should generate appropriate next steps based on intent', async () => {
      const statusInput: UserInput = {
        message: "I received a letter from my lender saying they need additional documentation",
        metadata: {
          platform: 'web',
          timestamp: new Date()
        }
      };

      const result = await conversationalAI.processMessage(statusInput, mockContext);

      expect(result.nextSteps).toBeDefined();
      expect(result.nextSteps?.length).toBeGreaterThan(0);
      expect(result.nextSteps?.[0]).toMatch(/document|review|upload|prepare/i);
    });

    it('should handle multiple entities in single message', async () => {
      const entityRichInput: UserInput = {
        message: "My loan number is 1234567890 and I owe $250,000. The payment is due on March 15, 2024.",
        metadata: {
          platform: 'web',
          timestamp: new Date()
        }
      };

      const result = await conversationalAI.processMessage(entityRichInput, mockContext);

      expect(result.message).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0.7);
      // Should reference some of the extracted information
      expect(result.message).toMatch(/loan|amount|date/i);
    });

    it('should provide encouraging responses for hopeful users', async () => {
      const hopefulInput: UserInput = {
        message: "I'm optimistic about this process and believe we can find a good solution together. Thank you for your help!",
        metadata: {
          platform: 'web',
          timestamp: new Date()
        }
      };

      const result = await conversationalAI.processMessage(hopefulInput, mockContext);

      expect(result.emotionalTone).toMatch(/^(encouraging|professional)$/);
      expect(result.message).toMatch(/positive|forward|together|solution/i);
    });
  });

  describe('linguistic marker extraction', () => {
    it('should extract distress markers correctly', () => {
      const engine = conversationalAI as any;
      const markers = engine.extractLinguisticMarkers("I'm desperate and need urgent help with my crisis situation");
      
      const distressMarkers = markers.filter((m: any) => m.type === 'distress');
      expect(distressMarkers.length).toBeGreaterThan(0);
      expect(distressMarkers).toContainEqual(
        expect.objectContaining({
          type: 'distress',
          value: expect.stringMatching(/desperate|urgent|crisis/)
        })
      );
    });

    it('should extract hope markers correctly', () => {
      const engine = conversationalAI as any;
      const markers = engine.extractLinguisticMarkers("I'm hopeful and optimistic about finding a positive solution");
      
      const hopeMarkers = markers.filter((m: any) => m.type === 'hope');
      expect(hopeMarkers.length).toBeGreaterThan(0);
    });

    it('should extract frustration markers correctly', () => {
      const engine = conversationalAI as any;
      const markers = engine.extractLinguisticMarkers("This is so frustrating and ridiculous!");
      
      const frustrationMarkers = markers.filter((m: any) => m.type === 'frustration');
      expect(frustrationMarkers.length).toBeGreaterThan(0);
    });
  });

  describe('conversation summarization', () => {
    it('should generate appropriate conversation summaries', () => {
      const engine = conversationalAI as any;
      const summary = engine.generateConversationSummary(
        mockInput,
        {
          message: "I understand you need help with your mortgage modification...",
          confidence: 0.85,
          emotionalTone: 'empathetic'
        },
        {
          type: 'help_request',
          confidence: 0.9
        }
      );

      expect(summary).toContain('help_request');
      expect(summary).toContain('empathetic');
      expect(summary).toContain('0.85');
      expect(summary.length).toBeLessThan(200); // Should be concise
    });
  });

  describe('error handling and fallbacks', () => {
    it('should handle malformed input gracefully', async () => {
      const malformedInput = {
        message: "",
        metadata: null
      } as any;

      const result = await conversationalAI.processMessage(malformedInput, mockContext);

      expect(result.escalationRequired).toBe(true);
      expect(result.message).toContain('technical difficulties');
    });

    it('should handle missing context gracefully', async () => {
      const incompleteContext = {
        userId: 'user-123',
        caseId: '',
        userRole: '',
        sessionId: 'session-789'
      } as any;

      const result = await conversationalAI.processMessage(mockInput, incompleteContext);

      expect(result).toBeDefined();
      expect(result.message).toBeDefined();
    });
  });

  describe('performance considerations', () => {
    it('should complete processing within reasonable time', async () => {
      const startTime = Date.now();
      
      await conversationalAI.processMessage(mockInput, mockContext);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Should complete within 5 seconds (allowing for mock delays)
      expect(processingTime).toBeLessThan(5000);
    });

    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 5 }, (_, i) => 
        conversationalAI.processMessage({
          ...mockInput,
          message: `Test message ${i}`
        }, {
          ...mockContext,
          userId: `user-${i}`
        })
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.message).toBeDefined();
      });
    });
  });
});

/**
 * @ai-instruction Run tests with: npm test ConversationalAIEngine.test.ts
 * Tests verify all conversation scenarios and error handling
 * Mock implementations provide deterministic behavior for testing
 */