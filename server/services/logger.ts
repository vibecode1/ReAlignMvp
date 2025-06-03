/**
 * @ai-context Centralized logging service for debugging and monitoring
 * @debug-critical All system operations should use this logger
 */

export class Logger {
  private context: string;
  private enableDebug: boolean;

  constructor(context: string) {
    this.context = context;
    this.enableDebug = process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true';
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const base = `[${timestamp}] [${level}] [${this.context}] ${message}`;
    
    if (data) {
      return `${base} ${JSON.stringify(data, null, 2)}`;
    }
    
    return base;
  }

  info(message: string, data?: any): void {
    console.log(this.formatMessage('INFO', message, data));
  }

  debug(message: string, data?: any): void {
    if (this.enableDebug) {
      console.log(this.formatMessage('DEBUG', message, data));
    }
  }

  warn(message: string, data?: any): void {
    console.warn(this.formatMessage('WARN', message, data));
  }

  error(message: string, error?: any, data?: any): void {
    console.error(this.formatMessage('ERROR', message, { 
      ...data, 
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error 
    }));
  }

  trace(message: string, data?: any): void {
    if (this.enableDebug) {
      console.trace(this.formatMessage('TRACE', message, data));
    }
  }

  startTimer(label: string): () => void {
    const startTime = Date.now();
    this.debug(`Timer started: ${label}`);
    
    return () => {
      const duration = Date.now() - startTime;
      this.debug(`Timer ended: ${label}`, { duration: `${duration}ms` });
    };
  }
}