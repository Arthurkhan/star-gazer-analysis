import type { Review } from '@/types/reviews'
import type { ExportOptions as PDFExportOptions } from '@/services/exportService'

// Types for export functionality
interface ExportData {
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
  businessName: string
  enhancedMetrics?: {
    satisfactionRate: number
    excellenceRate: number
    responseRate: number
    responsePercentage: number
    healthScore: number
    totalResponses: number
  }
}

interface ExportOptions {
  includeCharts?: boolean
  includeReviews?: boolean
  format?: 'summary' | 'detailed'
  logo?: string
}

/**
 * Generate temporal analysis data from reviews
 */
const generateTemporalAnalysis = (reviews: Review[]) => {
  const dayOfWeek = Array(7).fill(0)
  const timeOfDay = Array(24).fill(0)

  reviews.forEach(review => {
    try {
      const publishedDate = Temporal.Instant.from(
        review.publishedAtDate,
      ).toZonedDateTimeISO(Temporal.Now.timeZone())
      dayOfWeek[publishedDate.dayOfWeek - 1]++
      timeOfDay[publishedDate.hour]++
    } catch (e) {
      console.warn('Invalid date for review:', review.publishedAtDate, e)
    }
  })

  return { dayOfWeek, timeOfDay }
}

/**
 * Enhanced export utility for Monthly Reports
 * Supports PDF and Excel export with business intelligence
 */
export class MonthlyReportExporter {
  /**
   * Export monthly report to PDF using React-PDF
   */
  static async exportToPDF(
    data: ExportData,
    options: ExportOptions = {},
  ): Promise<void> {
    try {
      // Import React-PDF functions
      const { generateAndDownloadPDF } = await import(
        '@/services/exportService'
      )

      const {
        summaryData,
        selectedReviews,
        dateRange,
        businessName,
        enhancedMetrics,
      } = data
      const { includeCharts = true } = options

      const temporalAnalysis = generateTemporalAnalysis(selectedReviews)

      // Transform real review data for PDF system
      const exportData = {
        historicalTrends: [
          {
            period: `${dateRange.from.toLocaleDateString()} - ${dateRange.to?.toLocaleDateString() || 'Present'}`,
            avgRating: summaryData.averageRating,
            reviewCount: summaryData.totalReviews,
          },
        ],
        reviewClusters: summaryData.ratingDistribution.map(rating => {
          // Map rating distribution to sentiment-based clusters
          let sentiment = 'neutral'
          if (rating.name.includes('5') || rating.name.includes('4'))
            sentiment = 'positive'
          else if (rating.name.includes('1') || rating.name.includes('2'))
            sentiment = 'negative'

          return {
            name: rating.name,
            count: rating.value,
            sentiment,
            keywords: [],
          }
        }),
        temporalPatterns: temporalAnalysis,
        seasonalAnalysis: [],
        insights: this.generateRecommendations(
          summaryData,
          enhancedMetrics,
        ).map(rec => rec.title),
        // Add calculated rating distribution for PDF
        ratingDistribution: summaryData.ratingDistribution.map(
          (rating, index) => ({
            rating: 5 - index, // Convert from "5 ★" format to numeric
            count: rating.value,
            percentage:
              summaryData.totalReviews > 0
                ? (rating.value / summaryData.totalReviews) * 100
                : 0,
            color: ['#10B981', '#84CC16', '#F59E0B', '#F97316', '#EF4444'][
              index
            ],
          }),
        ),
        totalReviews: summaryData.totalReviews,
        avgRating: summaryData.averageRating,
        recommendations: this.generateRecommendations(
          summaryData,
          enhancedMetrics,
        ),
      }

      const pdfOptions: PDFExportOptions = {
        businessName: businessName || 'Business Report',
        businessType: 'CAFE', // Default type
        includeCharts,
        includeTables: true,
        includeRecommendations: true,
        dateRange: {
          start: dateRange.from,
          end: dateRange.to || new Date(),
        },
        customTitle: `${businessName || 'Business'} - Monthly Report`,
        brandingColor: '#3B82F6',
      }

      await generateAndDownloadPDF(exportData, pdfOptions)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      throw new Error('Failed to export monthly report to PDF')
    }
  }

  /**
   * Export monthly report to Excel
   */
  static async exportToExcel(
    data: ExportData,
    options: ExportOptions = {},
  ): Promise<void> {
    try {
      // Dynamic import to avoid bundling issues
      const XLSX = await import('xlsx')

      const {
        summaryData,
        selectedReviews,
        dateRange,
        businessName,
        enhancedMetrics,
      } = data
      const { includeReviews = true } = options

      // Create a new workbook
      const workbook = XLSX.utils.book_new()

      // Summary Sheet
      const summaryData_sheet = [
        ['Monthly Review Report'],
        ['Business Name', businessName || 'Unknown Business'],
        [
          'Report Period',
          `${dateRange.from.toLocaleDateString()} - ${dateRange.to?.toLocaleDateString() || 'Present'}`,
        ],
        ['Generated On', new Date().toLocaleDateString()],
        [],
        ['SUMMARY METRICS'],
        ['Total Reviews', summaryData.totalReviews],
        ['Average Rating', summaryData.averageRating.toFixed(1)],
        [
          'Previous Period Change',
          summaryData.comparison.previousPeriod.change,
        ],
        ['Previous Year Change', summaryData.comparison.previousYear.change],
        [],
        ['RATING DISTRIBUTION'],
        ['Rating', 'Count', 'Percentage'],
        ...summaryData.ratingDistribution.map(rating => [
          rating.name,
          rating.value,
          summaryData.totalReviews > 0
            ? `${((rating.value / summaryData.totalReviews) * 100).toFixed(1)}%`
            : '0%',
        ]),
      ]

      if (enhancedMetrics) {
        summaryData_sheet.push(
          [],
          ['ENHANCED METRICS'],
          ['Satisfaction Rate', `${enhancedMetrics.satisfactionRate}%`],
          ['Excellence Rate', `${enhancedMetrics.excellenceRate}%`],
          ['Response Rate', `${enhancedMetrics.responsePercentage}%`],
          ['Health Score', `${enhancedMetrics.healthScore}/100`],
          ['Total Responses', enhancedMetrics.totalResponses],
        )
      }

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData_sheet)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

      // Reviews Sheet (if requested)
      if (includeReviews && selectedReviews.length > 0) {
        const reviewsData = selectedReviews.map(review => ({
          Date: new Date(review.publishedAtDate).toLocaleDateString(),
          Rating: review.stars,
          Reviewer: review.name || 'Anonymous',
          'Review Text': review.text || '',
          Sentiment: review.sentiment || 'Not analyzed',
          'Staff Mentioned': review.staffMentioned || 'None',
          'Main Themes': review.mainThemes || 'Not categorized',
          'Owner Response': review.responseFromOwnerText || 'No response',
          'Review URL': review.reviewUrl || '',
        }))

        const reviewsSheet = XLSX.utils.json_to_sheet(reviewsData)
        XLSX.utils.book_append_sheet(workbook, reviewsSheet, 'Reviews')
      }

      // Analytics Sheet
      const analyticsData = [
        ['PERIOD COMPARISON'],
        [
          'Metric',
          'Current Period',
          'Previous Period',
          'Change',
          'Percentage Change',
        ],
        [
          'Total Reviews',
          summaryData.totalReviews,
          summaryData.comparison.previousPeriod.totalReviews,
          summaryData.comparison.previousPeriod.change,
          `${summaryData.comparison.previousPeriod.percentage.toFixed(1)}%`,
        ],
        [],
        ['YEAR-OVER-YEAR COMPARISON'],
        [
          'Metric',
          'Current Period',
          'Same Period Last Year',
          'Change',
          'Percentage Change',
        ],
        [
          'Total Reviews',
          summaryData.totalReviews,
          summaryData.comparison.previousYear.totalReviews,
          summaryData.comparison.previousYear.change,
          `${summaryData.comparison.previousYear.percentage.toFixed(1)}%`,
        ],
      ]

      const analyticsSheet = XLSX.utils.aoa_to_sheet(analyticsData)
      XLSX.utils.book_append_sheet(workbook, analyticsSheet, 'Analytics')

      // Save the workbook
      const safeBusinessName = (businessName || 'Business').replace(
        /[^a-z0-9]/gi,
        '_',
      )
      const fileName = `${safeBusinessName}_Monthly_Report_${dateRange.from.toLocaleDateString().replace(/\//g, '-')}.xlsx`
      XLSX.writeFile(workbook, fileName)
    } catch (error) {
      console.error('Excel Export Error:', error)
      throw new Error('Failed to generate Excel report')
    }
  }

  /**
   * Generate recommendations based on data analysis
   */
  private static generateRecommendations(
    summaryData: ExportData['summaryData'],
    enhancedMetrics?: ExportData['enhancedMetrics'],
  ) {
    const recommendations = []

    if (summaryData.averageRating < 4.0) {
      recommendations.push({
        title: 'Improve Overall Rating',
        description:
          'Current rating is below 4.0. Focus on addressing common issues mentioned in negative reviews.',
      })
    }

    if (
      enhancedMetrics?.responsePercentage &&
      enhancedMetrics.responsePercentage < 50
    ) {
      recommendations.push({
        title: 'Increase Response Rate',
        description:
          'Responding to reviews shows customer engagement and can improve overall perception.',
      })
    }

    if (summaryData.comparison.previousPeriod.change < 0) {
      recommendations.push({
        title: 'Address Declining Review Volume',
        description:
          'Consider implementing strategies to encourage more customer feedback.',
      })
    }

    if (
      enhancedMetrics?.excellenceRate &&
      enhancedMetrics.excellenceRate < 40
    ) {
      recommendations.push({
        title: 'Focus on Excellence',
        description:
          'Work on increasing 5-star experiences to boost your excellence rate.',
      })
    }

    const fiveStarReviews =
      summaryData.ratingDistribution.find(r => r.name === '5 ★')?.value || 0
    const oneStarReviews =
      summaryData.ratingDistribution.find(r => r.name === '1 ★')?.value || 0

    if (oneStarReviews > fiveStarReviews * 0.2) {
      recommendations.push({
        title: 'Address Critical Issues',
        description:
          'High proportion of 1-star reviews indicates serious issues that need immediate attention.',
      })
    }

    if (recommendations.length === 0) {
      recommendations.push({
        title: 'Maintain Excellence',
        description:
          'Your performance is strong across all metrics. Continue current strategies and monitor for consistency.',
      })
    }

    return recommendations
  }

  /**
   * Generate email-friendly report summary
   */
  static generateEmailSummary(data: ExportData): string {
    const { summaryData, businessName, dateRange, enhancedMetrics } = data

    const dateFrom = dateRange.from.toLocaleDateString()
    const dateTo = dateRange.to?.toLocaleDateString() || 'Present'

    return `
Monthly Review Report - ${businessName || 'Business Report'}
Report Period: ${dateFrom} - ${dateTo}

SUMMARY:
• Total Reviews: ${summaryData.totalReviews}
• Average Rating: ${summaryData.averageRating.toFixed(1)} stars
• Previous Period Change: ${summaryData.comparison.previousPeriod.change >= 0 ? '+' : ''}${summaryData.comparison.previousPeriod.change}
${
  enhancedMetrics
    ? `• Satisfaction Rate: ${enhancedMetrics.satisfactionRate}%
• Health Score: ${enhancedMetrics.healthScore}/100`
    : ''
}

RATING BREAKDOWN:
${summaryData.ratingDistribution.map(r => `• ${r.name}: ${r.value} reviews`).join('\n')}

Full detailed report attached.

Generated on ${new Date().toLocaleDateString()}
    `.trim()
  }
}
