import { Review, MonthlyReviewData } from "@/types/reviews";
import { EnhancedAnalysis } from "@/types/dataAnalysis";

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
 * Generate enhanced analysis from review data
 */
export const generateEnhancedAnalysis = (
  reviews: Review[],
  businessName: string
): EnhancedAnalysis => {
  // Set up day of week and time of day counters
  const dayOfWeekCounts = {
    "Monday": 0, "Tuesday": 0, "Wednesday": 0, 
    "Thursday": 0, "Friday": 0, "Saturday": 0, "Sunday": 0
  };
  
  const timeOfDayCounts = {
    "Morning (6AM-12PM)": 0,
    "Afternoon (12PM-5PM)": 0,
    "Evening (5PM-10PM)": 0,
    "Night (10PM-6AM)": 0
  };
  
  // Sentiment counts
  const sentimentCounts = {
    positive: 0,
    neutral: 0,
    negative: 0
  };
  
  // Rating data
  let totalRating = 0;
  let ratingCount = 0;
  
  // Historical periods (3 months)
  const now = new Date();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(now.getMonth() - 3);
  
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 6);
  
  // Review count by period
  const periodReviews = {
    recent: 0,
    previous: 0,
    older: 0
  };
  
  // Rating by period
  const periodRatings = {
    recent: { total: 0, count: 0 },
    previous: { total: 0, count: 0 },
    older: { total: 0, count: 0 }
  };
  
  // Seasonal data
  const seasonalData = {
    Winter: { count: 0, totalRating: 0 },
    Spring: { count: 0, totalRating: 0 },
    Summer: { count: 0, totalRating: 0 },
    Fall: { count: 0, totalRating: 0 }
  };
  
  // Topic clusters based on main themes and staff mentioned
  const topics = new Map<string, { count: number, sentiment: string[], keywords: Set<string> }>();
  
  // Process each review
  reviews.forEach(review => {
    // Process date information for temporal patterns
    if (review.publishedAtDate) {
      const date = new Date(review.publishedAtDate);
      
      // Day of week
      const day = date.toLocaleString('en-US', { weekday: 'long' });
      if (dayOfWeekCounts[day] !== undefined) {
        dayOfWeekCounts[day]++;
      }
      
      // Time of day
      const hour = date.getHours();
      if (hour >= 6 && hour < 12) {
        timeOfDayCounts["Morning (6AM-12PM)"]++;
      } else if (hour >= 12 && hour < 17) {
        timeOfDayCounts["Afternoon (12PM-5PM)"]++;
      } else if (hour >= 17 && hour < 22) {
        timeOfDayCounts["Evening (5PM-10PM)"]++;
      } else {
        timeOfDayCounts["Night (10PM-6AM)"]++;
      }
      
      // Season (Northern Hemisphere)
      const month = date.getMonth();
      let season: keyof typeof seasonalData;
      
      if (month >= 2 && month <= 4) {
        season = "Spring";
      } else if (month >= 5 && month <= 7) {
        season = "Summer";
      } else if (month >= 8 && month <= 10) {
        season = "Fall";
      } else {
        season = "Winter";
      }
      
      // Add to seasonal data
      if (review.stars) {
        seasonalData[season].count++;
        seasonalData[season].totalRating += review.stars;
      }
      
      // Period analysis
      if (date > threeMonthsAgo) {
        periodReviews.recent++;
        if (review.stars) {
          periodRatings.recent.total += review.stars;
          periodRatings.recent.count++;
        }
      } else if (date > sixMonthsAgo) {
        periodReviews.previous++;
        if (review.stars) {
          periodRatings.previous.total += review.stars;
          periodRatings.previous.count++;
        }
      } else {
        periodReviews.older++;
        if (review.stars) {
          periodRatings.older.total += review.stars;
          periodRatings.older.count++;
        }
      }
    }
    
    // Process sentiment
    if (review.sentiment) {
      const sentiment = review.sentiment.toLowerCase();
      if (sentiment.includes('positive')) {
        sentimentCounts.positive++;
      } else if (sentiment.includes('negative')) {
        sentimentCounts.negative++;
      } else {
        sentimentCounts.neutral++;
      }
    }
    
    // Process rating
    if (review.stars) {
      totalRating += review.stars;
      ratingCount++;
    }
    
    // Process themes and topics
    if (review.mainThemes) {
      const themes = review.mainThemes.split(',').map(t => t.trim());
      
      themes.forEach(theme => {
        if (!theme) return;
        
        // Create or update topic
        if (!topics.has(theme)) {
          topics.set(theme, { 
            count: 0, 
            sentiment: [], 
            keywords: new Set<string>() 
          });
        }
        
        const topic = topics.get(theme)!;
        topic.count++;
        
        // Track sentiment for this theme
        if (review.sentiment) {
          topic.sentiment.push(review.sentiment.toLowerCase());
        }
        
        // Extract keywords from review text
        if (review.text) {
          // Simple keyword extraction (this would be more sophisticated in production)
          const words = review.text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 4 && !['about', 'would', 'could', 'there', 'their', 'which', 'where'].includes(word))
            .slice(0, 5);
          
          words.forEach(word => topic.keywords.add(word));
        }
      });
    }
    
    // Process staff mentions
    if (review.staffMentioned) {
      const staffTopic = "Staff";
      
      if (!topics.has(staffTopic)) {
        topics.set(staffTopic, { 
          count: 0, 
          sentiment: [], 
          keywords: new Set<string>() 
        });
      }
      
      const topic = topics.get(staffTopic)!;
      topic.count++;
      
      // Add staff names as keywords
      const staffNames = review.staffMentioned.split(',').map(s => s.trim());
      staffNames.forEach(name => {
        if (name) topic.keywords.add(name);
      });
      
      // Track sentiment for staff mentions
      if (review.sentiment) {
        topic.sentiment.push(review.sentiment.toLowerCase());
      }
    }
  });
  
  // Calculate average rating
  const avgRating = ratingCount > 0 ? totalRating / ratingCount : 0;
  
  // Calculate average ratings by period
  const avgRatingByPeriod = {
    recent: periodRatings.recent.count > 0 ? periodRatings.recent.total / periodRatings.recent.count : 0,
    previous: periodRatings.previous.count > 0 ? periodRatings.previous.total / periodRatings.previous.count : 0,
    older: periodRatings.older.count > 0 ? periodRatings.older.total / periodRatings.older.count : 0
  };
  
  // Calculate average ratings by season
  const seasonalAnalysisData = Object.entries(seasonalData).map(([season, data]) => ({
    season,
    count: data.count,
    avgRating: data.count > 0 ? Math.round((data.totalRating / data.count) * 10) / 10 : 0
  }));
  
  // Create review clusters
  const reviewClusters = Array.from(topics.entries())
    .filter(([_, data]) => data.count >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([name, data]) => {
      // Determine dominant sentiment
      const sentimentCounts = {
        positive: 0,
        neutral: 0,
        negative: 0,
      };
      
      data.sentiment.forEach(s => {
        if (s.includes('positive')) sentimentCounts.positive++;
        else if (s.includes('negative')) sentimentCounts.negative++;
        else sentimentCounts.neutral++;
      });
      
      let dominantSentiment: string;
      if (sentimentCounts.positive > sentimentCounts.negative && sentimentCounts.positive > sentimentCounts.neutral) {
        dominantSentiment = 'positive';
      } else if (sentimentCounts.negative > sentimentCounts.positive && sentimentCounts.negative > sentimentCounts.neutral) {
        dominantSentiment = 'negative';
      } else {
        dominantSentiment = 'neutral';
      }
      
      // Get top keywords (up to 5)
      const keywords = Array.from(data.keywords).slice(0, 5);
      
      return {
        name,
        count: data.count,
        sentiment: dominantSentiment,
        keywords
      };
    });
  
  // Generate insights
  const insights: string[] = [];
  
  // Find most popular day
  const mostPopularDay = Object.entries(dayOfWeekCounts)
    .sort((a, b) => b[1] - a[1])[0][0];
    
  if (dayOfWeekCounts[mostPopularDay] > 0) {
    insights.push(`${businessName} receives the most reviews on ${mostPopularDay}s.`);
  }
  
  // Find most popular time of day
  const mostPopularTime = Object.entries(timeOfDayCounts)
    .sort((a, b) => b[1] - a[1])[0][0];
    
  if (timeOfDayCounts[mostPopularTime] > 0) {
    insights.push(`Most reviews are submitted during ${mostPopularTime}.`);
  }
  
  // Sentiment insight
  if (sentimentCounts.positive + sentimentCounts.negative + sentimentCounts.neutral > 0) {
    const dominantSentiment = sentimentCounts.positive > sentimentCounts.negative && sentimentCounts.positive > sentimentCounts.neutral
      ? "positive"
      : sentimentCounts.negative > sentimentCounts.positive && sentimentCounts.negative > sentimentCounts.neutral
        ? "negative"
        : "neutral";
        
    insights.push(`Review sentiment is predominantly ${dominantSentiment}.`);
  }
  
  // Season with highest rating
  const bestSeason = seasonalAnalysisData
    .sort((a, b) => b.avgRating - a.avgRating)[0];
    
  if (bestSeason && bestSeason.avgRating > 0) {
    insights.push(`${businessName} receives the highest ratings during ${bestSeason.season} (${bestSeason.avgRating.toFixed(1)} stars).`);
  }
  
  // Rating trend
  if (avgRatingByPeriod.recent > 0 && avgRatingByPeriod.previous > 0) {
    const ratingTrend = avgRatingByPeriod.recent - avgRatingByPeriod.previous;
    if (Math.abs(ratingTrend) >= 0.1) {
      insights.push(`Average review ratings have ${ratingTrend > 0 ? 'increased' : 'decreased'} by ${Math.abs(ratingTrend).toFixed(1)} stars in the last three months.`);
    }
  }
  
  // Review volume trend
  if (periodReviews.recent > 0 && periodReviews.previous > 0) {
    const reviewCountChange = periodReviews.recent - periodReviews.previous;
    const reviewCountPercentChange = Math.round((reviewCountChange / periodReviews.previous) * 100);
    
    if (Math.abs(reviewCountPercentChange) >= 10) {
      insights.push(`Review volume has ${reviewCountPercentChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(reviewCountPercentChange)}% in the last three months.`);
    }
  }
  
  // Add fallback insight if none were generated
  if (insights.length === 0) {
    insights.push(`Analysis based on ${reviews.length} reviews for ${businessName}.`);
  }
  
  // Return the enhanced analysis data
  return {
    temporalPatterns: {
      dayOfWeek: Object.entries(dayOfWeekCounts).map(([day, count]) => ({ day, count })),
      timeOfDay: Object.entries(timeOfDayCounts).map(([time, count]) => ({ time, count }))
    },
    historicalTrends: [
      { period: "Older Reviews", avgRating: avgRatingByPeriod.older, reviewCount: periodReviews.older },
      { period: "Previous 3 Months", avgRating: avgRatingByPeriod.previous, reviewCount: periodReviews.previous },
      { period: "Last 3 Months", avgRating: avgRatingByPeriod.recent, reviewCount: periodReviews.recent }
    ],
    reviewClusters,
    seasonalAnalysis: seasonalAnalysisData,
    insights
  };
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
