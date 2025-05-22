import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Review } from "@/types/reviews";
import { 
  calculateAverageRating, 
  countReviewsByRating,
  groupReviewsByMonth,
  calculateMonthlyComparison
} from "@/utils/dataUtils";
import ReviewsChart from "@/components/ReviewsChart";
import { Button } from "@/components/ui/button";
import { Loader, RefreshCw } from "lucide-react";

interface OverviewSectionProps {
  reviews: Review[];
  totalReviewCount?: number; // Total count from database
  loadingMore?: boolean;
  onLoadMore?: () => void;
  hasMoreData?: boolean;
}

const OverviewSection = ({ 
  reviews, 
  totalReviewCount, 
  loadingMore, 
  onLoadMore, 
  hasMoreData 
}: OverviewSectionProps) => {
  const displayedReviews = reviews.length;
  const totalReviews = totalReviewCount || displayedReviews;
  const averageRating = calculateAverageRating(reviews);
  const reviewsByRating = countReviewsByRating(reviews);
  const monthlyData = groupReviewsByMonth(reviews);
  const monthlyComparison = calculateMonthlyComparison(reviews);
  
  const fiveStars = reviewsByRating[5] || 0;
  const fiveStarPercentage = displayedReviews > 0 
    ? Math.round((fiveStars / displayedReviews) * 100) 
    : 0;
  
  const loadPercentage = totalReviews > 0 
    ? Math.round((displayedReviews / totalReviews) * 100)
    : 100;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <Card className="shadow-md border-0 dark:bg-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-md font-medium">Total Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalReviews}</div>
          <p className="text-xs text-gray-500 mt-1">
            {displayedReviews < totalReviews ? (
              <span className="text-blue-500">{displayedReviews} loaded (showing {loadPercentage}%)</span>
            ) : (
              monthlyComparison.vsLastMonth > 0 
                ? `+${monthlyComparison.vsLastMonth} from last month` 
                : monthlyComparison.vsLastMonth < 0 
                  ? `${monthlyComparison.vsLastMonth} from last month`
                  : `Same as last month`
            )}
          </p>
          
          {/* Load All Reviews Button - only show when partial data is loaded */}
          {displayedReviews < totalReviews && hasMoreData && onLoadMore && (
            <Button 
              onClick={onLoadMore} 
              disabled={loadingMore}
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              {loadingMore ? (
                <>
                  <Loader className="mr-2 h-3 w-3 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Load All Reviews
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
      
      <Card className="shadow-md border-0 dark:bg-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-md font-medium">Average Rating</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
          <div className="text-sm text-gray-500 mt-1">
            {fiveStarPercentage}% 5-star reviews
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-md border-0 dark:bg-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-md font-medium">Review Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(star => (
              <div key={star} className="flex items-center gap-2">
                <div className="text-xs min-w-[1.5rem]">{star}★</div>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ 
                      width: `${displayedReviews ? (reviewsByRating[star] || 0) / displayedReviews * 100 : 0}%` 
                    }}
                  />
                </div>
                <div className="text-xs min-w-[2rem] text-right">{reviewsByRating[star] || 0}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <ReviewsChart data={monthlyData} />
    </div>
  );
};

export default OverviewSection;
