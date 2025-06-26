import type {
  Review} from '@/types/reviews'
import {
  reviewFieldAccessor,
  hasOwnerResponse,
} from '@/types/reviews'
import type {
  BusinessHealthScore,
  PerformanceMetrics,
  RatingAnalysis,
  ResponseAnalytics,
  SentimentAnalysis,
  ThematicAnalysis,
  StaffInsights,
  OperationalInsights,
  ActionItems,
  AnalysisSummaryData,
  AnalysisConfig,
  TrendCalculation,
  PeriodData,
  TimePeriodConfig,
} from '@/types/analysisSummary'
import {
  calculateAverageRating,
  countReviewsByRating,
  analyzeReviewSentiment_sync,
  extractStaffMentions_sync,
  extractCommonTerms_sync,
  countReviewsByLanguage,
} from '@/utils/dataUtils'
import {
  memoizeWithExpiry,
  generateAnalysisCacheKey,
  PerformanceMonitor,
} from '@/utils/performanceOptimizations'

// Helper function to filter reviews by date range
export const filterReviewsByDateRange = (reviews: Review[], start: Date, end: Date): Review[] => {
  return reviews.filter(review => {
    const reviewDate = new Date(reviewFieldAccessor.getPublishedDate(review) || '')
    return reviewDate >= start && reviewDate <= end
  })
}

// Helper function to create time periods
export const createTimePeriods = (config: AnalysisConfig): TimePeriodConfig => {
  const now = new Date()
  let currentStart: Date
  let previousStart: Date
  let currentEnd = now
  let previousEnd: Date
  let label: string

  switch (config.timePeriod) {
    case 'last30days': {
      currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      previousStart = new Date(currentStart.getTime() - 30 * 24 * 60 * 60 * 1000)
      previousEnd = currentStart
      label = 'Last 30 Days'
      break
    }
    case 'last90days': {
      currentStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      previousStart = new Date(currentStart.getTime() - 90 * 24 * 60 * 60 * 1000)
      previousEnd = currentStart
      label = 'Last 90 Days'
      break
    }
    case 'last6months': {
      currentStart = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
      previousStart = new Date(currentStart.getFullYear(), currentStart.getMonth() - 6, currentStart.getDate())
      previousEnd = currentStart
      label = 'Last 6 Months'
      break
    }
    case 'last12months': {
      currentStart = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      previousStart = new Date(currentStart.getFullYear() - 1, currentStart.getMonth(), currentStart.getDate())
      previousEnd = currentStart
      label = 'Last 12 Months'
      break
    }
    case 'custom': {
      if (!config.customRange) throw new Error('Custom range required for custom time period')
      currentStart = config.customRange.start
      currentEnd = config.customRange.end
      const daysDiff = Math.floor((currentEnd.getTime() - currentStart.getTime()) / (24 * 60 * 60 * 1000))
      previousStart = new Date(currentStart.getTime() - daysDiff * 24 * 60 * 60 * 1000)
      previousEnd = currentStart
      label = 'Custom Period'
      break
    }
    default: { // "all"
      // Use the oldest review date as start
      currentStart = new Date('2020-01-01') // Default start date
      previousStart = currentStart
      previousEnd = currentStart
      label = 'All Time'
    }
  }

  return {
    current: {
      start: currentStart,
      end: currentEnd,
      label,
    },
    previous: {
      start: previousStart,
      end: previousEnd,
      label: `Previous ${label}`,
    },
    comparison: config.comparisonPeriod === 'yearOverYear' ? 'year' : 'month',
  }
}

// Calculate trend between two values
export const calculateTrend = (current: number, previous: number): TrendCalculation => {
  const change = current - previous
  const changePercentage = previous !== 0 ? (change / previous) * 100 : 0

  let direction: 'up' | 'down' | 'stable' = 'stable'
  let significance: 'significant' | 'minor' | 'negligible' = 'negligible'

  if (Math.abs(changePercentage) < 2) {
    direction = 'stable'
    significance = 'negligible'
  } else if (changePercentage > 0) {
    direction = 'up'
    significance = changePercentage > 10 ? 'significant' : 'minor'
  } else {
    direction = 'down'
    significance = Math.abs(changePercentage) > 10 ? 'significant' : 'minor'
  }

  return {
    current,
    previous,
    change,
    changePercentage,
    direction,
    significance,
  }
}

// Calculate business health score - MEMOIZED
export const calculateBusinessHealthScore = memoizeWithExpiry(
  (currentPeriod: PeriodData, previousPeriod?: PeriodData): BusinessHealthScore => {
    const stopMeasurement = PerformanceMonitor.startMeasurement('health-score-calculation')

    const ratingScore = (currentPeriod.metrics.averageRating / 5) * 100
    const {sentimentScore} = currentPeriod.metrics
    const responseScore = currentPeriod.metrics.responseRate

    // Volume trend (if we have previous period)
    let volumeTrend = 0
    let ratingTrend = 0
    if (previousPeriod) {
      const volumeChange = currentPeriod.metrics.totalReviews - previousPeriod.metrics.totalReviews
      volumeTrend = previousPeriod.metrics.totalReviews > 0
        ? (volumeChange / previousPeriod.metrics.totalReviews) * 100
        : 0

      const ratingChange = currentPeriod.metrics.averageRating - previousPeriod.metrics.averageRating
      ratingTrend = ratingChange * 20 // Scale to -100 to 100
    }

    const overall = (ratingScore * 0.4 + sentimentScore * 0.3 + responseScore * 0.2 + Math.max(0, volumeTrend) * 0.1)

    stopMeasurement()

    return {
      overall: Math.round(overall),
      ratingTrend: Math.round(ratingTrend),
      sentimentScore: Math.round(sentimentScore),
      responseRate: Math.round(responseScore),
      volumeTrend: Math.round(volumeTrend),
      breakdown: {
        rating: Math.round(ratingScore),
        sentiment: Math.round(sentimentScore),
        response: Math.round(responseScore),
        volume: Math.round(Math.max(0, volumeTrend)),
      },
    }
  },
  (currentPeriod: PeriodData, previousPeriod?: PeriodData) =>
    `health-${currentPeriod.reviews.length}-${currentPeriod.metrics.averageRating}-${previousPeriod?.reviews.length || 0}`,
  3 * 60 * 1000, // 3 minutes cache
)

// Calculate performance metrics - MEMOIZED
export const calculatePerformanceMetrics = memoizeWithExpiry(
  (reviews: Review[], timePeriod: TimePeriodConfig): PerformanceMetrics => {
    const stopMeasurement = PerformanceMonitor.startMeasurement('performance-metrics-calculation')

    const totalReviews = reviews.length

    // Calculate reviews per month
    const startDate = new Date(Math.min(...reviews.map(r => new Date(reviewFieldAccessor.getPublishedDate(r) || '').getTime())))
    const endDate = new Date(Math.max(...reviews.map(r => new Date(reviewFieldAccessor.getPublishedDate(r) || '').getTime())))
    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1
    const reviewsPerMonth = totalReviews / Math.max(1, monthsDiff)

    // Calculate growth rate (comparing current period to previous)
    const now = new Date()
    const currentPeriodReviews = filterReviewsByDateRange(reviews, timePeriod.current.start, timePeriod.current.end)
    const previousPeriodReviews = filterReviewsByDateRange(reviews, timePeriod.previous.start, timePeriod.previous.end)

    const growthRate = previousPeriodReviews.length > 0
      ? ((currentPeriodReviews.length - previousPeriodReviews.length) / previousPeriodReviews.length) * 100
      : 0

    // Find peak periods
    const monthlyData = new Map<string, number>()
    reviews.forEach(review => {
      const date = new Date(reviewFieldAccessor.getPublishedDate(review) || '')
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + 1)
    })

    const monthlyEntries = Array.from(monthlyData.entries()).sort((a, b) => b[1] - a[1])
    const peakMonth = monthlyEntries[0]?.[0] || ''
    const peakYear = peakMonth.split('-')[0] || ''

    // Recent activity
    const last3MonthsStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    const last6MonthsStart = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
    const last12MonthsStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

    const last3Months = filterReviewsByDateRange(reviews, last3MonthsStart, now).length
    const last6Months = filterReviewsByDateRange(reviews, last6MonthsStart, now).length
    const last12Months = filterReviewsByDateRange(reviews, last12MonthsStart, now).length

    // Determine seasonal pattern
    let seasonalPattern: 'stable' | 'seasonal' | 'declining' | 'growing' = 'stable'
    if (growthRate > 20) seasonalPattern = 'growing'
    else if (growthRate < -20) seasonalPattern = 'declining'
    else if (monthlyEntries.length > 3) {
      const variation = Math.max(...monthlyEntries.map(e => e[1])) - Math.min(...monthlyEntries.map(e => e[1]))
      if (variation > reviewsPerMonth * 2) seasonalPattern = 'seasonal'
    }

    stopMeasurement()

    return {
      totalReviews,
      reviewsPerMonth: Math.round(reviewsPerMonth * 100) / 100,
      growthRate: Math.round(growthRate * 100) / 100,
      peakMonth: peakMonth.split('-')[1] || '',
      peakYear,
      recentActivity: {
        last3Months,
        last6Months,
        last12Months,
      },
      trends: {
        isGrowing: growthRate > 5,
        seasonalPattern,
        bestPeriods: monthlyEntries.slice(0, 3).map(e => e[0]),
        worstPeriods: monthlyEntries.slice(-3).map(e => e[0]),
      },
    }
  },
  (reviews: Review[], timePeriod: TimePeriodConfig) =>
    `performance-${reviews.length}-${timePeriod.current.start.getTime()}-${timePeriod.current.end.getTime()}`,
  3 * 60 * 1000, // 3 minutes cache
)

// Calculate rating analysis - MEMOIZED
export const calculateRatingAnalysis = memoizeWithExpiry(
  (currentReviews: Review[], previousReviews?: Review[]): RatingAnalysis => {
    const stopMeasurement = PerformanceMonitor.startMeasurement('rating-analysis-calculation')

    const ratingCounts = countReviewsByRating(currentReviews)
    const total = currentReviews.length

    const distribution: Record<number, { count: number; percentage: number }> = {}
    for (let i = 1; i <= 5; i++) {
      const count = ratingCounts[i] || 0
      distribution[i] = {
        count,
        percentage: total > 0 ? Math.round((count / total) * 100 * 100) / 100 : 0,
      }
    }

    const current = calculateAverageRating(currentReviews)
    const previous = previousReviews ? calculateAverageRating(previousReviews) : current
    const change = current - previous

    let direction: 'up' | 'down' | 'stable' = 'stable'
    if (Math.abs(change) > 0.1) {
      direction = change > 0 ? 'up' : 'down'
    }

    // Calculate benchmarks
    const excellent = distribution[5].percentage + distribution[4].percentage
    const good = excellent + distribution[3].percentage
    const needsImprovement = distribution[1].percentage + distribution[2].percentage

    stopMeasurement()

    return {
      distribution,
      trends: {
        current,
        previous,
        change,
        direction,
      },
      benchmarks: {
        excellent,
        good,
        needsImprovement,
      },
    }
  },
  (currentReviews: Review[], previousReviews?: Review[]) =>
    `rating-${currentReviews.length}-${previousReviews?.length || 0}-${calculateAverageRating(currentReviews)}`,
  3 * 60 * 1000, // 3 minutes cache
)

// Calculate response analytics - MEMOIZED - FIXED TO USE PROPER FIELD ACCESSORS
export const calculateResponseAnalytics = memoizeWithExpiry(
  (reviews: Review[]): ResponseAnalytics => {
    const stopMeasurement = PerformanceMonitor.startMeasurement('response-analytics-calculation')

    const totalReviews = reviews.length
    const reviewsWithResponse = reviews.filter(hasOwnerResponse).length
    const responseRate = totalReviews > 0 ? (reviewsWithResponse / totalReviews) * 100 : 0

    const responsesByRating: Record<number, { total: number; responded: number; rate: number }> = {}

    for (let rating = 1; rating <= 5; rating++) {
      const ratingReviews = reviews.filter(r => r.stars === rating)
      const ratingResponses = ratingReviews.filter(hasOwnerResponse)

      responsesByRating[rating] = {
        total: ratingReviews.length,
        responded: ratingResponses.length,
        rate: ratingReviews.length > 0 ? (ratingResponses.length / ratingReviews.length) * 100 : 0,
      }
    }

    // Simple effectiveness calculation - assuming responses help
    const responseEffectiveness = {
      improvedSubsequentRatings: responseRate > 50, // Simple heuristic
      customerSatisfactionImpact: Math.min(responseRate / 10, 10), // Scale to 0-10
    }

    stopMeasurement()

    return {
      responseRate: Math.round(responseRate * 100) / 100,
      responsesByRating,
      responseEffectiveness,
    }
  },
  (reviews: Review[]) =>
    `response-${reviews.length}-${reviews.filter(hasOwnerResponse).length}`,
  3 * 60 * 1000, // 3 minutes cache
)

// Calculate sentiment analysis - MEMOIZED
export const calculateSentimentAnalysis = memoizeWithExpiry(
  (reviews: Review[]): SentimentAnalysis => {
    const stopMeasurement = PerformanceMonitor.startMeasurement('sentiment-analysis-calculation')

    const sentimentData = analyzeReviewSentiment_sync(reviews)
    const total = reviews.length

    const distribution = {
      positive: {
        count: sentimentData.find(s => s.name === 'Positive')?.value || 0,
        percentage: 0,
      },
      neutral: {
        count: sentimentData.find(s => s.name === 'Neutral')?.value || 0,
        percentage: 0,
      },
      negative: {
        count: sentimentData.find(s => s.name === 'Negative')?.value || 0,
        percentage: 0,
      },
    }

    // Calculate percentages
    if (total > 0) {
      distribution.positive.percentage = Math.round((distribution.positive.count / total) * 100 * 100) / 100
      distribution.neutral.percentage = Math.round((distribution.neutral.count / total) * 100 * 100) / 100
      distribution.negative.percentage = Math.round((distribution.negative.count / total) * 100 * 100) / 100
    }

    // Calculate sentiment trends over time (quarterly)
    const trends: Array<{ period: string; positive: number; neutral: number; negative: number }> = []
    const quarterlyData = new Map<string, { positive: number; neutral: number; negative: number; total: number }>()

    reviews.forEach(review => {
      const date = new Date(reviewFieldAccessor.getPublishedDate(review) || '')
      const quarter = `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`

      if (!quarterlyData.has(quarter)) {
        quarterlyData.set(quarter, { positive: 0, neutral: 0, negative: 0, total: 0 })
      }

      const data = quarterlyData.get(quarter)
      if (data) {
        data.total++

        const sentiment = review.sentiment?.toLowerCase() || 'neutral'
        if (sentiment.includes('positive')) data.positive++
        else if (sentiment.includes('negative')) data.negative++
        else data.neutral++
      }
    })

    // Convert to percentage trends
    quarterlyData.forEach((data, period) => {
      if (data.total > 0) {
        trends.push({
          period,
          positive: Math.round((data.positive / data.total) * 100),
          neutral: Math.round((data.neutral / data.total) * 100),
          negative: Math.round((data.negative / data.total) * 100),
        })
      }
    })

    // Sort trends chronologically
    trends.sort((a, b) => {
      const yearA = parseInt(a.period.split(' ')[1])
      const yearB = parseInt(b.period.split(' ')[1])
      if (yearA !== yearB) return yearA - yearB
      return parseInt(a.period[1]) - parseInt(b.period[1])
    })

    // Calculate correlation with ratings
    const highRatingReviews = reviews.filter(r => r.stars >= 4)
    const lowRatingReviews = reviews.filter(r => r.stars <= 2)

    const highRatingSentiment = analyzeReviewSentiment_sync(highRatingReviews)
    const lowRatingSentiment = analyzeReviewSentiment_sync(lowRatingReviews)

    const correlationWithRating = {
      highRating: {
        positive: highRatingSentiment.find(s => s.name === 'Positive')?.value || 0,
        negative: highRatingSentiment.find(s => s.name === 'Negative')?.value || 0,
      },
      lowRating: {
        positive: lowRatingSentiment.find(s => s.name === 'Positive')?.value || 0,
        negative: lowRatingSentiment.find(s => s.name === 'Negative')?.value || 0,
      },
    }

    stopMeasurement()

    return {
      distribution,
      trends: trends.slice(-8), // Last 8 quarters
      correlationWithRating,
    }
  },
  (reviews: Review[]) =>
    `sentiment-${reviews.length}-${reviews.filter(r => r.sentiment?.includes('positive')).length}`,
  3 * 60 * 1000, // 3 minutes cache
)

// Calculate thematic analysis - MEMOIZED - FIXED TO USE PROPER FIELD ACCESSORS
export const calculateThematicAnalysis = memoizeWithExpiry(
  (reviews: Review[]): ThematicAnalysis => {
    const stopMeasurement = PerformanceMonitor.startMeasurement('thematic-analysis-calculation')

    const commonTerms = extractCommonTerms_sync(reviews)

    // Group by category and calculate metrics
    const categoryMap = new Map<string, { terms: typeof commonTerms; totalCount: number; ratings: number[] }>()

    commonTerms.forEach(term => {
      const category = term.category || 'Others'
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { terms: [], totalCount: 0, ratings: [] })
      }

      const categoryData = categoryMap.get(category)
      if (categoryData) {
        categoryData.terms.push(term)
        categoryData.totalCount += term.count

        // Find reviews mentioning this term to get average rating - FIXED
        const mentioningReviews = reviews.filter(review => {
          const mainThemes = reviewFieldAccessor.getMainThemes(review)
          const commonTermsField = review['common terms']
          return (mainThemes?.toLowerCase().includes(term.text.toLowerCase())) ||
                 (commonTermsField?.toLowerCase().includes(term.text.toLowerCase()))
        })

        mentioningReviews.forEach(review => categoryData.ratings.push(review.stars))
      }
    })

    // Convert to top categories
    const topCategories = Array.from(categoryMap.entries())
      .map(([category, data]) => {
        const averageRating = data.ratings.length > 0
          ? data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length
          : 0

        const percentage = reviews.length > 0 ? (data.totalCount / reviews.length) * 100 : 0

        // Determine sentiment based on average rating
        let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral'
        if (averageRating >= 4) sentiment = 'positive'
        else if (averageRating <= 2) sentiment = 'negative'

        return {
          category,
          count: data.totalCount,
          percentage: Math.round(percentage * 100) / 100,
          averageRating: Math.round(averageRating * 100) / 100,
          sentiment,
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    // Identify attention areas (categories with low ratings)
    const attentionAreas = topCategories
      .filter(category => category.averageRating > 0 && category.averageRating < 3.5)
      .map(category => ({
        theme: category.category,
        negativeCount: Math.floor(category.count * (1 - category.averageRating / 5)),
        averageRating: category.averageRating,
        urgency: category.averageRating < 2.5 ? 'high' as const :
                 category.averageRating < 3.0 ? 'medium' as const : 'low' as const,
      }))
      .sort((a, b) => a.averageRating - b.averageRating)

    // Simple trending topics (most mentioned in recent reviews)
    const recentReviews = reviews
      .sort((a, b) => new Date(reviewFieldAccessor.getPublishedDate(b) || '').getTime() -
                       new Date(reviewFieldAccessor.getPublishedDate(a) || '').getTime())
      .slice(0, Math.min(50, Math.floor(reviews.length * 0.3))) // Last 30% or 50 reviews

    const recentTerms = extractCommonTerms_sync(recentReviews)
    const trendingTopics = commonTerms
      .map(term => {
        const recentCount = recentTerms.find(rt => rt.text === term.text)?.count || 0
        const recentPercentage = recentReviews.length > 0 ? (recentCount / recentReviews.length) * 100 : 0
        const overallPercentage = reviews.length > 0 ? (term.count / reviews.length) * 100 : 0

        let trend: 'rising' | 'declining' | 'stable' = 'stable'
        if (recentPercentage > overallPercentage * 1.2) trend = 'rising'
        else if (recentPercentage < overallPercentage * 0.8) trend = 'declining'

        return {
          topic: term.text,
          count: term.count,
          trend,
          recentMentions: recentCount,
        }
      })
      .filter(topic => topic.recentMentions > 0)
      .sort((a, b) => {
        if (a.trend === 'rising' && b.trend !== 'rising') return -1
        if (b.trend === 'rising' && a.trend !== 'rising') return 1
        return b.recentMentions - a.recentMentions
      })
      .slice(0, 6)

    stopMeasurement()

    return {
      topCategories,
      trendingTopics,
      attentionAreas,
    }
  },
  (reviews: Review[]) =>
    `thematic-${reviews.length}-${reviews.slice(0, 10).map(r => r.id).join('-')}`,
  5 * 60 * 1000, // 5 minutes cache for complex calculations
)

// Main function to generate complete analysis summary - MEMOIZED
export const generateAnalysisSummary = memoizeWithExpiry(
  (
    reviews: Review[],
    config: AnalysisConfig = {
      timePeriod: 'all',
      includeStaffAnalysis: true,
      includeThematicAnalysis: true,
      includeActionItems: true,
      comparisonPeriod: 'previous',
    },
  ): AnalysisSummaryData => {
    const stopMeasurement = PerformanceMonitor.startMeasurement('analysis-summary-generation')

    if (!reviews || reviews.length === 0) {
      throw new Error('No reviews provided for analysis')
    }

    const timePeriod = createTimePeriods(config)
    const currentReviews = config.timePeriod === 'all' ? reviews :
      filterReviewsByDateRange(reviews, timePeriod.current.start, timePeriod.current.end)

    const previousReviews = config.comparisonPeriod === 'none' ? undefined :
      filterReviewsByDateRange(reviews, timePeriod.previous.start, timePeriod.previous.end)

    // Create period data for health score calculation
    const currentPeriodData: PeriodData = {
      start: timePeriod.current.start,
      end: timePeriod.current.end,
      reviews: currentReviews,
      metrics: {
        averageRating: calculateAverageRating(currentReviews),
        totalReviews: currentReviews.length,
        sentimentScore: 0, // Will be calculated below
        responseRate: 0,    // Will be calculated below
      },
    }

    const previousPeriodData: PeriodData | undefined = previousReviews ? {
      start: timePeriod.previous.start,
      end: timePeriod.previous.end,
      reviews: previousReviews,
      metrics: {
        averageRating: calculateAverageRating(previousReviews),
        totalReviews: previousReviews.length,
        sentimentScore: 0,
        responseRate: 0,
      },
    } : undefined

    // Calculate response analytics first to get response rate
    const responseAnalytics = calculateResponseAnalytics(currentReviews)
    currentPeriodData.metrics.responseRate = responseAnalytics.responseRate
    if (previousPeriodData && previousReviews) {
      const prevResponseAnalytics = calculateResponseAnalytics(previousReviews)
      previousPeriodData.metrics.responseRate = prevResponseAnalytics.responseRate
    }

    // Calculate sentiment analysis to get sentiment score
    const sentimentAnalysis = calculateSentimentAnalysis(currentReviews)
    currentPeriodData.metrics.sentimentScore = sentimentAnalysis.distribution.positive.percentage
    if (previousPeriodData && previousReviews) {
      const prevSentimentAnalysis = calculateSentimentAnalysis(previousReviews)
      previousPeriodData.metrics.sentimentScore = prevSentimentAnalysis.distribution.positive.percentage
    }

    // Now calculate all metrics
    const businessHealthScore = calculateBusinessHealthScore(currentPeriodData, previousPeriodData)
    const performanceMetrics = calculatePerformanceMetrics(currentReviews, timePeriod)
    const ratingAnalysis = calculateRatingAnalysis(currentReviews, previousReviews)
    const thematicAnalysis = config.includeThematicAnalysis ?
      calculateThematicAnalysis(currentReviews) :
      { topCategories: [], trendingTopics: [], attentionAreas: [] }

    // Basic staff insights and operational insights (simplified for Phase 1)
    const staffMentions = config.includeStaffAnalysis ? extractStaffMentions_sync(currentReviews) : []
    const staffInsights: StaffInsights = {
      mentions: staffMentions.map(mention => ({
        name: mention.name,
        totalMentions: mention.count,
        positiveMentions: mention.sentiment === 'positive' ? mention.count : 0,
        negativeMentions: mention.sentiment === 'negative' ? mention.count : 0,
        averageRatingInMentions: 0, // TODO: Calculate in future phases
        trend: 'stable' as const,
        examples: mention.examples || [],
      })),
      overallStaffScore: staffMentions.length > 0 ? 75 : 0, // Placeholder
      trainingOpportunities: [],
    }

    const languages = countReviewsByLanguage(currentReviews)
    const operationalInsights: OperationalInsights = {
      languageDiversity: languages.map(lang => ({
        language: lang.name,
        count: lang.value,
        percentage: Math.round((lang.value / currentReviews.length) * 100 * 100) / 100,
        averageRating: 0, // TODO: Calculate in future phases
      })),
      reviewPatterns: {
        peakDays: [],
        peakMonths: [performanceMetrics.peakMonth],
        quietPeriods: [],
      },
    }

    // Simple action items based on available data - FIXED TO USE PROPER FIELD ACCESSORS
    const actionItems: ActionItems = {
      urgent: [],
      improvements: [],
      strengths: [],
      monitoring: [],
    }

    if (config.includeActionItems) {
      // Add urgent items for unresponded negative reviews - FIXED
      const unrespondedNegative = currentReviews.filter(r =>
        r.stars <= 2 && !hasOwnerResponse(r),
      )

      if (unrespondedNegative.length > 0) {
        actionItems.urgent.push({
          type: 'unresponded_negative',
          description: `${unrespondedNegative.length} negative reviews need responses`,
          priority: 'high',
          affectedReviews: unrespondedNegative.length,
          suggestedAction: 'Respond to negative reviews to show customer care',
        })
      }

      // Add improvements based on low-rated categories
      thematicAnalysis.attentionAreas.forEach(area => {
        actionItems.improvements.push({
          area: area.theme,
          description: `${area.theme} has below-average ratings`,
          potentialImpact: area.urgency === 'high' ? 'high' : 'medium',
          effort: 'medium',
          suggestedActions: [`Focus on improving ${area.theme.toLowerCase()}`, 'Train staff on related areas'],
        })
      })

      // Add strengths
      thematicAnalysis.topCategories
        .filter(cat => cat.sentiment === 'positive')
        .slice(0, 3)
        .forEach(strength => {
          actionItems.strengths.push({
            area: strength.category,
            description: `${strength.category} receives positive feedback`,
            leverageOpportunities: [`Highlight ${strength.category.toLowerCase()} in marketing`, 'Maintain current standards'],
          })
        })
    }

    stopMeasurement()

    return {
      businessHealthScore,
      performanceMetrics,
      ratingAnalysis,
      responseAnalytics,
      sentimentAnalysis,
      thematicAnalysis,
      staffInsights,
      operationalInsights,
      actionItems,
      timePeriod,
      generatedAt: new Date(),
      dataSource: {
        totalReviews: currentReviews.length,
        dateRange: {
          start: timePeriod.current.start,
          end: timePeriod.current.end,
        },
        businessName: 'Current Business', // TODO: Pass business name
      },
    }
  },
  (reviews: Review[], config: AnalysisConfig) => generateAnalysisCacheKey(reviews, config),
  10 * 60 * 1000, // 10 minutes cache for the main analysis
)
