import { Card, CardContent } from '@/components/ui/card'
import type { Review } from '@/types/reviews'
import { TrendingUp, TrendingDown, Star, MessageSquare, Users, Calendar } from 'lucide-react'
import { useMemo } from 'react'

interface OverviewSectionProps {
  reviews: Review[];
  selectedBusiness: string;
}

const OverviewSection = ({ reviews, selectedBusiness }: OverviewSectionProps) => {
  const stats = useMemo(() => {
    if (!reviews.length) {
      return {
        totalReviews: 0,
        avgRating: 0,
        responseRate: 0,
        recentReviews: 0,
        ratingTrend: 0,
        mostRecentDate: null,
      }
    }

    const totalReviews = reviews.length
    const totalRating = reviews.reduce((sum, review) => sum + review.stars, 0)
    const avgRating = totalRating / totalReviews

    const reviewsWithResponse = reviews.filter(
      (review) => review.responseFromOwnerText && review.responseFromOwnerText.trim() !== '',
    ).length
    const responseRate = (reviewsWithResponse / totalReviews) * 100

    // Calculate recent reviews (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentReviews = reviews.filter(
      (review) => new Date(review.publishedAtDate) >= thirtyDaysAgo,
    ).length

    // Calculate rating trend (compare last 30 days avg to overall avg)
    const recentReviewsList = reviews.filter(
      (review) => new Date(review.publishedAtDate) >= thirtyDaysAgo,
    )
    const recentAvgRating = recentReviewsList.length > 0
      ? recentReviewsList.reduce((sum, review) => sum + review.stars, 0) / recentReviewsList.length
      : avgRating
    const ratingTrend = recentAvgRating - avgRating

    // Get most recent review date
    const sortedReviews = [...reviews].sort(
      (a, b) => new Date(b.publishedAtDate).getTime() - new Date(a.publishedAtDate).getTime(),
    )
    const mostRecentDate = sortedReviews[0]?.publishedAtDate

    return {
      totalReviews,
      avgRating,
      responseRate,
      recentReviews,
      ratingTrend,
      mostRecentDate,
    }
  }, [reviews])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  const statCards = [
    {
      title: 'Total Reviews',
      value: stats.totalReviews,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: 'Average Rating',
      value: stats.avgRating.toFixed(1),
      icon: Star,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      suffix: (
        <div className="flex items-center mt-1">
          {stats.ratingTrend > 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400 mr-1" />
          ) : stats.ratingTrend < 0 ? (
            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400 mr-1" />
          ) : null}
          {stats.ratingTrend !== 0 && (
            <span className={`text-xs ${stats.ratingTrend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {stats.ratingTrend > 0 ? '+' : ''}{stats.ratingTrend.toFixed(1)}
            </span>
          )}
        </div>
      ),
    },
    {
      title: 'Response Rate',
      value: `${stats.responseRate.toFixed(0)}%`,
      icon: MessageSquare,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      title: 'Recent Reviews',
      value: stats.recentReviews,
      icon: Calendar,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      subtitle: 'Last 30 days',
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          {selectedBusiness === 'all' ? 'All Businesses Overview' : selectedBusiness}
        </h2>
        {stats.mostRecentDate && (
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Last review: {formatDate(stats.mostRecentDate)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="shadow-sm hover:shadow-md transition-shadow duration-200 border-0 dark:bg-gray-800">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {stat.title}
                    </p>
                    <div className="flex items-baseline">
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                    </div>
                    {stat.subtitle && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {stat.subtitle}
                      </p>
                    )}
                    {stat.suffix}
                  </div>
                  <div className={`p-2 sm:p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick insights for mobile */}
      <div className="sm:hidden">
        {stats.ratingTrend > 0.2 && (
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm">
            <p className="text-green-800 dark:text-green-200 font-medium">
              📈 Ratings are trending up!
            </p>
          </div>
        )}
        {stats.responseRate < 50 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-sm mt-2">
            <p className="text-yellow-800 dark:text-yellow-200 font-medium">
              💬 Consider responding to more reviews
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default OverviewSection
