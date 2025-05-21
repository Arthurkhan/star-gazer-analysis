import React, { memo, useContext } from "react";
import { Review } from "@/types/reviews";
import OverviewSection from "@/components/OverviewSection";
import ReviewsTable from "@/components/ReviewsTable";
import { useDashboardContext } from "@/contexts/DashboardContext";

// Simplified version to prevent potential infinite loops
const AllReviewsContent: React.FC<{reviews: Review[], chartData: any[]}> = ({ reviews, chartData }) => {
  // Try to get the total review count from context
  let totalReviewCount;
  try {
    // Attempt to use the context to get the total count if available
    const dashboardContext = useDashboardContext();
    totalReviewCount = dashboardContext?.totalReviewCount;
  } catch (e) {
    // Context not available, will use the reviews.length as fallback
    console.warn("Dashboard context not available, using loaded reviews count");
  }
  
  // Empty reviews check to prevent rendering issues
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md bg-muted/20">
        <h3 className="font-medium text-lg mb-2">No Reviews Available</h3>
        <p className="text-muted-foreground">
          Select a business with reviews or refresh the data to view the analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Most essential component */}
      <OverviewSection 
        reviews={reviews} 
        totalReviewCount={totalReviewCount}
      />
      
      {/* Display reviews table */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Review Table</h2>
        <ReviewsTable reviews={reviews} />
      </div>
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(AllReviewsContent);
