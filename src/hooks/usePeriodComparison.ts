import { useState, useCallback } from 'react'
import type { Review } from '@/types/reviews'
import type { EnhancedAnalysis } from '@/types/dataAnalysis'
import { generateEnhancedAnalysis } from '@/utils/reviewDataUtils'
import { compareDataPeriods } from '@/services/comparisonService'
import { fetchLegacyReviewsWithDateFilter, fetchAllLegacyReviewsWithDateFilter } from '@/services/legacyReviewService'
import { supabase } from '@/integrations/supabase/client'

export interface ComparisonResult {
  ratingChange: number;
  reviewCountChange: number;
  reviewCountChangePercent: number;
  sentimentChange: number;
  improvingThemes: string[];
  decliningThemes: string[];
  newThemes: string[];
  removedThemes: string[];
  staffPerformanceChanges: Record<string, number>;
}

interface PeriodData {
  reviews: Review[];
  analysis: EnhancedAnalysis | null;
}

interface UsePeriodComparisonReturn {
  isLoading: boolean;
  loadingProgress: number;
  loadingMessage: string;
  currentData: PeriodData | null;
  previousData: PeriodData | null;
  comparisonResult: ComparisonResult | null;
  comparePeriods: (
    businessName: string,
    currentPeriod: { from?: Date; to?: Date },
    previousPeriod: { from?: Date; to?: Date }
  ) => Promise<void>;
  reset: () => void;
}

/**
 * Hook for period comparison functionality
 * Handles direct data fetching to avoid state synchronization issues
 */
export function usePeriodComparison(): UsePeriodComparisonReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [currentData, setCurrentData] = useState<PeriodData | null>(null)
  const [previousData, setPreviousData] = useState<PeriodData | null>(null)
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null)

  /**
   * Fetch reviews for a specific period and business
   * Directly queries the database to avoid state sync issues
   */
  const fetchPeriodData = async (
    businessName: string,
    from?: Date,
    to?: Date,
  ): Promise<PeriodData> => {
    // Check if using legacy tables
    const { error: reviewsError } = await supabase
      .from('reviews')
      .select('id')
      .limit(1)

    let reviews: Review[] = []

    if (reviewsError) {
      // Using legacy tables
      if (businessName === 'all' || businessName === 'All Businesses') {
        reviews = await fetchAllLegacyReviewsWithDateFilter(from, to)
      } else {
        reviews = await fetchLegacyReviewsWithDateFilter(businessName, from, to)
      }
    } else {
      // Using normalized tables
      let query = supabase
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

      // Apply date filtering
      if (from) {
        query = query.gte('publishedatdate', from.toISOString())
      }
      if (to) {
        query = query.lte('publishedatdate', to.toISOString())
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching reviews:', error)
        throw error
      }

      // Process and filter by business
      reviews = (data || []).map(review => {
        const business = review.businesses as any
        return {
          ...review,
          title: business?.name || 'Unknown Business',
          publishedAtDate: review.publishedAtDate || review.publishedatdate,
          businessName: business?.name,
        }
      })

      // Filter by business if not "all"
      if (businessName !== 'all' && businessName !== 'All Businesses') {
        reviews = reviews.filter(review =>
          review.title === businessName ||
          review.businesses?.name === businessName,
        )
      }
    }

    // Generate analysis
    const analysis = reviews.length > 0
      ? generateEnhancedAnalysis(reviews, businessName)
      : null

    return { reviews, analysis }
  }

  /**
   * Compare two periods for a specific business
   */
  const comparePeriods = useCallback(async (
    businessName: string,
    currentPeriod: { from?: Date; to?: Date },
    previousPeriod: { from?: Date; to?: Date },
  ) => {
    setIsLoading(true)
    setLoadingProgress(0)
    setLoadingMessage('Initializing comparison...')

    try {
      // Validate periods
      if (!currentPeriod.to || !previousPeriod.to) {
        setLoadingMessage('Please select complete date ranges for both periods.')
        setTimeout(() => {
          setIsLoading(false)
          setLoadingProgress(0)
          setLoadingMessage('')
        }, 2000)
        return
      }

      // Step 1: Load current period data (33%)
      setLoadingMessage('Loading current period data...')
      setLoadingProgress(10)

      const currentPeriodData = await fetchPeriodData(
        businessName,
        currentPeriod.from,
        currentPeriod.to,
      )

      setCurrentData(currentPeriodData)
      setLoadingProgress(33)

      console.log(`📊 Current period: ${currentPeriodData.reviews.length} reviews`)

      // Step 2: Load previous period data (66%)
      setLoadingMessage('Loading previous period data...')

      const previousPeriodData = await fetchPeriodData(
        businessName,
        previousPeriod.from,
        previousPeriod.to,
      )

      setPreviousData(previousPeriodData)
      setLoadingProgress(66)

      console.log(`📊 Previous period: ${previousPeriodData.reviews.length} reviews`)

      // Step 3: Generate comparison (100%)
      setLoadingMessage('Generating comparison report...')

      if (currentPeriodData.analysis && previousPeriodData.analysis) {
        const result = compareDataPeriods(
          currentPeriodData.analysis,
          previousPeriodData.analysis,
          currentPeriodData.reviews,
          previousPeriodData.reviews,
        )
        setComparisonResult(result)
      }

      setLoadingProgress(100)
      setLoadingMessage('Comparison complete!')

      // Small delay to show completion
      setTimeout(() => {
        setIsLoading(false)
        setLoadingProgress(0)
        setLoadingMessage('')
      }, 500)

    } catch (error) {
      console.error('Error during comparison:', error)
      setLoadingMessage('Error during comparison. Please try again.')
      setTimeout(() => {
        setIsLoading(false)
        setLoadingProgress(0)
        setLoadingMessage('')
      }, 2000)
    }
  }, [])

  /**
   * Reset all comparison data
   */
  const reset = useCallback(() => {
    setCurrentData(null)
    setPreviousData(null)
    setComparisonResult(null)
    setLoadingProgress(0)
    setLoadingMessage('')
  }, [])

  return {
    isLoading,
    loadingProgress,
    loadingMessage,
    currentData,
    previousData,
    comparisonResult,
    comparePeriods,
    reset,
  }
}
