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

// Parse a date string and return a sortable date key (yyyy-mm)
function getDateSortKey(dateString: string): string {
  try {
    const date = new Date(dateString);
    // Handle invalid dates
    if (isNaN(date.getTime())) return '0000-00';
    
    // Format as yyyy-mm for proper sorting
    const year = date.getFullYear();
    // Add leading zero for month if needed
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    return `${year}-${month}`;
  } catch (error) {
    console.error("Error parsing date:", dateString, error);
    return '0000-00';
  }
}

// Format a date key (yyyy-mm) as a display month (Jan 2025)
function formatMonthDisplay(dateKey: string): string {
  try {
    const [year, month] = dateKey.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
    return dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch (error) {
    console.error("Error formatting month:", dateKey, error);
    return 'Unknown';
  }
}

// Cache for chart data
const chartDataCache = new Map<string, MonthlyReviewData[]>();

/**
 * Function to create the chart data with cumulative count
 * Optimized with caching and proper date handling
 */
export const getChartData = (reviews: Review[]): MonthlyReviewData[] => {
  if (!reviews || reviews.length === 0) {
    console.log("No reviews available for chart data");
    return [];
  }

  // Create a cache key based on review dates - using a sample for performance
  const sampleSize = Math.min(reviews.length, 10);
  const sampleReviews = reviews.slice(0, sampleSize);
  const sampleDates = sampleReviews.map(r => {
    // Handle both publishedAtDate and publishedatdate field names
    const dateField = r.publishedAtDate || (r as any).publishedatdate;
    return dateField;
  });
  const cacheKey = sampleDates.sort().join('|') + `-${reviews.length}`;
  
  // Return cached result if available
  if (chartDataCache.has(cacheKey)) {
    console.log("Using cached chart data");
    return chartDataCache.get(cacheKey)!;
  }
  
  console.log(`Generating chart data for ${reviews.length} reviews`);
  
  // Group reviews by year-month for proper sorting
  const monthMap = new Map<string, number>();
  
  reviews.forEach(review => {
    // Handle both publishedAtDate and publishedatdate field names
    const dateField = review.publishedAtDate || (review as any).publishedatdate;
    if (!dateField) return;
    
    // Get date key in sortable format (yyyy-mm)
    const monthYearKey = getDateSortKey(dateField);
    if (monthYearKey === '0000-00') return; // Skip invalid dates
    
    monthMap.set(monthYearKey, (monthMap.get(monthYearKey) || 0) + 1);
  });
  
  // Debug current month
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${('0' + (now.getMonth() + 1)).slice(-2)}`;
  console.log(`Current month key: ${currentMonthKey}, has data: ${monthMap.has(currentMonthKey)}, count: ${monthMap.get(currentMonthKey) || 0}`);
  
  // Convert to array and sort by date chronologically
  const monthEntries = Array.from(monthMap.entries())
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
  
  // Map to our data format with display-friendly month names
  const monthData = monthEntries.map(([key, count]) => ({
    key,
    month: formatMonthDisplay(key),
    count
  }));
  
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
  
  // Log some debug info
  console.log(`Generated ${result.length} months of chart data`);
  if (result.length > 0) {
    console.log(`First month: ${result[0].month}, count: ${result[0].count}`);
    console.log(`Last month: ${result[result.length-1].month}, count: ${result[result.length-1].count}`);
    console.log(`Total cumulative count: ${result[result.length-1].cumulativeCount}`);
  }
  
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
  
  // Create a cache key based on review length and a hash of business IDs
  const businessIds = new Set<string>();
  reviews.forEach(review => {
    if (review.business_id) {
      businessIds.add(review.business_id);
    }
  });
  const businessIdsStr = Array.from(businessIds).sort().join(',');
  const cacheKey = `stats-${reviews.length}-${businessIdsStr}`;
  
  // Return cached result if available
  if (businessStatsCache.has(cacheKey)) {
    return businessStatsCache.get(cacheKey)!;
  }
  
  // Count reviews for each business, handling both old and new data structures
  const businessCounts: Record<string, number> = {};
  const businessNameMap: Record<string, string> = {}; // Maps business_id to name
  
  reviews.forEach(review => {
    let businessName = '';
    let businessId = review.business_id;
    
    // Try to get business name from the joined data (new schema)
    const business = (review as any).businesses;
    if (business && business.name) {
      businessName = business.name;
      businessNameMap[businessId] = businessName;
    } 
    // Fallback to title field (old schema compatibility)
    else if (review.title) {
      businessName = review.title;
      businessNameMap[businessId] = businessName;
    }
    
    if (businessName) {
      businessCounts[businessName] = (businessCounts[businessName] || 0) + 1;
    }
  });
  
  // Ensure business names are used instead of IDs
  Object.entries(businessNameMap).forEach(([id, name]) => {
    if (businessCounts[id] && !businessCounts[name]) {
      businessCounts[name] = businessCounts[id];
      delete businessCounts[id];
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
  console.log("All utility caches cleared");
};
