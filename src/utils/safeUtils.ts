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
 * Safely access nested properties using dot notation
 */
export function safeAccess<T = any>(obj: any, path: string, defaultValue?: T): T | undefined {
  if (!obj || !path) return defaultValue;
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result !== undefined ? result : defaultValue;
}

/**
 * Parse JSON safely
 */
export function safeParseJSON<T = any>(jsonString: string | null | undefined, defaultValue?: T): T | null {
  if (!jsonString || jsonString === '') {
    return defaultValue !== undefined ? defaultValue : null;
  }
  
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    logError(error as Error, 'safeParseJSON');
    return defaultValue !== undefined ? defaultValue : null;
  }
}

/**
 * Execute a function safely and return result with success status
 */
export async function safeExecute<T = any>(
  fn: Function,
  ...args: any[]
): Promise<{ success: boolean; data?: T; error?: Error }> {
  try {
    const result = await Promise.resolve(fn(...args));
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

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
 * Parse JSON safely (alias for backward compatibility)
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

  setItem(key: string, value: string): boolean {
    try {
      if (this.available) {
        localStorage.setItem(key, value);
      }
      this.memoryFallback.set(key, value);
      return true;
    } catch (error) {
      // Handle quota exceeded
      if ((error as Error).name === 'QuotaExceededError') {
        this.clearOldItems();
        try {
          localStorage.setItem(key, value);
          return true;
        } catch {
          // Fall back to memory only
        }
      }
      this.memoryFallback.set(key, value);
      logError(error as Error, `localStorage.setItem(${key})`);
      return false;
    }
  }

  removeItem(key: string): boolean {
    try {
      if (this.available) {
        localStorage.removeItem(key);
      }
      this.memoryFallback.delete(key);
      return true;
    } catch (error) {
      logError(error as Error, `localStorage.removeItem(${key})`);
      return false;
    }
  }

  getJSON<T>(key: string, defaultValue: T): T {
    const value = this.getItem(key);
    return value ? safeJsonParse(value, defaultValue) : defaultValue;
  }

  setJSON<T>(key: string, value: T): boolean {
    try {
      return this.setItem(key, JSON.stringify(value));
    } catch (error) {
      logError(error as Error, `localStorage.setJSON(${key})`);
      return false;
    }
  }

  clear(): boolean {
    try {
      if (this.available) {
        localStorage.clear();
      }
      this.memoryFallback.clear();
      return true;
    } catch (error) {
      logError(error as Error, 'localStorage.clear');
      return false;
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
  safeAccess,
  safeParseJSON,
  safeExecute,
  safeGet,
  safeArrayGet,
  safeCall,
  safeNumber,
  safeString,
  safeJsonParse,
  safeStorage
};
