import React, { useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Review } from '@/types/reviews'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface VirtualizedReviewListProps {
  reviews: Review[];
  isLoading?: boolean;
  hasMoreData?: boolean;
  onLoadMore?: () => void;
}

/**
 * Virtualized list component for efficiently rendering large numbers of reviews
 * Uses react-virtual for performance optimization
 */
const VirtualizedReviewList: React.FC<VirtualizedReviewListProps> = ({
  reviews,
  isLoading = false,
  hasMoreData = false,
  onLoadMore,
}) => {
  // Create a container ref for the virtualized list
  const parentRef = React.useRef<HTMLDivElement>(null)

  // Setup the virtualizer
  const rowVirtualizer = useVirtualizer({
    count: reviews.length + (hasMoreData ? 1 : 0), // Add an extra row for the load more button
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 180, []), // Estimated height of each row
    overscan: 5, // Number of items to render outside of the visible area
  })

  // Handle intersection for infinite loading
  const lastItemRef = React.useCallback((node: HTMLDivElement | null) => {
    if (node && hasMoreData && !isLoading && onLoadMore) {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore()
        }
      })

      observer.observe(node)
      return () => observer.disconnect()
    }
  }, [hasMoreData, isLoading, onLoadMore])

  // Render stars for ratings
  const renderStars = (rating: number) => {
    return (
      <span className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
          />
        ))}
      </span>
    )
  }

  // Render sentiment indicator
  const renderSentiment = (sentiment: string) => {
    if (!sentiment) return null

    const lowercaseSentiment = sentiment.toLowerCase()
    if (lowercaseSentiment.includes('positive')) {
      return <ThumbsUp size={16} className="text-green-500" />
    } else if (lowercaseSentiment.includes('negative')) {
      return <ThumbsDown size={16} className="text-red-500" />
    }
    return null
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch (error) {
      return 'Unknown date'
    }
  }

  return (
    <div
      ref={parentRef}
      className="overflow-auto border rounded-md"
      style={{ height: 'calc(100vh - 350px)', width: '100%' }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const isLoaderRow = virtualRow.index === reviews.length

          // Render load more button for the last row
          if (isLoaderRow) {
            return (
              <div
                key="loader"
                ref={lastItemRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '80px',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="flex items-center justify-center p-4"
              >
                {isLoading ? (
                  <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                ) : (
                  <button
                    onClick={onLoadMore}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    disabled={isLoading}
                  >
                    Load More
                  </button>
                )}
              </div>
            )
          }

          // Get the review data for this row
          const review = reviews[virtualRow.index]

          // Render the review card
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="p-2"
            >
              <Card className="h-full overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-medium">
                      {review.name || 'Anonymous'}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      {renderStars(review.stars || 0)}
                      {renderSentiment(review.sentiment || '')}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{review.title || 'Unknown Business'}</span>
                    <span>{formatDate(review.publishedAtDate || '')}</span>
                  </div>
                </CardHeader>
                <CardContent className="text-sm overflow-y-auto max-h-[80px]">
                  {review.text || 'No review text provided'}
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default VirtualizedReviewList
