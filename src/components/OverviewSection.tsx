
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Review } from "@/types/reviews";
import { 
  calculateAverageRating, 
  countReviewsByRating,
  groupReviewsByMonth,
  calculateMonthlyComparison
} from "@/utils/dataUtils";
import ReviewsChart from "@/components/ReviewsChart";

interface OverviewSectionProps {
  reviews: Review[];
}

const OverviewSection = ({ reviews }: OverviewSectionProps) => {
  const totalReviews = reviews.length;
  const averageRating = calculateAverageRating(reviews);
  const reviewsByRating = countReviewsByRating(reviews);
  const monthlyData = groupReviewsByMonth(reviews);
  const monthlyComparison = calculateMonthlyComparison(reviews);
  
  const fiveStars = reviewsByRating[5] || 0;
  const fiveStarPercentage = totalReviews > 0 
    ? Math.round((fiveStars / totalReviews) * 100) 
    : 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <Card className="shadow-md border-0 dark:bg-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-md font-medium">Total Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalReviews}</div>
          <p className="text-xs text-gray-500 mt-1">
            {monthlyComparison.vsLastMonth > 0 
              ? `+${monthlyComparison.vsLastMonth} from last month` 
              : monthlyComparison.vsLastMonth < 0 
                ? `${monthlyComparison.vsLastMonth} from last month`
                : `Same as last month`}
          </p>
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
                      width: `${totalReviews ? (reviewsByRating[star] || 0) / totalReviews * 100 : 0}%` 
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
