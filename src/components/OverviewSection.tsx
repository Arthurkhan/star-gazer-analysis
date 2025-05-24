import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Review } from "@/types/reviews";
import { 
  calculateAverageRating, 
  countReviewsByRating,
  groupReviewsByMonth,
  calculateMonthlyComparison,
  calculateResponseRate,
  calculateEngagementMetrics
} from "@/utils/dataUtils";
import ReviewsChart from "@/components/ReviewsChart";
import CumulativeReviewsChart from "@/components/CumulativeReviewsChart";
import { Button } from "@/components/ui/button";
import { Loader, RefreshCw, MessageSquare, TrendingUp } from "lucide-react";

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
  
  // NEW: Calculate response rate and engagement metrics
  const responseRate = calculateResponseRate(reviews);
  const engagementMetrics = calculateEngagementMetrics(reviews);
  
  const fiveStars = reviewsByRating[5] || 0;
  const fiveStarPercentage = displayedReviews > 0 
    ? Math.round((fiveStars / displayedReviews) * 100) 
    : 0;
  
  const loadPercentage = totalReviews > 0 
    ? Math.round((displayedReviews / totalReviews) * 100)
    : 100;
  
  return (
    <div className="space-y-6">
      {/* Top stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        
        {/* NEW: Response Rate Card */}
        <Card className="shadow-md border-0 dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-md font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Response Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{responseRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-500 mt-1">
              {engagementMetrics.responseCount} of {displayedReviews} reviews answered
            </div>
          </CardContent>
        </Card>
        
        {/* NEW: Engagement Score Card */}
        <Card className="shadow-md border-0 dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-md font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Recent Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{engagementMetrics.recentResponseRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-500 mt-1">
              Last 3 months response rate
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* NEW: Engagement breakdown section */}
      {engagementMetrics.responseCount > 0 && (
        <Card className="shadow-md border-0 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Engagement Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-background/50 rounded-lg">
                <div className="text-sm text-gray-500">Avg Response Length</div>
                <div className="text-2xl font-bold">{Math.round(engagementMetrics.avgResponseLength)}</div>
                <div className="text-xs text-gray-400">characters</div>
              </div>
              
              <div className="p-4 bg-background/50 rounded-lg">
                <div className="text-sm text-gray-500">Low Rating Response</div>
                <div className="text-2xl font-bold">
                  {engagementMetrics.responseByRating[1]?.rate.toFixed(1) || 0}%
                </div>
                <div className="text-xs text-gray-400">1-star reviews answered</div>
              </div>
              
              <div className="p-4 bg-background/50 rounded-lg">
                <div className="text-sm text-gray-500">High Rating Response</div>
                <div className="text-2xl font-bold">
                  {engagementMetrics.responseByRating[5]?.rate.toFixed(1) || 0}%
                </div>
                <div className="text-xs text-gray-400">5-star reviews answered</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Review Distribution Card */}
      <Card className="shadow-md border-0 dark:bg-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-md font-medium">Review Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(star => {
              const count = reviewsByRating[star] || 0;
              const percentage = displayedReviews ? (count / displayedReviews * 100) : 0;
              const responseData = engagementMetrics.responseByRating[star];
              
              return (
                <div key={star} className="flex items-center gap-2">
                  <div className="text-xs min-w-[1.5rem]">{star}★</div>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-xs min-w-[2rem] text-right">{count}</div>
                  {responseData && responseData.total > 0 && (
                    <div className="text-xs text-gray-500 min-w-[3rem] text-right">
                      ({responseData.rate.toFixed(0)}% responded)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Charts section */}
      <div className="space-y-6">
        {/* Reviews Timeline Chart */}
        <ReviewsChart data={monthlyData} />
        
        {/* Cumulative Reviews Growth Chart */}
        <CumulativeReviewsChart data={monthlyData} />
      </div>
    </div>
  );
};

export default OverviewSection;
