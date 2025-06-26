import { supabase } from '@/integrations/supabase/client'
import type { Review, Business } from '@/types/reviews'
import { logger } from '@/utils/logger'

/**
 * Fetch all businesses from the database
 *
 * @returns Promise<Business[]> - Array of businesses
 * @throws Error if fetch operation fails
 */
export const fetchBusinesses = async (): Promise<Business[]> => {
  try {
    logger.info('reviews', 'Fetching businesses from database...')

    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .order('name')

    if (error) {
      logger.error('reviews', 'Error fetching businesses:', error)
      throw new Error(`Failed to fetch businesses: ${error.message}`)
    }

    if (!data || data.length === 0) {
      logger.warn('reviews', 'No businesses found in database')
      return []
    }

    logger.info('reviews', `Fetched ${data.length} businesses successfully`)
    return data
  } catch (error) {
    logger.error('reviews', 'Failed to fetch businesses:', error)
    throw error
  }
}

/**
 * Fetch all reviews with business information
 *
 * @returns Promise<Review[]> - Array of reviews with business data
 * @throws Error if fetch operation fails
 */
export const fetchAllReviews = async (): Promise<Review[]> => {
  try {
    logger.info('reviews', 'Fetching all reviews from database...')

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
      logger.error('reviews', 'Error fetching reviews:', error)
      throw new Error(`Failed to fetch reviews: ${error.message}`)
    }

    if (!data) {
      logger.info('reviews', 'No reviews found')
      return []
    }

    // Process reviews for backward compatibility
    const processedReviews = data.map(review => {
      const business = review.businesses as any
      return {
        ...review,
        title: business?.name || 'Unknown Business',
        publishedAtDate: review.publishedAtDate || review.publishedatdate,
        businessName: business?.name,
      }
    })

    logger.info('reviews', `Fetched ${processedReviews.length} reviews successfully`)
    return processedReviews
  } catch (error) {
    logger.error('reviews', 'Failed to fetch reviews:', error)
    throw error
  }
}

/**
 * Fetch reviews for a specific business
 *
 * @param businessName - Name of the business
 * @returns Promise<Review[]> - Array of reviews for the business
 * @throws Error if fetch operation fails
 */
export const fetchReviewsForBusiness = async (businessName: string): Promise<Review[]> => {
  try {
    logger.info('reviews', `Fetching reviews for business: ${businessName}`)

    // First get the business ID
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('name', businessName)
      .single()

    if (businessError || !businessData) {
      logger.error('reviews', `Business not found: ${businessName}`)
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
      logger.error('reviews', 'Error fetching business reviews:', error)
      throw new Error(`Failed to fetch reviews for ${businessName}: ${error.message}`)
    }

    if (!data) {
      return []
    }

    // Process reviews for backward compatibility
    const processedReviews = data.map(review => {
      const business = review.businesses as any
      return {
        ...review,
        title: business?.name || businessName,
        publishedAtDate: review.publishedAtDate || review.publishedatdate,
        businessName: business?.name || businessName,
      }
    })

    logger.info('reviews', `Fetched ${processedReviews.length} reviews for ${businessName}`)
    return processedReviews
  } catch (error) {
    logger.error('reviews', `Failed to fetch reviews for business ${businessName}:`, error)
    throw error
  }
}

/**
 * Fetch paginated reviews with optional filtering
 *
 * @param page - Page number (0-based)
 * @param pageSize - Number of reviews per page
 * @param businessName - Optional business name filter
 * @param startDate - Optional start date filter
 * @param endDate - Optional end date filter
 * @returns Promise with paginated results
 */
export const fetchPaginatedReviews = async (
  page: number = 0,
  pageSize: number = 1000,
  businessName?: string,
  startDate?: Date,
  endDate?: Date,
): Promise<{ data: Review[], total: number, hasMore: boolean }> => {
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
    logger.error('reviews', 'Failed to fetch paginated reviews:', error)
    return { data: [], total: 0, hasMore: false }
  }
}

/**
 * Check if the database has the required tables
 *
 * @returns Promise<boolean> - Database health status
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
    logger.error('reviews', 'Database health check failed:', error)
    return false
  }
}

/**
 * Legacy compatibility - fetch available tables
 * @deprecated - No longer needed with normalized schema
 */
export const fetchAvailableTables = async (): Promise<string[]> => {
  // Return empty array since we no longer use legacy tables
  return []
}

/**
 * Clear all caches
 * @deprecated - No longer needed with simplified architecture
 */
export const clearAllCaches = (): void => {
  logger.info('reviews', 'Cache clearing is no longer needed with simplified architecture')
}
