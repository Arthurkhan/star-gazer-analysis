import React, { useMemo, useState, useCallback } from "react";
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
import { ExecutiveSummaryCard } from "./ExecutiveSummaryCard";
import { PerformanceMetricsGrid } from "./PerformanceMetricsGrid";
import { SentimentAnalysisSection } from "./SentimentAnalysisSection";
import { ThematicAnalysisSection } from "./ThematicAnalysisSection";
import { StaffInsightsSection } from "./StaffInsightsSection";
import { OperationalInsightsSection } from "./OperationalInsightsSection";
import { ActionItemsSection } from "./ActionItemsSection";
import { InteractiveCharts } from "./InteractiveCharts";
import { ExportManager } from "./ExportManager";
import { DashboardCustomizer } from "./DashboardCustomizer";
import { AlertSystem } from "./AlertSystem";
import { ComparativeAnalysis } from "./ComparativeAnalysis";
import { AdvancedFilters, FilterCriteria } from "./AdvancedFilters";

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

export const AnalysisSummary: React.FC<AnalysisSummaryProps> = ({
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
  // State management for enhanced features
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

  // Use filtered reviews for analysis
  const reviewsForAnalysis = useMemo(() => {
    return filteredReviews.length > 0 ? filteredReviews : reviews;
  }, [filteredReviews, reviews]);

  // Generate analysis data with performance optimization
  const analysisData: AnalysisSummaryData | null = useMemo(() => {
    if (!reviewsForAnalysis || reviewsForAnalysis.length === 0) return null;
    
    try {
      const data = generateAnalysisSummary(reviewsForAnalysis, config);
      return { ...data, dataSource: { ...data.dataSource, businessName } };
    } catch (error) {
      console.error("Error generating analysis summary:", error);
      return null;
    }
  }, [reviewsForAnalysis, config, businessName]);

  // Handle refresh functionality
  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
        setLastRefresh(new Date());
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setRefreshing(false);
      }
    }
  }, [onRefresh]);

  // Handle export functionality
  const handleExport = useCallback((format: string) => {
    if (analysisData) {
      setShowExportManager(true);
    }
  }, [analysisData]);

  // Handle view configuration changes
  const handleViewConfigChange = useCallback((key: keyof ViewConfig, value: any) => {
    setViewConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  // Toggle fullscreen for sections
  const toggleFullscreen = useCallback((sectionId: string) => {
    setFullscreenSection(current => current === sectionId ? null : sectionId);
  }, []);

  // Handle filter changes
  const handleFiltersChange = useCallback((filtered: Review[], criteria: FilterCriteria) => {
    setFilteredReviews(filtered);
    setActiveFilters(criteria);
  }, []);

  // Get layout styles based on configuration
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

  // Loading state
  if (loading) {
    return (
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
    );
  }

  // Error state
  if (!analysisData) {
    return (
      <Alert className={`w-full ${className}`} variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to generate analysis summary. Please ensure you have review data available.
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

  // Render main content based on layout
  const renderMainContent = () => {
    const sections = [
      {
        id: 'executive-summary',
        title: 'Executive Summary',
        component: (
          <ExecutiveSummaryCard 
            healthScore={analysisData.businessHealthScore}
            performanceMetrics={analysisData.performanceMetrics}
            timePeriod={analysisData.timePeriod}
          />
        )
      },
      {
        id: 'performance-metrics',
        title: 'Performance Metrics',
        component: (
          <PerformanceMetricsGrid 
            performanceMetrics={analysisData.performanceMetrics}
            ratingAnalysis={analysisData.ratingAnalysis}
            responseAnalytics={analysisData.responseAnalytics}
          />
        )
      },
      {
        id: 'sentiment-analysis',
        title: 'Sentiment Analysis',
        component: (
          <SentimentAnalysisSection 
            sentimentAnalysis={analysisData.sentimentAnalysis}
          />
        )
      },
      {
        id: 'thematic-analysis',
        title: 'Thematic Analysis',
        component: config.includeThematicAnalysis ? (
          <ThematicAnalysisSection 
            thematicAnalysis={analysisData.thematicAnalysis}
          />
        ) : null
      },
      {
        id: 'staff-insights',
        title: 'Staff Insights',
        component: config.includeStaffAnalysis && analysisData.staffInsights.mentions.length > 0 ? (
          <StaffInsightsSection 
            staffInsights={analysisData.staffInsights}
          />
        ) : null
      },
      {
        id: 'operational-insights',
        title: 'Operational Insights',
        component: (
          <OperationalInsightsSection 
            operationalInsights={analysisData.operationalInsights}
          />
        )
      },
      {
        id: 'action-items',
        title: 'Action Items',
        component: config.includeActionItems ? (
          <ActionItemsSection 
            actionItems={analysisData.actionItems}
          />
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
            </TabsContent>
          ))}
        </Tabs>
      );
    }

    // Grid layout (default)
    return (
      <div className={`grid gap-6 ${getLayoutStyles.columns}`}>
        {sections.map(section => (
          <div 
            key={section.id} 
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
        ))}
      </div>
    );
  };

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

      {/* Modals/Dialogs */}
      {showAdvancedFilters && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto p-6 h-full overflow-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Advanced Filters</h2>
              <Button variant="outline" onClick={() => setShowAdvancedFilters(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <AdvancedFilters
              reviews={reviews}
              onFiltersChange={handleFiltersChange}
              showResultCount={true}
              enablePresets={true}
            />
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
            <ComparativeAnalysis
              reviews={reviewsForAnalysis}
              businessName={businessName}
              businessType={businessType}
            />
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
            <AlertSystem
              reviews={reviewsForAnalysis}
              businessName={businessName}
              businessType={businessType}
            />
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
            <InteractiveCharts
              reviews={reviewsForAnalysis}
              analysisData={analysisData}
              refreshData={onRefresh}
              autoRefresh={autoRefresh}
            />
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
            <ExportManager
              reviews={reviewsForAnalysis}
              businessName={businessName}
              businessType={businessType}
            />
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
            <DashboardCustomizer
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
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisSummary;
