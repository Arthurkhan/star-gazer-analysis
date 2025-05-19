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
    // Handle the new data structure where business info is in the "businesses" property
    result = reviews.filter((review) => {
      // Check both title (backward compatibility) and the businesses property (new schema)
      if (review.title === selectedBusiness) {
        return true;
      }
      
      // Check the businesses property which comes from the join
      const business = (review as any).businesses;
      if (business && business.name === selectedBusiness) {
        return true;
      }
      
      return false;
    });
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
  if (!reviews || reviews.length === 0) {
    return [];
  }
  
  // Create a cache key based on review dates
  const cacheKey = reviews.map(r => r.publishedAtDate).sort().join('|');
  
  // Return cached result if available
  if (chartDataCache.has(cacheKey)) {
    return chartDataCache.get(cacheKey)!;
  }
  
  // Group reviews by month
  const monthMap = new Map<string, number>();
  
  reviews.forEach(review => {
    if (!review.publishedAtDate) return;
    
    const date = new Date(review.publishedAtDate);
    if (isNaN(date.getTime())) return; // Skip invalid dates
    
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
  if (!reviews || reviews.length === 0) {
    return {};
  }
  
  // Create a simpler cache key based on review length and a hash
  const cacheKey = `stats-${reviews.length}-${Date.now()}`;
  
  // Return cached result if available
  if (businessStatsCache.has(cacheKey)) {
    return businessStatsCache.get(cacheKey)!;
  }
  
  // Count reviews for each business, handling both old and new data structures
  const businessCounts: Record<string, number> = {};
  
  reviews.forEach(review => {
    let businessName = '';
    
    // Try to get business name from the joined data (new schema)
    const business = (review as any).businesses;
    if (business && business.name) {
      businessName = business.name;
    } 
    // Fallback to title field (old schema compatibility)
    else if (review.title) {
      businessName = review.title;
    }
    
    if (businessName) {
      businessCounts[businessName] = (businessCounts[businessName] || 0) + 1;
    }
  });
  
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
 * Get business ID from business name
 */
export const getBusinessIdFromName = (
  reviews: Review[],
  businessName: string
): string | undefined => {
  // Find the first review that matches the business name
  const review = reviews.find(r => {
    const business = (r as any).businesses;
    return business && business.name === businessName;
  });
  
  if (review) {
    const business = (review as any).businesses;
    return business?.id;
  }
  
  return undefined;
};

/**
 * Clear all caches - useful when data changes
 */
export const clearCaches = () => {
  filterCache.clear();
  chartDataCache.clear();
  businessStatsCache.clear();
};
