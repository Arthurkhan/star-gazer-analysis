
// This file handles processing of review chunks
import { supabase } from "@/integrations/supabase/client";
import { getSelectedModel } from "./aiProviders";

// Process a single chunk of reviews
export async function analyzeReviewChunk(
  reviewChunk: any[], 
  provider: string,
  model: string, 
  totalReviewCount: number,
  fullAnalysis: boolean
): Promise<any> {
  console.log(`Calling Edge Function to analyze ${reviewChunk.length} reviews with ${provider}`);
  
  try {
    // Call the Edge Function instead of making direct API calls
    const { data, error } = await supabase.functions.invoke("analyze-reviews", {
      body: {
        reviews: reviewChunk,
        provider: provider,
        model: model,
        fullAnalysis: fullAnalysis
      }
    });
    
    if (error) {
      console.error("Edge Function error:", error);
      throw new Error(`Edge Function error: ${error.message}`);
    }
    
    console.log("AI Analysis Results:", data);
    
    // If this is a partial analysis and we didn't get staffMentions, return empty arrays
    if (!fullAnalysis && (!data || !data.staffMentions)) {
      return {
        sentimentAnalysis: [],
        staffMentions: [],
        commonTerms: [],
        overallAnalysis: "",
      };
    }
    
    // Return the analysis in the expected format
    return {
      sentimentAnalysis: data.sentimentAnalysis || [],
      staffMentions: data.staffMentions || [],
      commonTerms: data.commonTerms || [],
      overallAnalysis: data.overallAnalysis || "",
    };
  } catch (error) {
    console.error("Error calling Edge Function:", error);
    throw error;
  }
}
