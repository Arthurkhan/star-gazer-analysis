/**
 * Consolidated Logging System - Phase 1 Optimization
 * 
 * This module provides a simple, efficient logging system that consolidates
 * functionality from logger.ts, debugger.ts, and loggingService.ts
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  namespace: string;
  data?: any;
}

class ConsolidatedLogger {
  private namespace: string;
  private isDevelopment: boolean;
  private logs: LogEntry[] = [];
  private maxLogs: number = 100;

  constructor(namespace: string) {
    this.namespace = namespace;
    this.isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  }

  private addToHistory(level: LogLevel, message: string, data?: any): void {
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      namespace: this.namespace,
      data
    };

    this.logs.push(logEntry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Log an informational message
   */
  public log(message: string, ...optionalParams: any[]): void {
    this.addToHistory('info', message, optionalParams.length > 0 ? optionalParams : undefined);
    console.log(`[${this.namespace}]`, message, ...optionalParams);
  }

  /**
   * Log an informational message (alias for log)
   */
  public info(message: string, ...optionalParams: any[]): void {
    this.addToHistory('info', message, optionalParams.length > 0 ? optionalParams : undefined);
    console.info(`[${this.namespace}] ℹ️`, message, ...optionalParams);
  }

  /**
   * Log a warning message
   */
  public warn(message: string, ...optionalParams: any[]): void {
    this.addToHistory('warn', message, optionalParams.length > 0 ? optionalParams : undefined);
    console.warn(`[${this.namespace}] ⚠️`, message, ...optionalParams);
  }

  /**
   * Log an error message
   */
  public error(message: string, ...optionalParams: any[]): void {
    this.addToHistory('error', message, optionalParams.length > 0 ? optionalParams : undefined);
    console.error(`[${this.namespace}] 🔴`, message, ...optionalParams);
  }

  /**
   * Log a debug message (only in development mode)
   */
  public debug(message: string, ...optionalParams: any[]): void {
    if (this.isDevelopment) {
      this.addToHistory('debug', message, optionalParams.length > 0 ? optionalParams : undefined);
      console.debug(`[${this.namespace}] 🔍`, message, ...optionalParams);
    }
  }

  /**
   * Log a success message
   */
  public success(message: string, ...optionalParams: any[]): void {
    this.addToHistory('success', message, optionalParams.length > 0 ? optionalParams : undefined);
    console.log(`[${this.namespace}] ✅`, message, ...optionalParams);
  }

  /**
   * Get recent log entries
   */
  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear log history
   */
  public clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON string
   */
  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Create default application logger
export const appLogger = new ConsolidatedLogger('App');

// Export the logger class for creating namespaced loggers
export const Logger = ConsolidatedLogger;

// Default export
export default ConsolidatedLogger;

// Global error handling setup
export function setupGlobalErrorHandling(): void {
  if (typeof window === 'undefined') return;

  const errorLogger = new ConsolidatedLogger('GlobalError');

  // Capture unhandled errors
  window.addEventListener('error', (event) => {
    errorLogger.error('Unhandled error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    });
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorLogger.error('Unhandled promise rejection', {
      reason: event.reason instanceof Error 
        ? { message: event.reason.message, stack: event.reason.stack }
        : event.reason
    });
  });

  errorLogger.info('Global error handling initialized');
}
