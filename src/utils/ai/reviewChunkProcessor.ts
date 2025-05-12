
// This file handles processing of review chunks
import { supabase } from "@/integrations/supabase/client";
import { getSelectedModel } from "./aiProviders";

// Define valid table names as a type to avoid TypeScript errors
type ValidTableName = "L'Envol Art Space" | "The Little Prince Cafe" | "Vol de Nuit, The Hidden Bar";

// Validate table name
const isValidTableName = (tableName: string): tableName is ValidTableName => {
  return tableName === "L'Envol Art Space" || 
         tableName === "The Little Prince Cafe" || 
         tableName === "Vol de Nuit, The Hidden Bar";
};

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

// Function to fetch reviews from a specific table
export async function fetchReviewsFromTable(tableName: string): Promise<any[]> {
  if (!isValidTableName(tableName)) {
    console.error(`Invalid table name: ${tableName}`);
    return [];
  }
  
  try {
    const { data, error } = await supabase
      .from(tableName as ValidTableName)
      .select('*');
      
    if (error) {
      console.error(`Error fetching data from ${tableName}:`, error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error(`Failed to fetch reviews from ${tableName}:`, error);
    return [];
  }
}

// Function to update reviews with AI analysis
export async function updateReviewsWithAnalysis(
  tableName: string, 
  reviewUpdates: { reviewUrl: string; sentiment: string; staffMentioned: string; mainThemes: string; }[]
): Promise<{ success: boolean; message: string; }> {
  if (!isValidTableName(tableName)) {
    return { success: false, message: `Invalid table name: ${tableName}` };
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const update of reviewUpdates) {
    try {
      const { error } = await supabase
        .from(tableName as ValidTableName)
        .update({
          sentiment: update.sentiment,
          staffMentioned: update.staffMentioned,
          mainThemes: update.mainThemes
        })
        .eq('reviewUrl', update.reviewUrl);
        
      if (error) {
        console.error(`Error updating review ${update.reviewUrl}:`, error);
        errorCount++;
      } else {
        successCount++;
      }
    } catch (updateError) {
      console.error(`Failed to update review ${update.reviewUrl}:`, updateError);
      errorCount++;
    }
  }
  
  if (errorCount > 0) {
    return { 
      success: successCount > 0, 
      message: `Updated ${successCount} reviews, failed to update ${errorCount} reviews.` 
    };
  }
  
  return { success: true, message: `Successfully updated ${successCount} reviews.` };
}
