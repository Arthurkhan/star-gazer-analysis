import { useState, useCallback } from "react";
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
import { getBusinessTypeFromName } from "@/types/BusinessMappings";
import { Sparkles, RefreshCw, BarChart3, GitCompare, Mail as MailIcon } from "lucide-react";
import { DatabaseErrorDisplay } from "@/components/diagnostic/DatabaseErrorDisplay";
import { MissingEnvAlert } from "@/components/diagnostic/MissingEnvAlert";
import { NoReviewsAlert } from "@/components/diagnostic/NoReviewsAlert";

/**
 * Simplified Dashboard Component
 * Phase 2: Reduced complexity, minimal state management, removed DashboardContext
 * v1.2: Automatic business type detection from business name
 */
const Dashboard = () => {
  // Single state variable for tab management
  const [activeTab, setActiveTab] = useState("overview");
  
  // Use simplified dashboard data hook
  const { 
    loading, 
    databaseError,
    selectedBusiness, 
    businessData, 
    getFilteredReviews, 
    getChartData,
    enhancedAnalysis,
    handleBusinessChange,
    refreshData
  } = useDashboardData();

  // Get filtered reviews and chart data
  const filteredReviews = getFilteredReviews();
  const chartData = getChartData(filteredReviews);

  // Automatically determine business type from selected business name
  const businessType = selectedBusiness === "all" 
    ? "other" 
    : getBusinessTypeFromName(selectedBusiness);

  // Recommendations data (now using automatic business type)
  const {
    recommendations,
    loading: recommendationsLoading,
    error: recommendationsError,
    generateRecommendations,
  } = useRecommendations({
    businessData: { ...businessData, reviews: filteredReviews },
    selectedBusiness,
    businessType, // Using automatically determined business type
  });
  
  // Check if we have no reviews to display
  const hasNoReviews = !loading && !databaseError && (!filteredReviews || filteredReviews.length === 0);
  
  // Generate recommendations handler
  const handleGenerateRecommendations = useCallback(() => {
    generateRecommendations("browser"); // Simplified - default to browser AI
  }, [generateRecommendations]);

  // Date range for export (simplified)
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateRange = { start: thirtyDaysAgo, end: today };

  return (
    <DashboardLayout onProviderChange={() => {}}> {/* Simplified - no provider change */}
      {/* Error and alert displays */}
      <MissingEnvAlert />
      
      {databaseError && (
        <DatabaseErrorDisplay 
          onRefresh={refreshData}
          isRefreshing={loading}
        />
      )}
      
      {hasNoReviews && (
        <NoReviewsAlert 
          businessData={businessData}
          selectedBusiness={selectedBusiness}
        />
      )}

      {/* Business Selector and Action Buttons - Updated props */}
      <div className="flex justify-between items-center gap-4 mb-6 w-full">
        <BusinessSelector
          selectedBusiness={selectedBusiness}
          onBusinessChange={handleBusinessChange}
          businessData={businessData}
          className="flex-1"
        />
        <div className="flex gap-2">
          <Button
            onClick={refreshData}
            disabled={loading}
            size="icon"
            variant="outline"
            className="w-10 h-10"
            title="Refresh Data"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {enhancedAnalysis && (
            <ExportButton
              businessName={selectedBusiness}
              businessType={businessType}
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
      
      {/* Simplified Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="enhanced">Enhanced Analysis</TabsTrigger>
          <TabsTrigger value="comparison">Period Comparison</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab - Simplified props */}
        <TabsContent value="overview" className="mt-6">
          <DashboardContent
            loading={loading}
            reviews={filteredReviews}
            chartData={chartData}
          />
        </TabsContent>
        
        {/* Enhanced Analysis Tab */}
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
        
        {/* Period Comparison Tab */}
        <TabsContent value="comparison" className="mt-6">
          {selectedBusiness && selectedBusiness !== "all" ? (
            <PeriodComparisonDisplay businessName={selectedBusiness} />
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
        
        {/* AI Recommendations Tab */}
        <TabsContent value="recommendations" className="mt-6">
          <RecommendationsDashboard
            recommendations={recommendations}
            loading={recommendationsLoading}
            error={recommendationsError || undefined}
            generatingMessage="Generating recommendations..."
            businessName={selectedBusiness}
          />
        </TabsContent>
        
        {/* Notifications Tab - Using automatic business type */}
        <TabsContent value="notifications" className="mt-6">
          {selectedBusiness && selectedBusiness !== "all" ? (
            <EmailSettingsForm
              businessName={selectedBusiness}
              businessType={businessType}
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
    </DashboardLayout>
  );
};

export default Dashboard;