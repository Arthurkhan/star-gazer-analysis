import type { Review } from '@/types/reviews'
import type { Recommendations } from '@/types/recommendations'
import type { ReviewAnalysis } from '@/types/aiService'

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  forceRefresh?: boolean;
}

export class CacheService {
  private static instance: CacheService
  private cache: Map<string, CacheEntry<any>> = new Map()
  private readonly DEFAULT_TTL = 3600 * 1000 // 1 hour
  private readonly MAX_CACHE_SIZE = 100 // Maximum number of entries

  private constructor() {
    // Load persistent cache from localStorage
    this.loadFromStorage()

    // Set up periodic cleanup
    setInterval(() => this.cleanup(), 60000) // Clean up every minute
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService()
    }
    return CacheService.instance
  }

  /**
   * Generate cache key for AI responses
   */
  generateAIResponseKey(
    businessId: string,
    reviewHash: string,
    provider: string,
    type: string,
  ): string {
    return `ai_${provider}_${type}_${businessId}_${reviewHash}`
  }

  /**
   * Generate cache key for review analysis
   */
  generateAnalysisKey(businessId: string, reviewHash: string): string {
    return `analysis_${businessId}_${reviewHash}`
  }

  /**
   * Generate hash for review data
   */
  generateReviewHash(reviews: Review[]): string {
    const sortedReviews = [...reviews].sort((a, b) =>
      a.publishedAtDate.localeCompare(b.publishedAtDate),
    )

    const hashData = sortedReviews.map(r =>
      `${r.reviewUrl}_${r.stars}_${r.publishedAtDate}`,
    ).join('|')

    return this.simpleHash(hashData)
  }

  /**
   * Get cached data
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    if (options.forceRefresh) {
      return null
    }

    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if cache has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      this.saveToStorage()
      return null
    }

    return entry.data as T
  }

  /**
   * Set cached data
   */
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || this.DEFAULT_TTL

    // Enforce cache size limit
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })

    this.saveToStorage()
  }

  /**
   * Clear specific cache entries
   */
  async clear(pattern?: string): Promise<void> {
    if (!pattern) {
      this.cache.clear()
    } else {
      const keysToDelete: string[] = []

      this.cache.forEach((_, key) => {
        if (key.includes(pattern)) {
          keysToDelete.push(key)
        }
      })

      keysToDelete.forEach(key => this.cache.delete(key))
    }

    this.saveToStorage()
  }

  /**
   * Cache AI recommendations
   */
  async cacheRecommendations(
    businessId: string,
    reviews: Review[],
    recommendations: Recommendations,
    provider: string,
  ): Promise<void> {
    const reviewHash = this.generateReviewHash(reviews)
    const key = this.generateAIResponseKey(businessId, reviewHash, provider, 'recommendations')

    await this.set(key, recommendations, { ttl: 3600 * 1000 * 24 }) // 24 hours
  }

  /**
   * Get cached recommendations
   */
  async getCachedRecommendations(
    businessId: string,
    reviews: Review[],
    provider: string,
    options: CacheOptions = {},
  ): Promise<Recommendations | null> {
    const reviewHash = this.generateReviewHash(reviews)
    const key = this.generateAIResponseKey(businessId, reviewHash, provider, 'recommendations')

    return this.get<Recommendations>(key, options)
  }

  /**
   * Cache review analysis
   */
  async cacheAnalysis(
    businessId: string,
    reviews: Review[],
    analysis: ReviewAnalysis,
  ): Promise<void> {
    const reviewHash = this.generateReviewHash(reviews)
    const key = this.generateAnalysisKey(businessId, reviewHash)

    await this.set(key, analysis, { ttl: 3600 * 1000 * 24 * 7 }) // 7 days
  }

  /**
   * Get cached analysis
   */
  async getCachedAnalysis(
    businessId: string,
    reviews: Review[],
    options: CacheOptions = {},
  ): Promise<ReviewAnalysis | null> {
    const reviewHash = this.generateReviewHash(reviews)
    const key = this.generateAnalysisKey(businessId, reviewHash)

    return this.get<ReviewAnalysis>(key, options)
  }

  /**
   * Check if new reviews have been added since last analysis
   */
  hasNewReviews(
    businessId: string,
    currentReviews: Review[],
    lastAnalyzedReviews: Review[],
  ): boolean {
    const currentHash = this.generateReviewHash(currentReviews)
    const lastHash = this.generateReviewHash(lastAnalyzedReviews)

    return currentHash !== lastHash
  }

  /**
   * Get incremental reviews (new reviews since last analysis)
   */
  getIncrementalReviews(
    currentReviews: Review[],
    lastAnalyzedReviews: Review[],
  ): Review[] {
    const lastAnalyzedUrls = new Set(lastAnalyzedReviews.map(r => r.reviewUrl))

    return currentReviews.filter(review =>
      !lastAnalyzedUrls.has(review.reviewUrl),
    )
  }

  // Private helper methods

  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => this.cache.delete(key))

    if (keysToDelete.length > 0) {
      this.saveToStorage()
    }
  }

  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTimestamp = Infinity

    this.cache.forEach((entry, key) => {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp
        oldestKey = key
      }
    })

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  private saveToStorage(): void {
    try {
      const cacheData: Record<string, CacheEntry<any>> = {}

      this.cache.forEach((entry, key) => {
        // Only save entries that won't expire soon
        if (Date.now() - entry.timestamp < entry.ttl - 60000) {
          cacheData[key] = entry
        }
      })

      localStorage.setItem('stargazer_cache', JSON.stringify(cacheData))
    } catch (error) {
      console.error('Failed to save cache to storage:', error)
      // If storage is full, clear old entries
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.clearOldStorageEntries()
      }
    }
  }

  private loadFromStorage(): void {
    try {
      const storedCache = localStorage.getItem('stargazer_cache')

      if (storedCache) {
        const cacheData = JSON.parse(storedCache) as Record<string, CacheEntry<any>>
        const now = Date.now()

        Object.entries(cacheData).forEach(([key, entry]) => {
          // Only load entries that haven't expired
          if (now - entry.timestamp < entry.ttl) {
            this.cache.set(key, entry)
          }
        })
      }
    } catch (error) {
      console.error('Failed to load cache from storage:', error)
    }
  }

  private clearOldStorageEntries(): void {
    // Clear cache entries older than 24 hours
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000)
    const keysToDelete: string[] = []

    this.cache.forEach((entry, key) => {
      if (entry.timestamp < cutoffTime) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => this.cache.delete(key))
    this.saveToStorage()
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }
}
