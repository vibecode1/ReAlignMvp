import { Logger } from '../logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';

interface DebugContext {
  id: string;
  type: 'ai' | 'human' | 'system';
  sessionId: string;
  userId?: string;
  transactionId?: string;
  timestamp: Date;
  environment: EnvironmentInfo;
  stack: StackFrame[];
  variables: Variable[];
  aiState?: AIDebugState;
}

interface EnvironmentInfo {
  nodeVersion: string;
  platform: string;
  memory: {
    used: number;
    total: number;
  };
  cpu: {
    usage: number;
    cores: number;
  };
  uptime: number;
}

interface StackFrame {
  function: string;
  file: string;
  line: number;
  column: number;
  context?: string;
  variables?: Variable[];
}

interface Variable {
  name: string;
  type: string;
  value: any;
  scope: 'local' | 'closure' | 'global';
  mutable: boolean;
}

interface AIDebugState {
  modelVersion: string;
  confidence: number;
  reasoning: string[];
  inputs: any;
  outputs: any;
  latency: number;
  tokens: {
    input: number;
    output: number;
  };
  context: {
    memory: any[];
    patterns: any[];
  };
}

interface DebugSession {
  id: string;
  type: 'interactive' | 'automated' | 'retrospective';
  startTime: Date;
  endTime?: Date;
  developer: {
    type: 'human' | 'ai';
    id: string;
    name: string;
  };
  target: {
    type: 'code' | 'ai_behavior' | 'system' | 'data';
    identifier: string;
  };
  events: DebugEvent[];
  findings: DebugFinding[];
  resolution?: DebugResolution;
}

interface DebugEvent {
  id: string;
  timestamp: Date;
  type: 'breakpoint' | 'log' | 'error' | 'ai_decision' | 'state_change';
  data: any;
  context: DebugContext;
}

interface DebugFinding {
  id: string;
  type: 'bug' | 'performance' | 'logic_error' | 'ai_anomaly' | 'memory_leak';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  location: {
    file?: string;
    line?: number;
    component?: string;
  };
  evidence: any[];
  suggestedFix?: string;
}

interface DebugResolution {
  status: 'fixed' | 'mitigated' | 'wont_fix' | 'cannot_reproduce';
  description: string;
  changes: CodeChange[];
  verificationSteps: string[];
  preventiveMeasures: string[];
}

interface CodeChange {
  file: string;
  type: 'modify' | 'add' | 'delete';
  before?: string;
  after?: string;
  line?: number;
}

interface TimeTravel {
  enabled: boolean;
  snapshots: StateSnapshot[];
  currentIndex: number;
}

interface StateSnapshot {
  id: string;
  timestamp: Date;
  state: any;
  aiState?: AIDebugState;
  description: string;
}

/**
 * ComprehensiveDebuggingInfrastructure: Debugging system for AI and human developers
 * 
 * This infrastructure provides:
 * 1. Unified debugging for code and AI behavior
 * 2. Time-travel debugging with state snapshots
 * 3. AI decision transparency and replay
 * 4. Collaborative debugging sessions
 * 5. Automated root cause analysis
 * 6. Performance profiling and analysis
 * 
 * Architecture Notes for AI Agents:
 * - Captures full context for every debug event
 * - Supports both real-time and retrospective debugging
 * - Provides AI-specific debugging capabilities
 * - Enables human-AI collaborative debugging
 */
export class ComprehensiveDebuggingInfrastructure extends EventEmitter {
  private logger: Logger;
  private sessions: Map<string, DebugSession>;
  private activeBreakpoints: Map<string, Breakpoint>;
  private timeTravel: TimeTravel;
  private debugContexts: Map<string, DebugContext>;
  private performanceProfiles: Map<string, PerformanceProfile>;

  constructor() {
    super();
    this.logger = new Logger('ComprehensiveDebuggingInfrastructure');
    this.sessions = new Map();
    this.activeBreakpoints = new Map();
    this.timeTravel = {
      enabled: false,
      snapshots: [],
      currentIndex: -1
    };
    this.debugContexts = new Map();
    this.performanceProfiles = new Map();

    this.initializeDebugger();
  }

  /**
   * Start a new debug session
   */
  async startDebugSession(params: {
    type: 'interactive' | 'automated' | 'retrospective';
    developer: { type: 'human' | 'ai'; id: string; name: string };
    target: { type: 'code' | 'ai_behavior' | 'system' | 'data'; identifier: string };
  }): Promise<DebugSession> {
    this.logger.info('Starting debug session', params);

    const session: DebugSession = {
      id: `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: params.type,
      startTime: new Date(),
      developer: params.developer,
      target: params.target,
      events: [],
      findings: []
    };

    this.sessions.set(session.id, session);

    // Enable appropriate debugging features
    if (params.type === 'interactive') {
      await this.enableInteractiveDebugging(session);
    } else if (params.type === 'automated') {
      await this.enableAutomatedDebugging(session);
    }

    // Enable time travel for AI debugging
    if (params.target.type === 'ai_behavior') {
      this.enableTimeTravel();
    }

    this.emit('session:started', session);

    return session;
  }

  /**
   * Set a breakpoint
   */
  async setBreakpoint(params: {
    file: string;
    line: number;
    condition?: string;
    aiTrigger?: {
      confidenceThreshold?: number;
      patternMatch?: string;
    };
  }): Promise<string> {
    const breakpointId = `bp_${Date.now()}`;
    
    const breakpoint: Breakpoint = {
      id: breakpointId,
      file: params.file,
      line: params.line,
      condition: params.condition,
      aiTrigger: params.aiTrigger,
      hitCount: 0,
      enabled: true
    };

    this.activeBreakpoints.set(breakpointId, breakpoint);
    
    this.logger.info('Breakpoint set', {
      id: breakpointId,
      location: `${params.file}:${params.line}`
    });

    return breakpointId;
  }

  /**
   * Log debug event
   */
  async logDebugEvent(params: {
    sessionId: string;
    type: 'breakpoint' | 'log' | 'error' | 'ai_decision' | 'state_change';
    data: any;
    context?: Partial<DebugContext>;
  }): Promise<void> {
    const session = this.sessions.get(params.sessionId);
    if (!session) {
      this.logger.error('Debug session not found', { sessionId: params.sessionId });
      return;
    }

    const context = await this.captureContext(params.context);
    
    const event: DebugEvent = {
      id: `event_${Date.now()}`,
      timestamp: new Date(),
      type: params.type,
      data: params.data,
      context
    };

    session.events.push(event);

    // Take snapshot for time travel
    if (this.timeTravel.enabled) {
      await this.captureSnapshot(event);
    }

    // Analyze event for findings
    const findings = await this.analyzeEvent(event);
    session.findings.push(...findings);

    this.emit('debug:event', event);
  }

  /**
   * Debug AI decision
   */
  async debugAIDecision(params: {
    sessionId: string;
    model: string;
    inputs: any;
    outputs: any;
    confidence: number;
    reasoning: string[];
    latency: number;
    tokens: { input: number; output: number };
  }): Promise<void> {
    const aiState: AIDebugState = {
      modelVersion: params.model,
      confidence: params.confidence,
      reasoning: params.reasoning,
      inputs: params.inputs,
      outputs: params.outputs,
      latency: params.latency,
      tokens: params.tokens,
      context: {
        memory: [],
        patterns: []
      }
    };

    await this.logDebugEvent({
      sessionId: params.sessionId,
      type: 'ai_decision',
      data: {
        decision: params.outputs,
        confidence: params.confidence
      },
      context: { aiState }
    });

    // Check for AI anomalies
    const anomalies = await this.detectAIAnomalies(aiState);
    if (anomalies.length > 0) {
      const session = this.sessions.get(params.sessionId);
      if (session) {
        session.findings.push(...anomalies);
      }
    }
  }

  /**
   * Time travel to specific state
   */
  async timeTravelTo(snapshotId: string): Promise<StateSnapshot | null> {
    if (!this.timeTravel.enabled) {
      this.logger.warn('Time travel not enabled');
      return null;
    }

    const index = this.timeTravel.snapshots.findIndex(s => s.id === snapshotId);
    if (index === -1) {
      this.logger.error('Snapshot not found', { snapshotId });
      return null;
    }

    this.timeTravel.currentIndex = index;
    const snapshot = this.timeTravel.snapshots[index];

    // Restore state
    await this.restoreState(snapshot);

    this.emit('timetravel:jump', snapshot);

    return snapshot;
  }

  /**
   * Step through execution
   */
  async stepExecution(direction: 'forward' | 'backward' | 'into' | 'over' | 'out'): Promise<void> {
    // Implementation would integrate with Node.js debugger or custom instrumentation
    this.logger.info('Stepping execution', { direction });

    // For AI debugging, step through decisions
    if (this.timeTravel.enabled && (direction === 'forward' || direction === 'backward')) {
      const newIndex = direction === 'forward' 
        ? Math.min(this.timeTravel.currentIndex + 1, this.timeTravel.snapshots.length - 1)
        : Math.max(this.timeTravel.currentIndex - 1, 0);

      if (newIndex !== this.timeTravel.currentIndex) {
        const snapshot = this.timeTravel.snapshots[newIndex];
        await this.timeTravelTo(snapshot.id);
      }
    }
  }

  /**
   * Analyze performance
   */
  async analyzePerformance(params: {
    sessionId: string;
    component: string;
    operation: string;
  }): Promise<PerformanceAnalysis> {
    const profileId = `${params.component}_${params.operation}`;
    
    const profile = this.performanceProfiles.get(profileId) || {
      samples: [],
      statistics: {
        mean: 0,
        median: 0,
        p95: 0,
        p99: 0,
        min: 0,
        max: 0
      }
    };

    // Analyze recent events for performance data
    const session = this.sessions.get(params.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const performanceEvents = session.events.filter(e => 
      e.data?.component === params.component &&
      e.data?.operation === params.operation
    );

    const analysis: PerformanceAnalysis = {
      component: params.component,
      operation: params.operation,
      samples: performanceEvents.length,
      statistics: this.calculateStatistics(performanceEvents),
      bottlenecks: await this.identifyBottlenecks(performanceEvents),
      recommendations: this.generatePerformanceRecommendations(profile)
    };

    return analysis;
  }

  /**
   * Collaborative debugging
   */
  async joinDebugSession(sessionId: string, developer: {
    type: 'human' | 'ai';
    id: string;
    name: string;
  }): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    this.logger.info('Developer joining debug session', {
      sessionId,
      developer: developer.name
    });

    // Emit event for real-time collaboration
    this.emit('session:joined', { session, developer });

    // Share current debug state
    const currentState = await this.getCurrentDebugState(sessionId);
    this.emit('state:shared', { sessionId, state: currentState, developer });
  }

  /**
   * AI-assisted root cause analysis
   */
  async performRootCauseAnalysis(sessionId: string): Promise<RootCauseAnalysis> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    this.logger.info('Performing root cause analysis', { sessionId });

    // Analyze event sequence
    const eventChain = this.buildEventChain(session.events);
    
    // Identify critical path
    const criticalPath = this.identifyCriticalPath(eventChain);
    
    // Find root cause
    const rootCause = await this.findRootCause(criticalPath, session.findings);

    const analysis: RootCauseAnalysis = {
      sessionId,
      rootCause,
      contributingFactors: this.identifyContributingFactors(eventChain, rootCause),
      timeline: this.buildTimeline(eventChain),
      recommendations: await this.generateFixRecommendations(rootCause)
    };

    return analysis;
  }

  /**
   * Generate debug report
   */
  async generateDebugReport(sessionId: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const report = `
# Debug Session Report

## Session Information
- ID: ${session.id}
- Type: ${session.type}
- Developer: ${session.developer.name} (${session.developer.type})
- Target: ${session.target.type} - ${session.target.identifier}
- Duration: ${this.calculateDuration(session)}

## Events Summary
- Total Events: ${session.events.length}
- Breakpoints Hit: ${session.events.filter(e => e.type === 'breakpoint').length}
- Errors: ${session.events.filter(e => e.type === 'error').length}
- AI Decisions: ${session.events.filter(e => e.type === 'ai_decision').length}

## Findings
${session.findings.map(f => `
### ${f.type.toUpperCase()} - ${f.severity}
**Description:** ${f.description}
**Location:** ${f.location.file || f.location.component}:${f.location.line || 'N/A'}
${f.suggestedFix ? `**Suggested Fix:** ${f.suggestedFix}` : ''}
`).join('\n')}

## Resolution
${session.resolution ? `
**Status:** ${session.resolution.status}
**Description:** ${session.resolution.description}

### Changes Made
${session.resolution.changes.map(c => 
  `- ${c.type} ${c.file}${c.line ? `:${c.line}` : ''}`
).join('\n')}

### Verification Steps
${session.resolution.verificationSteps.map(s => `- ${s}`).join('\n')}

### Preventive Measures
${session.resolution.preventiveMeasures.map(m => `- ${m}`).join('\n')}
` : 'Session not yet resolved'}

## Performance Metrics
${await this.generatePerformanceSection(session)}

${session.target.type === 'ai_behavior' ? `
## AI Debugging Insights
${await this.generateAIInsightsSection(session)}
` : ''}
`;

    return report.trim();
  }

  /**
   * Initialize debugger infrastructure
   */
  private initializeDebugger(): void {
    // Set up error handlers
    process.on('uncaughtException', (error) => {
      this.handleGlobalError('uncaughtException', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.handleGlobalError('unhandledRejection', reason);
    });

    // Set up performance monitoring
    if (typeof performance !== 'undefined') {
      performance.mark('debugger-initialized');
    }
  }

  /**
   * Capture current debug context
   */
  private async captureContext(partial?: Partial<DebugContext>): Promise<DebugContext> {
    const context: DebugContext = {
      id: `ctx_${Date.now()}`,
      type: partial?.type || 'system',
      sessionId: partial?.sessionId || 'global',
      timestamp: new Date(),
      environment: await this.captureEnvironment(),
      stack: this.captureStack(),
      variables: await this.captureVariables(),
      ...partial
    };

    this.debugContexts.set(context.id, context);

    return context;
  }

  /**
   * Capture environment information
   */
  private async captureEnvironment(): Promise<EnvironmentInfo> {
    const memUsage = process.memoryUsage();
    
    return {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal
      },
      cpu: {
        usage: process.cpuUsage().user / 1000000, // Convert to seconds
        cores: require('os').cpus().length
      },
      uptime: process.uptime()
    };
  }

  /**
   * Capture stack trace
   */
  private captureStack(): StackFrame[] {
    const stack: StackFrame[] = [];
    const stackTrace = new Error().stack?.split('\n') || [];

    for (let i = 2; i < Math.min(stackTrace.length, 10); i++) {
      const line = stackTrace[i].trim();
      const match = line.match(/at (.+) \((.+):(\d+):(\d+)\)/);
      
      if (match) {
        stack.push({
          function: match[1],
          file: match[2],
          line: parseInt(match[3]),
          column: parseInt(match[4])
        });
      }
    }

    return stack;
  }

  /**
   * Capture variables in scope
   */
  private async captureVariables(): Promise<Variable[]> {
    // This would integrate with V8 debugger API
    // For now, return empty array
    return [];
  }

  /**
   * Capture state snapshot
   */
  private async captureSnapshot(event: DebugEvent): Promise<void> {
    const snapshot: StateSnapshot = {
      id: `snap_${Date.now()}`,
      timestamp: new Date(),
      state: {
        event: event.data,
        context: event.context
      },
      aiState: event.context.aiState,
      description: `${event.type} at ${event.timestamp.toISOString()}`
    };

    this.timeTravel.snapshots.push(snapshot);
    this.timeTravel.currentIndex = this.timeTravel.snapshots.length - 1;

    // Limit snapshot history
    if (this.timeTravel.snapshots.length > 1000) {
      this.timeTravel.snapshots.shift();
      this.timeTravel.currentIndex--;
    }
  }

  /**
   * Analyze event for potential findings
   */
  private async analyzeEvent(event: DebugEvent): Promise<DebugFinding[]> {
    const findings: DebugFinding[] = [];

    // Check for errors
    if (event.type === 'error') {
      findings.push({
        id: `finding_${Date.now()}`,
        type: 'bug',
        severity: 'high',
        description: event.data.message || 'Unknown error',
        location: {
          file: event.context.stack[0]?.file,
          line: event.context.stack[0]?.line
        },
        evidence: [event.data]
      });
    }

    // Check for performance issues
    if (event.data.latency && event.data.latency > 1000) {
      findings.push({
        id: `finding_${Date.now()}`,
        type: 'performance',
        severity: 'medium',
        description: `High latency detected: ${event.data.latency}ms`,
        location: {
          component: event.data.component
        },
        evidence: [event.data]
      });
    }

    // Check for AI anomalies
    if (event.type === 'ai_decision' && event.context.aiState) {
      const aiFindings = await this.detectAIAnomalies(event.context.aiState);
      findings.push(...aiFindings);
    }

    return findings;
  }

  /**
   * Detect AI anomalies
   */
  private async detectAIAnomalies(aiState: AIDebugState): Promise<DebugFinding[]> {
    const findings: DebugFinding[] = [];

    // Low confidence detection
    if (aiState.confidence < 0.5) {
      findings.push({
        id: `finding_${Date.now()}`,
        type: 'ai_anomaly',
        severity: 'medium',
        description: `Low AI confidence: ${(aiState.confidence * 100).toFixed(1)}%`,
        location: {
          component: 'AI Decision Engine'
        },
        evidence: [aiState],
        suggestedFix: 'Review input data quality and model training'
      });
    }

    // High latency detection
    if (aiState.latency > 2000) {
      findings.push({
        id: `finding_${Date.now()}`,
        type: 'performance',
        severity: 'medium',
        description: `High AI inference latency: ${aiState.latency}ms`,
        location: {
          component: 'AI Model'
        },
        evidence: [aiState],
        suggestedFix: 'Consider model optimization or caching'
      });
    }

    return findings;
  }

  /**
   * Enable interactive debugging
   */
  private async enableInteractiveDebugging(session: DebugSession): Promise<void> {
    // Set up interactive debugging features
    this.logger.info('Interactive debugging enabled', { sessionId: session.id });
  }

  /**
   * Enable automated debugging
   */
  private async enableAutomatedDebugging(session: DebugSession): Promise<void> {
    // Set up automated analysis
    this.logger.info('Automated debugging enabled', { sessionId: session.id });
  }

  /**
   * Enable time travel debugging
   */
  private enableTimeTravel(): void {
    this.timeTravel.enabled = true;
    this.timeTravel.snapshots = [];
    this.timeTravel.currentIndex = -1;
    
    this.logger.info('Time travel debugging enabled');
  }

  /**
   * Restore state from snapshot
   */
  private async restoreState(snapshot: StateSnapshot): Promise<void> {
    // Would restore actual application state
    this.logger.info('Restoring state from snapshot', { snapshotId: snapshot.id });
  }

  /**
   * Handle global errors
   */
  private handleGlobalError(type: string, error: any): void {
    this.logger.error('Global error captured', { type, error });
    
    // Log to active debug sessions
    for (const [sessionId, session] of this.sessions) {
      if (session.type === 'automated' || session.type === 'interactive') {
        this.logDebugEvent({
          sessionId,
          type: 'error',
          data: { type, error: error.toString(), stack: error.stack }
        });
      }
    }
  }

  /**
   * Calculate duration
   */
  private calculateDuration(session: DebugSession): string {
    const start = session.startTime.getTime();
    const end = session.endTime?.getTime() || Date.now();
    const duration = end - start;
    
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  /**
   * Build event chain
   */
  private buildEventChain(events: DebugEvent[]): any {
    // Build causal chain of events
    return events.map((e, i) => ({
      event: e,
      previous: i > 0 ? events[i - 1] : null,
      next: i < events.length - 1 ? events[i + 1] : null
    }));
  }

  /**
   * Identify critical path
   */
  private identifyCriticalPath(eventChain: any): any[] {
    // Find path leading to errors or issues
    return eventChain.filter((e: any) => 
      e.event.type === 'error' || 
      e.event.type === 'ai_decision' && e.event.context.aiState?.confidence < 0.5
    );
  }

  /**
   * Find root cause
   */
  private async findRootCause(criticalPath: any[], findings: DebugFinding[]): Promise<any> {
    // Analyze critical path to find root cause
    if (criticalPath.length === 0) {
      return null;
    }

    // Find earliest critical event
    const rootEvent = criticalPath[0];
    
    return {
      event: rootEvent.event,
      finding: findings.find(f => 
        f.evidence.some(e => e === rootEvent.event.data)
      ),
      confidence: 0.8
    };
  }

  /**
   * Identify contributing factors
   */
  private identifyContributingFactors(eventChain: any, rootCause: any): any[] {
    if (!rootCause) return [];
    
    // Find events that contributed to root cause
    return eventChain.filter((e: any) => 
      e.event.timestamp < rootCause.event.timestamp &&
      this.isRelated(e.event, rootCause.event)
    );
  }

  /**
   * Check if events are related
   */
  private isRelated(event1: DebugEvent, event2: DebugEvent): boolean {
    // Simple relatedness check
    return event1.context.transactionId === event2.context.transactionId ||
           event1.data?.component === event2.data?.component;
  }

  /**
   * Build timeline
   */
  private buildTimeline(eventChain: any): any[] {
    return eventChain.map((e: any) => ({
      timestamp: e.event.timestamp,
      type: e.event.type,
      description: this.getEventDescription(e.event)
    }));
  }

  /**
   * Get event description
   */
  private getEventDescription(event: DebugEvent): string {
    switch (event.type) {
      case 'breakpoint':
        return `Breakpoint hit at ${event.context.stack[0]?.file}:${event.context.stack[0]?.line}`;
      case 'error':
        return `Error: ${event.data.message || 'Unknown error'}`;
      case 'ai_decision':
        return `AI decision with ${(event.context.aiState?.confidence || 0) * 100}% confidence`;
      default:
        return event.type;
    }
  }

  /**
   * Generate fix recommendations
   */
  private async generateFixRecommendations(rootCause: any): Promise<string[]> {
    if (!rootCause) return ['No specific root cause identified'];
    
    const recommendations: string[] = [];
    
    if (rootCause.finding?.type === 'bug') {
      recommendations.push('Fix the identified bug in the code');
      recommendations.push('Add error handling to prevent similar issues');
      recommendations.push('Write tests to cover this scenario');
    }
    
    if (rootCause.finding?.type === 'ai_anomaly') {
      recommendations.push('Review and improve training data');
      recommendations.push('Add confidence thresholds for AI decisions');
      recommendations.push('Implement fallback logic for low-confidence scenarios');
    }
    
    return recommendations;
  }

  /**
   * Calculate statistics
   */
  private calculateStatistics(events: DebugEvent[]): any {
    const latencies = events
      .map(e => e.data?.latency)
      .filter(l => typeof l === 'number')
      .sort((a, b) => a - b);

    if (latencies.length === 0) {
      return {
        mean: 0,
        median: 0,
        p95: 0,
        p99: 0,
        min: 0,
        max: 0
      };
    }

    return {
      mean: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      median: latencies[Math.floor(latencies.length / 2)],
      p95: latencies[Math.floor(latencies.length * 0.95)],
      p99: latencies[Math.floor(latencies.length * 0.99)],
      min: latencies[0],
      max: latencies[latencies.length - 1]
    };
  }

  /**
   * Identify bottlenecks
   */
  private async identifyBottlenecks(events: DebugEvent[]): Promise<any[]> {
    const bottlenecks: any[] = [];
    
    // Group by component
    const componentLatencies = new Map<string, number[]>();
    
    for (const event of events) {
      if (event.data?.component && event.data?.latency) {
        const latencies = componentLatencies.get(event.data.component) || [];
        latencies.push(event.data.latency);
        componentLatencies.set(event.data.component, latencies);
      }
    }
    
    // Find components with high average latency
    for (const [component, latencies] of componentLatencies) {
      const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      if (avg > 500) {
        bottlenecks.push({
          component,
          averageLatency: avg,
          samples: latencies.length
        });
      }
    }
    
    return bottlenecks;
  }

  /**
   * Generate performance recommendations
   */
  private generatePerformanceRecommendations(profile: any): string[] {
    const recommendations: string[] = [];
    
    if (profile.statistics?.mean > 1000) {
      recommendations.push('Consider caching frequently accessed data');
      recommendations.push('Optimize database queries');
    }
    
    if (profile.statistics?.max > 5000) {
      recommendations.push('Investigate timeout issues');
      recommendations.push('Add circuit breakers for external dependencies');
    }
    
    return recommendations;
  }

  /**
   * Get current debug state
   */
  private async getCurrentDebugState(sessionId: string): Promise<any> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    return {
      events: session.events.slice(-10), // Last 10 events
      findings: session.findings,
      timeTravel: this.timeTravel.enabled ? {
        currentSnapshot: this.timeTravel.currentIndex >= 0 
          ? this.timeTravel.snapshots[this.timeTravel.currentIndex]
          : null
      } : null
    };
  }

  /**
   * Generate performance section
   */
  private async generatePerformanceSection(session: DebugSession): Promise<string> {
    const performanceEvents = session.events.filter(e => e.data?.latency);
    if (performanceEvents.length === 0) return 'No performance data available';
    
    const stats = this.calculateStatistics(performanceEvents);
    
    return `
- Average Latency: ${stats.mean.toFixed(2)}ms
- Median Latency: ${stats.median.toFixed(2)}ms
- 95th Percentile: ${stats.p95.toFixed(2)}ms
- 99th Percentile: ${stats.p99.toFixed(2)}ms
- Min/Max: ${stats.min.toFixed(2)}ms / ${stats.max.toFixed(2)}ms
`;
  }

  /**
   * Generate AI insights section
   */
  private async generateAIInsightsSection(session: DebugSession): Promise<string> {
    const aiEvents = session.events.filter(e => e.type === 'ai_decision');
    if (aiEvents.length === 0) return 'No AI decisions recorded';
    
    const confidences = aiEvents
      .map(e => e.context.aiState?.confidence || 0)
      .filter(c => c > 0);
    
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    
    return `
- Total AI Decisions: ${aiEvents.length}
- Average Confidence: ${(avgConfidence * 100).toFixed(1)}%
- Low Confidence Decisions: ${confidences.filter(c => c < 0.5).length}
- Time Travel Snapshots: ${this.timeTravel.snapshots.length}
`;
  }
}

// Type definitions for interfaces used in methods
interface Breakpoint {
  id: string;
  file: string;
  line: number;
  condition?: string;
  aiTrigger?: {
    confidenceThreshold?: number;
    patternMatch?: string;
  };
  hitCount: number;
  enabled: boolean;
}

interface PerformanceProfile {
  samples: number[];
  statistics: {
    mean: number;
    median: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
  };
}

interface PerformanceAnalysis {
  component: string;
  operation: string;
  samples: number;
  statistics: any;
  bottlenecks: any[];
  recommendations: string[];
}

interface RootCauseAnalysis {
  sessionId: string;
  rootCause: any;
  contributingFactors: any[];
  timeline: any[];
  recommendations: string[];
}