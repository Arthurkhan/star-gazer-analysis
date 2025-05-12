
// This file combines all the AI analysis functionality
import { Review } from "@/types/reviews";
import { getSelectedModel } from "./aiProviders";
import { analyzeReviewChunk } from "./reviewChunkProcessor";
import { generateCacheKey, getFromCache, storeInCache } from "./analysisCache";

// Main function to analyze reviews using AI
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
