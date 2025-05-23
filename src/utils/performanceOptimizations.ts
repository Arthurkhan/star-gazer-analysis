/**
 * Performance Optimization Utilities - Phase 5
 * 
 * This module provides performance optimization utilities including:
 * - Memoized expensive calculations
 * - Lazy loading helpers
 * - Performance monitoring
 * - Memory management utilities
 */

import React from 'react';
import { Review } from "@/types/reviews";
import { AnalysisSummaryData, AnalysisConfig } from "@/types/analysisSummary";

// Cache for expensive calculations
const calculationCache = new Map<string, any>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
}

/**
 * Generic memoization utility with cache expiration
 */
export function memoizeWithExpiry<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  keyFn: (...args: TArgs) => string,
  expiryMs: number = CACHE_EXPIRY
) {
  return (...args: TArgs): TReturn => {
    const key = keyFn(...args);
    const cached = calculationCache.get(key) as CacheEntry<TReturn> | undefined;
    
    // Check if cache is still valid
    if (cached && Date.now() - cached.timestamp < expiryMs) {
      return cached.data;
    }
    
    // Calculate new result
    const result = fn(...args);
    
    // Store in cache
    calculationCache.set(key, {
      data: result,
      timestamp: Date.now(),
      key
    });
    
    return result;
  };
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): void {
  const now = Date.now();
  const toDelete: string[] = [];
  
  calculationCache.forEach((entry: CacheEntry<any>, key: string) => {
    if (now - entry.timestamp > CACHE_EXPIRY) {
      toDelete.push(key);
    }
  });
  
  toDelete.forEach(key => calculationCache.delete(key));
}

/**
 * Generate cache key for review analysis
 */
export function generateAnalysisCacheKey(
  reviews: Review[], 
  config: AnalysisConfig
): string {
  const reviewHash = reviews.length > 0 
    ? `${reviews.length}-${reviews[0]?.id || ''}-${reviews[reviews.length - 1]?.id || ''}`
    : 'empty';
  
  const configHash = JSON.stringify({
    timePeriod: config.timePeriod,
    includeStaffAnalysis: config.includeStaffAnalysis,
    includeThematicAnalysis: config.includeThematicAnalysis,
    includeActionItems: config.includeActionItems,
    comparisonPeriod: config.comparisonPeriod
  });
  
  return `analysis-${reviewHash}-${btoa(configHash).slice(0, 8)}`;
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private static measurements = new Map<string, number[]>();
  
  static startMeasurement(label: string): () => number {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      
      if (!this.measurements.has(label)) {
        this.measurements.set(label, []);
      }
      
      const measurements = this.measurements.get(label)!;
      measurements.push(duration);
      
      // Keep only last 100 measurements
      if (measurements.length > 100) {
        measurements.shift();
      }
      
      return duration;
    };
  }
  
  static getAverageTime(label: string): number {
    const measurements = this.measurements.get(label);
    if (!measurements || measurements.length === 0) return 0;
    
    return measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
  }
  
  static getStats(label: string) {
    const measurements = this.measurements.get(label);
    if (!measurements || measurements.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0 };
    }
    
    const sorted = [...measurements].sort((a, b) => a - b);
    return {
      count: measurements.length,
      average: this.getAverageTime(label),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)]
    };
  }
  
  static clearStats(): void {
    this.measurements.clear();
  }
  
  static getAllStats() {
    const stats: Record<string, ReturnType<typeof PerformanceMonitor.getStats>> = {};
    this.measurements.forEach((_, label) => {
      stats[label] = this.getStats(label);
    });
    return stats;
  }
}

/**
 * Lazy loading utility for large components
 */
export function createLazyComponent<T>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  return React.lazy(async () => {
    const stopMeasurement = PerformanceMonitor.startMeasurement('lazy-load');
    
    try {
      const module = await importFn();
      stopMeasurement();
      return module;
    } catch (error) {
      stopMeasurement();
      throw error;
    }
  });
}

/**
 * Memory optimization - Clean up unused objects
 */
export function optimizeMemoryUsage(): void {
  // Clear expired cache
  clearExpiredCache();
  
  // Suggest garbage collection if available
  if ((window as any).gc) {
    (window as any).gc();
  }
  
  // Log memory usage in development
  if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
    const memory = (performance as any).memory;
    console.log('Memory usage:', {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
    });
  }
}

/**
 * Debounce utility for expensive operations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
}

/**
 * Throttle utility for frequent operations
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Batch processing utility for large datasets
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => R | Promise<R>,
  batchSize: number = 50,
  delay: number = 0
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
    
    // Optional delay between batches to prevent blocking
    if (delay > 0 && i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return results;
}

/**
 * Component performance wrapper
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return React.memo((props: P) => {
    const stopMeasurement = PerformanceMonitor.startMeasurement(`render-${componentName}`);
    
    React.useEffect(() => {
      stopMeasurement();
    });
    
    return React.createElement(Component, props);
  });
}

// Auto-cleanup: Clear expired cache every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(clearExpiredCache, CACHE_EXPIRY);
  
  // Memory optimization on page visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      optimizeMemoryUsage();
    }
  });
}

export default {
  memoizeWithExpiry,
  clearExpiredCache,
  generateAnalysisCacheKey,
  PerformanceMonitor,
  createLazyComponent,
  optimizeMemoryUsage,
  debounce,
  throttle,
  processBatch,
  withPerformanceMonitoring
};
