import React, { useMemo, useState, useCallback, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Download,
  Settings,
  Eye,
  EyeOff,
  Maximize,
  Grid,
  BarChart3,
  Shield,
  Filter,
  GitCompare,
  X
} from "lucide-react";
import { Review } from "@/types/reviews";
import { BusinessType } from "@/types/businessTypes";
import { AnalysisSummaryData, AnalysisConfig } from "@/types/analysisSummary";
import { generateAnalysisSummary } from "@/utils/analysisUtils";
import { memoizeWithExpiry, PerformanceMonitor, debounce } from "@/utils/performanceOptimizations";
import { errorLogger, AppError, ErrorType, ErrorSeverity, safeExecute } from "@/utils/errorHandling";
import { SectionErrorBoundary, ComponentErrorBoundary } from "@/components/ErrorBoundary";
import { 
  LazyInteractiveCharts,
  LazyExportManager,
  LazyDashboardCustomizer,
  LazyAlertSystem,
  LazyComparativeAnalysis,
  LazyAdvancedFilters,
  LoadingFallback
} from "@/utils/lazyLoading";

// Core analysis components (always loaded)
import { ExecutiveSummaryCard } from "./ExecutiveSummaryCard";
import { PerformanceMetricsGrid } from "./PerformanceMetricsGrid";
import { SentimentAnalysisSection } from "./SentimentAnalysisSection";
import { ThematicAnalysisSection } from "./ThematicAnalysisSection";
import { StaffInsightsSection } from "./StaffInsightsSection";
import { OperationalInsightsSection } from "./OperationalInsightsSection";
import { ActionItemsSection } from "./ActionItemsSection";

// Phase 5: Advanced filters type import
interface FilterCriteria {
  dateRange?: { start: Date; end: Date };
  ratingRange?: { min: number; max: number };
  sentiment?: string[];
  textSearch?: string;
  themes?: string[];
  staffMentions?: string[];
  hasOwnerResponse?: boolean;
  languages?: string[];
  reviewLength?: { min: number; max: number };
}

interface AnalysisSummaryProps {
  reviews: Review[];
  businessName?: string;
  businessType?: BusinessType;
  loading?: boolean;
  config?: AnalysisConfig;
  className?: string;
  onRefresh?: () => void;
  autoRefresh?: boolean;
  customizable?: boolean;
  exportable?: boolean;
}

interface ViewConfig {
  layout: 'grid' | 'tabs' | 'accordion';
  columns: number;
  spacing: 'compact' | 'normal' | 'spacious';
  showMiniCards: boolean;
  enableAnimations: boolean;
}

const DEFAULT_VIEW_CONFIG: ViewConfig = {
  layout: 'grid',
  columns: 2,
  spacing: 'normal',
  showMiniCards: true,
  enableAnimations: true
};

// Phase 5: Memoized analysis data calculation
const generateMemoizedAnalysis = memoizeWithExpiry(
  (reviews: Review[], config: AnalysisConfig, businessName: string): AnalysisSummaryData => {
    const stopMeasurement = PerformanceMonitor.startMeasurement('analysis-summary-generation');
    
    try {
      const data = generateAnalysisSummary(reviews, config);
      const result = { ...data, dataSource: { ...data.dataSource, businessName } };
      stopMeasurement();
      return result;
    } catch (error) {
      stopMeasurement();
      throw error;
    }
  },
  (reviews: Review[], config: AnalysisConfig, businessName: string) => 
    `analysis-${reviews.length}-${JSON.stringify(config)}-${businessName}`,
  10 * 60 * 1000 // 10 minutes cache
);

export const AnalysisSummary: React.FC<AnalysisSummaryProps> = React.memo(({
  reviews,
  businessName = "Current Business",
  businessType = "CAFE",
  loading = false,
  config = {
    timePeriod: "all",
    includeStaffAnalysis: true,
    includeThematicAnalysis: true,
    includeActionItems: true,
    comparisonPeriod: "previous"
  },
  className = "",
  onRefresh,
  autoRefresh = false,
  customizable = false,
  exportable = false
}) => {
  // Phase 5: Enhanced state management with performance monitoring
  const [viewConfig, setViewConfig] = useState<ViewConfig>(DEFAULT_VIEW_CONFIG);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showExportManager, setShowExportManager] = useState(false);
  const [showInteractiveCharts, setShowInteractiveCharts] = useState(false);
  const [showAlertSystem, setShowAlertSystem] = useState(false);
  const [showComparativeAnalysis, setShowComparativeAnalysis] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>(reviews);
  const [activeFilters, setActiveFilters] = useState<FilterCriteria | null>(null);
  const [fullscreenSection, setFullscreenSection] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Phase 5: Performance monitoring for component lifecycle
  React.useEffect(() => {
    const stopMeasurement = PerformanceMonitor.startMeasurement('analysis-summary-mount');
    return () => {
      stopMeasurement();
    };
  }, []);

  // Use filtered reviews for analysis with performance optimization
  const reviewsForAnalysis = useMemo(() => {
    const stopMeasurement = PerformanceMonitor.startMeasurement('reviews-filtering');
    const result = filteredReviews.length > 0 ? filteredReviews : reviews;
    stopMeasurement();
    return result;
  }, [filteredReviews, reviews]);

  // Phase 5: Memoized analysis data generation with error handling
  const analysisData: AnalysisSummaryData | null = useMemo(() => {
    if (!reviewsForAnalysis || reviewsForAnalysis.length === 0) return null;
    
    try {
      return generateMemoizedAnalysis(reviewsForAnalysis, config, businessName);
    } catch (error) {
      errorLogger.logError(new AppError(
        "Failed to generate analysis summary",
        ErrorType.CLIENT,
        ErrorSeverity.HIGH,
        { 
          reviewCount: reviewsForAnalysis.length,
          config,
          businessName 
        }
      ));
      return null;
    }
  }, [reviewsForAnalysis, config, businessName]);

  // Phase 5: Debounced refresh handler with error handling
  const handleRefresh = useCallback(
    debounce(async () => {
      if (onRefresh) {
        setRefreshing(true);
        try {
          const stopMeasurement = PerformanceMonitor.startMeasurement('analysis-refresh');
          await onRefresh();
          setLastRefresh(new Date());
          stopMeasurement();
        } catch (error) {
          errorLogger.logError(new AppError(
            "Refresh failed",
            ErrorType.CLIENT,
            ErrorSeverity.MEDIUM,
            { error: error.message }
          ));
        } finally {
          setRefreshing(false);
        }
      }
    }, 1000),
    [onRefresh]
  );

  // Phase 5: Safe export handler
  const handleExport = useCallback(safeExecute((format: string) => {
    if (analysisData) {
      setShowExportManager(true);
      PerformanceMonitor.startMeasurement('export-manager-open');
    }
  }, { action: 'export', format: 'unknown' }), [analysisData]);

  // Phase 5: Optimized view configuration changes
  const handleViewConfigChange = useCallback((key: keyof ViewConfig, value: any) => {
    setViewConfig(prev => ({ ...prev, [key]: value }));
    PerformanceMonitor.startMeasurement('view-config-change');
  }, []);

  // Phase 5: Fullscreen toggle with performance tracking
  const toggleFullscreen = useCallback((sectionId: string) => {
    setFullscreenSection(current => current === sectionId ? null : sectionId);
    PerformanceMonitor.startMeasurement('fullscreen-toggle');
  }, []);

  // Phase 5: Optimized filter change handler
  const handleFiltersChange = useCallback((filtered: Review[], criteria: FilterCriteria) => {
    const stopMeasurement = PerformanceMonitor.startMeasurement('filters-apply');
    setFilteredReviews(filtered);
    setActiveFilters(criteria);
    stopMeasurement();
  }, []);

  // Phase 5: Memoized layout styles
  const getLayoutStyles = useMemo(() => {
    const spacing = {
      compact: 'space-y-3',
      normal: 'space-y-6',
      spacious: 'space-y-8'
    };

    const columns = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 lg:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
    };

    return {
      spacing: spacing[viewConfig.spacing],
      columns: columns[viewConfig.columns as keyof typeof columns] || columns[2],
      animations: viewConfig.enableAnimations ? 'transition-all duration-300 ease-in-out' : ''
    };
  }, [viewConfig]);

  // Phase 5: Enhanced loading state with performance info
  if (loading) {
    return (
      <ComponentErrorBoundary>
        <Card className={`w-full ${className}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Analysis Summary...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </ComponentErrorBoundary>
    );
  }

  // Phase 5: Enhanced error state
  if (!analysisData) {
    return (
      <Alert className={`w-full ${className}`} variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to generate analysis summary. Please ensure you have review data available.
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-2 text-xs">
              <summary>Debug Info</summary>
              <pre>{JSON.stringify({
                reviewCount: reviews.length,
                filteredCount: filteredReviews.length,
                config,
                businessName
              }, null, 2)}</pre>
            </details>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Success state with health score indicator
  const healthScore = analysisData.businessHealthScore.overall;
  const healthColor = healthScore >= 80 ? "text-green-600" : 
                     healthScore >= 60 ? "text-yellow-600" : "text-red-600";
  const healthIcon = healthScore >= 80 ? CheckCircle : 
                    healthScore >= 60 ? AlertTriangle : AlertTriangle;
  const HealthIcon = healthIcon;

  // Phase 5: Optimized main content rendering
  const renderMainContent = useCallback(() => {
    const sections = [
      {
        id: 'executive-summary',
        title: 'Executive Summary',
        component: (
          <ComponentErrorBoundary>
            <ExecutiveSummaryCard 
              healthScore={analysisData.businessHealthScore}
              performanceMetrics={analysisData.performanceMetrics}
              timePeriod={analysisData.timePeriod}
            />
          </ComponentErrorBoundary>
        )
      },
      {
        id: 'performance-metrics',
        title: 'Performance Metrics',
        component: (
          <ComponentErrorBoundary>
            <PerformanceMetricsGrid 
              performanceMetrics={analysisData.performanceMetrics}
              ratingAnalysis={analysisData.ratingAnalysis}
              responseAnalytics={analysisData.responseAnalytics}
            />
          </ComponentErrorBoundary>
        )
      },
      {
        id: 'sentiment-analysis',
        title: 'Sentiment Analysis',
        component: (
          <ComponentErrorBoundary>
            <SentimentAnalysisSection 
              sentimentAnalysis={analysisData.sentimentAnalysis}
            />
          </ComponentErrorBoundary>
        )
      },
      {
        id: 'thematic-analysis',
        title: 'Thematic Analysis',
        component: config.includeThematicAnalysis ? (
          <ComponentErrorBoundary>
            <ThematicAnalysisSection 
              thematicAnalysis={analysisData.thematicAnalysis}
            />
          </ComponentErrorBoundary>
        ) : null
      },
      {
        id: 'staff-insights',
        title: 'Staff Insights',
        component: config.includeStaffAnalysis && analysisData.staffInsights.mentions.length > 0 ? (
          <ComponentErrorBoundary>
            <StaffInsightsSection 
              staffInsights={analysisData.staffInsights}
            />
          </ComponentErrorBoundary>
        ) : null
      },
      {
        id: 'operational-insights',
        title: 'Operational Insights',
        component: (
          <ComponentErrorBoundary>
            <OperationalInsightsSection 
              operationalInsights={analysisData.operationalInsights}
            />
          </ComponentErrorBoundary>
        )
      },
      {
        id: 'action-items',
        title: 'Action Items',
        component: config.includeActionItems ? (
          <ComponentErrorBoundary>
            <ActionItemsSection 
              actionItems={analysisData.actionItems}
            />
          </ComponentErrorBoundary>
        ) : null
      }
    ].filter(section => section.component !== null);

    if (viewConfig.layout === 'tabs') {
      return (
        <Tabs defaultValue={sections[0]?.id} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
            {sections.map(section => (
              <TabsTrigger key={section.id} value={section.id} className="text-xs">
                {section.title.split(' ')[0]}
              </TabsTrigger>
            ))}
          </TabsList>
          {sections.map(section => (
            <TabsContent key={section.id} value={section.id} className="mt-6">
              <SectionErrorBoundary>
                <div className={fullscreenSection === section.id ? 'fixed inset-0 z-50 bg-background p-6' : ''}>
                  {section.component}
                  {fullscreenSection === section.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-4 right-4"
                      onClick={() => toggleFullscreen(section.id)}
                    >
                      <EyeOff className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </SectionErrorBoundary>
            </TabsContent>
          ))}
        </Tabs>
      );
    }

    // Grid layout (default)
    return (
      <div className={`grid gap-6 ${getLayoutStyles.columns}`}>
        {sections.map(section => (
          <SectionErrorBoundary key={section.id}>
            <div 
              className={`${getLayoutStyles.animations} ${fullscreenSection === section.id ? 'fixed inset-0 z-50 bg-background p-6' : ''}`}
            >
              {fullscreenSection === section.id && (
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">{section.title}</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleFullscreen(section.id)}
                  >
                    <EyeOff className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="relative group">
                {section.component}
                {!fullscreenSection && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => toggleFullscreen(section.id)}
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </SectionErrorBoundary>
        ))}
      </div>
    );
  }, [analysisData, config, viewConfig, fullscreenSection, getLayoutStyles, toggleFullscreen]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Analysis Summary</span>
              <span className="text-sm text-muted-foreground">
                ({analysisData.dataSource.totalReviews} reviews analyzed)
              </span>
              {activeFilters && (
                <Badge variant="secondary" className="ml-2">
                  <Filter className="h-3 w-3 mr-1" />
                  Filtered
                </Badge>
              )}
              {autoRefresh && (
                <Badge variant="secondary" className="ml-2">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Auto-refresh
                </Badge>
              )}
            </div>
            <div className={`flex items-center gap-2 ${healthColor}`}>
              <HealthIcon className="w-5 h-5" />
              <span className="font-semibold">Health Score: {healthScore}%</span>
            </div>
          </CardTitle>
          
          {/* Control buttons */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(true)}
            >
              <Filter className="h-4 w-4 mr-1" />
              Filters
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowComparativeAnalysis(true)}
            >
              <GitCompare className="h-4 w-4 mr-1" />
              Compare
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAlertSystem(true)}
            >
              <Shield className="h-4 w-4 mr-1" />
              Alerts
            </Button>
            
            {exportable && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportManager(true)}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInteractiveCharts(true)}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Charts
            </Button>
            
            {customizable && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomizer(true)}
              >
                <Settings className="h-4 w-4 mr-1" />
                Customize
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewConfigChange('layout', viewConfig.layout === 'grid' ? 'tabs' : 'grid')}
            >
              {viewConfig.layout === 'grid' ? <Grid className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Main content */}
      <div className={getLayoutStyles.spacing}>
        {renderMainContent()}
      </div>

      {/* Footer with generation info */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground text-center">
            Analysis generated on {analysisData.generatedAt.toLocaleDateString()} at{" "}
            {analysisData.generatedAt.toLocaleTimeString()} • 
            Data period: {analysisData.timePeriod.current.start.toLocaleDateString()} to{" "}
            {analysisData.timePeriod.current.end.toLocaleDateString()}
            {lastRefresh && onRefresh && (
              <span> • Last refresh: {lastRefresh.toLocaleTimeString()}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Phase 5: Lazy-loaded modal components with error boundaries */}
      {showAdvancedFilters && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto p-6 h-full overflow-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Advanced Filters</h2>
              <Button variant="outline" onClick={() => setShowAdvancedFilters(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Suspense fallback={<LoadingFallback size="large" message="Loading filters..." />}>
              <SectionErrorBoundary>
                <LazyAdvancedFilters
                  reviews={reviews}
                  onFiltersChange={handleFiltersChange}
                  showResultCount={true}
                  enablePresets={true}
                />
              </SectionErrorBoundary>
            </Suspense>
          </div>
        </div>
      )}

      {showComparativeAnalysis && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto p-6 h-full overflow-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Comparative Analysis</h2>
              <Button variant="outline" onClick={() => setShowComparativeAnalysis(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Suspense fallback={<LoadingFallback size="large" message="Loading comparison..." />}>
              <SectionErrorBoundary>
                <LazyComparativeAnalysis
                  reviews={reviewsForAnalysis}
                  businessName={businessName}
                  businessType={businessType}
                />
              </SectionErrorBoundary>
            </Suspense>
          </div>
        </div>
      )}

      {showAlertSystem && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto p-6 h-full overflow-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Performance Alert System</h2>
              <Button variant="outline" onClick={() => setShowAlertSystem(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Suspense fallback={<LoadingFallback size="large" message="Loading alerts..." />}>
              <SectionErrorBoundary>
                <LazyAlertSystem
                  reviews={reviewsForAnalysis}
                  businessName={businessName}
                  businessType={businessType}
                />
              </SectionErrorBoundary>
            </Suspense>
          </div>
        </div>
      )}

      {showInteractiveCharts && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto p-6 h-full overflow-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Interactive Charts</h2>
              <Button variant="outline" onClick={() => setShowInteractiveCharts(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Suspense fallback={<LoadingFallback size="large" message="Loading charts..." />}>
              <SectionErrorBoundary>
                <LazyInteractiveCharts
                  reviews={reviewsForAnalysis}
                  analysisData={analysisData}
                  refreshData={onRefresh}
                  autoRefresh={autoRefresh}
                />
              </SectionErrorBoundary>
            </Suspense>
          </div>
        </div>
      )}

      {showExportManager && exportable && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto p-6 h-full overflow-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Export Manager</h2>
              <Button variant="outline" onClick={() => setShowExportManager(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Suspense fallback={<LoadingFallback size="large" message="Loading export manager..." />}>
              <SectionErrorBoundary>
                <LazyExportManager
                  reviews={reviewsForAnalysis}
                  businessName={businessName}
                  businessType={businessType}
                />
              </SectionErrorBoundary>
            </Suspense>
          </div>
        </div>
      )}

      {showCustomizer && customizable && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto p-6 h-full overflow-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Dashboard Customizer</h2>
              <Button variant="outline" onClick={() => setShowCustomizer(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Suspense fallback={<LoadingFallback size="large" message="Loading customizer..." />}>
              <SectionErrorBoundary>
                <LazyDashboardCustomizer
                  currentLayout={{
                    id: 'current',
                    name: 'Current Layout',
                    description: 'Current dashboard configuration',
                    widgets: [],
                    columns: viewConfig.columns,
                    spacing: 16,
                    theme: 'light'
                  }}
                  onLayoutChange={(layout) => {
                    handleViewConfigChange('columns', layout.columns);
                  }}
                  onSaveTemplate={() => {}}
                  onLoadTemplate={() => {}}
                  availableTemplates={[]}
                />
              </SectionErrorBoundary>
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
});

AnalysisSummary.displayName = 'AnalysisSummary';

export default AnalysisSummary;
