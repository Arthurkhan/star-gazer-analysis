import React, { memo } from "react";
import { Review } from "@/types/reviews";
import OverviewSection from "@/components/OverviewSection";
import ReviewsTable from "@/components/ReviewsTable";
import AnalysisSummary from "@/components/analysis/AnalysisSummary";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { Separator } from "@/components/ui/separator";

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
    <div className="space-y-8">
      {/* Phase 2: Overview Section - Now positioned FIRST for better UX flow */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Business Overview</h2>
            <p className="text-muted-foreground">
              Key metrics and performance indicators at a glance
            </p>
          </div>
        </div>
        
        <OverviewSection 
          reviews={reviews} 
          totalReviewCount={dashboardTotalReviewCount}
          loadingMore={loadingMore}
          onLoadMore={onLoadMore}
          hasMoreData={hasMoreData}
        />
      </section>

      <Separator className="my-8" />
      
      {/* Phase 2: Analysis Summary - Now positioned SECOND for logical progression */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Detailed Analysis</h2>
            <p className="text-muted-foreground">
              Comprehensive insights and recommendations based on review data
            </p>
          </div>
        </div>
        
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
          customizable={true}
          exportable={true}
        />
      </section>

      <Separator className="my-8" />
      
      {/* Phase 2: Reviews Table - Now positioned THIRD for complete data access */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Review Details</h2>
            <p className="text-muted-foreground">
              Individual reviews with full text and metadata
            </p>
          </div>
        </div>
        
        <ReviewsTable reviews={reviews} />
      </section>
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(AllReviewsContent);