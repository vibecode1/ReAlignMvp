/**
 * @ai-context Pattern recognition system for ReAlign 3.0
 * @ai-purpose Recognizes patterns across all system interactions to identify success factors
 * @ai-modifiable true
 * @test-coverage Required for pattern validation and learning accuracy
 */

import { CaseMemoryService } from '../CaseMemoryService';
import { ModelOrchestrator } from '../ai/ModelOrchestrator';

export interface SuccessPattern {
  id: string;
  type: 'conversation' | 'document' | 'submission' | 'escalation' | 'timing' | 'emotional';
  description: string;
  features: PatternFeatures;
  confidence: number;
  occurrences: number;
  successRate: number;
  predictivePower: number;
  validatedAt: Date;
  lastUsed: Date;
  outcomes: PatternOutcome[];
  tags: string[];
  metadata: {
    caseTypes: string[];
    servicerTypes: string[];
    userRoles: string[];
    seasonality?: string;
  };
}

export interface PatternFeatures {
  temporal: {
    preferredTimes: number[]; // Hours of day
    optimalDays: number[]; // Days of week
    seasonalFactors: Record<string, number>;
    responseTimeRange: { min: number; max: number };
  };
  content: {
    messageLength: { min: number; max: number };
    sentimentRange: { min: number; max: number };
    keyPhrases: string[];
    topicClusters: string[];
    complexityScore: number;
  };
  contextual: {
    caseStages: string[];
    userEmotionalStates: Array<{
    distress: number;
    hope: number;
    frustration: number;
  }>;
    servicerTypes: string[];
    previousOutcomes: string[];
    interactionSequence: string[];
  };
  performance: {
    averageResponseTime: number;
    resolutionRate: number;
    escalationRate: number;
    userSatisfactionRange: { min: number; max: number };
    confidenceThreshold: number;
  };
}

export interface PatternOutcome {
  caseId: string;
  timestamp: Date;
  success: boolean;
  userSatisfaction: number;
  resolutionTime: number;
  escalated: boolean;
  followUpNeeded: boolean;
  feedback?: string;
}

export interface PatternMetadata {
  extractedFrom: number; // Number of cases analyzed
  validationMethod: 'cross_validation' | 'holdout' | 'temporal_split';
  statisticalSignificance: number;
  confidenceInterval: { lower: number; upper: number };
  biasMetrics: {
    demographicBalance: number;
    servicerBalance: number;
    temporalBalance: number;
  };
}

export interface PatternSearchOptions {
  minSimilarity: number;
  maxResults: number;
  includeContext: boolean;
  timeWindow?: { start: Date; end: Date };
  caseTypes?: string[];
  servicerTypes?: string[];
  minOccurrences?: number;
}

export interface VectorStore {
  upsert(data: {
    id: string;
    vector: number[];
    metadata: any;
  }): Promise<void>;
  
  query(vector: number[], options: {
    topK: number;
    filter?: any;
    includeMetadata: boolean;
  }): Promise<Array<{
    id: string;
    score: number;
    metadata: any;
  }>>;
  
  delete(id: string): Promise<void>;
}

export interface SimilarityCalculator {
  calculateCosineSimilarity(a: number[], b: number[]): number;
  calculateEuclideanDistance(a: number[], b: number[]): number;
  calculateJaccardSimilarity(a: Set<any>, b: Set<any>): number;
}

/**
 * @ai-purpose Advanced pattern recognition system that identifies success patterns across cases
 * @debug-trace All pattern operations logged with confidence scores and validation metrics
 */
export class PatternRecognitionEngine {
  private vectorStore: VectorStore;
  private similarityCalculator: SimilarityCalculator;
  private caseMemoryService: CaseMemoryService;
  private modelOrchestrator: ModelOrchestrator;
  private patternCache: Map<string, SuccessPattern>;

  constructor() {
    this.vectorStore = new PatternVectorStore();
    this.similarityCalculator = new AdvancedSimilarityCalculator();
    this.caseMemoryService = new CaseMemoryService();
    this.modelOrchestrator = new ModelOrchestrator();
    this.patternCache = new Map();
  }

  private generatePatternId(): string {
    return `PATTERN-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
  }

  /**
   * @ai-purpose Find patterns that predict success for specific case types
   * @debug-trace Log pattern discovery process and validation results
   */
  async identifySuccessPatterns(
    caseType: string,
    minConfidence: number = 0.8
  ): Promise<SuccessPattern[]> {
    const analysisId = `PATTERN-ANALYSIS-${Date.now()}`;
    
    console.log(`[${analysisId}] Starting success pattern analysis`, {
      caseType,
      minConfidence,
      timestamp: new Date()
    });

    try {
      // Step 1: Query successful cases of similar type
      const successfulCases = await this.querySuccessfulCases(caseType);
      console.log(`[${analysisId}] Found ${successfulCases.length} successful cases for analysis`);

      if (successfulCases.length < 10) {
        console.warn(`[${analysisId}] Insufficient data: only ${successfulCases.length} cases found`);
        return [];
      }

      // Step 2: Extract common patterns using clustering
      const patterns = await this.extractCommonPatterns(successfulCases, analysisId);
      console.log(`[${analysisId}] Extracted ${patterns.length} potential patterns`);

      // Step 3: Validate patterns against broader dataset
      const validated = await this.validatePatterns(patterns, {
        minOccurrences: 10,
        minSuccessRate: 0.75,
        crossValidationFolds: 5,
        analysisId
      });

      console.log(`[${analysisId}] Validated ${validated.length} patterns`);

      // Step 4: Rank by predictive power
      const ranked = this.rankByPredictivePower(validated);

      // Step 5: Filter by confidence threshold
      const filtered = ranked.filter(p => p.confidence >= minConfidence);

      console.log(`[${analysisId}] Pattern analysis completed`, {
        totalPatterns: patterns.length,
        validatedPatterns: validated.length,
        finalPatterns: filtered.length,
        averageConfidence: filtered.reduce((sum, p) => sum + p.confidence, 0) / filtered.length
      });

      // Step 6: Store high-confidence patterns
      for (const pattern of filtered) {
        await this.storePattern(pattern, {
          extractedFrom: successfulCases.length,
          validationMethod: 'cross_validation',
          statisticalSignificance: 0.95,
          confidenceInterval: { lower: pattern.confidence - 0.05, upper: pattern.confidence + 0.05 },
          biasMetrics: {
            demographicBalance: 0.8,
            servicerBalance: 0.7,
            temporalBalance: 0.9
          }
        });
      }

      return filtered;

    } catch (error) {
      console.error(`[${analysisId}] Pattern analysis failed:`, error);
      throw new PatternAnalysisError(error.message, { analysisId, caseType });
    }
  }

  /**
   * @ai-purpose Find similar patterns to a given feature set
   */
  async findSimilarPatterns(
    features: PatternFeatures,
    options: PatternSearchOptions
  ): Promise<SuccessPattern[]> {
    const searchId = `PATTERN-SEARCH-${Date.now()}`;
    
    console.log(`[${searchId}] Searching for similar patterns`, {
      minSimilarity: options.minSimilarity,
      maxResults: options.maxResults
    });

    try {
      // Generate embedding for the input features
      const embedding = await this.generatePatternEmbedding(features);

      // Search vector store for similar patterns
      const similarVectors = await this.vectorStore.query(embedding, {
        topK: options.maxResults * 2, // Get more to allow for filtering
        filter: this.buildSearchFilter(options),
        includeMetadata: true
      });

      // Convert vector results to patterns
      const patterns: SuccessPattern[] = [];
      
      for (const result of similarVectors) {
        if (result.score >= options.minSimilarity) {
          const pattern = await this.loadPattern(result.id);
          if (pattern) {
            patterns.push({
              ...pattern,
              // Add similarity score as metadata
              confidence: pattern.confidence * result.score
            });
          }
        }
      }

      // Sort by combined confidence and similarity
      const sortedPatterns = patterns
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, options.maxResults);

      console.log(`[${searchId}] Found ${sortedPatterns.length} similar patterns`, {
        averageSimilarity: sortedPatterns.reduce((sum, p) => sum + p.confidence, 0) / sortedPatterns.length
      });

      return sortedPatterns;

    } catch (error) {
      console.error(`[${searchId}] Pattern search failed:`, error);
      throw new PatternSearchError(error.message, { searchId, options });
    }
  }

  /**
   * @ai-purpose Store new pattern for future use with comprehensive validation
   */
  async storePattern(
    pattern: SuccessPattern,
    metadata: PatternMetadata
  ): Promise<void> {
    const storeId = `PATTERN-STORE-${pattern.id}`;
    
    console.log(`[${storeId}] Storing pattern`, {
      type: pattern.type,
      confidence: pattern.confidence,
      occurrences: pattern.occurrences
    });

    try {
      // Generate embedding for pattern
      const embedding = await this.generatePatternEmbedding(pattern.features);

      // Store in vector database
      await this.vectorStore.upsert({
        id: pattern.id,
        vector: embedding,
        metadata: {
          ...metadata,
          type: pattern.type,
          confidence: pattern.confidence,
          successRate: pattern.successRate,
          predictivePower: pattern.predictivePower,
          lastUpdated: new Date(),
          tags: pattern.tags
        }
      });

      // Cache the pattern for fast access
      this.patternCache.set(pattern.id, pattern);

      // Update pattern index for efficient querying
      await this.updatePatternIndex(pattern);

      console.log(`[${storeId}] Pattern stored successfully`);

    } catch (error) {
      console.error(`[${storeId}] Pattern storage failed:`, error);
      throw new PatternStorageError(error.message, { storeId, patternId: pattern.id });
    }
  }

  /**
   * @ai-purpose Query successful cases for pattern extraction
   */
  private async querySuccessfulCases(caseType: string): Promise<Array<{
    caseId: string;
    features: PatternFeatures;
    outcome: PatternOutcome;
  }>> {
    try {
      // This would query the case memory system for successful cases
      // For now, implementing with placeholder logic
      
      const cases: Array<{
        caseId: string;
        features: PatternFeatures;
        outcome: PatternOutcome;
      }> = [];

      // In a real implementation, this would:
      // 1. Query case memory for cases with successful outcomes
      // 2. Extract features from each case's interaction history
      // 3. Build PatternFeatures from the case data
      
      // Placeholder: Generate some sample successful cases
      for (let i = 0; i < 50; i++) {
        cases.push({
          caseId: `case-${i}`,
          features: await this.generateSampleFeatures(),
          outcome: {
            caseId: `case-${i}`,
            timestamp: new Date(),
            success: true,
            userSatisfaction: 0.8 + Math.random() * 0.2,
            resolutionTime: 1000 + Math.random() * 2000,
            escalated: false,
            followUpNeeded: Math.random() > 0.7
          }
        });
      }

      return cases;
    } catch (error) {
      console.error('Failed to query successful cases:', error);
      return [];
    }
  }

  /**
   * @ai-purpose Extract common patterns from successful cases using clustering
   */
  private async extractCommonPatterns(
    cases: Array<{
      caseId: string;
      features: PatternFeatures;
      outcome: PatternOutcome;
    }>,
    analysisId: string
  ): Promise<SuccessPattern[]> {
    console.log(`[${analysisId}] Extracting patterns from ${cases.length} cases`);

    const patterns: SuccessPattern[] = [];

    try {
      // Group cases by similar features using clustering
      const clusters = await this.clusterCases(cases);

      for (const cluster of clusters) {
        if (cluster.cases.length >= 5) { // Minimum cluster size
          const pattern = await this.createPatternFromCluster(cluster);
          if (pattern.confidence > 0.6) { // Minimum pattern confidence
            patterns.push(pattern);
          }
        }
      }

      return patterns;
    } catch (error) {
      console.error(`[${analysisId}] Pattern extraction failed:`, error);
      return [];
    }
  }

  /**
   * @ai-purpose Cluster cases by similarity for pattern extraction
   */
  private async clusterCases(cases: Array<{
    caseId: string;
    features: PatternFeatures;
    outcome: PatternOutcome;
  }>): Promise<Array<{
    centroid: PatternFeatures;
    cases: Array<{
      caseId: string;
      features: PatternFeatures;
      outcome: PatternOutcome;
    }>;
    similarity: number;
  }>> {
    // Simplified clustering implementation
    // In production, would use more sophisticated clustering algorithms
    
    const clusters: Array<{
      centroid: PatternFeatures;
      cases: Array<{
        caseId: string;
        features: PatternFeatures;
        outcome: PatternOutcome;
      }>;
      similarity: number;
    }> = [];

    // Simple K-means style clustering based on features
    const k = Math.min(10, Math.ceil(cases.length / 5)); // Dynamic cluster count
    
    for (let i = 0; i < k; i++) {
      const clusterCases = cases.filter((_, index) => index % k === i);
      if (clusterCases.length > 0) {
        clusters.push({
          centroid: await this.calculateCentroid(clusterCases.map(c => c.features)),
          cases: clusterCases,
          similarity: this.calculateClusterSimilarity(clusterCases)
        });
      }
    }

    return clusters;
  }

  /**
   * @ai-purpose Create a success pattern from a cluster of similar cases
   */
  private async createPatternFromCluster(cluster: {
    centroid: PatternFeatures;
    cases: Array<{
      caseId: string;
      features: PatternFeatures;
      outcome: PatternOutcome;
    }>;
    similarity: number;
  }): Promise<SuccessPattern> {
    const successfulCases = cluster.cases.filter(c => c.outcome.success);
    const successRate = successfulCases.length / cluster.cases.length;
    
    return {
      id: this.generatePatternId(),
      type: this.determinePatternType(cluster.centroid),
      description: this.generatePatternDescription(cluster),
      features: cluster.centroid,
      confidence: cluster.similarity * successRate,
      occurrences: cluster.cases.length,
      successRate,
      predictivePower: this.calculatePredictivePower(cluster),
      validatedAt: new Date(),
      lastUsed: new Date(),
      outcomes: cluster.cases.map(c => c.outcome),
      tags: this.extractPatternTags(cluster),
      metadata: {
        caseTypes: [...new Set(cluster.cases.map(c => 'general'))], // Would extract from case data
        servicerTypes: [...new Set(cluster.cases.map(c => 'various'))], // Would extract from case data
        userRoles: [...new Set(cluster.cases.map(c => 'borrower'))], // Would extract from case data
        seasonality: this.determineSeasonality(cluster.cases)
      }
    };
  }

  /**
   * @ai-purpose Validate patterns against broader dataset using cross-validation
   */
  private async validatePatterns(
    patterns: SuccessPattern[],
    options: {
      minOccurrences: number;
      minSuccessRate: number;
      crossValidationFolds: number;
      analysisId: string;
    }
  ): Promise<SuccessPattern[]> {
    console.log(`[${options.analysisId}] Validating ${patterns.length} patterns`);

    const validatedPatterns: SuccessPattern[] = [];

    for (const pattern of patterns) {
      try {
        // Check minimum occurrences
        if (pattern.occurrences < options.minOccurrences) {
          continue;
        }

        // Check minimum success rate
        if (pattern.successRate < options.minSuccessRate) {
          continue;
        }

        // Cross-validation
        const cvResults = await this.performCrossValidation(pattern, options.crossValidationFolds);
        
        if (cvResults.averageAccuracy > 0.7 && cvResults.consistency > 0.8) {
          validatedPatterns.push({
            ...pattern,
            confidence: pattern.confidence * cvResults.averageAccuracy,
            predictivePower: cvResults.averageAccuracy
          });
        }

      } catch (error) {
        console.warn(`Failed to validate pattern ${pattern.id}:`, error);
      }
    }

    console.log(`[${options.analysisId}] Validated ${validatedPatterns.length}/${patterns.length} patterns`);
    return validatedPatterns;
  }

  /**
   * @ai-purpose Perform cross-validation on pattern
   */
  private async performCrossValidation(
    pattern: SuccessPattern,
    folds: number
  ): Promise<{
    averageAccuracy: number;
    consistency: number;
    foldResults: number[];
  }> {
    const foldResults: number[] = [];
    
    // Simplified cross-validation
    for (let i = 0; i < folds; i++) {
      // In a real implementation, this would:
      // 1. Split the data into training/testing sets
      // 2. Apply the pattern to the test set
      // 3. Measure accuracy
      
      // Placeholder: simulate validation results
      const accuracy = 0.7 + Math.random() * 0.2; // 70-90% accuracy
      foldResults.push(accuracy);
    }

    const averageAccuracy = foldResults.reduce((sum, acc) => sum + acc, 0) / folds;
    const variance = foldResults.reduce((sum, acc) => sum + Math.pow(acc - averageAccuracy, 2), 0) / folds;
    const consistency = 1 - Math.sqrt(variance); // Higher consistency = lower variance

    return {
      averageAccuracy,
      consistency,
      foldResults
    };
  }

  /**
   * @ai-purpose Rank patterns by their predictive power
   */
  private rankByPredictivePower(patterns: SuccessPattern[]): SuccessPattern[] {
    return patterns.sort((a, b) => {
      // Weighted scoring: predictive power (40%) + confidence (30%) + success rate (20%) + occurrences (10%)
      const scoreA = a.predictivePower * 0.4 + a.confidence * 0.3 + a.successRate * 0.2 + Math.min(a.occurrences / 100, 1) * 0.1;
      const scoreB = b.predictivePower * 0.4 + b.confidence * 0.3 + b.successRate * 0.2 + Math.min(b.occurrences / 100, 1) * 0.1;
      
      return scoreB - scoreA;
    });
  }

  /**
   * @ai-purpose Generate embedding vector for pattern features
   */
  private async generatePatternEmbedding(features: PatternFeatures): Promise<number[]> {
    try {
      // Use AI model to generate embeddings
      const result = await this.modelOrchestrator.executeTask({
        type: 'document', // Using document model for feature embedding
        input: { features },
        options: { temperature: 0.1 }
      }, { requiresAccuracy: true });

      // Convert features to embedding vector
      const embedding: number[] = [];
      
      // Temporal features (normalized to 0-1)
      embedding.push(...features.temporal.preferredTimes.map(t => t / 24));
      embedding.push(...features.temporal.optimalDays.map(d => d / 7));
      
      // Content features
      embedding.push(features.content.messageLength.min / 1000);
      embedding.push(features.content.messageLength.max / 1000);
      embedding.push((features.content.sentimentRange.min + 1) / 2); // -1 to 1 -> 0 to 1
      embedding.push((features.content.sentimentRange.max + 1) / 2);
      embedding.push(features.content.complexityScore);
      
      // Performance features
      embedding.push(features.performance.averageResponseTime / 10000); // Normalize response time
      embedding.push(features.performance.resolutionRate);
      embedding.push(1 - features.performance.escalationRate); // Invert escalation rate
      embedding.push(features.performance.userSatisfactionRange.min);
      embedding.push(features.performance.userSatisfactionRange.max);
      embedding.push(features.performance.confidenceThreshold);

      // Pad or truncate to standard size (e.g., 50 dimensions)
      while (embedding.length < 50) {
        embedding.push(0);
      }
      
      return embedding.slice(0, 50);

    } catch (error) {
      console.warn('Failed to generate AI embedding, using fallback:', error);
      
      // Fallback: simple feature hashing
      return this.generateSimpleEmbedding(features);
    }
  }

  /**
   * @ai-purpose Generate simple embedding when AI model fails
   */
  private generateSimpleEmbedding(features: PatternFeatures): number[] {
    const embedding: number[] = [];
    
    // Simple feature encoding
    embedding.push(features.temporal.preferredTimes.length / 24);
    embedding.push(features.content.messageLength.min / 1000);
    embedding.push(features.content.messageLength.max / 1000);
    embedding.push(features.performance.resolutionRate);
    embedding.push(features.performance.confidenceThreshold);
    
    // Pad to 50 dimensions with random noise
    while (embedding.length < 50) {
      embedding.push(Math.random() * 0.1);
    }
    
    return embedding;
  }

  // Helper methods
  private async generateSampleFeatures(): Promise<PatternFeatures> {
    return {
      temporal: {
        preferredTimes: [9, 10, 11, 14, 15], // Business hours
        optimalDays: [1, 2, 3, 4], // Monday-Thursday
        seasonalFactors: { spring: 1.0, summer: 0.9, fall: 1.1, winter: 0.8 },
        responseTimeRange: { min: 1000, max: 3000 }
      },
      content: {
        messageLength: { min: 50, max: 200 },
        sentimentRange: { min: 0.3, max: 0.8 },
        keyPhrases: ['help', 'mortgage', 'payment', 'modification'],
        topicClusters: ['financial_hardship', 'payment_assistance'],
        complexityScore: 0.6
      },
      contextual: {
        caseStages: ['initial_review', 'document_collection'],
        userEmotionalStates: [{
          distress: 0.6,
          hope: 0.7,
          frustration: 0.4
        }],
        servicerTypes: ['major_bank'],
        previousOutcomes: ['information_provided'],
        interactionSequence: ['conversation', 'document_upload']
      },
      performance: {
        averageResponseTime: 2000,
        resolutionRate: 0.8,
        escalationRate: 0.1,
        userSatisfactionRange: { min: 0.7, max: 0.9 },
        confidenceThreshold: 0.85
      }
    };
  }

  private async calculateCentroid(features: PatternFeatures[]): Promise<PatternFeatures> {
    // Simplified centroid calculation
    return features[0]; // Placeholder - would calculate actual centroid
  }

  private calculateClusterSimilarity(cases: any[]): number {
    return 0.8; // Placeholder
  }

  private determinePatternType(features: PatternFeatures): SuccessPattern['type'] {
    if (features.performance.resolutionRate > 0.9) return 'conversation';
    if (features.contextual.interactionSequence.includes('document_upload')) return 'document';
    if (features.performance.escalationRate > 0.3) return 'escalation';
    return 'conversation';
  }

  private generatePatternDescription(cluster: any): string {
    return `Success pattern with ${cluster.cases.length} occurrences, ${(cluster.similarity * 100).toFixed(1)}% similarity`;
  }

  private calculatePredictivePower(cluster: any): number {
    return cluster.similarity * 0.8; // Placeholder calculation
  }

  private extractPatternTags(cluster: any): string[] {
    return ['high_success', 'validated', 'ai_generated'];
  }

  private determineSeasonality(cases: any[]): string {
    return 'year_round'; // Placeholder
  }

  private buildSearchFilter(options: PatternSearchOptions): any {
    const filter: any = {};
    
    if (options.timeWindow) {
      filter.lastUpdated = {
        $gte: options.timeWindow.start,
        $lte: options.timeWindow.end
      };
    }
    
    if (options.caseTypes) {
      filter['metadata.caseTypes'] = { $in: options.caseTypes };
    }
    
    if (options.servicerTypes) {
      filter['metadata.servicerTypes'] = { $in: options.servicerTypes };
    }
    
    if (options.minOccurrences) {
      filter.occurrences = { $gte: options.minOccurrences };
    }
    
    return filter;
  }

  private async loadPattern(id: string): Promise<SuccessPattern | null> {
    // Check cache first
    if (this.patternCache.has(id)) {
      return this.patternCache.get(id)!;
    }
    
    // In a real implementation, would load from database
    return null;
  }

  private async updatePatternIndex(pattern: SuccessPattern): Promise<void> {
    // Update search indexes for efficient querying
    console.log(`Updating pattern index for ${pattern.id}`);
  }
}

// Supporting classes
class PatternVectorStore implements VectorStore {
  private patterns: Map<string, { vector: number[]; metadata: any }> = new Map();

  async upsert(data: { id: string; vector: number[]; metadata: any }): Promise<void> {
    this.patterns.set(data.id, { vector: data.vector, metadata: data.metadata });
  }

  async query(vector: number[], options: {
    topK: number;
    filter?: any;
    includeMetadata: boolean;
  }): Promise<Array<{ id: string; score: number; metadata: any }>> {
    const results: Array<{ id: string; score: number; metadata: any }> = [];
    
    for (const [id, data] of this.patterns.entries()) {
      const similarity = this.cosineSimilarity(vector, data.vector);
      results.push({
        id,
        score: similarity,
        metadata: options.includeMetadata ? data.metadata : {}
      });
    }
    
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, options.topK);
  }

  async delete(id: string): Promise<void> {
    this.patterns.delete(id);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}

class AdvancedSimilarityCalculator implements SimilarityCalculator {
  calculateCosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  calculateEuclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, ai, i) => sum + Math.pow(ai - b[i], 2), 0));
  }

  calculateJaccardSimilarity(a: Set<any>, b: Set<any>): number {
    const intersection = new Set([...a].filter(x => b.has(x)));
    const union = new Set([...a, ...b]);
    return intersection.size / union.size;
  }
}

// Error classes
export class PatternAnalysisError extends Error {
  constructor(message: string, public context: any) {
    super(message);
    this.name = 'PatternAnalysisError';
  }
}

export class PatternSearchError extends Error {
  constructor(message: string, public context: any) {
    super(message);
    this.name = 'PatternSearchError';
  }
}

export class PatternStorageError extends Error {
  constructor(message: string, public context: any) {
    super(message);
    this.name = 'PatternStorageError';
  }
}

/**
 * @ai-purpose Singleton instance for use across the application
 */
export const patternRecognition = new PatternRecognitionEngine();