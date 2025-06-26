import { supabase } from '@/integrations/supabase/client'
import type { Review } from '@/types/reviews'
import { logger } from '@/utils/logger'

/**
 * Legacy Review Service for handling business-named tables
 * Provides proper date filtering at the database level
 */

/**
 * Fetch reviews from a legacy business-named table with date filtering
 */
export const fetchLegacyReviewsWithDateFilter = async (
  tableName: string,
  startDate?: Date,
  endDate?: Date,
): Promise<Review[]> => {
  try {
    logger.info(`🔍 Fetching reviews from legacy table: ${tableName}`)
    logger.info(`📅 Date range: ${startDate?.toISOString()} to ${endDate?.toISOString()}`)

    // First, let's check which column name is used
    const { data: sampleData, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)

    if (sampleError) {
      logger.error('❌ Error checking table structure:', sampleError)
      throw sampleError
    }

    // Determine the correct column name - use Object.prototype.hasOwnProperty.call instead
    const dateColumn = sampleData && sampleData.length > 0 && Object.prototype.hasOwnProperty.call(sampleData[0], 'publishedAtDate')
      ? 'publishedAtDate'
      : 'publishedatdate'

    logger.info(`📊 Using date column: ${dateColumn}`)

    // Fetch all reviews with pagination to overcome Supabase limits
    const allReviews: Review[] = []
    let page = 0
    const pageSize = 1000
    let hasMore = true

    while (hasMore) {
      // Build the query
      let query = supabase
        .from(tableName)
        .select('*')
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order(dateColumn, { ascending: false })

      // Apply date filtering at the database level
      if (startDate && endDate) {
        query = query
          .gte(dateColumn, startDate.toISOString())
          .lte(dateColumn, endDate.toISOString())
      } else if (startDate) {
        query = query.gte(dateColumn, startDate.toISOString())
      } else if (endDate) {
        query = query.lte(dateColumn, endDate.toISOString())
      }

      const { data, error } = await query

      if (error) {
        logger.error(`❌ Error fetching page ${page} from ${tableName}:`, error)
        throw error
      }

      if (!data || data.length === 0) {
        hasMore = false
        break
      }

      allReviews.push(...data)

      // If we got less than pageSize, we've reached the end
      if (data.length < pageSize) {
        hasMore = false
      } else {
        page++
      }
    }

    logger.info(`✅ Retrieved ${allReviews.length} reviews from ${tableName} with date filter`)

    // Log sample of dates to verify filtering
    if (allReviews.length > 0) {
      const firstDate = allReviews[0].publishedAtDate || allReviews[0].publishedatdate
      const lastDate = allReviews[allReviews.length - 1].publishedAtDate || allReviews[allReviews.length - 1].publishedatdate
      logger.info(`📅 Date range in results: ${lastDate} to ${firstDate}`)
    }

    // Process reviews to ensure consistent format
    const processedReviews = allReviews.map(review => ({
      ...review,
      title: tableName, // Use table name as title for legacy compatibility
      businessName: tableName,
      // Ensure we have the date field consistently named
      publishedAtDate: review.publishedAtDate || review.publishedatdate,
      publishedatdate: review.publishedatdate || review.publishedAtDate,
    }))

    return processedReviews
  } catch (error) {
    logger.error(`❌ Failed to fetch reviews from legacy table ${tableName}:`, error)
    throw error
  }
}

/**
 * Check if a table exists in the database
 */
export const checkTableExists = async (tableName: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('stars')
      .limit(1)

    return !error
  } catch (error) {
    return false
  }
}

/**
 * Get all available legacy business tables
 */
export const getLegacyBusinessTables = async (): Promise<string[]> => {
  const knownBusinesses = [
    'The Little Prince Cafe',
    'Vol de Nuit, The Hidden Bar',
    "L'Envol Art Space",
  ]

  const existingTables: string[] = []

  for (const business of knownBusinesses) {
    if (await checkTableExists(business)) {
      existingTables.push(business)
    }
  }

  return existingTables
}

/**
 * Fetch reviews from multiple legacy tables with date filtering
 */
export const fetchAllLegacyReviewsWithDateFilter = async (
  startDate?: Date,
  endDate?: Date,
): Promise<Review[]> => {
  try {
    const tables = await getLegacyBusinessTables()
    logger.info(`📊 Found ${tables.length} legacy business tables`)

    const allReviews: Review[] = []

    for (const table of tables) {
      const reviews = await fetchLegacyReviewsWithDateFilter(table, startDate, endDate)
      allReviews.push(...reviews)
    }

    // Sort all reviews by date descending
    allReviews.sort((a, b) => {
      const dateA = new Date(a.publishedAtDate || a.publishedatdate)
      const dateB = new Date(b.publishedAtDate || b.publishedatdate)
      return dateB.getTime() - dateA.getTime()
    })

    logger.info(`🎯 Total reviews fetched from all legacy tables: ${allReviews.length}`)
    return allReviews
  } catch (error) {
    logger.error('Failed to fetch reviews from legacy tables:', error)
    throw error
  }
}
