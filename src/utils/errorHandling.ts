/**
 * Error Handling and Monitoring System - Phase 5
 * 
 * Comprehensive error handling, logging, and monitoring utilities
 * for improved reliability and debugging capabilities.
 */

import { PerformanceMonitor } from './performanceOptimizations';

// Error types for better categorization
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  PERMISSION = 'PERMISSION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Custom error class with additional context
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly context: Record<string, any>;
  public readonly timestamp: Date;
  public readonly userId?: string;
  public readonly sessionId?: string;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Record<string, any> = {}
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date();
    
    // Capture session context if available
    this.sessionId = this.generateSessionId();
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  private generateSessionId(): string {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      let sessionId = sessionStorage.getItem('app-session-id');
      if (!sessionId) {
        sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('app-session-id', sessionId);
      }
      return sessionId;
    }
    return `session-${Date.now()}`;
  }

  // Convert to loggable object
  toLogObject(): Record<string, any> {
    return {
      message: this.message,
      type: this.type,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      stack: this.stack
    };
  }
}

// Error logging and monitoring
export class ErrorLogger {
  private static instance: ErrorLogger;
  private errorHistory: AppError[] = [];
  private readonly maxHistorySize = 100;

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  logError(error: Error | AppError, additionalContext?: Record<string, any>): void {
    const stopMeasurement = PerformanceMonitor.startMeasurement('error-logging');
    
    try {
      // Convert to AppError if needed
      const appError = error instanceof AppError 
        ? error 
        : this.convertToAppError(error, additionalContext);

      // Add to history
      this.errorHistory.push(appError);
      if (this.errorHistory.length > this.maxHistorySize) {
        this.errorHistory.shift();
      }

      // Log to console with appropriate level
      this.logToConsole(appError);

      // Send to external monitoring if configured
      this.sendToMonitoring(appError);

      // Notify user for critical errors
      if (appError.severity === ErrorSeverity.CRITICAL) {
        this.notifyUser(appError);
      }

    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    } finally {
      stopMeasurement();
    }
  }

  private convertToAppError(error: Error, context?: Record<string, any>): AppError {
    // Determine error type based on error message/type
    let type = ErrorType.UNKNOWN;
    let severity = ErrorSeverity.MEDIUM;

    if (error.message.includes('fetch') || error.message.includes('network')) {
      type = ErrorType.NETWORK;
    } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
      type = ErrorType.PERMISSION;
      severity = ErrorSeverity.HIGH;
    } else if (error.message.includes('not found')) {
      type = ErrorType.NOT_FOUND;
      severity = ErrorSeverity.LOW;
    } else if (error.message.includes('validation')) {
      type = ErrorType.VALIDATION;
      severity = ErrorSeverity.LOW;
    }

    return new AppError(error.message, type, severity, {
      originalError: error.name,
      stack: error.stack,
      ...context
    });
  }

  private logToConsole(error: AppError): void {
    const logData = error.toLogObject();
    
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('🚨 CRITICAL ERROR:', logData);
        break;
      case ErrorSeverity.HIGH:
        console.error('❌ HIGH SEVERITY ERROR:', logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('⚠️ MEDIUM SEVERITY ERROR:', logData);
        break;
      case ErrorSeverity.LOW:
        console.log('ℹ️ LOW SEVERITY ERROR:', logData);
        break;
    }
  }

  private sendToMonitoring(error: AppError): void {
    // In a real application, you would send to services like:
    // - Sentry
    // - LogRocket  
    // - Datadog
    // - Custom logging endpoint
    
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to custom monitoring endpoint
      try {
        fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(error.toLogObject())
        }).catch(() => {
          // Silently fail to avoid error logging loops
        });
      } catch {
        // Silently fail
      }
    }
  }

  private notifyUser(error: AppError): void {
    // Show user-friendly error notification
    if (typeof window !== 'undefined') {
      // Use toast notification if available
      const event = new CustomEvent('app-error', { 
        detail: { 
          message: this.getUserFriendlyMessage(error),
          severity: error.severity 
        }
      });
      window.dispatchEvent(event);
    }
  }

  private getUserFriendlyMessage(error: AppError): string {
    switch (error.type) {
      case ErrorType.NETWORK:
        return 'Network connection issue. Please check your internet connection and try again.';
      case ErrorType.PERMISSION:
        return 'You don\'t have permission to perform this action.';
      case ErrorType.NOT_FOUND:
        return 'The requested resource could not be found.';
      case ErrorType.VALIDATION:
        return 'Please check your input and try again.';
      case ErrorType.SERVER:
        return 'Server error occurred. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  getErrorHistory(): AppError[] {
    return [...this.errorHistory];
  }

  getErrorStats(): Record<ErrorType, number> {
    const stats: Record<ErrorType, number> = {
      [ErrorType.NETWORK]: 0,
      [ErrorType.VALIDATION]: 0,
      [ErrorType.PERMISSION]: 0,
      [ErrorType.NOT_FOUND]: 0,
      [ErrorType.SERVER]: 0,
      [ErrorType.CLIENT]: 0,
      [ErrorType.UNKNOWN]: 0
    };

    this.errorHistory.forEach(error => {
      stats[error.type]++;
    });

    return stats;
  }

  clearHistory(): void {
    this.errorHistory = [];
  }
}

// React Error Boundary utilities
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundaryError extends AppError {
  constructor(error: Error, errorInfo: React.ErrorInfo) {
    super(
      `React Error Boundary: ${error.message}`,
      ErrorType.CLIENT,
      ErrorSeverity.HIGH,
      {
        componentStack: errorInfo.componentStack,
        originalError: error.name,
        stack: error.stack
      }
    );
  }
}

// Async error handler for promises
export function handleAsyncError<T>(
  promise: Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  return promise.catch(error => {
    ErrorLogger.getInstance().logError(error, context);
    throw error;
  });
}

// Safe function wrapper that catches and logs errors
export function safeExecute<T extends (...args: any[]) => any>(
  fn: T,
  context?: Record<string, any>
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  return (...args: Parameters<T>) => {
    try {
      return fn(...args);
    } catch (error) {
      ErrorLogger.getInstance().logError(error as Error, {
        functionName: fn.name,
        arguments: args,
        ...context
      });
      return undefined;
    }
  };
}

// Memory leak detection
export class MemoryLeakDetector {
  private static intervals: Set<NodeJS.Timeout> = new Set();
  private static eventListeners: Map<string, EventListener[]> = new Map();
  
  static addInterval(interval: NodeJS.Timeout): void {
    this.intervals.add(interval);
  }

  static removeInterval(interval: NodeJS.Timeout): void {
    clearInterval(interval);
    this.intervals.delete(interval);
  }

  static addEventListener(element: EventTarget, event: string, listener: EventListener): void {
    element.addEventListener(event, listener);
    
    const key = `${element.constructor.name}-${event}`;
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, []);
    }
    this.eventListeners.get(key)!.push(listener);
  }

  static cleanup(): void {
    // Clear all tracked intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();

    // Log potential memory leaks
    if (this.eventListeners.size > 0) {
      console.warn('Potential memory leaks detected:', Array.from(this.eventListeners.keys()));
    }

    this.eventListeners.clear();
  }

  static getLeakReport(): { intervals: number; eventListeners: number; details: Record<string, number> } {
    const details: Record<string, number> = {};
    this.eventListeners.forEach((listeners, key) => {
      details[key] = listeners.length;
    });

    return {
      intervals: this.intervals.size,
      eventListeners: this.eventListeners.size,
      details
    };
  }
}

// Global error handlers
if (typeof window !== 'undefined') {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    ErrorLogger.getInstance().logError(
      new AppError(
        `Unhandled Promise Rejection: ${event.reason}`,
        ErrorType.CLIENT,
        ErrorSeverity.HIGH,
        { reason: event.reason }
      )
    );
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    ErrorLogger.getInstance().logError(
      new AppError(
        event.message,
        ErrorType.CLIENT,
        ErrorSeverity.MEDIUM,
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error
        }
      )
    );
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    MemoryLeakDetector.cleanup();
  });
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance();

export default {
  AppError,
  ErrorLogger,
  ErrorBoundaryError,
  ErrorType,
  ErrorSeverity,
  errorLogger,
  handleAsyncError,
  safeExecute,
  MemoryLeakDetector
};
