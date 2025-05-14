
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, callOpenAI, callAnthropic, callGemini } from "./handlers.ts";
import { 
  generatePrompt, 
  getSystemMessage, 
  parseAIResponse, 
  createCompleteAnalysis,
  extractIndividualReviewAnalysis,
  formatOverallAnalysis 
} from "./prompt-utils.ts";
import { testApiKey, getApiKeyAndModel } from "./api-key-manager.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { action, provider } = requestData;
    
    // Test mode - just check if API key exists/is valid
    if (action === "test") {
      console.log(`Testing ${provider} API key...`);
      
      try {
        await testApiKey(provider, requestData.apiKey);
        
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error(`Error validating ${provider} API key:`, error);
        throw new Error(`Error validating ${provider} API key: ${error.message}`);
      }
    }
    
    // Standard analysis mode
    const { reviews, provider: analysisProvider, fullAnalysis = true, dateRange } = requestData;
    
    // Get the appropriate API key and model
    const { apiKey, model } = getApiKeyAndModel(analysisProvider);
    
    console.log(`Analyzing ${reviews.length} reviews with ${analysisProvider} model: ${model}`);
    
    // Filter reviews by date range if provided
    let filteredReviews = reviews;
    if (dateRange && dateRange.startDate && dateRange.endDate) {
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      
      filteredReviews = reviews.filter(review => {
        const reviewDate = new Date(review.publishedAtDate);
        return reviewDate >= startDate && reviewDate <= endDate;
      });
      
      console.log(`Filtered reviews by date range: ${filteredReviews.length} reviews remain`);
    }
    
    // Get custom prompt if available
    const customPrompt = Deno.env.get("OPENAI_CUSTOM_PROMPT");
    
    // Create the prompt for AI with the review data
    const prompt = generatePrompt(filteredReviews, fullAnalysis, customPrompt);
    
    // Get system message
    const systemMessage = getSystemMessage(fullAnalysis);

    // Call the appropriate AI API based on provider
    let data;
    switch (analysisProvider) {
      case "openai":
        data = await callOpenAI(apiKey, model, systemMessage, prompt);
        break;
      case "anthropic":
        data = await callAnthropic(apiKey, model, systemMessage, prompt);
        break;
      case "gemini":
        data = await callGemini(apiKey, model, systemMessage, prompt);
        break;
      default:
        throw new Error("Unsupported AI provider");
    }

    // Parse the response accordingly
    const analysis = parseAIResponse(data, analysisProvider);

    // Format the overall analysis for better readability
    if (analysis.overallAnalysis) {
      analysis.overallAnalysis = formatOverallAnalysis(analysis.overallAnalysis);
    }

    // If this is a partial analysis, return a complete structure 
    // with empty arrays for the parts not analyzed
    const completeAnalysis = createCompleteAnalysis(analysis, fullAnalysis);
    
    // Calculate rating breakdown and language distribution
    // These will be calculated on the frontend too, but we include them here for completeness
    const ratingBreakdown = filteredReviews.length > 0 ? calculateRatingBreakdown(filteredReviews) : [];
    const languageDistribution = filteredReviews.length > 0 ? calculateLanguageDistribution(filteredReviews) : [];

    // Return the analysis with the additional statistics
    return new Response(JSON.stringify({
      ...completeAnalysis,
      ratingBreakdown,
      languageDistribution,
      provider: analysisProvider,
      model
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("AI analysis failed:", error);
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

// Calculate rating breakdown statistics
function calculateRatingBreakdown(reviews: any[]) {
  const totalReviews = reviews.length;
  const counts = {
    1: reviews.filter(r => r.rating === 1 || r.star === 1).length,
    2: reviews.filter(r => r.rating === 2 || r.star === 2).length,
    3: reviews.filter(r => r.rating === 3 || r.star === 3).length,
    4: reviews.filter(r => r.rating === 4 || r.star === 4).length,
    5: reviews.filter(r => r.rating === 5 || r.star === 5).length
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
function calculateLanguageDistribution(reviews: any[]) {
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
