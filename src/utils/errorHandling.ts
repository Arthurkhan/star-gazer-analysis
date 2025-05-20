// src/utils/errorHandling.ts
// Enhanced error handling utilities for the application

import { toast } from '@/hooks/use-toast';
import { appDebugger } from './debugger';

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  module?: string;
  component?: string;
  operation?: string;
  data?: any;
  retry?: () => Promise<any>;
}

// Central error handler with severity levels
export function handleError(
  error: unknown, 
  context: ErrorContext, 
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  showToast = true
): Error {
  // Standardize error object
  const standardError = error instanceof Error ? error : new Error(String(error));
  
  // Enhance error with context
  const enhancedError = Object.assign(standardError, { context });
  
  // Log based on severity
  switch (severity) {
    case ErrorSeverity.INFO:
      appDebugger.info(`${context.module || 'Application'} info: ${standardError.message}`, { 
        error: enhancedError, 
        context 
      });
      break;
    case ErrorSeverity.WARNING:
      appDebugger.warn(`${context.module || 'Application'} warning: ${standardError.message}`, { 
        error: enhancedError, 
        context 
      });
      break;
    case ErrorSeverity.ERROR:
      appDebugger.error(`${context.module || 'Application'} error: ${standardError.message}`, { 
        error: enhancedError, 
        context 
      });
      break;
    case ErrorSeverity.CRITICAL:
      appDebugger.error(`CRITICAL ${context.module || 'Application'} error: ${standardError.message}`, { 
        error: enhancedError, 
        context,
        isCritical: true
      });
      break;
  }
  
  // Show toast notification if enabled
  if (showToast) {
    const toastVariant = severity === ErrorSeverity.INFO 
      ? 'default' 
      : severity === ErrorSeverity.WARNING 
        ? 'warning' 
        : 'destructive';
    
    toast({
      title: `${context.operation || context.module || 'Application'} ${severity === ErrorSeverity.INFO ? 'Notice' : severity === ErrorSeverity.WARNING ? 'Warning' : 'Error'}`,
      description: standardError.message,
      variant: toastVariant,
      action: context.retry ? {
        label: 'Retry',
        onClick: () => {
          if (context.retry) context.retry();
        }
      } : undefined
    });
  }
  
  return enhancedError;
}

// Wrapper for async functions to automatically handle errors
export function withErrorHandling<T>(
  fn: (...args: any[]) => Promise<T>,
  context: ErrorContext,
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  showToast = true
): (...args: any[]) => Promise<T> {
  return async (...args: any[]): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      // Add retry capability
      context.retry = () => fn(...args);
      
      throw handleError(error, context, severity, showToast);
    }
  };
}

// Extension of safeParseJSON that uses the central error handling
export function safeParse<T>(
  text: string, 
  defaultValue: T, 
  context?: Partial<ErrorContext>
): T {
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    handleError(error, {
      module: 'DataParser',
      operation: 'JSON parsing',
      ...context
    }, ErrorSeverity.WARNING, false);
    
    return defaultValue;
  }
}

// NetworkError class for handling API/fetch failures
export class NetworkError extends Error {
  status: number;
  statusText: string;
  response?: any;
  
  constructor(message: string, status: number, statusText: string, response?: any) {
    super(message);
    this.name = 'NetworkError';
    this.status = status;
    this.statusText = statusText;
    this.response = response;
  }
}

// Helper for handling fetch requests with proper error handling
export async function safeFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  context?: Partial<ErrorContext>
): Promise<T> {
  try {
    const response = await fetch(input, init);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = null;
      }
      
      throw new NetworkError(
        errorData?.message || `Request failed with status ${response.status}`,
        response.status,
        response.statusText,
        errorData
      );
    }
    
    return await response.json() as T;
  } catch (error) {
    throw handleError(error, {
      module: 'Network',
      operation: 'API request',
      data: { url: typeof input === 'string' ? input : input.toString() },
      ...context
    }, ErrorSeverity.ERROR, true);
  }
}

// Setup application-wide error listeners
export function setupAdvancedErrorHandling() {
  // Capture unhandled errors - extending the existing global error handler
  window.addEventListener('error', (event) => {
    // Already handled by the basic debugger
    // We'll add some additional handling here if needed
    
    // If the error is related to a script loading issue, we'll handle it specially
    if (event.filename && event.filename.includes('.js') && event.message.includes('loading')) {
      toast({
        title: 'Resource Loading Error',
        description: 'Failed to load a required script. Please refresh the page or check your internet connection.',
        variant: 'destructive'
      });
    }
  });
  
  // Enhanced unhandled promise rejection handling
  window.addEventListener('unhandledrejection', (event) => {
    // Already logged by the basic debugger
    
    // Provide user feedback for common async errors
    const errorMessage = event.reason instanceof Error 
      ? event.reason.message 
      : typeof event.reason === 'string' 
        ? event.reason 
        : 'An unexpected error occurred';
    
    // Don't show toast for network-related errors (they're handled elsewhere)
    if (
      !(event.reason instanceof NetworkError) &&
      !errorMessage.includes('fetch') &&
      !errorMessage.includes('network') &&
      !errorMessage.includes('Failed to fetch')
    ) {
      toast({
        title: 'Application Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });
  
  // Monitor browser memory usage to help prevent crashes
  if ('performance' in window && 'memory' in performance) {
    const memoryCheck = setInterval(() => {
      const memoryInfo = (performance as any).memory;
      if (memoryInfo && memoryInfo.usedJSHeapSize > memoryInfo.jsHeapSizeLimit * 0.9) {
        appDebugger.warn('High memory usage detected', memoryInfo);
        toast({
          title: 'Performance Warning',
          description: 'The application is using a lot of memory. Consider refreshing the page.',
          variant: 'warning'
        });
      }
    }, 30000); // Check every 30 seconds
    
    // Cleanup
    window.addEventListener('beforeunload', () => {
      clearInterval(memoryCheck);
    });
  }
}