import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import BusinessSelector from "@/components/BusinessSelector";
import DashboardContent from "@/components/dashboard/DashboardContent";
import { RecommendationsDashboard } from "@/components/recommendations/RecommendationsDashboard";
import { EnhancedAnalysisDisplay } from "@/components/analysis/EnhancedAnalysisDisplay";
import { PeriodComparisonDisplay } from "@/components/analysis/PeriodComparisonDisplay";
import { EmailSettingsForm } from "@/components/emails/EmailSettingsForm";
import { ExportButton } from "@/components/exports/ExportButton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useRecommendations } from "@/hooks/useRecommendations";
import { BusinessType } from "@/types/businessTypes";
import { type AIProvider } from "@/components/AIProviderToggle";
import { Sparkles, Download, Save, BarChart3, GitCompare, Mail as MailIcon, RefreshCw, Loader, ListPlus } from "lucide-react";
import { DebugPanel } from "@/components/debug/DebugPanel";
import { DatabaseErrorDisplay } from "@/components/diagnostic/DatabaseErrorDisplay";
import { MissingEnvAlert } from "@/components/diagnostic/MissingEnvAlert";
import { NoReviewsAlert } from "@/components/diagnostic/NoReviewsAlert";
import { DashboardProvider } from "@/contexts/DashboardContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [aiProvider, setAiProvider] = useState<AIProvider>("browser");
  const [selectedBusinessType, setSelectedBusinessType] = useState<BusinessType>(BusinessType.OTHER);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { 
    loading, 
    loadingMore,
    databaseError,
    selectedBusiness, 
    businessData, 
    getFilteredReviews, 
    getChartData,
    enhancedAnalysis,
    handleBusinessChange,
    refreshData,
    loadMoreData,
    hasMoreData,
    totalReviewCount,
    allPagesLoaded
  } = useDashboardData();

  const filteredReviews = getFilteredReviews();
  const chartData = getChartData(filteredReviews);

  const {
    recommendations,
    loading: recommendationsLoading,
    error: recommendationsError,
    generatingMessage,
    generateRecommendations,
    exportRecommendations,
    saveRecommendations,
  } = useRecommendations({
    businessData: { ...businessData, reviews: filteredReviews },
    selectedBusiness,
    businessType: selectedBusinessType,
  });
  
  const hasNoReviews = !loading && !databaseError && (!filteredReviews || filteredReviews.length === 0);
  
  const handleGenerateRecommendations = useCallback(() => {
    generateRecommendations(aiProvider);
  }, [generateRecommendations, aiProvider]);

  const handleRefreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshData]);

  // Date range for export
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateRange = { start: thirtyDaysAgo, end: today };

  return (
    <DashboardLayout onProviderChange={setAiProvider}>
      {/* Provide dashboard context values */}
      <DashboardProvider 
        value={{
          totalReviewCount,
          loadMoreData,
          hasMoreData: hasMoreData && !allPagesLoaded,
          loadingMore
        }}
      >
        {/* Check for missing environment variables */}
        <MissingEnvAlert />
        
        {/* Database Error Display */}
        {databaseError && (
          <DatabaseErrorDisplay 
            onRefresh={handleRefreshData}
            isRefreshing={isRefreshing}
          />
        )}
        
        {/* No Reviews Alert */}
        {hasNoReviews && (
          <NoReviewsAlert 
            businessData={businessData}
            selectedBusiness={selectedBusiness}
          />
        )}

        <div className="flex justify-between items-center gap-4 mb-6 w-full">
          <BusinessSelector
            selectedBusiness={selectedBusiness}
            onBusinessChange={handleBusinessChange}
            businessData={businessData}
            businessType={selectedBusinessType}
            onBusinessTypeChange={setSelectedBusinessType}
            className="flex-1"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleRefreshData}
              disabled={isRefreshing}
              size="icon"
              variant="outline"
              className="w-10 h-10"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            {enhancedAnalysis && (
              <ExportButton
                businessName={selectedBusiness}
                businessType={selectedBusinessType}
                data={enhancedAnalysis}
                dateRange={dateRange}
                disabled={!selectedBusiness || selectedBusiness === "all"}
              />
            )}
            <Button
              onClick={handleGenerateRecommendations}
              disabled={!selectedBusiness || selectedBusiness === "all" || recommendationsLoading || hasNoReviews}
              size="icon"
              className="w-10 h-10"
              title="Generate Recommendations"
            >
              <Sparkles className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="enhanced">Enhanced Analysis</TabsTrigger>
            <TabsTrigger value="comparison">Period Comparison</TabsTrigger>
            <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6 relative">
            <DebugPanel 
              reviews={filteredReviews} 
              chartData={chartData} 
              businessName={selectedBusiness}
            />
            <DashboardContent
              loading={loading}
              reviews={filteredReviews}
              chartData={chartData}
            />
            
            {/* Load More Data Button */}
            {(!allPagesLoaded && hasMoreData && !loading) && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={loadMoreData}
                  disabled={loadingMore}
                  variant="outline"
                  className="w-48"
                >
                  {loadingMore ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ListPlus className="mr-2 h-4 w-4" />
                      Load More Reviews
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="enhanced" className="mt-6">
            {enhancedAnalysis ? (
              <EnhancedAnalysisDisplay
                temporalPatterns={enhancedAnalysis.temporalPatterns}
                historicalTrends={enhancedAnalysis.historicalTrends}
                reviewClusters={enhancedAnalysis.reviewClusters}
                seasonalAnalysis={enhancedAnalysis.seasonalAnalysis}
                insights={enhancedAnalysis.insights}
                loading={loading}
              />
            ) : (
              <div className="text-center p-10 space-y-4">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-medium">Enhanced Analysis Not Available</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Generate recommendations to see enhanced data analysis for this business.
                </p>
                <Button
                  onClick={handleGenerateRecommendations}
                  disabled={!selectedBusiness || selectedBusiness === "all" || recommendationsLoading || hasNoReviews}
                  className="mt-4"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Analysis
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="comparison" className="mt-6">
            {selectedBusiness && selectedBusiness !== "all" ? (
              <PeriodComparisonDisplay
                businessName={selectedBusiness}
              />
            ) : (
              <div className="text-center p-10 space-y-4">
                <GitCompare className="w-12 h-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-medium">Select a Business</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Please select a specific business to compare data across different time periods.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="recommendations" className="mt-6">
            {recommendations && (
              <div className="flex justify-end gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportRecommendations}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveRecommendations}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </Button>
              </div>
            )}
            <RecommendationsDashboard
              recommendations={recommendations}
              loading={recommendationsLoading}
              error={recommendationsError || undefined}
              generatingMessage={generatingMessage}
              businessName={selectedBusiness}
            />
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-6">
            {selectedBusiness && selectedBusiness !== "all" ? (
              <EmailSettingsForm
                businessName={selectedBusiness}
                businessType={selectedBusinessType}
              />
            ) : (
              <div className="text-center p-10 space-y-4">
                <MailIcon className="w-12 h-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-medium">Select a Business</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Please select a specific business to configure email notifications.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DashboardProvider>
    </DashboardLayout>
  );
};

export default Dashboard;
