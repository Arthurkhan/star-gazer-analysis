
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, callOpenAI, callAnthropic, callGemini } from "./handlers.ts";
import { 
  generatePrompt, 
  getSystemMessage, 
  parseAIResponse, 
  createCompleteAnalysis,
  extractIndividualReviewAnalysis 
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
    
    // Read and analyze existing columns
    if (action === "analyze-existing-columns") {
      const { reviews, tableName, provider: analysisProvider } = requestData;
      
      if (!reviews || !tableName) {
        throw new Error("Missing required parameters: reviews and tableName");
      }
      
      // Get the appropriate API key and model
      const { apiKey, model } = getApiKeyAndModel(analysisProvider);
      
      console.log(`Analyzing existing data from ${reviews.length} reviews with ${analysisProvider} model: ${model} for table: ${tableName}`);
      
      // Create the prompt for AI focused on analyzing existing data
      const prompt = `
        Analyze these ${reviews.length} reviews from ${tableName} that already have sentiment, staff mentioned, and theme analysis data:
        ${JSON.stringify(reviews)}
        
        Please provide:
        1. A sentiment breakdown summary with counts for positive, neutral, and negative reviews
        2. A consolidated list of staff members mentioned across all reviews with:
           - The staff member's name
           - How many times they were mentioned
           - The overall sentiment about them
        3. The top themes found across all reviews with their frequency
        4. An overall analysis of the review trends
        
        Format the response as a JSON object.
      `;
      
      // Get system message
      const systemMessage = "You are a review analysis assistant that analyzes existing sentiment, staff mention, and theme data from customer reviews.";

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
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          analysis
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Standard analysis mode
    const { reviews, provider: analysisProvider, fullAnalysis = true } = requestData;
    
    // Get the appropriate API key and model
    const { apiKey, model } = getApiKeyAndModel(analysisProvider);
    
    console.log(`Analyzing ${reviews.length} reviews with ${analysisProvider} model: ${model}`);
    
    // Get custom prompt if available
    const customPrompt = Deno.env.get("OPENAI_CUSTOM_PROMPT");
    
    // Create the prompt for AI with the review data
    const prompt = generatePrompt(reviews, fullAnalysis, customPrompt);
    
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
