import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { TrendingUp, TrendingDown, BarChart3, Filter, Download, ZoomIn } from 'lucide-react'
import type { Review } from '@/types/reviews'
import { calculateSeasonalTrends, analyzeCustomerJourney, generateCompetitiveInsights } from '@/utils/performanceMetrics'
import { CustomBarLineTooltip, CustomPieTooltip } from '@/components/review-analysis/CustomTooltips'
import { subMonths, format, parseISO } from 'date-fns'

interface AdvancedChartsSectionProps {
  reviews: Review[];
  businessName: string;
  businessType: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0']

export function AdvancedChartsSection({ reviews, businessName, businessType }: AdvancedChartsSectionProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('12m')
  const [selectedChart, setSelectedChart] = useState<string>('trends')
  const [drillDownData, setDrillDownData] = useState<any>(null)

  // Filter reviews based on selected time range
  const filteredReviews = useMemo(() => {
    const now = new Date()
    let startDate: Date

    switch (selectedTimeRange) {
      case '3m':
        startDate = subMonths(now, 3)
        break
      case '6m':
        startDate = subMonths(now, 6)
        break
      case '12m':
        startDate = subMonths(now, 12)
        break
      case '24m':
        startDate = subMonths(now, 24)
        break
      default:
        startDate = subMonths(now, 12)
    }

    return reviews.filter(review => {
      const reviewDate = parseISO(review.publishedAtDate)
      return reviewDate >= startDate
    })
  }, [reviews, selectedTimeRange])

  // Calculate advanced analytics data
  const seasonalTrends = useMemo(() => calculateSeasonalTrends(filteredReviews), [filteredReviews])
  const customerJourneys = useMemo(() => analyzeCustomerJourney(filteredReviews), [filteredReviews])
  const competitiveInsights = useMemo(() => generateCompetitiveInsights(filteredReviews, businessType), [filteredReviews, businessType])

  // Prepare chart data
  const trendData = seasonalTrends.map(trend => ({
    period: format(parseISO(`${trend.period}-01`), 'MMM yyyy'),
    rating: trend.avgRating,
    volume: trend.reviewCount,
    sentiment: trend.sentimentScore,
    trendDirection: trend.trendDirection,
    seasonality: trend.seasonality,
  }))

  const customerSegmentData = useMemo(() => {
    const segments = customerJourneys.reduce((acc, journey) => {
      acc[journey.journeyStage] = (acc[journey.journeyStage] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(segments).map(([stage, count]) => ({
      stage,
      count,
      percentage: (count / customerJourneys.length) * 100,
    }))
  }, [customerJourneys])

  const competitiveComparisonData = competitiveInsights.map(insight => ({
    category: insight.category,
    yourScore: insight.yourPerformance,
    industry: insight.industryAverage,
    topPerformer: insight.topPerformer,
    gap: insight.improvementOpportunity,
  }))

  // Handle chart interactions
  const handleChartClick = (data: any, chartType: string) => {
    setDrillDownData({ ...data, chartType })
  }

  const exportChartData = () => {
    const dataToExport = {
      trends: trendData,
      customerSegments: customerSegmentData,
      competitive: competitiveComparisonData,
      timeRange: selectedTimeRange,
      businessName,
      generatedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${businessName}-advanced-analytics-${selectedTimeRange}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Advanced Analytics Dashboard
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">3 Months</SelectItem>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="12m">12 Months</SelectItem>
                <SelectItem value="24m">24 Months</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportChartData} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedChart} onValueChange={setSelectedChart}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trends">Performance Trends</TabsTrigger>
            <TabsTrigger value="segments">Customer Segments</TabsTrigger>
            <TabsTrigger value="competitive">Competitive Analysis</TabsTrigger>
            <TabsTrigger value="correlation">Correlation Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Multi-metric Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Multi-Metric Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData} onClick={(data) => handleChartClick(data, 'trends')}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis yAxisId="rating" orientation="left" domain={[0, 5]} />
                      <YAxis yAxisId="volume" orientation="right" />
                      <Tooltip content={<CustomBarLineTooltip />} />
                      <Legend />
                      <Line
                        yAxisId="rating"
                        type="monotone"
                        dataKey="rating"
                        stroke="#8884d8"
                        strokeWidth={3}
                        name="Average Rating"
                      />
                      <Line
                        yAxisId="volume"
                        type="monotone"
                        dataKey="volume"
                        stroke="#82ca9d"
                        strokeWidth={2}
                        name="Review Volume"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Sentiment Evolution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sentiment Evolution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip content={<CustomBarLineTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="sentiment"
                        stroke="#ffc658"
                        fill="#ffc658"
                        fillOpacity={0.6}
                        name="Sentiment Score"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Seasonal Patterns */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Seasonal Patterns & Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {trendData.map((trend, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{trend.period}</span>
                        <Badge variant={trend.seasonality === 'peak' ? 'default' : trend.seasonality === 'low' ? 'destructive' : 'secondary'}>
                          {trend.seasonality}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {trend.trendDirection === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : trend.trendDirection === 'down' ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : (
                          <div className="h-4 w-4" />
                        )}
                        <span className="text-sm">
                          {trend.rating.toFixed(1)}★ ({trend.volume} reviews)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="segments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Journey Stages */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Journey Stages</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={customerSegmentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ stage, percentage }) => `${stage}: ${percentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {customerSegmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Customer Loyalty Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Loyalty Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={customerJourneys.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="journeyStage" />
                      <YAxis />
                      <Tooltip content={<CustomBarLineTooltip />} />
                      <Bar dataKey="loyaltyScore" fill="#82ca9d" name="Loyalty Score" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="competitive" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Competitive Benchmarking</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={competitiveComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip content={<CustomBarLineTooltip />} />
                    <Legend />
                    <Bar dataKey="yourScore" fill="#8884d8" name="Your Performance" />
                    <Bar dataKey="industry" fill="#82ca9d" name="Industry Average" />
                    <Bar dataKey="topPerformer" fill="#ffc658" name="Top Performer" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Competitive Position Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {competitiveInsights.map((insight, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{insight.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Your Score:</span>
                        <span className="font-semibold">{insight.yourPerformance.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Industry Avg:</span>
                        <span>{insight.industryAverage.toFixed(1)}</span>
                      </div>
                      <Badge variant={
                        insight.competitivePosition === 'leader' ? 'default' :
                        insight.competitivePosition === 'contender' ? 'secondary' :
                        insight.competitivePosition === 'follower' ? 'outline' : 'destructive'
                      }>
                        {insight.competitivePosition}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-2">{insight.strategicRecommendation}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="correlation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rating vs Volume Correlation</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rating" name="Average Rating" unit="★" />
                    <YAxis dataKey="volume" name="Review Volume" />
                    <Tooltip content={<CustomBarLineTooltip />} />
                    <Scatter name="Period Data" data={trendData} fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Drill-down Modal */}
        {drillDownData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-11/12 max-w-4xl max-h-5/6 overflow-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Detailed Analysis: {drillDownData.period || 'Data Point'}</CardTitle>
                  <Button onClick={() => setDrillDownData(null)} variant="outline" size="sm">
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Performance Metrics</h4>
                    <div className="space-y-2">
                      <div>Average Rating: {drillDownData.rating?.toFixed(1) || 'N/A'}★</div>
                      <div>Review Volume: {drillDownData.volume || 'N/A'}</div>
                      <div>Sentiment Score: {drillDownData.sentiment || 'N/A'}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Trend Analysis</h4>
                    <div className="space-y-2">
                      <div>Direction: {drillDownData.trendDirection || 'N/A'}</div>
                      <div>Seasonality: {drillDownData.seasonality || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AdvancedChartsSection
