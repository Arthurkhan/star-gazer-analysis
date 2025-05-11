
import { Review } from "@/types/reviews";

// Function to analyze reviews using various AI providers
export const analyzeReviewsWithOpenAI = async (
  reviews: Review[]
): Promise<{
  sentimentAnalysis: { name: string; value: number }[];
  staffMentions: { name: string; count: number; sentiment: "positive" | "negative" | "neutral"; examples?: string[] }[];
  commonTerms: { text: string; count: number }[];
  overallAnalysis: string;
}> => {
  try {
    // Get the AI provider and API key
    const provider = localStorage.getItem("AI_PROVIDER") || "openai";
    const apiKey = getApiKey(provider);
    
    if (!apiKey) {
      console.error(`No API key found for ${provider}. Please set up your API key in the settings.`);
      throw new Error(`API key not found for ${provider}`);
    }

    // Get the selected model based on provider
    const model = getSelectedModel(provider);
    console.log(`Using ${provider} model: ${model}`);

    // Prepare all reviews for API, but we'll process them in chunks
    const reviewTexts = reviews.map(review => ({
      text: review.text,
      rating: review.star,
      date: review.publishedAtDate
    }));

    console.log(`Processing ${reviewTexts.length} reviews with ${provider}...`);
    
    // Process reviews in chunks to avoid token limits
    const CHUNK_SIZE = 100;
    const chunks = [];
    for (let i = 0; i < reviewTexts.length; i += CHUNK_SIZE) {
      chunks.push(reviewTexts.slice(i, i + CHUNK_SIZE));
    }
    
    console.log(`Split reviews into ${chunks.length} chunks for processing`);
    
    // If there are multiple chunks, we'll analyze each one and then combine results
    if (chunks.length > 1) {
      console.log("Multiple chunks detected - analyzing in sequence");
      
      // Analyze the first chunk with the complete analysis
      const firstChunkResults = await analyzeReviewChunk(
        chunks[0], 
        provider,
        apiKey, 
        model, 
        reviews.length, 
        true
      );
      
      let combinedResults = { ...firstChunkResults };
      
      // Now process the remaining chunks for staff mentions only
      if (chunks.length > 1) {
        let allStaffMentions = [...firstChunkResults.staffMentions];
        
        // Process remaining chunks
        for (let i = 1; i < chunks.length; i++) {
          console.log(`Processing chunk ${i+1}/${chunks.length}...`);
          const chunkResults = await analyzeReviewChunk(
            chunks[i], 
            provider,
            apiKey, 
            model, 
            reviews.length, 
            false
          );
          
          // Merge staff mentions
          if (chunkResults.staffMentions && chunkResults.staffMentions.length > 0) {
            // Build a map of staff names we already have
            const existingStaff = new Map();
            allStaffMentions.forEach(staff => {
              existingStaff.set(staff.name.toLowerCase(), staff);
            });
            
            // Add or merge new staff mentions
            chunkResults.staffMentions.forEach(newStaff => {
              const lowerName = newStaff.name.toLowerCase();
              if (existingStaff.has(lowerName)) {
                // Staff already exists, merge the data
                const existing = existingStaff.get(lowerName);
                existing.count += newStaff.count;
                
                // Add new examples if they exist
                if (newStaff.examples && existing.examples) {
                  // Add non-duplicate examples
                  newStaff.examples.forEach(example => {
                    if (!existing.examples.includes(example)) {
                      existing.examples.push(example);
                    }
                  });
                  
                  // Limit to 5 examples max
                  existing.examples = existing.examples.slice(0, 5);
                }
                
                // Recalculate sentiment if needed
                // This is simplistic - in a real app we might weight by counts
                if (existing.sentiment !== newStaff.sentiment) {
                  existing.sentiment = "neutral";
                }
              } else {
                // New staff member, add to our list
                allStaffMentions.push(newStaff);
              }
            });
          }
        }
        
        // Update the combined results with all staff mentions
        combinedResults.staffMentions = allStaffMentions;
        
        // Add a note to the overall analysis about processing in chunks
        combinedResults.overallAnalysis += "\n\nNote: This analysis was performed on " + 
          `${reviews.length} reviews processed in ${chunks.length} chunks of up to ${CHUNK_SIZE} reviews each.`;
      }
      
      return combinedResults;
    } else {
      // Just one chunk, process normally
      console.log("Single chunk processing");
      return await analyzeReviewChunk(
        chunks[0], 
        provider,
        apiKey, 
        model, 
        reviews.length, 
        true
      );
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

// Helper function to get API key based on provider
function getApiKey(provider: string): string {
  switch (provider) {
    case "openai":
      return localStorage.getItem("OPENAI_API_KEY") || "";
    case "anthropic":
      return localStorage.getItem("ANTHROPIC_API_KEY") || "";
    case "gemini":
      return localStorage.getItem("GEMINI_API_KEY") || "";
    default:
      return "";
  }
}

// Helper function to get selected model based on provider
function getSelectedModel(provider: string): string {
  switch (provider) {
    case "openai":
      return localStorage.getItem("OPENAI_MODEL") || "gpt-4o-mini";
    case "anthropic":
      return localStorage.getItem("ANTHROPIC_MODEL") || "claude-3-haiku-20240307";
    case "gemini":
      return localStorage.getItem("GEMINI_MODEL") || "gemini-1.5-flash";
    default:
      return "";
  }
}

// Helper function to analyze a single chunk of reviews
async function analyzeReviewChunk(
  reviewChunk: any[], 
  provider: string,
  apiKey: string, 
  model: string, 
  totalReviewCount: number,
  fullAnalysis: boolean
): Promise<any> {
  // Get custom prompt if available, otherwise use default
  let promptTemplate = localStorage.getItem("OPENAI_CUSTOM_PROMPT");
  
  // Create the prompt for AI with the review data
  const reviewsJSON = JSON.stringify(reviewChunk);
  
  let prompt;
  if (promptTemplate && promptTemplate.includes("[REVIEWS]")) {
    // Use custom prompt with reviews inserted
    prompt = promptTemplate.replace("[REVIEWS]", reviewsJSON);
  } else {
    // Use default structured prompt
    prompt = `
      Analyze these ${reviewChunk.length} customer reviews from a total of ${totalReviewCount} reviews:
      ${reviewsJSON}
      
      Please provide:
      1. A sentiment breakdown with exact counts for positive, neutral, and negative reviews
      2. A detailed list of staff members mentioned in the reviews with:
         - The exact name of each staff member as mentioned in reviews
         - The count of distinct mentions
         - Overall sentiment toward each staff member (positive/neutral/negative)
         - 2-3 exact quotes from reviews that mention each staff member
      3. Common terms/themes mentioned in reviews with their frequency
      4. A brief overall analysis of the review trends
      
      Format the response as a JSON with the following structure:
      {
        "sentimentAnalysis": [{"name": "Positive", "value": number}, {"name": "Neutral", "value": number}, {"name": "Negative", "value": number}],
        "staffMentions": [{"name": "staff name", "count": number, "sentiment": "positive"|"neutral"|"negative", "examples": ["example quote 1", "example quote 2"]}, ...],
        "commonTerms": [{"text": "term", "count": number}, ...],
        "overallAnalysis": "text analysis"
      }
      
      IMPORTANT GUIDELINES FOR STAFF EXTRACTION:
      - Only include actual staff members (people working at the business), not generic mentions like "staff" or "server"
      - For each staff member, include exact quotes from reviews where they are mentioned
      - If someone seems to be a customer rather than staff, do not include them
      - If no staff are mentioned by name in any review, return an empty array for staffMentions
      - Look very carefully for names of individual staff members in the review text
      - Pay special attention to sentences that mention service, employees, or contain phrases like "our waiter", "our server", etc.
      - Look specifically for mentions of staff like "Laura", "Arnaud", "Nazare-Aga", and any other names of people who work at the establishment
    `;
  }
  
  // For partial analysis (not the first chunk), focus only on staff mentions
  if (!fullAnalysis) {
    prompt = `
      Analyze these ${reviewChunk.length} customer reviews from a total of ${totalReviewCount} reviews:
      ${reviewsJSON}
      
      FOCUS ONLY ON STAFF MENTIONS in these reviews. Please identify:
      - The exact name of each staff member mentioned in reviews
      - The count of distinct mentions for each staff member
      - Overall sentiment toward each staff member (positive/neutral/negative)
      - 2-3 exact quotes from reviews that mention each staff member
      
      Format the response as a JSON with the following structure:
      {
        "staffMentions": [{"name": "staff name", "count": number, "sentiment": "positive"|"neutral"|"negative", "examples": ["example quote 1", "example quote 2"]}, ...]
      }
      
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

  console.log("AI Analysis Results:", data);

  let analysis;
  try {
    // For different providers, parse the response accordingly
    if (provider === "anthropic") {
      analysis = JSON.parse(data.content[0].text);
    } else if (provider === "gemini") {
      analysis = JSON.parse(data.candidates[0].content.parts[0].text);
    } else { // OpenAI
      analysis = JSON.parse(data.choices[0].message.content);
    }
    
    console.log("Parsed AI Analysis Results:", analysis);
  } catch (parseError) {
    console.error(`Failed to parse ${provider} response as JSON:`, parseError);
    console.log("Raw content that couldn't be parsed:", JSON.stringify(data));
    throw new Error(`Failed to parse ${provider} response`);
  }

  // If this is a partial analysis, return a complete structure 
  // with empty arrays for the parts not analyzed
  if (!fullAnalysis) {
    return {
      sentimentAnalysis: [],
      staffMentions: analysis.staffMentions || [],
      commonTerms: [],
      overallAnalysis: "",
    };
  }

  // Return the analysis in the expected format
  return {
    sentimentAnalysis: analysis.sentimentAnalysis || [],
    staffMentions: analysis.staffMentions || [],
    commonTerms: analysis.commonTerms || [],
    overallAnalysis: analysis.overallAnalysis || "",
  };
}

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

// Cache for analysis results to avoid repeated API calls
const analysisCache = new Map<string, any>();

// Function to get or create analysis
export const getAnalysis = async (reviews: Review[]): Promise<any> => {
  // Create a cache key based on the number of reviews, a few review IDs, and a timestamp
  // This will be cleared whenever the refresh button is clicked
  const cacheTimestamp = localStorage.getItem("analysis_cache_key") || Date.now().toString();
  const provider = localStorage.getItem("AI_PROVIDER") || "openai";
  const cacheKey = `${provider}_${reviews.length}_${reviews.slice(0, 3).map(r => r.publishedAtDate).join('_')}_${cacheTimestamp}`;
  
  if (analysisCache.has(cacheKey)) {
    console.log("Using cached analysis result");
    return analysisCache.get(cacheKey);
  }
  
  console.log("No cached result found, performing fresh analysis");
  const analysis = await analyzeReviewsWithOpenAI(reviews);
  
  // Store in cache with the timestamp-based key
  analysisCache.set(cacheKey, analysis);
  
  // Update cache timestamp for next time
  localStorage.setItem("analysis_cache_key", Date.now().toString());
  
  return analysis;
};
