import type { Review } from '@/types/reviews'

// Types for export functionality
interface ExportData {
  summaryData: {
    totalReviews: number;
    averageRating: number;
    ratingDistribution: { name: string; value: number }[];
    comparison: {
      previousPeriod: {
        change: number;
        percentage: number;
        totalReviews: number;
      };
      previousYear: {
        change: number;
        percentage: number;
        totalReviews: number;
      };
    };
  };
  selectedReviews: Review[];
  dateRange: {
    from: Date;
    to: Date | undefined;
  };
  businessName: string;
  enhancedMetrics?: {
    satisfactionRate: number;
    excellenceRate: number;
    responseRate: number;
    responsePercentage: number;
    healthScore: number;
    totalResponses: number;
  };
}

interface ExportOptions {
  includeCharts?: boolean;
  includeReviews?: boolean;
  format?: 'summary' | 'detailed';
  logo?: string;
}

/**
 * Enhanced export utility for Monthly Reports
 * Supports PDF and Excel export with business intelligence
 */
export class MonthlyReportExporter {

  /**
   * Export monthly report to PDF
   */
  static async exportToPDF(data: ExportData, options: ExportOptions = {}): Promise<void> {
    try {
      // Dynamic import to avoid bundling issues
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF()

      const { summaryData, selectedReviews, dateRange, businessName, enhancedMetrics } = data
      const { includeCharts = true, includeReviews = true, format = 'detailed' } = options

      // PDF Configuration
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      let yPosition = margin

      // Helper function to add new page if needed
      const checkPageBreak = (requiredHeight: number) => {
        if (yPosition + requiredHeight > pageHeight - margin) {
          pdf.addPage()
          yPosition = margin
        }
      }

      // Header
      pdf.setFontSize(24)
      pdf.setFont(undefined, 'bold')
      pdf.text('Monthly Review Report', margin, yPosition)
      yPosition += 15

      pdf.setFontSize(16)
      pdf.setFont(undefined, 'normal')
      pdf.text(businessName || 'Business Report', margin, yPosition)
      yPosition += 10

      const dateFrom = dateRange.from.toLocaleDateString()
      const dateTo = dateRange.to?.toLocaleDateString() || 'Present'
      pdf.setFontSize(12)
      pdf.text(`Report Period: ${dateFrom} - ${dateTo}`, margin, yPosition)
      yPosition += 20

      // Executive Summary
      checkPageBreak(60)
      pdf.setFontSize(18)
      pdf.setFont(undefined, 'bold')
      pdf.text('Executive Summary', margin, yPosition)
      yPosition += 15

      pdf.setFontSize(12)
      pdf.setFont(undefined, 'normal')

      const summaryItems = [
        `Total Reviews: ${summaryData.totalReviews}`,
        `Average Rating: ${summaryData.averageRating.toFixed(1)} stars`,
        `Previous Period Change: ${summaryData.comparison.previousPeriod.change >= 0 ? '+' : ''}${summaryData.comparison.previousPeriod.change}`,
        ...(enhancedMetrics ? [
          `Satisfaction Rate: ${enhancedMetrics.satisfactionRate}%`,
          `Response Rate: ${enhancedMetrics.responsePercentage}%`,
          `Business Health Score: ${enhancedMetrics.healthScore}/100`,
        ] : []),
      ]

      summaryItems.forEach(item => {
        pdf.text(`• ${item}`, margin + 5, yPosition)
        yPosition += 8
      })
      yPosition += 10

      // Rating Distribution
      checkPageBreak(80)
      pdf.setFontSize(16)
      pdf.setFont(undefined, 'bold')
      pdf.text('Rating Distribution', margin, yPosition)
      yPosition += 15

      summaryData.ratingDistribution.forEach(rating => {
        pdf.setFont(undefined, 'normal')
        pdf.text(`${rating.name}: ${rating.value} reviews`, margin + 5, yPosition)
        yPosition += 8
      })
      yPosition += 15

      // Key Insights
      if (enhancedMetrics) {
        checkPageBreak(60)
        pdf.setFontSize(16)
        pdf.setFont(undefined, 'bold')
        pdf.text('Key Performance Indicators', margin, yPosition)
        yPosition += 15

        const kpiItems = [
          `Excellence Rate (5-star): ${enhancedMetrics.excellenceRate}%`,
          `Customer Satisfaction: ${enhancedMetrics.satisfactionRate}%`,
          `Owner Engagement: ${enhancedMetrics.responsePercentage}%`,
          `Overall Health Score: ${enhancedMetrics.healthScore}/100`,
        ]

        kpiItems.forEach(item => {
          pdf.setFont(undefined, 'normal')
          pdf.text(`• ${item}`, margin + 5, yPosition)
          yPosition += 8
        })
        yPosition += 15
      }

      // Recommendations
      checkPageBreak(60)
      pdf.setFontSize(16)
      pdf.setFont(undefined, 'bold')
      pdf.text('Recommendations', margin, yPosition)
      yPosition += 15

      const recommendations = this.generateRecommendations(summaryData, enhancedMetrics)
      recommendations.forEach(rec => {
        checkPageBreak(20)
        pdf.setFont(undefined, 'bold')
        pdf.text(`• ${rec.title}`, margin + 5, yPosition)
        yPosition += 8
        pdf.setFont(undefined, 'normal')
        pdf.text(`  ${rec.description}`, margin + 10, yPosition)
        yPosition += 10
      })

      // Individual Reviews (if requested and format is detailed)
      if (includeReviews && format === 'detailed' && selectedReviews.length > 0) {
        pdf.addPage()
        yPosition = margin

        pdf.setFontSize(16)
        pdf.setFont(undefined, 'bold')
        pdf.text('Individual Reviews', margin, yPosition)
        yPosition += 20

        selectedReviews.slice(0, 10).forEach((review, index) => {
          checkPageBreak(40)

          pdf.setFontSize(12)
          pdf.setFont(undefined, 'bold')
          pdf.text(`Review ${index + 1}`, margin, yPosition)
          yPosition += 8

          pdf.setFont(undefined, 'normal')
          pdf.text(`Rating: ${review.stars} stars`, margin + 5, yPosition)
          yPosition += 6

          pdf.text(`Date: ${new Date(review.publishedAtDate).toLocaleDateString()}`, margin + 5, yPosition)
          yPosition += 6

          if (review.name) {
            pdf.text(`Reviewer: ${review.name}`, margin + 5, yPosition)
            yPosition += 6
          }

          // Review text (truncated if too long)
          const reviewText = (review.text || '').length > 200
            ? `${(review.text || '').substring(0, 200)}...`
            : (review.text || '')

          const textLines = pdf.splitTextToSize(reviewText, pageWidth - 2 * margin)
          pdf.text(textLines, margin + 5, yPosition)
          yPosition += textLines.length * 6 + 10

          if (review.responseFromOwnerText) {
            pdf.setFont(undefined, 'italic')
            pdf.text('Owner Response:', margin + 5, yPosition)
            yPosition += 6

            const responseLines = pdf.splitTextToSize(
              review.responseFromOwnerText.length > 150
                ? `${review.responseFromOwnerText.substring(0, 150)}...`
                : review.responseFromOwnerText,
              pageWidth - 2 * margin,
            )
            pdf.text(responseLines, margin + 10, yPosition)
            yPosition += responseLines.length * 6
          }

          yPosition += 10
        })

        if (selectedReviews.length > 10) {
          pdf.text(`... and ${selectedReviews.length - 10} more reviews`, margin, yPosition)
        }
      }

      // Footer
      const totalPages = pdf.internal.pages.length - 1
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(10)
        pdf.text(
          `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${totalPages}`,
          margin,
          pageHeight - 10,
        )
      }

      // Save the PDF
      const safeBusinessName = (businessName || 'Business').replace(/[^a-z0-9]/gi, '_')
      const fileName = `${safeBusinessName}_Monthly_Report_${dateFrom.replace(/\//g, '-')}.pdf`
      pdf.save(fileName)

    } catch (error) {
      console.error('PDF Export Error:', error)
      throw new Error('Failed to generate PDF report')
    }
  }

  /**
   * Export monthly report to Excel
   */
  static async exportToExcel(data: ExportData, options: ExportOptions = {}): Promise<void> {
    try {
      // Dynamic import to avoid bundling issues
      const XLSX = await import('xlsx')

      const { summaryData, selectedReviews, dateRange, businessName, enhancedMetrics } = data
      const { includeReviews = true } = options

      // Create a new workbook
      const workbook = XLSX.utils.book_new()

      // Summary Sheet
      const summaryData_sheet = [
        ['Monthly Review Report'],
        ['Business Name', businessName || 'Unknown Business'],
        ['Report Period', `${dateRange.from.toLocaleDateString()} - ${dateRange.to?.toLocaleDateString() || 'Present'}`],
        ['Generated On', new Date().toLocaleDateString()],
        [],
        ['SUMMARY METRICS'],
        ['Total Reviews', summaryData.totalReviews],
        ['Average Rating', summaryData.averageRating.toFixed(1)],
        ['Previous Period Change', summaryData.comparison.previousPeriod.change],
        ['Previous Year Change', summaryData.comparison.previousYear.change],
        [],
        ['RATING DISTRIBUTION'],
        ['Rating', 'Count', 'Percentage'],
        ...summaryData.ratingDistribution.map(rating => [
          rating.name,
          rating.value,
          summaryData.totalReviews > 0 ? `${((rating.value / summaryData.totalReviews) * 100).toFixed(1)}%` : '0%',
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
          'Date': new Date(review.publishedAtDate).toLocaleDateString(),
          'Rating': review.stars,
          'Reviewer': review.name || 'Anonymous',
          'Review Text': review.text || '',
          'Sentiment': review.sentiment || 'Not analyzed',
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
        ['Metric', 'Current Period', 'Previous Period', 'Change', 'Percentage Change'],
        [
          'Total Reviews',
          summaryData.totalReviews,
          summaryData.comparison.previousPeriod.totalReviews,
          summaryData.comparison.previousPeriod.change,
          `${summaryData.comparison.previousPeriod.percentage.toFixed(1)}%`,
        ],
        [],
        ['YEAR-OVER-YEAR COMPARISON'],
        ['Metric', 'Current Period', 'Same Period Last Year', 'Change', 'Percentage Change'],
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
      const safeBusinessName = (businessName || 'Business').replace(/[^a-z0-9]/gi, '_')
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
        description: 'Current rating is below 4.0. Focus on addressing common issues mentioned in negative reviews.',
      })
    }

    if (enhancedMetrics?.responsePercentage && enhancedMetrics.responsePercentage < 50) {
      recommendations.push({
        title: 'Increase Response Rate',
        description: 'Responding to reviews shows customer engagement and can improve overall perception.',
      })
    }

    if (summaryData.comparison.previousPeriod.change < 0) {
      recommendations.push({
        title: 'Address Declining Review Volume',
        description: 'Consider implementing strategies to encourage more customer feedback.',
      })
    }

    if (enhancedMetrics?.excellenceRate && enhancedMetrics.excellenceRate < 40) {
      recommendations.push({
        title: 'Focus on Excellence',
        description: 'Work on increasing 5-star experiences to boost your excellence rate.',
      })
    }

    const fiveStarReviews = summaryData.ratingDistribution.find(r => r.name === '5 ★')?.value || 0
    const oneStarReviews = summaryData.ratingDistribution.find(r => r.name === '1 ★')?.value || 0

    if (oneStarReviews > fiveStarReviews * 0.2) {
      recommendations.push({
        title: 'Address Critical Issues',
        description: 'High proportion of 1-star reviews indicates serious issues that need immediate attention.',
      })
    }

    if (recommendations.length === 0) {
      recommendations.push({
        title: 'Maintain Excellence',
        description: 'Your performance is strong across all metrics. Continue current strategies and monitor for consistency.',
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
${enhancedMetrics ? `• Satisfaction Rate: ${enhancedMetrics.satisfactionRate}%
• Health Score: ${enhancedMetrics.healthScore}/100` : ''}

RATING BREAKDOWN:
${summaryData.ratingDistribution.map(r => `• ${r.name}: ${r.value} reviews`).join('\n')}

Full detailed report attached.

Generated on ${new Date().toLocaleDateString()}
    `.trim()
  }
}
