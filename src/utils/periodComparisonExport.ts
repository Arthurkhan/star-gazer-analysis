import { format } from 'date-fns'
import type { Review } from '@/types/reviews'
import {
  generateAndDownloadPDF,
  type ExportOptions,
} from '@/services/exportService'

interface ExportPeriodComparisonOptions {
  businessName: string
  currentPeriod: {
    from: Date
    to: Date
    reviews: Review[]
  }
  previousPeriod: {
    from: Date
    to: Date
    reviews: Review[]
  }
  comparisonResult: any
}

/**
 * Export period comparison report using new React-PDF system
 */
export async function exportPeriodComparisonReport({
  businessName,
  currentPeriod,
  previousPeriod,
  comparisonResult,
}: ExportPeriodComparisonOptions): Promise<void> {
  // Transform data for PDF export
  const exportData = {
    historicalTrends: [
      {
        period: format(currentPeriod.from, 'MMM yyyy'),
        avgRating: comparisonResult.currentMetrics?.averageRating || 0,
        reviewCount: currentPeriod.reviews.length,
      },
      {
        period: format(previousPeriod.from, 'MMM yyyy'),
        avgRating: comparisonResult.previousMetrics?.averageRating || 0,
        reviewCount: previousPeriod.reviews.length,
      },
    ],
    reviewClusters: [],
    temporalPatterns: {
      dayOfWeek: [],
      timeOfDay: [],
    },
    seasonalAnalysis: [],
    insights: [
      `Period comparison: ${format(currentPeriod.from, 'MMM dd, yyyy')} - ${format(currentPeriod.to, 'MMM dd, yyyy')}`,
      `Previous period: ${format(previousPeriod.from, 'MMM dd, yyyy')} - ${format(previousPeriod.to, 'MMM dd, yyyy')}`,
      `Review volume change: ${comparisonResult.reviewVolumeChange || 0}%`,
      `Rating change: ${comparisonResult.ratingChange || 0}`,
      `Sentiment trend: ${comparisonResult.sentimentTrend || 'No change'}`,
    ],
  }

  const exportOptions: ExportOptions = {
    businessName,
    businessType: 'CAFE', // Default, should be passed as parameter in real implementation
    includeCharts: true,
    includeTables: true,
    includeRecommendations: true,
    dateRange: {
      start: currentPeriod.from,
      end: currentPeriod.to,
    },
    customTitle: `${businessName} - Period Comparison Report`,
    brandingColor: '#3B82F6',
  }

  try {
    await generateAndDownloadPDF(exportData, exportOptions)
  } catch (error) {
    console.error('Error exporting period comparison report:', error)
    throw new Error('Failed to export period comparison report')
  }
}

/**
 * Export to CSV format for period comparison
 */
export function exportPeriodComparisonCSV({
  businessName,
  currentPeriod,
  previousPeriod,
  comparisonResult,
}: ExportPeriodComparisonOptions): string {
  let csvContent = ''

  // Header
  csvContent += `# ${businessName} - Period Comparison Report\n`
  csvContent += `# Generated: ${new Date().toLocaleDateString()}\n\n`

  // Period information
  csvContent += '## PERIOD COMPARISON\n'
  csvContent += 'Metric,Current Period,Previous Period,Change\n'
  csvContent += `"Period",${format(currentPeriod.from, 'MMM dd, yyyy')} - ${format(currentPeriod.to, 'MMM dd, yyyy')},${format(previousPeriod.from, 'MMM dd, yyyy')} - ${format(previousPeriod.to, 'MMM dd, yyyy')},\n`
  csvContent += `"Review Count",${currentPeriod.reviews.length},${previousPeriod.reviews.length},"${comparisonResult.reviewVolumeChange || 0}%"\n`
  csvContent += `"Average Rating","${comparisonResult.currentMetrics?.averageRating || 0}","${comparisonResult.previousMetrics?.averageRating || 0}","${comparisonResult.ratingChange || 0}"\n`
  csvContent += `"Sentiment Trend","${comparisonResult.currentMetrics?.sentimentScore || 0}","${comparisonResult.previousMetrics?.sentimentScore || 0}","${comparisonResult.sentimentTrend || 'No change'}"\n`

  return csvContent
}

/**
 * Download CSV file for period comparison
 */
export function downloadPeriodComparisonCSV(
  options: ExportPeriodComparisonOptions,
): void {
  try {
    const csvContent = exportPeriodComparisonCSV(options)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const filename = `${options.businessName.replace(/\s+/g, '-')}-period-comparison-${new Date().toISOString().split('T')[0]}.csv`

    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading period comparison CSV:', error)
    throw new Error('Failed to download period comparison CSV')
  }
}
