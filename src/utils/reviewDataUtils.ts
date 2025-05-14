
import { Review, MonthlyReviewData } from "@/types/reviews";

/**
 * Filters reviews based on the selected business
 * Uses memoization pattern for performance
 */
const filterCache = new Map<string, Review[]>();

export const filterReviewsByBusiness = (
  reviews: Review[], 
  selectedBusiness: string
): Review[] => {
  // Create cache key
  const cacheKey = `${selectedBusiness}-${reviews.length}`;
  
  // Return cached result if available
  if (filterCache.has(cacheKey)) {
    return filterCache.get(cacheKey)!;
  }
  
  let result: Review[];
  if (selectedBusiness === "all") {
    result = reviews;
  } else {
    result = reviews.filter((review) => review.title === selectedBusiness);
  }
  
  // Store in cache and return
  filterCache.set(cacheKey, result);
  return result;
};

// Cache for chart data
const chartDataCache = new Map<string, MonthlyReviewData[]>();

/**
 * Function to create the chart data with cumulative count
 * Optimized with caching
 */
export const getChartData = (reviews: Review[]): MonthlyReviewData[] => {
  // Create a cache key based on review dates
  const cacheKey = reviews.map(r => r.publishedAtDate).sort().join('|');
  
  // Return cached result if available
  if (chartDataCache.has(cacheKey)) {
    return chartDataCache.get(cacheKey)!;
  }
  
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
  const result = monthData.map(item => {
    cumulative += item.count;
    return {
      month: item.month,
      count: item.count,
      cumulativeCount: cumulative
    };
  });
  
  // Cache the result
  chartDataCache.set(cacheKey, result);
  
  return result;
};

// Cache for business stats
const businessStatsCache = new Map<string, Record<string, { name: string; count: number }>>();

/**
 * Calculates business statistics based on reviews
 * With caching for performance
 */
export const calculateBusinessStats = (
  reviews: Review[]
): Record<string, { name: string; count: number }> => {
  // Create cache key based on review titles
  const cacheKey = reviews.map(r => r.title).sort().join('|');
  
  // Return cached result if available
  if (businessStatsCache.has(cacheKey)) {
    return businessStatsCache.get(cacheKey)!;
  }
  
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
  
  // Cache the result
  businessStatsCache.set(cacheKey, businessesObj);
  
  return businessesObj;
};

/**
 * Clear all caches - useful when data changes
 */
export const clearCaches = () => {
  filterCache.clear();
  chartDataCache.clear();
  businessStatsCache.clear();
};
