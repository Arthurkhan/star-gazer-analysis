
import { supabase } from "@/integrations/supabase/client";
import { TableName } from "@/types/reviews";
import { toast } from "sonner";

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

    // Clear cache to force fresh analysis
    localStorage.removeItem("analysis_cache_key");

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

// Function to analyze and update all reviews in a table
export const analyzeAndUpdateTable = async (
  tableName: TableName,
  reviews: any[]
): Promise<{ success: boolean; errors: string[] }> => {
  console.log(`Analyzing and updating ${reviews.length} reviews in table ${tableName}`);
  
  try {
    // Show notification
    toast.info(`Starting analysis of ${reviews.length} reviews`, {
      description: "This may take a moment to complete",
      duration: 3000
    });
    
    // Clear cache to force fresh analysis
    localStorage.removeItem("analysis_cache_key");
    
    // Call updateReviewsWithAnalysis to handle the analysis and database update
    const result = await updateReviewsWithAnalysis(tableName, reviews, {});
    
    if (!result.success) {
      toast.error("Analysis failed", {
        description: result.message,
        duration: 4000
      });
      
      return {
        success: false,
        errors: [result.message]
      };
    }
    
    // Show success notification
    toast.success("Analysis completed", {
      description: `Successfully updated ${result.updatedCount} reviews with AI insights`,
      duration: 4000
    });
    
    return {
      success: true,
      errors: []
    };
  } catch (error) {
    console.error("Error during analysis and update:", error);
    
    toast.error("Analysis failed", {
      description: error instanceof Error ? error.message : String(error),
      duration: 4000
    });
    
    return {
      success: false,
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
};
