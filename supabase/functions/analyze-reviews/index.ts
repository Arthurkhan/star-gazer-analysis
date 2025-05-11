
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reviews, provider, fullAnalysis = true } = await req.json();
    
    // Get the appropriate API key from Supabase secrets
    let apiKey;
    let model;
    
    switch (provider) {
      case "openai":
        apiKey = Deno.env.get("OPENAI_API_KEY");
        model = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
        break;
      case "anthropic":
        apiKey = Deno.env.get("ANTHROPIC_API_KEY");
        model = Deno.env.get("ANTHROPIC_MODEL") || "claude-3-haiku-20240307";
        break;
      case "gemini":
        apiKey = Deno.env.get("GEMINI_API_KEY");
        model = Deno.env.get("GEMINI_MODEL") || "gemini-1.5-flash";
        break;
      default:
        throw new Error("Unsupported AI provider");
    }
    
    if (!apiKey) {
      throw new Error(`API key not found for ${provider}`);
    }
    
    console.log(`Analyzing ${reviews.length} reviews with ${provider} model: ${model}`);
    
    // Get custom prompt if available
    const customPrompt = Deno.env.get("OPENAI_CUSTOM_PROMPT");
    
    // Create the prompt for AI with the review data
    const reviewsJSON = JSON.stringify(reviews);
    
    let prompt;
    if (customPrompt && customPrompt.includes("[REVIEWS]")) {
      // Use custom prompt with reviews inserted
      prompt = customPrompt.replace("[REVIEWS]", reviewsJSON);
    } else {
      // Use default structured prompt
      prompt = `
        Analyze these ${reviews.length} customer reviews:
        ${reviewsJSON}
        
        ${fullAnalysis ? `
        Please provide:
        1. A sentiment breakdown with exact counts for positive, neutral, and negative reviews
        2. A detailed list of staff members mentioned in the reviews with:
           - The exact name of each staff member as mentioned in reviews
           - The count of distinct mentions
           - Overall sentiment toward each staff member (positive/neutral/negative)
           - 2-3 exact quotes from reviews that mention each staff member
        3. Common terms/themes mentioned in reviews with their frequency
        4. A brief overall analysis of the review trends
        ` : `
        FOCUS ONLY ON STAFF MENTIONS in these reviews. Please identify:
        - The exact name of each staff member mentioned in reviews
        - The count of distinct mentions for each staff member
        - Overall sentiment toward each staff member (positive/neutral/negative)
        - 2-3 exact quotes from reviews that mention each staff member
        `}
        
        Format the response as a JSON with the following structure:
        ${fullAnalysis ? `
        {
          "sentimentAnalysis": [{"name": "Positive", "value": number}, {"name": "Neutral", "value": number}, {"name": "Negative", "value": number}],
          "staffMentions": [{"name": "staff name", "count": number, "sentiment": "positive"|"neutral"|"negative", "examples": ["example quote 1", "example quote 2"]}, ...],
          "commonTerms": [{"text": "term", "count": number}, ...],
          "overallAnalysis": "text analysis"
        }
        ` : `
        {
          "staffMentions": [{"name": "staff name", "count": number, "sentiment": "positive"|"neutral"|"negative", "examples": ["example quote 1", "example quote 2"]}, ...]
        }
        `}
        
        IMPORTANT GUIDELINES FOR STAFF EXTRACTION:
        - Only include actual staff members (people working at the business), not generic mentions like "staff" or "server"
        - For each staff member, include exact quotes from reviews where they are mentioned
        - If someone seems to be a customer rather than staff, do not include them
        - If no staff are mentioned by name in any review, return an empty array for staffMentions
        - Look very carefully for names of individual staff members in the review text
        - Pay special attention to sentences that mention service, employees, or contain phrases like "our waiter", "our server", etc.
      `;
    }

    // System message that instructs the AI about the task
    const systemMessage = fullAnalysis
      ? "You are an AI assistant that analyzes customer reviews and extracts insights. You're particularly good at identifying staff members mentioned by name and analyzing sentiment about them. Respond only with the requested JSON format."
      : "You are an AI assistant that identifies staff members mentioned in customer reviews. Your only task is to extract mentions of individual staff members by name. Respond only with the requested JSON format.";

    // Call the appropriate AI API based on provider
    let data;
    switch (provider) {
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
    let analysis;
    try {
      if (provider === "anthropic") {
        analysis = JSON.parse(data.content[0].text);
      } else if (provider === "gemini") {
        analysis = JSON.parse(data.candidates[0].content.parts[0].text);
      } else { // OpenAI
        analysis = JSON.parse(data.choices[0].message.content);
      }
    } catch (parseError) {
      console.error(`Failed to parse ${provider} response as JSON:`, parseError);
      console.log("Raw content that couldn't be parsed:", JSON.stringify(data));
      throw new Error(`Failed to parse ${provider} response`);
    }

    // If this is a partial analysis, return a complete structure 
    // with empty arrays for the parts not analyzed
    if (!fullAnalysis) {
      analysis = {
        sentimentAnalysis: [],
        staffMentions: analysis.staffMentions || [],
        commonTerms: [],
        overallAnalysis: "",
      };
    }

    // Return the analysis
    return new Response(JSON.stringify(analysis), {
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

// Call OpenAI API
async function callOpenAI(apiKey: string, model: string, systemMessage: string, prompt: string) {
  console.log("Calling OpenAI API...");
  
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: "system",
          content: systemMessage
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error(`OpenAI API call failed with status: ${response.status}`, errorData);
    throw new Error(`OpenAI API call failed with status: ${response.status}. Details: ${errorData}`);
  }

  return await response.json();
}

// Call Anthropic API
async function callAnthropic(apiKey: string, model: string, systemMessage: string, prompt: string) {
  console.log("Calling Anthropic API...");
  
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: model,
      system: systemMessage,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error(`Anthropic API call failed with status: ${response.status}`, errorData);
    throw new Error(`Anthropic API call failed with status: ${response.status}. Details: ${errorData}`);
  }

  return await response.json();
}

// Call Gemini API
async function callGemini(apiKey: string, model: string, systemMessage: string, prompt: string) {
  console.log("Calling Gemini API...");
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: `${systemMessage}\n\n${prompt}` }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4000,
      }
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error(`Gemini API call failed with status: ${response.status}`, errorData);
    throw new Error(`Gemini API call failed with status: ${response.status}. Details: ${errorData}`);
  }

  return await response.json();
}
