
import React from 'react'
import type { Review } from '@/types/reviews'
import { analyzeReviewSentiment_sync } from '@/utils/dataUtils'

interface SentimentBreakdownProps {
  reviews: Review[];
  loading: boolean;
}

// Colors for sentiment categories
const SENTIMENT_COLORS = {
  'Positive': '#10B981',
  'Neutral': '#6B7280',
  'Negative': '#EF4444',
}

const SentimentBreakdown: React.FC<SentimentBreakdownProps> = ({ reviews, loading }) => {
  const totalReviews = reviews.length
  const sentimentData = analyzeReviewSentiment_sync(reviews)

  return (
    <div>
      <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
        Sentiment Breakdown {loading && <span className="text-sm font-normal text-gray-500">(AI-enhanced)</span>}
      </h3>
      <div className="grid grid-cols-3 gap-4">
        {sentimentData.map((entry) => {
          const percentage = ((entry.value / totalReviews) * 100).toFixed(1)
          return (
            <div
              key={entry.name}
              className="flex flex-col items-center p-4 rounded-lg border dark:border-gray-700 transition-all duration-300 hover:shadow-md"
              style={{
                borderLeft: `4px solid ${SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS]}`,
                backgroundColor: `${SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS]}10`,
              }}
            >
              <div
                className="w-4 h-4 rounded-sm mb-2"
                style={{ backgroundColor: SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS] }}
              />
              <div className="font-medium text-lg">{entry.name}</div>
              <div className="text-2xl font-bold">{entry.value}</div>
              <div className="text-gray-500 dark:text-gray-400">{percentage}%</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SentimentBreakdown
