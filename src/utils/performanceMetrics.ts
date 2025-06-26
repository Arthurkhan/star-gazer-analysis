import type { Review } from '@/types/reviews'
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, parseISO } from 'date-fns'

export interface SeasonalTrend {
  period: string;
  avgRating: number;
  reviewCount: number;
  sentimentScore: number;
  trendDirection: 'up' | 'down' | 'stable';
  seasonality: 'peak' | 'low' | 'normal';
}

export interface CustomerJourney {
  firstReview: string;
  lastReview: string;
  totalReviews: number;
  averageRating: number;
  loyaltyScore: number;
  journeyStage: 'new' | 'returning' | 'loyal' | 'at-risk';
  engagementPattern: 'consistent' | 'sporadic' | 'declining';
  preferredTopics: string[];
}

export interface CompetitiveInsight {
  category: string;
  yourPerformance: number;
  industryAverage: number;
  topPerformer: number;
  competitivePosition: 'leader' | 'contender' | 'follower' | 'niche';
  improvementOpportunity: number;
  strategicRecommendation: string;
}

export interface AdvancedMetrics {
  customerLifetimeValue: number;
  churnRisk: number;
  brandLoyalty: number;
  wordOfMouthPotential: number;
  competitiveThreat: 'low' | 'medium' | 'high';
  marketPosition: 'dominant' | 'strong' | 'average' | 'weak';
}

/**
 * Calculate seasonal trends from review data
 */
export function calculateSeasonalTrends(reviews: Review[]): SeasonalTrend[] {
  if (!reviews.length) return []

  // Group reviews by month
  const monthlyGroups = reviews.reduce((acc, review) => {
    const date = parseISO(review.publishedAtDate)
    const monthKey = format(date, 'yyyy-MM')

    if (!acc[monthKey]) {
      acc[monthKey] = []
    }
    acc[monthKey].push(review)
    return acc
  }, {} as Record<string, Review[]>)

  // Calculate metrics for each month
  const monthlyTrends = Object.entries(monthlyGroups).map(([month, monthReviews]) => {
    const avgRating = monthReviews.reduce((sum, r) => sum + r.stars, 0) / monthReviews.length
    const sentimentScore = calculateSentimentScore(monthReviews)

    return {
      period: month,
      avgRating,
      reviewCount: monthReviews.length,
      sentimentScore,
      trendDirection: 'stable' as const,
      seasonality: 'normal' as const,
    }
  }).sort((a, b) => a.period.localeCompare(b.period))

  // Determine trend directions
  for (let i = 1; i < monthlyTrends.length; i++) {
    const current = monthlyTrends[i]
    const previous = monthlyTrends[i - 1]

    const ratingChange = current.avgRating - previous.avgRating
    const volumeChange = current.reviewCount - previous.reviewCount

    if (ratingChange > 0.2 || volumeChange > 5) {
      current.trendDirection = 'up'
    } else if (ratingChange < -0.2 || volumeChange < -5) {
      current.trendDirection = 'down'
    }
  }

  // Determine seasonality
  const avgReviewCount = monthlyTrends.reduce((sum, trend) => sum + trend.reviewCount, 0) / monthlyTrends.length
  monthlyTrends.forEach(trend => {
    if (trend.reviewCount > avgReviewCount * 1.3) {
      trend.seasonality = 'peak'
    } else if (trend.reviewCount < avgReviewCount * 0.7) {
      trend.seasonality = 'low'
    }
  })

  return monthlyTrends
}

/**
 * Analyze customer journey patterns
 */
export function analyzeCustomerJourney(reviews: Review[]): CustomerJourney[] {
  if (!reviews.length) return []

  // Group reviews by customer (using name as identifier)
  const customerGroups = reviews.reduce((acc, review) => {
    const customerName = review.name?.toLowerCase().trim() || 'anonymous'

    if (!acc[customerName]) {
      acc[customerName] = []
    }
    acc[customerName].push(review)
    return acc
  }, {} as Record<string, Review[]>)

  // Analyze journey for each customer
  return Object.entries(customerGroups)
    .filter(([name, customerReviews]) => name !== 'anonymous' && customerReviews.length > 0)
    .map(([name, customerReviews]) => {
      const sortedReviews = customerReviews.sort((a, b) =>
        new Date(a.publishedAtDate).getTime() - new Date(b.publishedAtDate).getTime(),
      )

      const firstReview = sortedReviews[0]
      const lastReview = sortedReviews[sortedReviews.length - 1]
      const averageRating = sortedReviews.reduce((sum, r) => sum + r.stars, 0) / sortedReviews.length

      // Calculate loyalty score based on frequency and rating consistency
      const daysBetween = Math.abs(
        new Date(lastReview.publishedAtDate).getTime() - new Date(firstReview.publishedAtDate).getTime(),
      ) / (1000 * 60 * 60 * 24)

      const loyaltyScore = Math.min(
        (sortedReviews.length * 20) + (averageRating * 10) - (daysBetween / 30),
        100,
      )

      // Determine journey stage
      let journeyStage: CustomerJourney['journeyStage'] = 'new'
      if (sortedReviews.length >= 3 && loyaltyScore > 60) {
        journeyStage = 'loyal'
      } else if (sortedReviews.length >= 2) {
        journeyStage = 'returning'
      } else if (daysBetween > 180 && sortedReviews.length === 1) {
        journeyStage = 'at-risk'
      }

      // Determine engagement pattern
      let engagementPattern: CustomerJourney['engagementPattern'] = 'consistent'
      if (sortedReviews.length === 1) {
        engagementPattern = 'sporadic'
      } else if (daysBetween > 365 && sortedReviews.length < 3) {
        engagementPattern = 'declining'
      }

      // Extract preferred topics from review themes
      const preferredTopics = sortedReviews
        .map(r => r.mainThemes || '')
        .filter(themes => themes.length > 0)
        .flatMap(themes => themes.split(',').map(t => t.trim()))
        .reduce((acc, topic) => {
          acc[topic] = (acc[topic] || 0) + 1
          return acc
        }, {} as Record<string, number>)

      const topTopics = Object.entries(preferredTopics)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([topic]) => topic)

      return {
        firstReview: firstReview.publishedAtDate,
        lastReview: lastReview.publishedAtDate,
        totalReviews: sortedReviews.length,
        averageRating,
        loyaltyScore: Math.max(0, loyaltyScore),
        journeyStage,
        engagementPattern,
        preferredTopics: topTopics,
      }
    })
}

/**
 * Generate competitive insights
 */
export function generateCompetitiveInsights(reviews: Review[], businessType: string = 'restaurant'): CompetitiveInsight[] {
  if (!reviews.length) return []

  // Industry benchmarks (would typically come from external data)
  const industryBenchmarks = {
    restaurant: {
      averageRating: 4.1,
      responseRate: 45,
      sentimentScore: 72,
      reviewVolume: 85,
    },
    cafe: {
      averageRating: 4.3,
      responseRate: 52,
      sentimentScore: 78,
      reviewVolume: 65,
    },
    bar: {
      averageRating: 4.0,
      responseRate: 38,
      sentimentScore: 70,
      reviewVolume: 70,
    },
    gallery: {
      averageRating: 4.4,
      responseRate: 35,
      sentimentScore: 82,
      reviewVolume: 25,
    },
  }

  const benchmark = industryBenchmarks[businessType as keyof typeof industryBenchmarks] || industryBenchmarks.restaurant

  // Calculate current performance
  const averageRating = reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length
  const responseRate = (reviews.filter(r => r.responseFromOwnerText).length / reviews.length) * 100
  const sentimentScore = calculateSentimentScore(reviews)
  const reviewVolume = reviews.length

  const insights: CompetitiveInsight[] = [
    {
      category: 'Overall Rating',
      yourPerformance: averageRating,
      industryAverage: benchmark.averageRating,
      topPerformer: benchmark.averageRating * 1.1,
      competitivePosition: getCompetitivePosition(averageRating, benchmark.averageRating),
      improvementOpportunity: Math.max(0, benchmark.averageRating - averageRating) * 20,
      strategicRecommendation: averageRating < benchmark.averageRating ?
        'Focus on improving service quality and customer satisfaction' :
        'Maintain current high standards while exploring excellence opportunities',
    },
    {
      category: 'Response Engagement',
      yourPerformance: responseRate,
      industryAverage: benchmark.responseRate,
      topPerformer: benchmark.responseRate * 1.3,
      competitivePosition: getCompetitivePosition(responseRate, benchmark.responseRate),
      improvementOpportunity: Math.max(0, benchmark.responseRate - responseRate),
      strategicRecommendation: responseRate < benchmark.responseRate ?
        'Increase customer engagement by responding to more reviews' :
        'Leverage your strong engagement to build customer loyalty',
    },
    {
      category: 'Customer Sentiment',
      yourPerformance: sentimentScore,
      industryAverage: benchmark.sentimentScore,
      topPerformer: benchmark.sentimentScore * 1.15,
      competitivePosition: getCompetitivePosition(sentimentScore, benchmark.sentimentScore),
      improvementOpportunity: Math.max(0, benchmark.sentimentScore - sentimentScore),
      strategicRecommendation: sentimentScore < benchmark.sentimentScore ?
        'Address negative feedback patterns and enhance positive experiences' :
        'Use positive sentiment as a marketing advantage',
    },
  ]

  return insights
}

/**
 * Calculate advanced business metrics
 */
export function calculateAdvancedMetrics(reviews: Review[], customerJourneys: CustomerJourney[]): AdvancedMetrics {
  if (!reviews.length) {
    return {
      customerLifetimeValue: 0,
      churnRisk: 0,
      brandLoyalty: 0,
      wordOfMouthPotential: 0,
      competitiveThreat: 'low',
      marketPosition: 'average',
    }
  }

  // Calculate customer lifetime value based on review frequency and rating
  const avgReviewsPerCustomer = customerJourneys.length > 0 ?
    customerJourneys.reduce((sum, j) => sum + j.totalReviews, 0) / customerJourneys.length : 1
  const avgRating = reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length
  const customerLifetimeValue = avgReviewsPerCustomer * avgRating * 20 // Approximate value

  // Calculate churn risk based on recent activity
  const recentReviews = reviews.filter(r => {
    const reviewDate = new Date(r.publishedAtDate)
    const thirtyDaysAgo = subDays(new Date(), 30)
    return reviewDate >= thirtyDaysAgo
  })
  const churnRisk = Math.max(0, 100 - (recentReviews.length / reviews.length * 100 * 3))

  // Calculate brand loyalty based on repeat customers and ratings
  const loyalCustomers = customerJourneys.filter(j => j.journeyStage === 'loyal' || j.loyaltyScore > 70)
  const brandLoyalty = customerJourneys.length > 0 ?
    (loyalCustomers.length / customerJourneys.length) * 100 : 0

  // Calculate word of mouth potential
  const highRatingReviews = reviews.filter(r => r.stars >= 4)
  const wordOfMouthPotential = (highRatingReviews.length / reviews.length) * 100

  // Determine competitive threat level
  const lowRatingReviews = reviews.filter(r => r.stars <= 2)
  const threatLevel = lowRatingReviews.length / reviews.length
  let competitiveThreat: AdvancedMetrics['competitiveThreat'] = 'low'
  if (threatLevel > 0.2) competitiveThreat = 'high'
  else if (threatLevel > 0.1) competitiveThreat = 'medium'

  // Determine market position
  let marketPosition: AdvancedMetrics['marketPosition'] = 'average'
  if (avgRating >= 4.5 && brandLoyalty >= 70) marketPosition = 'dominant'
  else if (avgRating >= 4.2 && brandLoyalty >= 50) marketPosition = 'strong'
  else if (avgRating < 3.5 || brandLoyalty < 30) marketPosition = 'weak'

  return {
    customerLifetimeValue,
    churnRisk: Math.min(100, churnRisk),
    brandLoyalty,
    wordOfMouthPotential,
    competitiveThreat,
    marketPosition,
  }
}

// Helper functions
function calculateSentimentScore(reviews: Review[]): number {
  if (!reviews.length) return 0

  const sentimentValues = reviews.map(review => {
    const sentiment = review.sentiment?.toLowerCase() || ''
    if (sentiment.includes('positive')) return 1
    if (sentiment.includes('negative')) return -1
    return 0
  })

  const avgSentiment = sentimentValues.reduce((sum, val) => sum + val, 0) / sentimentValues.length
  return Math.round((avgSentiment + 1) * 50) // Convert to 0-100 scale
}

function getCompetitivePosition(yourScore: number, industryAverage: number): CompetitiveInsight['competitivePosition'] {
  const ratio = yourScore / industryAverage

  if (ratio >= 1.2) return 'leader'
  if (ratio >= 1.05) return 'contender'
  if (ratio >= 0.9) return 'follower'
  return 'niche'
}

/**
 * Calculate performance score for a specific time period
 */
export function calculatePeriodPerformance(reviews: Review[], startDate: Date, endDate: Date) {
  const periodReviews = reviews.filter(review => {
    const reviewDate = new Date(review.publishedAtDate)
    return reviewDate >= startDate && reviewDate <= endDate
  })

  if (!periodReviews.length) {
    return {
      reviewCount: 0,
      averageRating: 0,
      sentimentScore: 0,
      responseRate: 0,
      performanceScore: 0,
    }
  }

  const averageRating = periodReviews.reduce((sum, r) => sum + r.stars, 0) / periodReviews.length
  const sentimentScore = calculateSentimentScore(periodReviews)
  const responseRate = (periodReviews.filter(r => r.responseFromOwnerText).length / periodReviews.length) * 100

  // Composite performance score
  const performanceScore = (averageRating * 20) + (sentimentScore * 0.3) + (responseRate * 0.5)

  return {
    reviewCount: periodReviews.length,
    averageRating,
    sentimentScore,
    responseRate,
    performanceScore: Math.min(100, performanceScore),
  }
}

export default {
  calculateSeasonalTrends,
  analyzeCustomerJourney,
  generateCompetitiveInsights,
  calculateAdvancedMetrics,
  calculatePeriodPerformance,
}
