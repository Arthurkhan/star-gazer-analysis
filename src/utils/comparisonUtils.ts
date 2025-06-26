import type { Review } from '@/types/reviews'

export interface PeriodData {
  reviews: Review[];
  startDate: Date;
  endDate: Date;
  label: string;
}

export interface ComparisonMetrics {
  reviewCount: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
    trend: 'up' | 'down' | 'stable';
  };
  averageRating: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
    trend: 'up' | 'down' | 'stable';
  };
  sentiment: {
    current: SentimentBreakdown;
    previous: SentimentBreakdown;
    changes: SentimentChanges;
  };
  themes: {
    new: string[];
    declining: string[];
    improving: string[];
    consistent: string[];
  };
  responseRate: {
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  staffMentions: {
    current: Record<string, number>;
    previous: Record<string, number>;
    changes: Record<string, number>;
  };
}

export interface SentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
  mixed: number;
}

export interface SentimentChanges {
  positive: number;
  neutral: number;
  negative: number;
  mixed: number;
}

export interface ThresholdAlert {
  id: string;
  type: 'rating' | 'sentiment' | 'volume' | 'response_rate';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  value: number;
  threshold: number;
  comparison: 'above' | 'below';
  timestamp: Date;
  businessName: string;
}

export interface PerformanceThresholds {
  rating: {
    critical: number; // Below this rating triggers critical alert
    warning: number;  // Below this rating triggers warning
  };
  sentimentNegative: {
    critical: number; // Above this % negative triggers critical
    warning: number;  // Above this % negative triggers warning
  };
  responseRate: {
    critical: number; // Below this % response rate triggers critical
    warning: number;  // Below this % response rate triggers warning
  };
  volumeDrop: {
    critical: number; // Above this % drop triggers critical
    warning: number;  // Above this % drop triggers warning
  };
}

// Default performance thresholds
export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  rating: {
    critical: 3.0,
    warning: 3.5,
  },
  sentimentNegative: {
    critical: 40, // 40% negative reviews
    warning: 25,  // 25% negative reviews
  },
  responseRate: {
    critical: 30, // Below 30% response rate
    warning: 50,  // Below 50% response rate
  },
  volumeDrop: {
    critical: 50, // 50% drop in reviews
    warning: 25,  // 25% drop in reviews
  },
}

/**
 * Compare two periods of review data and calculate comprehensive metrics
 */
export function comparePeriods(current: PeriodData, previous: PeriodData): ComparisonMetrics {
  const currentMetrics = calculatePeriodMetrics(current.reviews)
  const previousMetrics = calculatePeriodMetrics(previous.reviews)

  return {
    reviewCount: {
      current: currentMetrics.reviewCount,
      previous: previousMetrics.reviewCount,
      change: currentMetrics.reviewCount - previousMetrics.reviewCount,
      changePercent: calculatePercentChange(previousMetrics.reviewCount, currentMetrics.reviewCount),
      trend: getTrend(previousMetrics.reviewCount, currentMetrics.reviewCount),
    },
    averageRating: {
      current: currentMetrics.averageRating,
      previous: previousMetrics.averageRating,
      change: currentMetrics.averageRating - previousMetrics.averageRating,
      changePercent: calculatePercentChange(previousMetrics.averageRating, currentMetrics.averageRating),
      trend: getTrend(previousMetrics.averageRating, currentMetrics.averageRating),
    },
    sentiment: {
      current: currentMetrics.sentiment,
      previous: previousMetrics.sentiment,
      changes: calculateSentimentChanges(previousMetrics.sentiment, currentMetrics.sentiment),
    },
    themes: compareThemes(current.reviews, previous.reviews),
    responseRate: {
      current: currentMetrics.responseRate,
      previous: previousMetrics.responseRate,
      change: currentMetrics.responseRate - previousMetrics.responseRate,
      trend: getTrend(previousMetrics.responseRate, currentMetrics.responseRate),
    },
    staffMentions: {
      current: currentMetrics.staffMentions,
      previous: previousMetrics.staffMentions,
      changes: calculateStaffChanges(previousMetrics.staffMentions, currentMetrics.staffMentions),
    },
  }
}

/**
 * Calculate metrics for a single period
 */
function calculatePeriodMetrics(reviews: Review[]) {
  const reviewCount = reviews.length
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + (r.stars || 0), 0) / reviews.length
    : 0

  const sentiment = calculateSentimentBreakdown(reviews)
  const responseRate = calculateResponseRate(reviews)
  const staffMentions = extractStaffMentions(reviews)

  return {
    reviewCount,
    averageRating,
    sentiment,
    responseRate,
    staffMentions,
  }
}

/**
 * Calculate sentiment breakdown for reviews
 */
function calculateSentimentBreakdown(reviews: Review[]): SentimentBreakdown {
  const breakdown = { positive: 0, neutral: 0, negative: 0, mixed: 0 }

  reviews.forEach(review => {
    const sentiment = review.sentiment?.toLowerCase() || 'neutral'
    if (sentiment.includes('positive')) breakdown.positive++
    else if (sentiment.includes('negative')) breakdown.negative++
    else if (sentiment.includes('mixed')) breakdown.mixed++
    else breakdown.neutral++
  })

  const total = reviews.length
  return {
    positive: total > 0 ? (breakdown.positive / total) * 100 : 0,
    neutral: total > 0 ? (breakdown.neutral / total) * 100 : 0,
    negative: total > 0 ? (breakdown.negative / total) * 100 : 0,
    mixed: total > 0 ? (breakdown.mixed / total) * 100 : 0,
  }
}

/**
 * Calculate response rate (percentage of reviews with owner responses)
 */
function calculateResponseRate(reviews: Review[]): number {
  if (reviews.length === 0) return 0

  const responsesCount = reviews.filter(r =>
    r.responseFromOwnerText && r.responseFromOwnerText.trim().length > 0,
  ).length

  return (responsesCount / reviews.length) * 100
}

/**
 * Extract staff mentions from reviews
 */
function extractStaffMentions(reviews: Review[]): Record<string, number> {
  const staffMentions: Record<string, number> = {}

  reviews.forEach(review => {
    const {staffMentioned} = review
    if (staffMentioned && staffMentioned.trim()) {
      // Split by common delimiters and clean up names
      const names = staffMentioned.split(/[,;|&]/).map(name => name.trim()).filter(name => name.length > 0)

      names.forEach(name => {
        // Normalize name (capitalize first letter, lowercase rest)
        const normalizedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
        staffMentions[normalizedName] = (staffMentions[normalizedName] || 0) + 1
      })
    }
  })

  return staffMentions
}

/**
 * Compare themes between two periods
 */
function compareThemes(currentReviews: Review[], previousReviews: Review[]): ComparisonMetrics['themes'] {
  const currentThemes = extractThemes(currentReviews)
  const previousThemes = extractThemes(previousReviews)

  const currentThemeSet = new Set(currentThemes)
  const previousThemeSet = new Set(previousThemes)

  const newThemes = currentThemes.filter(theme => !previousThemeSet.has(theme))
  const declining = previousThemes.filter(theme => !currentThemeSet.has(theme))
  const consistent = currentThemes.filter(theme => previousThemeSet.has(theme))

  return {
    new: newThemes,
    declining,
    improving: [], // Would need sentiment analysis to determine improving themes
    consistent,
  }
}

/**
 * Extract themes from reviews
 */
function extractThemes(reviews: Review[]): string[] {
  const themes = new Set<string>()

  reviews.forEach(review => {
    const {mainThemes} = review
    if (mainThemes && mainThemes.trim()) {
      // Split themes by common delimiters
      const themeList = mainThemes.split(/[,;|]/).map(theme => theme.trim()).filter(theme => theme.length > 0)
      themeList.forEach(theme => themes.add(theme))
    }
  })

  return Array.from(themes)
}

/**
 * Calculate percentage change between two values
 */
function calculatePercentChange(previous: number, current: number): number {
  if (previous === 0) return current === 0 ? 0 : 100
  return ((current - previous) / previous) * 100
}

/**
 * Determine trend direction
 */
function getTrend(previous: number, current: number): 'up' | 'down' | 'stable' {
  const change = current - previous
  const threshold = Math.abs(previous) * 0.05 // 5% threshold for stability

  if (Math.abs(change) <= threshold) return 'stable'
  return change > 0 ? 'up' : 'down'
}

/**
 * Calculate sentiment changes between periods
 */
function calculateSentimentChanges(previous: SentimentBreakdown, current: SentimentBreakdown): SentimentChanges {
  return {
    positive: current.positive - previous.positive,
    neutral: current.neutral - previous.neutral,
    negative: current.negative - previous.negative,
    mixed: current.mixed - previous.mixed,
  }
}

/**
 * Calculate staff performance changes
 */
function calculateStaffChanges(previous: Record<string, number>, current: Record<string, number>): Record<string, number> {
  const changes: Record<string, number> = {}

  // Get all staff members from both periods
  const allStaff = new Set([...Object.keys(previous), ...Object.keys(current)])

  allStaff.forEach(staff => {
    const prevCount = previous[staff] || 0
    const currCount = current[staff] || 0
    changes[staff] = currCount - prevCount
  })

  return changes
}

/**
 * Check performance thresholds and generate alerts
 */
export function checkPerformanceThresholds(
  reviews: Review[],
  businessName: string,
  thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS,
): ThresholdAlert[] {
  const alerts: ThresholdAlert[] = []
  const metrics = calculatePeriodMetrics(reviews)

  // Check rating thresholds
  if (metrics.averageRating <= thresholds.rating.critical) {
    alerts.push({
      id: `rating-critical-${Date.now()}`,
      type: 'rating',
      severity: 'critical',
      title: 'Critical Rating Alert',
      message: `Average rating has dropped to ${metrics.averageRating.toFixed(1)}, below critical threshold of ${thresholds.rating.critical}`,
      value: metrics.averageRating,
      threshold: thresholds.rating.critical,
      comparison: 'below',
      timestamp: new Date(),
      businessName,
    })
  } else if (metrics.averageRating <= thresholds.rating.warning) {
    alerts.push({
      id: `rating-warning-${Date.now()}`,
      type: 'rating',
      severity: 'high',
      title: 'Rating Warning',
      message: `Average rating is ${metrics.averageRating.toFixed(1)}, below warning threshold of ${thresholds.rating.warning}`,
      value: metrics.averageRating,
      threshold: thresholds.rating.warning,
      comparison: 'below',
      timestamp: new Date(),
      businessName,
    })
  }

  // Check sentiment thresholds
  if (metrics.sentiment.negative >= thresholds.sentimentNegative.critical) {
    alerts.push({
      id: `sentiment-critical-${Date.now()}`,
      type: 'sentiment',
      severity: 'critical',
      title: 'Critical Negative Sentiment',
      message: `${metrics.sentiment.negative.toFixed(1)}% of reviews are negative, above critical threshold of ${thresholds.sentimentNegative.critical}%`,
      value: metrics.sentiment.negative,
      threshold: thresholds.sentimentNegative.critical,
      comparison: 'above',
      timestamp: new Date(),
      businessName,
    })
  } else if (metrics.sentiment.negative >= thresholds.sentimentNegative.warning) {
    alerts.push({
      id: `sentiment-warning-${Date.now()}`,
      type: 'sentiment',
      severity: 'medium',
      title: 'High Negative Sentiment',
      message: `${metrics.sentiment.negative.toFixed(1)}% of reviews are negative, above warning threshold of ${thresholds.sentimentNegative.warning}%`,
      value: metrics.sentiment.negative,
      threshold: thresholds.sentimentNegative.warning,
      comparison: 'above',
      timestamp: new Date(),
      businessName,
    })
  }

  // Check response rate thresholds
  if (metrics.responseRate <= thresholds.responseRate.critical) {
    alerts.push({
      id: `response-critical-${Date.now()}`,
      type: 'response_rate',
      severity: 'critical',
      title: 'Critical Low Response Rate',
      message: `Response rate is ${metrics.responseRate.toFixed(1)}%, below critical threshold of ${thresholds.responseRate.critical}%`,
      value: metrics.responseRate,
      threshold: thresholds.responseRate.critical,
      comparison: 'below',
      timestamp: new Date(),
      businessName,
    })
  } else if (metrics.responseRate <= thresholds.responseRate.warning) {
    alerts.push({
      id: `response-warning-${Date.now()}`,
      type: 'response_rate',
      severity: 'medium',
      title: 'Low Response Rate',
      message: `Response rate is ${metrics.responseRate.toFixed(1)}%, below warning threshold of ${thresholds.responseRate.warning}%`,
      value: metrics.responseRate,
      threshold: thresholds.responseRate.warning,
      comparison: 'below',
      timestamp: new Date(),
      businessName,
    })
  }

  return alerts
}

/**
 * Create period data for comparison
 */
export function createPeriodData(
  reviews: Review[],
  startDate: Date,
  endDate: Date,
  label: string,
): PeriodData {
  const filteredReviews = reviews.filter(review => {
    if (!review.publishedAtDate) return false
    const reviewDate = new Date(review.publishedAtDate)
    return reviewDate >= startDate && reviewDate <= endDate
  })

  return {
    reviews: filteredReviews,
    startDate,
    endDate,
    label,
  }
}

/**
 * Generate common comparison periods (last 30 days vs previous 30 days, etc.)
 */
export function generateComparisonPeriods(reviews: Review[]): {
  current: PeriodData;
  previous: PeriodData;
  label: string;
}[] {
  const now = new Date()
  const periods = []

  // Last 30 days vs Previous 30 days
  const last30End = new Date(now)
  const last30Start = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
  const prev30Start = new Date(last30Start.getTime() - (30 * 24 * 60 * 60 * 1000))
  const prev30End = new Date(last30Start)

  periods.push({
    current: createPeriodData(reviews, last30Start, last30End, 'Last 30 Days'),
    previous: createPeriodData(reviews, prev30Start, prev30End, 'Previous 30 Days'),
    label: '30-Day Comparison',
  })

  // Last 90 days vs Previous 90 days
  const last90End = new Date(now)
  const last90Start = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000))
  const prev90Start = new Date(last90Start.getTime() - (90 * 24 * 60 * 60 * 1000))
  const prev90End = new Date(last90Start)

  periods.push({
    current: createPeriodData(reviews, last90Start, last90End, 'Last 90 Days'),
    previous: createPeriodData(reviews, prev90Start, prev90End, 'Previous 90 Days'),
    label: '90-Day Comparison',
  })

  // This year vs Last year (same period)
  const thisYearStart = new Date(now.getFullYear(), 0, 1)
  const thisYearEnd = new Date(now)
  const lastYearStart = new Date(now.getFullYear() - 1, 0, 1)
  const lastYearEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())

  periods.push({
    current: createPeriodData(reviews, thisYearStart, thisYearEnd, 'This Year'),
    previous: createPeriodData(reviews, lastYearStart, lastYearEnd, 'Last Year (Same Period)'),
    label: 'Year-over-Year Comparison',
  })

  return periods
}
