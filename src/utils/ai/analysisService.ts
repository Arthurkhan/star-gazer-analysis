// This file combines all the AI analysis functionality
import { Review } from "@/types/reviews";
import { getSelectedModel } from "./aiProviders";
import { analyzeReviewChunk } from "./reviewChunkProcessor";
import { generateCacheKey, getFromCache, storeInCache } from "./analysisCache";

// Main function to analyze existing review data
export const analyzeReviewsWithAI = async (
  reviews: Review[]
): Promise<{
  sentimentAnalysis: { name: string; value: number }[];
  staffMentions: { name: string; count: number; sentiment: "positive" | "negative" | "neutral"; examples?: string[] }[];
  commonTerms: { text: string; count: number }[];
  overallAnalysis: string;
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

    // We'll primarily analyze the existing sentiment, staffMentioned, and mainThemes fields
    console.log(`Processing ${reviews.length} reviews with ${provider}...`);
    
    // First, let's extract and summarize the existing sentiment data
    const sentimentCounts = {
      positive: 0,
      neutral: 0,
      negative: 0
    };
    
    reviews.forEach(review => {
      if (review.sentiment) {
        const sentiment = review.sentiment.toLowerCase();
        if (sentiment === "positive") sentimentCounts.positive++;
        else if (sentiment === "negative") sentimentCounts.negative++;
        else sentimentCounts.neutral++;
      }
    });
    
    const sentimentAnalysis = [
      { name: "Positive", value: sentimentCounts.positive },
      { name: "Neutral", value: sentimentCounts.neutral },
      { name: "Negative", value: sentimentCounts.negative }
    ];
    
    // Extract staff mentions
    const staffMap = new Map();
    reviews.forEach(review => {
      if (review.staffMentioned) {
        const staffList = review.staffMentioned.split(',').map(s => s.trim());
        staffList.forEach(staff => {
          if (staff && staff.length > 0) {
            if (staffMap.has(staff)) {
              staffMap.get(staff).count++;
              
              // Try to determine sentiment
              if (review.sentiment) {
                const currentSentiment = staffMap.get(staff).sentiment;
                const reviewSentiment = (review.sentiment.toLowerCase() as "positive" | "negative" | "neutral");
                
                // Simple majority rule for sentiment
                if (currentSentiment === "neutral") {
                  staffMap.get(staff).sentiment = reviewSentiment;
                } else if (currentSentiment !== reviewSentiment) {
                  staffMap.get(staff).sentiment = "neutral";
                }
              }
              
              // Add example context (text from review)
              if (staffMap.get(staff).examples && staffMap.get(staff).examples.length < 3) {
                const text = review.text.substring(0, 100) + (review.text.length > 100 ? "..." : "");
                staffMap.get(staff).examples.push(text);
              }
            } else {
              staffMap.set(staff, {
                name: staff,
                count: 1,
                sentiment: (review.sentiment?.toLowerCase() as "positive" | "negative" | "neutral") || "neutral",
                examples: [review.text.substring(0, 100) + (review.text.length > 100 ? "..." : "")]
              });
            }
          }
        });
      }
    });
    
    const staffMentions = Array.from(staffMap.values()).sort((a, b) => b.count - a.count);
    
    // Extract common terms/themes
    const termsMap = new Map();
    reviews.forEach(review => {
      if (review.mainThemes) {
        const themesList = review.mainThemes.split(',').map(t => t.trim());
        themesList.forEach(theme => {
          if (theme && theme.length > 0) {
            if (termsMap.has(theme)) {
              termsMap.set(theme, termsMap.get(theme) + 1);
            } else {
              termsMap.set(theme, 1);
            }
          }
        });
      }
    });
    
    const commonTerms = Array.from(termsMap.entries())
      .map(([text, count]) => ({ text, count }))
      .sort((a, b) => b.count - a.count);
    
    // If there's substantial data in the existing columns, we can generate a good analysis
    // Otherwise, we'll make an API call to get a deeper analysis
    if (sentimentAnalysis.some(s => s.value > 0) && 
        staffMentions.length > 0 && 
        commonTerms.length > 0) {
      
      console.log("Using existing data for analysis");
      
      // Calculate percentages
      const totalReviews = sentimentAnalysis.reduce((sum, item) => sum + item.value, 0);
      const positivePercentage = totalReviews > 0 
        ? Math.round((sentimentCounts.positive / totalReviews) * 100) 
        : 0;
      const negativePercentage = totalReviews > 0 
        ? Math.round((sentimentCounts.negative / totalReviews) * 100) 
        : 0;
      
      // Generate a simple overall analysis
      const overallAnalysis = `Analysis based on ${totalReviews} reviews with existing sentiment data:
      
      Sentiment Breakdown:
      - ${positivePercentage}% positive reviews
      - ${negativePercentage}% negative reviews
      - ${100 - positivePercentage - negativePercentage}% neutral reviews
      
      Top Staff Mentioned:
      ${staffMentions.slice(0, 5).map(s => `- ${s.name} (${s.count} mentions, ${s.sentiment} sentiment)`).join('\n')}
      
      Top Themes:
      ${commonTerms.slice(0, 7).map(t => `- ${t.text} (mentioned in ${t.count} reviews)`).join('\n')}
      
      This analysis is based on the existing data in the sentiment, staffMentioned, and mainThemes columns.`;
      
      return {
        sentimentAnalysis,
        staffMentions,
        commonTerms,
        overallAnalysis
      };
    } else {
      // Not enough existing data, use AI to analyze
      console.log("Not enough existing data, using AI for analysis");
      
      // Process reviews in chunks to avoid token limits
      const CHUNK_SIZE = 100;
      const chunks = [];
      for (let i = 0; i < reviews.length; i += CHUNK_SIZE) {
        chunks.push(reviews.slice(i, i + CHUNK_SIZE));
      }
      
      if (chunks.length > 0) {
        const firstChunkResults = await analyzeReviewChunk(
          chunks[0], 
          provider,
          model, 
          reviews.length, 
          true
        );
        
        return firstChunkResults;
      } else {
        // Fallback if no reviews
        return {
          sentimentAnalysis: [],
          staffMentions: [],
          commonTerms: [],
          overallAnalysis: "No review data available for analysis."
        };
      }
    }
  } catch (error) {
    console.error("AI analysis failed:", error);
    
    // Fallback to basic analysis if AI fails
    return {
      sentimentAnalysis: [
        { name: "Positive", value: reviews.filter(r => r.star >= 4).length },
        { name: "Neutral", value: reviews.filter(r => r.star === 3).length },
        { name: "Negative", value: reviews.filter(r => r.star <= 2).length },
      ],
      staffMentions: [],
      commonTerms: [],
      overallAnalysis: "Unable to generate detailed analysis. Using basic rating-based analysis instead. Error: " + error.message,
    };
  }
};

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

// Clear cache and force a refresh of analysis
export const clearCache = (): void => {
  localStorage.removeItem("analysis_cache_key");
  console.log("Analysis cache cleared");
};
