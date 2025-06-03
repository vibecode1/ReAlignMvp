import { Logger } from '../logger';
import { AIAgentFramework } from '../development/AIAgentFramework';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface TechnicalDebt {
  id: string;
  type: 'code_smell' | 'design_debt' | 'documentation_debt' | 'test_debt' | 'dependency_debt' | 'performance_debt';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  location: {
    file?: string;
    line?: number;
    component?: string;
    pattern?: string;
  };
  impact: {
    maintainability: number; // 0-1
    performance: number; // 0-1
    security: number; // 0-1
    reliability: number; // 0-1
  };
  effort: {
    estimated: number; // hours
    actual?: number;
    complexity: 'trivial' | 'simple' | 'moderate' | 'complex';
  };
  metrics: DebtMetrics;
  createdAt: Date;
  lastSeen: Date;
  resolvedAt?: Date;
  resolution?: {
    method: string;
    implementedBy: string;
    verifiedBy?: string;
  };
}

interface DebtMetrics {
  occurrences: number;
  affectedFiles: number;
  linesOfCode: number;
  cyclomaticComplexity?: number;
  couplingScore?: number;
  testCoverage?: number;
  duplicateCode?: number;
}

interface DebtTrend {
  timestamp: Date;
  totalDebt: number;
  debtByType: Record<string, number>;
  debtBySeverity: Record<string, number>;
  velocityMetrics: {
    created: number;
    resolved: number;
    netChange: number;
  };
}

interface RefactoringPlan {
  id: string;
  debts: string[]; // debt IDs
  title: string;
  description: string;
  priority: number;
  estimatedEffort: number;
  expectedBenefit: {
    maintainability: number;
    performance: number;
    overall: number;
  };
  steps: RefactoringStep[];
  dependencies: string[];
  risks: Risk[];
}

interface RefactoringStep {
  order: number;
  description: string;
  automated: boolean;
  script?: string;
  validation: string;
}

interface Risk {
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

interface DebtReport {
  summary: {
    totalDebt: number;
    criticalItems: number;
    estimatedEffort: number;
    debtRatio: number; // debt lines / total lines
  };
  byType: Record<string, DebtTypeSummary>;
  topIssues: TechnicalDebt[];
  trends: DebtTrend[];
  recommendations: RefactoringPlan[];
}

interface DebtTypeSummary {
  count: number;
  severity: Record<string, number>;
  topFiles: string[];
  estimatedEffort: number;
}

/**
 * TechnicalDebtTracker: System to track and manage technical debt automatically
 * 
 * This tracker provides:
 * 1. Automatic debt detection across codebase
 * 2. Debt categorization and prioritization
 * 3. Impact analysis and effort estimation
 * 4. Refactoring plan generation
 * 5. Progress tracking and reporting
 * 6. Integration with development workflow
 * 
 * Architecture Notes for AI Agents:
 * - Scans codebase using multiple analysis tools
 * - Maintains debt inventory with tracking
 * - Generates actionable refactoring plans
 * - Monitors debt trends over time
 */
export class TechnicalDebtTracker {
  private logger: Logger;
  private aiFramework: AIAgentFramework;
  private debtInventory: Map<string, TechnicalDebt>;
  private refactoringPlans: Map<string, RefactoringPlan>;
  private scanInterval: NodeJS.Timer | null = null;
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.logger = new Logger('TechnicalDebtTracker');
    this.projectRoot = projectRoot;
    this.aiFramework = new AIAgentFramework(projectRoot);
    this.debtInventory = new Map();
    this.refactoringPlans = new Map();
  }

  /**
   * Start automatic debt tracking
   */
  async startTracking(intervalHours: number = 24): Promise<void> {
    this.logger.info('Starting technical debt tracking', { intervalHours });

    // Initial scan
    await this.scanForDebt();

    // Schedule periodic scans
    this.scanInterval = setInterval(async () => {
      await this.scanForDebt();
    }, intervalHours * 60 * 60 * 1000);
  }

  /**
   * Stop tracking
   */
  stopTracking(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
  }

  /**
   * Scan codebase for technical debt
   */
  async scanForDebt(): Promise<void> {
    this.logger.info('Scanning codebase for technical debt');

    try {
      // Run multiple analysis tools
      const [
        codeSmells,
        designIssues,
        documentationGaps,
        testingDebt,
        dependencyIssues,
        performanceIssues
      ] = await Promise.all([
        this.detectCodeSmells(),
        this.analyzeDesignPatterns(),
        this.checkDocumentation(),
        this.analyzeTestCoverage(),
        this.checkDependencies(),
        this.analyzePerformance()
      ]);

      // Process and store findings
      await this.processFindings({
        codeSmells,
        designIssues,
        documentationGaps,
        testingDebt,
        dependencyIssues,
        performanceIssues
      });

      // Generate refactoring plans
      await this.generateRefactoringPlans();

      // Update trends
      await this.updateTrends();

    } catch (error) {
      this.logger.error('Debt scan failed', { error });
    }
  }

  /**
   * Detect code smells
   */
  private async detectCodeSmells(): Promise<TechnicalDebt[]> {
    this.logger.debug('Detecting code smells');
    const debts: TechnicalDebt[] = [];

    // Get all TypeScript files
    const files = await this.getAllFiles('**/*.ts');

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      
      // Long methods
      const longMethods = this.detectLongMethods(content, file);
      debts.push(...longMethods);

      // Complex conditions
      const complexConditions = this.detectComplexConditions(content, file);
      debts.push(...complexConditions);

      // Duplicate code
      const duplicates = await this.detectDuplicateCode(content, file);
      debts.push(...duplicates);

      // God classes
      const godClasses = this.detectGodClasses(content, file);
      debts.push(...godClasses);

      // Dead code
      const deadCode = await this.detectDeadCode(content, file);
      debts.push(...deadCode);
    }

    return debts;
  }

  /**
   * Detect long methods
   */
  private detectLongMethods(content: string, file: string): TechnicalDebt[] {
    const debts: TechnicalDebt[] = [];
    const lines = content.split('\n');
    
    let currentMethod = '';
    let methodStart = 0;
    let methodLines = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Simple method detection
      if (line.match(/^\s*(async\s+)?(\w+)\s*\([^)]*\)\s*[:{]/)) {
        if (methodLines > 50) {
          debts.push({
            id: `debt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'code_smell',
            severity: methodLines > 100 ? 'high' : 'medium',
            title: `Long method: ${currentMethod}`,
            description: `Method has ${methodLines} lines, exceeding recommended 50 lines`,
            location: {
              file,
              line: methodStart,
              pattern: 'long_method'
            },
            impact: {
              maintainability: 0.7,
              performance: 0.2,
              security: 0.1,
              reliability: 0.3
            },
            effort: {
              estimated: Math.ceil(methodLines / 25), // 1 hour per 25 lines to refactor
              complexity: methodLines > 100 ? 'complex' : 'moderate'
            },
            metrics: {
              occurrences: 1,
              affectedFiles: 1,
              linesOfCode: methodLines
            },
            createdAt: new Date(),
            lastSeen: new Date()
          });
        }
        
        // Start new method
        currentMethod = line.match(/(\w+)\s*\(/)?.[1] || 'unknown';
        methodStart = i + 1;
        methodLines = 0;
      } else if (line.includes('{')) {
        methodLines++;
      }
    }

    return debts;
  }

  /**
   * Detect complex conditions
   */
  private detectComplexConditions(content: string, file: string): TechnicalDebt[] {
    const debts: TechnicalDebt[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Count logical operators
      const andCount = (line.match(/&&/g) || []).length;
      const orCount = (line.match(/\|\|/g) || []).length;
      const totalOperators = andCount + orCount;

      if (totalOperators >= 3) {
        debts.push({
          id: `debt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'code_smell',
          severity: totalOperators >= 5 ? 'high' : 'medium',
          title: 'Complex conditional logic',
          description: `Condition with ${totalOperators} logical operators`,
          location: {
            file,
            line: i + 1,
            pattern: 'complex_condition'
          },
          impact: {
            maintainability: 0.8,
            performance: 0.1,
            security: 0.2,
            reliability: 0.5
          },
          effort: {
            estimated: 1,
            complexity: 'simple'
          },
          metrics: {
            occurrences: 1,
            affectedFiles: 1,
            linesOfCode: 1,
            cyclomaticComplexity: totalOperators + 1
          },
          createdAt: new Date(),
          lastSeen: new Date()
        });
      }
    }

    return debts;
  }

  /**
   * Detect duplicate code
   */
  private async detectDuplicateCode(content: string, file: string): Promise<TechnicalDebt[]> {
    // Would use a tool like jscpd for real duplicate detection
    // For now, simple demonstration
    const debts: TechnicalDebt[] = [];
    
    // Check for similar function patterns
    const functions = content.match(/function\s+\w+\s*\([^)]*\)\s*{[^}]+}/g) || [];
    const duplicates = new Map<string, number>();

    for (const func of functions) {
      const normalized = func.replace(/\s+/g, ' ').trim();
      duplicates.set(normalized, (duplicates.get(normalized) || 0) + 1);
    }

    for (const [pattern, count] of duplicates) {
      if (count > 1) {
        debts.push({
          id: `debt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'code_smell',
          severity: 'medium',
          title: 'Duplicate code detected',
          description: `Similar code pattern found ${count} times`,
          location: {
            file,
            pattern: 'duplicate_code'
          },
          impact: {
            maintainability: 0.9,
            performance: 0.1,
            security: 0.1,
            reliability: 0.3
          },
          effort: {
            estimated: 2,
            complexity: 'moderate'
          },
          metrics: {
            occurrences: count,
            affectedFiles: 1,
            linesOfCode: pattern.length * count,
            duplicateCode: count - 1
          },
          createdAt: new Date(),
          lastSeen: new Date()
        });
      }
    }

    return debts;
  }

  /**
   * Detect god classes
   */
  private detectGodClasses(content: string, file: string): TechnicalDebt[] {
    const debts: TechnicalDebt[] = [];
    
    // Count class methods and properties
    const classMatches = content.match(/class\s+(\w+)[^{]*{([^}]+)}/gs) || [];
    
    for (const classMatch of classMatches) {
      const className = classMatch.match(/class\s+(\w+)/)?.[1] || 'Unknown';
      const classBody = classMatch.match(/{([^}]+)}/s)?.[1] || '';
      
      const methodCount = (classBody.match(/\w+\s*\([^)]*\)\s*[:{]/g) || []).length;
      const propertyCount = (classBody.match(/\w+\s*[:=]/g) || []).length;
      
      if (methodCount > 20 || propertyCount > 15) {
        debts.push({
          id: `debt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'design_debt',
          severity: 'high',
          title: `God class: ${className}`,
          description: `Class has ${methodCount} methods and ${propertyCount} properties`,
          location: {
            file,
            component: className,
            pattern: 'god_class'
          },
          impact: {
            maintainability: 0.9,
            performance: 0.3,
            security: 0.2,
            reliability: 0.4
          },
          effort: {
            estimated: 8,
            complexity: 'complex'
          },
          metrics: {
            occurrences: 1,
            affectedFiles: 1,
            linesOfCode: classBody.split('\n').length,
            couplingScore: methodCount * propertyCount / 100
          },
          createdAt: new Date(),
          lastSeen: new Date()
        });
      }
    }

    return debts;
  }

  /**
   * Detect dead code
   */
  private async detectDeadCode(content: string, file: string): Promise<TechnicalDebt[]> {
    const debts: TechnicalDebt[] = [];
    
    // Check for unused functions (simple check)
    const functionNames = (content.match(/function\s+(\w+)/g) || [])
      .map(m => m.replace('function ', ''));
    
    for (const funcName of functionNames) {
      const usageCount = (content.match(new RegExp(`\\b${funcName}\\b`, 'g')) || []).length;
      
      if (usageCount === 1) { // Only the definition
        debts.push({
          id: `debt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'code_smell',
          severity: 'low',
          title: `Potentially unused function: ${funcName}`,
          description: 'Function appears to be unused in this file',
          location: {
            file,
            pattern: 'dead_code'
          },
          impact: {
            maintainability: 0.3,
            performance: 0.1,
            security: 0.1,
            reliability: 0.1
          },
          effort: {
            estimated: 0.5,
            complexity: 'trivial'
          },
          metrics: {
            occurrences: 1,
            affectedFiles: 1,
            linesOfCode: 10 // estimate
          },
          createdAt: new Date(),
          lastSeen: new Date()
        });
      }
    }

    return debts;
  }

  /**
   * Analyze design patterns
   */
  private async analyzeDesignPatterns(): Promise<TechnicalDebt[]> {
    this.logger.debug('Analyzing design patterns');
    const debts: TechnicalDebt[] = [];

    // Check for anti-patterns
    const files = await this.getAllFiles('**/*.ts');
    
    for (const file of files) {
      const context = await this.aiFramework.analyzeFile(file);
      
      // Check for circular dependencies
      if (this.hasCircularDependencies(context)) {
        debts.push({
          id: `debt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'design_debt',
          severity: 'high',
          title: 'Circular dependency detected',
          description: `File has circular import dependencies`,
          location: {
            file,
            pattern: 'circular_dependency'
          },
          impact: {
            maintainability: 0.9,
            performance: 0.4,
            security: 0.1,
            reliability: 0.5
          },
          effort: {
            estimated: 4,
            complexity: 'moderate'
          },
          metrics: {
            occurrences: 1,
            affectedFiles: context.imports.length,
            linesOfCode: 0
          },
          createdAt: new Date(),
          lastSeen: new Date()
        });
      }
    }

    return debts;
  }

  /**
   * Check documentation coverage
   */
  private async checkDocumentation(): Promise<TechnicalDebt[]> {
    this.logger.debug('Checking documentation coverage');
    const debts: TechnicalDebt[] = [];

    const files = await this.getAllFiles('**/*.ts');
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      
      // Check for missing JSDoc
      const functions = content.match(/^\s*(export\s+)?(async\s+)?function\s+\w+/gm) || [];
      const documented = content.match(/\/\*\*[\s\S]*?\*\/\s*\n\s*(export\s+)?(async\s+)?function/gm) || [];
      
      const undocumentedCount = functions.length - documented.length;
      
      if (undocumentedCount > 0) {
        debts.push({
          id: `debt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'documentation_debt',
          severity: undocumentedCount > 5 ? 'medium' : 'low',
          title: 'Missing function documentation',
          description: `${undocumentedCount} functions lack documentation`,
          location: {
            file,
            pattern: 'missing_docs'
          },
          impact: {
            maintainability: 0.6,
            performance: 0,
            security: 0.1,
            reliability: 0.2
          },
          effort: {
            estimated: undocumentedCount * 0.25,
            complexity: 'trivial'
          },
          metrics: {
            occurrences: undocumentedCount,
            affectedFiles: 1,
            linesOfCode: 0
          },
          createdAt: new Date(),
          lastSeen: new Date()
        });
      }
    }

    return debts;
  }

  /**
   * Analyze test coverage
   */
  private async analyzeTestCoverage(): Promise<TechnicalDebt[]> {
    this.logger.debug('Analyzing test coverage');
    const debts: TechnicalDebt[] = [];

    try {
      // Run coverage report
      const { stdout } = await execAsync('npm run test:coverage -- --json', {
        cwd: this.projectRoot
      });

      const coverage = JSON.parse(stdout);
      const summary = coverage.total;

      if (summary.lines.pct < 80) {
        debts.push({
          id: `debt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'test_debt',
          severity: summary.lines.pct < 50 ? 'high' : 'medium',
          title: 'Insufficient test coverage',
          description: `Overall test coverage is ${summary.lines.pct.toFixed(1)}%`,
          location: {
            pattern: 'low_coverage'
          },
          impact: {
            maintainability: 0.3,
            performance: 0,
            security: 0.4,
            reliability: 0.8
          },
          effort: {
            estimated: (80 - summary.lines.pct) * 2, // 2 hours per percent
            complexity: 'moderate'
          },
          metrics: {
            occurrences: 1,
            affectedFiles: Object.keys(coverage.files || {}).length,
            linesOfCode: summary.lines.total,
            testCoverage: summary.lines.pct
          },
          createdAt: new Date(),
          lastSeen: new Date()
        });
      }
    } catch (error) {
      this.logger.warn('Could not analyze test coverage', { error });
    }

    return debts;
  }

  /**
   * Check dependencies
   */
  private async checkDependencies(): Promise<TechnicalDebt[]> {
    this.logger.debug('Checking dependencies');
    const debts: TechnicalDebt[] = [];

    try {
      // Check for outdated dependencies
      const { stdout } = await execAsync('npm outdated --json', {
        cwd: this.projectRoot
      });

      if (stdout) {
        const outdated = JSON.parse(stdout);
        const criticalCount = Object.values(outdated).filter((dep: any) => 
          dep.wanted !== dep.latest
        ).length;

        if (criticalCount > 0) {
          debts.push({
            id: `debt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'dependency_debt',
            severity: criticalCount > 10 ? 'high' : 'medium',
            title: 'Outdated dependencies',
            description: `${criticalCount} dependencies have newer versions available`,
            location: {
              file: 'package.json',
              pattern: 'outdated_deps'
            },
            impact: {
              maintainability: 0.4,
              performance: 0.2,
              security: 0.8,
              reliability: 0.3
            },
            effort: {
              estimated: criticalCount * 0.5,
              complexity: 'simple'
            },
            metrics: {
              occurrences: criticalCount,
              affectedFiles: 1,
              linesOfCode: 0
            },
            createdAt: new Date(),
            lastSeen: new Date()
          });
        }
      }
    } catch (error) {
      // npm outdated returns non-zero exit code
      this.logger.debug('No outdated dependencies or error checking');
    }

    return debts;
  }

  /**
   * Analyze performance issues
   */
  private async analyzePerformance(): Promise<TechnicalDebt[]> {
    this.logger.debug('Analyzing performance issues');
    const debts: TechnicalDebt[] = [];

    const files = await this.getAllFiles('**/*.ts');
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      
      // Check for performance anti-patterns
      if (content.includes('.forEach') && content.includes('async')) {
        debts.push({
          id: `debt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'performance_debt',
          severity: 'medium',
          title: 'Async operations in forEach',
          description: 'Using async operations inside forEach can cause performance issues',
          location: {
            file,
            pattern: 'async_foreach'
          },
          impact: {
            maintainability: 0.2,
            performance: 0.8,
            security: 0,
            reliability: 0.3
          },
          effort: {
            estimated: 1,
            complexity: 'simple'
          },
          metrics: {
            occurrences: 1,
            affectedFiles: 1,
            linesOfCode: 5
          },
          createdAt: new Date(),
          lastSeen: new Date()
        });
      }
    }

    return debts;
  }

  /**
   * Process findings and update inventory
   */
  private async processFindings(findings: any): Promise<void> {
    const allDebts = [
      ...findings.codeSmells,
      ...findings.designIssues,
      ...findings.documentationGaps,
      ...findings.testingDebt,
      ...findings.dependencyIssues,
      ...findings.performanceIssues
    ];

    // Update inventory
    for (const debt of allDebts) {
      const existing = Array.from(this.debtInventory.values()).find(d => 
        d.location.file === debt.location.file &&
        d.location.pattern === debt.location.pattern &&
        d.type === debt.type
      );

      if (existing) {
        // Update existing debt
        existing.lastSeen = new Date();
        existing.metrics.occurrences++;
      } else {
        // Add new debt
        this.debtInventory.set(debt.id, debt);
      }
    }

    // Mark resolved debts
    for (const [id, debt] of this.debtInventory) {
      if (debt.lastSeen < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
        debt.resolvedAt = new Date();
      }
    }
  }

  /**
   * Generate refactoring plans
   */
  private async generateRefactoringPlans(): Promise<void> {
    this.logger.info('Generating refactoring plans');

    // Group related debts
    const debtGroups = this.groupRelatedDebts();

    for (const group of debtGroups) {
      if (group.length > 1 || group[0].severity === 'critical' || group[0].severity === 'high') {
        const plan = await this.createRefactoringPlan(group);
        this.refactoringPlans.set(plan.id, plan);
      }
    }
  }

  /**
   * Group related technical debts
   */
  private groupRelatedDebts(): TechnicalDebt[][] {
    const groups: TechnicalDebt[][] = [];
    const processed = new Set<string>();

    for (const [id, debt] of this.debtInventory) {
      if (processed.has(id) || debt.resolvedAt) continue;

      const group = [debt];
      processed.add(id);

      // Find related debts
      for (const [otherId, otherDebt] of this.debtInventory) {
        if (processed.has(otherId) || otherDebt.resolvedAt) continue;

        if (this.areDebtsRelated(debt, otherDebt)) {
          group.push(otherDebt);
          processed.add(otherId);
        }
      }

      groups.push(group);
    }

    return groups;
  }

  /**
   * Check if two debts are related
   */
  private areDebtsRelated(debt1: TechnicalDebt, debt2: TechnicalDebt): boolean {
    // Same file
    if (debt1.location.file === debt2.location.file) return true;
    
    // Same component
    if (debt1.location.component && debt1.location.component === debt2.location.component) return true;
    
    // Same pattern type
    if (debt1.location.pattern === debt2.location.pattern) return true;
    
    return false;
  }

  /**
   * Create refactoring plan
   */
  private async createRefactoringPlan(debts: TechnicalDebt[]): Promise<RefactoringPlan> {
    const totalEffort = debts.reduce((sum, d) => sum + d.effort.estimated, 0);
    const avgImpact = {
      maintainability: debts.reduce((sum, d) => sum + d.impact.maintainability, 0) / debts.length,
      performance: debts.reduce((sum, d) => sum + d.impact.performance, 0) / debts.length,
      overall: 0
    };
    avgImpact.overall = (avgImpact.maintainability + avgImpact.performance) / 2;

    const plan: RefactoringPlan = {
      id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      debts: debts.map(d => d.id),
      title: this.generatePlanTitle(debts),
      description: this.generatePlanDescription(debts),
      priority: this.calculatePlanPriority(debts),
      estimatedEffort: totalEffort,
      expectedBenefit: avgImpact,
      steps: await this.generateRefactoringSteps(debts),
      dependencies: this.identifyDependencies(debts),
      risks: this.assessRisks(debts)
    };

    return plan;
  }

  /**
   * Generate plan title
   */
  private generatePlanTitle(debts: TechnicalDebt[]): string {
    const mainType = debts[0].type;
    const location = debts[0].location.file || debts[0].location.component || 'Multiple locations';
    
    return `Refactor ${mainType.replace('_', ' ')} in ${path.basename(location)}`;
  }

  /**
   * Generate plan description
   */
  private generatePlanDescription(debts: TechnicalDebt[]): string {
    const types = [...new Set(debts.map(d => d.type))];
    const severities = [...new Set(debts.map(d => d.severity))];
    
    return `Address ${debts.length} technical debt items (${types.join(', ')}) with ${severities.join(', ')} severity`;
  }

  /**
   * Calculate plan priority
   */
  private calculatePlanPriority(debts: TechnicalDebt[]): number {
    const severityScores = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1
    };

    const avgSeverity = debts.reduce((sum, d) => sum + severityScores[d.severity], 0) / debts.length;
    const impactScore = debts.reduce((sum, d) => 
      sum + d.impact.maintainability + d.impact.reliability, 0
    ) / debts.length;

    return avgSeverity * impactScore;
  }

  /**
   * Generate refactoring steps
   */
  private async generateRefactoringSteps(debts: TechnicalDebt[]): Promise<RefactoringStep[]> {
    const steps: RefactoringStep[] = [];
    let order = 1;

    // Group by type for logical ordering
    const byType = new Map<string, TechnicalDebt[]>();
    for (const debt of debts) {
      const group = byType.get(debt.type) || [];
      group.push(debt);
      byType.set(debt.type, group);
    }

    // Generate steps for each type
    for (const [type, typeDebts] of byType) {
      switch (type) {
        case 'code_smell':
          steps.push({
            order: order++,
            description: 'Run automated code formatting and linting',
            automated: true,
            script: 'npm run lint:fix',
            validation: 'Verify no linting errors remain'
          });
          
          for (const debt of typeDebts) {
            if (debt.location.pattern === 'long_method') {
              steps.push({
                order: order++,
                description: `Extract smaller functions from ${debt.title}`,
                automated: false,
                validation: 'Each function should be under 50 lines'
              });
            }
          }
          break;

        case 'test_debt':
          steps.push({
            order: order++,
            description: 'Generate test stubs for uncovered code',
            automated: true,
            script: 'npm run test:generate',
            validation: 'Verify test files created'
          });
          steps.push({
            order: order++,
            description: 'Implement test cases for critical paths',
            automated: false,
            validation: 'Coverage should exceed 80%'
          });
          break;

        case 'dependency_debt':
          steps.push({
            order: order++,
            description: 'Update dependencies to latest compatible versions',
            automated: true,
            script: 'npm update',
            validation: 'Run tests to ensure compatibility'
          });
          break;
      }
    }

    // Add final validation step
    steps.push({
      order: order++,
      description: 'Run full test suite and verify all tests pass',
      automated: true,
      script: 'npm test',
      validation: 'All tests should pass'
    });

    return steps;
  }

  /**
   * Identify dependencies
   */
  private identifyDependencies(debts: TechnicalDebt[]): string[] {
    const deps: string[] = [];
    
    // Check if any debts are in critical paths
    const criticalFiles = ['server/index.ts', 'client/src/main.tsx'];
    
    if (debts.some(d => criticalFiles.includes(d.location.file || ''))) {
      deps.push('Requires maintenance window');
    }

    return deps;
  }

  /**
   * Assess risks
   */
  private assessRisks(debts: TechnicalDebt[]): Risk[] {
    const risks: Risk[] = [];

    // Risk of breaking changes
    if (debts.some(d => d.type === 'design_debt')) {
      risks.push({
        description: 'Refactoring may introduce breaking changes',
        probability: 'medium',
        impact: 'high',
        mitigation: 'Create comprehensive tests before refactoring'
      });
    }

    // Risk of performance regression
    if (debts.some(d => d.type === 'performance_debt')) {
      risks.push({
        description: 'Changes may impact performance',
        probability: 'low',
        impact: 'medium',
        mitigation: 'Benchmark before and after changes'
      });
    }

    return risks;
  }

  /**
   * Update debt trends
   */
  private async updateTrends(): Promise<void> {
    const trend: DebtTrend = {
      timestamp: new Date(),
      totalDebt: Array.from(this.debtInventory.values()).filter(d => !d.resolvedAt).length,
      debtByType: {},
      debtBySeverity: {},
      velocityMetrics: {
        created: 0,
        resolved: 0,
        netChange: 0
      }
    };

    // Calculate distributions
    for (const debt of this.debtInventory.values()) {
      if (!debt.resolvedAt) {
        trend.debtByType[debt.type] = (trend.debtByType[debt.type] || 0) + 1;
        trend.debtBySeverity[debt.severity] = (trend.debtBySeverity[debt.severity] || 0) + 1;
      }
    }

    // Store trend
    await this.persistTrend(trend);
  }

  /**
   * Generate debt report
   */
  async generateReport(): Promise<DebtReport> {
    const activeDebts = Array.from(this.debtInventory.values())
      .filter(d => !d.resolvedAt);

    const totalEffort = activeDebts.reduce((sum, d) => sum + d.effort.estimated, 0);
    const criticalCount = activeDebts.filter(d => d.severity === 'critical').length;

    // Calculate debt ratio
    const totalLines = await this.countTotalLines();
    const debtLines = activeDebts.reduce((sum, d) => sum + d.metrics.linesOfCode, 0);
    const debtRatio = totalLines > 0 ? debtLines / totalLines : 0;

    // Group by type
    const byType: Record<string, DebtTypeSummary> = {};
    for (const debt of activeDebts) {
      if (!byType[debt.type]) {
        byType[debt.type] = {
          count: 0,
          severity: {},
          topFiles: [],
          estimatedEffort: 0
        };
      }
      
      byType[debt.type].count++;
      byType[debt.type].severity[debt.severity] = 
        (byType[debt.type].severity[debt.severity] || 0) + 1;
      byType[debt.type].estimatedEffort += debt.effort.estimated;
      
      if (debt.location.file && !byType[debt.type].topFiles.includes(debt.location.file)) {
        byType[debt.type].topFiles.push(debt.location.file);
      }
    }

    // Get top issues
    const topIssues = activeDebts
      .sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      })
      .slice(0, 10);

    // Get recommendations
    const recommendations = Array.from(this.refactoringPlans.values())
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5);

    return {
      summary: {
        totalDebt: activeDebts.length,
        criticalItems: criticalCount,
        estimatedEffort: totalEffort,
        debtRatio
      },
      byType,
      topIssues,
      trends: [], // Would load from storage
      recommendations
    };
  }

  /**
   * Utility methods
   */
  private async getAllFiles(pattern: string): Promise<string[]> {
    const { stdout } = await execAsync(
      `find . -name "${pattern}" -not -path "./node_modules/*" -not -path "./.git/*"`,
      { cwd: this.projectRoot }
    );
    
    return stdout.split('\n').filter(f => f.length > 0);
  }

  private hasCircularDependencies(context: any): boolean {
    // Simple check - would use madge or similar for real detection
    return false;
  }

  private async countTotalLines(): Promise<number> {
    try {
      const { stdout } = await execAsync(
        'find . -name "*.ts" -not -path "./node_modules/*" | xargs wc -l | tail -1',
        { cwd: this.projectRoot }
      );
      
      return parseInt(stdout.trim().split(' ')[0]) || 0;
    } catch {
      return 0;
    }
  }

  private async persistTrend(trend: DebtTrend): Promise<void> {
    // Would store in database
    this.logger.debug('Persisting debt trend', { trend });
  }

  /**
   * Export debt data
   */
  async exportDebtData(format: 'json' | 'csv' | 'markdown'): Promise<string> {
    const report = await this.generateReport();
    
    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      
      case 'csv':
        return this.convertToCSV(report);
      
      case 'markdown':
        return this.convertToMarkdown(report);
      
      default:
        return JSON.stringify(report);
    }
  }

  private convertToCSV(report: DebtReport): string {
    const rows = ['Type,Severity,Title,Location,Effort,Impact'];
    
    for (const debt of report.topIssues) {
      rows.push([
        debt.type,
        debt.severity,
        `"${debt.title}"`,
        debt.location.file || debt.location.component || '',
        debt.effort.estimated.toString(),
        debt.impact.maintainability.toString()
      ].join(','));
    }
    
    return rows.join('\n');
  }

  private convertToMarkdown(report: DebtReport): string {
    return `
# Technical Debt Report

## Summary
- Total Debt Items: ${report.summary.totalDebt}
- Critical Items: ${report.summary.criticalItems}
- Estimated Effort: ${report.summary.estimatedEffort} hours
- Debt Ratio: ${(report.summary.debtRatio * 100).toFixed(1)}%

## By Type
${Object.entries(report.byType).map(([type, summary]) => `
### ${type.replace(/_/g, ' ').toUpperCase()}
- Count: ${summary.count}
- Effort: ${summary.estimatedEffort} hours
- Severity: ${Object.entries(summary.severity).map(([sev, count]) => `${sev}: ${count}`).join(', ')}
`).join('\n')}

## Top Issues
${report.topIssues.map((debt, i) => `
${i + 1}. **${debt.title}** [${debt.severity}]
   - Location: ${debt.location.file || debt.location.component || 'Multiple'}
   - Effort: ${debt.effort.estimated}h
   - Impact: Maintainability ${(debt.impact.maintainability * 100).toFixed(0)}%
`).join('\n')}

## Recommendations
${report.recommendations.map((plan, i) => `
${i + 1}. **${plan.title}**
   - Priority: ${plan.priority.toFixed(1)}
   - Effort: ${plan.estimatedEffort}h
   - Expected Benefit: ${(plan.expectedBenefit.overall * 100).toFixed(0)}% improvement
   - Steps: ${plan.steps.length}
`).join('\n')}
`;
  }
}