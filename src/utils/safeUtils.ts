/**
 * Consolidated Safe Utilities - Phase 1 Consolidation
 * 
 * Combines safeAccess.ts and safeStorage.ts into a single utility
 * Uses modern JavaScript features like optional chaining where possible
 */

import { logError } from './errorHandling';

// ========================
// SAFE OBJECT ACCESS
// ========================

/**
 * Safely get a nested property (use obj?.prop?.nested ?? defaultValue for simple cases)
 */
export function safeGet<T>(obj: any, path: string, defaultValue: T): T {
  if (!obj || !path) return defaultValue;
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    result = result?.[key];
    if (result === undefined || result === null) return defaultValue;
  }
  
  return result ?? defaultValue;
}

/**
 * Safely access array element (use arr?.[index] ?? defaultValue for simple cases)
 */
export function safeArrayGet<T>(arr: T[] | null | undefined, index: number, defaultValue: T): T {
  return arr?.[index] ?? defaultValue;
}

/**
 * Safely call a function
 */
export function safeCall<T>(fn: Function | null | undefined, args: any[] = [], defaultValue: T): T {
  if (typeof fn !== 'function') return defaultValue;
  
  try {
    return fn(...args);
  } catch (error) {
    logError(error as Error, 'safeCall');
    return defaultValue;
  }
}

/**
 * Convert to number safely
 */
export function safeNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Convert to string safely
 */
export function safeString(value: any, defaultValue: string = ''): string {
  return value?.toString?.() ?? defaultValue;
}

/**
 * Parse JSON safely
 */
export function safeJsonParse<T>(jsonString: string | null | undefined, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    logError(error as Error, 'safeJsonParse');
    return defaultValue;
  }
}

// ========================
// SAFE STORAGE
// ========================

class SafeStorage {
  private memoryFallback = new Map<string, string>();
  private available = this.checkAvailability();

  private checkAvailability(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  getItem(key: string): string | null {
    try {
      return this.available ? localStorage.getItem(key) : this.memoryFallback.get(key) ?? null;
    } catch (error) {
      logError(error as Error, `localStorage.getItem(${key})`);
      return this.memoryFallback.get(key) ?? null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      if (this.available) {
        localStorage.setItem(key, value);
      }
      this.memoryFallback.set(key, value);
    } catch (error) {
      // Handle quota exceeded
      if ((error as Error).name === 'QuotaExceededError') {
        this.clearOldItems();
        try {
          localStorage.setItem(key, value);
        } catch {
          // Fall back to memory only
        }
      }
      this.memoryFallback.set(key, value);
      logError(error as Error, `localStorage.setItem(${key})`);
    }
  }

  removeItem(key: string): void {
    try {
      if (this.available) {
        localStorage.removeItem(key);
      }
      this.memoryFallback.delete(key);
    } catch (error) {
      logError(error as Error, `localStorage.removeItem(${key})`);
    }
  }

  getJSON<T>(key: string, defaultValue: T): T {
    const value = this.getItem(key);
    return value ? safeJsonParse(value, defaultValue) : defaultValue;
  }

  setJSON<T>(key: string, value: T): void {
    try {
      this.setItem(key, JSON.stringify(value));
    } catch (error) {
      logError(error as Error, `localStorage.setJSON(${key})`);
    }
  }

  clear(): void {
    try {
      if (this.available) {
        localStorage.clear();
      }
      this.memoryFallback.clear();
    } catch (error) {
      logError(error as Error, 'localStorage.clear');
    }
  }

  private clearOldItems(): void {
    try {
      if (!this.available) return;
      
      // Remove cache items first
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(k => k.toLowerCase().includes('cache'));
      
      if (cacheKeys.length > 0) {
        cacheKeys.forEach(key => localStorage.removeItem(key));
      } else {
        // Remove oldest 20% of items
        const removeCount = Math.max(1, Math.floor(keys.length * 0.2));
        keys.slice(0, removeCount).forEach(key => localStorage.removeItem(key));
      }
    } catch (error) {
      logError(error as Error, 'clearOldItems');
    }
  }
}

// Export singleton instance
export const safeStorage = new SafeStorage();

// Export all utilities
export default {
  safeGet,
  safeArrayGet,
  safeCall,
  safeNumber,
  safeString,
  safeJsonParse,
  safeStorage
};
