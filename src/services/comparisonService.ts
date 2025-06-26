import type { EnhancedAnalysis, ReviewCluster} from '@/types/dataAnalysis'
import { HistoricalTrend } from '@/types/dataAnalysis'
import type { Review } from '@/types/reviews'

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

/**
 * Compare data between two periods and calculate changes
 * Updated to work with actual review data instead of just EnhancedAnalysis
 */
export function compareDataPeriods(
  current: EnhancedAnalysis,
  previous: EnhancedAnalysis,
  currentReviews?: Review[],
  previousReviews?: Review[],
): ComparisonResult {
  // Calculate basic metric changes
  const currentRating = calculateAverageRatingFromReviews(currentReviews) || extractAverageRating(current)
  const previousRating = calculateAverageRatingFromReviews(previousReviews) || extractAverageRating(previous)
  const ratingChange = currentRating - previousRating

  const currentReviewCount = currentReviews?.length || calculateTotalReviewCount(current.reviewClusters)
  const previousReviewCount = previousReviews?.length || calculateTotalReviewCount(previous.reviewClusters)
  const reviewCountChange = currentReviewCount - previousReviewCount
  const reviewCountChangePercent = previousReviewCount > 0
    ? (reviewCountChange / previousReviewCount) * 100
    : 0

  const currentSentiment = calculateAverageSentimentFromReviews(currentReviews) || extractAverageSentiment(current)
  const previousSentiment = calculateAverageSentimentFromReviews(previousReviews) || extractAverageSentiment(previous)
  const sentimentChange = currentSentiment - previousSentiment

  // Extract themes from both periods
  const currentThemes = extractThemes(current)
  const previousThemes = extractThemes(previous)

  // Identify new and removed themes
  const currentThemesSet = new Set(currentThemes.map(t => t.name))
  const previousThemesSet = new Set(previousThemes.map(t => t.name))

  const newThemes = currentThemes
    .filter(t => !previousThemesSet.has(t.name))
    .map(t => t.name)

  const removedThemes = previousThemes
    .filter(t => !currentThemesSet.has(t.name))
    .map(t => t.name)

  // Find themes that exist in both periods and compare their sentiment
  const improvingThemes: string[] = []
  const decliningThemes: string[] = []

  currentThemes.forEach(currentTheme => {
    const previousTheme = previousThemes.find(t => t.name === currentTheme.name)
    if (previousTheme) {
      if (currentTheme.sentiment > previousTheme.sentiment + 0.1) {
        improvingThemes.push(currentTheme.name)
      } else if (currentTheme.sentiment < previousTheme.sentiment - 0.1) {
        decliningThemes.push(currentTheme.name)
      }
    }
  })

  // Compare staff performance
  const staffPerformanceChanges: Record<string, number> = {}

  const currentStaff = extractStaffMentions(current, currentReviews)
  const previousStaff = extractStaffMentions(previous, previousReviews)

  // Combine all staff members from both periods
  const allStaffMembers = new Set([
    ...Object.keys(currentStaff),
    ...Object.keys(previousStaff),
  ])

  // Calculate changes for each staff member
  allStaffMembers.forEach(staffName => {
    const currentScore = currentStaff[staffName] || 0
    const previousScore = previousStaff[staffName] || 0
    staffPerformanceChanges[staffName] = currentScore - previousScore
  })

  return {
    ratingChange,
    reviewCountChange,
    reviewCountChangePercent,
    sentimentChange,
    improvingThemes,
    decliningThemes,
    newThemes,
    removedThemes,
    staffPerformanceChanges,
  }
}

/**
 * Calculate average rating directly from reviews
 */
function calculateAverageRatingFromReviews(reviews?: Review[]): number {
  if (!reviews || reviews.length === 0) return 0

  const reviewsWithRating = reviews.filter(r => r.stars)
  if (reviewsWithRating.length === 0) return 0

  const totalRating = reviewsWithRating.reduce((sum, r) => sum + (r.stars || 0), 0)
  return totalRating / reviewsWithRating.length
}

/**
 * Calculate average sentiment directly from reviews
 */
function calculateAverageSentimentFromReviews(reviews?: Review[]): number {
  if (!reviews || reviews.length === 0) return 0

  const reviewsWithSentiment = reviews.filter(r => r.sentiment)
  if (reviewsWithSentiment.length === 0) return 0

  let totalSentiment = 0
  reviewsWithSentiment.forEach(review => {
    totalSentiment += mapSentimentToNumber(review.sentiment || '')
  })

  return totalSentiment / reviewsWithSentiment.length
}

/**
 * Extract average rating from analysis data
 */
function extractAverageRating(data: EnhancedAnalysis): number {
  // Try to get the rating from historical trends
  const latestTrend = data.historicalTrends[data.historicalTrends.length - 1]
  if (latestTrend && latestTrend.avgRating > 0) {
    return latestTrend.avgRating
  }

  // Fallback to calculating from review clusters
  return calculateAverageFromClusters(data.reviewClusters)
}

/**
 * Calculate average sentiment from analysis data
 */
function extractAverageSentiment(data: EnhancedAnalysis): number {
  // Calculate from review clusters
  const clusters = data.reviewClusters
  let totalWeightedSentiment = 0
  let totalReviews = 0

  for (const cluster of clusters) {
    const sentimentValue = mapSentimentToNumber(cluster.sentiment)
    totalWeightedSentiment += sentimentValue * cluster.count
    totalReviews += cluster.count
  }

  return totalReviews > 0 ? totalWeightedSentiment / totalReviews : 0
}

/**
 * Map sentiment text to numerical value
 */
function mapSentimentToNumber(sentiment: string): number {
  switch (sentiment.toLowerCase()) {
    case 'positive': return 1
    case 'neutral': return 0
    case 'negative': return -1
    case 'mixed': return 0
    default: return 0
  }
}

/**
 * Calculate average rating from review clusters
 */
function calculateAverageFromClusters(clusters: ReviewCluster[]): number {
  // We don't have average rating in our clusters, need to estimate from sentiment
  let totalSentimentValue = 0
  let totalReviews = 0

  for (const cluster of clusters) {
    // Convert sentiment to a rating approximation (1-5 scale)
    const sentimentValue = mapSentimentToNumber(cluster.sentiment)
    const approximateRating = 3 + (sentimentValue * 1.5) // Map -1,0,1 to 1.5,3,4.5

    totalSentimentValue += approximateRating * cluster.count
    totalReviews += cluster.count
  }

  return totalReviews > 0 ? totalSentimentValue / totalReviews : 0
}

/**
 * Calculate total number of reviews from clusters
 */
function calculateTotalReviewCount(clusters: ReviewCluster[]): number {
  return clusters.reduce((sum, cluster) => sum + cluster.count, 0)
}

/**
 * Extract theme information from analysis data
 */
function extractThemes(data: EnhancedAnalysis): Array<{ name: string; sentiment: number }> {
  // Extract themes from clusters and their keywords
  const themes: Array<{ name: string; sentiment: number }> = []

  // Extract from clusters
  data.reviewClusters.forEach(cluster => {
    const sentimentValue = mapSentimentToNumber(cluster.sentiment)

    // First add the cluster name itself as a theme
    themes.push({
      name: cluster.name,
      sentiment: sentimentValue,
    })

    // Then add each keyword as a theme
    cluster.keywords.forEach(keyword => {
      // Avoid very short keywords
      if (keyword.length < 3) return

      themes.push({
        name: keyword,
        sentiment: sentimentValue,
      })
    })
  })

  // Combine duplicate themes by averaging sentiment
  const themeMap = new Map<string, { sentiment: number; count: number }>()

  themes.forEach(theme => {
    const existing = themeMap.get(theme.name)
    if (existing) {
      existing.sentiment += theme.sentiment
      existing.count += 1
    } else {
      themeMap.set(theme.name, { sentiment: theme.sentiment, count: 1 })
    }
  })

  // Convert back to array with averaged sentiment
  return Array.from(themeMap.entries()).map(([name, data]) => ({
    name,
    sentiment: data.sentiment / data.count,
  }))
}

/**
 * Extract staff mentions and their sentiment from analysis data
 * Updated to also check actual reviews if provided
 */
function extractStaffMentions(data: EnhancedAnalysis, reviews?: Review[]): Record<string, number> {
  const staffMentions: Record<string, number> = {}

  // First check actual reviews if provided
  if (reviews && reviews.length > 0) {
    reviews.forEach(review => {
      if (review.staffMentioned) {
        const staffNames = review.staffMentioned.split(',').map(s => s.trim())
        const sentimentValue = mapSentimentToNumber(review.sentiment || 'neutral')

        staffNames.forEach(name => {
          if (name) {
            if (staffMentions[name]) {
              // Average the sentiment
              staffMentions[name] = (staffMentions[name] + sentimentValue) / 2
            } else {
              staffMentions[name] = sentimentValue
            }
          }
        })
      }
    })

    // If we found staff in actual reviews, return that
    if (Object.keys(staffMentions).length > 0) {
      return staffMentions
    }
  }

  // Otherwise fall back to looking in clusters
  data.reviewClusters.forEach(cluster => {
    // If the cluster is about staff
    if (cluster.name.toLowerCase().includes('staff') ||
        cluster.name.toLowerCase().includes('service') ||
        cluster.name.toLowerCase().includes('employee')) {
      // Use cluster sentiment as the baseline for staff sentiment
      const baseSentiment = mapSentimentToNumber(cluster.sentiment)

      // Look for specific staff names in the keywords
      cluster.keywords.forEach(keyword => {
        // Assume any capitalized word starting with a letter might be a name
        // This is a simplified approach - a real implementation would use NLP to detect names
        if (/^[A-Z][a-z]+$/.test(keyword)) {
          staffMentions[keyword] = baseSentiment
        }
      })
    }
  })

  return staffMentions
}
