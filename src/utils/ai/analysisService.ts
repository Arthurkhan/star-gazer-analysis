
// This file combines all the AI analysis functionality
import { Review } from "@/types/reviews";
import { getSelectedModel } from "./aiProviders";
import { generateCacheKey, getFromCache, storeInCache, clearCache } from "./analysisCache";
import { supabase } from "@/integrations/supabase/client";

export { clearCache };

interface DateRange {
  startDate: string;
  endDate: string;
}

// Main function to analyze reviews using AI
export const analyzeReviewsWithAI = async (
  reviews: Review[],
  dateRange?: DateRange
): Promise<{
  sentimentAnalysis: { name: string; value: number }[];
  staffMentions: { name: string; count: number; sentiment: "positive" | "negative" | "neutral"; examples?: string[] }[];
  commonTerms: { text: string; count: number; category?: string }[];
  overallAnalysis: string;
  ratingBreakdown?: { rating: number; count: number; percentage: number }[];
  languageDistribution?: { language: string; count: number; percentage: number }[];
  usingCustomPrompt?: boolean;
}> => {
  try {
    // Get the AI provider
    const provider = localStorage.getItem("AI_PROVIDER") || "openai";
    
    // Check if the API key exists in localStorage
    const apiKey = localStorage.getItem(`${provider.toUpperCase()}_API_KEY`);
    
    if (!apiKey) {
      console.error(`No API key found for ${provider}. Please set up your API key in the settings.`);
      throw new Error(`API key not found for ${provider}`);
    }

    // Get the selected model based on provider
    const model = getSelectedModel(provider);
    console.log(`Using ${provider} model: ${model}`);

    // Prepare all reviews for API
    const reviewTexts = reviews.map(review => ({
      text: review.text,
      rating: review.stars, // Fixed: was review.star
      date: review.publishedAtDate,
      language: review.originalLanguage || "unknown",
      sentiment: review.sentiment,
      staffMentioned: review.staffMentioned,
      mainThemes: review.mainThemes,
      commonTerms: review["common terms"]
    }));

    console.log(`Processing ${reviewTexts.length} reviews with ${provider}...`);
    
    // Calculate rating breakdown before sending to AI
    const ratingBreakdown = calculateRatingBreakdown(reviews);
    
    // Calculate language distribution before sending to AI
    const languageDistribution = calculateLanguageDistribution(reviews);
    
    // Prepare comparison data for the date range
    let comparisonData = null;
    if (dateRange) {
      comparisonData = calculateComparisonPeriod(reviews, dateRange);
    }
    
    // Call the Edge Function to analyze the reviews - NOW INCLUDING API KEY
    const { data, error } = await supabase.functions.invoke("analyze-reviews", {
      body: {
        reviews: reviewTexts,
        provider: provider,
        model: model,
        apiKey: apiKey, // IMPORTANT: Send API key with request
        fullAnalysis: true,
        reportType: 'comprehensive',
        dateRange: dateRange,
        comparisonData: comparisonData
      }
    });

    if (error) {
      console.error("Edge Function error:", error);
      throw new Error(`Analysis failed: ${error.message}`);
    }
    
    // Add our pre-calculated stats to the analysis results
    return {
      ...data,
      ratingBreakdown,
      languageDistribution
    };
  } catch (error) {
    console.error("AI analysis failed:", error);
    
    // Fallback to basic analysis if AI fails
    const ratingBreakdown = calculateRatingBreakdown(reviews);
    const languageDistribution = calculateLanguageDistribution(reviews);
    
    return {
      sentimentAnalysis: [
        { name: "Positive", value: reviews.filter(r => r.stars >= 4).length },
        { name: "Neutral", value: reviews.filter(r => r.stars === 3).length },
        { name: "Negative", value: reviews.filter(r => r.stars <= 2).length },
      ],
      staffMentions: [],
      commonTerms: [],
      overallAnalysis: "Unable to generate detailed analysis. Using basic rating-based analysis instead.",
      ratingBreakdown,
      languageDistribution
    };
  }
};

// Calculate comparison period based on date range
function calculateComparisonPeriod(reviews: Review[], dateRange: DateRange) {
  const currentStart = new Date(dateRange.startDate);
  const currentEnd = new Date(dateRange.endDate);
  
  // Calculate duration of current period in days
  const currentDuration = Math.floor((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Calculate dates for previous period (same duration)
  const previousEnd = new Date(currentStart);
  previousEnd.setDate(previousEnd.getDate() - 1); // Day before current start
  
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - currentDuration + 1); // Same duration as current period
  
  // Filter reviews for current period
  const currentPeriodReviews = reviews.filter(review => {
    const reviewDate = new Date(review.publishedAtDate);
    return reviewDate >= currentStart && reviewDate <= currentEnd;
  });
  
  // Filter reviews for previous period
  const previousPeriodReviews = reviews.filter(review => {
    const reviewDate = new Date(review.publishedAtDate);
    return reviewDate >= previousStart && reviewDate <= previousEnd;
  });
  
  // Calculate comparison metrics
  const currentCount = currentPeriodReviews.length;
  const previousCount = previousPeriodReviews.length;
  
  // Calculate change percentage, handling division by zero
  let changePercentage: number | string = 0;
  let changeDescription: string = "Stable";
  
  if (previousCount === 0 && currentCount === 0) {
    changePercentage = "N/A";
    changeDescription = "No activity in either period";
  } else if (previousCount === 0) {
    changePercentage = "N/A";
    changeDescription = "New period (no previous data)";
  } else {
    changePercentage = ((currentCount - previousCount) / previousCount) * 100;
    
    if (changePercentage > 10) {
      changeDescription = "Increasing";
    } else if (changePercentage < -10) {
      changeDescription = "Decreasing";
    } else {
      changeDescription = "Stable";
    }
  }
  
  // Check if we have enough historical data
  const oldestReviewDate = new Date(Math.min(
    ...reviews.map(r => new Date(r.publishedAtDate).getTime())
  ));
  
  const hasEnoughHistory = (currentStart.getTime() - oldestReviewDate.getTime()) >= (30 * 24 * 60 * 60 * 1000); // 30 days
  
  return {
    current: {
      startDate: currentStart.toISOString(),
      endDate: currentEnd.toISOString(),
      count: currentCount
    },
    previous: {
      startDate: previousStart.toISOString(),
      endDate: previousEnd.toISOString(),
      count: previousCount
    },
    change: {
      percentage: changePercentage,
      description: changeDescription
    },
    hasEnoughHistory: hasEnoughHistory
  };
}

// Calculate rating breakdown statistics
function calculateRatingBreakdown(reviews: Review[]) {
  const totalReviews = reviews.length;
  const counts = {
    1: reviews.filter(r => r.stars === 1).length,
    2: reviews.filter(r => r.stars === 2).length,
    3: reviews.filter(r => r.stars === 3).length,
    4: reviews.filter(r => r.stars === 4).length,
    5: reviews.filter(r => r.stars === 5).length
  };
  
  return [
    { rating: 5, count: counts[5], percentage: totalReviews ? (counts[5] / totalReviews) * 100 : 0 },
    { rating: 4, count: counts[4], percentage: totalReviews ? (counts[4] / totalReviews) * 100 : 0 },
    { rating: 3, count: counts[3], percentage: totalReviews ? (counts[3] / totalReviews) * 100 : 0 },
    { rating: 2, count: counts[2], percentage: totalReviews ? (counts[2] / totalReviews) * 100 : 0 },
    { rating: 1, count: counts[1], percentage: totalReviews ? (counts[1] / totalReviews) * 100 : 0 }
  ];
}

// Calculate language distribution statistics
function calculateLanguageDistribution(reviews: Review[]) {
  const totalReviews = reviews.length;
  const languages: Record<string, number> = {};
  
  // Count occurrences of each language
  reviews.forEach(review => {
    const language = review.originalLanguage || "Unknown";
    languages[language] = (languages[language] || 0) + 1;
  });
  
  // Convert to array and calculate percentages
  return Object.entries(languages).map(([language, count]) => ({
    language,
    count,
    percentage: totalReviews ? (count / totalReviews) * 100 : 0
  })).sort((a, b) => b.count - a.count);
}

// Function to get or create analysis
export const getAnalysis = async (reviews: Review[], dateRange?: DateRange): Promise<any> => {
  // Get the AI provider
  const provider = localStorage.getItem("AI_PROVIDER") || "openai";
  
  // Create a cache key
  const dateRangeKey = dateRange ? `_${dateRange.startDate}_${dateRange.endDate}` : '';
  const cacheKey = generateCacheKey(reviews, provider) + dateRangeKey;
  
  // Check if we have a cached result
  const cachedResult = getFromCache(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  
  console.log("No cached result found, performing fresh analysis");
  const analysis = await analyzeReviewsWithAI(reviews, dateRange);
  
  // Store in cache
  storeInCache(cacheKey, analysis);
  
  return analysis;
};
