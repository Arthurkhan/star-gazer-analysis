
import { supabase } from "@/integrations/supabase/client";
import { TableName } from "@/types/reviews";

// Function to update database with AI analysis results
export const updateReviewsWithAnalysis = async (
  tableName: TableName, 
  reviews: any[], 
  analysisResults: any
): Promise<{ success: boolean; message: string; updatedCount: number }> => {
  console.log(`Updating ${reviews.length} reviews in table ${tableName}`);
  
  try {
    // Check if reviews have required data
    if (!reviews || reviews.length === 0) {
      return {
        success: false,
        message: "No reviews provided for update",
        updatedCount: 0
      };
    }

    // Call the Edge Function to get individual review analyses
    const { data, error } = await supabase.functions.invoke("analyze-reviews", {
      body: {
        action: "update-review-columns",
        tableName,
        reviews,
        provider: localStorage.getItem("AI_PROVIDER") || "openai"
      }
    });
    
    if (error) {
      console.error("Edge function error:", error);
      return {
        success: false,
        message: `Error from edge function: ${error.message}`,
        updatedCount: 0
      };
    }
    
    // Check response data
    if (!data || !data.success || !data.reviewAnalyses) {
      console.error("Invalid response from edge function:", data);
      return {
        success: false,
        message: "Invalid response from analysis function",
        updatedCount: 0
      };
    }
    
    console.log("Received analysis for reviews:", data.reviewAnalyses.length);
    
    // Update reviews in database
    let updatedCount = 0;
    
    for (const analysis of data.reviewAnalyses) {
      // We use reviewUrl as the primary key for updates
      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          sentiment: analysis.sentiment,
          staffMentioned: analysis.staffMentioned,
          mainThemes: analysis.mainThemes
        })
        .eq('reviewUrl', analysis.reviewUrl);
      
      if (updateError) {
        console.error(`Error updating review ${analysis.reviewUrl}:`, updateError);
      } else {
        updatedCount++;
      }
    }
    
    return {
      success: true,
      message: `Successfully updated ${updatedCount} out of ${reviews.length} reviews`,
      updatedCount
    };
    
  } catch (error) {
    console.error("Error updating reviews:", error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      updatedCount: 0
    };
  }
};

// Add the missing analyzeAndUpdateTable function
export const analyzeAndUpdateTable = async (
  tableName: TableName,
  reviews: any[]
): Promise<{ success: boolean; errors: string[] }> => {
  console.log(`Analyzing ${reviews.length} reviews in table ${tableName}`);
  
  try {
    // Call updateReviewsWithAnalysis to handle the analysis and database update
    const result = await updateReviewsWithAnalysis(tableName, reviews, {});
    
    if (!result.success) {
      return {
        success: false,
        errors: [result.message]
      };
    }
    
    return {
      success: true,
      errors: []
    };
  } catch (error) {
    console.error("Error during analysis and update:", error);
    return {
      success: false,
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
};
