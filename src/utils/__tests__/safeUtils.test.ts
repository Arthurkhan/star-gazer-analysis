import { describe, it, expect, vi, beforeEach } from 'vitest'
import { safeAccess, safeParseJSON, safeStorage, safeExecute } from '../safeUtils'

describe('safeUtils', () => {
  describe('safeAccess', () => {
    const testObject = {
      user: {
        profile: {
          name: 'John',
          settings: {
            theme: 'dark'
          }
        },
        emails: ['john@test.com', 'john.doe@test.com']
      },
      count: 0,
      active: false
    }

    it('should safely access nested properties', () => {
      expect(safeAccess(testObject, 'user.profile.name')).toBe('John')
      expect(safeAccess(testObject, 'user.profile.settings.theme')).toBe('dark')
      expect(safeAccess(testObject, 'user.emails.0')).toBe('john@test.com')
    })

    it('should return undefined for non-existent properties', () => {
      expect(safeAccess(testObject, 'user.profile.age')).toBeUndefined()
      expect(safeAccess(testObject, 'user.invalid.path')).toBeUndefined()
      expect(safeAccess(testObject, 'nonexistent')).toBeUndefined()
    })

    it('should return default value when provided', () => {
      expect(safeAccess(testObject, 'user.profile.age', 25)).toBe(25)
      expect(safeAccess(testObject, 'user.invalid.path', 'default')).toBe('default')
    })

    it('should handle falsy values correctly', () => {
      expect(safeAccess(testObject, 'count')).toBe(0)
      expect(safeAccess(testObject, 'active')).toBe(false)
    })

    it('should handle null and undefined objects', () => {
      expect(safeAccess(null, 'any.path')).toBeUndefined()
      expect(safeAccess(undefined, 'any.path')).toBeUndefined()
      expect(safeAccess(null, 'any.path', 'default')).toBe('default')
    })

    it('should handle array access', () => {
      expect(safeAccess(testObject, 'user.emails.1')).toBe('john.doe@test.com')
      expect(safeAccess(testObject, 'user.emails.10')).toBeUndefined()
      expect(safeAccess(testObject, 'user.emails.10', 'no-email')).toBe('no-email')
    })
  })

  describe('safeParseJSON', () => {
    it('should parse valid JSON', () => {
      const validJson = '{"name": "John", "age": 30}'
      const result = safeParseJSON(validJson)
      expect(result).toEqual({ name: 'John', age: 30 })
    })

    it('should return null for invalid JSON', () => {
      const invalidJson = '{"name": "John", "age":}'
      expect(safeParseJSON(invalidJson)).toBeNull()
    })

    it('should return default value for invalid JSON when provided', () => {
      const invalidJson = '{"name": "John", "age":}'
      const defaultValue = { error: true }
      expect(safeParseJSON(invalidJson, defaultValue)).toEqual(defaultValue)
    })

    it('should handle empty and null strings', () => {
      expect(safeParseJSON('')).toBeNull()
      expect(safeParseJSON('null')).toBeNull()
      expect(safeParseJSON('undefined')).toBeNull()
    })

    it('should parse arrays correctly', () => {
      const arrayJson = '[1, 2, 3]'
      expect(safeParseJSON(arrayJson)).toEqual([1, 2, 3])
    })

    it('should parse primitive values', () => {
      expect(safeParseJSON('true')).toBe(true)
      expect(safeParseJSON('false')).toBe(false)
      expect(safeParseJSON('42')).toBe(42)
      expect(safeParseJSON('"hello"')).toBe('hello')
    })
  })

  describe('safeStorage', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear()
      vi.clearAllMocks()
    })

    describe('getItem', () => {
      it('should retrieve stored items', () => {
        localStorage.setItem('test-key', 'test-value')
        expect(safeStorage.getItem('test-key')).toBe('test-value')
      })

      it('should return null for non-existent items', () => {
        expect(safeStorage.getItem('non-existent')).toBeNull()
      })

      it('should handle localStorage errors gracefully', () => {
        // Mock localStorage to throw an error
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
          throw new Error('Storage error')
        })
        
        expect(safeStorage.getItem('test-key')).toBeNull()
      })
    })

    describe('setItem', () => {
      it('should store items successfully', () => {
        const result = safeStorage.setItem('test-key', 'test-value')
        expect(result).toBe(true)
        expect(localStorage.getItem('test-key')).toBe('test-value')
      })

      it('should handle localStorage errors gracefully', () => {
        // Mock localStorage to throw an error
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
          throw new Error('Storage error')
        })
        
        const result = safeStorage.setItem('test-key', 'test-value')
        expect(result).toBe(false)
      })
    })

    describe('removeItem', () => {
      it('should remove items successfully', () => {
        localStorage.setItem('test-key', 'test-value')
        const result = safeStorage.removeItem('test-key')
        expect(result).toBe(true)
        expect(localStorage.getItem('test-key')).toBeNull()
      })

      it('should handle localStorage errors gracefully', () => {
        // Mock localStorage to throw an error
        vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
          throw new Error('Storage error')
        })
        
        const result = safeStorage.removeItem('test-key')
        expect(result).toBe(false)
      })
    })

    describe('clear', () => {
      it('should clear all items successfully', () => {
        localStorage.setItem('key1', 'value1')
        localStorage.setItem('key2', 'value2')
        
        const result = safeStorage.clear()
        expect(result).toBe(true)
        expect(localStorage.length).toBe(0)
      })

      it('should handle localStorage errors gracefully', () => {
        // Mock localStorage to throw an error
        vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
          throw new Error('Storage error')
        })
        
        const result = safeStorage.clear()
        expect(result).toBe(false)
      })
    })
  })

  describe('safeExecute', () => {
    it('should execute function successfully and return result', async () => {
      const successFn = vi.fn().mockResolvedValue('success')
      const result = await safeExecute(successFn)
      
      expect(result.success).toBe(true)
      expect(result.data).toBe('success')
      expect(result.error).toBeUndefined()
    })

    it('should handle synchronous functions', async () => {
      const syncFn = vi.fn().mockReturnValue('sync-result')
      const result = await safeExecute(syncFn)
      
      expect(result.success).toBe(true)
      expect(result.data).toBe('sync-result')
      expect(result.error).toBeUndefined()
    })

    it('should catch and handle errors', async () => {
      const errorFn = vi.fn().mockRejectedValue(new Error('Test error'))
      const result = await safeExecute(errorFn)
      
      expect(result.success).toBe(false)
      expect(result.data).toBeUndefined()
      expect(result.error).toBeInstanceOf(Error)
      expect(result.error?.message).toBe('Test error')
    })

    it('should handle synchronous errors', async () => {
      const syncErrorFn = vi.fn().mockImplementation(() => {
        throw new Error('Sync error')
      })
      const result = await safeExecute(syncErrorFn)
      
      expect(result.success).toBe(false)
      expect(result.data).toBeUndefined()
      expect(result.error).toBeInstanceOf(Error)
      expect(result.error?.message).toBe('Sync error')
    })

    it('should pass arguments to the function', async () => {
      const fn = vi.fn().mockResolvedValue('result')
      await safeExecute(fn, 'arg1', 42, { key: 'value' })
      
      expect(fn).toHaveBeenCalledWith('arg1', 42, { key: 'value' })
    })
  })
})
