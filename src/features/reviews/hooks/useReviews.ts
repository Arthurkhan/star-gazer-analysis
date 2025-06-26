import { useState, useEffect, useCallback } from 'react'
import type { Review, Business } from '@/types/reviews'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/utils/logger'

interface UseReviewsConfig {
  pageSize?: number;
  maxPages?: number;
  enablePerformanceMonitoring?: boolean;
}

interface UseReviewsReturn {
  reviews: Review[];
  businesses: Business[];
  loading: boolean;
  error: boolean;
  lastFetched: number;
  refreshData: () => Promise<void>;
  totalCount: number;
}

/**
 * Hook for fetching and managing review data
 * Focused responsibility: Data fetching only
 */
export function useReviews(config: UseReviewsConfig = {}): UseReviewsReturn {
  const { toast } = useToast()
  const {
    pageSize = 1000,
    maxPages = 50,
    enablePerformanceMonitoring = process.env.NODE_ENV === 'development',
  } = config

  // Core state
  const [reviews, setReviews] = useState<Review[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [lastFetched, setLastFetched] = useState<number>(0)
  const [totalCount, setTotalCount] = useState(0)

  /**
   * Fetch all reviews using pagination
   */
  const fetchAllReviewsWithPagination = async (): Promise<Review[]> => {
    logger.info('reviews', 'Starting to fetch ALL reviews using pagination...')

    const allReviews: Review[] = []
    let currentPage = 0
    let hasMore = true

    // Get total count for progress tracking
    const { count, error: countError } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      logger.error('reviews', 'Error getting review count:', countError)
    } else {
      setTotalCount(count || 0)
      logger.info('reviews', `Total reviews in database: ${count}`)
    }

    while (hasMore && currentPage < maxPages) {
      const startRow = currentPage * pageSize
      const endRow = startRow + pageSize - 1

      logger.info('reviews', `Fetching page ${currentPage + 1} (rows ${startRow + 1}-${endRow + 1})...`)

      const { data: pageData, error } = await supabase
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
        .range(startRow, endRow)

      if (error) {
        logger.error('reviews', `Error fetching page ${currentPage + 1}:`, error)
        throw error
      }

      if (!pageData || pageData.length === 0) {
        logger.info('reviews', `No more data on page ${currentPage + 1}, stopping...`)
        hasMore = false
        break
      }

      logger.info('reviews', `Page ${currentPage + 1}: Got ${pageData.length} reviews`)

      // Process and normalize review data
      const processedPageData = pageData.map(review => {
        const business = review.businesses as any
        return {
          ...review,
          title: business?.name || 'Unknown Business',
          publishedAtDate: review.publishedAtDate || review.publishedatdate,
          businessName: business?.name,
        }
      })

      allReviews.push(...processedPageData)

      // Check if we've reached the end
      if (pageData.length < pageSize) {
        logger.info('reviews', `Got ${pageData.length} < ${pageSize} reviews, reached end of data`)
        hasMore = false
      } else {
        currentPage++
      }
    }

    if (currentPage >= maxPages) {
      logger.warn('reviews', `Safety limit reached (${maxPages} pages), stopping fetch`)
    }

    logger.info('reviews', `Finished fetching! Total reviews collected: ${allReviews.length}`)
    return allReviews
  }

  /**
   * Load all data (businesses and reviews)
   */
  const loadAllData = useCallback(async () => {
    setLoading(true)
    setError(false)

    try {
      logger.info('reviews', 'Loading all review data...')

      // Load businesses first
      const { data: businessesData, error: businessesError } = await supabase
        .from('businesses')
        .select('*')
        .order('name')

      if (businessesError) {
        logger.error('reviews', 'Error fetching businesses:', businessesError)
        setError(true)
        toast({
          title: 'Database Error',
          description: 'Failed to load businesses. Please check your connection.',
          variant: 'destructive',
        })
        return
      }

      if (!businessesData || businessesData.length === 0) {
        logger.error('reviews', 'No businesses found')
        setError(true)
        toast({
          title: 'No Data Found',
          description: 'No businesses found in the database.',
          variant: 'destructive',
        })
        return
      }

      setBusinesses(businessesData)
      logger.info('reviews', `Loaded ${businessesData.length} businesses`)

      // Load all reviews using pagination
      const allReviewsData = await fetchAllReviewsWithPagination()

      setReviews(allReviewsData)
      setLastFetched(Date.now())

      toast({
        title: 'Data loaded successfully',
        description: `Loaded ${allReviewsData.length} reviews from ${businessesData.length} businesses`,
      })

    } catch (error) {
      logger.error('reviews', 'Error loading data:', error)
      setError(true)
      toast({
        title: 'Loading Error',
        description: 'An unexpected error occurred while loading data.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast, pageSize, maxPages])

  /**
   * Refresh all data
   */
  const refreshData = useCallback(async () => {
    logger.info('reviews', 'Refreshing all data...')
    await loadAllData()
  }, [loadAllData])

  // Initial data load on mount
  useEffect(() => {
    loadAllData()
  }, []) // Intentionally no dependencies to prevent re-runs

  return {
    reviews,
    businesses,
    loading,
    error,
    lastFetched,
    refreshData,
    totalCount,
  }
}
