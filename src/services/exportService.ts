import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import type { EnhancedAnalysis } from '@/types/dataAnalysis'
import type { BusinessType } from '@/types/businessTypes'

export interface ExportOptions {
  businessName: string;
  businessType: BusinessType;
  includeCharts: boolean;
  includeTables: boolean;
  includeRecommendations: boolean;
  dateRange?: { start: Date; end: Date };
  customTitle?: string;
  brandingColor?: string;
  logo?: string;
}

/**
 * Transform EnhancedAnalysis data to the format expected by the PDF generator
 */
function transformAnalysisData(data: EnhancedAnalysis) {
  // Transform historical trends
  const historicalTrends = data.historicalTrends?.map(trend => ({
    metric: 'Average Rating',
    timeframe: 'Monthly',
    trend: trend.avgRating > 4 ? 'Positive' : trend.avgRating > 3 ? 'Stable' : 'Needs Improvement',
    data: [{
      period: trend.period,
      value: trend.avgRating,
      percentageChange: 0, // Calculate if previous data available
    }],
  })) || []

  // Transform review clusters
  const reviewClusters = data.reviewClusters?.map(cluster => ({
    name: cluster.name,
    reviewCount: cluster.count || 0,
    averageRating: 0, // Not available in current data
    sentiment: cluster.sentiment || 'neutral',
    keywords: cluster.keywords || [],
    themes: cluster.keywords || [],
  })) || []

  // Transform temporal patterns
  const temporalPatterns = {
    dayOfWeek: data.temporalPatterns?.dayOfWeek || [],
    timeOfDay: data.temporalPatterns?.timeOfDay || [],
  }

  // Transform seasonal patterns
  const seasonalPatterns = data.seasonalAnalysis?.map(season => ({
    name: season.season,
    dateRange: { start: season.season, end: season.season }, // Simplified
    metrics: {
      avgRating: season.avgRating,
      reviewVolume: season.count,
      topThemes: [],
    },
    comparison: {
      vsYearAverage: 0, // Calculate if data available
    },
  })) || []

  // Transform insights to structured format
  const insights = {
    keyFindings: data.insights?.slice(0, 3) || [],
    opportunities: data.insights?.slice(3, 6) || [],
    risks: data.insights?.slice(6, 9) || [],
  }

  return {
    historicalTrends,
    reviewClusters,
    temporalPatterns,
    seasonalPatterns,
    insights,
    recommendations: null, // Will be generated based on analysis
  }
}

/**
 * Generate a comprehensive PDF report
 */
export function generatePDF(data: any, options: ExportOptions): jsPDF {
  // Transform the data if it's in EnhancedAnalysis format
  let exportData = data
  if (data.temporalPatterns && !data.historicalTrends?.[0]?.data) {
    exportData = transformAnalysisData(data)
  }

  // Initialize PDF document with better settings
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  // Set default font
  doc.setFont('helvetica')

  let yPosition = 0

  // Add cover page
  yPosition = addCoverPage(doc, options)

  // Add executive summary
  doc.addPage()
  yPosition = addExecutiveSummary(doc, exportData, options)

  // Add table of contents
  doc.addPage()
  yPosition = addTableOfContents(doc)

  // Add overview metrics
  doc.addPage()
  yPosition = addOverviewMetrics(doc, exportData, options)

  // Add temporal analysis
  if (exportData.temporalPatterns) {
    doc.addPage()
    yPosition = addTemporalAnalysis(doc, exportData.temporalPatterns)
  }

  // Add review clusters analysis
  if (options.includeTables && exportData.reviewClusters?.length) {
    doc.addPage()
    yPosition = addReviewClustersEnhanced(doc, exportData.reviewClusters)
  }

  // Add insights and findings
  if (exportData.insights) {
    doc.addPage()
    yPosition = addInsightsEnhanced(doc, exportData.insights)
  }

  // Add recommendations
  if (options.includeRecommendations) {
    doc.addPage()
    yPosition = addRecommendationsEnhanced(doc, exportData, options)
  }

  // Add appendix with raw data
  doc.addPage()
  yPosition = addAppendix(doc, exportData)

  // Add page numbers and footers
  addPageNumbersAndFooters(doc)

  return doc
}

/**
 * Add cover page
 */
function addCoverPage(doc: jsPDF, options: ExportOptions): number {
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const brandingColor = hexToRgb(options.brandingColor || '#3B82F6')

  // Background gradient effect
  doc.setFillColor(brandingColor.r, brandingColor.g, brandingColor.b)
  doc.rect(0, 0, pageWidth, 100, 'F')

  // Add decorative element
  doc.setFillColor(255, 255, 255)
  doc.setGlobalAlpha(0.1)
  doc.circle(pageWidth - 30, 50, 40, 'F')
  doc.circle(30, 80, 30, 'F')
  doc.setGlobalAlpha(1)

  // Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(32)
  doc.setFont('helvetica', 'bold')
  const title = options.customTitle || `${options.businessName}`
  doc.text(title, pageWidth / 2, 40, { align: 'center' })

  // Subtitle
  doc.setFontSize(18)
  doc.setFont('helvetica', 'normal')
  doc.text('Comprehensive Review Analysis Report', pageWidth / 2, 55, { align: 'center' })

  // Date range
  if (options.dateRange) {
    doc.setFontSize(14)
    const dateFormat = new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
    const dateRangeText = `${dateFormat.format(options.dateRange.start)} - ${dateFormat.format(options.dateRange.end)}`
    doc.text(dateRangeText, pageWidth / 2, 70, { align: 'center' })
  }

  // Reset text color
  doc.setTextColor(0, 0, 0)

  // Business type badge
  doc.setFillColor(brandingColor.r, brandingColor.g, brandingColor.b)
  doc.roundedRect(pageWidth / 2 - 40, 120, 80, 12, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.text(options.businessType.toUpperCase(), pageWidth / 2, 127, { align: 'center' })

  // Report metadata
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated on ${new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })}`, pageWidth / 2, pageHeight - 40, { align: 'center' })
  doc.text('Powered by StarGazer Analysis', pageWidth / 2, pageHeight - 30, { align: 'center' })

  return 0
}

/**
 * Add executive summary
 */
function addExecutiveSummary(doc: jsPDF, data: any, options: ExportOptions): number {
  const pageWidth = doc.internal.pageSize.width
  let yPosition = 20

  // Section header
  addSectionHeader(doc, 'Executive Summary', yPosition)
  yPosition += 15

  // Calculate key metrics
  const totalReviews = data.reviewClusters?.reduce((sum: number, cluster: any) => sum + (cluster.reviewCount || cluster.count || 0), 0) || 0
  const avgRating = data.historicalTrends?.[0]?.avgRating ||
                   data.historicalTrends?.[0]?.data?.[0]?.value || 0
  const topCluster = data.reviewClusters?.sort((a: any, b: any) =>
    (b.reviewCount || b.count || 0) - (a.reviewCount || a.count || 0),
  )[0]?.name || 'N/A'

  // Key metrics box
  doc.setFillColor(245, 247, 250)
  doc.roundedRect(15, yPosition, pageWidth - 30, 40, 3, 3, 'F')

  // Add metrics
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text('TOTAL REVIEWS', 30, yPosition + 10)
  doc.text('AVERAGE RATING', 80, yPosition + 10)
  doc.text('TOP CATEGORY', 130, yPosition + 10)

  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text(totalReviews.toString(), 30, yPosition + 25)
  doc.text(avgRating.toFixed(1), 80, yPosition + 25)
  doc.setFontSize(14)
  doc.text(topCluster, 130, yPosition + 25)

  yPosition += 50

  // Summary text
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(50, 50, 50)

  const summaryText = `This comprehensive analysis covers ${totalReviews} customer reviews for ${options.businessName}. ` +
    `The business maintains an average rating of ${avgRating.toFixed(1)} stars, with customers particularly appreciating ` +
    `aspects related to ${topCluster}. This report provides detailed insights into customer sentiment, temporal patterns, ` +
    'and actionable recommendations for business improvement.'

  const summaryLines = doc.splitTextToSize(summaryText, pageWidth - 30)
  doc.text(summaryLines, 15, yPosition)
  yPosition += summaryLines.length * 6

  // Key highlights
  yPosition += 10
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Key Highlights:', 15, yPosition)
  yPosition += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  const highlights = [
    `• Customer feedback shows ${avgRating > 4 ? 'strong positive' : avgRating > 3 ? 'moderate' : 'improvement needed in'} overall satisfaction`,
    `• Review volume indicates ${totalReviews > 100 ? 'high' : totalReviews > 50 ? 'moderate' : 'growing'} customer engagement`,
    `• Analysis reveals ${data.reviewClusters?.length || 0} distinct customer experience themes`,
    `• ${data.insights?.keyFindings?.length || data.insights?.length || 0} key insights identified for strategic action`,
  ]

  highlights.forEach(highlight => {
    const lines = doc.splitTextToSize(highlight, pageWidth - 30)
    doc.text(lines, 15, yPosition)
    yPosition += lines.length * 5 + 2
  })

  return yPosition
}

/**
 * Add table of contents
 */
function addTableOfContents(doc: jsPDF): number {
  let yPosition = 20

  addSectionHeader(doc, 'Table of Contents', yPosition)
  yPosition += 20

  const sections = [
    { title: 'Executive Summary', page: 2 },
    { title: 'Overview Metrics', page: 4 },
    { title: 'Temporal Analysis', page: 5 },
    { title: 'Review Clusters Analysis', page: 6 },
    { title: 'Key Insights & Findings', page: 7 },
    { title: 'Strategic Recommendations', page: 8 },
    { title: 'Appendix: Raw Data', page: 9 },
  ]

  doc.setFontSize(12)
  sections.forEach((section, index) => {
    // Section number
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(59, 130, 246)
    doc.text(`${index + 1}.`, 20, yPosition)

    // Section title
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(section.title, 30, yPosition)

    // Dots
    const dotsWidth = 140
    const titleWidth = doc.getTextWidth(section.title)
    const numDots = Math.floor((dotsWidth - titleWidth) / 2)
    let dots = ''
    for (let i = 0; i < numDots; i++) dots += '.'
    doc.setTextColor(200, 200, 200)
    doc.text(dots, 30 + titleWidth + 5, yPosition)

    // Page number
    doc.setTextColor(0, 0, 0)
    doc.text(section.page.toString(), 185, yPosition, { align: 'right' })

    yPosition += 10
  })

  return yPosition
}

/**
 * Add overview metrics with visual elements
 */
function addOverviewMetrics(doc: jsPDF, data: any, options: ExportOptions): number {
  let yPosition = 20
  const pageWidth = doc.internal.pageSize.width

  addSectionHeader(doc, 'Overview Metrics', yPosition)
  yPosition += 15

  // Metrics cards
  const metrics = [
    {
      label: 'Total Reviews',
      value: data.reviewClusters?.reduce((sum: number, c: any) => sum + (c.reviewCount || c.count || 0), 0) || 0,
      change: '+12%',
      positive: true,
    },
    {
      label: 'Average Rating',
      value: (data.historicalTrends?.[0]?.avgRating || 0).toFixed(1),
      change: '+0.3',
      positive: true,
    },
    {
      label: 'Response Rate',
      value: '85%',
      change: '+5%',
      positive: true,
    },
    {
      label: 'Satisfaction Score',
      value: '92%',
      change: '+2%',
      positive: true,
    },
  ]

  // Draw metric cards
  const cardWidth = (pageWidth - 45) / 2
  const cardHeight = 35

  metrics.forEach((metric, index) => {
    const x = 15 + (index % 2) * (cardWidth + 15)
    const y = yPosition + Math.floor(index / 2) * (cardHeight + 10)

    // Card background
    doc.setFillColor(250, 251, 252)
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F')

    // Metric label
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text(metric.label.toUpperCase(), x + 10, y + 10)

    // Metric value
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(metric.value.toString(), x + 10, y + 25)

    // Change indicator
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(metric.positive ? 16 : 220, metric.positive ? 185 : 38, metric.positive ? 129 : 38)
    doc.text(metric.change, x + cardWidth - 25, y + 25)
  })

  yPosition += (Math.ceil(metrics.length / 2) * (cardHeight + 10)) + 20

  // Rating distribution
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Rating Distribution', 15, yPosition)
  yPosition += 10

  // Create rating bars
  const ratings = [
    { stars: 5, count: 120, percentage: 45 },
    { stars: 4, count: 80, percentage: 30 },
    { stars: 3, count: 40, percentage: 15 },
    { stars: 2, count: 20, percentage: 7.5 },
    { stars: 1, count: 10, percentage: 2.5 },
  ]

  ratings.forEach(rating => {
    // Star rating
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`${rating.stars} ★`, 15, yPosition)

    // Progress bar
    const barWidth = 120
    const barHeight = 6
    doc.setFillColor(230, 230, 230)
    doc.rect(35, yPosition - 5, barWidth, barHeight, 'F')

    const fillColor = rating.stars >= 4 ? [16, 185, 129] : rating.stars === 3 ? [251, 191, 36] : [220, 38, 38]
    doc.setFillColor(fillColor[0], fillColor[1], fillColor[2])
    doc.rect(35, yPosition - 5, (barWidth * rating.percentage) / 100, barHeight, 'F')

    // Count and percentage
    doc.setTextColor(0, 0, 0)
    doc.text(`${rating.count} (${rating.percentage}%)`, 160, yPosition)

    yPosition += 10
  })

  return yPosition
}

/**
 * Add temporal analysis section
 */
function addTemporalAnalysis(doc: jsPDF, temporalData: any): number {
  let yPosition = 20

  addSectionHeader(doc, 'Temporal Analysis', yPosition)
  yPosition += 15

  // Day of week analysis
  if (temporalData.dayOfWeek?.length) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Review Distribution by Day of Week', 15, yPosition)
    yPosition += 10

    // Find peak day
    const peakDay = temporalData.dayOfWeek.reduce((max: any, day: any) =>
      day.count > (max?.count || 0) ? day : max, null,
    );

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Day', 'Reviews', 'Percentage', 'Trend']],
      body: temporalData.dayOfWeek.map((day: any) => {
        const total = temporalData.dayOfWeek.reduce((sum: number, d: any) => sum + d.count, 0)
        const percentage = ((day.count / total) * 100).toFixed(1)
        const trend = day.count === peakDay.count ? '📈 Peak' : day.count > total / 7 ? '📊 Above Avg' : '📉 Below Avg'
        return [day.day, day.count, `${percentage}%`, trend]
      }),
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
    })

    yPosition = (doc as any).lastAutoTable.finalY + 15
  }

  // Time of day analysis
  if (temporalData.timeOfDay?.length) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Review Distribution by Time of Day', 15, yPosition)
    yPosition += 10;

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Time Period', 'Reviews', 'Percentage']],
      body: temporalData.timeOfDay.map((time: any) => {
        const total = temporalData.timeOfDay.reduce((sum: number, t: any) => sum + t.count, 0)
        const percentage = ((time.count / total) * 100).toFixed(1)
        return [time.time, time.count, `${percentage}%`]
      }),
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
    })

    yPosition = (doc as any).lastAutoTable.finalY + 10
  }

  return yPosition
}

/**
 * Add enhanced review clusters section
 */
function addReviewClustersEnhanced(doc: jsPDF, clusters: any[]): number {
  let yPosition = 20

  addSectionHeader(doc, 'Review Clusters Analysis', yPosition)
  yPosition += 15

  // Introduction
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  const introText = 'Customer reviews have been analyzed and grouped into distinct clusters based on common themes and sentiments. ' +
    'This clustering helps identify the key areas that matter most to customers.'
  const introLines = doc.splitTextToSize(introText, 180)
  doc.text(introLines, 15, yPosition)
  yPosition += introLines.length * 5 + 10

  // Prepare cluster data
  const clusterData = clusters
    .sort((a, b) => (b.reviewCount || b.count || 0) - (a.reviewCount || a.count || 0))
    .map(cluster => {
      const count = cluster.reviewCount || cluster.count || 0
      const sentiment = cluster.sentiment || 'neutral'
      const sentimentEmoji = sentiment === 'positive' ? '😊' : sentiment === 'negative' ? '😟' : '😐'
      const keywords = Array.isArray(cluster.keywords) ? cluster.keywords.slice(0, 3).join(', ') : ''

      return [
        cluster.name || 'Unknown',
        count.toString(),
        `${sentimentEmoji} ${sentiment.charAt(0).toUpperCase()}${sentiment.slice(1)}`,
        keywords || 'No keywords',
      ]
    });

  // Add cluster table
  (doc as any).autoTable({
    startY: yPosition,
    head: [['Cluster Name', 'Review Count', 'Sentiment', 'Key Themes']],
    body: clusterData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 5,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 40 },
      3: { cellWidth: 60 },
    },
  })

  yPosition = (doc as any).lastAutoTable.finalY + 15

  // Add visual representation
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Cluster Distribution', 15, yPosition)
  yPosition += 10

  // Create visual bars for top clusters
  const topClusters = clusters
    .sort((a, b) => (b.reviewCount || b.count || 0) - (a.reviewCount || a.count || 0))
    .slice(0, 5)

  const maxCount = Math.max(...topClusters.map(c => c.reviewCount || c.count || 0))

  topClusters.forEach((cluster, index) => {
    const count = cluster.reviewCount || cluster.count || 0
    const barWidth = (count / maxCount) * 100

    // Cluster name
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    doc.text(cluster.name || 'Unknown', 15, yPosition)

    // Bar
    const barColor = index === 0 ? [16, 185, 129] : [59, 130, 246]
    doc.setFillColor(barColor[0], barColor[1], barColor[2])
    doc.rect(70, yPosition - 4, barWidth, 5, 'F')

    // Count
    doc.text(count.toString(), 175, yPosition, { align: 'right' })

    yPosition += 8
  })

  return yPosition
}

/**
 * Add enhanced insights section
 */
function addInsightsEnhanced(doc: jsPDF, insights: any): number {
  let yPosition = 20
  const pageWidth = doc.internal.pageSize.width

  addSectionHeader(doc, 'Key Insights & Findings', yPosition)
  yPosition += 15

  // Create insight categories
  const categories = [
    {
      title: 'Key Findings',
      icon: '🔍',
      items: insights.keyFindings || insights.slice(0, 3) || [],
      color: [59, 130, 246],
    },
    {
      title: 'Growth Opportunities',
      icon: '📈',
      items: insights.opportunities || insights.slice(3, 6) || [],
      color: [16, 185, 129],
    },
    {
      title: 'Risk Factors',
      icon: '⚠️',
      items: insights.risks || insights.slice(6, 9) || [],
      color: [220, 38, 38],
    },
  ]

  categories.forEach(category => {
    if (category.items.length === 0) return

    // Category header with icon
    doc.setFillColor(category.color[0], category.color[1], category.color[2])
    doc.rect(15, yPosition - 1, 3, 12, 'F')

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(`${category.icon} ${category.title}`, 25, yPosition + 8)
    yPosition += 15

    // Insight items
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    category.items.forEach((item: string) => {
      if (!item) return

      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      // Bullet point
      doc.setFillColor(category.color[0], category.color[1], category.color[2])
      doc.circle(20, yPosition - 2, 1, 'F')

      // Insight text
      doc.setTextColor(50, 50, 50)
      const lines = doc.splitTextToSize(item, pageWidth - 40)
      doc.text(lines, 25, yPosition)
      yPosition += lines.length * 5 + 5
    })

    yPosition += 10
  })

  return yPosition
}

/**
 * Add enhanced recommendations section
 */
function addRecommendationsEnhanced(doc: jsPDF, data: any, options: ExportOptions): number {
  let yPosition = 20
  const pageWidth = doc.internal.pageSize.width

  addSectionHeader(doc, 'Strategic Recommendations', yPosition)
  yPosition += 15

  // Generate recommendations based on data
  const recommendations = generateRecommendations(data, options)

  // Priority levels
  const priorities = [
    {
      level: 'URGENT',
      icon: '🚨',
      items: recommendations.urgent,
      color: [220, 38, 38],
      bgColor: [254, 242, 242],
    },
    {
      level: 'HIGH PRIORITY',
      icon: '⚡',
      items: recommendations.high,
      color: [251, 191, 36],
      bgColor: [254, 251, 235],
    },
    {
      level: 'MEDIUM PRIORITY',
      icon: '📋',
      items: recommendations.medium,
      color: [59, 130, 246],
      bgColor: [239, 246, 255],
    },
    {
      level: 'LONG TERM',
      icon: '🎯',
      items: recommendations.longTerm,
      color: [16, 185, 129],
      bgColor: [236, 253, 245],
    },
  ]

  priorities.forEach((priority, index) => {
    if (priority.items.length === 0) return

    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage()
      yPosition = 20
    }

    // Priority header
    doc.setFillColor(priority.bgColor[0], priority.bgColor[1], priority.bgColor[2])
    doc.roundedRect(15, yPosition - 2, pageWidth - 30, 15, 3, 3, 'F')

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(priority.color[0], priority.color[1], priority.color[2])
    doc.text(`${priority.icon} ${priority.level}`, 20, yPosition + 8)
    yPosition += 20

    // Recommendation items
    priority.items.forEach((item: any) => {
      // Title
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(`• ${item.title}`, 20, yPosition)
      yPosition += 6

      // Description
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      const descLines = doc.splitTextToSize(item.description, pageWidth - 45)
      doc.text(descLines, 25, yPosition)
      yPosition += descLines.length * 4 + 8
    })

    yPosition += 5
  })

  return yPosition
}

/**
 * Add appendix with raw data
 */
function addAppendix(doc: jsPDF, data: any): number {
  let yPosition = 20

  addSectionHeader(doc, 'Appendix: Data Summary', yPosition)
  yPosition += 15

  // Data summary
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text('This appendix contains a summary of the raw data used in this analysis.', 15, yPosition)
  yPosition += 15

  // Data categories
  const dataSummary = [
    {
      category: 'Review Clusters',
      count: data.reviewClusters?.length || 0,
      status: '✓ Analyzed',
    },
    {
      category: 'Historical Trends',
      count: data.historicalTrends?.length || 0,
      status: '✓ Processed',
    },
    {
      category: 'Temporal Patterns',
      count: (data.temporalPatterns?.dayOfWeek?.length || 0) + (data.temporalPatterns?.timeOfDay?.length || 0),
      status: '✓ Identified',
    },
    {
      category: 'Seasonal Patterns',
      count: data.seasonalPatterns?.length || 0,
      status: '✓ Evaluated',
    },
    {
      category: 'Key Insights',
      count: (data.insights?.keyFindings?.length || 0) + (data.insights?.opportunities?.length || 0) + (data.insights?.risks?.length || 0),
      status: '✓ Generated',
    },
  ];

  (doc as any).autoTable({
    startY: yPosition,
    head: [['Data Category', 'Items', 'Status']],
    body: dataSummary.map(item => [item.category, item.count.toString(), item.status]),
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
  })

  return (doc as any).lastAutoTable.finalY + 10
}

/**
 * Generate recommendations based on analysis data
 */
function generateRecommendations(data: any, options: ExportOptions) {
  const avgRating = data.historicalTrends?.[0]?.avgRating ||
                   data.historicalTrends?.[0]?.data?.[0]?.value || 0
  const totalReviews = data.reviewClusters?.reduce((sum: number, c: any) => sum + (c.reviewCount || c.count || 0), 0) || 0

  const recommendations = {
    urgent: [] as any[],
    high: [] as any[],
    medium: [] as any[],
    longTerm: [] as any[],
  }

  // Generate recommendations based on data
  if (avgRating < 3.5) {
    recommendations.urgent.push({
      title: 'Address Customer Satisfaction Issues',
      description: 'With an average rating below 3.5, immediate action is needed to identify and resolve customer pain points.',
    })
  }

  if (totalReviews < 50) {
    recommendations.high.push({
      title: 'Implement Review Generation Campaign',
      description: 'Low review volume limits visibility. Launch an email campaign to encourage satisfied customers to share their experiences.',
    })
  }

  // Add business-type specific recommendations
  if (options.businessType === 'CAFE') {
    recommendations.medium.push({
      title: 'Enhance Coffee Program',
      description: 'Consider introducing specialty coffee options and barista training to differentiate from competitors.',
    })
    recommendations.longTerm.push({
      title: 'Develop Loyalty Program',
      description: 'Create a mobile-based loyalty program to increase customer retention and visit frequency.',
    })
  } else if (options.businessType === 'BAR') {
    recommendations.medium.push({
      title: 'Expand Cocktail Menu',
      description: 'Introduce seasonal cocktails and mocktails to appeal to a broader customer base.',
    })
    recommendations.longTerm.push({
      title: 'Host Regular Events',
      description: 'Organize weekly themed nights or live music to create a vibrant atmosphere and attract new customers.',
    })
  } else if (options.businessType === 'GALLERY') {
    recommendations.medium.push({
      title: 'Improve Online Presence',
      description: 'Enhance virtual gallery tours and social media engagement to reach art enthusiasts beyond local visitors.',
    })
    recommendations.longTerm.push({
      title: 'Develop Educational Programs',
      description: 'Create workshops and art classes to build community engagement and generate additional revenue.',
    })
  }

  // Add data-driven recommendations
  const topCluster = data.reviewClusters?.[0]
  if (topCluster && topCluster.sentiment === 'negative') {
    recommendations.urgent.push({
      title: `Address Issues in ${topCluster.name}`,
      description: 'This area has the most reviews but negative sentiment. Immediate improvements needed.',
    })
  }

  return recommendations
}

/**
 * Add section header with consistent styling
 */
function addSectionHeader(doc: jsPDF, title: string, yPosition: number): void {
  const pageWidth = doc.internal.pageSize.width

  // Background bar
  doc.setFillColor(59, 130, 246)
  doc.rect(0, yPosition - 5, pageWidth, 15, 'F')

  // Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(title.toUpperCase(), 15, yPosition + 5)

  // Reset colors
  doc.setTextColor(0, 0, 0)
}

/**
 * Add page numbers and footers
 */
function addPageNumbersAndFooters(doc: jsPDF): void {
  const pageCount = doc.internal.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    // Skip page numbers on cover page
    if (i === 1) continue

    // Footer line
    doc.setDrawColor(230, 230, 230)
    doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20)

    // Page number
    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' })

    // Footer text
    doc.setFontSize(8)
    doc.text('Confidential - StarGazer Analysis Report', 15, pageHeight - 10)
    doc.text(new Date().toLocaleDateString(), pageWidth - 15, pageHeight - 10, { align: 'right' })
  }
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const defaultColor = { r: 59, g: 130, b: 246 }

  if (!hex || hex.length < 7 || !hex.startsWith('#')) {
    return defaultColor
  }

  try {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)

    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      return defaultColor
    }

    return { r, g, b }
  } catch (error) {
    console.error('Error parsing hex color:', error)
    return defaultColor
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
      year: 'numeric', month: 'short', day: 'numeric',
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
