/**
 * Consolidated Logging System with Test-Compatible API
 * 
 * This module provides a logging system that supports both the new consolidated
 * approach and the test-expected API for backward compatibility
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: any;
}

class Logger {
  private level: LogLevel = 'INFO';
  private context: string = '';
  private logs: LogEntry[] = [];
  private maxLogs: number = 100;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  }

  /**
   * Set the logging level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Set the logging context
   */
  setContext(context: string): void {
    this.context = context;
  }

  /**
   * Get current context
   */
  getContext(): string {
    return this.context;
  }

  /**
   * Check if a log level should be logged based on current level
   */
  private shouldLog(msgLevel: LogLevel): boolean {
    const levels: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const currentLevelIndex = levels.indexOf(this.level);
    const msgLevelIndex = levels.indexOf(msgLevel);
    return msgLevelIndex >= currentLevelIndex;
  }

  /**
   * Format log message with context and timestamp
   */
  private formatMessage(message: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = this.context ? `[${this.context}] ` : '';
    return `[${timestamp}] ${contextStr}${message}`;
  }

  /**
   * Add log entry to history
   */
  private addToHistory(level: LogLevel, message: string, data?: any): void {
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: this.context,
      data
    };

    this.logs.push(logEntry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Log a debug message
   */
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('DEBUG')) {
      this.addToHistory('DEBUG', message, args.length > 0 ? args : undefined);
      const formattedMsg = this.formatMessage(message);
      console.debug(formattedMsg, ...args);
    }
  }

  /**
   * Log an info message
   */
  info(message: string, ...args: any[]): void {
    if (this.shouldLog('INFO')) {
      this.addToHistory('INFO', message, args.length > 0 ? args : undefined);
      const formattedMsg = this.formatMessage(message);
      console.info(formattedMsg, ...args);
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('WARN')) {
      this.addToHistory('WARN', message, args.length > 0 ? args : undefined);
      const formattedMsg = this.formatMessage(message);
      console.warn(formattedMsg, ...args);
    }
  }

  /**
   * Log an error message
   */
  error(message: string, ...args: any[]): void {
    if (this.shouldLog('ERROR')) {
      this.addToHistory('ERROR', message, args.length > 0 ? args : undefined);
      const formattedMsg = this.formatMessage(message);
      console.error(formattedMsg, ...args);
    }
  }

  /**
   * Create a log group
   */
  group(label: string): void {
    console.group(label);
  }

  /**
   * End a log group
   */
  groupEnd(): void {
    console.groupEnd();
  }

  /**
   * Start performance timing
   */
  time(label: string): void {
    console.time(label);
  }

  /**
   * End performance timing
   */
  timeEnd(label: string): void {
    console.timeEnd(label);
  }

  /**
   * Get log history
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear log history
   */
  clearLogs(): void {
    this.logs = [];
  }
}

// Create and export the default logger instance
export const logger = new Logger();

// Export function to create a new logger with configuration
export function createLogger(config?: { level?: LogLevel; context?: string }): Logger {
  const newLogger = new Logger();
  if (config?.level) {
    newLogger.setLevel(config.level);
  }
  if (config?.context) {
    newLogger.setContext(config.context);
  }
  return newLogger;
}

// For backward compatibility with ConsolidatedLogger usage
export class ConsolidatedLogger {
  private namespace: string;
  private loggerInstance: Logger;

  constructor(namespace: string) {
    this.namespace = namespace;
    this.loggerInstance = createLogger({ context: namespace });
  }

  public log(message: string, ...optionalParams: any[]): void {
    this.loggerInstance.info(message, ...optionalParams);
  }

  public info(message: string, ...optionalParams: any[]): void {
    this.loggerInstance.info(message, ...optionalParams);
  }

  public warn(message: string, ...optionalParams: any[]): void {
    this.loggerInstance.warn(message, ...optionalParams);
  }

  public error(message: string, ...optionalParams: any[]): void {
    this.loggerInstance.error(message, ...optionalParams);
  }

  public debug(message: string, ...optionalParams: any[]): void {
    this.loggerInstance.debug(message, ...optionalParams);
  }

  public success(message: string, ...optionalParams: any[]): void {
    console.log(`[${this.namespace}] ✅`, message, ...optionalParams);
  }

  public getLogs(): LogEntry[] {
    return this.loggerInstance.getLogs();
  }

  public clearLogs(): void {
    this.loggerInstance.clearLogs();
  }

  public exportLogs(): string {
    return JSON.stringify(this.loggerInstance.getLogs(), null, 2);
  }
}

// Create default application logger
export const appLogger = new ConsolidatedLogger('App');

// Export the logger class for creating namespaced loggers
export const Logger = ConsolidatedLogger;

// Default export
export default logger;

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
