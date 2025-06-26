import type { Review } from '@/types/reviews'
import { format, parseISO, subMonths, differenceInMonths } from 'date-fns'

export interface ThemePerformance {
  theme: string;
  frequency: number;
  averageRating: number;
  sentimentScore: number;
  trendDirection: 'rising' | 'declining' | 'stable';
  performanceScore: number;
  competitivePosition: 'strength' | 'opportunity' | 'threat' | 'neutral';
  associatedStaff: string[];
  keyReviews: Review[];
}

export interface TrendingTopic {
  topic: string;
  currentFrequency: number;
  previousFrequency: number;
  growthRate: number;
  trendType: 'emerging' | 'declining' | 'stable' | 'seasonal';
  significance: 'high' | 'medium' | 'low';
  relatedThemes: string[];
  impactOnRating: number;
}

export interface CompetitiveTheme {
  theme: string;
  yourMentions: number;
  yourSentiment: number;
  industryImportance: 'critical' | 'important' | 'moderate' | 'low';
  competitiveAdvantage: 'strong' | 'moderate' | 'weak' | 'none';
  strategicRecommendation: string;
  actionPriority: 'urgent' | 'high' | 'medium' | 'low';
}

export interface ThematicInsight {
  category: string;
  insight: string;
  evidence: string[];
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: string;
  timeframe: string;
}

/**
 * Analyze theme performance across all reviews
 */
export function analyzeThemePerformance(reviews: Review[]): ThemePerformance[] {
  if (!reviews.length) return []

  // Extract and analyze all themes
  const themeData = extractThemeData(reviews)

  const performances: ThemePerformance[] = []

  Object.entries(themeData).forEach(([theme, data]) => {
    if (data.reviews.length < 2) return // Skip themes with too few mentions

    const averageRating = data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length
    const sentimentScore = calculateThemeSentiment(data.reviews)
    const performanceScore = (averageRating * 20) + (sentimentScore * 0.8)

    // Determine trend direction
    const trendDirection = determineThemeTrend(data.reviews, theme)

    // Determine competitive position
    const competitivePosition = determineCompetitivePosition(performanceScore, data.frequency)

    // Extract associated staff
    const associatedStaff = extractAssociatedStaff(data.reviews)

    // Get key representative reviews
    const keyReviews = getKeyReviews(data.reviews, 3)

    performances.push({
      theme,
      frequency: data.frequency,
      averageRating,
      sentimentScore,
      trendDirection,
      performanceScore,
      competitivePosition,
      associatedStaff,
      keyReviews,
    })
  })

  return performances.sort((a, b) => b.performanceScore - a.performanceScore)
}

/**
 * Detect trending topics over time
 */
export function detectTrendingTopics(reviews: Review[], lookbackMonths: number = 6): TrendingTopic[] {
  if (!reviews.length) return []

  const now = new Date()
  const cutoffDate = subMonths(now, lookbackMonths)

  // Split reviews into current and previous periods
  const currentPeriodReviews = reviews.filter(review =>
    parseISO(review.publishedAtDate) >= cutoffDate,
  )
  const previousPeriodReviews = reviews.filter(review =>
    parseISO(review.publishedAtDate) < cutoffDate,
  )

  if (!currentPeriodReviews.length) return []

  // Extract themes from both periods
  const currentThemes = extractThemeFrequency(currentPeriodReviews)
  const previousThemes = extractThemeFrequency(previousPeriodReviews)

  const trendingTopics: TrendingTopic[] = []

  // Analyze each theme for trends
  const allThemes = new Set([...Object.keys(currentThemes), ...Object.keys(previousThemes)])

  allThemes.forEach(theme => {
    const currentFreq = currentThemes[theme] || 0
    const previousFreq = previousThemes[theme] || 0

    if (currentFreq === 0 && previousFreq === 0) return

    // Calculate growth rate
    let growthRate = 0
    if (previousFreq === 0 && currentFreq > 0) {
      growthRate = 100 // New topic
    } else if (previousFreq > 0) {
      growthRate = ((currentFreq - previousFreq) / previousFreq) * 100
    }

    // Determine trend type
    let trendType: TrendingTopic['trendType'] = 'stable'
    if (Math.abs(growthRate) > 50) {
      trendType = growthRate > 0 ? 'emerging' : 'declining'
    } else if (Math.abs(growthRate) > 20) {
      trendType = growthRate > 0 ? 'emerging' : 'declining'
    } else if (isSeasonalPattern(theme, reviews)) {
      trendType = 'seasonal'
    }

    // Determine significance
    let significance: TrendingTopic['significance'] = 'low'
    if (currentFreq >= 10 || Math.abs(growthRate) > 100) {
      significance = 'high'
    } else if (currentFreq >= 5 || Math.abs(growthRate) > 50) {
      significance = 'medium'
    }

    // Find related themes
    const relatedThemes = findRelatedThemes(theme, currentPeriodReviews)

    // Calculate impact on rating
    const impactOnRating = calculateThemeRatingImpact(theme, currentPeriodReviews)

    trendingTopics.push({
      topic: theme,
      currentFrequency: currentFreq,
      previousFrequency: previousFreq,
      growthRate,
      trendType,
      significance,
      relatedThemes,
      impactOnRating,
    })
  })

  return trendingTopics
    .filter(topic => topic.significance !== 'low' || Math.abs(topic.growthRate) > 25)
    .sort((a, b) => Math.abs(b.growthRate) - Math.abs(a.growthRate))
    .slice(0, 10)
}

/**
 * Identify competitive themes and opportunities
 */
export function identifyCompetitiveThemes(reviews: Review[], businessType: string = 'restaurant'): CompetitiveTheme[] {
  if (!reviews.length) return []

  // Industry-specific important themes
  const industryThemes = getIndustryThemes(businessType)
  const themeData = extractThemeData(reviews)

  const competitiveThemes: CompetitiveTheme[] = []

  // Analyze each industry-important theme
  industryThemes.forEach(industryTheme => {
    const themeInfo = themeData[industryTheme.theme] || {
      frequency: 0,
      ratings: [],
      reviews: [],
    }

    const yourMentions = themeInfo.frequency
    const yourSentiment = themeInfo.reviews.length > 0 ?
      calculateThemeSentiment(themeInfo.reviews) : 0

    // Determine competitive advantage
    let competitiveAdvantage: CompetitiveTheme['competitiveAdvantage'] = 'none'
    if (yourMentions >= industryTheme.expectedFrequency * 1.5 && yourSentiment > 80) {
      competitiveAdvantage = 'strong'
    } else if (yourMentions >= industryTheme.expectedFrequency && yourSentiment > 70) {
      competitiveAdvantage = 'moderate'
    } else if (yourMentions >= industryTheme.expectedFrequency * 0.5 && yourSentiment > 60) {
      competitiveAdvantage = 'weak'
    }

    // Generate strategic recommendation
    const strategicRecommendation = generateThemeRecommendation(
      industryTheme.theme,
      yourMentions,
      yourSentiment,
      industryTheme.expectedFrequency,
      industryTheme.importance,
    )

    // Determine action priority
    let actionPriority: CompetitiveTheme['actionPriority'] = 'low'
    if (industryTheme.importance === 'critical' && competitiveAdvantage === 'none') {
      actionPriority = 'urgent'
    } else if (industryTheme.importance === 'critical' && competitiveAdvantage === 'weak') {
      actionPriority = 'high'
    } else if (industryTheme.importance === 'important' && competitiveAdvantage === 'none') {
      actionPriority = 'high'
    } else if (industryTheme.importance === 'important' && competitiveAdvantage === 'weak') {
      actionPriority = 'medium'
    }

    competitiveThemes.push({
      theme: industryTheme.theme,
      yourMentions,
      yourSentiment,
      industryImportance: industryTheme.importance,
      competitiveAdvantage,
      strategicRecommendation,
      actionPriority,
    })
  })

  return competitiveThemes.sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
    return priorityOrder[b.actionPriority] - priorityOrder[a.actionPriority]
  })
}

/**
 * Generate thematic insights and recommendations
 */
export function generateThematicInsights(reviews: Review[]): ThematicInsight[] {
  if (!reviews.length) return []

  const insights: ThematicInsight[] = []
  const themePerformances = analyzeThemePerformance(reviews)
  const trendingTopics = detectTrendingTopics(reviews)

  // Insight 1: Top performing themes
  const topThemes = themePerformances.slice(0, 3)
  if (topThemes.length > 0) {
    insights.push({
      category: 'Strength Themes',
      insight: `Your strongest themes are ${topThemes.map(t => t.theme).join(', ')} with excellent performance scores`,
      evidence: topThemes.map(t => `${t.theme}: ${t.performanceScore.toFixed(1)} score, ${t.frequency} mentions`),
      recommendation: 'Leverage these strengths in marketing and continue to excel in these areas',
      priority: 'high',
      estimatedImpact: 'High - Use as competitive differentiation',
      timeframe: 'Immediate',
    })
  }

  // Insight 2: Underperforming themes
  const weakThemes = themePerformances.filter(t => t.performanceScore < 60).slice(0, 3)
  if (weakThemes.length > 0) {
    insights.push({
      category: 'Improvement Opportunities',
      insight: `Areas needing attention: ${weakThemes.map(t => t.theme).join(', ')}`,
      evidence: weakThemes.map(t => `${t.theme}: ${t.performanceScore.toFixed(1)} score, ${t.averageRating.toFixed(1)} avg rating`),
      recommendation: 'Focus improvement efforts on these themes through training and process improvements',
      priority: 'high',
      estimatedImpact: 'High - Address customer pain points',
      timeframe: '1-3 months',
    })
  }

  // Insight 3: Emerging trends
  const emergingTrends = trendingTopics.filter(t => t.trendType === 'emerging' && t.significance === 'high')
  if (emergingTrends.length > 0) {
    insights.push({
      category: 'Emerging Trends',
      insight: `New trending topics: ${emergingTrends.map(t => t.topic).join(', ')}`,
      evidence: emergingTrends.map(t => `${t.topic}: ${t.growthRate.toFixed(0)}% growth, ${t.currentFrequency} mentions`),
      recommendation: 'Monitor these trends and consider capitalizing on positive emerging themes',
      priority: 'medium',
      estimatedImpact: 'Medium - Early adoption advantage',
      timeframe: '2-6 months',
    })
  }

  // Insight 4: Declining themes
  const decliningTrends = trendingTopics.filter(t => t.trendType === 'declining' && t.significance === 'high')
  if (decliningTrends.length > 0) {
    insights.push({
      category: 'Declining Attention',
      insight: `Declining themes: ${decliningTrends.map(t => t.topic).join(', ')}`,
      evidence: decliningTrends.map(t => `${t.topic}: ${t.growthRate.toFixed(0)}% decline, ${t.currentFrequency} current mentions`),
      recommendation: 'Investigate why these themes are declining and address if they were previously strengths',
      priority: 'medium',
      estimatedImpact: 'Medium - Prevent further decline',
      timeframe: '1-2 months',
    })
  }

  // Insight 5: Staff performance themes
  const staffThemes = themePerformances.filter(t => t.associatedStaff.length > 0).slice(0, 2)
  if (staffThemes.length > 0) {
    insights.push({
      category: 'Staff Performance',
      insight: 'Staff-related themes show varying performance levels',
      evidence: staffThemes.map(t => `${t.theme}: Associated with ${t.associatedStaff.join(', ')}, ${t.performanceScore.toFixed(1)} score`),
      recommendation: 'Use high-performing staff as mentors and provide additional training where needed',
      priority: 'medium',
      estimatedImpact: 'High - Direct impact on service quality',
      timeframe: '2-4 weeks',
    })
  }

  return insights
}

// Helper functions
function extractThemeData(reviews: Review[]) {
  const themeData: Record<string, { frequency: number; ratings: number[]; reviews: Review[] }> = {}

  reviews.forEach(review => {
    const themes = review.mainThemes?.split(',').map(t => t.trim().toLowerCase()) || []

    themes.forEach(theme => {
      if (theme.length > 2) { // Skip very short themes
        if (!themeData[theme]) {
          themeData[theme] = { frequency: 0, ratings: [], reviews: [] }
        }
        themeData[theme].frequency++
        themeData[theme].ratings.push(review.stars)
        themeData[theme].reviews.push(review)
      }
    })
  })

  return themeData
}

function extractThemeFrequency(reviews: Review[]): Record<string, number> {
  const frequency: Record<string, number> = {}

  reviews.forEach(review => {
    const themes = review.mainThemes?.split(',').map(t => t.trim().toLowerCase()) || []

    themes.forEach(theme => {
      if (theme.length > 2) {
        frequency[theme] = (frequency[theme] || 0) + 1
      }
    })
  })

  return frequency
}

function calculateThemeSentiment(reviews: Review[]): number {
  if (!reviews.length) return 0

  const sentimentScores = reviews.map(review => {
    const sentiment = review.sentiment?.toLowerCase() || ''
    if (sentiment.includes('positive')) return 100
    if (sentiment.includes('negative')) return 0
    return 50
  })

  return sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length
}

function determineThemeTrend(reviews: Review[], theme: string): ThemePerformance['trendDirection'] {
  if (reviews.length < 4) return 'stable'

  // Sort reviews by date
  const sortedReviews = reviews.sort((a, b) =>
    new Date(a.publishedAtDate).getTime() - new Date(b.publishedAtDate).getTime(),
  )

  // Split into early and recent periods
  const midpoint = Math.floor(sortedReviews.length / 2)
  const earlyReviews = sortedReviews.slice(0, midpoint)
  const recentReviews = sortedReviews.slice(midpoint)

  const earlyAvgRating = earlyReviews.reduce((sum, r) => sum + r.stars, 0) / earlyReviews.length
  const recentAvgRating = recentReviews.reduce((sum, r) => sum + r.stars, 0) / recentReviews.length

  const difference = recentAvgRating - earlyAvgRating

  if (difference > 0.3) return 'rising'
  if (difference < -0.3) return 'declining'
  return 'stable'
}

function determineCompetitivePosition(performanceScore: number, frequency: number): ThemePerformance['competitivePosition'] {
  if (performanceScore > 80 && frequency > 5) return 'strength'
  if (performanceScore < 60 && frequency > 3) return 'threat'
  if (performanceScore > 70 && frequency > 2) return 'opportunity'
  return 'neutral'
}

function extractAssociatedStaff(reviews: Review[]): string[] {
  const staffMentions: Record<string, number> = {}

  reviews.forEach(review => {
    const staff = review.staffMentioned?.split(',').map(s => s.trim()) || []
    staff.forEach(person => {
      if (person.length > 1) {
        staffMentions[person] = (staffMentions[person] || 0) + 1
      }
    })
  })

  return Object.entries(staffMentions)
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .map(([staff]) => staff)
    .slice(0, 3)
}

function getKeyReviews(reviews: Review[], count: number): Review[] {
  // Sort by rating and date to get most representative reviews
  return reviews
    .sort((a, b) => {
      // Prioritize higher ratings and more recent reviews
      const ratingDiff = b.stars - a.stars
      if (ratingDiff !== 0) return ratingDiff
      return new Date(b.publishedAtDate).getTime() - new Date(a.publishedAtDate).getTime()
    })
    .slice(0, count)
}

function isSeasonalPattern(theme: string, reviews: Review[]): boolean {
  // Simple seasonal detection based on theme keywords
  const seasonalKeywords = ['holiday', 'christmas', 'summer', 'winter', 'valentine', 'easter', 'thanksgiving']
  return seasonalKeywords.some(keyword => theme.toLowerCase().includes(keyword))
}

function findRelatedThemes(targetTheme: string, reviews: Review[]): string[] {
  const relatedThemes: Record<string, number> = {}

  reviews.forEach(review => {
    const themes = review.mainThemes?.split(',').map(t => t.trim().toLowerCase()) || []

    if (themes.includes(targetTheme.toLowerCase())) {
      themes.forEach(theme => {
        if (theme !== targetTheme.toLowerCase() && theme.length > 2) {
          relatedThemes[theme] = (relatedThemes[theme] || 0) + 1
        }
      })
    }
  })

  return Object.entries(relatedThemes)
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .map(([theme]) => theme)
    .slice(0, 3)
}

function calculateThemeRatingImpact(theme: string, reviews: Review[]): number {
  const themeReviews = reviews.filter(review =>
    review.mainThemes?.toLowerCase().includes(theme.toLowerCase()),
  )
  const nonThemeReviews = reviews.filter(review =>
    !review.mainThemes?.toLowerCase().includes(theme.toLowerCase()),
  )

  if (themeReviews.length === 0 || nonThemeReviews.length === 0) return 0

  const themeAvgRating = themeReviews.reduce((sum, r) => sum + r.stars, 0) / themeReviews.length
  const nonThemeAvgRating = nonThemeReviews.reduce((sum, r) => sum + r.stars, 0) / nonThemeReviews.length

  return themeAvgRating - nonThemeAvgRating
}

function getIndustryThemes(businessType: string) {
  const themes = {
    restaurant: [
      { theme: 'food quality', importance: 'critical' as const, expectedFrequency: 20 },
      { theme: 'service', importance: 'critical' as const, expectedFrequency: 15 },
      { theme: 'atmosphere', importance: 'important' as const, expectedFrequency: 10 },
      { theme: 'value', importance: 'important' as const, expectedFrequency: 8 },
      { theme: 'cleanliness', importance: 'important' as const, expectedFrequency: 6 },
      { theme: 'wait time', importance: 'moderate' as const, expectedFrequency: 5 },
    ],
    cafe: [
      { theme: 'coffee quality', importance: 'critical' as const, expectedFrequency: 25 },
      { theme: 'service', importance: 'critical' as const, expectedFrequency: 12 },
      { theme: 'atmosphere', importance: 'important' as const, expectedFrequency: 15 },
      { theme: 'pastries', importance: 'important' as const, expectedFrequency: 8 },
      { theme: 'wifi', importance: 'moderate' as const, expectedFrequency: 5 },
      { theme: 'seating', importance: 'moderate' as const, expectedFrequency: 4 },
    ],
    bar: [
      { theme: 'drinks', importance: 'critical' as const, expectedFrequency: 20 },
      { theme: 'atmosphere', importance: 'critical' as const, expectedFrequency: 18 },
      { theme: 'service', importance: 'important' as const, expectedFrequency: 12 },
      { theme: 'music', importance: 'important' as const, expectedFrequency: 8 },
      { theme: 'food', importance: 'moderate' as const, expectedFrequency: 6 },
      { theme: 'prices', importance: 'moderate' as const, expectedFrequency: 5 },
    ],
    gallery: [
      { theme: 'art quality', importance: 'critical' as const, expectedFrequency: 15 },
      { theme: 'exhibition', importance: 'critical' as const, expectedFrequency: 12 },
      { theme: 'space', importance: 'important' as const, expectedFrequency: 10 },
      { theme: 'curation', importance: 'important' as const, expectedFrequency: 8 },
      { theme: 'lighting', importance: 'moderate' as const, expectedFrequency: 5 },
      { theme: 'accessibility', importance: 'moderate' as const, expectedFrequency: 3 },
    ],
  }

  return themes[businessType as keyof typeof themes] || themes.restaurant
}

function generateThemeRecommendation(
  theme: string,
  yourMentions: number,
  yourSentiment: number,
  expectedFrequency: number,
  importance: string,
): string {
  if (yourMentions === 0) {
    return `${theme} is not being mentioned by customers. This ${importance} theme needs attention to meet industry standards.`
  }

  if (yourMentions < expectedFrequency * 0.5) {
    return `${theme} is under-mentioned compared to industry standards. Increase focus on this ${importance} area.`
  }

  if (yourSentiment < 60) {
    return `${theme} sentiment is below average. This ${importance} theme requires immediate improvement efforts.`
  }

  if (yourSentiment > 80 && yourMentions >= expectedFrequency) {
    return `${theme} is a competitive strength. Leverage this advantage in marketing and continue excellence.`
  }

  return `${theme} performance is adequate but has room for improvement to become a competitive advantage.`
}

export default {
  analyzeThemePerformance,
  detectTrendingTopics,
  identifyCompetitiveThemes,
  generateThematicInsights,
}
