import React from 'react';
import { Review } from '@/types/reviews';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ReviewsGridProps {
  reviews: Review[];
}

/**
 * Simple Reviews Grid - Phase 4 Replacement for VirtualizedReviewList
 * Optimized for small datasets without virtualization complexity
 */
export const ReviewsGrid: React.FC<ReviewsGridProps> = ({ reviews }) => {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        No reviews to display
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {reviews.map((review, index) => (
        <Card key={review.id || index} className="h-fit">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-sm ${
                      star <= (review.stars || 0) ? 'text-yellow-500' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <Badge variant="outline" className="text-xs">
                {review.businessName || review.title}
              </Badge>
            </div>
            <p className="text-sm text-gray-700 line-clamp-4 mb-2">
              {review.text || review.textTranslated || 'No review text'}
            </p>
            <div className="text-xs text-gray-500">
              {review.name && <span className="font-medium">{review.name}</span>}
              {review.publishedAtDate && (
                <span className="ml-2">
                  {new Date(review.publishedAtDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};