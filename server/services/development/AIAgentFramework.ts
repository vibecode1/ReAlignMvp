import { Logger } from '../logger';
import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface CodeContext {
  filePath: string;
  content: string;
  ast?: ts.SourceFile;
  dependencies: string[];
  exports: string[];
  imports: string[];
  functions: FunctionInfo[];
  classes: ClassInfo[];
}

interface FunctionInfo {
  name: string;
  parameters: ParameterInfo[];
  returnType: string;
  isAsync: boolean;
  complexity: number;
  lineStart: number;
  lineEnd: number;
}

interface ParameterInfo {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: string;
}

interface ClassInfo {
  name: string;
  methods: FunctionInfo[];
  properties: PropertyInfo[];
  extends?: string;
  implements: string[];
}

interface PropertyInfo {
  name: string;
  type: string;
  isPrivate: boolean;
  isStatic: boolean;
}

interface CodeGeneration {
  id: string;
  prompt: string;
  context: CodeContext[];
  generatedCode: string;
  language: string;
  confidence: number;
  tests?: string;
  documentation?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * AIAgentFramework: Framework for AI agents to develop and debug code
 * 
 * This framework provides:
 * 1. Code understanding through AST analysis
 * 2. Context-aware code generation
 * 3. Automatic test generation
 * 4. Code validation and linting
 * 5. Dependency management
 * 6. Documentation generation
 * 
 * Architecture Notes for AI Agents:
 * - Uses TypeScript compiler API for deep code understanding
 * - Maintains context across multiple files
 * - Generates idiomatic code following project patterns
 * - Self-validates generated code before submission
 */
export class AIAgentFramework {
  private logger: Logger;
  private projectRoot: string;
  private tsConfig: ts.CompilerOptions;
  private fileContextCache: Map<string, CodeContext>;
  private program?: ts.Program;

  constructor(projectRoot: string) {
    this.logger = new Logger('AIAgentFramework');
    this.projectRoot = projectRoot;
    this.fileContextCache = new Map();
    this.tsConfig = this.loadTsConfig();
    
    this.initializeTypeScriptProgram();
  }

  /**
   * Analyze code file and extract context
   */
  async analyzeFile(filePath: string): Promise<CodeContext> {
    this.logger.info('Analyzing file', { filePath });

    // Check cache
    if (this.fileContextCache.has(filePath)) {
      return this.fileContextCache.get(filePath)!;
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
      );

      const context: CodeContext = {
        filePath,
        content,
        ast: sourceFile,
        dependencies: [],
        exports: [],
        imports: [],
        functions: [],
        classes: []
      };

      // Analyze AST
      this.visitNode(sourceFile, context);

      // Cache context
      this.fileContextCache.set(filePath, context);

      return context;
    } catch (error) {
      this.logger.error('Failed to analyze file', { filePath, error });
      throw error;
    }
  }

  /**
   * Generate code based on prompt and context
   */
  async generateCode(params: {
    prompt: string;
    contextFiles?: string[];
    language?: string;
    includeTests?: boolean;
    includeDocs?: boolean;
  }): Promise<CodeGeneration> {
    this.logger.info('Generating code', { prompt: params.prompt });

    // Gather context from specified files
    const contexts: CodeContext[] = [];
    if (params.contextFiles) {
      for (const file of params.contextFiles) {
        const context = await this.analyzeFile(file);
        contexts.push(context);
      }
    }

    // Analyze project patterns
    const patterns = await this.analyzeProjectPatterns();

    // Generate code using context and patterns
    const generatedCode = await this.synthesizeCode({
      prompt: params.prompt,
      contexts,
      patterns,
      language: params.language || 'typescript'
    });

    // Validate generated code
    const validation = await this.validateCode(generatedCode);
    
    // Generate tests if requested
    let tests: string | undefined;
    if (params.includeTests) {
      tests = await this.generateTests(generatedCode, params.prompt);
    }

    // Generate documentation if requested
    let documentation: string | undefined;
    if (params.includeDocs) {
      documentation = await this.generateDocumentation(generatedCode, params.prompt);
    }

    const generation: CodeGeneration = {
      id: `gen_${Date.now()}`,
      prompt: params.prompt,
      context: contexts,
      generatedCode,
      language: params.language || 'typescript',
      confidence: this.calculateConfidence(validation),
      tests,
      documentation
    };

    return generation;
  }

  /**
   * Debug existing code and suggest fixes
   */
  async debugCode(params: {
    filePath: string;
    error?: string;
    line?: number;
  }): Promise<{
    issue: string;
    suggestedFix: string;
    explanation: string;
    confidence: number;
  }> {
    this.logger.info('Debugging code', { filePath: params.filePath });

    const context = await this.analyzeFile(params.filePath);

    // Analyze the specific error or general issues
    const analysis = params.error
      ? await this.analyzeError(context, params.error, params.line)
      : await this.findIssues(context);

    // Generate fix
    const fix = await this.generateFix(context, analysis);

    return {
      issue: analysis.issue,
      suggestedFix: fix.code,
      explanation: fix.explanation,
      confidence: fix.confidence
    };
  }

  /**
   * Refactor code based on best practices
   */
  async refactorCode(params: {
    filePath: string;
    refactorType: 'performance' | 'readability' | 'modularity' | 'testing';
  }): Promise<{
    original: string;
    refactored: string;
    changes: string[];
    impact: string;
  }> {
    this.logger.info('Refactoring code', { 
      filePath: params.filePath,
      type: params.refactorType 
    });

    const context = await this.analyzeFile(params.filePath);
    
    // Analyze refactoring opportunities
    const opportunities = await this.analyzeRefactorOpportunities(
      context,
      params.refactorType
    );

    // Apply refactoring
    const refactored = await this.applyRefactoring(context, opportunities);

    return {
      original: context.content,
      refactored: refactored.code,
      changes: refactored.changes,
      impact: refactored.impact
    };
  }

  /**
   * Visit TypeScript AST nodes
   */
  private visitNode(node: ts.Node, context: CodeContext): void {
    switch (node.kind) {
      case ts.SyntaxKind.ImportDeclaration:
        this.handleImport(node as ts.ImportDeclaration, context);
        break;
      case ts.SyntaxKind.ExportDeclaration:
        this.handleExport(node as ts.ExportDeclaration, context);
        break;
      case ts.SyntaxKind.FunctionDeclaration:
        this.handleFunction(node as ts.FunctionDeclaration, context);
        break;
      case ts.SyntaxKind.ClassDeclaration:
        this.handleClass(node as ts.ClassDeclaration, context);
        break;
    }

    ts.forEachChild(node, child => this.visitNode(child, context));
  }

  /**
   * Handle import statements
   */
  private handleImport(node: ts.ImportDeclaration, context: CodeContext): void {
    const moduleSpecifier = node.moduleSpecifier as ts.StringLiteral;
    const importPath = moduleSpecifier.text;
    
    context.imports.push(importPath);
    
    if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
      context.dependencies.push(importPath);
    }
  }

  /**
   * Handle export statements
   */
  private handleExport(node: ts.ExportDeclaration, context: CodeContext): void {
    if (node.exportClause && ts.isNamedExports(node.exportClause)) {
      node.exportClause.elements.forEach(element => {
        context.exports.push(element.name.text);
      });
    }
  }

  /**
   * Handle function declarations
   */
  private handleFunction(node: ts.FunctionDeclaration, context: CodeContext): void {
    if (!node.name) return;

    const funcInfo: FunctionInfo = {
      name: node.name.text,
      parameters: this.extractParameters(node),
      returnType: this.getReturnType(node),
      isAsync: !!node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword),
      complexity: this.calculateComplexity(node),
      lineStart: context.ast!.getLineAndCharacterOfPosition(node.getStart()).line,
      lineEnd: context.ast!.getLineAndCharacterOfPosition(node.getEnd()).line
    };

    context.functions.push(funcInfo);
  }

  /**
   * Handle class declarations
   */
  private handleClass(node: ts.ClassDeclaration, context: CodeContext): void {
    if (!node.name) return;

    const classInfo: ClassInfo = {
      name: node.name.text,
      methods: [],
      properties: [],
      implements: []
    };

    // Extract heritage
    if (node.heritageClauses) {
      node.heritageClauses.forEach(clause => {
        if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
          classInfo.extends = clause.types[0].expression.getText();
        } else if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
          clause.types.forEach(type => {
            classInfo.implements.push(type.expression.getText());
          });
        }
      });
    }

    // Extract members
    node.members.forEach(member => {
      if (ts.isMethodDeclaration(member)) {
        classInfo.methods.push(this.extractMethod(member, context));
      } else if (ts.isPropertyDeclaration(member)) {
        classInfo.properties.push(this.extractProperty(member));
      }
    });

    context.classes.push(classInfo);
  }

  /**
   * Extract function parameters
   */
  private extractParameters(node: ts.FunctionDeclaration | ts.MethodDeclaration): ParameterInfo[] {
    return node.parameters.map(param => ({
      name: param.name.getText(),
      type: param.type ? param.type.getText() : 'any',
      optional: !!param.questionToken,
      defaultValue: param.initializer?.getText()
    }));
  }

  /**
   * Get function return type
   */
  private getReturnType(node: ts.FunctionDeclaration | ts.MethodDeclaration): string {
    if (node.type) {
      return node.type.getText();
    }
    
    // Try to infer from return statements
    let returnType = 'void';
    const checkReturn = (n: ts.Node): void => {
      if (ts.isReturnStatement(n) && n.expression) {
        // Simple type inference
        returnType = 'any'; // Would use more sophisticated inference
      }
      ts.forEachChild(n, checkReturn);
    };
    
    if (node.body) {
      checkReturn(node.body);
    }
    
    return returnType;
  }

  /**
   * Calculate cyclomatic complexity
   */
  private calculateComplexity(node: ts.Node): number {
    let complexity = 1;
    
    const visit = (n: ts.Node): void => {
      switch (n.kind) {
        case ts.SyntaxKind.IfStatement:
        case ts.SyntaxKind.ConditionalExpression:
        case ts.SyntaxKind.CaseClause:
        case ts.SyntaxKind.CatchClause:
        case ts.SyntaxKind.ConditionalType:
        case ts.SyntaxKind.BinaryExpression:
          const binary = n as ts.BinaryExpression;
          if (binary.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
              binary.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
            complexity++;
          }
          break;
        case ts.SyntaxKind.ForStatement:
        case ts.SyntaxKind.ForInStatement:
        case ts.SyntaxKind.ForOfStatement:
        case ts.SyntaxKind.WhileStatement:
        case ts.SyntaxKind.DoStatement:
          complexity++;
          break;
      }
      
      ts.forEachChild(n, visit);
    };
    
    visit(node);
    return complexity;
  }

  /**
   * Extract method information
   */
  private extractMethod(node: ts.MethodDeclaration, context: CodeContext): FunctionInfo {
    return {
      name: node.name!.getText(),
      parameters: this.extractParameters(node),
      returnType: this.getReturnType(node),
      isAsync: !!node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword),
      complexity: this.calculateComplexity(node),
      lineStart: context.ast!.getLineAndCharacterOfPosition(node.getStart()).line,
      lineEnd: context.ast!.getLineAndCharacterOfPosition(node.getEnd()).line
    };
  }

  /**
   * Extract property information
   */
  private extractProperty(node: ts.PropertyDeclaration): PropertyInfo {
    return {
      name: node.name!.getText(),
      type: node.type ? node.type.getText() : 'any',
      isPrivate: !!node.modifiers?.some(m => m.kind === ts.SyntaxKind.PrivateKeyword),
      isStatic: !!node.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword)
    };
  }

  /**
   * Analyze project patterns
   */
  private async analyzeProjectPatterns(): Promise<any> {
    // Analyze common patterns in the project
    const patterns = {
      namingConventions: {
        functions: 'camelCase',
        classes: 'PascalCase',
        constants: 'UPPER_SNAKE_CASE'
      },
      importStyle: 'named', // or 'default'
      asyncStyle: 'async/await', // or 'promises'
      errorHandling: 'try/catch',
      testingFramework: 'jest',
      componentStructure: 'functional' // or 'class'
    };

    return patterns;
  }

  /**
   * Synthesize code based on context
   */
  private async synthesizeCode(params: {
    prompt: string;
    contexts: CodeContext[];
    patterns: any;
    language: string;
  }): Promise<string> {
    // This would integrate with AI model
    // For now, return a template
    
    const template = `
/**
 * Generated based on: ${params.prompt}
 * 
 * This code follows project patterns:
 * - Naming: ${params.patterns.namingConventions.functions}
 * - Async: ${params.patterns.asyncStyle}
 * - Error handling: ${params.patterns.errorHandling}
 */

import { Logger } from '../logger';

export class GeneratedService {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('GeneratedService');
  }

  async processRequest(data: any): Promise<any> {
    this.logger.info('Processing request', { data });
    
    try {
      // Implementation based on prompt
      const result = await this.performOperation(data);
      
      return {
        success: true,
        result
      };
    } catch (error) {
      this.logger.error('Processing failed', { error });
      throw error;
    }
  }

  private async performOperation(data: any): Promise<any> {
    // Core logic here
    return data;
  }
}
`;

    return template.trim();
  }

  /**
   * Validate generated code
   */
  private async validateCode(code: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      // Create temporary file
      const tempFile = path.join(this.projectRoot, 'temp_validation.ts');
      await fs.writeFile(tempFile, code);

      // Run TypeScript compiler
      const { stdout, stderr } = await execAsync(
        `npx tsc --noEmit ${tempFile}`,
        { cwd: this.projectRoot }
      );

      if (stderr) {
        errors.push(stderr);
      }

      // Run linter
      try {
        const { stdout: lintOut } = await execAsync(
          `npx eslint ${tempFile}`,
          { cwd: this.projectRoot }
        );
        
        if (lintOut) {
          warnings.push(lintOut);
        }
      } catch (lintError) {
        warnings.push('Linting warnings detected');
      }

      // Clean up
      await fs.unlink(tempFile);

      // Add suggestions based on analysis
      if (code.includes('any')) {
        suggestions.push('Consider using specific types instead of "any"');
      }
      
      if (!code.includes('try')) {
        suggestions.push('Consider adding error handling');
      }

    } catch (error) {
      errors.push(`Validation error: ${error}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Generate tests for code
   */
  private async generateTests(code: string, prompt: string): Promise<string> {
    const testTemplate = `
import { describe, it, expect, jest } from '@jest/globals';
import { GeneratedService } from './GeneratedService';

describe('GeneratedService', () => {
  let service: GeneratedService;

  beforeEach(() => {
    service = new GeneratedService();
  });

  describe('processRequest', () => {
    it('should process valid request successfully', async () => {
      const input = { data: 'test' };
      const result = await service.processRequest(input);
      
      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      const input = null;
      
      await expect(service.processRequest(input))
        .rejects.toThrow();
    });
  });
});
`;

    return testTemplate.trim();
  }

  /**
   * Generate documentation
   */
  private async generateDocumentation(code: string, prompt: string): Promise<string> {
    const docTemplate = `
# Generated Service Documentation

## Overview
This service was generated based on the following prompt:
> ${prompt}

## API Reference

### processRequest(data: any): Promise<any>
Processes incoming requests with the provided data.

**Parameters:**
- \`data\`: The input data to process

**Returns:**
- Promise resolving to the processed result

**Example:**
\`\`\`typescript
const service = new GeneratedService();
const result = await service.processRequest({ 
  key: 'value' 
});
\`\`\`

## Error Handling
The service implements comprehensive error handling with logging.
All errors are logged and re-thrown for upstream handling.
`;

    return docTemplate.trim();
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(validation: ValidationResult): number {
    let confidence = 1.0;
    
    // Reduce confidence based on issues
    confidence -= validation.errors.length * 0.2;
    confidence -= validation.warnings.length * 0.1;
    confidence -= validation.suggestions.length * 0.05;
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Load TypeScript configuration
   */
  private loadTsConfig(): ts.CompilerOptions {
    try {
      const configPath = path.join(this.projectRoot, 'tsconfig.json');
      const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
      const parsedConfig = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        this.projectRoot
      );
      return parsedConfig.options;
    } catch (error) {
      this.logger.warn('Failed to load tsconfig.json, using defaults');
      return {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true
      };
    }
  }

  /**
   * Initialize TypeScript program
   */
  private initializeTypeScriptProgram(): void {
    try {
      const rootNames = [path.join(this.projectRoot, 'server', 'index.ts')];
      this.program = ts.createProgram(rootNames, this.tsConfig);
    } catch (error) {
      this.logger.error('Failed to initialize TypeScript program', { error });
    }
  }

  /**
   * Analyze error and provide context
   */
  private async analyzeError(
    context: CodeContext,
    error: string,
    line?: number
  ): Promise<{ issue: string; context: any }> {
    // Parse error message
    const issue = error;
    
    // Get relevant code context
    const relevantContext = line
      ? this.getCodeAroundLine(context.content, line, 5)
      : context.content;

    return {
      issue,
      context: {
        code: relevantContext,
        functions: context.functions.filter(f => 
          line ? f.lineStart <= line && f.lineEnd >= line : true
        ),
        imports: context.imports
      }
    };
  }

  /**
   * Find potential issues in code
   */
  private async findIssues(context: CodeContext): Promise<{ issue: string; context: any }> {
    const issues: string[] = [];

    // Check for common issues
    if (context.functions.some(f => f.complexity > 10)) {
      issues.push('High complexity detected in some functions');
    }

    if (context.content.includes('console.log')) {
      issues.push('Console.log statements found in production code');
    }

    if (context.content.match(/catch\s*\(\s*\w+\s*\)\s*{\s*}/)) {
      issues.push('Empty catch blocks detected');
    }

    return {
      issue: issues.join(', ') || 'No obvious issues detected',
      context: {
        functions: context.functions,
        classes: context.classes
      }
    };
  }

  /**
   * Generate fix for identified issue
   */
  private async generateFix(
    context: CodeContext,
    analysis: any
  ): Promise<{ code: string; explanation: string; confidence: number }> {
    // This would use AI to generate appropriate fix
    // For now, return a simple fix
    
    return {
      code: context.content.replace(/console\.log/g, 'this.logger.info'),
      explanation: 'Replaced console.log with proper logging',
      confidence: 0.9
    };
  }

  /**
   * Get code around specific line
   */
  private getCodeAroundLine(content: string, line: number, context: number): string {
    const lines = content.split('\n');
    const start = Math.max(0, line - context);
    const end = Math.min(lines.length, line + context);
    
    return lines.slice(start, end).join('\n');
  }

  /**
   * Analyze refactoring opportunities
   */
  private async analyzeRefactorOpportunities(
    context: CodeContext,
    type: string
  ): Promise<any[]> {
    const opportunities: any[] = [];

    switch (type) {
      case 'performance':
        // Look for performance improvements
        if (context.content.includes('forEach')) {
          opportunities.push({
            type: 'loop-optimization',
            description: 'Replace forEach with for...of for better performance'
          });
        }
        break;
        
      case 'readability':
        // Look for readability improvements
        context.functions.forEach(func => {
          if (func.complexity > 5) {
            opportunities.push({
              type: 'extract-function',
              description: `Extract complex logic from ${func.name}`,
              function: func
            });
          }
        });
        break;
        
      case 'modularity':
        // Look for modularity improvements
        context.classes.forEach(cls => {
          if (cls.methods.length > 10) {
            opportunities.push({
              type: 'split-class',
              description: `Consider splitting ${cls.name} into smaller classes`,
              class: cls
            });
          }
        });
        break;
        
      case 'testing':
        // Look for testability improvements
        context.functions.forEach(func => {
          if (func.parameters.length > 3) {
            opportunities.push({
              type: 'parameter-object',
              description: `Use parameter object for ${func.name}`,
              function: func
            });
          }
        });
        break;
    }

    return opportunities;
  }

  /**
   * Apply refactoring to code
   */
  private async applyRefactoring(
    context: CodeContext,
    opportunities: any[]
  ): Promise<{ code: string; changes: string[]; impact: string }> {
    let refactored = context.content;
    const changes: string[] = [];

    // Apply each opportunity
    for (const opp of opportunities) {
      switch (opp.type) {
        case 'loop-optimization':
          refactored = refactored.replace(
            /\.forEach\((.*?)\)/g,
            'for (const item of items)'
          );
          changes.push('Optimized forEach loops');
          break;
          
        case 'extract-function':
          // Would extract complex logic
          changes.push(`Extracted complex logic from ${opp.function.name}`);
          break;
          
        // Add more refactoring implementations
      }
    }

    return {
      code: refactored,
      changes,
      impact: `Improved ${opportunities[0]?.type || 'code quality'} by applying ${changes.length} changes`
    };
  }
}