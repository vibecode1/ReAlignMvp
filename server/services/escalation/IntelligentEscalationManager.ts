import { Logger } from '../logger';
import { CaseMemoryService } from '../CaseMemoryService';
import { supabase } from '../../lib/supabase';
import { AIServiceConfig } from '../aiServiceConfig';

interface EscalationTrigger {
  type: 'deadline' | 'priority' | 'failure_rate' | 'user_sentiment' | 'complexity' | 'manual';
  threshold: any;
  weight: number;
}

interface EscalationCase {
  id: string;
  transactionId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  triggers: EscalationTrigger[];
  score: number;
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'auto_resolved';
  assignedTo?: string;
  context: {
    issue: string;
    history: any[];
    suggestedActions: string[];
    userSentiment?: 'frustrated' | 'neutral' | 'satisfied';
    deadlineProximity?: number; // hours until deadline
    failureCount?: number;
  };
  createdAt: Date;
  assignedAt?: Date;
  resolvedAt?: Date;
  resolution?: {
    action: string;
    outcome: string;
    preventionMeasures?: string[];
  };
}

interface Expert {
  id: string;
  name: string;
  email: string;
  specialties: string[];
  availability: 'available' | 'busy' | 'offline';
  currentLoad: number;
  successRate: number;
  averageResolutionTime: number; // in minutes
}

/**
 * IntelligentEscalationManager: Smart escalation logic with multi-factor triggers
 * 
 * This manager handles complex escalation decisions based on:
 * 1. Multiple weighted triggers (deadline, sentiment, failure rate, etc.)
 * 2. Expert availability and specialty matching
 * 3. Historical resolution patterns
 * 4. Automatic de-escalation when AI can resolve
 * 5. Learning from resolution outcomes
 * 
 * Architecture Notes for AI Agents:
 * - Uses scoring system to prioritize escalations
 * - Maintains expert performance metrics
 * - Implements automatic resolution attempts before human escalation
 * - Tracks resolution patterns for continuous improvement
 */
export class IntelligentEscalationManager {
  private logger: Logger;
  private caseMemory: CaseMemoryService;
  private aiConfig: AIServiceConfig;
  private escalationQueue: Map<string, EscalationCase>;
  private experts: Map<string, Expert>;
  private escalationThresholds: Map<string, number>;

  constructor() {
    this.logger = new Logger('IntelligentEscalationManager');
    this.caseMemory = new CaseMemoryService();
    this.aiConfig = new AIServiceConfig();
    this.escalationQueue = new Map();
    this.experts = new Map();
    this.escalationThresholds = new Map([
      ['critical', 80],
      ['high', 60],
      ['medium', 40],
      ['low', 20]
    ]);

    this.initializeExperts();
    this.startMonitoring();
  }

  /**
   * Evaluate if escalation is needed based on multiple factors
   */
  async evaluateEscalation(params: {
    transactionId: string;
    issue: string;
    context: any;
    manualRequest?: boolean;
  }): Promise<{
    shouldEscalate: boolean;
    severity?: 'critical' | 'high' | 'medium' | 'low';
    score?: number;
    triggers?: EscalationTrigger[];
    suggestedActions?: string[];
  }> {
    this.logger.info('Evaluating escalation', { 
      transactionId: params.transactionId,
      issue: params.issue 
    });

    const triggers: EscalationTrigger[] = [];
    let totalScore = 0;

    // Manual escalation request
    if (params.manualRequest) {
      triggers.push({
        type: 'manual',
        threshold: true,
        weight: 50
      });
      totalScore += 50;
    }

    // Check deadline proximity
    const deadlineScore = await this.evaluateDeadlineTrigger(params.transactionId, params.context);
    if (deadlineScore > 0) {
      triggers.push({
        type: 'deadline',
        threshold: deadlineScore,
        weight: deadlineScore
      });
      totalScore += deadlineScore;
    }

    // Check failure rate
    const failureScore = await this.evaluateFailureTrigger(params.transactionId, params.context);
    if (failureScore > 0) {
      triggers.push({
        type: 'failure_rate',
        threshold: failureScore,
        weight: failureScore
      });
      totalScore += failureScore;
    }

    // Check user sentiment
    const sentimentScore = await this.evaluateSentimentTrigger(params.transactionId, params.context);
    if (sentimentScore > 0) {
      triggers.push({
        type: 'user_sentiment',
        threshold: sentimentScore,
        weight: sentimentScore
      });
      totalScore += sentimentScore;
    }

    // Check complexity
    const complexityScore = await this.evaluateComplexityTrigger(params.issue, params.context);
    if (complexityScore > 0) {
      triggers.push({
        type: 'complexity',
        threshold: complexityScore,
        weight: complexityScore
      });
      totalScore += complexityScore;
    }

    // Determine severity based on score
    let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';
    if (totalScore >= this.escalationThresholds.get('critical')!) {
      severity = 'critical';
    } else if (totalScore >= this.escalationThresholds.get('high')!) {
      severity = 'high';
    } else if (totalScore >= this.escalationThresholds.get('medium')!) {
      severity = 'medium';
    }

    // Check if we should escalate
    const shouldEscalate = totalScore >= this.escalationThresholds.get('low')!;

    // Get suggested actions
    const suggestedActions = await this.generateSuggestedActions(
      params.issue,
      params.context,
      triggers
    );

    return {
      shouldEscalate,
      severity,
      score: totalScore,
      triggers,
      suggestedActions
    };
  }

  /**
   * Create an escalation case
   */
  async createEscalation(params: {
    transactionId: string;
    issue: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    triggers: EscalationTrigger[];
    score: number;
    context: any;
    suggestedActions: string[];
  }): Promise<EscalationCase> {
    this.logger.info('Creating escalation case', {
      transactionId: params.transactionId,
      severity: params.severity,
      score: params.score
    });

    const escalationCase: EscalationCase = {
      id: `esc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      transactionId: params.transactionId,
      severity: params.severity,
      triggers: params.triggers,
      score: params.score,
      status: 'pending',
      context: {
        issue: params.issue,
        history: params.context.history || [],
        suggestedActions: params.suggestedActions,
        userSentiment: params.context.userSentiment,
        deadlineProximity: params.context.deadlineProximity,
        failureCount: params.context.failureCount
      },
      createdAt: new Date()
    };

    // Add to queue
    this.escalationQueue.set(escalationCase.id, escalationCase);

    // Persist to database
    await this.persistEscalation(escalationCase);

    // Attempt automatic resolution first
    const autoResolved = await this.attemptAutomaticResolution(escalationCase);
    if (autoResolved) {
      escalationCase.status = 'auto_resolved';
      return escalationCase;
    }

    // Assign to expert if critical or high severity
    if (params.severity === 'critical' || params.severity === 'high') {
      await this.assignToExpert(escalationCase);
    }

    return escalationCase;
  }

  /**
   * Attempt to resolve escalation automatically
   */
  private async attemptAutomaticResolution(escalation: EscalationCase): Promise<boolean> {
    this.logger.info('Attempting automatic resolution', { escalationId: escalation.id });

    // Don't auto-resolve manual escalations
    if (escalation.triggers.some(t => t.type === 'manual')) {
      return false;
    }

    // Use AI to analyze and potentially resolve
    try {
      const analysis = await this.analyzeWithAI(escalation);
      
      if (analysis.canAutoResolve && analysis.confidence > 0.8) {
        // Execute automatic resolution
        const success = await this.executeAutoResolution(escalation, analysis);
        
        if (success) {
          escalation.status = 'auto_resolved';
          escalation.resolvedAt = new Date();
          escalation.resolution = {
            action: analysis.proposedAction,
            outcome: 'Automatically resolved by AI',
            preventionMeasures: analysis.preventionMeasures
          };
          
          await this.updateEscalation(escalation);
          
          // Learn from successful resolution
          await this.recordResolutionPattern(escalation, true);
          
          return true;
        }
      }
    } catch (error) {
      this.logger.error('Auto-resolution failed', { escalationId: escalation.id, error });
    }

    return false;
  }

  /**
   * Assign escalation to best available expert
   */
  private async assignToExpert(escalation: EscalationCase): Promise<void> {
    this.logger.info('Assigning to expert', { escalationId: escalation.id });

    // Find best expert based on:
    // 1. Availability
    // 2. Current load
    // 3. Specialty match
    // 4. Success rate
    // 5. Average resolution time

    const availableExperts = Array.from(this.experts.values())
      .filter(expert => expert.availability === 'available')
      .filter(expert => expert.currentLoad < 5); // Max 5 cases per expert

    if (availableExperts.length === 0) {
      this.logger.warn('No available experts', { escalationId: escalation.id });
      return;
    }

    // Score experts
    const scoredExperts = availableExperts.map(expert => {
      let score = 0;

      // Specialty match (40 points max)
      const specialtyMatch = this.calculateSpecialtyMatch(expert, escalation);
      score += specialtyMatch * 40;

      // Success rate (30 points max)
      score += expert.successRate * 30;

      // Low current load (20 points max)
      score += (1 - expert.currentLoad / 5) * 20;

      // Fast resolution time (10 points max)
      const timeScore = Math.max(0, 1 - expert.averageResolutionTime / 180); // 3 hours baseline
      score += timeScore * 10;

      return { expert, score };
    });

    // Sort by score and assign to best expert
    scoredExperts.sort((a, b) => b.score - a.score);
    const bestExpert = scoredExperts[0].expert;

    escalation.assignedTo = bestExpert.id;
    escalation.assignedAt = new Date();
    escalation.status = 'assigned';

    // Update expert load
    bestExpert.currentLoad++;

    await this.updateEscalation(escalation);
    await this.notifyExpert(bestExpert, escalation);

    this.logger.info('Escalation assigned', {
      escalationId: escalation.id,
      expertId: bestExpert.id,
      expertName: bestExpert.name
    });
  }

  /**
   * Evaluate deadline trigger
   */
  private async evaluateDeadlineTrigger(transactionId: string, context: any): Promise<number> {
    const { data: transaction } = await supabase
      .from('transactions')
      .select('closing_date')
      .eq('id', transactionId)
      .single();

    if (!transaction?.closing_date) return 0;

    const hoursUntilDeadline = (new Date(transaction.closing_date).getTime() - Date.now()) / (1000 * 60 * 60);
    
    // Score based on proximity
    if (hoursUntilDeadline < 24) return 40; // Critical
    if (hoursUntilDeadline < 72) return 25; // High
    if (hoursUntilDeadline < 168) return 15; // Medium (1 week)
    
    return 0;
  }

  /**
   * Evaluate failure rate trigger
   */
  private async evaluateFailureTrigger(transactionId: string, context: any): Promise<number> {
    const recentFailures = context.failureCount || 0;
    
    // Score based on failure count
    if (recentFailures >= 5) return 35; // Critical
    if (recentFailures >= 3) return 20; // High
    if (recentFailures >= 2) return 10; // Medium
    
    return 0;
  }

  /**
   * Evaluate user sentiment trigger
   */
  private async evaluateSentimentTrigger(transactionId: string, context: any): Promise<number> {
    // Get recent interactions
    const interactions = await this.caseMemory.getRecentInteractions(transactionId, 5);
    
    let frustrationCount = 0;
    for (const interaction of interactions) {
      if (interaction.data?.sentiment === 'frustrated' || 
          interaction.data?.sentiment === 'angry') {
        frustrationCount++;
      }
    }
    
    // Score based on frustration level
    if (frustrationCount >= 3) return 30; // High frustration
    if (frustrationCount >= 2) return 15; // Medium frustration
    if (frustrationCount >= 1) return 5; // Some frustration
    
    return 0;
  }

  /**
   * Evaluate complexity trigger
   */
  private async evaluateComplexityTrigger(issue: string, context: any): Promise<number> {
    // Analyze issue complexity using patterns
    const complexityIndicators = [
      'multiple servicers',
      'legal issue',
      'compliance violation',
      'system integration',
      'data corruption',
      'security breach',
      'regulatory requirement'
    ];
    
    let complexityScore = 0;
    const issueLower = issue.toLowerCase();
    
    for (const indicator of complexityIndicators) {
      if (issueLower.includes(indicator)) {
        complexityScore += 10;
      }
    }
    
    // Check if multiple systems are involved
    if (context.affectedSystems?.length > 2) {
      complexityScore += 15;
    }
    
    return Math.min(complexityScore, 25); // Cap at 25
  }

  /**
   * Generate suggested actions based on triggers
   */
  private async generateSuggestedActions(
    issue: string,
    context: any,
    triggers: EscalationTrigger[]
  ): Promise<string[]> {
    const actions: string[] = [];

    // Deadline-based actions
    if (triggers.some(t => t.type === 'deadline')) {
      actions.push('Expedite document processing');
      actions.push('Contact servicer for rush processing');
      actions.push('Prepare contingency plan for deadline extension');
    }

    // Failure-based actions
    if (triggers.some(t => t.type === 'failure_rate')) {
      actions.push('Switch to alternative submission method');
      actions.push('Manual intervention for document submission');
      actions.push('Direct contact with servicer representative');
    }

    // Sentiment-based actions
    if (triggers.some(t => t.type === 'user_sentiment')) {
      actions.push('Proactive user communication with updates');
      actions.push('Offer compensation or expedited service');
      actions.push('Schedule call with user to address concerns');
    }

    // Complexity-based actions
    if (triggers.some(t => t.type === 'complexity')) {
      actions.push('Involve subject matter expert');
      actions.push('Create detailed action plan');
      actions.push('Schedule cross-functional team meeting');
    }

    return actions;
  }

  /**
   * Calculate specialty match between expert and escalation
   */
  private calculateSpecialtyMatch(expert: Expert, escalation: EscalationCase): number {
    const issueKeywords = escalation.context.issue.toLowerCase().split(' ');
    let matchScore = 0;
    let totalKeywords = 0;

    for (const specialty of expert.specialties) {
      const specialtyWords = specialty.toLowerCase().split(' ');
      for (const word of specialtyWords) {
        if (issueKeywords.includes(word)) {
          matchScore++;
        }
        totalKeywords++;
      }
    }

    return totalKeywords > 0 ? matchScore / totalKeywords : 0;
  }

  /**
   * Analyze escalation with AI
   */
  private async analyzeWithAI(escalation: EscalationCase): Promise<{
    canAutoResolve: boolean;
    confidence: number;
    proposedAction: string;
    preventionMeasures: string[];
  }> {
    // Simulate AI analysis (would integrate with actual AI service)
    const patterns = await this.caseMemory.findSimilarPatterns({
      issue: escalation.context.issue,
      triggers: escalation.triggers.map(t => t.type)
    });

    // Check if similar issues were resolved automatically
    const autoResolvedSimilar = patterns.filter(p => p.resolution?.automatic).length;
    const totalSimilar = patterns.length;

    const canAutoResolve = totalSimilar > 0 && (autoResolvedSimilar / totalSimilar) > 0.7;
    const confidence = totalSimilar > 0 ? autoResolvedSimilar / totalSimilar : 0;

    // Generate proposed action based on successful patterns
    const proposedAction = patterns[0]?.resolution?.action || 'Retry with adjusted parameters';
    
    // Extract prevention measures from successful resolutions
    const preventionMeasures = patterns
      .filter(p => p.resolution?.preventionMeasures)
      .flatMap(p => p.resolution.preventionMeasures)
      .filter((v, i, a) => a.indexOf(v) === i) // unique
      .slice(0, 3);

    return {
      canAutoResolve,
      confidence,
      proposedAction,
      preventionMeasures
    };
  }

  /**
   * Execute automatic resolution
   */
  private async executeAutoResolution(escalation: EscalationCase, analysis: any): Promise<boolean> {
    try {
      // Implementation would depend on the specific action
      // This is a simplified version
      this.logger.info('Executing auto-resolution', {
        escalationId: escalation.id,
        action: analysis.proposedAction
      });

      // Record the attempt
      await this.caseMemory.recordInteraction({
        type: 'auto_resolution',
        transactionId: escalation.transactionId,
        data: {
          escalationId: escalation.id,
          action: analysis.proposedAction,
          confidence: analysis.confidence
        }
      });

      // Simulate success (in real implementation, would execute actual resolution)
      return true;
    } catch (error) {
      this.logger.error('Auto-resolution execution failed', {
        escalationId: escalation.id,
        error
      });
      return false;
    }
  }

  /**
   * Record resolution pattern for learning
   */
  private async recordResolutionPattern(escalation: EscalationCase, success: boolean): Promise<void> {
    await this.caseMemory.recordPattern({
      type: 'escalation_resolution',
      pattern: {
        triggers: escalation.triggers.map(t => t.type),
        severity: escalation.severity,
        issue: escalation.context.issue,
        resolution: escalation.resolution,
        automatic: escalation.status === 'auto_resolved',
        success,
        resolutionTime: escalation.resolvedAt && escalation.createdAt
          ? escalation.resolvedAt.getTime() - escalation.createdAt.getTime()
          : null
      }
    });
  }

  /**
   * Initialize experts (would be loaded from database)
   */
  private async initializeExperts(): Promise<void> {
    // Sample experts for demonstration
    const sampleExperts: Expert[] = [
      {
        id: 'exp_001',
        name: 'Sarah Johnson',
        email: 'sarah.j@realign.com',
        specialties: ['mortgage', 'compliance', 'documentation'],
        availability: 'available',
        currentLoad: 2,
        successRate: 0.92,
        averageResolutionTime: 45
      },
      {
        id: 'exp_002',
        name: 'Michael Chen',
        email: 'michael.c@realign.com',
        specialties: ['technical', 'integration', 'api'],
        availability: 'available',
        currentLoad: 1,
        successRate: 0.88,
        averageResolutionTime: 60
      },
      {
        id: 'exp_003',
        name: 'Emily Rodriguez',
        email: 'emily.r@realign.com',
        specialties: ['servicer', 'submission', 'escalation'],
        availability: 'available',
        currentLoad: 3,
        successRate: 0.95,
        averageResolutionTime: 30
      }
    ];

    for (const expert of sampleExperts) {
      this.experts.set(expert.id, expert);
    }
  }

  /**
   * Notify expert of new assignment
   */
  private async notifyExpert(expert: Expert, escalation: EscalationCase): Promise<void> {
    // Would integrate with notification service
    this.logger.info('Notifying expert', {
      expertId: expert.id,
      escalationId: escalation.id
    });

    // In real implementation, would send email/SMS/push notification
  }

  /**
   * Persist escalation to database
   */
  private async persistEscalation(escalation: EscalationCase): Promise<void> {
    const { error } = await supabase
      .from('escalations')
      .insert({
        id: escalation.id,
        transaction_id: escalation.transactionId,
        severity: escalation.severity,
        triggers: escalation.triggers,
        score: escalation.score,
        status: escalation.status,
        context: escalation.context,
        created_at: escalation.createdAt.toISOString()
      });

    if (error) {
      this.logger.error('Failed to persist escalation', {
        escalationId: escalation.id,
        error
      });
    }
  }

  /**
   * Update escalation in database
   */
  private async updateEscalation(escalation: EscalationCase): Promise<void> {
    const { error } = await supabase
      .from('escalations')
      .update({
        status: escalation.status,
        assigned_to: escalation.assignedTo,
        assigned_at: escalation.assignedAt?.toISOString(),
        resolved_at: escalation.resolvedAt?.toISOString(),
        resolution: escalation.resolution,
        updated_at: new Date().toISOString()
      })
      .eq('id', escalation.id);

    if (error) {
      this.logger.error('Failed to update escalation', {
        escalationId: escalation.id,
        error
      });
    }
  }

  /**
   * Start monitoring for escalations
   */
  private startMonitoring(): void {
    // Check for stale escalations every 5 minutes
    setInterval(() => {
      this.checkStaleEscalations();
    }, 5 * 60 * 1000);

    // Update expert availability every minute
    setInterval(() => {
      this.updateExpertAvailability();
    }, 60 * 1000);
  }

  /**
   * Check for stale escalations that need attention
   */
  private async checkStaleEscalations(): Promise<void> {
    const now = Date.now();
    
    for (const [id, escalation] of this.escalationQueue) {
      if (escalation.status === 'assigned' && escalation.assignedAt) {
        const assignedDuration = now - escalation.assignedAt.getTime();
        
        // Re-escalate if critical and not resolved within 30 minutes
        if (escalation.severity === 'critical' && assignedDuration > 30 * 60 * 1000) {
          this.logger.warn('Critical escalation stale', {
            escalationId: id,
            assignedDuration: Math.round(assignedDuration / 60000)
          });
          
          // Re-assign to another expert
          await this.reassignEscalation(escalation);
        }
      }
    }
  }

  /**
   * Reassign escalation to another expert
   */
  private async reassignEscalation(escalation: EscalationCase): Promise<void> {
    // Exclude current assignee
    const currentExpert = this.experts.get(escalation.assignedTo!);
    if (currentExpert) {
      currentExpert.currentLoad--;
    }

    // Find new expert
    await this.assignToExpert(escalation);
  }

  /**
   * Update expert availability based on schedule/workload
   */
  private async updateExpertAvailability(): Promise<void> {
    // In real implementation, would check schedules, workload, etc.
    // For now, just ensure experts don't get overloaded
    
    for (const expert of this.experts.values()) {
      if (expert.currentLoad >= 5) {
        expert.availability = 'busy';
      } else if (expert.currentLoad === 0) {
        expert.availability = 'available';
      }
    }
  }

  /**
   * Get escalation statistics
   */
  async getEscalationStats(): Promise<any> {
    const stats = {
      total: this.escalationQueue.size,
      bySeverity: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      averageResolutionTime: 0,
      autoResolutionRate: 0
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;
    let autoResolvedCount = 0;

    for (const escalation of this.escalationQueue.values()) {
      // By severity
      stats.bySeverity[escalation.severity] = (stats.bySeverity[escalation.severity] || 0) + 1;
      
      // By status
      stats.byStatus[escalation.status] = (stats.byStatus[escalation.status] || 0) + 1;
      
      // Resolution metrics
      if (escalation.resolvedAt && escalation.createdAt) {
        totalResolutionTime += escalation.resolvedAt.getTime() - escalation.createdAt.getTime();
        resolvedCount++;
        
        if (escalation.status === 'auto_resolved') {
          autoResolvedCount++;
        }
      }
    }

    stats.averageResolutionTime = resolvedCount > 0 
      ? totalResolutionTime / resolvedCount / 60000 // Convert to minutes
      : 0;
      
    stats.autoResolutionRate = resolvedCount > 0
      ? autoResolvedCount / resolvedCount
      : 0;

    return stats;
  }
}