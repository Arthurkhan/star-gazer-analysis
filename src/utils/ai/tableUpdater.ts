import { supabase } from "@/integrations/supabase/client";
import { TableName } from "@/components/TableAnalysisPanel";

// Interface for the review data from the Edge Function
interface ReviewAnalysis {
  reviewUrl: string;
  sentiment: string;
  staffMentioned: string;
  mainThemes: string;
}

/**
 * Updates the database table with AI analysis results
 * @param tableName The name of the table to update
 * @param reviewAnalyses Array of review analyses with the reviewUrl as the identifier
 * @returns Object containing success status and counts
 */
export const updateReviewsTable = async (
  tableName: TableName,
  reviewAnalyses: ReviewAnalysis[]
): Promise<{ success: boolean; updatedCount: number; errors: string[] }> => {
  const errors: string[] = [];
  let updatedCount = 0;
  
  // Validate table name to prevent SQL injection
  const validTables: TableName[] = ["L'Envol Art Space", "The Little Prince Cafe", "Vol de Nuit, The Hidden Bar"];
  if (!validTables.includes(tableName)) {
    return {
      success: false,
      updatedCount: 0,
      errors: [`Invalid table name: ${tableName}`]
    };
  }
  
  // Process updates in batches to avoid overwhelming the database
  const batchSize = 20;
  const batches = [];
  
  for (let i = 0; i < reviewAnalyses.length; i += batchSize) {
    batches.push(reviewAnalyses.slice(i, i + batchSize));
  }
  
  console.log(`Processing ${reviewAnalyses.length} reviews in ${batches.length} batches`);
  
  for (const batch of batches) {
    try {
      // Update each review in the batch
      for (const analysis of batch) {
        const { data, error } = await supabase
          .from(tableName)
          .update({
            sentiment: analysis.sentiment,
            staffMentioned: analysis.staffMentioned,
            mainThemes: analysis.mainThemes
          })
          .eq('reviewUrl', analysis.reviewUrl);
        
        if (error) {
          console.error(`Error updating review with URL ${analysis.reviewUrl}:`, error);
          errors.push(`Failed to update review: ${error.message}`);
        } else {
          updatedCount++;
        }
      }
    } catch (error) {
      console.error("Batch update error:", error);
      errors.push(`Batch update failed: ${error.message}`);
    }
  }
  
  return {
    success: errors.length === 0,
    updatedCount,
    errors
  };
};

/**
 * Analyzes reviews for a table and updates the AI analysis columns
 * @param tableName The table to analyze and update
 * @param reviews The reviews to analyze
 * @returns Object with the update results
 */
export const analyzeAndUpdateTable = async (
  tableName: TableName,
  reviews: any[]
): Promise<{
  success: boolean;
  message: string;
  updatedCount: number;
  errors: string[];
}> => {
  try {
    // Skip if no reviews to process
    if (!reviews || reviews.length === 0) {
      return {
        success: true,
        message: "No reviews to process",
        updatedCount: 0,
        errors: []
      };
    }
    
    console.log(`Analyzing and updating ${reviews.length} reviews for table ${tableName}`);
    
    // Get the AI provider from localStorage
    const provider = localStorage.getItem("AI_PROVIDER") || "openai";
    
    // Call the Edge Function to analyze the reviews
    const { data, error } = await supabase.functions.invoke("analyze-reviews", {
      body: {
        action: "update-review-columns",
        tableName,
        reviews,
        provider
      }
    });
    
    if (error) {
      console.error("Error calling analyze-reviews Edge Function:", error);
      return {
        success: false,
        message: `Error analyzing reviews: ${error.message}`,
        updatedCount: 0,
        errors: [error.message]
      };
    }
    
    // Update the database with the analysis results
    const updateResult = await updateReviewsTable(tableName, data.reviewAnalyses);
    
    return {
      success: updateResult.success,
      message: `Successfully analyzed and updated ${updateResult.updatedCount} reviews`,
      updatedCount: updateResult.updatedCount,
      errors: updateResult.errors
    };
  } catch (error) {
    console.error("Error in analyzeAndUpdateTable:", error);
    return {
      success: false,
      message: `Error: ${error.message}`,
      updatedCount: 0,
      errors: [error.message]
    };
  }
};
