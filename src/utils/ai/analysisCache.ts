// This file handles caching of analysis results
import type { Review } from '@/types/reviews'

// Cache for analysis results to avoid repeated API calls
const analysisCache = new Map<string, any>()

// Different TTLs for different cache types (in milliseconds)
const CACHE_TTL = {
  STANDARD: 1000 * 60 * 15, // 15 minutes
  COMPREHENSIVE: 1000 * 60 * 30, // 30 minutes
}

// Keep timestamp for when cache was last cleared
let lastCacheReset = Date.now()

// Helper to generate a cache key
export function generateCacheKey(reviews: Review[], provider: string): string {
  const cacheTimestamp = localStorage.getItem('analysis_cache_key') || Date.now().toString()
  return `${provider}_${reviews.length}_${reviews.slice(0, 3).map(r => r.publishedAtDate).join('_')}_${cacheTimestamp}`
}

// Check if analysis is in cache and not expired
export function getFromCache(cacheKey: string): any | null {
  if (analysisCache.has(cacheKey)) {
    const cachedItem = analysisCache.get(cacheKey)

    // Check if item is expired
    const isComprehensive = cacheKey.includes('comprehensive')
    const ttl = isComprehensive ? CACHE_TTL.COMPREHENSIVE : CACHE_TTL.STANDARD

    if (cachedItem.timestamp && (Date.now() - cachedItem.timestamp < ttl)) {
      console.log('Using cached analysis result')
      return cachedItem.data
    } else {
      // Expired item
      analysisCache.delete(cacheKey)
      return null
    }
  }
  return null
}

// Store analysis in cache
export function storeInCache(cacheKey: string, analysis: any): void {
  analysisCache.set(cacheKey, {
    timestamp: Date.now(),
    data: analysis,
  })
  // Update cache timestamp for next time
  localStorage.setItem('analysis_cache_key', Date.now().toString())
}

// Clear cache (useful when refreshing analysis)
export function clearCache(): void {
  analysisCache.clear()
  localStorage.removeItem('analysis_cache_key')
  lastCacheReset = Date.now()
  console.log('Analysis cache cleared')
}

// Get cache stats for debugging
export function getCacheStats(): { size: number, lastReset: Date } {
  return {
    size: analysisCache.size,
    lastReset: new Date(lastCacheReset),
  }
}
