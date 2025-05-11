
import { 
  Review, 
  SentimentData, 
  LanguageData, 
  MonthlyReviewData,
  InsightsData,
  ThemeData,
  TrendPoint,
  StaffMention
} from "@/types/reviews";
import { getAnalysis } from "@/utils/openaiAnalysis";

// Calculate average rating from reviews
export const calculateAverageRating = (reviews: Review[]): number => {
  if (reviews.length === 0) return 0;
  
  const sum = reviews.reduce((total, review) => total + review.star, 0);
  return sum / reviews.length;
};

// Count reviews by rating (1-5 stars)
export const countReviewsByRating = (
  reviews: Review[]
): Record<number, number> => {
  return reviews.reduce((counts, review) => {
    const star = review.star;
    counts[star] = (counts[star] || 0) + 1;
    return counts;
  }, {} as Record<number, number>);
};

// Group reviews by month, calculate count and month-over-month comparison
export const groupReviewsByMonth = (reviews: Review[]): MonthlyReviewData[] => {
  // Create a map for months
  const monthMap = new Map<string, { count: number }>();
  
  // Sort reviews by date
  const sortedReviews = [...reviews].sort(
    (a, b) => new Date(a.publishedAtDate).getTime() - new Date(b.publishedAtDate).getTime()
  );
  
  sortedReviews.forEach(review => {
    const date = new Date(review.publishedAtDate);
    const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    if (!monthMap.has(monthYear)) {
      monthMap.set(monthYear, { count: 0 });
    }
    
    const current = monthMap.get(monthYear)!;
    current.count += 1;
  });
  
  // Convert map to array
  const result: MonthlyReviewData[] = [];
  
  monthMap.forEach((value, key) => {
    result.push({
      month: key,
      count: value.count,
    });
  });
  
  // Sort by date to ensure chronological order
  result.sort((a, b) => {
    const dateA = new Date(a.month);
    const dateB = new Date(b.month);
    return dateA.getTime() - dateB.getTime();
  });
  
  // Calculate cumulative count
  let cumulativeCount = 0;
  const cumulativeResult = result.map(item => {
    cumulativeCount += item.count;
    return {
      ...item,
      cumulativeCount
    };
  });
  
  return cumulativeResult;
};

// Calculate monthly comparison data
export const calculateMonthlyComparison = (reviews: Review[]): { 
  vsLastMonth: number; 
  vsLastYear: number;
  currentMonthCount: number;
  previousMonthCount: number;
  previousYearSameMonthCount: number;
} => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Current month
  const currentMonthReviews = reviews.filter(review => {
    const reviewDate = new Date(review.publishedAtDate);
    return reviewDate.getMonth() === currentMonth && reviewDate.getFullYear() === currentYear;
  });
  
  // Previous month
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  
  const previousMonthReviews = reviews.filter(review => {
    const reviewDate = new Date(review.publishedAtDate);
    return reviewDate.getMonth() === previousMonth && reviewDate.getFullYear() === previousMonthYear;
  });
  
  // Same month last year
  const previousYearSameMonthReviews = reviews.filter(review => {
    const reviewDate = new Date(review.publishedAtDate);
    return reviewDate.getMonth() === currentMonth && reviewDate.getFullYear() === currentYear - 1;
  });
  
  const currentMonthCount = currentMonthReviews.length;
  const previousMonthCount = previousMonthReviews.length;
  const previousYearSameMonthCount = previousYearSameMonthReviews.length;
  
  // Calculate differences
  const vsLastMonth = currentMonthCount - previousMonthCount;
  const vsLastYear = currentMonthCount - previousYearSameMonthCount;
  
  return {
    vsLastMonth,
    vsLastYear,
    currentMonthCount,
    previousMonthCount,
    previousYearSameMonthCount
  };
};

// Analyze sentiment based on star ratings with OpenAI enhancement
export const analyzeReviewSentiment = async (reviews: Review[]): Promise<SentimentData[]> => {
  try {
    // Try to get OpenAI analysis first
    const analysis = await getAnalysis(reviews);
    if (analysis && analysis.sentimentAnalysis && analysis.sentimentAnalysis.length > 0) {
      return analysis.sentimentAnalysis;
    }
  } catch (error) {
    console.error("Error getting OpenAI sentiment analysis, falling back to basic analysis:", error);
  }
  
  // Fallback to basic rating-based sentiment analysis
  const positive = reviews.filter(r => r.star >= 4).length;
  const neutral = reviews.filter(r => r.star === 3).length;
  const negative = reviews.filter(r => r.star <= 2).length;
  
  return [
    { name: "Positive", value: positive },
    { name: "Neutral", value: neutral },
    { name: "Negative", value: negative },
  ];
};

// For backward compatibility with synchronous code
export const analyzeReviewSentiment_sync = (reviews: Review[]): SentimentData[] => {
  const positive = reviews.filter(r => r.star >= 4).length;
  const neutral = reviews.filter(r => r.star === 3).length;
  const negative = reviews.filter(r => r.star <= 2).length;
  
  return [
    { name: "Positive", value: positive },
    { name: "Neutral", value: neutral },
    { name: "Negative", value: negative },
  ];
};

// Count reviews by language
export const countReviewsByLanguage = (reviews: Review[]): LanguageData[] => {
  const languageCounts: Record<string, number> = {};
  
  reviews.forEach(review => {
    const language = review.originalLanguage;
    languageCounts[language] = (languageCounts[language] || 0) + 1;
  });
  
  // Convert to array and sort by count
  return Object.entries(languageCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

// Extract staff mentions from reviews using OpenAI
export const extractStaffMentions = async (reviews: Review[]): Promise<StaffMention[]> => {
  try {
    console.log("Attempting to extract staff mentions from", reviews.length, "reviews");
    // Try to get OpenAI analysis first
    const analysis = await getAnalysis(reviews);
    console.log("Staff mentions from OpenAI:", analysis.staffMentions);
    
    if (analysis && analysis.staffMentions && analysis.staffMentions.length > 0) {
      return analysis.staffMentions;
    }
    
    console.log("No staff mentions found in OpenAI analysis");
  } catch (error) {
    console.error("Error getting OpenAI staff mentions, falling back to empty staff list:", error);
  }
  
  // If OpenAI analysis fails or no staff are found, return empty array instead of mock data
  return [];
};

// For backward compatibility with synchronous code - now returns empty array instead of fake data
export const extractStaffMentions_sync = (reviews: Review[]): StaffMention[] => {
  // Return empty array instead of fake data
  return [];
};

// Extract common terms from reviews using OpenAI
export const extractCommonTerms = async (reviews: Review[]): Promise<{text: string, count: number}[]> => {
  try {
    // Try to get OpenAI analysis first
    const analysis = await getAnalysis(reviews);
    if (analysis && analysis.commonTerms && analysis.commonTerms.length > 0) {
      return analysis.commonTerms;
    }
  } catch (error) {
    console.error("Error getting OpenAI common terms, falling back to basic analysis:", error);
  }
  
  // Fallback to mock data for common terms
  return [
    { text: "service", count: Math.floor(Math.random() * 15) + 15 },
    { text: "food", count: Math.floor(Math.random() * 15) + 10 },
    { text: "atmosphere", count: Math.floor(Math.random() * 10) + 10 },
    { text: "staff", count: Math.floor(Math.random() * 10) + 8 },
    { text: "price", count: Math.floor(Math.random() * 8) + 5 },
    { text: "quality", count: Math.floor(Math.random() * 8) + 5 },
    { text: "experience", count: Math.floor(Math.random() * 7) + 5 },
    { text: "recommend", count: Math.floor(Math.random() * 6) + 4 },
    { text: "ambiance", count: Math.floor(Math.random() * 6) + 3 },
    { text: "excellent", count: Math.floor(Math.random() * 5) + 3 },
  ].sort((a, b) => b.count - a.count);
};

// For backward compatibility with synchronous code
export const extractCommonTerms_sync = (reviews: Review[]): {text: string, count: number}[] => {
  return [
    { text: "service", count: Math.floor(Math.random() * 15) + 15 },
    { text: "food", count: Math.floor(Math.random() * 15) + 10 },
    { text: "atmosphere", count: Math.floor(Math.random() * 10) + 10 },
    { text: "staff", count: Math.floor(Math.random() * 10) + 8 },
    { text: "price", count: Math.floor(Math.random() * 8) + 5 },
    { text: "quality", count: Math.floor(Math.random() * 8) + 5 },
    { text: "experience", count: Math.floor(Math.random() * 7) + 5 },
    { text: "recommend", count: Math.floor(Math.random() * 6) + 4 },
    { text: "ambiance", count: Math.floor(Math.random() * 6) + 3 },
    { text: "excellent", count: Math.floor(Math.random() * 5) + 3 },
  ].sort((a, b) => b.count - a.count);
};

// Get overall analysis from OpenAI
export const getOverallAnalysis = async (reviews: Review[]): Promise<string> => {
  try {
    // Try to get OpenAI analysis first
    const analysis = await getAnalysis(reviews);
    if (analysis && analysis.overallAnalysis) {
      return analysis.overallAnalysis;
    }
  } catch (error) {
    console.error("Error getting OpenAI overall analysis, falling back to basic analysis:", error);
  }
  
  // Fallback to basic analysis
  const avgRating = calculateAverageRating(reviews);
  return `Based on ${reviews.length} reviews with an average rating of ${avgRating.toFixed(1)}, the business is ${avgRating >= 4 ? 'performing well' : avgRating >= 3 ? 'performing adequately' : 'underperforming'}.`;
};

// Analyze reviews for insights
export const analyzeReviewInsights = (reviews: Review[]): InsightsData => {
  // Generate trend data
  const trendData: TrendPoint[] = [];
  
  // Group reviews by quarter
  const quarters = new Map<string, { sum: number; count: number }>();
  
  reviews.forEach(review => {
    const date = new Date(review.publishedAtDate);
    const quarter = `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
    
    if (!quarters.has(quarter)) {
      quarters.set(quarter, { sum: 0, count: 0 });
    }
    
    const current = quarters.get(quarter)!;
    current.sum += review.star;
    current.count += 1;
  });
  
  // Convert to trend points
  quarters.forEach((value, key) => {
    trendData.push({
      period: key,
      value: value.sum / value.count,
    });
  });
  
  // Sort by date
  trendData.sort((a, b) => {
    const yearA = parseInt(a.period.split(' ')[1]);
    const yearB = parseInt(b.period.split(' ')[1]);
    
    if (yearA !== yearB) return yearA - yearB;
    
    const quarterA = parseInt(a.period[1]);
    const quarterB = parseInt(b.period[1]);
    
    return quarterA - quarterB;
  });
  
  // Only keep last 6 quarters
  const lastSixQuarters = trendData.slice(-6);
  
  // Determine rating trend
  let ratingTrend: "up" | "down" | "neutral" = "neutral";
  
  if (lastSixQuarters.length >= 2) {
    const firstHalf = lastSixQuarters.slice(0, Math.floor(lastSixQuarters.length / 2));
    const secondHalf = lastSixQuarters.slice(Math.floor(lastSixQuarters.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, point) => sum + point.value, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, point) => sum + point.value, 0) / secondHalf.length;
    
    if (secondHalfAvg > firstHalfAvg + 0.2) {
      ratingTrend = "up";
    } else if (secondHalfAvg < firstHalfAvg - 0.2) {
      ratingTrend = "down";
    }
  }
  
  // Find reviews needing attention (low rating, no response)
  const needAttention = reviews
    .filter(review => review.star <= 2 && !review.responseFromOwnerText?.trim())
    .slice(0, 3);
  
  // Mock common themes (in a real app, this would use NLP)
  const commonThemes: ThemeData[] = [
    { 
      text: "Excellent service mentioned in positive reviews", 
      count: Math.floor(reviews.length * 0.3), 
      sentiment: "positive" 
    },
    { 
      text: "Atmosphere praised by customers", 
      count: Math.floor(reviews.length * 0.25), 
      sentiment: "positive" 
    },
    { 
      text: "Wait times mentioned in negative reviews", 
      count: Math.floor(reviews.length * 0.15), 
      sentiment: "negative" 
    },
    { 
      text: "Price mentioned in mixed context", 
      count: Math.floor(reviews.length * 0.2), 
      sentiment: "neutral" 
    },
  ];
  
  return {
    trendData: lastSixQuarters,
    needAttention,
    ratingTrend,
    commonThemes,
  };
};
