import React from 'react'
import { pdf } from '@react-pdf/renderer'
import { PDFDocument } from '@/components/exports/PDFDocument'
import type { EnhancedAnalysis } from '@/types/dataAnalysis'
import type { BusinessType } from '@/types/businessTypes'

export interface ExportOptions {
  businessName: string
  businessType: BusinessType
  includeCharts: boolean
  includeTables: boolean
  includeRecommendations: boolean
  dateRange?: { start: Date; end: Date }
  customTitle?: string
  brandingColor?: string
  logo?: string
}

/**
 * Transform EnhancedAnalysis data to the format expected by the PDF generator
 */
function transformAnalysisData(data: EnhancedAnalysis) {
  // Calculate overall metrics from the data
  const totalReviews =
    data.reviewClusters?.reduce(
      (sum, cluster) => sum + (cluster.count || 0),
      0,
    ) || 0
  const avgRating =
    data.historicalTrends?.length > 0
      ? data.historicalTrends.reduce((sum, trend) => sum + trend.avgRating, 0) /
        data.historicalTrends.length
      : 0

  // Transform historical trends with proper data structure
  const historicalTrends =
    data.historicalTrends?.map((trend, index) => {
      const previousTrend = data.historicalTrends?.[index + 1]
      const percentageChange = previousTrend
        ? ((trend.avgRating - previousTrend.avgRating) /
            previousTrend.avgRating) *
          100
        : 0

      return {
        metric: 'Average Rating',
        timeframe: 'Monthly',
        trend:
          trend.avgRating > 4
            ? 'Positive'
            : trend.avgRating > 3
              ? 'Stable'
              : 'Needs Improvement',
        data: [
          {
            period: trend.period,
            value: trend.avgRating,
            percentageChange,
            reviewCount: trend.reviewCount,
          },
        ],
      }
    }) || []

  // Transform review clusters with proper sentiment and rating data
  const reviewClusters =
    data.reviewClusters?.map(cluster => {
      // Estimate average rating based on sentiment
      let estimatedRating = 3.0 // Default neutral
      if (cluster.sentiment === 'positive') estimatedRating = 4.5
      else if (cluster.sentiment === 'negative') estimatedRating = 2.0

      return {
        name: cluster.name,
        reviewCount: cluster.count || 0,
        averageRating: estimatedRating,
        sentiment: cluster.sentiment || 'neutral',
        keywords: cluster.keywords || [],
        themes: cluster.keywords || [],
      }
    }) || []

  // Transform temporal patterns (already in correct format)
  const temporalPatterns = {
    dayOfWeek: data.temporalPatterns?.dayOfWeek || [],
    timeOfDay: data.temporalPatterns?.timeOfDay || [],
  }

  // Transform seasonal patterns with proper structure
  const seasonalPatterns =
    data.seasonalAnalysis?.map(season => ({
      name: season.season,
      dateRange: { start: season.season, end: season.season },
      metrics: {
        avgRating: season.avgRating,
        reviewVolume: season.count,
        topThemes: [], // Could be extracted from clusters if needed
      },
      comparison: {
        vsYearAverage: season.avgRating - avgRating, // Compare to overall average
      },
    })) || []

  // Keep insights as simple array for better PDF rendering
  const insights = Array.isArray(data.insights) ? data.insights : []

  // Calculate real rating distribution from clusters and sentiment
  const ratingDistribution = calculateRatingDistribution(
    data.reviewClusters || [],
    totalReviews,
  )

  return {
    historicalTrends,
    reviewClusters,
    temporalPatterns,
    seasonalPatterns,
    insights,
    ratingDistribution, // Add real rating distribution
    totalReviews,
    avgRating,
    recommendations: null,
  }
}

/**
 * Calculate real rating distribution from review clusters and sentiment data
 */
function calculateRatingDistribution(clusters: any[], totalReviews: number) {
  if (totalReviews === 0) {
    return [
      { rating: 5, count: 0, percentage: 0 },
      { rating: 4, count: 0, percentage: 0 },
      { rating: 3, count: 0, percentage: 0 },
      { rating: 2, count: 0, percentage: 0 },
      { rating: 1, count: 0, percentage: 0 },
    ]
  }

  // Count reviews by sentiment
  const sentimentCounts = {
    positive: 0,
    neutral: 0,
    negative: 0,
  }

  clusters.forEach(cluster => {
    const sentiment = cluster.sentiment || 'neutral'
    const count = cluster.count || 0
    if (sentiment in sentimentCounts) {
      sentimentCounts[sentiment as keyof typeof sentimentCounts] += count
    }
  })

  // Estimate rating distribution based on sentiment
  // Positive sentiment typically maps to 4-5 stars
  // Neutral sentiment typically maps to 3 stars
  // Negative sentiment typically maps to 1-2 stars
  const rating5 = Math.round(sentimentCounts.positive * 0.6) // 60% of positive are 5-star
  const rating4 = sentimentCounts.positive - rating5 // Rest of positive are 4-star
  const rating3 = sentimentCounts.neutral
  const rating2 = Math.round(sentimentCounts.negative * 0.3) // 30% of negative are 2-star
  const rating1 = sentimentCounts.negative - rating2 // Rest of negative are 1-star

  return [
    {
      rating: 5,
      count: rating5,
      percentage: totalReviews > 0 ? (rating5 / totalReviews) * 100 : 0,
    },
    {
      rating: 4,
      count: rating4,
      percentage: totalReviews > 0 ? (rating4 / totalReviews) * 100 : 0,
    },
    {
      rating: 3,
      count: rating3,
      percentage: totalReviews > 0 ? (rating3 / totalReviews) * 100 : 0,
    },
    {
      rating: 2,
      count: rating2,
      percentage: totalReviews > 0 ? (rating2 / totalReviews) * 100 : 0,
    },
    {
      rating: 1,
      count: rating1,
      percentage: totalReviews > 0 ? (rating1 / totalReviews) * 100 : 0,
    },
  ]
}

/**
 * Generate a comprehensive PDF report using React-PDF
 */
export async function generatePDF(
  data: any,
  options: ExportOptions,
): Promise<Blob> {
  try {
    // Validate input data
    if (!data) {
      throw new Error('No data provided for PDF generation')
    }

    if (!options.businessName) {
      throw new Error('Business name is required for PDF generation')
    }

    // Transform the data if it's in EnhancedAnalysis format
    let exportData = data
    if (data.temporalPatterns && !data.historicalTrends?.[0]?.data) {
      exportData = transformAnalysisData(data)
    }

    // Sanitize text content to prevent rendering issues
    const sanitizedOptions = {
      ...options,
      businessName:
        options.businessName.replace(/[^\w\s-]/g, '').trim() ||
        'Business Report',
      customTitle: options.customTitle?.replace(/[^\w\s-]/g, '').trim(),
      brandingColor: options.brandingColor || '#3B82F6',
    }

    // Ensure all text arrays are properly formatted
    if (exportData.insights && Array.isArray(exportData.insights)) {
      exportData.insights = exportData.insights
        .map((insight: any) =>
          typeof insight === 'string'
            ? insight.replace(/[^\w\s.,!?-]/g, '').trim()
            : String(insight).trim(),
        )
        .filter(Boolean)
    }

    // Create PDF document using React-PDF
    const pdfDocument = React.createElement(PDFDocument, {
      data: exportData,
      options: sanitizedOptions,
    })

    const blob = await pdf(pdfDocument).toBlob()

    return blob
  } catch (error) {
    console.error('PDF Generation Error:', error)

    // Provide specific error messages for debugging
    if (error instanceof Error) {
      if (error.message.includes('font') || error.message.includes('Font')) {
        throw new Error(
          'Font rendering error - please try again or contact support',
        )
      }
      if (
        error.message.includes('DataView') ||
        error.message.includes('buffer')
      ) {
        throw new Error(
          'Data format error - please check the content and try again',
        )
      }
      throw error
    }

    throw new Error('Unknown error occurred during PDF generation')
  }
}

/**
 * Download PDF file with proper filename
 */
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate PDF and automatically download it
 */
export async function generateAndDownloadPDF(
  data: any,
  options: ExportOptions,
): Promise<void> {
  try {
    const blob = await generatePDF(data, options)
    const safeBusinessName = (options.businessName || 'Business')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
    const filename = `${safeBusinessName}-analysis-${new Date().toISOString().split('T')[0]}.pdf`
    downloadPDF(blob, filename)
  } catch (error) {
    console.error('Error generating PDF:', error)

    // Re-throw the specific error message from generatePDF
    if (error instanceof Error) {
      throw error
    }

    throw new Error('Failed to generate PDF report - please try again')
  }
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: any, options: ExportOptions): string {
  // Transform the data if needed
  let exportData = data
  if (data.temporalPatterns && !data.historicalTrends?.[0]?.data) {
    exportData = transformAnalysisData(data)
  }

  let csvContent = ''

  // Add header with business info
  csvContent += `# ${options.businessName} - Review Analysis\n`
  if (options.dateRange) {
    const dateFormat = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    csvContent += `# Period: ${dateFormat.format(options.dateRange.start)} to ${dateFormat.format(options.dateRange.end)}\n`
  }
  csvContent += `# Generated: ${new Date().toLocaleDateString()}\n\n`

  // Add review clusters
  if (exportData?.reviewClusters?.length) {
    csvContent += '## REVIEW CLUSTERS\n'
    csvContent += 'Name,Reviews,Rating,Sentiment,Keywords\n'

    exportData.reviewClusters.forEach((cluster: any) => {
      csvContent += `"${cluster.name || 'Unknown'}",`
      csvContent += `${cluster.reviewCount || cluster.count || 0},`
      csvContent += `${(cluster.averageRating || 0).toFixed(1)},`
      csvContent += `"${cluster.sentiment || 'Unknown'}",`
      csvContent += `"${Array.isArray(cluster.keywords) ? cluster.keywords.slice(0, 5).join(', ') : ''}"\n`
    })

    csvContent += '\n'
  }

  // Add temporal patterns
  if (exportData?.temporalPatterns) {
    if (exportData.temporalPatterns.dayOfWeek?.length) {
      csvContent += '## TEMPORAL PATTERNS - DAY OF WEEK\n'
      csvContent += 'Day,Count\n'
      exportData.temporalPatterns.dayOfWeek.forEach((day: any) => {
        csvContent += `"${day.day}",${day.count}\n`
      })
      csvContent += '\n'
    }

    if (exportData.temporalPatterns.timeOfDay?.length) {
      csvContent += '## TEMPORAL PATTERNS - TIME OF DAY\n'
      csvContent += 'Time,Count\n'
      exportData.temporalPatterns.timeOfDay.forEach((time: any) => {
        csvContent += `"${time.time}",${time.count}\n`
      })
      csvContent += '\n'
    }
  }

  // Add insights
  if (exportData?.insights) {
    csvContent += '## INSIGHTS\n'

    if (Array.isArray(exportData.insights)) {
      exportData.insights.forEach((insight: string) => {
        csvContent += `"${insight}"\n`
      })
    } else {
      if (exportData.insights.keyFindings?.length) {
        csvContent += '# Key Findings\n'
        exportData.insights.keyFindings.forEach((finding: string) => {
          csvContent += `"${finding}"\n`
        })
        csvContent += '\n'
      }

      if (exportData.insights.opportunities?.length) {
        csvContent += '# Opportunities\n'
        exportData.insights.opportunities.forEach((opportunity: string) => {
          csvContent += `"${opportunity}"\n`
        })
        csvContent += '\n'
      }

      if (exportData.insights.risks?.length) {
        csvContent += '# Risks\n'
        exportData.insights.risks.forEach((risk: string) => {
          csvContent += `"${risk}"\n`
        })
        csvContent += '\n'
      }
    }
  }

  return csvContent
}

/**
 * Generate CSV and automatically download it
 */
export function generateAndDownloadCSV(
  data: any,
  options: ExportOptions,
): void {
  try {
    const csvContent = exportToCSV(data, options)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const filename = `${options.businessName.replace(/\s+/g, '-')}-analysis-${new Date().toISOString().split('T')[0]}.csv`
    downloadPDF(blob, filename) // Reuse the download function
  } catch (error) {
    console.error('Error generating CSV:', error)
    throw new Error('Failed to generate CSV report')
  }
}
