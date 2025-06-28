/**
 * Customer Sentiment Analysis Component
 * 
 * A comprehensive sentiment analysis component that visualizes customer emotions from reviews.
 * Part of the Star-Gazer-Analysis project's reusable components.
 * 
 * Features:
 * - Sentiment distribution visualization (positive, neutral, negative)
 * - Overall sentiment score with visual indicators
 * - Sentiment trends over time with period comparisons
 * - Rating correlation analysis (high vs low ratings)
 * - Interactive progress bars with animations
 * - Responsive grid layout (desktop/mobile)
 * - Dark mode support
 * - Gradient-based visual styling
 * - Emoji indicators for sentiment types
 * 
 * Dependencies:
 * - React
 * - lucide-react (for icons)
 * - shadcn/ui components (Card, Badge, Progress)
 * - Tailwind CSS for styling
 * 
 * Customization:
 * - Modify sentiment colors in getSentimentInfo()
 * - Adjust score thresholds in getSentimentScoreAppearance()
 * - Configure trend display count (currently shows last 4 periods)
 * - Customize gradient colors for visual appeal
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Heart, Meh, Frown, TrendingUp, TrendingDown, Smile, BarChart2, Sparkles } from 'lucide-react'

// Type definitions for the sentiment analysis data structure
interface SentimentDistribution {
  positive: {
    count: number;
    percentage: number;
  };
  neutral: {
    count: number;
    percentage: number;
  };
  negative: {
    count: number;
    percentage: number;
  };
}

interface SentimentTrend {
  period: string;
  positive: number;
  neutral: number;
  negative: number;
}

interface SentimentCorrelation {
  highRating: {
    positive: number;
    negative: number;
  };
  lowRating: {
    positive: number;
    negative: number;
  };
}

interface SentimentAnalysis {
  distribution: SentimentDistribution;
  trends: SentimentTrend[];
  correlationWithRating: SentimentCorrelation;
}

interface SentimentAnalysisSectionProps {
  sentimentAnalysis: SentimentAnalysis;
}

export const SentimentAnalysisSection: React.FC<SentimentAnalysisSectionProps> = ({
  sentimentAnalysis,
}) => {
  const { distribution, trends, correlationWithRating } = sentimentAnalysis

  // Helper to get sentiment icon and colors with enhanced styling
  const getSentimentInfo = (type: 'positive' | 'neutral' | 'negative') => {
    switch (type) {
      case 'positive':
        return {
          icon: Smile,
          color: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-100 dark:bg-green-900/30',
          progressColor: 'bg-gradient-to-r from-green-400 to-emerald-500',
          borderColor: 'border-green-200 dark:border-green-800',
          label: 'Positive',
          emoji: '😊',
        }
      case 'neutral':
        return {
          icon: Meh,
          color: 'text-yellow-600 dark:text-yellow-400',
          bg: 'bg-yellow-100 dark:bg-yellow-900/30',
          progressColor: 'bg-gradient-to-r from-yellow-400 to-amber-500',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          label: 'Neutral',
          emoji: '😐',
        }
      case 'negative':
        return {
          icon: Frown,
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-100 dark:bg-red-900/30',
          progressColor: 'bg-gradient-to-r from-red-400 to-rose-500',
          borderColor: 'border-red-200 dark:border-red-800',
          label: 'Negative',
          emoji: '😞',
        }
    }
  }

  // Calculate sentiment score appearance
  const getSentimentScoreAppearance = (score: number) => {
    if (score >= 80) return { gradient: 'from-green-500 to-emerald-500', emoji: '🎉' }
    if (score >= 60) return { gradient: 'from-blue-500 to-cyan-500', emoji: '👍' }
    if (score >= 40) return { gradient: 'from-yellow-500 to-orange-500', emoji: '🤔' }
    return { gradient: 'from-red-500 to-rose-500', emoji: '⚠️' }
  }

  const scoreAppearance = getSentimentScoreAppearance(distribution.positive.percentage)

  return (
    <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
            <Heart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <span className="font-bold">Customer Sentiment Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Current Sentiment Distribution - Enhanced */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Current Sentiment Distribution</h3>
              <Badge variant="outline" className="font-semibold">
                {distribution.positive.count + distribution.neutral.count + distribution.negative.count} Reviews
              </Badge>
            </div>

            {(['positive', 'neutral', 'negative'] as const).map(sentiment => {
              const data = distribution[sentiment]
              const info = getSentimentInfo(sentiment)
              const Icon = info.icon

              return (
                <div key={sentiment} className={`space-y-3 p-4 rounded-xl ${info.bg} border-2 ${info.borderColor} hover:shadow-md transition-all duration-300`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${info.bg} flex items-center justify-center shadow-sm`}>
                        <Icon className={`w-6 h-6 ${info.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg capitalize">{sentiment}</span>
                          <span className="text-2xl">{info.emoji}</span>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">
                          {data.count} reviews
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black">{data.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${info.progressColor} transition-all duration-700 ease-out`}
                        style={{ width: `${data.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Overall Sentiment Score - Enhanced */}
            <div className={`mt-6 p-6 rounded-2xl bg-gradient-to-r ${scoreAppearance.gradient} text-white shadow-xl`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-lg opacity-90">Overall Sentiment Score</h4>
                  <p className="text-sm opacity-80 mt-1">Based on all customer reviews</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{scoreAppearance.emoji}</span>
                    <div>
                      <div className="text-4xl font-black">
                        {distribution.positive.percentage.toFixed(1)}%
                      </div>
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30 font-bold">
                        {distribution.positive.percentage >= 80 ? 'Excellent' :
                         distribution.positive.percentage >= 60 ? 'Good' :
                         distribution.positive.percentage >= 40 ? 'Fair' : 'Needs Attention'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sentiment Trends - Enhanced */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <BarChart2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-bold text-lg">Sentiment Trends Over Time</h3>
            </div>

            {trends.length > 0 ? (
              <div className="space-y-4">
                {trends.slice(-4).map((trend, index) => {
                  const prevTrend = index > 0 ? trends[trends.length - 4 + index - 1] : null
                  const positiveDiff = prevTrend ? trend.positive - prevTrend.positive : 0

                  return (
                    <div key={trend.period} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-gray-700 dark:text-gray-300">{trend.period}</span>
                        <div className="flex items-center gap-3">
                          {prevTrend && (
                            <div className="flex items-center gap-1">
                              {positiveDiff > 0 ? (
                                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                  <TrendingUp className="w-4 h-4" />
                                  <span className="text-sm font-semibold">+{positiveDiff.toFixed(1)}%</span>
                                </div>
                              ) : positiveDiff < 0 ? (
                                <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                  <TrendingDown className="w-4 h-4" />
                                  <span className="text-sm font-semibold">{positiveDiff.toFixed(1)}%</span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">No change</span>
                              )}
                            </div>
                          )}
                          <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 font-bold">
                            {trend.positive}% Positive
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                        <div
                          className="bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
                          style={{ width: `${trend.positive}%` }}
                        />
                        <div
                          className="bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-500"
                          style={{ width: `${trend.neutral}%` }}
                        />
                        <div
                          className="bg-gradient-to-r from-red-400 to-rose-500 transition-all duration-500"
                          style={{ width: `${trend.negative}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>😊 {trend.positive}%</span>
                        <span>😐 {trend.neutral}%</span>
                        <span>😞 {trend.negative}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">Not enough data for trend analysis</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Trends will appear with more review data over time</p>
              </div>
            )}
          </div>
        </div>

        {/* Rating Correlation Analysis - Enhanced */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Sentiment vs Rating Correlation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* High Ratings Sentiment - Enhanced */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-green-400 to-emerald-500" />
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>High Ratings</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    4-5 ⭐
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="font-medium">Positive Sentiment:</span>
                    <span className="font-bold text-xl text-green-600 dark:text-green-400">
                      {correlationWithRating.highRating.positive}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <span className="font-medium">Negative Sentiment:</span>
                    <span className="font-bold text-xl text-red-600 dark:text-red-400">
                      {correlationWithRating.highRating.negative}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {correlationWithRating.highRating.positive > correlationWithRating.highRating.negative * 3
                        ? '✅ Strong positive correlation'
                        : '📊 Moderate correlation'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      High ratings align well with positive sentiment
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Low Ratings Sentiment - Enhanced */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-red-400 to-rose-500" />
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>Low Ratings</span>
                  <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                    1-2 ⭐
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="font-medium">Positive Sentiment:</span>
                    <span className="font-bold text-xl text-green-600 dark:text-green-400">
                      {correlationWithRating.lowRating.positive}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <span className="font-medium">Negative Sentiment:</span>
                    <span className="font-bold text-xl text-red-600 dark:text-red-400">
                      {correlationWithRating.lowRating.negative}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {correlationWithRating.lowRating.negative > correlationWithRating.lowRating.positive * 2
                        ? '❌ Strong negative correlation'
                        : '⚡ Mixed sentiment in low ratings'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Low ratings show expected negative sentiment
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Example usage with sample data
const sampleSentimentData: SentimentAnalysis = {
  distribution: {
    positive: { count: 423, percentage: 72.3 },
    neutral: { count: 98, percentage: 16.8 },
    negative: { count: 64, percentage: 10.9 }
  },
  trends: [
    { period: 'Jan 2024', positive: 65, neutral: 20, negative: 15 },
    { period: 'Feb 2024', positive: 68, neutral: 19, negative: 13 },
    { period: 'Mar 2024', positive: 71, neutral: 18, negative: 11 },
    { period: 'Apr 2024', positive: 72.3, neutral: 16.8, negative: 10.9 }
  ],
  correlationWithRating: {
    highRating: { positive: 89, negative: 11 },
    lowRating: { positive: 15, negative: 85 }
  }
}

// Example implementation
export const SentimentAnalysisExample = () => {
  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <SentimentAnalysisSection sentimentAnalysis={sampleSentimentData} />
      </div>
    </div>
  )
}
