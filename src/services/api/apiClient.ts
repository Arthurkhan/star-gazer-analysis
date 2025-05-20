// src/services/api/apiClient.ts
// Robust API client with retry capabilities and error handling

import { appDebugger } from '@/utils/debugger';
import { handleError, ErrorSeverity, NetworkError } from '@/utils/errorHandling';
import { supabase } from '@/integrations/supabase/client';

interface ApiOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

interface ApiRequestConfig {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

interface EdgeFunctionOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

/**
 * Class for handling API requests with advanced error handling, retries, and timeouts
 */
class ApiClient {
  private baseUrl: string;
  private defaultOptions: ApiOptions;
  
  constructor(baseUrl: string = '', options: ApiOptions = {}) {
    this.baseUrl = baseUrl;
    this.defaultOptions = {
      maxRetries: 3,
      retryDelay: 500,
      timeout: 30000,
      ...options
    };
  }
  
  /**
   * Make an API request with retries and error handling
   */
  async request<T>(
    endpoint: string, 
    config: ApiRequestConfig = {}
  ): Promise<T> {
    const { 
      method = 'GET', 
      body, 
      headers = {}, 
      timeout = this.defaultOptions.timeout,
      retries = this.defaultOptions.maxRetries
    } = config;
    
    const url = this.baseUrl ? `${this.baseUrl}${endpoint}` : endpoint;
    let currentRetry = 0;
    
    while (currentRetry <= retries) {
      try {
        // Set up AbortController for timeout
        const controller = new AbortController();
        const timeoutId = timeout 
          ? setTimeout(() => controller.abort(), timeout) 
          : null;
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
        
        // Clear timeout
        if (timeoutId) clearTimeout(timeoutId);
        
        // Check if request was successful
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
        
        // Parse response
        const data = await response.json();
        return data as T;
      } catch (error) {
        const isLastRetry = currentRetry === retries;
        const isAbortError = error instanceof DOMException && error.name === 'AbortError';
        const isNetworkError = error instanceof Error && 
          (error.message.includes('network') || error.message.includes('fetch'));
        
        // Only retry on network errors or timeouts, not on 4xx/5xx responses
        const shouldRetry = (isAbortError || isNetworkError) && !isLastRetry;
        
        if (shouldRetry) {
          currentRetry++;
          const delay = this.defaultOptions.retryDelay * Math.pow(2, currentRetry - 1);
          
          appDebugger.warn(`API request failed, retrying (${currentRetry}/${retries})`, {
            url,
            error,
            retryDelay: delay
          });
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // No more retries, throw the error
          throw handleError(error, {
            module: 'ApiClient',
            operation: 'request',
            data: { 
              url, 
              method, 
              retries: currentRetry 
            }
          }, ErrorSeverity.ERROR, isLastRetry);
        }
      }
    }
    
    // This should never be reached, but TypeScript requires a return
    throw new Error('Maximum retries exceeded');
  }
  
  /**
   * Wrapper for GET requests
   */
  async get<T>(endpoint: string, config: Omit<ApiRequestConfig, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }
  
  /**
   * Wrapper for POST requests
   */
  async post<T>(endpoint: string, data: any, config: Omit<ApiRequestConfig, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body: data });
  }
  
  /**
   * Wrapper for PUT requests
   */
  async put<T>(endpoint: string, data: any, config: Omit<ApiRequestConfig, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body: data });
  }
  
  /**
   * Wrapper for DELETE requests
   */
  async delete<T>(endpoint: string, config: Omit<ApiRequestConfig, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

/**
 * Enhanced Supabase Edge Function client with robust error handling
 */
class EdgeFunctionClient {
  private options: EdgeFunctionOptions;
  
  constructor(options: EdgeFunctionOptions = {}) {
    this.options = {
      maxRetries: 2,
      retryDelay: 1000,
      timeout: 45000, // Edge functions often need more time
      ...options
    };
  }
  
  /**
   * Invoke an edge function with retries and error handling
   */
  async invoke<T>(
    functionName: string, 
    body: any = {}, 
    customOptions: Partial<EdgeFunctionOptions> = {}
  ): Promise<T> {
    const options = {
      ...this.options,
      ...customOptions
    };
    
    let currentRetry = 0;
    
    while (currentRetry <= options.maxRetries) {
      try {
        // Begin logging the request
        const requestId = `edge-${functionName}-${Date.now()}`;
        appDebugger.info(`Invoking edge function: ${functionName}`, {
          requestId,
          body: { ...body, apiKey: body.apiKey ? '[REDACTED]' : undefined }
        });
        
        // Track timing
        const startTime = performance.now();
        
        // Call the edge function
        const { data, error } = await supabase.functions.invoke(functionName, {
          body
        });
        
        const duration = Math.round(performance.now() - startTime);
        
        if (error) {
          throw new Error(`Edge function error: ${error.message}`);
        }
        
        // Log successful completion
        appDebugger.info(`Edge function completed: ${functionName}`, {
          requestId,
          duration,
          success: true
        });
        
        return data as T;
      } catch (error) {
        const isLastRetry = currentRetry === options.maxRetries;
        
        // Check if this is a timeout or transient error that should be retried
        const message = error instanceof Error ? error.message : String(error);
        const isTimeoutError = message.includes('timeout') || message.includes('time') || message.includes('aborted');
        const isNetworkError = message.includes('network') || message.includes('connection');
        const isFunctionError = message.includes('Edge function error');
        
        // Don't retry application errors, only infrastructure errors
        const shouldRetry = (isTimeoutError || isNetworkError) && !isLastRetry;
        
        if (shouldRetry) {
          currentRetry++;
          const delay = options.retryDelay * Math.pow(1.5, currentRetry - 1);
          
          appDebugger.warn(`Edge function failed, retrying (${currentRetry}/${options.maxRetries})`, {
            function: functionName,
            error,
            retryDelay: delay
          });
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // Determine severity based on error type
          const severity = isFunctionError ? ErrorSeverity.ERROR : ErrorSeverity.CRITICAL;
          
          throw handleError(error, {
            module: 'EdgeFunction',
            operation: functionName,
            data: { retries: currentRetry }
          }, severity, isLastRetry);
        }
      }
    }
    
    // This should never be reached
    throw new Error('Maximum retries exceeded');
  }
}

// Export singleton instances
export const apiClient = new ApiClient();
export const edgeFunctionClient = new EdgeFunctionClient();
