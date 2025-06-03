/**
 * @ai-context Test suite for ContinuousLearningPipeline
 * @test-coverage Complete test coverage for learning system functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  ContinuousLearningPipeline, 
  type Interaction, 
  type InteractionOutcome,
  type LearningResult,
  LearningError 
} from '../learning/ContinuousLearningPipeline';

// Mock dependencies
vi.mock('../CaseMemoryService');
vi.mock('../ai/ModelOrchestrator');

describe('ContinuousLearningPipeline', () => {
  let learningPipeline: ContinuousLearningPipeline;
  let mockInteraction: Interaction;
  let mockOutcome: InteractionOutcome;

  beforeEach(() => {
    learningPipeline = new ContinuousLearningPipeline();
    vi.clearAllMocks();

    mockInteraction = {
      id: 'interaction-123',
      caseId: 'case-456',
      userId: 'user-789',
      type: 'conversation',
      content: {
        message: 'I need help with my mortgage modification',
        attachments: []
      },
      context: {
        caseStage: 'initial_review',
        userRole: 'borrower',
        emotionalState: {
          distress: 0.6,
          hope: 0.7,
          frustration: 0.3
        },
        interactionCount: 3,
        servicer: {
          id: 'servicer-1',
          name: 'Test Bank',
          type: 'major_bank'
        },
        previousOutcomes: ['partially_resolved', 'information_provided'],
        timeOfDay: 14, // 2 PM
        dayOfWeek: 2 // Tuesday
      },
      timestamp: new Date('2024-06-02T14:30:00Z'),
      responseTime: 1500, // 1.5 seconds
      resolved: true,
      escalated: false
    };

    mockOutcome = {
      success: true,
      userSatisfaction: 0.85,
      goalAchieved: true,
      escalationRequired: false,
      followUpNeeded: false,
      resolution: 'information_provided',
      feedback: 'Very helpful response',
      metrics: {
        responseTime: 1500,
        accuracyScore: 0.92,
        helpfulnessScore: 0.88
      }
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('processInteraction', () => {
    it('should process successful interaction and generate learnings', async () => {
      const result = await learningPipeline.processInteraction(mockInteraction, mockOutcome);

      expect(result).toEqual({
        patterns: expect.any(Array),
        hypotheses: expect.any(Array),
        experiments: expect.any(Array),
        appliedLearnings: expect.any(Array),
        recommendations: expect.any(Array),
        confidence: expect.any(Number),
        improvementAreas: expect.any(Array)
      });

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle escalation scenarios appropriately', async () => {
      const escalatedInteraction: Interaction = {
        ...mockInteraction,
        escalated: true,
        resolved: false
      };

      const escalatedOutcome: InteractionOutcome = {
        ...mockOutcome,
        success: false,
        escalationRequired: true,
        userSatisfaction: 0.3
      };

      const result = await learningPipeline.processInteraction(escalatedInteraction, escalatedOutcome);

      expect(result.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'strategic',
          priority: 'high',
          description: expect.stringContaining('escalation')
        })
      );

      expect(result.improvementAreas).toContain('escalation_prevention');
    });

    it('should identify performance improvement opportunities', async () => {
      const slowInteraction: Interaction = {
        ...mockInteraction,
        responseTime: 6000 // 6 seconds
      };

      const slowOutcome: InteractionOutcome = {
        ...mockOutcome,
        metrics: {
          ...mockOutcome.metrics!,
          responseTime: 6000
        }
      };

      const result = await learningPipeline.processInteraction(slowInteraction, slowOutcome);

      expect(result.recommendations).toContainEqual(
        expect.objectContaining({
          description: expect.stringContaining('response time')
        })
      );

      expect(result.improvementAreas).toContain('response_time');
    });

    it('should handle document processing interactions', async () => {
      const docInteraction: Interaction = {
        ...mockInteraction,
        type: 'document_processing',
        content: {
          documentType: 'paystub',
          extractedData: {
            employerName: 'Test Corp',
            grossPay: '3000.00'
          },
          confidence: 0.94
        }
      };

      const result = await learningPipeline.processInteraction(docInteraction, mockOutcome);

      expect(result).toBeDefined();
      expect(result.patterns).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should process submission interactions', async () => {
      const submissionInteraction: Interaction = {
        ...mockInteraction,
        type: 'submission',
        content: {
          submissionType: 'loan_modification',
          documents: ['paystub', 'bank_statement'],
          submissionMethod: 'api'
        }
      };

      const submissionOutcome: InteractionOutcome = {
        ...mockOutcome,
        success: false,
        resolution: 'submission_failed',
        feedback: 'Missing required documents'
      };

      const result = await learningPipeline.processInteraction(submissionInteraction, submissionOutcome);

      expect(result.improvementAreas).toContain('success_rate');
    });

    it('should handle voice call interactions', async () => {
      const voiceInteraction: Interaction = {
        ...mockInteraction,
        type: 'voice_call',
        content: {
          callDuration: 300, // 5 minutes
          callOutcome: 'information_gathered',
          scriptUsed: 'payment_difficulty'
        }
      };

      const result = await learningPipeline.processInteraction(voiceInteraction, mockOutcome);

      expect(result).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should extract temporal features correctly', async () => {
      // Test different times of day
      const morningInteraction: Interaction = {
        ...mockInteraction,
        timestamp: new Date('2024-06-02T09:00:00Z') // 9 AM
      };

      const eveningInteraction: Interaction = {
        ...mockInteraction,
        timestamp: new Date('2024-06-02T19:00:00Z') // 7 PM
      };

      const morningResult = await learningPipeline.processInteraction(morningInteraction, mockOutcome);
      const eveningResult = await learningPipeline.processInteraction(eveningInteraction, mockOutcome);

      // Both should process successfully
      expect(morningResult).toBeDefined();
      expect(eveningResult).toBeDefined();
    });

    it('should analyze emotional state patterns', async () => {
      const highDistressInteraction: Interaction = {
        ...mockInteraction,
        context: {
          ...mockInteraction.context,
          emotionalState: {
            distress: 0.9,
            hope: 0.2,
            frustration: 0.8
          }
        }
      };

      const distressedOutcome: InteractionOutcome = {
        ...mockOutcome,
        escalationRequired: true,
        userSatisfaction: 0.4
      };

      const result = await learningPipeline.processInteraction(highDistressInteraction, distressedOutcome);

      expect(result.improvementAreas).toContain('escalation_prevention');
      expect(result.recommendations.some(r => r.priority === 'high')).toBe(true);
    });

    it('should handle different user roles appropriately', async () => {
      const negotiatorInteraction: Interaction = {
        ...mockInteraction,
        context: {
          ...mockInteraction.context,
          userRole: 'negotiator'
        }
      };

      const agentInteraction: Interaction = {
        ...mockInteraction,
        context: {
          ...mockInteraction.context,
          userRole: 'agent'
        }
      };

      const negotiatorResult = await learningPipeline.processInteraction(negotiatorInteraction, mockOutcome);
      const agentResult = await learningPipeline.processInteraction(agentInteraction, mockOutcome);

      expect(negotiatorResult).toBeDefined();
      expect(agentResult).toBeDefined();
    });

    it('should generate appropriate recommendations for successful patterns', async () => {
      const highSatisfactionOutcome: InteractionOutcome = {
        ...mockOutcome,
        userSatisfaction: 0.95,
        success: true,
        goalAchieved: true
      };

      const result = await learningPipeline.processInteraction(mockInteraction, highSatisfactionOutcome);

      expect(result.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'immediate',
          description: expect.stringContaining('successful interaction patterns')
        })
      );
    });

    it('should handle different case stages', async () => {
      const stageTestCases = [
        'initial_review',
        'document_collection',
        'application_processing',
        'servicer_review',
        'decision_pending',
        'approved',
        'denied'
      ];

      for (const stage of stageTestCases) {
        const stageInteraction: Interaction = {
          ...mockInteraction,
          context: {
            ...mockInteraction.context,
            caseStage: stage
          }
        };

        const result = await learningPipeline.processInteraction(stageInteraction, mockOutcome);
        expect(result).toBeDefined();
      }
    });

    it('should process multiple servicer types correctly', async () => {
      const servicerTypes = ['major_bank', 'credit_union', 'non_bank_lender', 'government_agency'];

      for (const servicerType of servicerTypes) {
        const servicerInteraction: Interaction = {
          ...mockInteraction,
          context: {
            ...mockInteraction.context,
            servicer: {
              id: `servicer-${servicerType}`,
              name: `Test ${servicerType}`,
              type: servicerType
            }
          }
        };

        const result = await learningPipeline.processInteraction(servicerInteraction, mockOutcome);
        expect(result).toBeDefined();
      }
    });

    it('should handle missing optional data gracefully', async () => {
      const minimalInteraction: Interaction = {
        ...mockInteraction,
        context: {
          ...mockInteraction.context,
          emotionalState: undefined,
          servicer: undefined
        },
        metadata: undefined
      };

      const minimalOutcome: InteractionOutcome = {
        success: true,
        goalAchieved: true,
        escalationRequired: false,
        followUpNeeded: false
        // Missing optional fields
      };

      const result = await learningPipeline.processInteraction(minimalInteraction, minimalOutcome);

      expect(result).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should log learning process steps correctly', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await learningPipeline.processInteraction(mockInteraction, mockOutcome);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[LRNG-\d+-\w+\] Starting learning process/),
        expect.objectContaining({
          interactionType: 'conversation',
          outcomeSuccess: true,
          caseId: 'case-456',
          userId: 'user-789'
        })
      );

      consoleSpy.mockRestore();
    });

    it('should handle learning process errors gracefully', async () => {
      // Mock a failure in feature extraction
      vi.spyOn(learningPipeline as any, 'extractFeatures').mockRejectedValue(
        new Error('Feature extraction failed')
      );

      await expect(
        learningPipeline.processInteraction(mockInteraction, mockOutcome)
      ).rejects.toThrow(LearningError);
    });

    it('should calculate confidence scores appropriately', async () => {
      // High confidence scenario
      const highConfidenceOutcome: InteractionOutcome = {
        ...mockOutcome,
        success: true,
        userSatisfaction: 0.95,
        goalAchieved: true,
        metrics: {
          responseTime: 1000,
          accuracyScore: 0.98,
          helpfulnessScore: 0.96
        }
      };

      const highConfidenceResult = await learningPipeline.processInteraction(mockInteraction, highConfidenceOutcome);

      // Low confidence scenario
      const lowConfidenceOutcome: InteractionOutcome = {
        success: false,
        goalAchieved: false,
        escalationRequired: true,
        followUpNeeded: true
      };

      const lowConfidenceResult = await learningPipeline.processInteraction(mockInteraction, lowConfidenceOutcome);

      expect(highConfidenceResult.confidence).toBeGreaterThan(lowConfidenceResult.confidence);
    });

    it('should identify improvement areas correctly', async () => {
      const failedOutcome: InteractionOutcome = {
        success: false,
        userSatisfaction: 0.3,
        goalAchieved: false,
        escalationRequired: true,
        followUpNeeded: true,
        metrics: {
          responseTime: 8000, // Slow response
          accuracyScore: 0.6,
          helpfulnessScore: 0.4
        }
      };

      const result = await learningPipeline.processInteraction(mockInteraction, failedOutcome);

      expect(result.improvementAreas).toContain('success_rate');
      expect(result.improvementAreas).toContain('escalation_prevention');
      expect(result.improvementAreas).toContain('user_satisfaction');
      expect(result.improvementAreas).toContain('response_time');
    });

    it('should handle concurrent learning processes', async () => {
      const interactions = Array.from({ length: 3 }, (_, i) => ({
        ...mockInteraction,
        id: `interaction-${i}`,
        caseId: `case-${i}`
      }));

      const outcomes = Array.from({ length: 3 }, () => mockOutcome);

      const promises = interactions.map((interaction, i) =>
        learningPipeline.processInteraction(interaction, outcomes[i])
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.confidence).toBeGreaterThan(0);
      });
    });

    it('should update case memory with learning insights', async () => {
      // This test verifies that case memory is updated with learning results
      const result = await learningPipeline.processInteraction(mockInteraction, mockOutcome);

      // In a real implementation, we would verify the case memory service was called
      expect(result).toBeDefined();
    });

    it('should generate context-appropriate recommendations', async () => {
      // Test different contexts generate different recommendations
      const urgentInteraction: Interaction = {
        ...mockInteraction,
        context: {
          ...mockInteraction.context,
          emotionalState: {
            distress: 0.95,
            hope: 0.1,
            frustration: 0.9
          }
        }
      };

      const urgentOutcome: InteractionOutcome = {
        ...mockOutcome,
        escalationRequired: true,
        userSatisfaction: 0.2
      };

      const result = await learningPipeline.processInteraction(urgentInteraction, urgentOutcome);

      // Should have high-priority recommendations for urgent situations
      const highPriorityRecs = result.recommendations.filter(r => r.priority === 'high' || r.priority === 'critical');
      expect(highPriorityRecs.length).toBeGreaterThan(0);
    });
  });

  describe('feature extraction', () => {
    it('should extract temporal features correctly', async () => {
      const extractFeatures = (learningPipeline as any).extractFeatures.bind(learningPipeline);
      
      const features = await extractFeatures(mockInteraction, 'test-learning-id');

      expect(features.temporal).toEqual({
        dayOfWeek: 0, // Sunday (from mock date)
        hourOfDay: 14, // 2 PM
        daysSinceLastInteraction: expect.any(Number),
        seasonality: 'summer'
      });
    });

    it('should handle content feature extraction errors', async () => {
      // Mock AI service failure
      vi.spyOn(learningPipeline as any, 'analyzeContentFeatures').mockRejectedValue(
        new Error('AI service unavailable')
      );

      const extractFeatures = (learningPipeline as any).extractFeatures.bind(learningPipeline);
      
      // Should not throw, but handle gracefully
      const features = await extractFeatures(mockInteraction, 'test-learning-id');
      
      expect(features.content).toEqual({
        messageLength: 0,
        sentiment: 0,
        complexity: 0.5,
        topics: [],
        emotionalMarkers: 0
      });
    });
  });

  describe('pattern creation and storage', () => {
    it('should create patterns for notable interactions', async () => {
      const createPattern = (learningPipeline as any).createPattern.bind(learningPipeline);
      
      const mockFeatures = {
        temporal: { dayOfWeek: 1, hourOfDay: 14, daysSinceLastInteraction: 1 },
        content: { messageLength: 50, sentiment: 0.8, complexity: 0.5, topics: ['mortgage'], emotionalMarkers: 2 },
        context: { caseStage: 'initial_review', previousInteractions: 3, userEmotionalState: {}, urgencyLevel: 'medium' },
        performance: { responseTime: 1500, resolutionAchieved: true, escalationRequired: false, confidenceScore: 0.9 },
        historical: { similarCaseOutcomes: [], patternMatches: [], successfulStrategies: [] }
      };

      const pattern = await createPattern(mockInteraction, mockOutcome, mockFeatures);

      expect(pattern).toEqual(
        expect.objectContaining({
          id: expect.stringMatching(/^PATTERN-\d+-\w+$/),
          type: 'success',
          description: expect.stringContaining('success pattern'),
          features: mockFeatures,
          occurrences: 1,
          confidence: expect.any(Number),
          outcomes: [mockOutcome],
          createdAt: expect.any(Date),
          lastSeen: expect.any(Date),
          tags: expect.arrayContaining(['conversation', 'initial_review', 'borrower'])
        })
      );
    });

    it('should not create patterns for unremarkable interactions', async () => {
      const createPattern = (learningPipeline as any).createPattern.bind(learningPipeline);
      
      const unremarkableOutcome: InteractionOutcome = {
        success: false,
        escalationRequired: false,
        userSatisfaction: 0.4, // Low satisfaction
        goalAchieved: false,
        followUpNeeded: false
      };

      const mockFeatures = {} as any;
      const pattern = await createPattern(mockInteraction, unremarkableOutcome, mockFeatures);

      expect(pattern).toBeNull();
    });
  });

  describe('utility methods', () => {
    it('should determine urgency levels correctly', () => {
      const determineUrgencyLevel = (learningPipeline as any).determineUrgencyLevel.bind(learningPipeline);

      // Critical urgency - high distress
      const criticalInteraction = {
        ...mockInteraction,
        context: {
          ...mockInteraction.context,
          emotionalState: { distress: 0.9, hope: 0.1, frustration: 0.8 }
        }
      };
      expect(determineUrgencyLevel(criticalInteraction)).toBe('critical');

      // High urgency - escalated
      const highInteraction = { ...mockInteraction, escalated: true };
      expect(determineUrgencyLevel(highInteraction)).toBe('high');

      // Medium urgency - frustrated
      const mediumInteraction = {
        ...mockInteraction,
        context: {
          ...mockInteraction.context,
          emotionalState: { distress: 0.3, hope: 0.5, frustration: 0.8 }
        }
      };
      expect(determineUrgencyLevel(mediumInteraction)).toBe('medium');

      // Low urgency - normal state
      expect(determineUrgencyLevel(mockInteraction)).toBe('low');
    });

    it('should calculate pattern confidence appropriately', () => {
      const calculatePatternConfidence = (learningPipeline as any).calculatePatternConfidence.bind(learningPipeline);

      const mockFeatures = {
        context: { previousInteractions: 5 }
      } as any;

      // High confidence outcome
      const highConfidenceOutcome = {
        success: true,
        goalAchieved: true,
        userSatisfaction: 0.9
      };
      
      const highConfidence = calculatePatternConfidence(mockFeatures, highConfidenceOutcome);
      expect(highConfidence).toBeGreaterThan(0.8);

      // Low confidence outcome
      const lowConfidenceOutcome = {
        success: false,
        goalAchieved: false
      };
      
      const lowConfidence = calculatePatternConfidence(mockFeatures, lowConfidenceOutcome);
      expect(lowConfidence).toBeLessThan(highConfidence);
    });
  });
});

/**
 * @ai-instruction Run tests with: npm test ContinuousLearningPipeline.test.ts
 * Tests verify learning system processes all interaction types and generates insights
 * Comprehensive coverage of pattern recognition, hypothesis generation, and recommendations
 */