/**
 * @ai-context Learns and adapts to each servicer's requirements
 * @ai-learning Updates patterns based on every interaction
 */

import { db } from '@/server/db';
import { servicer_intelligence, learning_patterns, intelligenceTypeEnum } from '@/shared/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { Logger } from '../logger';

export interface Submission {
  id: string;
  servicerId: string;
  type: string;
  documents: { type: string; format: string; size: number }[];
  submittedAt: Date;
  metadata?: Record<string, any>;
}

export interface SubmissionOutcome {
  status: 'accepted' | 'rejected' | 'pending' | 'requires_changes';
  respondedAt: Date;
  feedback?: string;
  requiredChanges?: string[];
  processingTime?: number;
}

export interface Pattern {
  id?: string;
  type: string;
  pattern: any;
  confidence: number;
  occurrences: number;
  lastSeen?: Date;
  metadata?: Record<string, any>;
}

export interface ServicerIntelligenceData {
  servicerId: string;
  requirements: Record<string, any>;
  patterns: Pattern[];
  successRate: number;
  averageResponseTime: number;
  lastUpdated: Date;
}

export interface LearnedInsights {
  patterns: Pattern[];
  updates: {
    confidenceChange: number;
    newRequirements: string[];
    updatedPatterns: number;
  };
  recommendations: string[];
}

export class ServicerIntelligenceEngine {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ServicerIntelligenceEngine');
  }

  /**
   * @ai-purpose Learn from submission outcome
   * @debug Log all learned patterns and confidence changes
   */
  async learnFromSubmission(
    submission: Submission,
    outcome: SubmissionOutcome
  ): Promise<LearnedInsights> {
    const learningId = `LEARN-${submission.servicerId}-${Date.now()}`;
    
    this.logger.info(`[${learningId}] Starting learning process`, {
      servicer: submission.servicerId,
      submissionType: submission.type,
      outcome: outcome.status
    });
    
    try {
      // Extract patterns from successful submission
      const patterns = await this.extractPatterns(submission, outcome);
      
      // Store patterns as intelligence
      const updates = await this.storePatterns(submission.servicerId, patterns, outcome);
      
      this.logger.info(`[${learningId}] Learning completed`, {
        patternsFound: patterns.length,
        confidenceChange: updates.confidenceChange,
        newRequirements: updates.newRequirements
      });
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(submission.servicerId);
      
      return {
        patterns,
        updates,
        recommendations
      };
      
    } catch (error) {
      this.logger.error(`[${learningId}] Learning failed`, error);
      throw error;
    }
  }

  /**
   * @ai-purpose Extract actionable patterns from submission
   */
  private async extractPatterns(
    submission: Submission,
    outcome: SubmissionOutcome
  ): Promise<Pattern[]> {
    const patterns: Pattern[] = [];
    
    // Document order patterns (only for accepted submissions)
    if (outcome.status === 'accepted') {
      patterns.push({
        type: 'document_order',
        pattern: submission.documents.map(d => d.type),
        confidence: 0.9,
        occurrences: 1,
        lastSeen: new Date()
      });
      
      // Document format preferences
      const formatPattern = submission.documents.reduce((acc, doc) => {
        acc[doc.type] = doc.format;
        return acc;
      }, {} as Record<string, string>);
      
      patterns.push({
        type: 'document_format',
        pattern: formatPattern,
        confidence: 0.85,
        occurrences: 1,
        lastSeen: new Date()
      });
    }
    
    // Timing patterns
    const dayOfWeek = submission.submittedAt.getDay();
    const hourOfDay = submission.submittedAt.getHours();
    const responseTime = outcome.respondedAt.getTime() - submission.submittedAt.getTime();
    
    patterns.push({
      type: 'submission_timing',
      pattern: {
        dayOfWeek,
        hourOfDay,
        responseTime
      },
      confidence: 0.7,
      occurrences: 1,
      lastSeen: new Date(),
      metadata: {
        outcomeStatus: outcome.status
      }
    });
    
    // Required changes patterns
    if (outcome.requiredChanges && outcome.requiredChanges.length > 0) {
      patterns.push({
        type: 'common_issues',
        pattern: outcome.requiredChanges,
        confidence: 0.9,
        occurrences: 1,
        lastSeen: new Date(),
        metadata: {
          submissionType: submission.type
        }
      });
    }
    
    return patterns;
  }

  /**
   * @ai-purpose Store patterns as servicer intelligence
   */
  private async storePatterns(
    servicerId: string,
    patterns: Pattern[],
    outcome: SubmissionOutcome
  ): Promise<{ confidenceChange: number; newRequirements: string[]; updatedPatterns: number }> {
    let confidenceChange = 0;
    const newRequirements: string[] = [];
    let updatedPatterns = 0;

    for (const pattern of patterns) {
      // Check if similar intelligence exists
      const existing = await db.query.servicer_intelligence.findFirst({
        where: and(
          eq(servicer_intelligence.servicer_id, servicerId),
          eq(servicer_intelligence.description, JSON.stringify(pattern.pattern))
        )
      });

      if (existing) {
        // Update existing intelligence
        const oldConfidence = parseFloat(existing.confidence_score);
        const newConfidence = Math.min(0.99, oldConfidence + (1 - oldConfidence) * 0.1);
        
        await db
          .update(servicer_intelligence)
          .set({
            confidence_score: newConfidence.toString(),
            occurrence_count: (existing.occurrence_count || 0) + 1,
            last_observed: new Date(),
            evidence: JSON.stringify({
              ...JSON.parse(existing.evidence || '{}'),
              [new Date().toISOString()]: outcome
            })
          })
          .where(eq(servicer_intelligence.id, existing.id));

        confidenceChange += newConfidence - oldConfidence;
        updatedPatterns++;
      } else {
        // Create new intelligence
        const intelligenceType = this.mapPatternToIntelligenceType(pattern.type);
        
        await db.insert(servicer_intelligence).values({
          servicer_id: servicerId,
          intelligence_type: intelligenceType,
          description: `${pattern.type}: ${JSON.stringify(pattern.pattern)}`,
          evidence: JSON.stringify({
            [new Date().toISOString()]: outcome
          }),
          confidence_score: pattern.confidence.toString(),
          occurrence_count: 1,
          impact_score: this.calculateImpactScore(pattern, outcome)
        });

        newRequirements.push(`New ${pattern.type} pattern discovered`);
      }
    }

    // Store in learning patterns for analysis
    if (patterns.length > 0) {
      await db.insert(learning_patterns).values({
        case_id: servicerId, // Using servicer_id as case_id for now
        pattern_type: 'servicer_behavior',
        pattern_data: patterns,
        confidence_score: patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length,
        occurrence_count: 1,
        success_impact: outcome.status === 'accepted' ? 1.0 : 0.0
      });
    }

    return {
      confidenceChange,
      newRequirements,
      updatedPatterns
    };
  }

  /**
   * @ai-purpose Map pattern type to intelligence type enum
   */
  private mapPatternToIntelligenceType(patternType: string): 'requirement' | 'pattern' | 'success_factor' | 'contact_protocol' | 'timing_preference' {
    switch (patternType) {
      case 'document_order':
      case 'document_format':
      case 'common_issues':
        return 'requirement';
      case 'submission_timing':
        return 'timing_preference';
      default:
        return 'pattern';
    }
  }

  /**
   * @ai-purpose Calculate impact score for intelligence
   */
  private calculateImpactScore(pattern: Pattern, outcome: SubmissionOutcome): string {
    let score = 0.5; // Base score

    // Successful outcomes have higher impact
    if (outcome.status === 'accepted') {
      score += 0.3;
    }

    // High confidence patterns have higher impact
    score += pattern.confidence * 0.2;

    return score.toFixed(2);
  }

  /**
   * @ai-purpose Generate recommendations based on intelligence
   */
  async generateRecommendations(servicerId: string): Promise<string[]> {
    const recommendations: string[] = [];

    // Get all intelligence for this servicer
    const intelligence = await db.query.servicer_intelligence.findMany({
      where: eq(servicer_intelligence.servicer_id, servicerId),
      orderBy: [desc(servicer_intelligence.confidence_score)]
    });

    // Document order recommendations
    const orderIntel = intelligence.find(i => 
      i.intelligence_type === 'requirement' && 
      i.description.includes('document_order')
    );
    
    if (orderIntel && parseFloat(orderIntel.confidence_score) > 0.8) {
      try {
        const pattern = JSON.parse(orderIntel.description.split(': ')[1]);
        recommendations.push(`Recommended document order: ${pattern.join(' → ')}`);
      } catch (e) {
        this.logger.warn('Failed to parse document order pattern', e);
      }
    }

    // Timing recommendations
    const timingIntel = intelligence.filter(i => 
      i.intelligence_type === 'timing_preference'
    );
    
    if (timingIntel.length > 0) {
      const avgTiming = this.calculateAverageTimingPreference(timingIntel);
      if (avgTiming) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        recommendations.push(
          `Best submission time: ${dayNames[avgTiming.dayOfWeek]} around ${avgTiming.hourOfDay}:00`
        );
      }
    }

    // Common issues to avoid
    const issueIntel = intelligence.filter(i => 
      i.description.includes('common_issues')
    );
    
    if (issueIntel.length > 0) {
      const allIssues: string[] = [];
      for (const intel of issueIntel) {
        try {
          const pattern = JSON.parse(intel.description.split(': ')[1]);
          allIssues.push(...pattern);
        } catch (e) {
          this.logger.warn('Failed to parse issues pattern', e);
        }
      }
      
      if (allIssues.length > 0) {
        const uniqueIssues = [...new Set(allIssues)];
        recommendations.push(`Common issues to avoid: ${uniqueIssues.join(', ')}`);
      }
    }

    // Success rate based on patterns
    const successCount = intelligence.filter(i => 
      i.evidence?.includes('"status":"accepted"')
    ).length;
    
    const totalCount = intelligence.length;
    if (totalCount > 0) {
      const successRate = (successCount / totalCount * 100).toFixed(1);
      recommendations.push(`Current success rate with this servicer: ${successRate}%`);
    }

    return recommendations;
  }

  /**
   * @ai-purpose Calculate average timing preference
   */
  private calculateAverageTimingPreference(
    timingIntelligence: any[]
  ): { dayOfWeek: number; hourOfDay: number } | null {
    try {
      const validTimings = timingIntelligence
        .map(i => {
          const match = i.description.match(/submission_timing: (.+)/);
          if (match) {
            return JSON.parse(match[1]);
          }
          return null;
        })
        .filter(t => t && t.dayOfWeek !== undefined && t.hourOfDay !== undefined);

      if (validTimings.length === 0) return null;

      const avgDay = Math.round(
        validTimings.reduce((sum, t) => sum + t.dayOfWeek, 0) / validTimings.length
      );
      const avgHour = Math.round(
        validTimings.reduce((sum, t) => sum + t.hourOfDay, 0) / validTimings.length
      );

      return { dayOfWeek: avgDay, hourOfDay: avgHour };
    } catch (e) {
      this.logger.warn('Failed to calculate average timing', e);
      return null;
    }
  }

  /**
   * @ai-purpose Get servicer recommendations
   */
  async getRecommendations(servicerId: string): Promise<string[]> {
    return this.generateRecommendations(servicerId);
  }

  /**
   * @ai-purpose Get submission success rate for a servicer
   */
  async getSuccessRate(servicerId: string): Promise<number> {
    const intelligence = await db.query.servicer_intelligence.findMany({
      where: eq(servicer_intelligence.servicer_id, servicerId)
    });

    if (intelligence.length === 0) return 0;

    const successCount = intelligence.filter(i => 
      i.evidence?.includes('"status":"accepted"')
    ).length;

    return successCount / intelligence.length;
  }
}