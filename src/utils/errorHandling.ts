/**
 * Simplified Error Handling - Phase 1 Consolidation
 * 
 * Basic error handling utilities without over-engineering
 * Reduces complexity from 11KB to essential functionality
 */

import { appLogger } from './logger';

// Simplified error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION', 
  SERVER = 'SERVER',
  CLIENT = 'CLIENT'
}

// Backward compatibility - Error severity enum
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

// Simple custom error class
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly timestamp: Date;

  constructor(message: string, type: ErrorType = ErrorType.CLIENT) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.timestamp = new Date();
  }
}

// Backward compatibility - Error boundary error class
export class ErrorBoundaryError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, ErrorType.CLIENT);
    this.name = 'ErrorBoundaryError';
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

/**
 * Log error with appropriate severity
 */
export function logError(error: Error | AppError, context?: string): void {
  const errorType = error instanceof AppError ? error.type : ErrorType.CLIENT;
  const contextStr = context ? ` [${context}]` : '';
  
  switch (errorType) {
    case ErrorType.NETWORK:
      appLogger.warn(`Network Error${contextStr}:`, error.message);
      break;
    case ErrorType.SERVER:
      appLogger.error(`Server Error${contextStr}:`, error.message);
      break;
    case ErrorType.VALIDATION:
      appLogger.info(`Validation Error${contextStr}:`, error.message);
      break;
    default:
      appLogger.error(`Client Error${contextStr}:`, error.message);
  }
}

// Backward compatibility - errorLogger alias
export const errorLogger = {
  error: (message: string, ...args: any[]) => appLogger.error(message, ...args),
  warn: (message: string, ...args: any[]) => appLogger.warn(message, ...args),
  info: (message: string, ...args: any[]) => appLogger.info(message, ...args),
  debug: (message: string, ...args: any[]) => appLogger.debug(message, ...args),
};

// Backward compatibility - handleError function
export function handleError(error: Error | AppError, context?: string): void {
  logError(error, context);
}

// Backward compatibility - setupAdvancedErrorHandling function
export function setupAdvancedErrorHandling(): void {
  // Simplified implementation - just ensure global handlers are set
  if (typeof window !== 'undefined') {
    // These are already set up below, so this is a no-op
    appLogger.info('Advanced error handling initialized (simplified)');
  }
}

/**
 * Handle async operations with error logging
 */
export async function handleAsyncError<T>(
  promise: Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    logError(error as Error, context);
    throw error;
  }
}

/**
 * Safe function wrapper that catches errors
 */
export function safeExecute<T extends (...args: any[]) => any>(
  fn: T,
  context?: string
): (...args: Parameters<T>) => ReturnType<T> | null {
  return (...args: Parameters<T>) => {
    try {
      return fn(...args);
    } catch (error) {
      logError(error as Error, context || fn.name);
      return null;
    }
  };
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: Error | AppError): string {
  if (error instanceof AppError) {
    switch (error.type) {
      case ErrorType.NETWORK:
        return 'Network connection issue. Please check your internet and try again.';
      case ErrorType.VALIDATION:
        return 'Please check your input and try again.';
      case ErrorType.SERVER:
        return 'Server error occurred. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Create network error
 */
export function createNetworkError(message: string): AppError {
  return new AppError(message, ErrorType.NETWORK);
}

/**
 * Create validation error
 */
export function createValidationError(message: string): AppError {
  return new AppError(message, ErrorType.VALIDATION);
}

/**
 * Create server error
 */
export function createServerError(message: string): AppError {
  return new AppError(message, ErrorType.SERVER);
}

// Global error handling (simplified)
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    logError(new AppError(`Unhandled Promise: ${event.reason}`, ErrorType.CLIENT));
  });

  window.addEventListener('error', (event) => {
    logError(new AppError(event.message || 'Global error', ErrorType.CLIENT));
  });
}

export default {
  AppError,
  ErrorType,
  ErrorSeverity,
  ErrorBoundaryError,
  logError,
  errorLogger,
  handleError,
  setupAdvancedErrorHandling,
  handleAsyncError,
  safeExecute,
  getUserFriendlyMessage,
  createNetworkError,
  createValidationError,
  createServerError
};
