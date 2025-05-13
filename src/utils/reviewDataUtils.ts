
import { Review, MonthlyReviewData } from "@/types/reviews";

/**
 * Filters reviews based on the selected business
 */
export const filterReviewsByBusiness = (
  reviews: Review[], 
  selectedBusiness: string
): Review[] => {
  if (selectedBusiness === "all") {
    return reviews;
  }
  return reviews.filter((review) => review.title === selectedBusiness);
};

/**
 * Function to create the chart data with cumulative count
 */
export const getChartData = (reviews: Review[]): MonthlyReviewData[] => {
  // Group reviews by month
  const monthMap = new Map<string, number>();
  
  reviews.forEach(review => {
    const date = new Date(review.publishedAtDate);
    const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    monthMap.set(monthYear, (monthMap.get(monthYear) || 0) + 1);
  });
  
  // Convert to array and sort by date
  const monthData = Array.from(monthMap.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });
  
  // Add cumulative count
  let cumulative = 0;
  return monthData.map(item => {
    cumulative += item.count;
    return {
      month: item.month,
      count: item.count,
      cumulativeCount: cumulative
    };
  });
};

/**
 * Calculates business statistics based on reviews
 */
export const calculateBusinessStats = (
  reviews: Review[]
): Record<string, { name: string; count: number }> => {
  // Count reviews for each business
  const businessCounts = reviews.reduce((acc, review) => {
    const business = review.title || "";
    if (!acc[business]) {
      acc[business] = 0;
    }
    acc[business]++;
    return acc;
  }, {} as Record<string, number>);
  
  // Build a dynamic businessData object based on what we found
  const businessesObj: Record<string, { name: string; count: number }> = {};
  
  Object.keys(businessCounts).forEach(business => {
    businessesObj[business] = {
      name: business,
      count: businessCounts[business] || 0
    };
  });
  
  return businessesObj;
};
