/**
 * @ai-context Learning Pattern Controller for ReAlign 3.0
 * @ai-critical Manages pattern recognition and continuous learning
 * @ai-modifiable true
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { ContinuousLearningPipeline } from '../services/learning/ContinuousLearningPipeline';
import { PatternRecognitionEngine } from '../services/learning/PatternRecognitionEngine';
import { caseMemoryService } from '../services/CaseMemoryService';
import { eq, and, desc, gte, sql } from 'drizzle-orm';
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
const recordPatternSchema = z.object({
  patternType: z.enum(['success_factor', 'failure_indicator', 'servicer_behavior', 'document_requirement', 'timing_optimization', 'emotional_response']),
  description: z.string().min(10),
  conditions: z.record(z.any()),
  observedOutcomes: z.record(z.any()),
  caseIds: z.array(z.string().uuid()).min(1),
  confidence: z.number().min(0).max(1)
});

const patternQuerySchema = z.object({
  patternType: z.enum(['success_factor', 'failure_indicator', 'servicer_behavior', 'document_requirement', 'timing_optimization', 'emotional_response']).optional(),
  minConfidence: z.number().min(0).max(1).default(0.5),
  limit: z.number().min(1).max(100).default(20),
  includeExperimental: z.boolean().default(false)
});

const servicerIntelligenceSchema = z.object({
  servicerId: z.string(),
  intelligenceType: z.enum(['requirement', 'pattern', 'success_factor', 'contact_protocol', 'timing_preference']),
  description: z.string().min(10),
  evidence: z.record(z.any()),
  confidence: z.number().min(0).max(1)
});

const applyLearningSchema = z.object({
  caseId: z.string().uuid(),
  patternIds: z.array(z.string().uuid()).min(1),
  context: z.record(z.any()).optional()
});

/**
 * @ai-purpose Learning pattern and intelligence management controller
 */
export const learningPatternController = {
  /**
   * @api {get} /api/v1/learning/patterns Get learning patterns
   * @apiDescription Retrieves learned patterns from the system
   */
  async getPatterns(req: Request, res: Response) {
    const traceId = `LEARN-GET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${traceId}] Getting learning patterns`);

    try {
      const query = patternQuerySchema.parse(req.query);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Build query conditions
      let conditions = [
        gte(schema.learning_patterns.confidence_score, String(query.minConfidence))
      ];

      if (query.patternType) {
        conditions.push(eq(schema.learning_patterns.pattern_type, query.patternType));
      }

      if (!query.includeExperimental) {
        conditions.push(eq(schema.learning_patterns.human_validated, true));
      }

      // Get patterns
      const patterns = await db
        .select()
        .from(schema.learning_patterns)
        .where(and(...conditions))
        .orderBy(desc(schema.learning_patterns.confidence_score))
        .limit(query.limit);

      // Format patterns
      const formattedPatterns = patterns.map(pattern => ({
        id: pattern.id,
        type: pattern.pattern_type,
        description: pattern.description,
        conditions: JSON.parse(pattern.conditions),
        observedOutcomes: JSON.parse(pattern.observed_outcomes),
        confidence: parseFloat(pattern.confidence_score),
        observationCount: pattern.observation_count,
        supportingCases: pattern.supporting_cases.length,
        contradictingCases: pattern.contradicting_cases.length,
        statisticalSignificance: pattern.statistical_significance ? parseFloat(pattern.statistical_significance) : null,
        correlationStrength: pattern.correlation_strength ? parseFloat(pattern.correlation_strength) : null,
        recommendation: pattern.recommendation_text,
        canAutomate: pattern.automated_action_possible,
        riskLevel: pattern.risk_level,
        validated: pattern.human_validated,
        lastObserved: pattern.last_observed,
        discoveredDate: pattern.discovered_date
      }));

      console.log(`[${traceId}] Retrieved ${formattedPatterns.length} patterns`);

      return res.json({
        patterns: formattedPatterns,
        total: formattedPatterns.length
      });

    } catch (error) {
      console.error(`[${traceId}] Failed to get patterns:`, error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid query parameters',
          details: error.errors 
        });
      }

      return res.status(500).json({ 
        error: 'Failed to retrieve patterns',
        details: error.message 
      });
    }
  },

  /**
   * @api {post} /api/v1/learning/patterns Record new pattern
   * @apiDescription Records a new pattern discovered by the system
   */
  async recordPattern(req: Request, res: Response) {
    const traceId = `LEARN-RECORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${traceId}] Recording new pattern`);

    try {
      const validatedData = recordPatternSchema.parse(req.body);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if similar pattern exists
      const existingPatterns = await db
        .select()
        .from(schema.learning_patterns)
        .where(eq(schema.learning_patterns.pattern_type, validatedData.patternType))
        .limit(10);

      // Use pattern recognition engine to check similarity
      const patternEngine = new PatternRecognitionEngine();
      const similarPattern = await patternEngine.findSimilarPattern(
        validatedData,
        existingPatterns
      );

      if (similarPattern) {
        // Update existing pattern
        const updated = await db
          .update(schema.learning_patterns)
          .set({
            observation_count: sql`${schema.learning_patterns.observation_count} + 1`,
            last_observed: new Date(),
            supporting_cases: sql`array_cat(${schema.learning_patterns.supporting_cases}, ${validatedData.caseIds})`,
            confidence_score: String(
              (parseFloat(similarPattern.confidence_score) * similarPattern.observation_count + validatedData.confidence) / 
              (similarPattern.observation_count + 1)
            )
          })
          .where(eq(schema.learning_patterns.id, similarPattern.id))
          .returning();

        console.log(`[${traceId}] Updated existing pattern ${similarPattern.id}`);

        return res.json({
          patternId: similarPattern.id,
          action: 'updated',
          newObservationCount: updated[0].observation_count
        });

      } else {
        // Create new pattern
        const [newPattern] = await db
          .insert(schema.learning_patterns)
          .values({
            pattern_type: validatedData.patternType,
            description: validatedData.description,
            conditions: JSON.stringify(validatedData.conditions),
            observed_outcomes: JSON.stringify(validatedData.observedOutcomes),
            confidence_score: String(validatedData.confidence),
            observation_count: 1,
            supporting_cases: validatedData.caseIds,
            contradicting_cases: [],
            statistical_significance: '0',
            correlation_strength: String(validatedData.confidence),
            recommendation_text: generateRecommendation(validatedData),
            automated_action_possible: false,
            risk_level: assessRiskLevel(validatedData),
            human_validated: false,
            active_experiment: true
          })
          .returning();

        // Update case memories with new pattern
        for (const caseId of validatedData.caseIds) {
          await caseMemoryService.updateMemory(caseId, {
            type: 'learning',
            data: {
              patterns: [{
                id: newPattern.id,
                type: newPattern.pattern_type,
                description: newPattern.description
              }]
            },
            source: 'pattern_recognition',
            confidence: validatedData.confidence
          });
        }

        console.log(`[${traceId}] Created new pattern ${newPattern.id}`);

        return res.json({
          patternId: newPattern.id,
          action: 'created',
          requiresValidation: true
        });
      }

    } catch (error) {
      console.error(`[${traceId}] Failed to record pattern:`, error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid pattern data',
          details: error.errors 
        });
      }

      return res.status(500).json({ 
        error: 'Failed to record pattern',
        details: error.message 
      });
    }
  },

  /**
   * @api {get} /api/v1/learning/insights/:caseId Get case insights
   * @apiDescription Gets learned insights specific to a case
   */
  async getCaseInsights(req: Request, res: Response) {
    const traceId = `LEARN-INSIGHTS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${traceId}] Getting insights for case ${req.params.caseId}`);

    try {
      const caseId = req.params.caseId;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get case memory
      const memory = await caseMemoryService.getMemory(caseId);
      if (!memory) {
        return res.status(404).json({ error: 'Case not found' });
      }

      // Parse learning data from memory
      const patternMatches = JSON.parse(memory.pattern_matches || '[]');
      const successFactors = JSON.parse(memory.success_factors || '[]');
      const riskIndicators = JSON.parse(memory.risk_indicators || '[]');
      const nextBestActions = JSON.parse(memory.next_best_actions || '[]');

      // Get relevant patterns
      const relevantPatterns = await db
        .select()
        .from(schema.learning_patterns)
        .where(sql`${schema.learning_patterns.supporting_cases} @> ARRAY[${caseId}]::text[]`)
        .orderBy(desc(schema.learning_patterns.confidence_score))
        .limit(10);

      // Get case-specific servicer intelligence
      const [transaction] = await db
        .select()
        .from(schema.transactions)
        .where(eq(schema.transactions.id, caseId))
        .limit(1);

      let servicerInsights = [];
      if (transaction) {
        // This would need a servicer_id field in transactions
        // For now, we'll skip this
      }

      // Generate insights
      const insights = {
        patternBasedRecommendations: relevantPatterns.map(p => ({
          pattern: p.description,
          recommendation: p.recommendation_text,
          confidence: parseFloat(p.confidence_score),
          riskLevel: p.risk_level
        })),
        successFactors: successFactors.slice(0, 5),
        riskIndicators: riskIndicators.slice(0, 5),
        suggestedActions: nextBestActions.slice(0, 5),
        historicalPatterns: {
          totalPatternsMatched: patternMatches.length,
          highConfidenceMatches: patternMatches.filter((p: any) => p.confidence > 0.8).length,
          categories: groupPatternsByType(patternMatches)
        },
        predictiveInsights: await generatePredictiveInsights(memory, relevantPatterns),
        learningProgress: {
          dataPoints: calculateDataPoints(memory),
          confidenceLevel: calculateOverallConfidence(memory),
          lastUpdated: memory.updated_at
        }
      };

      console.log(`[${traceId}] Generated insights for case ${caseId}`);

      return res.json({
        caseId,
        insights
      });

    } catch (error) {
      console.error(`[${traceId}] Failed to get case insights:`, error);
      return res.status(500).json({ 
        error: 'Failed to retrieve case insights',
        details: error.message 
      });
    }
  },

  /**
   * @api {post} /api/v1/learning/servicer-intelligence Record servicer intelligence
   * @apiDescription Records learned intelligence about a specific servicer
   */
  async recordServicerIntelligence(req: Request, res: Response) {
    const traceId = `LEARN-SERVICER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${traceId}] Recording servicer intelligence`);

    try {
      const validatedData = servicerIntelligenceSchema.parse(req.body);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check for existing intelligence
      const existing = await db
        .select()
        .from(schema.servicer_intelligence)
        .where(and(
          eq(schema.servicer_intelligence.servicer_id, validatedData.servicerId),
          eq(schema.servicer_intelligence.intelligence_type, validatedData.intelligenceType)
        ))
        .limit(1);

      if (existing.length > 0) {
        // Update existing intelligence
        const [updated] = await db
          .update(schema.servicer_intelligence)
          .set({
            last_observed: new Date(),
            occurrence_count: sql`${schema.servicer_intelligence.occurrence_count} + 1`,
            confidence_score: String(
              (parseFloat(existing[0].confidence_score) * existing[0].occurrence_count + validatedData.confidence) / 
              (existing[0].occurrence_count + 1)
            ),
            evidence: JSON.stringify({
              ...JSON.parse(existing[0].evidence || '{}'),
              ...validatedData.evidence
            })
          })
          .where(eq(schema.servicer_intelligence.id, existing[0].id))
          .returning();

        console.log(`[${traceId}] Updated servicer intelligence ${existing[0].id}`);

        return res.json({
          intelligenceId: existing[0].id,
          action: 'updated',
          newOccurrenceCount: updated[0].occurrence_count
        });

      } else {
        // Create new intelligence
        const [newIntelligence] = await db
          .insert(schema.servicer_intelligence)
          .values({
            servicer_id: validatedData.servicerId,
            intelligence_type: validatedData.intelligenceType,
            description: validatedData.description,
            evidence: JSON.stringify(validatedData.evidence),
            confidence_score: String(validatedData.confidence),
            occurrence_count: 1,
            human_verified: false,
            success_rate_impact: '0',
            time_saved_hours: '0',
            cases_helped: 0
          })
          .returning();

        console.log(`[${traceId}] Created new servicer intelligence ${newIntelligence[0].id}`);

        return res.json({
          intelligenceId: newIntelligence[0].id,
          action: 'created'
        });
      }

    } catch (error) {
      console.error(`[${traceId}] Failed to record servicer intelligence:`, error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid intelligence data',
          details: error.errors 
        });
      }

      return res.status(500).json({ 
        error: 'Failed to record servicer intelligence',
        details: error.message 
      });
    }
  },

  /**
   * @api {get} /api/v1/learning/servicer/:servicerId Get servicer intelligence
   * @apiDescription Gets all learned intelligence about a servicer
   */
  async getServicerIntelligence(req: Request, res: Response) {
    const traceId = `LEARN-GET-SERVICER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${traceId}] Getting intelligence for servicer ${req.params.servicerId}`);

    try {
      const servicerId = req.params.servicerId;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get all intelligence for servicer
      const intelligence = await db
        .select()
        .from(schema.servicer_intelligence)
        .where(eq(schema.servicer_intelligence.servicer_id, servicerId))
        .orderBy(desc(schema.servicer_intelligence.confidence_score));

      // Group by type
      const grouped = {
        requirements: intelligence.filter(i => i.intelligence_type === 'requirement'),
        patterns: intelligence.filter(i => i.intelligence_type === 'pattern'),
        successFactors: intelligence.filter(i => i.intelligence_type === 'success_factor'),
        contactProtocols: intelligence.filter(i => i.intelligence_type === 'contact_protocol'),
        timingPreferences: intelligence.filter(i => i.intelligence_type === 'timing_preference')
      };

      // Calculate aggregate metrics
      const metrics = {
        totalIntelligencePoints: intelligence.length,
        averageConfidence: intelligence.reduce((sum, i) => sum + parseFloat(i.confidence_score), 0) / intelligence.length || 0,
        verifiedCount: intelligence.filter(i => i.human_verified).length,
        totalCasesHelped: intelligence.reduce((sum, i) => sum + i.cases_helped, 0),
        estimatedTimeSaved: intelligence.reduce((sum, i) => sum + parseFloat(i.time_saved_hours), 0)
      };

      console.log(`[${traceId}] Retrieved ${intelligence.length} intelligence points`);

      return res.json({
        servicerId,
        intelligence: grouped,
        metrics
      });

    } catch (error) {
      console.error(`[${traceId}] Failed to get servicer intelligence:`, error);
      return res.status(500).json({ 
        error: 'Failed to retrieve servicer intelligence',
        details: error.message 
      });
    }
  },

  /**
   * @api {post} /api/v1/learning/apply Apply learning to case
   * @apiDescription Applies learned patterns to a specific case
   */
  async applyLearningToCase(req: Request, res: Response) {
    const traceId = `LEARN-APPLY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${traceId}] Applying learning to case`);

    try {
      const validatedData = applyLearningSchema.parse(req.body);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get patterns
      const patterns = await db
        .select()
        .from(schema.learning_patterns)
        .where(sql`${schema.learning_patterns.id} = ANY(${validatedData.patternIds})`);

      if (patterns.length === 0) {
        return res.status(404).json({ error: 'No patterns found' });
      }

      // Initialize learning pipeline
      const learningPipeline = new ContinuousLearningPipeline();

      // Apply patterns to case
      const applications = [];
      for (const pattern of patterns) {
        const result = await learningPipeline.applyPattern({
          pattern,
          caseId: validatedData.caseId,
          context: validatedData.context || {}
        });

        applications.push({
          patternId: pattern.id,
          patternType: pattern.pattern_type,
          applied: result.success,
          actions: result.actions,
          confidence: result.confidence
        });
      }

      // Update case memory with applied patterns
      await caseMemoryService.updateMemory(validatedData.caseId, {
        type: 'learning',
        data: {
          appliedPatterns: applications.filter(a => a.applied),
          suggestedActions: applications.flatMap(a => a.actions || [])
        },
        source: 'pattern_application',
        confidence: applications.reduce((sum, a) => sum + a.confidence, 0) / applications.length
      });

      console.log(`[${traceId}] Applied ${applications.filter(a => a.applied).length} patterns`);

      return res.json({
        caseId: validatedData.caseId,
        patternsApplied: applications.filter(a => a.applied).length,
        totalPatterns: patterns.length,
        applications
      });

    } catch (error) {
      console.error(`[${traceId}] Failed to apply learning:`, error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid request data',
          details: error.errors 
        });
      }

      return res.status(500).json({ 
        error: 'Failed to apply learning',
        details: error.message 
      });
    }
  }
};

// Helper functions
function generateRecommendation(pattern: any): string {
  const typeRecommendations = {
    success_factor: `When conditions match (${Object.keys(pattern.conditions).join(', ')}), apply this success factor to increase positive outcomes.`,
    failure_indicator: `Monitor for these conditions (${Object.keys(pattern.conditions).join(', ')}) to prevent negative outcomes.`,
    servicer_behavior: `Servicer typically exhibits this behavior. Adjust approach accordingly.`,
    document_requirement: `These documents are typically required under these conditions.`,
    timing_optimization: `Optimal timing identified for this action based on observed patterns.`,
    emotional_response: `User emotional state indicates need for adjusted communication approach.`
  };

  return typeRecommendations[pattern.patternType] || 'Apply this pattern when similar conditions are met.';
}

function assessRiskLevel(pattern: any): 'low' | 'medium' | 'high' {
  if (pattern.patternType === 'failure_indicator') return 'high';
  if (pattern.confidence < 0.6) return 'medium';
  if (pattern.patternType === 'success_factor' && pattern.confidence > 0.8) return 'low';
  return 'medium';
}

function groupPatternsByType(patterns: any[]): Record<string, number> {
  return patterns.reduce((acc, pattern) => {
    acc[pattern.type] = (acc[pattern.type] || 0) + 1;
    return acc;
  }, {});
}

async function generatePredictiveInsights(memory: any, patterns: any[]): Promise<any> {
  // This would use ML models to generate predictions
  // For now, return basic predictions based on patterns
  return {
    successProbability: patterns.filter(p => p.pattern_type === 'success_factor').length > 3 ? 0.75 : 0.5,
    estimatedCompletionTime: '14-21 days',
    recommendedNextAction: patterns[0]?.recommendation_text || 'Continue current approach',
    potentialRisks: patterns.filter(p => p.pattern_type === 'failure_indicator').map(p => p.description)
  };
}

function calculateDataPoints(memory: any): number {
  let points = 0;
  points += memory.total_conversations || 0;
  points += memory.documents_collected || 0;
  points += JSON.parse(memory.servicer_interactions || '[]').length;
  points += JSON.parse(memory.pattern_matches || '[]').length;
  return points;
}

function calculateOverallConfidence(memory: any): number {
  const factors = [];
  
  if (memory.total_conversations > 5) factors.push(0.9);
  if (memory.documents_collected > 3) factors.push(0.85);
  if (JSON.parse(memory.pattern_matches || '[]').length > 10) factors.push(0.8);
  
  return factors.length > 0 ? factors.reduce((a, b) => a + b) / factors.length : 0.5;
}