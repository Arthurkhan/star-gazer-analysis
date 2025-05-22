import React, { useState, memo, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AllReviewsContent from "./AllReviewsContent";
import MonthlyReport from "@/components/monthly-report";
import { Review } from "@/types/reviews";

// Simplified props interface - removed redundant props after Phase 1 changes
interface DashboardContentProps {
  loading: boolean;
  reviews: Review[];
  chartData: any[];
}

/**
 * Simplified DashboardContent Component
 * Phase 2: Cleaned up props interface, removed pagination-related props
 */
const DashboardContent: React.FC<DashboardContentProps> = memo(({ 
  loading, 
  reviews, 
  chartData
}) => {
  const [activeTab, setActiveTab] = useState("all-reviews");
  
  // Force delayed rendering to avoid chunk errors
  const [renderContent, setRenderContent] = useState(false);
  
  useEffect(() => {
    // Only render content after component has mounted
    const timer = setTimeout(() => {
      setRenderContent(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading review data...</p>
        </div>
      </div>
    );
  }

  return (
    <Tabs 
      defaultValue="all-reviews" 
      value={activeTab} 
      onValueChange={setActiveTab}
      className="w-full"
    >
      <TabsList className="mb-6">
        <TabsTrigger value="all-reviews">All Reviews</TabsTrigger>
        <TabsTrigger value="monthly-report">Monthly Report</TabsTrigger>
      </TabsList>
      
      {renderContent && (
        <>
          <TabsContent value="all-reviews" className="mt-0">
            {/* Simplified AllReviewsContent - removed pagination props */}
            <AllReviewsContent 
              reviews={reviews} 
              chartData={chartData} 
            />
          </TabsContent>
          
          <TabsContent value="monthly-report" className="mt-0">
            <MonthlyReport reviews={reviews} />
          </TabsContent>
        </>
      )}
    </Tabs>
  );
});

DashboardContent.displayName = "DashboardContent";

export default DashboardContent;
