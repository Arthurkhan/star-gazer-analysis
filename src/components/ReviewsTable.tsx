import React, { useMemo, useState } from 'react';
import { Review } from '@/types/reviews';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ReviewsTableProps {
  reviews: Review[];
}

type SortField = 'date' | 'rating' | 'business';
type SortDirection = 'asc' | 'desc';

/**
 * Simplified Reviews Table - Phase 4 
 * No pagination, simple sorting, optimized for small datasets
 */
const ReviewsTable: React.FC<ReviewsTableProps> = ({ reviews }) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedReviews = useMemo(() => {
    const sorted = [...reviews].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'date':
          aValue = new Date(a.publishedAtDate || a.publishedatdate || 0);
          bValue = new Date(b.publishedAtDate || b.publishedatdate || 0);
          break;
        case 'rating':
          aValue = a.stars || 0;
          bValue = b.stars || 0;
          break;
        case 'business':
          aValue = a.businessName || a.title || '';
          bValue = b.businessName || b.title || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [reviews, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => toggleSort(field)}
      className="h-auto p-1 font-medium"
    >
      {children}
      {sortField === field && (
        sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
      )}
    </Button>
  );

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500 border rounded-lg">
        No reviews to display
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 rounded-lg text-sm font-medium">
        <div className="col-span-2">
          <SortButton field="business">Business</SortButton>
        </div>
        <div className="col-span-1">
          <SortButton field="rating">Rating</SortButton>
        </div>
        <div className="col-span-6">Review</div>
        <div className="col-span-2">
          <SortButton field="date">Date</SortButton>
        </div>
        <div className="col-span-1">Customer</div>
      </div>

      {/* Reviews */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sortedReviews.map((review, index) => (
          <div key={review.id || index} className="grid grid-cols-12 gap-4 p-3 border rounded-lg hover:bg-gray-50">
            <div className="col-span-2">
              <Badge variant="outline" className="text-xs">
                {review.businessName || review.title || 'Unknown'}
              </Badge>
            </div>
            <div className="col-span-1">
              <div className="flex items-center">
                <span className="text-sm font-medium">{review.stars || 0}</span>
                <span className="text-yellow-500 ml-1">★</span>
              </div>
            </div>
            <div className="col-span-6">
              <p className="text-sm text-gray-700 line-clamp-2">
                {review.text || review.textTranslated || 'No review text'}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-gray-500">
                {review.publishedAtDate
                  ? new Date(review.publishedAtDate).toLocaleDateString()
                  : 'Unknown date'}
              </span>
            </div>
            <div className="col-span-1">
              <span className="text-xs text-gray-500 truncate">
                {review.name || 'Anonymous'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="text-sm text-gray-500 text-center">
        Showing {sortedReviews.length} reviews
      </div>
    </div>
  );
};

export default ReviewsTable;