import { Logger } from '../logger';
import { ServicerAdapterFactory } from '../servicers/ServicerAdapterFactory';
import { CaseMemoryService } from '../CaseMemoryService';
import { supabase } from '../../lib/supabase';

interface SubmissionTask {
  id: string;
  transactionId: string;
  servicerId: string;
  documentType: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'escalated';
  lastAttempt?: Date;
  nextRetry?: Date;
  metadata: Record<string, any>;
  submissionChannel?: 'api' | 'portal' | 'email' | 'manual';
  errorHistory: Array<{
    timestamp: Date;
    error: string;
    context: Record<string, any>;
  }>;
}

interface SubmissionResult {
  success: boolean;
  taskId: string;
  confirmationNumber?: string;
  submittedAt?: Date;
  error?: string;
  requiresEscalation?: boolean;
  nextSteps?: string[];
}

interface RetryStrategy {
  calculateDelay(attemptNumber: number): number;
  shouldRetry(task: SubmissionTask, error: any): boolean;
  getMaxRetries(priority: string): number;
}

/**
 * SubmissionOrchestrator: Intelligent submission engine with retry logic and monitoring
 * 
 * This orchestrator manages the entire submission lifecycle:
 * 1. Prioritizes submissions based on urgency and deadlines
 * 2. Selects appropriate submission channels
 * 3. Handles retries with exponential backoff
 * 4. Monitors submission health and triggers escalations
 * 5. Provides real-time visibility into submission queue
 * 
 * Architecture Notes for AI Agents:
 * - Uses strategy pattern for retry logic
 * - Implements circuit breaker for failing servicers
 * - Maintains submission history for learning
 * - Integrates with monitoring for alerts
 */
export class SubmissionOrchestrator {
  private logger: Logger;
  private adapterFactory: ServicerAdapterFactory;
  private caseMemory: CaseMemoryService;
  private submissionQueue: Map<string, SubmissionTask>;
  private retryStrategy: RetryStrategy;
  private circuitBreakers: Map<string, CircuitBreaker>;

  constructor() {
    this.logger = new Logger('SubmissionOrchestrator');
    this.adapterFactory = new ServicerAdapterFactory();
    this.caseMemory = new CaseMemoryService();
    this.submissionQueue = new Map();
    this.retryStrategy = new ExponentialBackoffStrategy();
    this.circuitBreakers = new Map();
    
    this.initializeMonitoring();
  }

  /**
   * Submit a document to a servicer with intelligent routing
   */
  async submitDocument(params: {
    transactionId: string;
    servicerId: string;
    documentType: string;
    documentData: any;
    priority?: 'urgent' | 'high' | 'normal' | 'low';
    metadata?: Record<string, any>;
  }): Promise<SubmissionResult> {
    this.logger.info('Creating submission task', {
      transactionId: params.transactionId,
      servicerId: params.servicerId,
      documentType: params.documentType,
      priority: params.priority || 'normal'
    });

    // Create submission task
    const task: SubmissionTask = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      transactionId: params.transactionId,
      servicerId: params.servicerId,
      documentType: params.documentType,
      priority: params.priority || 'normal',
      retryCount: 0,
      maxRetries: this.retryStrategy.getMaxRetries(params.priority || 'normal'),
      status: 'pending',
      metadata: params.metadata || {},
      errorHistory: []
    };

    // Add to queue
    this.submissionQueue.set(task.id, task);

    // Store in database for persistence
    await this.persistTask(task);

    // Process immediately if high priority
    if (task.priority === 'urgent' || task.priority === 'high') {
      return await this.processTask(task);
    }

    // Otherwise, let the queue processor handle it
    this.scheduleTask(task);

    return {
      success: true,
      taskId: task.id,
      nextSteps: ['Document queued for submission', 'You will be notified upon completion']
    };
  }

  /**
   * Process a submission task with retry logic
   */
  private async processTask(task: SubmissionTask): Promise<SubmissionResult> {
    this.logger.info('Processing submission task', { taskId: task.id });

    // Update status
    task.status = 'in_progress';
    task.lastAttempt = new Date();
    await this.updateTask(task);

    try {
      // Check circuit breaker
      const breaker = this.getCircuitBreaker(task.servicerId);
      if (breaker.isOpen()) {
        throw new Error(`Circuit breaker open for servicer ${task.servicerId}`);
      }

      // Get appropriate adapter
      const adapter = await this.adapterFactory.getAdapter(task.servicerId);
      
      // Determine submission channel based on servicer intelligence
      const intelligence = await this.caseMemory.getServicerIntelligence(task.servicerId);
      task.submissionChannel = this.selectSubmissionChannel(intelligence);

      // Submit document
      const result = await adapter.submitDocument({
        type: task.documentType,
        data: task.metadata.documentData,
        transactionId: task.transactionId
      });

      // Success! Update task and record success
      task.status = 'completed';
      await this.updateTask(task);
      
      breaker.recordSuccess();
      
      // Learn from successful submission
      await this.recordSubmissionPattern(task, true);

      return {
        success: true,
        taskId: task.id,
        confirmationNumber: result.confirmationNumber,
        submittedAt: new Date()
      };

    } catch (error) {
      this.logger.error('Submission failed', { taskId: task.id, error });

      // Record error
      task.errorHistory.push({
        timestamp: new Date(),
        error: error.message,
        context: { attemptNumber: task.retryCount + 1 }
      });

      // Check if we should retry
      if (this.retryStrategy.shouldRetry(task, error)) {
        task.retryCount++;
        task.nextRetry = new Date(Date.now() + this.retryStrategy.calculateDelay(task.retryCount));
        task.status = 'pending';
        
        await this.updateTask(task);
        this.scheduleTask(task);

        return {
          success: false,
          taskId: task.id,
          error: error.message,
          nextSteps: [`Retry scheduled for ${task.nextRetry.toISOString()}`]
        };
      }

      // Max retries reached or non-retryable error
      task.status = 'failed';
      await this.updateTask(task);

      // Record failure pattern
      await this.recordSubmissionPattern(task, false);

      // Check if escalation is needed
      const requiresEscalation = this.checkEscalationCriteria(task);

      return {
        success: false,
        taskId: task.id,
        error: error.message,
        requiresEscalation,
        nextSteps: requiresEscalation 
          ? ['Escalating to human expert for manual submission']
          : ['Maximum retries reached', 'Please contact support']
      };
    }
  }

  /**
   * Select best submission channel based on servicer intelligence
   */
  private selectSubmissionChannel(intelligence: any): 'api' | 'portal' | 'email' | 'manual' {
    if (!intelligence || !intelligence.patterns) {
      return 'portal'; // Default fallback
    }

    // Analyze success rates by channel
    const channelSuccess = intelligence.patterns.submissionChannels || {};
    
    // Sort channels by success rate
    const sortedChannels = Object.entries(channelSuccess)
      .sort(([, a]: any, [, b]: any) => b.successRate - a.successRate);

    // Return channel with highest success rate
    return (sortedChannels[0]?.[0] as any) || 'portal';
  }

  /**
   * Check if task requires escalation
   */
  private checkEscalationCriteria(task: SubmissionTask): boolean {
    // High priority tasks always escalate on failure
    if (task.priority === 'urgent' || task.priority === 'high') {
      return true;
    }

    // Multiple failures with same error pattern
    const errorPatterns = task.errorHistory.map(e => e.error);
    const uniqueErrors = new Set(errorPatterns);
    if (uniqueErrors.size === 1 && task.errorHistory.length >= 3) {
      return true; // Same error repeatedly
    }

    // Deadline approaching (if specified in metadata)
    if (task.metadata.deadline) {
      const hoursUntilDeadline = (new Date(task.metadata.deadline).getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilDeadline < 24) {
        return true;
      }
    }

    return false;
  }

  /**
   * Schedule task for future processing
   */
  private scheduleTask(task: SubmissionTask): void {
    const delay = task.nextRetry 
      ? task.nextRetry.getTime() - Date.now()
      : this.getPriorityDelay(task.priority);

    setTimeout(() => {
      this.processTask(task);
    }, Math.max(0, delay));
  }

  /**
   * Get delay based on priority
   */
  private getPriorityDelay(priority: string): number {
    switch (priority) {
      case 'urgent': return 0;
      case 'high': return 5 * 60 * 1000; // 5 minutes
      case 'normal': return 30 * 60 * 1000; // 30 minutes
      case 'low': return 60 * 60 * 1000; // 1 hour
      default: return 30 * 60 * 1000;
    }
  }

  /**
   * Persist task to database
   */
  private async persistTask(task: SubmissionTask): Promise<void> {
    const { error } = await supabase
      .from('submission_tasks')
      .insert({
        id: task.id,
        transaction_id: task.transactionId,
        servicer_id: task.servicerId,
        document_type: task.documentType,
        priority: task.priority,
        status: task.status,
        retry_count: task.retryCount,
        max_retries: task.maxRetries,
        metadata: task.metadata,
        error_history: task.errorHistory,
        created_at: new Date().toISOString()
      });

    if (error) {
      this.logger.error('Failed to persist task', { taskId: task.id, error });
    }
  }

  /**
   * Update task in database
   */
  private async updateTask(task: SubmissionTask): Promise<void> {
    const { error } = await supabase
      .from('submission_tasks')
      .update({
        status: task.status,
        retry_count: task.retryCount,
        last_attempt: task.lastAttempt?.toISOString(),
        next_retry: task.nextRetry?.toISOString(),
        error_history: task.errorHistory,
        updated_at: new Date().toISOString()
      })
      .eq('id', task.id);

    if (error) {
      this.logger.error('Failed to update task', { taskId: task.id, error });
    }
  }

  /**
   * Record submission pattern for learning
   */
  private async recordSubmissionPattern(task: SubmissionTask, success: boolean): Promise<void> {
    await this.caseMemory.recordInteraction({
      type: 'submission',
      transactionId: task.transactionId,
      servicerId: task.servicerId,
      data: {
        documentType: task.documentType,
        channel: task.submissionChannel,
        priority: task.priority,
        success,
        retryCount: task.retryCount,
        totalDuration: task.lastAttempt ? Date.now() - task.lastAttempt.getTime() : 0,
        errors: task.errorHistory
      }
    });
  }

  /**
   * Get or create circuit breaker for servicer
   */
  private getCircuitBreaker(servicerId: string): CircuitBreaker {
    if (!this.circuitBreakers.has(servicerId)) {
      this.circuitBreakers.set(servicerId, new CircuitBreaker(servicerId));
    }
    return this.circuitBreakers.get(servicerId)!;
  }

  /**
   * Initialize monitoring and queue processing
   */
  private initializeMonitoring(): void {
    // Process pending tasks on startup
    this.resumePendingTasks();

    // Monitor queue health every minute
    setInterval(() => {
      this.monitorQueueHealth();
    }, 60 * 1000);
  }

  /**
   * Resume pending tasks from database
   */
  private async resumePendingTasks(): Promise<void> {
    const { data: tasks, error } = await supabase
      .from('submission_tasks')
      .select('*')
      .in('status', ['pending', 'in_progress'])
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error('Failed to load pending tasks', { error });
      return;
    }

    for (const taskData of tasks || []) {
      const task: SubmissionTask = {
        id: taskData.id,
        transactionId: taskData.transaction_id,
        servicerId: taskData.servicer_id,
        documentType: taskData.document_type,
        priority: taskData.priority,
        retryCount: taskData.retry_count,
        maxRetries: taskData.max_retries,
        status: taskData.status,
        metadata: taskData.metadata,
        errorHistory: taskData.error_history || [],
        lastAttempt: taskData.last_attempt ? new Date(taskData.last_attempt) : undefined,
        nextRetry: taskData.next_retry ? new Date(taskData.next_retry) : undefined
      };

      this.submissionQueue.set(task.id, task);
      this.scheduleTask(task);
    }

    this.logger.info('Resumed pending tasks', { count: tasks?.length || 0 });
  }

  /**
   * Monitor queue health and alert on issues
   */
  private async monitorQueueHealth(): Promise<void> {
    const stats = {
      total: this.submissionQueue.size,
      pending: 0,
      inProgress: 0,
      failed: 0,
      oldestPending: null as Date | null
    };

    for (const task of this.submissionQueue.values()) {
      switch (task.status) {
        case 'pending':
          stats.pending++;
          if (!stats.oldestPending || task.lastAttempt < stats.oldestPending) {
            stats.oldestPending = task.lastAttempt || new Date();
          }
          break;
        case 'in_progress':
          stats.inProgress++;
          break;
        case 'failed':
          stats.failed++;
          break;
      }
    }

    // Alert if queue is backing up
    if (stats.pending > 50 || (stats.oldestPending && Date.now() - stats.oldestPending.getTime() > 2 * 60 * 60 * 1000)) {
      this.logger.warn('Queue health warning', stats);
      // TODO: Send alert to monitoring system
    }

    // Log metrics
    this.logger.info('Queue health check', stats);
  }

  /**
   * Get queue statistics for monitoring
   */
  async getQueueStats(): Promise<any> {
    const stats = {
      queueSize: this.submissionQueue.size,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      byServicer: {} as Record<string, number>,
      averageRetries: 0,
      successRate: 0
    };

    let totalRetries = 0;
    let completedTasks = 0;
    let totalTasks = 0;

    for (const task of this.submissionQueue.values()) {
      // By status
      stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;
      
      // By priority
      stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;
      
      // By servicer
      stats.byServicer[task.servicerId] = (stats.byServicer[task.servicerId] || 0) + 1;
      
      // Calculate averages
      totalRetries += task.retryCount;
      totalTasks++;
      
      if (task.status === 'completed') {
        completedTasks++;
      }
    }

    stats.averageRetries = totalTasks > 0 ? totalRetries / totalTasks : 0;
    stats.successRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

    return stats;
  }
}

/**
 * Exponential backoff retry strategy
 */
class ExponentialBackoffStrategy implements RetryStrategy {
  calculateDelay(attemptNumber: number): number {
    // Base delay of 5 seconds, exponentially increasing
    const baseDelay = 5000;
    const maxDelay = 300000; // 5 minutes max
    const delay = Math.min(baseDelay * Math.pow(2, attemptNumber - 1), maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay;
    return delay + jitter;
  }

  shouldRetry(task: SubmissionTask, error: any): boolean {
    // Don't retry if max retries reached
    if (task.retryCount >= task.maxRetries) {
      return false;
    }

    // Don't retry on authentication errors
    if (error.message?.includes('authentication') || error.message?.includes('unauthorized')) {
      return false;
    }

    // Don't retry on validation errors
    if (error.message?.includes('validation') || error.message?.includes('invalid')) {
      return false;
    }

    // Retry on network errors, timeouts, and temporary failures
    return true;
  }

  getMaxRetries(priority: string): number {
    switch (priority) {
      case 'urgent': return 5;
      case 'high': return 4;
      case 'normal': return 3;
      case 'low': return 2;
      default: return 3;
    }
  }
}

/**
 * Circuit breaker to prevent cascading failures
 */
class CircuitBreaker {
  private servicerId: string;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime?: Date;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  private readonly failureThreshold = 5;
  private readonly successThreshold = 3;
  private readonly timeout = 60000; // 1 minute

  constructor(servicerId: string) {
    this.servicerId = servicerId;
  }

  isOpen(): boolean {
    if (this.state === 'open') {
      // Check if timeout has passed
      if (this.lastFailureTime && Date.now() - this.lastFailureTime.getTime() > this.timeout) {
        this.state = 'half-open';
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = 'closed';
        this.successCount = 0;
      }
    }
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
    }
    
    if (this.state === 'half-open') {
      this.state = 'open';
      this.successCount = 0;
    }
  }
}