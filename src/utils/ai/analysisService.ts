
// This file combines all the AI analysis functionality
import { Review } from "@/types/reviews";
import { getSelectedModel } from "./aiProviders";
import { generateCacheKey, getFromCache, storeInCache } from "./analysisCache";
import { supabase } from "@/integrations/supabase/client";

// Main function to analyze reviews using AI
export const analyzeReviewsWithAI = async (
  reviews: Review[]
): Promise<{
  sentimentAnalysis: { name: string; value: number }[];
  staffMentions: { name: string; count: number; sentiment: "positive" | "negative" | "neutral"; examples?: string[] }[];
  commonTerms: { text: string; count: number; category?: string }[];
  overallAnalysis: string;
  ratingBreakdown?: { rating: number; count: number; percentage: number }[];
  languageDistribution?: { language: string; count: number; percentage: number }[];
}> => {
  try {
    // Get the AI provider
    const provider = localStorage.getItem("AI_PROVIDER") || "openai";
    
    // Check if the API key exists in localStorage (needed for UI only)
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
      rating: review.star,
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
    
    // Call the Edge Function to analyze the reviews
    const { data, error } = await supabase.functions.invoke("analyze-reviews", {
      body: {
        reviews: reviewTexts,
        provider: provider,
        model: model,
        fullAnalysis: true
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
        { name: "Positive", value: reviews.filter(r => r.star >= 4).length },
        { name: "Neutral", value: reviews.filter(r => r.star === 3).length },
        { name: "Negative", value: reviews.filter(r => r.star <= 2).length },
      ],
      staffMentions: [],
      commonTerms: [],
      overallAnalysis: "Unable to generate detailed analysis. Using basic rating-based analysis instead.",
      ratingBreakdown,
      languageDistribution
    };
  }
};

// Calculate rating breakdown statistics
function calculateRatingBreakdown(reviews: Review[]) {
  const totalReviews = reviews.length;
  const counts = {
    1: reviews.filter(r => r.star === 1).length,
    2: reviews.filter(r => r.star === 2).length,
    3: reviews.filter(r => r.star === 3).length,
    4: reviews.filter(r => r.star === 4).length,
    5: reviews.filter(r => r.star === 5).length
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
export const getAnalysis = async (reviews: Review[]): Promise<any> => {
  // Get the AI provider
  const provider = localStorage.getItem("AI_PROVIDER") || "openai";
  
  // Create a cache key
  const cacheKey = generateCacheKey(reviews, provider);
  
  // Check if we have a cached result
  const cachedResult = getFromCache(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  
  console.log("No cached result found, performing fresh analysis");
  const analysis = await analyzeReviewsWithAI(reviews);
  
  // Store in cache
  storeInCache(cacheKey, analysis);
  
  return analysis;
};
