import React, { memo } from "react";
import { Review } from "@/types/reviews";
import OverviewSection from "@/components/OverviewSection";
import ReviewsTable from "@/components/ReviewsTable";

// Simplified AllReviewsContent component - removed pagination props
const AllReviewsContent: React.FC<{
  reviews: Review[]; 
  chartData: any[];
}> = ({ 
  reviews, 
  chartData
}) => {
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
      {/* Overview section with review stats - simplified props */}
      <OverviewSection reviews={reviews} />
      
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
