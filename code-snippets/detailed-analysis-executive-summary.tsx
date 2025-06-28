/**
 * EXECUTIVE SUMMARY COMPONENT
 *
 * A comprehensive dashboard card that displays high-level business health metrics
 * and performance indicators derived from customer reviews.
 *
 * FEATURES:
 * - Business Health Score with visual indicators
 * - Review Volume metrics with growth trends
 * - Rating Performance tracking
 * - Customer Engagement metrics
 * - Responsive grid layout
 * - Visual health indicators with gradients
 * - Progress bars for metric breakdowns
 * - Trend indicators with icons
 *
 * ADAPTATION GUIDE:
 * 1. Dependencies:
 *    - Install shadcn/ui components: Card, Badge
 *    - Install lucide-react for icons
 *    - Ensure Tailwind CSS is configured
 *
 * 2. Type Definitions:
 *    - Copy the type interfaces below into your types file
 *    - Adjust metrics based on your business needs
 *
 * 3. Styling:
 *    - Uses Tailwind CSS classes
 *    - Supports dark mode via dark: modifiers
 *    - Gradient backgrounds for visual appeal
 *
 * 4. Data Requirements:
 *    - Requires pre-calculated health score data
 *    - Performance metrics from your analytics
 *    - Time period configuration
 *
 * 5. Customization:
 *    - Adjust health score thresholds (80/60/40)
 *    - Modify color schemes to match brand
 *    - Add/remove metrics as needed
 *    - Change grid layout (currently 4 columns on large screens)
 */

// ============= TYPE DEFINITIONS =============
// Add these to your types file or include inline

export interface BusinessHealthScore {
  overall: number // 0-100 overall health score
  ratingTrend: number // Trend in ratings (-100 to 100)
  sentimentScore: number // Positive sentiment percentage
  responseRate: number // Owner response rate percentage
  volumeTrend: number // Review volume trend percentage
  breakdown: {
    rating: number // Rating component score
    sentiment: number // Sentiment component score
    response: number // Response component score
    volume: number // Volume component score
  }
}

export interface PerformanceMetrics {
  totalReviews: number
  reviewsPerMonth: number
  growthRate: number // Percentage growth/decline
  peakMonth: string
  peakYear: string
  recentActivity: {
    last3Months: number
    last6Months: number
    last12Months: number
  }
  trends: {
    isGrowing: boolean
    seasonalPattern: 'stable' | 'seasonal' | 'declining' | 'growing'
    bestPeriods: string[]
    worstPeriods: string[]
  }
}

export interface TimePeriodConfig {
  current: {
    start: Date
    end: Date
    label: string
  }
  previous: {
    start: Date
    end: Date
    label: string
  }
  comparison: 'year' | 'month'
}

// ============= COMPONENT IMPLEMENTATION =============

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Users,
  MessageSquare,
  BarChart3,
  Activity,
} from 'lucide-react'
// Note: Import your own InfoTooltip component or replace with standard Tooltip

interface ExecutiveSummaryCardProps {
  healthScore: BusinessHealthScore
  performanceMetrics: PerformanceMetrics
  timePeriod: TimePeriodConfig
}

export const ExecutiveSummaryCard: React.FC<ExecutiveSummaryCardProps> = ({
  healthScore,
  performanceMetrics,
  timePeriod,
}) => {
  // Helper function to render trend indicator with enhanced visuals
  const renderTrendIndicator = (value: number, _label: string) => {
    if (Math.abs(value) < 2) {
      return (
        <div className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800'>
          <Minus className='w-4 h-4 text-gray-500' />
          <span className='text-sm font-medium text-gray-600 dark:text-gray-400'>
            Stable
          </span>
        </div>
      )
    }

    if (value > 0) {
      return (
        <div className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20'>
          <TrendingUp className='w-4 h-4 text-green-600 dark:text-green-400' />
          <span className='text-sm font-semibold text-green-700 dark:text-green-300'>
            +{value.toFixed(1)}%
          </span>
        </div>
      )
    }

    return (
      <div className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/20'>
        <TrendingDown className='w-4 h-4 text-red-600 dark:text-red-400' />
        <span className='text-sm font-semibold text-red-700 dark:text-red-300'>
          {value.toFixed(1)}%
        </span>
      </div>
    )
  }

  // Helper function to get health score color and label with better visuals
  const getHealthScoreInfo = (score: number) => {
    if (score >= 80) {
      return {
        color: 'bg-gradient-to-r from-green-500 to-emerald-500',
        label: 'Excellent',
        textColor: 'text-green-700 dark:text-green-300',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
      }
    } else if (score >= 60) {
      return {
        color: 'bg-gradient-to-r from-yellow-500 to-amber-500',
        label: 'Good',
        textColor: 'text-yellow-700 dark:text-yellow-300',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
      }
    } else if (score >= 40) {
      return {
        color: 'bg-gradient-to-r from-orange-500 to-red-500',
        label: 'Needs Attention',
        textColor: 'text-orange-700 dark:text-orange-300',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800',
      }
    } else {
      return {
        color: 'bg-gradient-to-r from-red-600 to-red-700',
        label: 'Critical',
        textColor: 'text-red-700 dark:text-red-300',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
      }
    }
  }

  const healthInfo = getHealthScoreInfo(healthScore.overall)

  return (
    <Card className='overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300'>
      <CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b'>
        <CardTitle className='flex items-center gap-3 text-xl'>
          <div className='p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm'>
            <BarChart3 className='w-6 h-6 text-blue-600 dark:text-blue-400' />
          </div>
          <span className='font-bold'>Executive Summary</span>
          {/* Replace with your tooltip component */}
          <span
            className='ml-auto text-sm text-gray-500'
            title='High-level overview of your business performance'
          >
            ℹ️
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className='p-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
          {/* Business Health Score - Enhanced Visual */}
          <div className='space-y-4'>
            <div className='flex items-center gap-3'>
              <div
                className={`w-12 h-12 rounded-xl ${healthInfo.color} flex items-center justify-center shadow-lg`}
              >
                <Activity className='w-6 h-6 text-white' />
              </div>
              <h3 className='font-bold text-lg'>Business Health</h3>
            </div>
            <div
              className={`${healthInfo.bgColor} ${healthInfo.borderColor} border-2 rounded-xl p-4 space-y-3`}
            >
              <div className='flex items-baseline gap-3'>
                <span className='text-4xl font-black'>
                  {healthScore.overall}%
                </span>
                <Badge
                  variant='secondary'
                  className={`${healthInfo.textColor} font-bold px-3 py-1`}
                >
                  {healthInfo.label}
                </Badge>
              </div>
              <p className='text-sm text-muted-foreground font-medium'>
                Overall business performance
              </p>
            </div>

            {/* Health breakdown with visual bars */}
            <div className='space-y-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-3'>
              <div className='space-y-1'>
                <div className='flex justify-between text-sm font-medium'>
                  <span className='flex items-center gap-1'>
                    Rating Quality
                  </span>
                  <span className='font-bold'>
                    {healthScore.breakdown.rating}%
                  </span>
                </div>
                <div className='h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden'>
                  <div
                    className='h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500'
                    style={{ width: `${healthScore.breakdown.rating}%` }}
                  />
                </div>
              </div>
              <div className='space-y-1'>
                <div className='flex justify-between text-sm font-medium'>
                  <span className='flex items-center gap-1'>
                    Customer Sentiment
                  </span>
                  <span className='font-bold'>
                    {healthScore.breakdown.sentiment}%
                  </span>
                </div>
                <div className='h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden'>
                  <div
                    className='h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500'
                    style={{ width: `${healthScore.breakdown.sentiment}%` }}
                  />
                </div>
              </div>
              <div className='space-y-1'>
                <div className='flex justify-between text-sm font-medium'>
                  <span className='flex items-center gap-1'>Response Rate</span>
                  <span className='font-bold'>
                    {healthScore.breakdown.response}%
                  </span>
                </div>
                <div className='h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden'>
                  <div
                    className='h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-500'
                    style={{ width: `${healthScore.breakdown.response}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Review Volume & Growth - Enhanced */}
          <div className='space-y-4'>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg'>
                <Users className='w-6 h-6 text-white' />
              </div>
              <h3 className='font-bold text-lg'>Review Volume</h3>
            </div>
            <div className='bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3'>
              <div className='flex items-baseline gap-3'>
                <span className='text-4xl font-black text-blue-700 dark:text-blue-300'>
                  {performanceMetrics.totalReviews}
                </span>
                <span className='text-sm font-medium text-blue-600 dark:text-blue-400'>
                  total reviews
                </span>
              </div>
              <p className='text-sm font-semibold text-blue-700 dark:text-blue-300'>
                {performanceMetrics.reviewsPerMonth.toFixed(1)} reviews/month
                avg
              </p>
            </div>

            {/* Growth indicator enhanced */}
            <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2'>
              <p className='text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-1'>
                Growth Trend
              </p>
              {renderTrendIndicator(performanceMetrics.growthRate, 'Growth')}
              <p className='text-xs text-muted-foreground mt-2 font-medium'>
                {performanceMetrics.trends.isGrowing
                  ? '📈 Expanding customer base'
                  : '📊 Stable customer engagement'}
              </p>
            </div>
          </div>

          {/* Rating Performance - Enhanced */}
          <div className='space-y-4'>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 flex items-center justify-center shadow-lg'>
                <Star className='w-6 h-6 text-white' />
              </div>
              <h3 className='font-bold text-lg'>Rating Trends</h3>
            </div>
            <div className='bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-4 space-y-3'>
              <div className='flex items-baseline gap-3'>
                <span className='text-4xl font-black text-yellow-700 dark:text-yellow-300'>
                  {healthScore.ratingTrend > 0 ? '+' : ''}
                  {(healthScore.ratingTrend / 20).toFixed(1)}
                </span>
                <div className='flex items-center'>
                  <Star className='w-5 h-5 fill-yellow-400 text-yellow-400' />
                </div>
              </div>
              <p className='text-sm font-semibold text-yellow-700 dark:text-yellow-300'>
                Rating change trend
              </p>
            </div>

            {/* Rating trend indicator enhanced */}
            <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2'>
              <p className='text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'>
                Trend Direction
              </p>
              {renderTrendIndicator(healthScore.ratingTrend, 'Rating')}
              <p className='text-xs text-muted-foreground mt-2 font-medium'>
                {healthScore.ratingTrend > 5
                  ? '⭐ Improving ratings'
                  : healthScore.ratingTrend < -5
                    ? '⚠️ Declining ratings'
                    : '➡️ Stable ratings'}
              </p>
            </div>
          </div>

          {/* Response & Engagement - Enhanced */}
          <div className='space-y-4'>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg'>
                <MessageSquare className='w-6 h-6 text-white' />
              </div>
              <h3 className='font-bold text-lg'>Engagement</h3>
            </div>
            <div className='bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-4 space-y-3'>
              <div className='flex items-baseline gap-3'>
                <span className='text-4xl font-black text-green-700 dark:text-green-300'>
                  {healthScore.responseRate}%
                </span>
                <span className='text-sm font-medium text-green-600 dark:text-green-400'>
                  response rate
                </span>
              </div>
              <p className='text-sm font-semibold text-green-700 dark:text-green-300'>
                Owner-customer interaction
              </p>
            </div>

            {/* Engagement assessment enhanced */}
            <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2'>
              <p className='text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-1'>
                Engagement Level
              </p>
              <Badge
                variant={
                  healthScore.responseRate >= 50 ? 'default' : 'secondary'
                }
                className='text-sm font-bold px-4 py-1.5'
              >
                {healthScore.responseRate >= 70
                  ? '🔥 High'
                  : healthScore.responseRate >= 40
                    ? '👍 Moderate'
                    : '📉 Low'}
              </Badge>
              <p className='text-xs text-muted-foreground mt-2 font-medium'>
                {healthScore.responseRate >= 50
                  ? '💬 Active customer communication'
                  : '💡 Opportunity to increase responses'}
              </p>
            </div>
          </div>
        </div>

        {/* Period Information - Enhanced */}
        <div className='mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
          <div className='flex items-center justify-between text-sm'>
            <div className='flex items-center gap-2'>
              <div className='w-2 h-2 rounded-full bg-blue-500 animate-pulse' />
              <span className='font-semibold text-gray-700 dark:text-gray-300'>
                Analysis Period: {timePeriod.current.label}
              </span>
            </div>
            <span className='font-medium text-gray-600 dark:text-gray-400'>
              {timePeriod.current.start.toLocaleDateString()} -{' '}
              {timePeriod.current.end.toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============= USAGE EXAMPLE =============
/*
// In your parent component:

import { ExecutiveSummaryCard } from './components/ExecutiveSummaryCard'

// Example data structure:
const healthScoreData: BusinessHealthScore = {
  overall: 85,
  ratingTrend: 15,
  sentimentScore: 78,
  responseRate: 65,
  volumeTrend: 22,
  breakdown: {
    rating: 88,
    sentiment: 78,
    response: 65,
    volume: 22,
  }
}

const performanceData: PerformanceMetrics = {
  totalReviews: 1234,
  reviewsPerMonth: 43.5,
  growthRate: 12.5,
  peakMonth: '12',
  peakYear: '2024',
  recentActivity: {
    last3Months: 130,
    last6Months: 260,
    last12Months: 520,
  },
  trends: {
    isGrowing: true,
    seasonalPattern: 'growing',
    bestPeriods: ['2024-12', '2024-11', '2024-10'],
    worstPeriods: ['2024-01', '2024-02', '2024-03'],
  }
}

const timePeriodData: TimePeriodConfig = {
  current: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31'),
    label: 'Last 12 Months',
  },
  previous: {
    start: new Date('2023-01-01'),
    end: new Date('2023-12-31'),
    label: 'Previous 12 Months',
  },
  comparison: 'year',
}

// Render the component:
<ExecutiveSummaryCard
  healthScore={healthScoreData}
  performanceMetrics={performanceData}
  timePeriod={timePeriodData}
/>
*/

// ============= ADAPTATION NOTES =============
/*
1. DEPENDENCIES TO INSTALL:
   - @shadcn/ui components: Card, Badge
   - lucide-react
   - Tailwind CSS

2. DATA CALCULATION:
   - Health score is calculated from rating, sentiment, response rate, and volume
   - Performance metrics track review counts and trends
   - All data should be pre-calculated before passing to component

3. CUSTOMIZATION OPTIONS:
   - Health score thresholds: Adjust 80/60/40 breakpoints
   - Colors: Modify gradient classes to match brand
   - Layout: Change from 4-column to 2 or 3 columns
   - Metrics: Add/remove specific metrics based on needs

4. RESPONSIVE DESIGN:
   - Mobile: Single column
   - Tablet (md): 2 columns
   - Desktop (lg): 4 columns

5. ACCESSIBILITY:
   - Uses semantic HTML
   - Color contrast meets WCAG standards
   - Screen reader friendly with proper labels
*/
