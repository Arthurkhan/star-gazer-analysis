import React, { useState, useCallback, useMemo, Suspense, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import BusinessSelector from "@/components/BusinessSelector";
import DashboardContent from "@/components/dashboard/DashboardContent";
import { RecommendationsDashboard } from "@/components/recommendations/RecommendationsDashboard";
import { EnhancedAnalysisDisplay } from "@/components/analysis/EnhancedAnalysisDisplay";
import { PeriodComparisonDisplay } from "@/components/analysis/PeriodComparisonDisplay";
import { EmailSettingsForm } from "@/components/emails/EmailSettingsForm";
import { ExportButton } from "@/components/exports/ExportButton";
import { EdgeFunctionTest } from "@/components/diagnostic/EdgeFunctionTest";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useRecommendations } from "@/hooks/useRecommendations";
import { getBusinessTypeFromName } from "@/types/BusinessMappings";
import { Sparkles, RefreshCw, BarChart3, GitCompare, Mail as MailIcon, KeyRound, Download } from "lucide-react";
import { DatabaseErrorDisplay } from "@/components/diagnostic/DatabaseErrorDisplay";
import { MissingEnvAlert } from "@/components/diagnostic/MissingEnvAlert";
import { NoReviewsAlert } from "@/components/diagnostic/NoReviewsAlert";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Phase 5: Import performance and error handling utilities
import { 
  PerformanceMonitor, 
  memoizeWithExpiry, 
  debounce, 
  optimizeMemoryUsage 
} from "@/utils/performanceOptimizations";
import { 
  errorLogger, 
  AppError, 
  ErrorType, 
  ErrorSeverity, 
  safeExecute,
  handleAsyncError 
} from "@/utils/errorHandling";
import { 
  PageErrorBoundary, 
  SectionErrorBoundary, 
  ComponentErrorBoundary 
} from "@/components/ErrorBoundary";
import { LoadingFallback } from "@/utils/lazyLoading";

/**
 * Enhanced Dashboard Component - Phase 5 + Mobile Responsive
 * 
 * Features:
 * - Comprehensive error boundaries at multiple levels
 * - Performance monitoring and optimization
 * - Memoized expensive operations
 * - Debounced user interactions
 * - Memory management
 * - Enhanced error handling and logging
 * - Fixed infinite loop in AI recommendations
 * - Full mobile responsiveness
 */

// Phase 5: Memoized business type calculation
const getMemoizedBusinessType = memoizeWithExpiry(
  (selectedBusiness: string): string => {
    const stopMeasurement = PerformanceMonitor.startMeasurement('business-type-calculation');
    const result = selectedBusiness === "all" 
      ? "other" 
      : getBusinessTypeFromName(selectedBusiness);
    stopMeasurement();
    return result;
  },
  (selectedBusiness: string) => `business-type-${selectedBusiness}`,
  30 * 60 * 1000 // 30 minutes cache
);

const Dashboard: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Check if we're on a mobile device
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  // Phase 5: Performance monitoring for component lifecycle
  React.useEffect(() => {
    const stopMeasurement = PerformanceMonitor.startMeasurement('dashboard-mount');
    
    // Memory optimization on component mount
    optimizeMemoryUsage();
    
    return () => {
      stopMeasurement();
      // Cleanup on unmount
      optimizeMemoryUsage();
    };
  }, []);

  // Single state variable for tab management
  const [activeTab, setActiveTab] = useState("overview");
  const [showDebugTools, setShowDebugTools] = useState(false);
  
  // Use simplified dashboard data hook with error handling
  const { 
    loading, 
    databaseError,
    selectedBusiness, 
    businessData, 
    getFilteredReviews, 
    getChartData,
    enhancedAnalysis,
    handleBusinessChange,
    refreshData,
    getAllReviews // NEW: Get the getAllReviews function
  } = useDashboardData();

  // Phase 5: Memoized filtered reviews and chart data
  const filteredReviews = useMemo(() => {
    const stopMeasurement = PerformanceMonitor.startMeasurement('filtered-reviews-calculation');
    try {
      const result = getFilteredReviews();
      stopMeasurement();
      return result;
    } catch (error) {
      stopMeasurement();
      errorLogger.logError(new AppError(
        "Failed to get filtered reviews",
        ErrorType.CLIENT,
        ErrorSeverity.MEDIUM,
        { selectedBusiness, error: error.message }
      ));
      return [];
    }
  }, [getFilteredReviews, selectedBusiness]);

  const chartData = useMemo(() => {
    const stopMeasurement = PerformanceMonitor.startMeasurement('chart-data-calculation');
    try {
      const result = getChartData(filteredReviews);
      stopMeasurement();
      return result;
    } catch (error) {
      stopMeasurement();
      errorLogger.logError(new AppError(
        "Failed to get chart data",
        ErrorType.CLIENT,
        ErrorSeverity.MEDIUM,
        { reviewCount: filteredReviews.length, error: error.message }
      ));
      return { monthlyData: [], sentimentData: [], ratingData: [], languageData: [] };
    }
  }, [getChartData, filteredReviews]);

  // Phase 5: Memoized business type with error handling
  const businessType = useMemo(() => {
    try {
      return getMemoizedBusinessType(selectedBusiness);
    } catch (error) {
      errorLogger.logError(new AppError(
        "Failed to determine business type",
        ErrorType.CLIENT,
        ErrorSeverity.LOW,
        { selectedBusiness, error: error.message }
      ));
      return "other";
    }
  }, [selectedBusiness]);

  // FIX: Properly memoize businessData to prevent infinite loops
  const memoizedBusinessData = useMemo(() => ({
    businessName: selectedBusiness,
    businessType: businessType,
    reviews: filteredReviews
  }), [selectedBusiness, businessType, filteredReviews]);

  // Recommendations data with error handling - now using memoized businessData and including progress
  const {
    recommendations,
    loading: recommendationsLoading,
    error: recommendationsError,
    generateRecommendations,
    progress,
  } = useRecommendations({
    businessData: memoizedBusinessData,
    selectedBusiness,
    businessType,
  });
  
  // Phase 5: Memoized check for no reviews
  const hasNoReviews = useMemo(() => {
    return !loading && !databaseError && (!filteredReviews || filteredReviews.length === 0);
  }, [loading, databaseError, filteredReviews]);
  
  // Phase 5: Debounced tab change handler
  const handleTabChange = useCallback(
    debounce((value: string) => {
      const stopMeasurement = PerformanceMonitor.startMeasurement('tab-change');
      setActiveTab(value);
      stopMeasurement();
      
      // Optimize memory when switching tabs
      if (value !== activeTab) {
        setTimeout(optimizeMemoryUsage, 100);
      }
    }, 150),
    [activeTab]
  );

  // Phase 5: Enhanced recommendations handler with error handling
  const handleGenerateRecommendations = useCallback(
    safeExecute(async () => {
      // Check if API key is configured
      const apiKey = localStorage.getItem('OPENAI_API_KEY');
      if (!apiKey) {
        toast({
          title: "API Key Required",
          description: "Please configure your OpenAI API key in AI Settings to generate recommendations.",
          variant: "destructive",
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/ai-settings')}
              className="flex items-center gap-2"
            >
              <KeyRound className="h-4 w-4" />
              Configure
            </Button>
          )
        });
        return;
      }
      
      const stopMeasurement = PerformanceMonitor.startMeasurement('generate-recommendations');
      try {
        // FIX: Use 'openai' instead of 'browser'
        await handleAsyncError(
          generateRecommendations("openai"),
          { 
            action: 'generate-recommendations',
            selectedBusiness,
            businessType,
            reviewCount: filteredReviews.length
          }
        );
        stopMeasurement();
      } catch (error) {
        stopMeasurement();
        // Error already logged by handleAsyncError
      }
    }, {
      action: 'generate-recommendations',
      selectedBusiness,
      businessType
    }),
    [generateRecommendations, selectedBusiness, businessType, filteredReviews.length, navigate, toast]
  );

  // Phase 5: Enhanced refresh handler with error handling and debouncing
  const handleRefreshData = useCallback(
    debounce(
      safeExecute(async () => {
        const stopMeasurement = PerformanceMonitor.startMeasurement('data-refresh');
        try {
          await handleAsyncError(refreshData(), {
            action: 'refresh-data',
            selectedBusiness
          });
          stopMeasurement();
        } catch (error) {
          stopMeasurement();
          // Error already logged by handleAsyncError
        }
      }, {
        action: 'refresh-data',
        selectedBusiness
      }),
      500
    ),
    [refreshData, selectedBusiness]
  );

  // Phase 5: Memoized date range for export
  const dateRange = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return { start: thirtyDaysAgo, end: today };
  }, []);

  // Phase 5: Memoized business change handler
  const handleBusinessChangeOptimized = useCallback(
    safeExecute((business: string) => {
      const stopMeasurement = PerformanceMonitor.startMeasurement('business-change');
      handleBusinessChange(business);
      stopMeasurement();
      
      // Clear memory after business change
      setTimeout(optimizeMemoryUsage, 200);
    }, {
      action: 'business-change',
      newBusiness: 'unknown'
    }),
    [handleBusinessChange]
  );

  // Get all reviews for comparison
  const allReviews = useMemo(() => {
    const stopMeasurement = PerformanceMonitor.startMeasurement('all-reviews-calculation');
    try {
      const result = getAllReviews();
      stopMeasurement();
      return result;
    } catch (error) {
      stopMeasurement();
      errorLogger.logError(new AppError(
        "Failed to get all reviews",
        ErrorType.CLIENT,
        ErrorSeverity.MEDIUM,
        { error: error.message }
      ));
      return [];
    }
  }, [getAllReviews]);

  // Mobile tab configuration
  const tabConfig = [
    { value: "overview", label: isMobile ? "Overview" : "Overview" },
    { value: "enhanced", label: isMobile ? "Analysis" : "Enhanced Analysis" },
    { value: "comparison", label: isMobile ? "Compare" : "Period Comparison" },
    { value: "recommendations", label: isMobile ? "AI" : "AI Recommendations" },
    { value: "notifications", label: isMobile ? "Notify" : "Notifications" }
  ];

  return (
    <PageErrorBoundary>
      <DashboardLayout onProviderChange={() => {}}> {/* Simplified - no provider change */}
        
        {/* Error and alert displays with error boundaries */}
        <ComponentErrorBoundary>
          <MissingEnvAlert />
        </ComponentErrorBoundary>
        
        {databaseError && (
          <ComponentErrorBoundary>
            <DatabaseErrorDisplay 
              onRefresh={handleRefreshData}
              isRefreshing={loading}
            />
          </ComponentErrorBoundary>
        )}
        
        {hasNoReviews && (
          <ComponentErrorBoundary>
            <NoReviewsAlert 
              businessData={businessData}
              selectedBusiness={selectedBusiness}
            />
          </ComponentErrorBoundary>
        )}

        {/* Business Selector and Action Buttons with error boundary */}
        <SectionErrorBoundary>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 w-full">
            <ComponentErrorBoundary>
              <BusinessSelector
                selectedBusiness={selectedBusiness}
                onBusinessChange={handleBusinessChangeOptimized}
                businessData={businessData}
                className="w-full sm:flex-1"
              />
            </ComponentErrorBoundary>
            
            <div className="flex gap-2 w-full sm:w-auto">
              {/* Mobile: Action Menu */}
              {isMobile ? (
                <>
                  <Button
                    onClick={handleRefreshData}
                    disabled={loading}
                    size="icon"
                    variant="outline"
                    className="h-10 w-10"
                    title="Refresh Data"
                  >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={handleGenerateRecommendations}
                        disabled={!selectedBusiness || selectedBusiness === "all" || recommendationsLoading || hasNoReviews}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate AI Analysis
                      </DropdownMenuItem>
                      {enhancedAnalysis && (
                        <DropdownMenuItem
                          disabled={!selectedBusiness || selectedBusiness === "all"}
                        >
                          <ExportButton
                            businessName={selectedBusiness}
                            businessType={businessType}
                            data={enhancedAnalysis}
                            dateRange={dateRange}
                            disabled={!selectedBusiness || selectedBusiness === "all"}
                            asMenuItem
                          />
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                /* Desktop: Individual Buttons */
                <>
                  <Button
                    onClick={handleRefreshData}
                    disabled={loading}
                    size="icon"
                    variant="outline"
                    className="w-10 h-10"
                    title="Refresh Data"
                  >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                  
                  {enhancedAnalysis && (
                    <ComponentErrorBoundary>
                      <ExportButton
                        businessName={selectedBusiness}
                        businessType={businessType}
                        data={enhancedAnalysis}
                        dateRange={dateRange}
                        disabled={!selectedBusiness || selectedBusiness === "all"}
                      />
                    </ComponentErrorBoundary>
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
                </>
              )}
            </div>
          </div>
        </SectionErrorBoundary>
        
        {/* Phase 5: Enhanced Main Content Tabs with error boundaries and lazy loading */}
        <SectionErrorBoundary>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className={`grid w-full ${isMobile ? 'grid-cols-3' : 'grid-cols-5'} mb-6`}>
              {isMobile ? (
                <>
                  <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                  <TabsTrigger value="enhanced" className="text-xs">Analysis</TabsTrigger>
                  <TabsTrigger value="recommendations" className="text-xs">AI</TabsTrigger>
                  {/* Second row for mobile */}
                  <TabsTrigger value="comparison" className="text-xs">Compare</TabsTrigger>
                  <TabsTrigger value="notifications" className="text-xs">Notify</TabsTrigger>
                  <div className="hidden" /> {/* Empty cell for grid alignment */}
                </>
              ) : (
                tabConfig.map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))
              )}
            </TabsList>
            
            {/* Overview Tab with error boundary - passing allReviews and businessData */}
            <TabsContent value="overview" className="mt-4 sm:mt-6">
              <SectionErrorBoundary>
                <Suspense fallback={<LoadingFallback size="large" message="Loading overview..." />}>
                  <DashboardContent
                    loading={loading}
                    reviews={filteredReviews}
                    chartData={chartData}
                    selectedBusiness={selectedBusiness}
                    allReviews={allReviews}
                    businessData={businessData}
                  />
                </Suspense>
              </SectionErrorBoundary>
            </TabsContent>
            
            {/* Enhanced Analysis Tab with error boundary */}
            <TabsContent value="enhanced" className="mt-4 sm:mt-6">
              <SectionErrorBoundary>
                {enhancedAnalysis ? (
                  <Suspense fallback={<LoadingFallback size="large" message="Loading enhanced analysis..." />}>
                    <EnhancedAnalysisDisplay
                      temporalPatterns={enhancedAnalysis.temporalPatterns}
                      historicalTrends={enhancedAnalysis.historicalTrends}
                      reviewClusters={enhancedAnalysis.reviewClusters}
                      seasonalAnalysis={enhancedAnalysis.seasonalAnalysis}
                      insights={enhancedAnalysis.insights}
                      loading={loading}
                    />
                  </Suspense>
                ) : (
                  <div className="text-center p-6 sm:p-10 space-y-4">
                    <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto" />
                    <h3 className="text-base sm:text-lg font-medium">Enhanced Analysis Not Available</h3>
                    <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
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
              </SectionErrorBoundary>
            </TabsContent>
            
            {/* Period Comparison Tab with error boundary */}
            <TabsContent value="comparison" className="mt-4 sm:mt-6">
              <SectionErrorBoundary>
                {selectedBusiness && selectedBusiness !== "all" ? (
                  <Suspense fallback={<LoadingFallback size="large" message="Loading comparison..." />}>
                    <PeriodComparisonDisplay businessName={selectedBusiness} />
                  </Suspense>
                ) : (
                  <div className="text-center p-6 sm:p-10 space-y-4">
                    <GitCompare className="w-12 h-12 text-muted-foreground mx-auto" />
                    <h3 className="text-base sm:text-lg font-medium">Select a Business</h3>
                    <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                      Please select a specific business to compare data across different time periods.
                    </p>
                  </div>
                )}
              </SectionErrorBoundary>
            </TabsContent>
            
            {/* AI Recommendations Tab with error boundary - now passing progress */}
            <TabsContent value="recommendations" className="mt-4 sm:mt-6">
              <SectionErrorBoundary>
                {/* Debug toggle button */}
                {!isMobile && (
                  <div className="mb-4 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDebugTools(!showDebugTools)}
                      className="text-xs"
                    >
                      {showDebugTools ? 'Hide' : 'Show'} Debug Tools
                    </Button>
                  </div>
                )}
                
                {/* Edge Function Test Component */}
                {showDebugTools && !isMobile && (
                  <ComponentErrorBoundary>
                    <EdgeFunctionTest />
                  </ComponentErrorBoundary>
                )}
                
                <Suspense fallback={<LoadingFallback size="large" message="Loading recommendations..." />}>
                  <RecommendationsDashboard
                    recommendations={recommendations}
                    loading={recommendationsLoading}
                    error={recommendationsError || undefined}
                    generatingMessage="Generating recommendations..."
                    businessName={selectedBusiness}
                    progress={progress}
                  />
                </Suspense>
              </SectionErrorBoundary>
            </TabsContent>
            
            {/* Notifications Tab with error boundary */}
            <TabsContent value="notifications" className="mt-4 sm:mt-6">
              <SectionErrorBoundary>
                {selectedBusiness && selectedBusiness !== "all" ? (
                  <Suspense fallback={<LoadingFallback size="medium" message="Loading notifications..." />}>
                    <EmailSettingsForm
                      businessName={selectedBusiness}
                      businessType={businessType}
                    />
                  </Suspense>
                ) : (
                  <div className="text-center p-6 sm:p-10 space-y-4">
                    <MailIcon className="w-12 h-12 text-muted-foreground mx-auto" />
                    <h3 className="text-base sm:text-lg font-medium">Select a Business</h3>
                    <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                      Please select a specific business to configure email notifications.
                    </p>
                  </div>
                )}
              </SectionErrorBoundary>
            </TabsContent>
          </Tabs>
        </SectionErrorBoundary>
        
        {/* Phase 5: Development performance stats */}
        {process.env.NODE_ENV === 'development' && !isMobile && (
          <ComponentErrorBoundary>
            <details className="mt-8 p-4 bg-muted rounded text-xs">
              <summary className="cursor-pointer font-medium">Performance Stats (Development)</summary>
              <div className="mt-2 space-y-1">
                <div>Dashboard Mount Time: {PerformanceMonitor.getAverageTime('dashboard-mount').toFixed(2)}ms</div>
                <div>Business Change Time: {PerformanceMonitor.getAverageTime('business-change').toFixed(2)}ms</div>
                <div>Tab Change Time: {PerformanceMonitor.getAverageTime('tab-change').toFixed(2)}ms</div>
                <div>Filtered Reviews Time: {PerformanceMonitor.getAverageTime('filtered-reviews-calculation').toFixed(2)}ms</div>
                <div>Chart Data Time: {PerformanceMonitor.getAverageTime('chart-data-calculation').toFixed(2)}ms</div>
                <div>All Reviews Time: {PerformanceMonitor.getAverageTime('all-reviews-calculation').toFixed(2)}ms</div>
              </div>
            </details>
          </ComponentErrorBoundary>
        )}
      </DashboardLayout>
    </PageErrorBoundary>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
