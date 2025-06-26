import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Calendar,
  Star,
  MessageSquare,
  Heart,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import type { Review } from '@/types/reviews'
import type { BusinessType } from '@/types/businessTypes'
import type {
  ComparisonMetrics,
  PeriodData} from '@/utils/comparisonUtils'
import {
  comparePeriods,
  generateComparisonPeriods,
  createPeriodData,
} from '@/utils/comparisonUtils'
import { CustomBarLineTooltip, CustomPieTooltip } from '@/components/review-analysis/CustomTooltips'

interface ComparativeAnalysisProps {
  reviews: Review[];
  businessName: string;
  businessType: BusinessType;
}

type ComparisonPeriod = '30days' | '90days' | 'year' | 'custom';

export const ComparativeAnalysis: React.FC<ComparativeAnalysisProps> = ({
  reviews,
  businessName,
  businessType,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<ComparisonPeriod>('30days')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // Generate comparison data
  const comparisonData = useMemo(() => {
    if (!reviews.length) return null

    try {
      setLoading(true)

      let currentPeriod: PeriodData
      let previousPeriod: PeriodData
      let label: string

      if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
        const customEnd = new Date(customEndDate)
        const customStart = new Date(customStartDate)
        const duration = customEnd.getTime() - customStart.getTime()

        const prevEnd = new Date(customStart.getTime() - 1) // Day before custom start
        const prevStart = new Date(prevEnd.getTime() - duration)

        currentPeriod = createPeriodData(reviews, customStart, customEnd, 'Custom Period')
        previousPeriod = createPeriodData(reviews, prevStart, prevEnd, 'Previous Period')
        label = 'Custom Comparison'
      } else {
        const pregenerated = generateComparisonPeriods(reviews)

        switch (selectedPeriod) {
          case '30days':
            ({ current: currentPeriod, previous: previousPeriod, label } = pregenerated[0])
            break
          case '90days':
            ({ current: currentPeriod, previous: previousPeriod, label } = pregenerated[1])
            break
          case 'year':
            ({ current: currentPeriod, previous: previousPeriod, label } = pregenerated[2])
            break
          default:
            ({ current: currentPeriod, previous: previousPeriod, label } = pregenerated[0])
        }
      }

      const metrics = comparePeriods(currentPeriod, previousPeriod)

      return {
        metrics,
        currentPeriod,
        previousPeriod,
        label,
      }
    } finally {
      setLoading(false)
    }
  }, [reviews, selectedPeriod, customStartDate, customEndDate])

  if (!comparisonData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-gray-500">No data available for comparison</p>
        </CardContent>
      </Card>
    )
  }

  const { metrics, currentPeriod, previousPeriod, label } = comparisonData

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <CardTitle>Comparative Analysis</CardTitle>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedPeriod} onValueChange={(value: ComparisonPeriod) => setSelectedPeriod(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                  <SelectItem value="year">Year over Year</SelectItem>
                  <SelectItem value="custom">Custom Period</SelectItem>
                </SelectContent>
              </Select>
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Comparing: {currentPeriod.label} vs {previousPeriod.label}</span>
            <span>{label}</span>
          </div>

          {selectedPeriod === 'custom' && (
            <div className="flex items-center space-x-4 mt-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Start Date:</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-1 border rounded text-sm"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">End Date:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-1 border rounded text-sm"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Review Count"
          current={metrics.reviewCount.current}
          previous={metrics.reviewCount.previous}
          change={metrics.reviewCount.changePercent}
          trend={metrics.reviewCount.trend}
          icon={<MessageSquare className="w-5 h-5" />}
          unit=""
        />
        <MetricCard
          title="Average Rating"
          current={metrics.averageRating.current}
          previous={metrics.averageRating.previous}
          change={metrics.averageRating.changePercent}
          trend={metrics.averageRating.trend}
          icon={<Star className="w-5 h-5" />}
          unit=""
          precision={1}
        />
        <MetricCard
          title="Response Rate"
          current={metrics.responseRate.current}
          previous={metrics.responseRate.previous}
          change={metrics.responseRate.change}
          trend={metrics.responseRate.trend}
          icon={<Heart className="w-5 h-5" />}
          unit="%"
          precision={1}
        />
        <MetricCard
          title="Staff Mentions"
          current={Object.values(metrics.staffMentions.current).reduce((sum, count) => sum + count, 0)}
          previous={Object.values(metrics.staffMentions.previous).reduce((sum, count) => sum + count, 0)}
          change={0} // Calculate separately
          trend="stable"
          icon={<Users className="w-5 h-5" />}
          unit=""
        />
      </div>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="sentiment" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
          <TabsTrigger value="themes">Themes</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="sentiment" className="space-y-6">
          <SentimentComparison metrics={metrics} />
        </TabsContent>

        <TabsContent value="themes" className="space-y-6">
          <ThemeComparison metrics={metrics} />
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          <StaffComparison metrics={metrics} />
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <TrendAnalysis currentPeriod={currentPeriod} previousPeriod={previousPeriod} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface MetricCardProps {
  title: string;
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  unit: string;
  precision?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  current,
  previous,
  change,
  trend,
  icon,
  unit,
  precision = 0,
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="w-4 h-4 text-green-500" />
      case 'down':
        return <ArrowDownRight className="w-4 h-4 text-red-500" />
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      case 'stable':
        return 'text-gray-600'
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {icon}
            <span className="text-sm font-medium text-gray-600">{title}</span>
          </div>
          {getTrendIcon()}
        </div>
        <div className="space-y-2">
          <div className="text-2xl font-bold">
            {current.toFixed(precision)}{unit}
          </div>
          <div className="text-sm text-gray-500">
            Previous: {previous.toFixed(precision)}{unit}
          </div>
          <div className={`text-sm font-medium ${getTrendColor()}`}>
            {change > 0 ? '+' : ''}{change.toFixed(1)}{title === 'Response Rate' ? 'pp' : '%'} vs previous
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const SentimentComparison: React.FC<{ metrics: ComparisonMetrics }> = ({ metrics }) => {
  const sentimentData = [
    {
      name: 'Current Period',
      positive: metrics.sentiment.current.positive,
      neutral: metrics.sentiment.current.neutral,
      negative: metrics.sentiment.current.negative,
      mixed: metrics.sentiment.current.mixed,
    },
    {
      name: 'Previous Period',
      positive: metrics.sentiment.previous.positive,
      neutral: metrics.sentiment.previous.neutral,
      negative: metrics.sentiment.previous.negative,
      mixed: metrics.sentiment.previous.mixed,
    },
  ]

  const changeData = [
    { name: 'Positive', change: metrics.sentiment.changes.positive },
    { name: 'Neutral', change: metrics.sentiment.changes.neutral },
    { name: 'Negative', change: metrics.sentiment.changes.negative },
    { name: 'Mixed', change: metrics.sentiment.changes.mixed },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sentiment Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sentimentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomBarLineTooltip />} />
              <Bar dataKey="positive" stackId="a" fill="#10b981" name="Positive" />
              <Bar dataKey="neutral" stackId="a" fill="#6b7280" name="Neutral" />
              <Bar dataKey="negative" stackId="a" fill="#ef4444" name="Negative" />
              <Bar dataKey="mixed" stackId="a" fill="#f59e0b" name="Mixed" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sentiment Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {changeData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.name}</span>
                <div className="flex items-center space-x-2">
                  <div className={`text-sm font-medium ${
                    item.change > 0 ? 'text-green-600' : item.change < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {item.change > 0 ? '+' : ''}{item.change.toFixed(1)}%
                  </div>
                  {item.change > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : item.change < 0 ? (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  ) : (
                    <Minus className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const ThemeComparison: React.FC<{ metrics: ComparisonMetrics }> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-green-600">New Themes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics.themes.new.length === 0 ? (
              <p className="text-gray-500 text-sm">No new themes</p>
            ) : (
              metrics.themes.new.slice(0, 5).map((theme, index) => (
                <Badge key={index} variant="outline" className="mr-1 mb-1">
                  {theme}
                </Badge>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-blue-600">Improving</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics.themes.improving.length === 0 ? (
              <p className="text-gray-500 text-sm">No improving themes</p>
            ) : (
              metrics.themes.improving.slice(0, 5).map((theme, index) => (
                <Badge key={index} variant="outline" className="mr-1 mb-1">
                  {theme}
                </Badge>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-yellow-600">Consistent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics.themes.consistent.length === 0 ? (
              <p className="text-gray-500 text-sm">No consistent themes</p>
            ) : (
              metrics.themes.consistent.slice(0, 5).map((theme, index) => (
                <Badge key={index} variant="outline" className="mr-1 mb-1">
                  {theme}
                </Badge>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-red-600">Declining</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics.themes.declining.length === 0 ? (
              <p className="text-gray-500 text-sm">No declining themes</p>
            ) : (
              metrics.themes.declining.slice(0, 5).map((theme, index) => (
                <Badge key={index} variant="outline" className="mr-1 mb-1">
                  {theme}
                </Badge>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const StaffComparison: React.FC<{ metrics: ComparisonMetrics }> = ({ metrics }) => {
  const staffChanges = Object.entries(metrics.staffMentions.changes)
    .map(([name, change]) => ({
      name,
      change,
      current: metrics.staffMentions.current[name] || 0,
      previous: metrics.staffMentions.previous[name] || 0,
    }))
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Staff Performance Changes</CardTitle>
      </CardHeader>
      <CardContent>
        {staffChanges.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No staff mentions found in reviews</p>
        ) : (
          <div className="space-y-4">
            {staffChanges.slice(0, 10).map((staff) => (
              <div key={staff.name} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <h4 className="font-medium">{staff.name}</h4>
                  <p className="text-sm text-gray-600">
                    Current: {staff.current} mentions | Previous: {staff.previous} mentions
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`text-sm font-medium ${
                    staff.change > 0 ? 'text-green-600' : staff.change < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {staff.change > 0 ? '+' : ''}{staff.change}
                  </div>
                  {staff.change > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : staff.change < 0 ? (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  ) : (
                    <Minus className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const TrendAnalysis: React.FC<{ currentPeriod: PeriodData; previousPeriod: PeriodData }> = ({
  currentPeriod,
  previousPeriod,
}) => {
  // Generate monthly data for trend visualization
  const trendData = useMemo(() => {
    const allReviews = [...currentPeriod.reviews, ...previousPeriod.reviews]
    const monthlyMap = new Map<string, { month: string; count: number; avgRating: number; total: number }>()

    allReviews.forEach(review => {
      if (!review.publishedAtDate) return

      const date = new Date(review.publishedAtDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { month: monthKey, count: 0, avgRating: 0, total: 0 })
      }

      const data = monthlyMap.get(monthKey)!
      data.count++
      data.total += review.stars || 0
      data.avgRating = data.total / data.count
    })

    return Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month))
  }, [currentPeriod, previousPeriod])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Review Volume Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={<CustomBarLineTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Reviews" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rating Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[1, 5]} />
              <Tooltip content={<CustomBarLineTooltip />} />
              <Line type="monotone" dataKey="avgRating" stroke="#10b981" strokeWidth={2} name="Average Rating" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

export default ComparativeAnalysis
