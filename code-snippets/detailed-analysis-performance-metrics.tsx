/**
 * PERFORMANCE METRICS COMPONENT
 *
 * A comprehensive grid displaying key performance metrics for business reviews,
 * including review volume analysis, rating distribution, and response analytics.
 *
 * FEATURES:
 * - Review Volume Analysis with trend visualization
 * - Rating Distribution with visual progress bars
 * - Response Analytics by rating category
 * - Growth rate indicators
 * - Seasonal pattern detection
 * - Interactive hover effects
 * - Dark mode support
 * - Responsive grid layout
 *
 * ADAPTATION GUIDE:
 * 1. Dependencies:
 *    - Install shadcn/ui components: Card, Badge, Progress
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
 *    - Pre-calculated performance metrics
 *    - Rating distribution data
 *    - Response analytics by rating
 *
 * 5. Customization:
 *    - Adjust color schemes to match brand
 *    - Modify rating benchmarks (Excellent/Good/Needs Work)
 *    - Change grid layout (currently 3 columns on large screens)
 *    - Add/remove specific metrics
 */

// ============= TYPE DEFINITIONS =============
// Add these to your types file or include inline

export interface PerformanceMetrics {
  totalReviews: number
  reviewsPerMonth: number
  growthRate: number // Percentage growth/decline
  peakMonth: string | null
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

export interface RatingAnalysis {
  trends: {
    current: number // Current average rating
    direction: 'up' | 'down' | 'stable'
    change: number // Change in rating
  }
  distribution: {
    [key: number]: {
      count: number
      percentage: number
    }
  }
  benchmarks: {
    excellent: number // Percentage of 4-5 star reviews
    good: number // Percentage of 3-5 star reviews
    needsImprovement: number // Percentage of 1-2 star reviews
  }
}

export interface ResponseAnalytics {
  responseRate: number // Overall response rate percentage
  responsesByRating: {
    [key: number]: {
      total: number
      responded: number
      rate: number // Response rate for this rating
    }
  }
  responseEffectiveness: {
    customerSatisfactionImpact: number // 0-10 scale
    improvedSubsequentRatings: boolean
  }
}

// ============= COMPONENT IMPLEMENTATION =============

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  BarChart3,
  Star,
  MessageSquare,
  TrendingUp,
  Calendar,
  Activity,
  Zap,
  Target,
  Award,
} from 'lucide-react'
// Note: Replace InfoTooltip with your own tooltip component
// import { InfoTooltip } from '@/components/ui/info-tooltip'

interface PerformanceMetricsGridProps {
  performanceMetrics: PerformanceMetrics
  ratingAnalysis: RatingAnalysis
  responseAnalytics: ResponseAnalytics
}

export const PerformanceMetricsGrid: React.FC<PerformanceMetricsGridProps> = ({
  performanceMetrics,
  ratingAnalysis,
  responseAnalytics,
}) => {
  // Helper to format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
    return num.toString()
  }

  // Helper to get seasonal pattern info
  const getSeasonalInfo = (pattern: string) => {
    switch (pattern) {
      case 'growing':
        return {
          label: 'Growing',
          color: 'text-green-600',
          bg: 'bg-green-100 dark:bg-green-900/30',
          icon: '📈',
        }
      case 'declining':
        return {
          label: 'Declining',
          color: 'text-red-600',
          bg: 'bg-red-100 dark:bg-red-900/30',
          icon: '📉',
        }
      case 'seasonal':
        return {
          label: 'Seasonal',
          color: 'text-blue-600',
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          icon: '📊',
        }
      default:
        return {
          label: 'Stable',
          color: 'text-gray-600',
          bg: 'bg-gray-100 dark:bg-gray-900/30',
          icon: '➡️',
        }
    }
  }

  const seasonalInfo = getSeasonalInfo(
    performanceMetrics.trends.seasonalPattern,
  )

  return (
    <Card className='overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300'>
      <CardHeader className='bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b'>
        <CardTitle className='flex items-center gap-3 text-xl'>
          <div className='p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm'>
            <BarChart3 className='w-6 h-6 text-indigo-600 dark:text-indigo-400' />
          </div>
          <span className='font-bold'>Performance Metrics</span>
          {/* Replace with your tooltip component */}
          <span
            className='ml-auto text-sm text-gray-500'
            title='Key performance indicators showing review volume, ratings, and customer engagement'
          >
            ℹ️
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className='p-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {/* Review Volume Analysis - Enhanced */}
          <Card className='border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group'>
            <div className='h-2 bg-gradient-to-r from-blue-400 to-cyan-500' />
            <CardHeader className='pb-4 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10'>
              <CardTitle className='text-lg flex items-center gap-2'>
                <div className='p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:scale-110 transition-transform'>
                  <Activity className='w-5 h-5 text-blue-600 dark:text-blue-400' />
                </div>
                <span className='font-bold'>Review Volume</span>
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-5'>
              {/* Main metric - larger and bolder */}
              <div className='text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl'>
                <div className='flex items-baseline justify-center gap-3'>
                  <span className='text-5xl font-black text-blue-700 dark:text-blue-300'>
                    {formatNumber(performanceMetrics.totalReviews)}
                  </span>
                  <span className='text-lg font-medium text-blue-600 dark:text-blue-400'>
                    reviews
                  </span>
                </div>
                <p className='text-sm font-semibold text-blue-600 dark:text-blue-400 mt-2'>
                  {performanceMetrics.reviewsPerMonth.toFixed(1)} per month
                  average
                </p>
              </div>

              {/* Recent Activity with visual bars */}
              <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3'>
                <h4 className='text-sm font-bold flex items-center gap-2'>
                  <Zap className='w-4 h-4 text-yellow-500' />
                  Recent Activity
                </h4>
                <div className='space-y-2'>
                  <div className='space-y-1'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600 dark:text-gray-400'>
                        Last 3 months
                      </span>
                      <span className='font-bold'>
                        {performanceMetrics.recentActivity.last3Months}
                      </span>
                    </div>
                    <Progress
                      value={
                        (performanceMetrics.recentActivity.last3Months /
                          performanceMetrics.totalReviews) *
                        100
                      }
                      className='h-2'
                    />
                  </div>
                  <div className='space-y-1'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600 dark:text-gray-400'>
                        Last 6 months
                      </span>
                      <span className='font-bold'>
                        {performanceMetrics.recentActivity.last6Months}
                      </span>
                    </div>
                    <Progress
                      value={
                        (performanceMetrics.recentActivity.last6Months /
                          performanceMetrics.totalReviews) *
                        100
                      }
                      className='h-2'
                    />
                  </div>
                  <div className='space-y-1'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600 dark:text-gray-400'>
                        Last 12 months
                      </span>
                      <span className='font-bold'>
                        {performanceMetrics.recentActivity.last12Months}
                      </span>
                    </div>
                    <Progress
                      value={
                        (performanceMetrics.recentActivity.last12Months /
                          performanceMetrics.totalReviews) *
                        100
                      }
                      className='h-2'
                    />
                  </div>
                </div>
              </div>

              {/* Growth Rate - Enhanced visual */}
              <div className='flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg'>
                <div className='flex items-center gap-2'>
                  <TrendingUp className='w-5 h-5 text-green-500' />
                  <span className='font-bold'>Growth</span>
                </div>
                <div className='text-right'>
                  <div
                    className={`text-2xl font-black ${
                      performanceMetrics.growthRate > 0
                        ? 'text-green-600 dark:text-green-400'
                        : performanceMetrics.growthRate < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {performanceMetrics.growthRate > 0 ? '+' : ''}
                    {performanceMetrics.growthRate.toFixed(1)}%
                  </div>
                  <Badge
                    variant={
                      performanceMetrics.trends.isGrowing
                        ? 'default'
                        : 'secondary'
                    }
                    className='mt-1'
                  >
                    {performanceMetrics.trends.isGrowing
                      ? '📈 Growing'
                      : '📊 Stable'}
                  </Badge>
                </div>
              </div>

              {/* Seasonal Pattern - Enhanced */}
              <div className='p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-bold flex items-center gap-1'>
                    Pattern
                  </span>
                  <Badge
                    className={`${seasonalInfo.bg} ${seasonalInfo.color} font-bold`}
                    variant='secondary'
                  >
                    {seasonalInfo.icon} {seasonalInfo.label}
                  </Badge>
                </div>
                <p className='text-xs text-gray-600 dark:text-gray-400 mt-2'>
                  Peak: {performanceMetrics.peakMonth || 'N/A'}{' '}
                  {performanceMetrics.peakYear}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Rating Distribution Analysis - Enhanced */}
          <Card className='border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group'>
            <div className='h-2 bg-gradient-to-r from-yellow-400 to-amber-500' />
            <CardHeader className='pb-4 bg-gradient-to-b from-yellow-50/50 to-transparent dark:from-yellow-900/10'>
              <CardTitle className='text-lg flex items-center gap-2'>
                <div className='p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 group-hover:scale-110 transition-transform'>
                  <Star className='w-5 h-5 text-yellow-600 dark:text-yellow-400' />
                </div>
                <span className='font-bold'>Rating Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-5'>
              {/* Current Rating - Enhanced */}
              <div className='text-center p-6 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl'>
                <div className='flex items-center justify-center gap-3'>
                  <span className='text-5xl font-black text-yellow-700 dark:text-yellow-300'>
                    {ratingAnalysis.trends.current.toFixed(1)}
                  </span>
                  <div className='flex flex-col items-center'>
                    <Star className='w-8 h-8 fill-yellow-400 text-yellow-400' />
                    <span className='text-2xl mt-1'>
                      {ratingAnalysis.trends.direction === 'up'
                        ? '↗️'
                        : ratingAnalysis.trends.direction === 'down'
                          ? '↘️'
                          : '➡️'}
                    </span>
                  </div>
                </div>
                <p className='text-sm font-semibold text-yellow-600 dark:text-yellow-400 mt-2 flex items-center justify-center gap-1'>
                  Average Rating
                  {Math.abs(ratingAnalysis.trends.change) > 0.1 && (
                    <span
                      className={
                        ratingAnalysis.trends.change > 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }
                    >
                      {` (${ratingAnalysis.trends.change > 0 ? '+' : ''}${ratingAnalysis.trends.change.toFixed(1)})`}
                    </span>
                  )}
                </p>
              </div>

              {/* Rating Distribution - Enhanced with emojis */}
              <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3'>
                <h4 className='text-sm font-bold flex items-center gap-2'>
                  <BarChart3 className='w-4 h-4 text-indigo-500' />
                  Distribution
                </h4>
                {[5, 4, 3, 2, 1].map(rating => {
                  const data = ratingAnalysis.distribution[rating]
                  const starEmoji =
                    rating === 5
                      ? '🌟'
                      : rating === 4
                        ? '⭐'
                        : rating === 3
                          ? '✨'
                          : rating === 2
                            ? '💫'
                            : '⚡'

                  return (
                    <div
                      key={rating}
                      className='group/rating hover:scale-[1.02] transition-transform'
                    >
                      <div className='flex items-center gap-3'>
                        <span className='text-sm font-bold min-w-[40px] flex items-center gap-1'>
                          {starEmoji} {rating}★
                        </span>
                        <div className='flex-1 relative'>
                          <Progress value={data.percentage} className='h-6' />
                          <span className='absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-difference'>
                            {data.count} reviews
                          </span>
                        </div>
                        <span className='text-sm font-bold min-w-[50px] text-right'>
                          {data.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Quality Benchmarks - Enhanced */}
              <div className='space-y-3'>
                <h4 className='text-sm font-bold flex items-center gap-2'>
                  <Target className='w-4 h-4 text-purple-500' />
                  Quality Benchmarks
                </h4>
                <div className='space-y-2'>
                  <div className='p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800'>
                    <div className='flex justify-between items-center'>
                      <span className='font-medium flex items-center gap-2'>
                        <Award className='w-4 h-4 text-green-600 dark:text-green-400' />
                        Excellent (4-5★)
                      </span>
                      <span className='text-xl font-black text-green-700 dark:text-green-300'>
                        {ratingAnalysis.benchmarks.excellent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800'>
                    <div className='flex justify-between items-center'>
                      <span className='font-medium'>Good (3-5★)</span>
                      <span className='text-xl font-black text-blue-700 dark:text-blue-300'>
                        {ratingAnalysis.benchmarks.good.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className='p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-200 dark:border-red-800'>
                    <div className='flex justify-between items-center'>
                      <span className='font-medium'>Needs Work (1-2★)</span>
                      <span className='text-xl font-black text-red-700 dark:text-red-300'>
                        {ratingAnalysis.benchmarks.needsImprovement.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Response Analytics - Enhanced */}
          <Card className='border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group'>
            <div className='h-2 bg-gradient-to-r from-green-400 to-emerald-500' />
            <CardHeader className='pb-4 bg-gradient-to-b from-green-50/50 to-transparent dark:from-green-900/10'>
              <CardTitle className='text-lg flex items-center gap-2'>
                <div className='p-2 rounded-lg bg-green-100 dark:bg-green-900/30 group-hover:scale-110 transition-transform'>
                  <MessageSquare className='w-5 h-5 text-green-600 dark:text-green-400' />
                </div>
                <span className='font-bold'>Response Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-5'>
              {/* Overall Response Rate - Enhanced */}
              <div className='text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl'>
                <div className='flex items-baseline justify-center gap-3'>
                  <span className='text-5xl font-black text-green-700 dark:text-green-300'>
                    {responseAnalytics.responseRate.toFixed(1)}%
                  </span>
                </div>
                <p className='text-sm font-semibold text-green-600 dark:text-green-400 mt-2 flex items-center justify-center gap-1'>
                  Response Rate
                </p>
                <Badge
                  variant={
                    responseAnalytics.responseRate >= 50
                      ? 'default'
                      : 'secondary'
                  }
                  className='mt-3 text-sm font-bold px-4 py-1'
                >
                  {responseAnalytics.responseRate >= 70
                    ? '🏆 Excellent'
                    : responseAnalytics.responseRate >= 50
                      ? '✅ Good'
                      : responseAnalytics.responseRate >= 25
                        ? '⚡ Fair'
                        : '📈 Needs Improvement'}
                </Badge>
              </div>

              {/* Response by Rating - Enhanced */}
              <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3'>
                <h4 className='text-sm font-bold flex items-center gap-2'>
                  <BarChart3 className='w-4 h-4 text-indigo-500' />
                  Response by Rating
                </h4>
                {[1, 2, 3, 4, 5].reverse().map(rating => {
                  const data = responseAnalytics.responsesByRating[rating]
                  if (data.total === 0) return null
                  const starEmoji =
                    rating === 5
                      ? '🌟'
                      : rating === 4
                        ? '⭐'
                        : rating === 3
                          ? '✨'
                          : rating === 2
                            ? '💫'
                            : '⚡'

                  return (
                    <div
                      key={rating}
                      className='group/rating hover:scale-[1.02] transition-transform'
                    >
                      <div className='flex items-center gap-3'>
                        <span className='text-sm font-bold min-w-[40px]'>
                          {starEmoji} {rating}★
                        </span>
                        <div className='flex-1 relative'>
                          <Progress value={data.rate} className='h-6' />
                          <span className='absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-difference'>
                            {data.responded}/{data.total}
                          </span>
                        </div>
                        <span className='text-sm font-bold min-w-[50px] text-right'>
                          {data.rate.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Response Effectiveness - Enhanced */}
              <div className='p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg'>
                <h4 className='text-sm font-bold flex items-center gap-2 mb-3'>
                  <Zap className='w-4 h-4 text-purple-500' />
                  Effectiveness
                </h4>
                <div className='flex items-center justify-between'>
                  <span className='font-medium'>Impact Score</span>
                  <div className='text-right'>
                    <div className='text-2xl font-black text-purple-700 dark:text-purple-300'>
                      {responseAnalytics.responseEffectiveness.customerSatisfactionImpact.toFixed(
                        1,
                      )}
                      /10
                    </div>
                    <div className='flex items-center gap-1 mt-1'>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i <
                            Math.floor(
                              responseAnalytics.responseEffectiveness
                                .customerSatisfactionImpact / 2,
                            )
                              ? 'fill-purple-400 text-purple-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className='text-xs text-gray-600 dark:text-gray-400 mt-3 font-medium'>
                  {responseAnalytics.responseEffectiveness
                    .improvedSubsequentRatings
                    ? '✅ Responses show positive impact on satisfaction'
                    : '💡 Opportunity to improve response quality'}
                </p>
              </div>

              {/* Peak Activity Periods - Enhanced */}
              {performanceMetrics.trends.bestPeriods.length > 0 && (
                <div className='p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                  <h4 className='text-sm font-bold flex items-center gap-2 mb-2'>
                    <Calendar className='w-4 h-4 text-blue-500' />
                    Peak Periods
                  </h4>
                  <div className='flex flex-wrap gap-2'>
                    {performanceMetrics.trends.bestPeriods
                      .slice(0, 3)
                      .map((period, idx) => (
                        <Badge
                          key={idx}
                          variant='secondary'
                          className='bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        >
                          📅 {period}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}

// ============= USAGE EXAMPLE =============
/*
// In your parent component:

import { PerformanceMetricsGrid } from './components/PerformanceMetricsGrid'

// Example data structure:
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

const ratingData: RatingAnalysis = {
  trends: {
    current: 4.5,
    direction: 'up',
    change: 0.3,
  },
  distribution: {
    5: { count: 600, percentage: 48.7 },
    4: { count: 400, percentage: 32.4 },
    3: { count: 150, percentage: 12.2 },
    2: { count: 50, percentage: 4.1 },
    1: { count: 34, percentage: 2.8 },
  },
  benchmarks: {
    excellent: 81.1, // 4-5 stars
    good: 93.3, // 3-5 stars
    needsImprovement: 6.9, // 1-2 stars
  }
}

const responseData: ResponseAnalytics = {
  responseRate: 65.3,
  responsesByRating: {
    5: { total: 600, responded: 350, rate: 58.3 },
    4: { total: 400, responded: 280, rate: 70.0 },
    3: { total: 150, responded: 120, rate: 80.0 },
    2: { total: 50, responded: 45, rate: 90.0 },
    1: { total: 34, responded: 32, rate: 94.1 },
  },
  responseEffectiveness: {
    customerSatisfactionImpact: 7.5,
    improvedSubsequentRatings: true,
  }
}

// Render the component:
<PerformanceMetricsGrid
  performanceMetrics={performanceData}
  ratingAnalysis={ratingData}
  responseAnalytics={responseData}
/>
*/

// ============= ADAPTATION NOTES =============
/*
1. DEPENDENCIES TO INSTALL:
   - @shadcn/ui components: Card, Badge, Progress
   - lucide-react for icons
   - Tailwind CSS

2. DATA CALCULATION:
   - Performance metrics track review counts and trends over time
   - Rating analysis includes distribution and benchmarks
   - Response analytics measure owner engagement
   - All data should be pre-calculated before passing to component

3. CUSTOMIZATION OPTIONS:
   - Rating star emojis: Customize the emoji mapping
   - Benchmark thresholds: Adjust Excellent/Good/Needs Work percentages
   - Colors: Modify gradient classes to match brand
   - Layout: Change from 3-column to 2 or 4 columns
   - Response rate thresholds: Adjust 70/50/25 breakpoints

4. RESPONSIVE DESIGN:
   - Mobile: Single column
   - Tablet (md): 2 columns
   - Desktop (lg): 3 columns

5. ACCESSIBILITY:
   - Uses semantic HTML
   - Color contrast meets WCAG standards
   - Screen reader friendly with proper labels
   - Interactive elements have hover states

6. TOOLTIP INTEGRATION:
   - Replace the ℹ️ emoji placeholders with your actual tooltip component
   - Pass appropriate content for each metric explanation
*/
