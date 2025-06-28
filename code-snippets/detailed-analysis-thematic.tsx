/**
 * Star-Gazer Analysis - Thematic Analysis Component
 * 
 * This component visualizes the key themes and topics extracted from customer reviews.
 * It provides a comprehensive analysis of what customers are talking about most frequently,
 * trending topics, and areas that need attention.
 * 
 * Features:
 * - Top Categories: Most frequently mentioned themes with sentiment analysis
 * - Trending Topics: Topics with increasing or decreasing mention frequency
 * - Attention Areas: Themes associated with negative sentiment requiring action
 * - Visual indicators for sentiment (positive/negative/neutral)
 * - Trend indicators (rising/declining/stable)
 * - Urgency levels (high/medium/low)
 * - Interactive cards with hover effects
 * - Responsive 3-column grid layout
 * - Dark mode support
 * - Gradient backgrounds and visual enhancements
 * - Emoji indicators for better engagement
 * - Priority badges and labels
 * 
 * Dependencies:
 * - @/components/ui/card: Card components from shadcn/ui
 * - @/components/ui/badge: Badge component for labels
 * - lucide-react: Icon library for visual elements
 * 
 * Adaptation Instructions:
 * 1. Install required dependencies:
 *    - npm install lucide-react
 *    - Ensure shadcn/ui Card and Badge components are installed
 * 2. Replace '@/components/ui/*' paths with your actual UI component paths
 * 3. Integrate with your data analysis pipeline to provide ThematicAnalysis data
 * 4. Customize styling and gradients to match your brand
 * 5. Adjust the number of items displayed (currently limited to 6 per section)
 * 6. Modify urgency thresholds based on your business needs
 * 
 * Example Usage:
 * ```tsx
 * <ThematicAnalysisSection thematicAnalysis={analysisData.thematicAnalysis} />
 * ```
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Tags, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Star, 
  Sparkles, 
  Hash, 
  Flame, 
  Shield,
  Minus 
} from 'lucide-react'

// Type Definitions
interface TopCategory {
  category: string;
  count: number;
  percentage: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  averageRating: number;
}

interface TrendingTopic {
  topic: string;
  count: number;
  recentMentions: number;
  trend: 'rising' | 'declining' | 'stable';
}

interface AttentionArea {
  theme: string;
  negativeCount: number;
  averageRating: number;
  urgency: 'high' | 'medium' | 'low';
}

interface ThematicAnalysis {
  topCategories: TopCategory[];
  trendingTopics: TrendingTopic[];
  attentionAreas: AttentionArea[];
}

interface ThematicAnalysisSectionProps {
  thematicAnalysis: ThematicAnalysis;
}

export const ThematicAnalysisSection: React.FC<ThematicAnalysisSectionProps> = ({
  thematicAnalysis,
}) => {
  const { topCategories, trendingTopics, attentionAreas } = thematicAnalysis

  // Helper to get sentiment styling with enhanced visuals
  const getSentimentStyle = (sentiment: 'positive' | 'negative' | 'neutral') => {
    switch (sentiment) {
      case 'positive':
        return {
          color: 'text-green-700 dark:text-green-300',
          bg: 'bg-green-100 dark:bg-green-900/30',
          border: 'border-green-200 dark:border-green-800',
          icon: '✅',
          gradient: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
        }
      case 'negative':
        return {
          color: 'text-red-700 dark:text-red-300',
          bg: 'bg-red-100 dark:bg-red-900/30',
          border: 'border-red-200 dark:border-red-800',
          icon: '❌',
          gradient: 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20',
        }
      default:
        return {
          color: 'text-gray-700 dark:text-gray-300',
          bg: 'bg-gray-100 dark:bg-gray-900/30',
          border: 'border-gray-200 dark:border-gray-800',
          icon: '➖',
          gradient: 'from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20',
        }
    }
  }

  // Helper to get trend styling
  const getTrendStyle = (trend: 'rising' | 'declining' | 'stable') => {
    switch (trend) {
      case 'rising':
        return {
          icon: TrendingUp,
          color: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-100 dark:bg-green-900/30',
          label: '🔥 Rising',
          gradient: 'from-green-400 to-emerald-500',
        }
      case 'declining':
        return {
          icon: TrendingDown,
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-100 dark:bg-red-900/30',
          label: '📉 Declining',
          gradient: 'from-red-400 to-rose-500',
        }
      default:
        return {
          icon: Minus,
          color: 'text-gray-600 dark:text-gray-400',
          bg: 'bg-gray-100 dark:bg-gray-900/30',
          label: '➡️ Stable',
          gradient: 'from-gray-400 to-slate-500',
        }
    }
  }

  // Helper to get urgency styling
  const getUrgencyStyle = (urgency: 'high' | 'medium' | 'low') => {
    switch (urgency) {
      case 'high':
        return {
          bg: 'bg-red-100 dark:bg-red-900/30',
          color: 'text-red-700 dark:text-red-300',
          border: 'border-red-300 dark:border-red-700',
          icon: '🚨',
          label: 'High Priority',
        }
      case 'medium':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/30',
          color: 'text-yellow-700 dark:text-yellow-300',
          border: 'border-yellow-300 dark:border-yellow-700',
          icon: '⚠️',
          label: 'Medium Priority',
        }
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-900/30',
          color: 'text-gray-700 dark:text-gray-300',
          border: 'border-gray-300 dark:border-gray-700',
          icon: 'ℹ️',
          label: 'Low Priority',
        }
    }
  }

  return (
    <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-b">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
            <Tags className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <span className="font-bold">Thematic Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Top Categories - Enhanced */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Hash className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              <h3 className="font-bold text-lg">Top Categories</h3>
            </div>
            {topCategories.length > 0 ? (
              <div className="space-y-3">
                {topCategories.slice(0, 6).map((category, index) => {
                  const sentimentStyle = getSentimentStyle(category.sentiment)

                  return (
                    <div
                      key={category.category}
                      className={`p-4 rounded-xl bg-gradient-to-r ${sentimentStyle.gradient} border-2 ${sentimentStyle.border} hover:shadow-md transition-all duration-300`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="bg-white/50 dark:bg-gray-800/50 font-bold">
                              #{index + 1}
                            </Badge>
                            <span className="font-bold text-gray-800 dark:text-gray-200">
                              {category.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="font-semibold">{category.count} mentions</span>
                            <span className="text-gray-600 dark:text-gray-400">({category.percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge
                            variant="secondary"
                            className={`${sentimentStyle.bg} ${sentimentStyle.color} font-bold`}
                          >
                            {sentimentStyle.icon} {category.sentiment}
                          </Badge>
                          {category.averageRating > 0 && (
                            <div className="flex items-center gap-1 text-sm font-semibold">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span>{category.averageRating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <Tags className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="font-medium text-gray-600 dark:text-gray-400">No thematic data available</p>
              </div>
            )}
          </div>

          {/* Trending Topics - Enhanced */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h3 className="font-bold text-lg">Trending Topics</h3>
            </div>
            {trendingTopics.length > 0 ? (
              <div className="space-y-3">
                {trendingTopics.slice(0, 6).map((topic) => {
                  const trendStyle = getTrendStyle(topic.trend)
                  const TrendIcon = trendStyle.icon

                  return (
                    <div
                      key={topic.topic}
                      className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">
                            {topic.topic}
                          </h4>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-semibold">{topic.count} total</span>
                            <span className="text-orange-600 dark:text-orange-400 font-bold">
                              🔥 {topic.recentMentions} recent
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${trendStyle.bg}`}>
                            <TrendIcon className={`w-4 h-4 ${trendStyle.color}`} />
                            <span className={`text-sm font-bold ${trendStyle.color}`}>
                              {trendStyle.label}
                            </span>
                          </div>
                          {topic.trend === 'rising' && (
                            <div className={`h-1 w-16 rounded-full bg-gradient-to-r ${trendStyle.gradient}`} />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="font-medium text-gray-600 dark:text-gray-400">No trending topics detected</p>
              </div>
            )}
          </div>

          {/* Attention Areas - Enhanced */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h3 className="font-bold text-lg">Areas Needing Attention</h3>
            </div>
            {attentionAreas.length > 0 ? (
              <div className="space-y-3">
                {attentionAreas.slice(0, 6).map((area) => {
                  const urgencyStyle = getUrgencyStyle(area.urgency)

                  return (
                    <div
                      key={area.theme}
                      className={`p-4 rounded-xl border-2 ${urgencyStyle.border} ${urgencyStyle.bg} hover:shadow-md transition-all duration-300`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">
                            {area.theme}
                          </h4>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="font-semibold text-red-600 dark:text-red-400">
                              {area.negativeCount} issues
                            </span>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{area.averageRating.toFixed(1)} avg</span>
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={area.urgency === 'high' ? 'destructive' : 'secondary'}
                          className={`${urgencyStyle.bg} ${urgencyStyle.color} font-bold border ${urgencyStyle.border}`}
                        >
                          {urgencyStyle.icon} {urgencyStyle.label}
                        </Badge>
                      </div>
                      {area.urgency === 'high' && (
                        <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <p className="text-xs font-medium text-red-700 dark:text-red-300">
                            ⚡ Immediate action recommended
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p className="font-bold text-green-700 dark:text-green-300 text-lg">All Clear!</p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">Great job maintaining quality!</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Sample data for testing
const sampleThematicAnalysis: ThematicAnalysis = {
  topCategories: [
    {
      category: "Coffee Quality",
      count: 156,
      percentage: 23.5,
      sentiment: "positive",
      averageRating: 4.5
    },
    {
      category: "Service Speed",
      count: 98,
      percentage: 14.8,
      sentiment: "negative",
      averageRating: 2.8
    },
    {
      category: "Atmosphere",
      count: 87,
      percentage: 13.1,
      sentiment: "positive",
      averageRating: 4.7
    },
    {
      category: "Pricing",
      count: 76,
      percentage: 11.5,
      sentiment: "neutral",
      averageRating: 3.5
    },
    {
      category: "Food Menu",
      count: 65,
      percentage: 9.8,
      sentiment: "positive",
      averageRating: 4.2
    },
    {
      category: "Parking",
      count: 43,
      percentage: 6.5,
      sentiment: "negative",
      averageRating: 2.3
    }
  ],
  trendingTopics: [
    {
      topic: "New Espresso Blend",
      count: 45,
      recentMentions: 38,
      trend: "rising"
    },
    {
      topic: "Live Music Events",
      count: 32,
      recentMentions: 28,
      trend: "rising"
    },
    {
      topic: "WiFi Quality",
      count: 67,
      recentMentions: 15,
      trend: "declining"
    },
    {
      topic: "Vegan Options",
      count: 29,
      recentMentions: 22,
      trend: "rising"
    },
    {
      topic: "Weekend Crowds",
      count: 41,
      recentMentions: 41,
      trend: "stable"
    }
  ],
  attentionAreas: [
    {
      theme: "Wait Times",
      negativeCount: 42,
      averageRating: 2.3,
      urgency: "high"
    },
    {
      theme: "Cleanliness",
      negativeCount: 28,
      averageRating: 2.8,
      urgency: "medium"
    },
    {
      theme: "Noise Levels",
      negativeCount: 15,
      averageRating: 3.1,
      urgency: "low"
    },
    {
      theme: "Payment Issues",
      negativeCount: 8,
      averageRating: 2.5,
      urgency: "medium"
    }
  ]
}

// Example usage component
export const ThematicAnalysisExample: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
        Thematic Analysis Example
      </h1>
      <ThematicAnalysisSection thematicAnalysis={sampleThematicAnalysis} />
    </div>
  )
}
