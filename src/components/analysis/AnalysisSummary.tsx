import React, { useMemo, useState, useCallback, Suspense, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContentLarge,
  DialogHeader,
  DialogTitle,
  DialogScrollArea,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loader2,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Settings,
  EyeOff,
  Maximize,
  Grid,
  BarChart3,
  Shield,
  Filter,
  GitCompare,
} from 'lucide-react'
import type { Review } from '@/types/reviews'
import type { BusinessType } from '@/types/businessTypes'
import type { AnalysisSummaryData, AnalysisConfig } from '@/types/analysisSummary'
import { generateAnalysisSummary } from '@/utils/analysisUtils'
import { PerformanceMonitor, debounce } from '@/utils/performanceOptimizations'
import { errorLogger, AppError, ErrorType, ErrorSeverity, safeExecute } from '@/utils/errorHandling'
import { SectionErrorBoundary, ComponentErrorBoundary } from '@/components/ErrorBoundary'
import {
  LazyInteractiveCharts,
  LazyExportManager,
  LazyDashboardCustomizer,
  LazyAlertSystem,
  LazyComparativeAnalysis,
  LazyAdvancedFilters,
  LoadingFallback,
} from '@/utils/lazyLoading'

// Import InfoTooltip component
import { InfoTooltip } from '@/components/ui/info-tooltip'

// Core analysis components (always loaded)
import { ExecutiveSummaryCard } from './ExecutiveSummaryCard'
import { PerformanceMetricsGrid } from './PerformanceMetricsGrid'
import { SentimentAnalysisSection } from './SentimentAnalysisSection'
import { ThematicAnalysisSection } from './ThematicAnalysisSection'
import { StaffInsightsSection } from './StaffInsightsSection'
import { OperationalInsightsSection } from './OperationalInsightsSection'
import { ActionItemsSection } from './ActionItemsSection'

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
  columns: 1, // Changed from 2 to 1 to display cards vertically
  spacing: 'normal',
  showMiniCards: true,
  enableAnimations: true,
}

export const AnalysisSummary: React.FC<AnalysisSummaryProps> = React.memo(({
  reviews,
  businessName = 'Current Business',
  businessType = 'CAFE',
  loading = false,
  config = {
    timePeriod: 'all',
    includeStaffAnalysis: true,
    includeThematicAnalysis: true,
    includeActionItems: true,
    comparisonPeriod: 'previous',
  },
  className = '',
  onRefresh,
  autoRefresh = false,
  customizable = false,
  exportable = false,
}) => {
  // Phase 5: Enhanced state management with performance monitoring
  const [viewConfig, setViewConfig] = useState<ViewConfig>(DEFAULT_VIEW_CONFIG)
  const [showCustomizer, setShowCustomizer] = useState(false)
  const [showExportManager, setShowExportManager] = useState(false)
  const [showInteractiveCharts, setShowInteractiveCharts] = useState(false)
  const [showAlertSystem, setShowAlertSystem] = useState(false)
  const [showComparativeAnalysis, setShowComparativeAnalysis] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filteredReviews, setFilteredReviews] = useState<Review[]>(reviews)
  const [activeFilters, setActiveFilters] = useState<FilterCriteria | null>(null)
  const [fullscreenSection, setFullscreenSection] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Track previous business name to detect changes
  const [prevBusinessName, setPrevBusinessName] = useState(businessName)

  // Phase 5: Performance monitoring for component lifecycle
  React.useEffect(() => {
    const stopMeasurement = PerformanceMonitor.startMeasurement('analysis-summary-mount')
    return () => {
      stopMeasurement()
    }
  }, [])

  // Reset filtered reviews when business changes or reviews update
  useEffect(() => {
    if (businessName !== prevBusinessName) {
      // Business changed, resetting filters
      setFilteredReviews(reviews)
      setActiveFilters(null)
      setPrevBusinessName(businessName)
    } else {
      // Update filtered reviews if the source reviews changed
      setFilteredReviews(reviews)
    }
  }, [businessName, prevBusinessName, reviews])

  // Use filtered reviews for analysis with performance optimization
  const reviewsForAnalysis = useMemo(() => {
    const stopMeasurement = PerformanceMonitor.startMeasurement('reviews-filtering')
    const result = filteredReviews.length > 0 ? filteredReviews : reviews
    stopMeasurement()
    return result
  }, [filteredReviews, reviews])

  // FIXED: Remove aggressive memoization and rely on React's useMemo
  // This ensures the analysis updates when businessName or reviews change
  const analysisData: AnalysisSummaryData | null = useMemo(() => {
    if (!reviewsForAnalysis || reviewsForAnalysis.length === 0) return null

    const stopMeasurement = PerformanceMonitor.startMeasurement('analysis-summary-generation')

    try {
      const data = generateAnalysisSummary(reviewsForAnalysis, config)
      const result = { ...data, dataSource: { ...data.dataSource, businessName } }
      stopMeasurement()
      return result
    } catch (error) {
      stopMeasurement()
      errorLogger.logError(new AppError(
        'Failed to generate analysis summary',
        ErrorType.CLIENT,
        ErrorSeverity.HIGH,
        {
          reviewCount: reviewsForAnalysis.length,
          config,
          businessName,
        },
      ))
      return null
    }
  }, [reviewsForAnalysis, config, businessName])

  // Phase 5: Debounced refresh handler with error handling
  const handleRefresh = useCallback(
    debounce(async () => {
      if (onRefresh) {
        setRefreshing(true)
        try {
          const stopMeasurement = PerformanceMonitor.startMeasurement('analysis-refresh')
          await onRefresh()
          setLastRefresh(new Date())
          stopMeasurement()
        } catch (error) {
          errorLogger.logError(new AppError(
            'Refresh failed',
            ErrorType.CLIENT,
            ErrorSeverity.MEDIUM,
            { error: error.message },
          ))
        } finally {
          setRefreshing(false)
        }
      }
    }, 1000),
    [onRefresh],
  )

  // Phase 5: Safe export handler
  const _handleExport = useCallback(safeExecute((_format: string) => {
    if (analysisData) {
      setShowExportManager(true)
      PerformanceMonitor.startMeasurement('export-manager-open')
    }
  }, { action: 'export', format: 'unknown' }), [analysisData])

  // Phase 5: Optimized view configuration changes
  const handleViewConfigChange = useCallback((key: keyof ViewConfig, value: any) => {
    setViewConfig(prev => ({ ...prev, [key]: value }))
    PerformanceMonitor.startMeasurement('view-config-change')
  }, [])

  // Phase 5: Fullscreen toggle with performance tracking and body scroll lock
  const toggleFullscreen = useCallback((sectionId: string) => {
    setFullscreenSection(current => {
      const newValue = current === sectionId ? null : sectionId

      // Lock/unlock body scroll
      if (newValue) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }

      return newValue
    })
    PerformanceMonitor.startMeasurement('fullscreen-toggle')
  }, [])

  // Clean up body scroll lock on unmount and add escape key handling
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Close any open modals in order of priority
        if (showAdvancedFilters) setShowAdvancedFilters(false)
        else if (showComparativeAnalysis) setShowComparativeAnalysis(false)
        else if (showAlertSystem) setShowAlertSystem(false)
        else if (showInteractiveCharts) setShowInteractiveCharts(false)
        else if (showExportManager) setShowExportManager(false)
        else if (showCustomizer) setShowCustomizer(false)
        else if (fullscreenSection) setFullscreenSection(null)
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showAdvancedFilters, showComparativeAnalysis, showAlertSystem, showInteractiveCharts, showExportManager, showCustomizer, fullscreenSection])

  // Phase 5: Optimized filter change handler
  const handleFiltersChange = useCallback((filtered: Review[], criteria: FilterCriteria) => {
    const stopMeasurement = PerformanceMonitor.startMeasurement('filters-apply')
    setFilteredReviews(filtered)
    setActiveFilters(criteria)
    stopMeasurement()
  }, [])

  // Phase 5: Memoized layout styles - Updated to always use single column for main grid
  const getLayoutStyles = useMemo(() => {
    const spacing = {
      compact: 'space-y-3',
      normal: 'space-y-6',
      spacious: 'space-y-8',
    }

    // Force single column layout for main content to display cards vertically
    const columns = 'grid-cols-1'

    return {
      spacing: spacing[viewConfig.spacing],
      columns,
      animations: viewConfig.enableAnimations ? 'transition-all duration-300 ease-in-out' : '',
    }
  }, [viewConfig])

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
    )
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
                businessName,
              }, null, 2)}</pre>
            </details>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  // Success state with health score indicator
  const healthScore = analysisData.businessHealthScore.overall
  const healthColor = healthScore >= 80 ? 'text-green-600' :
                     healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'
  const healthIcon = healthScore >= 80 ? CheckCircle :
                    healthScore >= 60 ? AlertTriangle : AlertTriangle
  const HealthIcon = healthIcon

  // Phase 5: Optimized main content rendering - UPDATED SECTION ORDER
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
        ),
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
        ),
      },
      // MOVED STAFF INSIGHTS TO BE RIGHT AFTER PERFORMANCE METRICS
      {
        id: 'staff-insights',
        title: 'Staff Insights',
        component: config.includeStaffAnalysis && analysisData.staffInsights.mentions.length > 0 ? (
          <ComponentErrorBoundary>
            <StaffInsightsSection
              staffInsights={analysisData.staffInsights}
            />
          </ComponentErrorBoundary>
        ) : null,
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
        ),
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
        ) : null,
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
        ),
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
        ) : null,
      },
    ].filter(section => section.component !== null)

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
                <div className={fullscreenSection === section.id ? 'fixed inset-0 z-50 bg-background overflow-hidden flex flex-col' : ''}>
                  {fullscreenSection === section.id && (
                    <div className="flex justify-between items-center p-6 pb-4 border-b">
                      <h2 className="text-2xl font-bold">{section.title}</h2>
                      <Button
                        variant="outline"
                        size="sm"
                        className="z-10"
                        onClick={() => toggleFullscreen(section.id)}
                      >
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className={fullscreenSection === section.id ? 'overflow-y-auto flex-1 p-6' : ''}>
                    {section.component}
                  </div>
                </div>
              </SectionErrorBoundary>
            </TabsContent>
          ))}
        </Tabs>
      )
    }

    // Grid layout (single column for vertical stacking)
    return (
      <div className={`grid gap-6 ${getLayoutStyles.columns}`}>
        {sections.map(section => (
          <SectionErrorBoundary key={section.id}>
            <div
              className={`${getLayoutStyles.animations} ${fullscreenSection === section.id ? 'fixed inset-0 z-50 bg-background overflow-hidden flex flex-col' : ''}`}
            >
              {fullscreenSection === section.id && (
                <div className="flex justify-between items-center p-6 pb-4 border-b">
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
              <div className={`relative group ${fullscreenSection === section.id ? 'overflow-y-auto flex-1 p-6' : ''}`}>
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
    )
  }, [analysisData, config, viewConfig, fullscreenSection, getLayoutStyles, toggleFullscreen])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Analysis Summary</span>
              <InfoTooltip
                content="Comprehensive analysis of all customer reviews, including sentiment, ratings, themes, and actionable insights"
                className="ml-1"
              />
              <span className="text-sm text-muted-foreground">
                ({analysisData.dataSource.totalReviews} reviews analyzed)
              </span>
              {activeFilters && (
                <Badge variant="secondary" className="ml-2">
                  <Filter className="h-3 w-3 mr-1" />
                  Filtered
                  <InfoTooltip
                    content="Results are filtered. Click 'Filters' to modify or clear filters"
                    className="ml-1"
                  />
                </Badge>
              )}
              {autoRefresh && (
                <Badge variant="secondary" className="ml-2">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Auto-refresh
                  <InfoTooltip
                    content="Analysis automatically updates when new reviews are received"
                    className="ml-1"
                  />
                </Badge>
              )}
            </div>
            <div className={`flex items-center gap-2 ${healthColor}`}>
              <HealthIcon className="w-5 h-5" />
              <span className="font-semibold">Health Score: {healthScore}%</span>
              <InfoTooltip
                tooltipPath="metrics.netPromoterScore"
                className="ml-1"
              />
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
                title="Refresh analysis with latest data"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(true)}
              title="Filter reviews by date, rating, sentiment, and more"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filters
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowComparativeAnalysis(true)}
              title="Compare performance across different time periods"
            >
              <GitCompare className="h-4 w-4 mr-1" />
              Compare
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAlertSystem(true)}
              title="Set up automated alerts for performance changes"
            >
              <Shield className="h-4 w-4 mr-1" />
              Alerts
            </Button>

            {exportable && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportManager(true)}
                title="Export analysis data in various formats"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInteractiveCharts(true)}
              title="View detailed interactive charts and visualizations"
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Charts
            </Button>

            {customizable && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomizer(true)}
                title="Customize dashboard layout and appearance"
              >
                <Settings className="h-4 w-4 mr-1" />
                Customize
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewConfigChange('layout', viewConfig.layout === 'grid' ? 'tabs' : 'grid')}
              title={viewConfig.layout === 'grid' ? 'Switch to tabbed view' : 'Switch to grid view'}
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
            Analysis generated on {analysisData.generatedAt.toLocaleDateString()} at{' '}
            {analysisData.generatedAt.toLocaleTimeString()} •
            Data period: {analysisData.timePeriod.current.start.toLocaleDateString()} to{' '}
            {analysisData.timePeriod.current.end.toLocaleDateString()}
            {lastRefresh && onRefresh && (
              <span> • Last refresh: {lastRefresh.toLocaleTimeString()}</span>
            )}
            <InfoTooltip
              tooltipPath="technical.dataFreshness"
              className="ml-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Phase 5: Lazy-loaded modal components with error boundaries */}
      <Dialog open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
        <DialogContentLarge>
          <DialogHeader>
            <DialogTitle>Advanced Filters</DialogTitle>
          </DialogHeader>
          <DialogScrollArea>
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
          </DialogScrollArea>
        </DialogContentLarge>
      </Dialog>

      <Dialog open={showComparativeAnalysis} onOpenChange={setShowComparativeAnalysis}>
        <DialogContentLarge>
          <DialogHeader>
            <DialogTitle>
              Comparative Analysis
              <InfoTooltip
                tooltipPath="comparison.periodSelector"
                className="ml-2"
              />
            </DialogTitle>
          </DialogHeader>
          <DialogScrollArea>
            <Suspense fallback={<LoadingFallback size="large" message="Loading comparison..." />}>
              <SectionErrorBoundary>
                <LazyComparativeAnalysis
                  reviews={reviewsForAnalysis}
                  businessName={businessName}
                  businessType={businessType}
                />
              </SectionErrorBoundary>
            </Suspense>
          </DialogScrollArea>
        </DialogContentLarge>
      </Dialog>

      <Dialog open={showAlertSystem} onOpenChange={setShowAlertSystem}>
        <DialogContentLarge>
          <DialogHeader>
            <DialogTitle>
              Performance Alert System
              <InfoTooltip
                tooltipPath="notifications.alertThreshold"
                className="ml-2"
              />
            </DialogTitle>
          </DialogHeader>
          <DialogScrollArea>
            <Suspense fallback={<LoadingFallback size="large" message="Loading alerts..." />}>
              <SectionErrorBoundary>
                <LazyAlertSystem
                  reviews={reviewsForAnalysis}
                  businessName={businessName}
                  businessType={businessType}
                />
              </SectionErrorBoundary>
            </Suspense>
          </DialogScrollArea>
        </DialogContentLarge>
      </Dialog>

      <Dialog open={showInteractiveCharts} onOpenChange={setShowInteractiveCharts}>
        <DialogContentLarge>
          <DialogHeader>
            <DialogTitle>Interactive Charts</DialogTitle>
          </DialogHeader>
          <DialogScrollArea>
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
          </DialogScrollArea>
        </DialogContentLarge>
      </Dialog>

      <Dialog open={showExportManager && exportable} onOpenChange={setShowExportManager}>
        <DialogContentLarge>
          <DialogHeader>
            <DialogTitle>
              Export Manager
              <InfoTooltip
                tooltipPath="export.exportButton"
                className="ml-2"
              />
            </DialogTitle>
          </DialogHeader>
          <DialogScrollArea>
            <Suspense fallback={<LoadingFallback size="large" message="Loading export manager..." />}>
              <SectionErrorBoundary>
                <LazyExportManager
                  reviews={reviewsForAnalysis}
                  businessName={businessName}
                  businessType={businessType}
                />
              </SectionErrorBoundary>
            </Suspense>
          </DialogScrollArea>
        </DialogContentLarge>
      </Dialog>

      <Dialog open={showCustomizer && customizable} onOpenChange={setShowCustomizer}>
        <DialogContentLarge>
          <DialogHeader>
            <DialogTitle>Dashboard Customizer</DialogTitle>
          </DialogHeader>
          <DialogScrollArea>
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
                    theme: 'light',
                  }}
                  onLayoutChange={(layout) => {
                    handleViewConfigChange('columns', layout.columns)
                  }}
                  onSaveTemplate={() => {}}
                  onLoadTemplate={() => {}}
                  availableTemplates={[]}
                />
              </SectionErrorBoundary>
            </Suspense>
          </DialogScrollArea>
        </DialogContentLarge>
      </Dialog>
    </div>
  )
})

AnalysisSummary.displayName = 'AnalysisSummary'

export default AnalysisSummary
