
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
    
    // New action for updating review columns
    if (action === "update-review-columns") {
      const { reviews, tableName, provider: analysisProvider } = requestData;
      
      if (!reviews || !tableName) {
        throw new Error("Missing required parameters: reviews and tableName");
      }
      
      // Get the appropriate API key and model
      const { apiKey, model } = getApiKeyAndModel(analysisProvider);
      
      console.log(`Analyzing ${reviews.length} reviews with ${analysisProvider} model: ${model} for table: ${tableName}`);
      
      // Create the prompt for AI with the review data
      const prompt = generatePrompt(reviews, true);
      
      // Get system message
      const systemMessage = getSystemMessage(true);

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

      // Parse the response
      const analysis = parseAIResponse(data, analysisProvider);
      
      // Format the overall analysis for better readability
      if (analysis.overallAnalysis) {
        analysis.overallAnalysis = formatOverallAnalysis(analysis.overallAnalysis);
      }
      
      // Create individual review analyses for database updates
      const reviewAnalyses = reviews.map(review => {
        const individualAnalysis = extractIndividualReviewAnalysis(review, analysis);
        return {
          reviewUrl: review.reviewUrl, // Primary key for updates
          ...individualAnalysis
        };
      });
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          analysisResults: analysis,
          reviewAnalyses 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    // Return the analysis
    return new Response(JSON.stringify(completeAnalysis), {
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
