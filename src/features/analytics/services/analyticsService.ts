import type { Review } from '@/types/reviews'
import { logger } from '@/utils/logger'

/**
 * Calculate average rating from reviews
 *
 * @param reviews - Array of reviews
 * @returns number - Average rating
 */
export const calculateAverageRating = (reviews: Review[]): number => {
  if (reviews.length === 0) return 0

  const total = reviews.reduce((sum, review) => sum + (review.stars || 0), 0)
  return total / reviews.length
}

/**
 * Count reviews by rating
 *
 * @param reviews - Array of reviews
 * @returns Record<number, number> - Count of reviews per rating
 */
export const countReviewsByRating = (reviews: Review[]): Record<number, number> => {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

  reviews.forEach(review => {
    const rating = review.stars || 0
    if (rating >= 1 && rating <= 5) {
      counts[rating] = (counts[rating] || 0) + 1
    }
  })

  return counts
}

/**
 * Group reviews by month
 *
 * @param reviews - Array of reviews
 * @returns Array of monthly data points
 */
export const groupReviewsByMonth = (reviews: Review[]): Array<{ month: string; reviews: number; avgRating: number }> => {
  const monthlyData: Record<string, { count: number; totalRating: number }> = {}

  reviews.forEach(review => {
    const date = new Date(review.publishedAtDate || review.publishedatdate)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { count: 0, totalRating: 0 }
    }

    monthlyData[monthKey].count++
    monthlyData[monthKey].totalRating += review.stars || 0
  })

  return Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      reviews: data.count,
      avgRating: data.count > 0 ? data.totalRating / data.count : 0,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

/**
 * Calculate monthly comparison metrics
 *
 * @param reviews - Array of reviews
 * @returns Object with comparison metrics
 */
export const calculateMonthlyComparison = (reviews: Review[]): { vsLastMonth: number } => {
  const now = new Date()
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const currentMonthReviews = reviews.filter(review => {
    const date = new Date(review.publishedAtDate || review.publishedatdate)
    return date >= currentMonth
  }).length

  const lastMonthReviews = reviews.filter(review => {
    const date = new Date(review.publishedAtDate || review.publishedatdate)
    return date >= lastMonth && date < currentMonth
  }).length

  return {
    vsLastMonth: currentMonthReviews - lastMonthReviews,
  }
}

/**
 * Calculate sentiment distribution
 *
 * @param reviews - Array of reviews
 * @returns Record with sentiment counts
 */
export const calculateSentimentDistribution = (reviews: Review[]): Record<string, number> => {
  const sentiments: Record<string, number> = {
    positive: 0,
    neutral: 0,
    negative: 0,
  }

  reviews.forEach(review => {
    const sentiment = review.sentiment?.toLowerCase() || 'neutral'
    if (sentiment in sentiments) {
      sentiments[sentiment]++
    } else {
      sentiments.neutral++
    }
  })

  return sentiments
}

/**
 * Extract common themes from reviews
 *
 * @param reviews - Array of reviews
 * @param limit - Maximum number of themes to return
 * @returns Array of theme objects
 */
export const extractCommonThemes = (reviews: Review[], limit: number = 10): Array<{ theme: string; count: number }> => {
  const themeCount: Record<string, number> = {}

  reviews.forEach(review => {
    if (review.mainThemes) {
      const themes = review.mainThemes.split(',').map(theme => theme.trim())
      themes.forEach(theme => {
        if (theme) {
          themeCount[theme] = (themeCount[theme] || 0) + 1
        }
      })
    }
  })

  return Object.entries(themeCount)
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

/**
 * Calculate business performance metrics
 *
 * @param reviews - Array of reviews
 * @returns Object with performance metrics
 */
export const calculatePerformanceMetrics = (reviews: Review[]): {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  sentimentDistribution: Record<string, number>;
  monthlyTrend: Array<{ month: string; reviews: number; avgRating: number }>;
  topThemes: Array<{ theme: string; count: number }>;
} => {
  try {
    return {
      totalReviews: reviews.length,
      averageRating: calculateAverageRating(reviews),
      ratingDistribution: countReviewsByRating(reviews),
      sentimentDistribution: calculateSentimentDistribution(reviews),
      monthlyTrend: groupReviewsByMonth(reviews),
      topThemes: extractCommonThemes(reviews, 5),
    }
  } catch (error) {
    logger.error('analytics', 'Error calculating performance metrics:', error)
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
      monthlyTrend: [],
      topThemes: [],
    }
  }
}
