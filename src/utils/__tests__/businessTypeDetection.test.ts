import { describe, it, expect, vi } from 'vitest'
import { detectBusinessType, getBusinessConfig, isValidBusinessName } from '../businessTypeDetection'

describe('businessTypeDetection', () => {
  describe('detectBusinessType', () => {
    it('should detect CAFE business type', () => {
      expect(detectBusinessType('The Little Prince Cafe')).toBe('CAFE')
      expect(detectBusinessType('Coffee House')).toBe('CAFE')
      expect(detectBusinessType('Local Cafe')).toBe('CAFE')
    })

    it('should detect BAR business type', () => {
      expect(detectBusinessType('Vol de Nuit The Hidden Bar')).toBe('BAR')
      expect(detectBusinessType('Sports Bar')).toBe('BAR')
      expect(detectBusinessType('Local Pub')).toBe('BAR')
    })

    it('should detect GALLERY business type', () => {
      expect(detectBusinessType("L'Envol Art Space")).toBe('GALLERY')
      expect(detectBusinessType('Art Gallery')).toBe('GALLERY')
      expect(detectBusinessType('Museum')).toBe('GALLERY')
    })

    it('should default to CAFE for unknown business types', () => {
      expect(detectBusinessType('Unknown Business')).toBe('CAFE')
      expect(detectBusinessType('')).toBe('CAFE')
      expect(detectBusinessType('Random Name')).toBe('CAFE')
    })

    it('should be case insensitive', () => {
      expect(detectBusinessType('THE LITTLE PRINCE CAFE')).toBe('CAFE')
      expect(detectBusinessType('vol de nuit the hidden bar')).toBe('BAR')
      expect(detectBusinessType("l'envol art space")).toBe('GALLERY')
    })
  })

  describe('getBusinessConfig', () => {
    it('should return correct config for CAFE', () => {
      const config = getBusinessConfig('CAFE')
      expect(config.type).toBe('CAFE')
      expect(config.name).toBe('The Little Prince Cafe')
      expect(config.tableName).toBe('The Little Prince Cafe')
      expect(config.industry).toBe('Food & Beverage')
      expect(config.keywords).toContain('cafe')
      expect(config.keywords).toContain('coffee')
    })

    it('should return correct config for BAR', () => {
      const config = getBusinessConfig('BAR')
      expect(config.type).toBe('BAR')
      expect(config.name).toBe('Vol de Nuit, The Hidden Bar')
      expect(config.tableName).toBe('Vol de Nuit, The Hidden Bar')
      expect(config.industry).toBe('Food & Beverage')
      expect(config.keywords).toContain('bar')
      expect(config.keywords).toContain('cocktails')
    })

    it('should return correct config for GALLERY', () => {
      const config = getBusinessConfig('GALLERY')
      expect(config.type).toBe('GALLERY')
      expect(config.name).toBe("L'Envol Art Space")
      expect(config.tableName).toBe("L'Envol Art Space")
      expect(config.industry).toBe('Arts & Culture')
      expect(config.keywords).toContain('art')
      expect(config.keywords).toContain('gallery')
    })

    it('should throw error for invalid business type', () => {
      expect(() => getBusinessConfig('INVALID' as any)).toThrow()
    })
  })

  describe('isValidBusinessName', () => {
    it('should return true for valid business names', () => {
      expect(isValidBusinessName('The Little Prince Cafe')).toBe(true)
      expect(isValidBusinessName('Vol de Nuit, The Hidden Bar')).toBe(true)
      expect(isValidBusinessName("L'Envol Art Space")).toBe(true)
    })

    it('should return false for invalid business names', () => {
      expect(isValidBusinessName('')).toBe(false)
      expect(isValidBusinessName('Unknown Business')).toBe(false)
      expect(isValidBusinessName('Random Name')).toBe(false)
    })

    it('should be case insensitive', () => {
      expect(isValidBusinessName('THE LITTLE PRINCE CAFE')).toBe(true)
      expect(isValidBusinessName('vol de nuit, the hidden bar')).toBe(true)
      expect(isValidBusinessName("l'envol art space")).toBe(true)
    })

    it('should handle null and undefined', () => {
      expect(isValidBusinessName(null as any)).toBe(false)
      expect(isValidBusinessName(undefined as any)).toBe(false)
    })
  })
})
