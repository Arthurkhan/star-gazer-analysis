
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, callOpenAI, callAnthropic, callGemini } from "./handlers.ts";
import { 
  generatePrompt, 
  getSystemMessage, 
  parseAIResponse, 
  createCompleteAnalysis,
  formatOverallAnalysis
} from "./prompt-utils.ts";
import { testApiKey, getApiKeyAndModel } from "./api-key-manager.ts";

// Simple in-memory cache for analysis results
const analysisCache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache TTL

// Storage for custom prompt
let customPrompt = "";

interface Review {
  rating?: number;
  stars?: number;
  date?: string;
  reviewUrl?: string;
  language?: string;
  originalLanguage?: string;
}

interface RequestData {
  action?: string;
  provider?: string;
  prompt?: string;
  apiKey?: string;
  reviews?: Review[];
  fullAnalysis?: boolean;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  reportType?: string;
  comparisonData?: unknown;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: RequestData = await req.json();
    const { action, provider } = requestData;
    
    // Handle custom prompt operations
    if (action === "get-prompt") {
      return new Response(
        JSON.stringify({ prompt: customPrompt || Deno.env.get("OPENAI_CUSTOM_PROMPT") || "" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (action === "set-prompt") {
      customPrompt = requestData.prompt || "";
      
      // Also store in env for persistence across cold starts
      if (Deno.env.get("SUPABASE_URL")) {
        Deno.env.set("OPENAI_CUSTOM_PROMPT", customPrompt);
      }
      
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Test mode - just check if API key exists/is valid
    if (action === "test") {
      // Testing API key...
      
      try {
        await testApiKey(provider!, requestData.apiKey!);
        
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        // Error validating API key
        throw new Error(`Error validating ${provider} API key: ${error.message}`);
      }
    }
    
    // Standard analysis mode
    const { 
      reviews = [], 
      provider: analysisProvider, 
      fullAnalysis = true, 
      dateRange,
      reportType = 'standard', // New parameter for report type
      comparisonData,
      apiKey: requestApiKey // ACCEPT API KEY FROM REQUEST
    } = requestData;
    
    // Get the appropriate API key and model - PASS REQUEST API KEY
    const { apiKey, model } = getApiKeyAndModel(analysisProvider!, requestApiKey);
    
    // Filter reviews by date range if provided
    let filteredReviews = reviews;
    if (dateRange && dateRange.startDate && dateRange.endDate) {
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      
      filteredReviews = reviews.filter((review: Review) => {
        const reviewDate = new Date(review.date!);
        return reviewDate >= startDate && reviewDate <= endDate;
      });
      
      // Filtered reviews by date range
    }
    
    // Create a cache key based on the request parameters
    const cacheKey = JSON.stringify({
      reviewIds: filteredReviews.map((r: Review) => r.date || r.reviewUrl).sort(),
      provider: analysisProvider,
      model,
      fullAnalysis,
      reportType,
      dateRange,
      customPrompt
    });
    
    // Check if we have a cached result
    const cachedResult = analysisCache.get(cacheKey);
    if (cachedResult && cachedResult.timestamp > Date.now() - CACHE_TTL) {
      // Returning cached analysis result
      return new Response(
        JSON.stringify(cachedResult.data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Analyzing reviews with AI
    
    // Get custom prompt if available - first from memory, then from env var
    const currentCustomPrompt = customPrompt || Deno.env.get("OPENAI_CUSTOM_PROMPT");
    
    // Create the prompt for AI with the review data
    const prompt = generatePrompt(filteredReviews, fullAnalysis, reportType, dateRange, currentCustomPrompt, comparisonData);
    
    // Get system message
    const systemMessage = getSystemMessage(fullAnalysis, reportType);

    // Use background task to avoid timeout for large analysis jobs
    let analysisPromise;
    
    // Call the appropriate AI API based on provider
    switch (analysisProvider) {
      case "openai":
        analysisPromise = callOpenAI(apiKey, model, systemMessage, prompt);
        break;
      case "anthropic":
        analysisPromise = callAnthropic(apiKey, model, systemMessage, prompt);
        break;
      case "gemini":
        analysisPromise = callGemini(apiKey, model, systemMessage, prompt);
        break;
      default:
        throw new Error("Unsupported AI provider");
    }
    
    // Run the analysis
    const data = await analysisPromise;

    // Parse the response accordingly
    const analysis = parseAIResponse(data, analysisProvider!);

    // Format the overall analysis for better readability
    if (analysis.overallAnalysis) {
      analysis.overallAnalysis = formatOverallAnalysis(analysis.overallAnalysis);
    }

    // If this is a partial analysis, return a complete structure 
    // with empty arrays for the parts not analyzed
    const completeAnalysis = createCompleteAnalysis(analysis, fullAnalysis);
    
    // Calculate rating breakdown and language distribution
    const ratingBreakdown = filteredReviews.length > 0 ? calculateRatingBreakdown(filteredReviews) : [];
    const languageDistribution = filteredReviews.length > 0 ? calculateLanguageDistribution(filteredReviews) : [];

    // Create the final response object
    const responseObject = {
      ...completeAnalysis,
      ratingBreakdown,
      languageDistribution,
      provider: analysisProvider,
      model,
      reportType,
      usingCustomPrompt: !!currentCustomPrompt
    };
    
    // Save to cache
    analysisCache.set(cacheKey, {
      timestamp: Date.now(),
      data: responseObject
    });
    
    // Return the analysis with the additional statistics
    return new Response(JSON.stringify(responseObject), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // AI analysis failed
    return new Response(
      JSON.stringify({
        error: error.message,
        sentimentAnalysis: [],
        staffMentions: [],
        commonTerms: [],
        overallAnalysis: "Error generating analysis: " + error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Calculate rating breakdown statistics - FIXED STAR/STARS REFERENCES
function calculateRatingBreakdown(reviews: Review[]) {
  const totalReviews = reviews.length;
  const counts = {
    1: reviews.filter(r => r.rating === 1 || r.stars === 1).length,
    2: reviews.filter(r => r.rating === 2 || r.stars === 2).length,
    3: reviews.filter(r => r.rating === 3 || r.stars === 3).length,
    4: reviews.filter(r => r.rating === 4 || r.stars === 4).length,
    5: reviews.filter(r => r.rating === 5 || r.stars === 5).length
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
    const language = review.language || review.originalLanguage || "Unknown";
    languages[language] = (languages[language] || 0) + 1;
  });
  
  // Convert to array and calculate percentages
  return Object.entries(languages).map(([language, count]) => ({
    language,
    count,
    percentage: totalReviews ? (count / totalReviews) * 100 : 0
  })).sort((a, b) => b.count - a.count);
}
