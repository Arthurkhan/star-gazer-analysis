import React, { memo } from "react";
import { Review } from "@/types/reviews";
import OverviewSection from "@/components/OverviewSection";
import ReviewsTable from "@/components/ReviewsTable";
import AnalysisSummary from "@/components/analysis/AnalysisSummary";
import { useDashboardContext } from "@/contexts/DashboardContext";

// AllReviewsContent component with enhanced props for loading all reviews
const AllReviewsContent: React.FC<{
  reviews: Review[]; 
  chartData: any[];
  totalReviewCount?: number;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  hasMoreData?: boolean;
}> = ({ 
  reviews, 
  chartData, 
  totalReviewCount,
  loadingMore,
  onLoadMore,
  hasMoreData
}) => {
  // Try to get the total review count from context if not provided directly
  let dashboardTotalReviewCount = totalReviewCount;
  try {
    // Attempt to use the context to get the total count if available
    const dashboardContext = useDashboardContext();
    if (!dashboardTotalReviewCount && dashboardContext?.totalReviewCount) {
      dashboardTotalReviewCount = dashboardContext.totalReviewCount;
    }
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
      {/* Analysis Summary - New comprehensive analysis section */}
      <AnalysisSummary 
        reviews={reviews}
        businessName="Current Business" // TODO: Pass actual business name from props
        loading={false}
        config={{
          timePeriod: "all",
          includeStaffAnalysis: true,
          includeThematicAnalysis: true,
          includeActionItems: true,
          comparisonPeriod: "previous"
        }}
      />
      
      {/* Overview section with review stats */}
      <OverviewSection 
        reviews={reviews} 
        totalReviewCount={dashboardTotalReviewCount}
        loadingMore={loadingMore}
        onLoadMore={onLoadMore}
        hasMoreData={hasMoreData}
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
