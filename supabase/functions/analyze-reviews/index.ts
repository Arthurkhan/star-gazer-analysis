
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, callOpenAI, callAnthropic, callGemini } from "./handlers.ts";
import { generatePrompt, getSystemMessage, parseAIResponse, createCompleteAnalysis } from "./prompt-utils.ts";
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
