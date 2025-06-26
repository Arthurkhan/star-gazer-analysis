import { supabase } from '@/integrations/supabase/client'
import type { Review, Business } from '@/types/reviews'
import type { Recommendations } from '@/types/recommendations'
import { ConsolidatedLogger } from '@/utils/logger'

const logger = new ConsolidatedLogger('ReviewDataService')

/**
 * Simplified Review Data Service
 * Removes dual schema support and complex pagination
 * Uses only normalized schema with direct data fetching
 */

interface BusinessData {
  id: string;
  name: string;
  business_type: string;
}

interface ReviewWithBusiness extends Review {
  businesses?: BusinessData | null;
}

/**
 * Fetch all businesses from the normalized schema
 */
export const fetchBusinesses = async (): Promise<Business[]> => {
  try {
    logger.info('Fetching businesses from normalized schema...')

    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .order('name')

    if (error) {
      logger.error('Error fetching businesses:', error)
      throw new Error(`Failed to fetch businesses: ${error.message}`)
    }

    if (!data || data.length === 0) {
      logger.warn('No businesses found in database')
      return []
    }

    logger.info(`Fetched ${data.length} businesses successfully`)
    return data
  } catch (error) {
    logger.error('Failed to fetch businesses:', error)
    throw error
  }
}

/**
 * Fetch all reviews with business information from normalized schema
 */
export const fetchAllReviews = async (): Promise<Review[]> => {
  try {
    logger.info('Fetching all reviews from normalized schema...')

    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        businesses:business_id (
          id,
          name,
          business_type
        )
      `)
      .order('publishedatdate', { ascending: false })

    if (error) {
      logger.error('Error fetching reviews:', error)
      throw new Error(`Failed to fetch reviews: ${error.message}`)
    }

    if (!data) {
      logger.info('No reviews found')
      return []
    }

    // Process reviews for backward compatibility
    const processedReviews = data.map((review: ReviewWithBusiness) => {
      const business = review.businesses as BusinessData | null
      return {
        ...review,
        title: business?.name || 'Unknown Business',
        publishedAtDate: review.publishedAtDate || review.publishedatdate,
        businessName: business?.name,
      }
    })

    logger.info(`Fetched ${processedReviews.length} reviews successfully`)
    return processedReviews
  } catch (error) {
    logger.error('Failed to fetch reviews:', error)
    throw error
  }
}

/**
 * Fetch reviews for a specific business
 */
export const fetchReviewsForBusiness = async (businessName: string): Promise<Review[]> => {
  try {
    logger.info(`Fetching reviews for business: ${businessName}`)

    // First get the business ID
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('name', businessName)
      .single()

    if (businessError || !businessData) {
      logger.error(`Business not found: ${businessName}`)
      return []
    }

    // Then get reviews for that business
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        businesses:business_id (
          id,
          name,
          business_type
        )
      `)
      .eq('business_id', businessData.id)
      .order('publishedatdate', { ascending: false })

    if (error) {
      logger.error('Error fetching business reviews:', error)
      throw new Error(`Failed to fetch reviews for ${businessName}: ${error.message}`)
    }

    if (!data) {
      return []
    }

    // Process reviews for backward compatibility
    const processedReviews = data.map((review: ReviewWithBusiness) => {
      const business = review.businesses as BusinessData | null
      return {
        ...review,
        title: business?.name || businessName,
        publishedAtDate: review.publishedAtDate || review.publishedatdate,
        businessName: business?.name || businessName,
      }
    })

    logger.info(`Fetched ${processedReviews.length} reviews for ${businessName}`)
    return processedReviews
  } catch (error) {
    logger.error(`Failed to fetch reviews for business ${businessName}:`, error)
    throw error
  }
}

/**
 * Get the latest recommendation for a business
 */
export const getLatestRecommendation = async (businessId: string): Promise<Recommendations | null> => {
  try {
    logger.info(`Fetching latest recommendation for business ${businessId}`)

    const { data, error } = await supabase
      .from('saved_recommendations')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      logger.error('Error fetching recommendation:', error)
      return null
    }

    if (!data || data.length === 0) {
      logger.info(`No recommendations found for business ${businessId}`)
      return null
    }

    logger.info(`Found recommendation for business ${businessId}`)
    return data[0] as Recommendations
  } catch (error) {
    logger.error('Failed to fetch latest recommendation:', error)
    return null
  }
}

/**
 * Save a recommendation for a business
 */
export const saveRecommendation = async (businessId: string, recommendations: Recommendations): Promise<boolean> => {
  try {
    logger.info(`Saving recommendation for business ${businessId}`)

    // Add timestamp to recommendations
    const recommendationWithTimestamp = {
      ...recommendations,
      lastUpdated: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('saved_recommendations')
      .insert({
        business_id: businessId,
        recommendations: recommendationWithTimestamp,
        created_at: new Date().toISOString(),
      })

    if (error) {
      logger.error('Error saving recommendation:', error)
      return false
    }

    logger.info(`Recommendation saved successfully for business ${businessId}`)
    return true
  } catch (error) {
    logger.error('Failed to save recommendation:', error)
    return false
  }
}

/**
 * Check if the database has the required tables
 */
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    // Check if required tables exist by trying to query them
    const [businessesResult, reviewsResult] = await Promise.all([
      supabase.from('businesses').select('id').limit(1),
      supabase.from('reviews').select('id').limit(1),
    ])

    return !businessesResult.error && !reviewsResult.error
  } catch (error) {
    logger.error('Database health check failed:', error)
    return false
  }
}

// Legacy compatibility exports (now simplified)
export const fetchAvailableTables = async (): Promise<string[]> => {
  // Return empty array since we no longer use legacy tables
  return []
}

export const fetchPaginatedReviews = async (
  _page: number = 0,
  _pageSize: number = 1000,
  businessName?: string,
  startDate?: Date,
  endDate?: Date,
): Promise<{ data: Review[]; total: number; hasMore: boolean }> => {
  // For compatibility, just return all reviews
  try {
    const allReviews = businessName && businessName !== 'all' && businessName !== 'All Businesses'
      ? await fetchReviewsForBusiness(businessName)
      : await fetchAllReviews()

    // Apply date filtering if provided
    let filteredReviews = allReviews
    if (startDate || endDate) {
      filteredReviews = allReviews.filter(review => {
        const reviewDate = new Date(review.publishedAtDate || review.publishedatdate)
        if (startDate && reviewDate < startDate) return false
        if (endDate && reviewDate > endDate) return false
        return true
      })
    }

    return {
      data: filteredReviews,
      total: filteredReviews.length,
      hasMore: false, // No pagination needed for small datasets
    }
  } catch (error) {
    logger.error('Failed to fetch paginated reviews:', error)
    return { data: [], total: 0, hasMore: false }
  }
}

// Remove complex caching since it's not needed for small datasets
export const clearAllCaches = (): void => {
  logger.info('Cache clearing is no longer needed with simplified architecture')
}
