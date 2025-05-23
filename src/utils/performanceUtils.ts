/**
 * Simplified Performance Utils - Phase 1 Consolidation
 * 
 * Essential performance utilities without over-engineering
 * Consolidates functionality from performanceOptimizations.ts
 */

import React from 'react';

// Simple cache for expensive operations (>16ms)
const simpleCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Simple memoization for expensive operations only
 * Use only for calculations that take >16ms
 */
export function memoize<T>(
  fn: (...args: any[]) => T,
  keyFn: (...args: any[]) => string,
  ttl = CACHE_DURATION
) {
  return (...args: any[]): T => {
    const key = keyFn(...args);
    const cached = simpleCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    
    const result = fn(...args);
    simpleCache.set(key, { data: result, timestamp: Date.now() });
    
    return result;
  };
}

/**
 * Clear expired cache entries
 */
export function clearCache(): void {
  const now = Date.now();
  for (const [key, entry] of simpleCache.entries()) {
    if (now - entry.timestamp > CACHE_DURATION) {
      simpleCache.delete(key);
    }
  }
}

/**
 * Simple performance measurement
 */
export function measurePerformance<T>(label: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  
  if (duration > 16) { // Only log slow operations
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
  }
  
  return result;
}

/**
 * Debounce utility for frequent operations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle utility for limiting frequent calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Simple lazy component wrapper
 */
export function createLazyComponent<T>(
  importFn: () => Promise<{ default: T }>
) {
  return React.lazy(importFn);
}

/**
 * Basic memory cleanup
 */
export function optimizeMemory(): void {
  clearCache();
  
  // Log memory usage in development
  if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
    const memory = (performance as any).memory;
    if (memory) {
      console.log('Memory usage:', {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB'
      });
    }
  }
}

// Auto cleanup every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(clearCache, CACHE_DURATION);
  
  // Cleanup on page hide
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      optimizeMemory();
    }
  });
}

export default {
  memoize,
  clearCache,
  measurePerformance,
  debounce,
  throttle,
  createLazyComponent,
  optimizeMemory
};
