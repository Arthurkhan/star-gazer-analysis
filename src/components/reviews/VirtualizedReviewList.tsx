import React from 'react';
import { useVirtual } from 'react-virtual';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, ThumbsUp, ThumbsDown, Meh } from "lucide-react";
import { Review } from '@/types/reviews';

interface VirtualizedReviewListProps {
  reviews: Review[];
  loading: boolean;
  loadingMore: boolean;
  hasMoreData: boolean;
  onLoadMore: () => void;
}

export const VirtualizedReviewList: React.FC<VirtualizedReviewListProps> = ({ 
  reviews, 
  loading,
  loadingMore,
  hasMoreData,
  onLoadMore
}) => {
  const parentRef = React.useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtual({
    size: reviews.length,
    parentRef,
    estimateSize: React.useCallback(() => 250, []), // Estimated height of each review card
    overscan: 5,
  });

  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="w-full">
            <CardHeader>
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-4 w-1/4" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (!loading && reviews.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>No Reviews Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No reviews were found for the selected business or date range.</p>
        </CardContent>
      </Card>
    );
  }

  // Function to render Star Rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={`w-4 h-4 ${index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Function to render sentiment icon
  const renderSentiment = (sentiment: string) => {
    if (!sentiment) return null;
    const lowerSentiment = sentiment.toLowerCase();
    
    if (lowerSentiment.includes('positive')) {
      return <ThumbsUp className="w-5 h-5 text-green-500" />;
    } else if (lowerSentiment.includes('negative')) {
      return <ThumbsDown className="w-5 h-5 text-red-500" />;
    } else {
      return <Meh className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div>
      <div
        ref={parentRef}
        className="h-[800px] overflow-auto"
      >
        <div
          style={{
            height: `${rowVirtualizer.totalSize}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.virtualItems.map((virtualRow) => {
            const review = reviews[virtualRow.index];
            return (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <Card className="w-full mb-4 h-[230px] overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{review.name || 'Anonymous User'}</CardTitle>
                        <CardDescription>
                          {new Date(review.publishedAtDate).toLocaleDateString()} - {review.title}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStars(review.stars)}
                        {renderSentiment(review.sentiment)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="line-clamp-3 text-sm">
                      {review.text || 'No review text provided.'}
                    </p>
                    {review.responseFromOwnerText && (
                      <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-md">
                        <p className="text-xs font-semibold">Owner Response:</p>
                        <p className="text-xs line-clamp-2">{review.responseFromOwnerText}</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0">
                    <div className="flex flex-wrap gap-1">
                      {review.mainThemes && 
                        review.mainThemes.split(',').map((theme, i) => (
                          <span key={i} className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-950 text-xs rounded-full">
                            {theme.trim()}
                          </span>
                        ))
                      }
                    </div>
                  </CardFooter>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Load More button */}
      {hasMoreData && (
        <div className="flex justify-center mt-4 mb-8">
          <Button 
            onClick={onLoadMore}
            disabled={loadingMore}
            variant="outline"
          >
            {loadingMore ? 'Loading...' : 'Load More Reviews'}
          </Button>
        </div>
      )}
    </div>
  );
};
