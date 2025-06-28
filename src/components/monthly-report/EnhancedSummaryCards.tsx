import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Table2,
  Star,
  MessageCircle,
  Target,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { MonthlyReportExporter } from '@/utils/monthlyReportExporter'
import { reviewFieldAccessor, type Review } from '@/types/reviews'
import { getTooltipStyles } from '@/utils/themeUtils'

// Enhanced color palette for charts
const RATING_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E']

interface EnhancedSummaryCardsProps {
  summaryData: {
    totalReviews: number
    averageRating: number
    ratingDistribution: { name: string; value: number }[]
    comparison: {
      previousPeriod: {
        change: number
        percentage: number
        totalReviews: number
      }
      previousYear: {
        change: number
        percentage: number
        totalReviews: number
      }
    }
  }
  selectedReviews: Review[]
  dateRange: {
    from: Date
    to: Date | undefined
  }
  businessName?: string
}

export function EnhancedSummaryCards({
  summaryData,
  selectedReviews,
  dateRange,
  businessName = 'Business',
}: EnhancedSummaryCardsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  // Calculate enhanced business metrics
  const enhancedMetrics = React.useMemo(() => {
    const fiveStarReviews =
      summaryData.ratingDistribution.find(r => r.name === '5 ★')?.value || 0
    const fourPlusReviews = summaryData.ratingDistribution
      .filter(r => r.name === '5 ★' || r.name === '4 ★')
      .reduce((sum, r) => sum + r.value, 0)

    const satisfactionRate =
      summaryData.totalReviews > 0
        ? Math.round((fourPlusReviews / summaryData.totalReviews) * 100)
        : 0

    const excellenceRate =
      summaryData.totalReviews > 0
        ? Math.round((fiveStarReviews / summaryData.totalReviews) * 100)
        : 0

    // Calculate response trend (simplified for demo)
    const responseRate = selectedReviews.filter(r => {
      const responseText = reviewFieldAccessor.getResponseText(r)
      return responseText && responseText.trim().length > 0
    }).length
    const responsePercentage =
      summaryData.totalReviews > 0
        ? Math.round((responseRate / summaryData.totalReviews) * 100)
        : 0

    // Health score calculation
    const healthScore = Math.round(
      (summaryData.averageRating / 5) * 40 +
        satisfactionRate * 0.35 +
        responsePercentage * 0.25,
    )

    return {
      satisfactionRate,
      excellenceRate,
      responseRate,
      responsePercentage,
      healthScore,
      totalResponses: responseRate,
    }
  }, [summaryData, selectedReviews])

  // Export functions with actual implementation
  const exportToPDF = async () => {
    setIsExporting(true)
    try {
      const exportData = {
        summaryData,
        selectedReviews,
        dateRange,
        businessName,
        enhancedMetrics,
      }

      await MonthlyReportExporter.exportToPDF(exportData, {
        includeCharts: true,
        includeReviews: true,
        format: 'detailed',
      })

      toast({
        title: 'Export Successful',
        description: 'Monthly report exported to PDF successfully.',
      })
    } catch (error) {
      console.error('PDF Export Error:', error)
      toast({
        title: 'Export Failed',
        description:
          'Failed to export PDF. Please ensure you have sufficient data and try again.',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const exportToExcel = async () => {
    setIsExporting(true)
    try {
      const exportData = {
        summaryData,
        selectedReviews,
        dateRange,
        businessName,
        enhancedMetrics,
      }

      await MonthlyReportExporter.exportToExcel(exportData, {
        includeReviews: true,
      })

      toast({
        title: 'Export Successful',
        description: 'Monthly report exported to Excel successfully.',
      })
    } catch (error) {
      console.error('Excel Export Error:', error)
      toast({
        title: 'Export Failed',
        description:
          'Failed to export Excel. Please ensure you have sufficient data and try again.',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const formatDateRange = () => {
    const from = dateRange.from.toLocaleDateString()
    const to = dateRange.to?.toLocaleDateString() || 'Present'
    return `${from} - ${to}`
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getHealthScoreIcon = (score: number) => {
    if (score >= 80) return CheckCircle
    if (score >= 60) return AlertCircle
    return AlertCircle
  }

  const HealthIcon = getHealthScoreIcon(enhancedMetrics.healthScore)

  return (
    <div className='space-y-6'>
      {/* Header with export buttons */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>
            Monthly Report Summary
          </h2>
          <p className='text-muted-foreground'>
            {businessName} • {formatDateRange()}
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={exportToPDF}
            disabled={isExporting || summaryData.totalReviews === 0}
          >
            <FileText className='h-4 w-4 mr-2' />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={exportToExcel}
            disabled={isExporting || summaryData.totalReviews === 0}
          >
            <Table2 className='h-4 w-4 mr-2' />
            {isExporting ? 'Exporting...' : 'Export Excel'}
          </Button>
        </div>
      </div>

      {/* No data warning */}
      {summaryData.totalReviews === 0 && (
        <Alert>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            No reviews found for the selected date range. Please select a
            different period or check your data.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Performance Indicators */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Reviews</CardTitle>
            <MessageCircle className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{summaryData.totalReviews}</div>
            <div className='flex items-center text-xs text-muted-foreground'>
              {summaryData.comparison.previousPeriod.change > 0 ? (
                <TrendingUp className='h-3 w-3 text-green-500 mr-1' />
              ) : summaryData.comparison.previousPeriod.change < 0 ? (
                <TrendingDown className='h-3 w-3 text-red-500 mr-1' />
              ) : (
                <Minus className='h-3 w-3 text-gray-500 mr-1' />
              )}
              {summaryData.comparison.previousPeriod.change > 0 ? '+' : ''}
              {summaryData.comparison.previousPeriod.change} from previous
              period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Average Rating
            </CardTitle>
            <Star className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {summaryData.averageRating.toFixed(1)}
              <span className='text-yellow-500 ml-1'>★</span>
            </div>
            <p className='text-xs text-muted-foreground'>
              Based on {summaryData.totalReviews} reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Satisfaction Rate
            </CardTitle>
            <Target className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {enhancedMetrics.satisfactionRate}%
            </div>
            <p className='text-xs text-muted-foreground'>4+ star reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Health Score</CardTitle>
            <HealthIcon
              className={`h-4 w-4 ${getHealthScoreColor(enhancedMetrics.healthScore)}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getHealthScoreColor(enhancedMetrics.healthScore)}`}
            >
              {enhancedMetrics.healthScore}
            </div>
            <p className='text-xs text-muted-foreground'>
              Overall business health
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Analytics Section */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Enhanced Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Rating Distribution</CardTitle>
            <CardDescription>Detailed breakdown by star rating</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='h-[250px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={summaryData.ratingDistribution}>
                  <CartesianGrid strokeDasharray='3 3' opacity={0.3} />
                  <XAxis dataKey='name' />
                  <YAxis />
                  <Tooltip
                    formatter={value => [`${value} reviews`, 'Count']}
                    contentStyle={getTooltipStyles()}
                    labelStyle={{ color: '#f3f4f6' }}
                  />
                  <Bar dataKey='value' name='Count'>
                    {summaryData.ratingDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={RATING_COLORS[index % RATING_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Business Insights */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Business Insights</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex justify-between items-center'>
              <span className='text-sm font-medium'>Excellence Rate (5★)</span>
              <Badge
                variant={
                  enhancedMetrics.excellenceRate >= 50 ? 'default' : 'secondary'
                }
              >
                {enhancedMetrics.excellenceRate}%
              </Badge>
            </div>
            <Separator />

            <div className='flex justify-between items-center'>
              <span className='text-sm font-medium'>Owner Response Rate</span>
              <Badge
                variant={
                  enhancedMetrics.responsePercentage >= 50
                    ? 'default'
                    : 'secondary'
                }
              >
                {enhancedMetrics.responsePercentage}%
              </Badge>
            </div>
            <Separator />

            <div className='flex justify-between items-center'>
              <span className='text-sm font-medium'>Total Responses</span>
              <span className='text-sm font-bold'>
                {enhancedMetrics.totalResponses}
              </span>
            </div>
            <Separator />

            {/* Performance Alerts */}
            {summaryData.averageRating < 4.0 && (
              <Alert>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>
                  Average rating below 4.0. Consider reviewing recent feedback.
                </AlertDescription>
              </Alert>
            )}

            {enhancedMetrics.responsePercentage < 30 && (
              <Alert>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>
                  Low response rate. Engage more with customer feedback.
                </AlertDescription>
              </Alert>
            )}

            {summaryData.totalReviews === 0 && (
              <Alert>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>
                  No reviews in selected period. Export functionality requires
                  review data.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comparison Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Period Comparison</CardTitle>
          <CardDescription>Performance vs previous periods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <h4 className='font-medium'>vs Previous Period</h4>
              <div className='flex items-center gap-2'>
                <div className='flex items-center'>
                  {summaryData.comparison.previousPeriod.change > 0 ? (
                    <TrendingUp className='h-4 w-4 text-green-500 mr-1' />
                  ) : summaryData.comparison.previousPeriod.change < 0 ? (
                    <TrendingDown className='h-4 w-4 text-red-500 mr-1' />
                  ) : (
                    <Minus className='h-4 w-4 text-gray-500 mr-1' />
                  )}
                  <span className='font-bold'>
                    {summaryData.comparison.previousPeriod.change > 0
                      ? '+'
                      : ''}
                    {summaryData.comparison.previousPeriod.change}
                  </span>
                  <span className='text-muted-foreground ml-1'>reviews</span>
                </div>
              </div>
              <p className='text-sm text-muted-foreground'>
                {summaryData.comparison.previousPeriod.percentage.toFixed(1)}%
                change from {summaryData.comparison.previousPeriod.totalReviews}{' '}
                reviews
              </p>
            </div>

            <div className='space-y-2'>
              <h4 className='font-medium'>vs Same Period Last Year</h4>
              <div className='flex items-center gap-2'>
                <div className='flex items-center'>
                  {summaryData.comparison.previousYear.change > 0 ? (
                    <TrendingUp className='h-4 w-4 text-green-500 mr-1' />
                  ) : summaryData.comparison.previousYear.change < 0 ? (
                    <TrendingDown className='h-4 w-4 text-red-500 mr-1' />
                  ) : (
                    <Minus className='h-4 w-4 text-gray-500 mr-1' />
                  )}
                  <span className='font-bold'>
                    {summaryData.comparison.previousYear.change > 0 ? '+' : ''}
                    {summaryData.comparison.previousYear.change}
                  </span>
                  <span className='text-muted-foreground ml-1'>reviews</span>
                </div>
              </div>
              <p className='text-sm text-muted-foreground'>
                {summaryData.comparison.previousYear.percentage.toFixed(1)}%
                change from {summaryData.comparison.previousYear.totalReviews}{' '}
                reviews
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
