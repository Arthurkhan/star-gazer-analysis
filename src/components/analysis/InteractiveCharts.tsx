import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Brush,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Maximize,
  Settings,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react'
import { format, subDays, subMonths, subYears } from 'date-fns'
import type { Review } from '@/types/reviews'
import type { AnalysisSummaryData } from '@/types/analysisSummary'
import { CustomBarLineTooltip, CustomPieTooltip } from '@/components/review-analysis/CustomTooltips'

interface InteractiveChartsProps {
  reviews: Review[];
  analysisData: AnalysisSummaryData;
  onDataPointClick?: (data: any, chartType: string) => void;
  onChartExport?: (chartData: any, format: string) => void;
  refreshData?: () => void;
  autoRefresh?: boolean;
  className?: string;
}

interface ChartConfig {
  type: 'line' | 'area' | 'bar' | 'pie' | 'radar' | 'scatter';
  dataKey: string;
  title: string;
  description: string;
  color: string;
  secondaryColor?: string;
  gradient?: boolean;
  interactive?: boolean;
  zoomable?: boolean;
  brushable?: boolean;
  clickable?: boolean;
}

interface ChartState {
  zoom: number;
  pan: { x: number; y: number };
  selectedDataPoints: any[];
  visibleSeries: string[];
  timeRange: { start: Date; end: Date };
  comparisonMode: boolean;
  animationEnabled: boolean;
}

// Color palette for charts
const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
]

// Default chart configurations
const DEFAULT_CHART_CONFIGS: Record<string, ChartConfig> = {
  ratingTrends: {
    type: 'line',
    dataKey: 'rating',
    title: 'Rating Trends Over Time',
    description: 'Track how customer ratings change over time',
    color: CHART_COLORS[0],
    gradient: true,
    interactive: true,
    zoomable: true,
    brushable: true,
    clickable: true,
  },
  sentimentTrends: {
    type: 'area',
    dataKey: 'sentiment',
    title: 'Sentiment Analysis Over Time',
    description: 'Monitor customer sentiment changes',
    color: CHART_COLORS[1],
    secondaryColor: CHART_COLORS[2],
    gradient: true,
    interactive: true,
    zoomable: true,
    brushable: true,
    clickable: true,
  },
  volumeTrends: {
    type: 'bar',
    dataKey: 'volume',
    title: 'Review Volume Trends',
    description: 'Track review volume patterns',
    color: CHART_COLORS[2],
    interactive: true,
    zoomable: true,
    clickable: true,
  },
  themeDistribution: {
    type: 'pie',
    dataKey: 'themes',
    title: 'Theme Distribution',
    description: 'Most discussed topics in reviews',
    color: CHART_COLORS[3],
    interactive: true,
    clickable: true,
  },
  performanceRadar: {
    type: 'radar',
    dataKey: 'performance',
    title: 'Performance Overview',
    description: 'Multi-dimensional performance analysis',
    color: CHART_COLORS[4],
    interactive: true,
    clickable: true,
  },
  correlationScatter: {
    type: 'scatter',
    dataKey: 'correlation',
    title: 'Rating vs Sentiment Correlation',
    description: 'Relationship between ratings and sentiment',
    color: CHART_COLORS[5],
    interactive: true,
    zoomable: true,
    clickable: true,
  },
}

export function InteractiveCharts({
  reviews,
  analysisData,
  onDataPointClick,
  onChartExport,
  refreshData,
  autoRefresh = false,
  className = '',
}: InteractiveChartsProps) {
  // State management
  const [activeChart, setActiveChart] = useState<string>('ratingTrends')
  const [chartState, setChartState] = useState<ChartState>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    selectedDataPoints: [],
    visibleSeries: ['primary'],
    timeRange: {
      start: subMonths(new Date(), 12),
      end: new Date(),
    },
    comparisonMode: false,
    animationEnabled: true,
  })
  const [fullscreen, setFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  const chartRef = useRef<HTMLDivElement>(null)

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && refreshData) {
      const interval = setInterval(() => {
        refreshData()
      }, 30000) // Refresh every 30 seconds
      setRefreshInterval(interval)
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [autoRefresh, refreshData])

  // Prepare chart data
  const chartData = useMemo(() => {
    const data: Record<string, any[]> = {}

    // Rating trends data
    data.ratingTrends = processRatingTrends(reviews, chartState.timeRange)

    // Sentiment trends data
    data.sentimentTrends = processSentimentTrends(reviews, chartState.timeRange)

    // Volume trends data
    data.volumeTrends = processVolumeTrends(reviews, chartState.timeRange)

    // Theme distribution data
    data.themeDistribution = processThemeDistribution(analysisData)

    // Performance radar data
    data.performanceRadar = processPerformanceRadar(analysisData)

    // Correlation scatter data
    data.correlationScatter = processCorrelationData(reviews)

    return data
  }, [reviews, analysisData, chartState.timeRange])

  // Handle data point clicks
  const handleDataPointClick = useCallback((data: any, chartType: string) => {
    setChartState(prev => ({
      ...prev,
      selectedDataPoints: [...prev.selectedDataPoints, { data, chartType, timestamp: new Date() }],
    }))

    if (onDataPointClick) {
      onDataPointClick(data, chartType)
    }
  }, [onDataPointClick])

  // Handle chart export
  const handleChartExport = useCallback((format: 'png' | 'svg' | 'pdf') => {
    if (onChartExport) {
      const chartData = {
        type: activeChart,
        data: chartData[activeChart],
        config: DEFAULT_CHART_CONFIGS[activeChart],
        timestamp: new Date(),
      }
      onChartExport(chartData, format)
    }
  }, [activeChart, chartData, onChartExport])

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setChartState(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.2, 5) }))
  }, [])

  const handleZoomOut = useCallback(() => {
    setChartState(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.2, 0.5) }))
  }, [])

  const handleZoomReset = useCallback(() => {
    setChartState(prev => ({
      ...prev,
      zoom: 1,
      pan: { x: 0, y: 0 },
      selectedDataPoints: [],
    }))
  }, [])

  // Time range controls
  const handleTimeRangeChange = useCallback((range: string) => {
    const end = new Date()
    let start: Date

    switch (range) {
      case '7d':
        start = subDays(end, 7)
        break
      case '30d':
        start = subDays(end, 30)
        break
      case '90d':
        start = subDays(end, 90)
        break
      case '6m':
        start = subMonths(end, 6)
        break
      case '1y':
        start = subYears(end, 1)
        break
      default:
        start = subMonths(end, 12)
    }

    setChartState(prev => ({ ...prev, timeRange: { start, end } }))
  }, [])

  // Toggle series visibility
  const toggleSeriesVisibility = useCallback((series: string) => {
    setChartState(prev => ({
      ...prev,
      visibleSeries: prev.visibleSeries.includes(series)
        ? prev.visibleSeries.filter(s => s !== series)
        : [...prev.visibleSeries, series],
    }))
  }, [])

  // Render chart controls
  const renderChartControls = () => (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-muted/50 rounded-lg">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleZoomReset}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-2 items-center">
        <Label htmlFor="time-range">Time Range:</Label>
        <Select defaultValue="12m" onValueChange={handleTimeRangeChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
            <SelectItem value="90d">90 Days</SelectItem>
            <SelectItem value="6m">6 Months</SelectItem>
            <SelectItem value="1y">1 Year</SelectItem>
            <SelectItem value="12m">12 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 items-center">
        <Label htmlFor="comparison-mode">Compare:</Label>
        <Switch
          id="comparison-mode"
          checked={chartState.comparisonMode}
          onCheckedChange={(checked) =>
            setChartState(prev => ({ ...prev, comparisonMode: checked }))
          }
        />
      </div>

      <div className="flex gap-2 items-center">
        <Label htmlFor="animation">Animation:</Label>
        <Switch
          id="animation"
          checked={chartState.animationEnabled}
          onCheckedChange={(checked) =>
            setChartState(prev => ({ ...prev, animationEnabled: checked }))
          }
        />
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => handleChartExport('png')}>
          <Download className="h-4 w-4 mr-1" />
          PNG
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleChartExport('svg')}>
          <Download className="h-4 w-4 mr-1" />
          SVG
        </Button>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setFullscreen(!fullscreen)}
      >
        <Maximize className="h-4 w-4" />
      </Button>
    </div>
  )

  // Render line chart
  const renderLineChart = (config: ChartConfig, data: any[]) => (
    <ResponsiveContainer width="100%" height={300} minHeight={250}>
      <LineChart
        data={data}
        onClick={(e) => config.clickable && handleDataPointClick(e?.activePayload?.[0]?.payload, config.type)}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip content={<CustomBarLineTooltip />} />
        <Legend />
        {config.gradient && (
          <defs>
            <linearGradient id={`gradient-${config.dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={config.color} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={config.color} stopOpacity={0.1}/>
            </linearGradient>
          </defs>
        )}
        <Line
          type="monotone"
          dataKey={config.dataKey}
          stroke={config.color}
          strokeWidth={2}
          dot={{ fill: config.color, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: config.color }}
          animationDuration={chartState.animationEnabled ? 1000 : 0}
        />
        {config.brushable && <Brush dataKey="date" height={30} />}
      </LineChart>
    </ResponsiveContainer>
  )

  // Render area chart
  const renderAreaChart = (config: ChartConfig, data: any[]) => (
    <ResponsiveContainer width="100%" height={300} minHeight={250}>
      <AreaChart
        data={data}
        onClick={(e) => config.clickable && handleDataPointClick(e?.activePayload?.[0]?.payload, config.type)}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip content={<CustomBarLineTooltip />} />
        <Legend />
        <defs>
          <linearGradient id={`area-gradient-${config.dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={config.color} stopOpacity={0.8}/>
            <stop offset="95%" stopColor={config.color} stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey={config.dataKey}
          stroke={config.color}
          fillOpacity={1}
          fill={`url(#area-gradient-${config.dataKey})`}
          animationDuration={chartState.animationEnabled ? 1000 : 0}
        />
        {config.secondaryColor && (
          <Area
            type="monotone"
            dataKey={`${config.dataKey}Secondary`}
            stroke={config.secondaryColor}
            fillOpacity={1}
            fill={config.secondaryColor}
            animationDuration={chartState.animationEnabled ? 1000 : 0}
          />
        )}
        {config.brushable && <Brush dataKey="date" height={30} />}
      </AreaChart>
    </ResponsiveContainer>
  )

  // Render bar chart
  const renderBarChart = (config: ChartConfig, data: any[]) => (
    <ResponsiveContainer width="100%" height={300} minHeight={250}>
      <BarChart
        data={data}
        onClick={(e) => config.clickable && handleDataPointClick(e?.activePayload?.[0]?.payload, config.type)}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip content={<CustomBarLineTooltip />} />
        <Legend />
        <Bar
          dataKey={config.dataKey}
          fill={config.color}
          animationDuration={chartState.animationEnabled ? 1000 : 0}
        />
        {config.brushable && <Brush dataKey="date" height={30} />}
      </BarChart>
    </ResponsiveContainer>
  )

  // Render pie chart
  const renderPieChart = (config: ChartConfig, data: any[]) => (
    <ResponsiveContainer width="100%" height={300} minHeight={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
          onClick={(e) => config.clickable && handleDataPointClick(e, config.type)}
          animationDuration={chartState.animationEnabled ? 1000 : 0}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomPieTooltip />} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )

  // Render radar chart
  const renderRadarChart = (config: ChartConfig, data: any[]) => (
    <ResponsiveContainer width="100%" height={300} minHeight={250}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis angle={90} domain={[0, 100]} />
        <Radar
          name="Performance"
          dataKey="value"
          stroke={config.color}
          fill={config.color}
          fillOpacity={0.6}
          animationDuration={chartState.animationEnabled ? 1000 : 0}
        />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  )

  // Render scatter chart
  const renderScatterChart = (config: ChartConfig, data: any[]) => (
    <ResponsiveContainer width="100%" height={300} minHeight={250}>
      <ScatterChart
        data={data}
        onClick={(e) => config.clickable && handleDataPointClick(e?.activePayload?.[0]?.payload, config.type)}
      >
        <CartesianGrid />
        <XAxis type="number" dataKey="x" name="Rating" />
        <YAxis type="number" dataKey="y" name="Sentiment" />
        <ZAxis type="number" dataKey="z" range={[60, 400]} name="Volume" />
        <Tooltip content={<CustomBarLineTooltip />} />
        <Scatter
          name="Reviews"
          data={data}
          fill={config.color}
          animationDuration={chartState.animationEnabled ? 1000 : 0}
        />
      </ScatterChart>
    </ResponsiveContainer>
  )

  // Main chart renderer
  const renderChart = (chartType: string) => {
    const config = DEFAULT_CHART_CONFIGS[chartType]
    const data = chartData[chartType]

    if (!config || !data) return null

    switch (config.type) {
      case 'line':
        return renderLineChart(config, data)
      case 'area':
        return renderAreaChart(config, data)
      case 'bar':
        return renderBarChart(config, data)
      case 'pie':
        return renderPieChart(config, data)
      case 'radar':
        return renderRadarChart(config, data)
      case 'scatter':
        return renderScatterChart(config, data)
      default:
        return null
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Interactive Charts
              {autoRefresh && refreshData && (
                <Badge variant="secondary" className="ml-2">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Auto-refresh
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowControls(!showControls)}
              >
                {showControls ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showControls ? 'Hide' : 'Show'} Controls
              </Button>
              {refreshData && (
                <Button variant="outline" size="sm" onClick={refreshData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeChart} onValueChange={setActiveChart}>
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="ratingTrends" className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Ratings</span>
              </TabsTrigger>
              <TabsTrigger value="sentimentTrends" className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Sentiment</span>
              </TabsTrigger>
              <TabsTrigger value="volumeTrends" className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Volume</span>
              </TabsTrigger>
              <TabsTrigger value="themeDistribution" className="flex items-center gap-1">
                <PieChartIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Themes</span>
              </TabsTrigger>
              <TabsTrigger value="performanceRadar" className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Performance</span>
              </TabsTrigger>
              <TabsTrigger value="correlationScatter" className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Correlation</span>
              </TabsTrigger>
            </TabsList>

            {showControls && renderChartControls()}

            {Object.keys(DEFAULT_CHART_CONFIGS).map(chartType => (
              <TabsContent key={chartType} value={chartType} className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{DEFAULT_CHART_CONFIGS[chartType].title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {DEFAULT_CHART_CONFIGS[chartType].description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div ref={chartRef} className="w-full">
                      {renderChart(chartType)}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Selected data points */}
          {chartState.selectedDataPoints.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Selected Data Points
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setChartState(prev => ({ ...prev, selectedDataPoints: [] }))}
                  >
                    Clear
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {chartState.selectedDataPoints.map((point, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div>
                        <span className="font-medium">{point.chartType}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {JSON.stringify(point.data)}
                        </span>
                      </div>
                      <Badge variant="outline">
                        {format(point.timestamp, 'HH:mm:ss')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Data processing functions
function processRatingTrends(reviews: Review[], timeRange: { start: Date; end: Date }) {
  const filtered = reviews.filter(review => {
    const date = new Date(review.publishedAtDate)
    return date >= timeRange.start && date <= timeRange.end
  })

  const grouped = filtered.reduce((acc, review) => {
    const date = format(new Date(review.publishedAtDate), 'yyyy-MM-dd')
    if (!acc[date]) {
      acc[date] = { ratings: [], count: 0 }
    }
    acc[date].ratings.push(review.stars)
    acc[date].count++
    return acc
  }, {} as Record<string, { ratings: number[]; count: number }>)

  return Object.entries(grouped).map(([date, data]) => ({
    date,
    rating: data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length,
    count: data.count,
  })).sort((a, b) => a.date.localeCompare(b.date))
}

function processSentimentTrends(reviews: Review[], timeRange: { start: Date; end: Date }) {
  const filtered = reviews.filter(review => {
    const date = new Date(review.publishedAtDate)
    return date >= timeRange.start && date <= timeRange.end && review.sentiment
  })

  const grouped = filtered.reduce((acc, review) => {
    const date = format(new Date(review.publishedAtDate), 'yyyy-MM-dd')
    if (!acc[date]) {
      acc[date] = { positive: 0, neutral: 0, negative: 0, total: 0 }
    }

    const sentiment = review.sentiment?.toLowerCase()
    if (sentiment === 'positive') acc[date].positive++
    else if (sentiment === 'negative') acc[date].negative++
    else acc[date].neutral++

    acc[date].total++
    return acc
  }, {} as Record<string, { positive: number; neutral: number; negative: number; total: number }>)

  return Object.entries(grouped).map(([date, data]) => ({
    date,
    sentiment: data.total > 0 ? (data.positive - data.negative) / data.total : 0,
    positive: data.total > 0 ? (data.positive / data.total) * 100 : 0,
    neutral: data.total > 0 ? (data.neutral / data.total) * 100 : 0,
    negative: data.total > 0 ? (data.negative / data.total) * 100 : 0,
  })).sort((a, b) => a.date.localeCompare(b.date))
}

function processVolumeTrends(reviews: Review[], timeRange: { start: Date; end: Date }) {
  const filtered = reviews.filter(review => {
    const date = new Date(review.publishedAtDate)
    return date >= timeRange.start && date <= timeRange.end
  })

  const grouped = filtered.reduce((acc, review) => {
    const date = format(new Date(review.publishedAtDate), 'yyyy-MM-dd')
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(grouped).map(([date, volume]) => ({
    date,
    volume,
  })).sort((a, b) => a.date.localeCompare(b.date))
}

function processThemeDistribution(analysisData: AnalysisSummaryData) {
  return analysisData.thematicAnalysis.topCategories.slice(0, 8).map(theme => ({
    name: theme.category,
    value: theme.count,
    sentiment: theme.averageSentiment,
  }))
}

function processPerformanceRadar(analysisData: AnalysisSummaryData) {
  return [
    { subject: 'Rating', value: (analysisData.performanceMetrics.averageRating / 5) * 100 },
    { subject: 'Sentiment', value: analysisData.sentimentAnalysis.distribution.positive },
    { subject: 'Response Rate', value: analysisData.responseAnalytics.responseRate },
    { subject: 'Volume', value: Math.min(100, (analysisData.performanceMetrics.totalReviews / 100) * 10) },
    { subject: 'Growth', value: Math.max(0, Math.min(100, analysisData.performanceMetrics.growthRate + 50)) },
  ]
}

function processCorrelationData(reviews: Review[]) {
  return reviews
    .filter(review => review.sentiment)
    .map(review => {
      const sentimentScore = review.sentiment === 'positive' ? 1 :
                           review.sentiment === 'negative' ? -1 : 0
      return {
        x: review.stars,
        y: sentimentScore,
        z: review.text?.length || 0,
      }
    })
    .slice(0, 100) // Limit for performance
}

export default InteractiveCharts
