// src/utils/storage/safeStorage.ts
// Safe storage utilities to prevent localStorage and sessionStorage errors

import { handleError, logError, AppError, ErrorType } from '@/utils/errorHandling'

/**
 * Safely interact with localStorage with fallback mechanisms
 */
class SafeLocalStorage {
  private available: boolean = true
  private memoryFallback: Map<string, string> = new Map()

  constructor() {
    this.checkAvailability()
  }

  /**
   * Check if localStorage is available
   */
  private checkAvailability(): void {
    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, testKey)
      localStorage.removeItem(testKey)
      this.available = true
    } catch (e) {
      this.available = false
      logError(e as Error, 'SafeLocalStorage.checkAvailability')
    }
  }

  /**
   * Safely get an item from storage
   */
  getItem(key: string): string | null {
    try {
      if (this.available) {
        return localStorage.getItem(key)
      } else {
        return this.memoryFallback.get(key) || null
      }
    } catch (e) {
      logError(e as Error, `SafeLocalStorage.getItem(${key})`)
      return this.memoryFallback.get(key) || null
    }
  }

  /**
   * Safely set an item in storage
   */
  setItem(key: string, value: string): void {
    try {
      if (this.available) {
        localStorage.setItem(key, value)
      }
      // Always update memory fallback
      this.memoryFallback.set(key, value)
    } catch (e) {
      // Handle quota exceeded errors specially
      const error = e as Error
      if (error.name === 'QuotaExceededError' ||
          error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
          error.message.includes('quota')) {

        // Try to free up space by removing old items
        this.removeOldItems()

        // Try again
        try {
          localStorage.setItem(key, value)
        } catch (retryError) {
          // Fall back to memory storage only
          this.memoryFallback.set(key, value)
          logError(retryError as Error, `SafeLocalStorage.setItem.retry(${key})`)
        }
      } else {
        // Other errors - fall back to memory storage
        this.memoryFallback.set(key, value)
        logError(e as Error, `SafeLocalStorage.setItem(${key})`)
      }
    }
  }

  /**
   * Safely remove an item from storage
   */
  removeItem(key: string): void {
    try {
      if (this.available) {
        localStorage.removeItem(key)
      }
      this.memoryFallback.delete(key)
    } catch (e) {
      logError(e as Error, `SafeLocalStorage.removeItem(${key})`)
    }
  }

  /**
   * Safely get all keys from storage
   */
  getKeys(): string[] {
    try {
      if (this.available) {
        return Object.keys(localStorage)
      } else {
        return Array.from(this.memoryFallback.keys())
      }
    } catch (e) {
      logError(e as Error, 'SafeLocalStorage.getKeys')
      return Array.from(this.memoryFallback.keys())
    }
  }

  /**
   * Safely clear all items from storage
   */
  clear(): void {
    try {
      if (this.available) {
        localStorage.clear()
      }
      this.memoryFallback.clear()
    } catch (e) {
      logError(e as Error, 'SafeLocalStorage.clear')
    }
  }

  /**
   * Get an item as a parsed JSON value
   */
  getJSON<T>(key: string, defaultValue: T): T {
    const value = this.getItem(key)
    if (value === null) return defaultValue

    try {
      return JSON.parse(value) as T
    } catch (e) {
      logError(e as Error, `SafeLocalStorage.getJSON(${key})`)
      return defaultValue
    }
  }

  /**
   * Set an item as a stringified JSON value
   */
  setJSON<T>(key: string, value: T): void {
    try {
      const stringValue = JSON.stringify(value)
      this.setItem(key, stringValue)
    } catch (e) {
      logError(e as Error, `SafeLocalStorage.setJSON(${key})`)
    }
  }

  /**
   * Remove oldest items to free up space
   */
  private removeOldItems(): void {
    try {
      if (!this.available) return

      const keys = Object.keys(localStorage)

      // Try to remove items with 'cache' in their name first
      const cacheKeys = keys.filter(k => k.toLowerCase().includes('cache'))
      if (cacheKeys.length > 0) {
        cacheKeys.forEach(key => localStorage.removeItem(key))
        return
      }

      // Otherwise, remove oldest 20% of items
      if (keys.length > 0) {
        const removeCount = Math.max(1, Math.floor(keys.length * 0.2))
        keys.slice(0, removeCount).forEach(key => localStorage.removeItem(key))
      }
    } catch (e) {
      logError(e as Error, 'SafeLocalStorage.removeOldItems')
    }
  }
}

// Create singleton instances
export const safeLocalStorage = new SafeLocalStorage()

// SessionStorage implementation follows the same pattern
// Can be added if required
