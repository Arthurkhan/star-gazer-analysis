import React, { memo, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Review } from '@/types/reviews';

export interface VirtualizedReviewListProps {
  reviews: Review[];
  height: number;
  itemHeight: number;
  onReviewClick?: (review: Review) => void;
  renderReview: (review: Review, index: number) => React.ReactElement;
  className?: string;
  overscanCount?: number;
}

interface ReviewItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    reviews: Review[];
    onReviewClick?: (review: Review) => void;
    renderReview: (review: Review, index: number) => React.ReactElement;
  };
}

// Memoized item renderer to prevent unnecessary re-renders
const ReviewItem = memo<ReviewItemProps>(({ index, style, data }) => {
  const { reviews, renderReview } = data;
  const review = reviews[index];
  
  if (!review) {
    return <div style={style}>Loading...</div>;
  }
  
  return (
    <div style={style}>
      {renderReview(review, index)}
    </div>
  );
});

ReviewItem.displayName = 'ReviewItem';

/**
 * Virtualized list component for efficiently rendering large numbers of reviews
 * Uses react-window for optimal performance with thousands of items
 */
export const VirtualizedReviewList = memo<VirtualizedReviewListProps>(({
  reviews,
  height,
  itemHeight,
  onReviewClick,
  renderReview,
  className = '',
  overscanCount = 5,
}) => {
  // Memoize the data object to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    reviews,
    onReviewClick,
    renderReview,
  }), [reviews, onReviewClick, renderReview]);
  
  if (reviews.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-muted-foreground">No reviews found</p>
      </div>
    );
  }
  
  return (
    <div className={className}>
      <List
        height={height}
        itemCount={reviews.length}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={overscanCount}
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      >
        {ReviewItem}
      </List>
    </div>
  );
});

VirtualizedReviewList.displayName = 'VirtualizedReviewList';

/**
 * Hook for calculating optimal item height based on content
 */
export const useOptimalItemHeight = (
  baseHeight: number = 120,
  hasLongText: boolean = false,
  hasImages: boolean = false
) => {
  return useMemo(() => {
    let height = baseHeight;
    
    if (hasLongText) {
      height += 40; // Extra space for longer review text
    }
    
    if (hasImages) {
      height += 60; // Extra space for images
    }
    
    return height;
  }, [baseHeight, hasLongText, hasImages]);
};

/**
 * Hook for managing virtualized list state and performance
 */
export const useVirtualizedListState = (
  reviews: Review[],
  initialItemHeight: number = 120
) => {
  const [scrollOffset, setScrollOffset] = React.useState(0);
  const [isScrolling, setIsScrolling] = React.useState(false);
  
  // Calculate dynamic item height based on review content
  const itemHeight = useOptimalItemHeight(
    initialItemHeight,
    reviews.some(review => review.text && review.text.length > 200),
    false // Assuming no images for now
  );
  
  // Handle scroll events with throttling
  const handleScroll = React.useCallback((scrollTop: number) => {
    setScrollOffset(scrollTop);
  }, []);
  
  const handleScrollStart = React.useCallback(() => {
    setIsScrolling(true);
  }, []);
  
  const handleScrollStop = React.useCallback(() => {
    setIsScrolling(false);
  }, []);
  
  return {
    itemHeight,
    scrollOffset,
    isScrolling,
    handleScroll,
    handleScrollStart,
    handleScrollStop,
  };
};
