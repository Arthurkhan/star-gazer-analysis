import type { Review } from '@/types/reviews'
import type { AnalysisSummaryData } from '@/types/analysisSummary'
import { format } from 'date-fns'

// Export configuration interface
export interface ExportConfig {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  template: 'executive' | 'detailed' | 'minimal' | 'custom';
  branding: {
    companyName?: string;
    logoUrl?: string;
    colors?: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
  sections: {
    coverPage: boolean;
    executiveSummary: boolean;
    charts: boolean;
    detailedAnalysis: boolean;
    recommendations: boolean;
    appendix: boolean;
  };
  chartOptions: {
    includeImages: boolean;
    resolution: 'low' | 'medium' | 'high';
    format: 'png' | 'svg' | 'pdf';
  };
}

// Default export configuration
export const defaultExportConfig: ExportConfig = {
  format: 'pdf',
  template: 'executive',
  branding: {
    companyName: 'Star-Gazer Analysis',
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#10b981',
    },
  },
  sections: {
    coverPage: true,
    executiveSummary: true,
    charts: true,
    detailedAnalysis: true,
    recommendations: true,
    appendix: false,
  },
  chartOptions: {
    includeImages: true,
    resolution: 'high',
    format: 'png',
  },
}

// Data preparation utilities
export const prepareExportData = (
  reviews: Review[],
  analysisData: AnalysisSummaryData,
  config: ExportConfig,
) => {
  const metadata = {
    title: getReportTitle(config.template),
    subtitle: `Generated on ${format(new Date(), 'PPP')}`,
    businessName: analysisData.dataSource.businessName,
    totalReviews: reviews.length,
    dateRange: {
      from: analysisData.timePeriod.current.start,
      to: analysisData.timePeriod.current.end,
    },
    generatedAt: new Date(),
    config,
  }

  return {
    metadata,
    reviews: filterReviewsForExport(reviews, config),
    analysis: analysisData,
    charts: generateChartData(analysisData, config),
    recommendations: extractRecommendations(analysisData),
    appendix: config.sections.appendix ? generateAppendix(reviews, analysisData) : null,
  }
}

// Chart data generation for exports
export const generateChartData = (analysisData: AnalysisSummaryData, config: ExportConfig) => {
  if (!config.sections.charts) return null

  return {
    ratingTrends: {
      type: 'line',
      title: 'Rating Trends Over Time',
      data: analysisData.ratingAnalysis.monthlyTrends,
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' as const },
          title: { display: true, text: 'Monthly Rating Trends' },
        },
      },
    },
    sentimentDistribution: {
      type: 'pie',
      title: 'Sentiment Distribution',
      data: {
        labels: ['Positive', 'Neutral', 'Negative'],
        datasets: [{
          data: [
            analysisData.sentimentAnalysis.distribution.positive,
            analysisData.sentimentAnalysis.distribution.neutral,
            analysisData.sentimentAnalysis.distribution.negative,
          ],
          backgroundColor: ['#10b981', '#64748b', '#ef4444'],
        }],
      },
    },
    themeFrequency: {
      type: 'bar',
      title: 'Top Themes Mentioned',
      data: {
        labels: analysisData.thematicAnalysis.topCategories.slice(0, 10).map(cat => cat.category),
        datasets: [{
          label: 'Mentions',
          data: analysisData.thematicAnalysis.topCategories.slice(0, 10).map(cat => cat.count),
          backgroundColor: config.branding.colors?.primary || '#3b82f6',
        }],
      },
    },
    performanceMetrics: {
      type: 'radar',
      title: 'Performance Overview',
      data: {
        labels: ['Rating', 'Sentiment', 'Response Rate', 'Volume', 'Growth'],
        datasets: [{
          label: 'Current Performance',
          data: [
            (analysisData.performanceMetrics.averageRating / 5) * 100,
            analysisData.sentimentAnalysis.distribution.positive,
            analysisData.responseAnalytics.responseRate,
            Math.min(100, (analysisData.performanceMetrics.totalReviews / 100) * 10),
            Math.max(0, Math.min(100, analysisData.performanceMetrics.growthRate + 50)),
          ],
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: config.branding.colors?.primary || '#3b82f6',
          borderWidth: 2,
        }],
      },
    },
  }
}

// PDF generation utilities
export const generatePDFContent = (exportData: any, config: ExportConfig): string => {
  const { metadata, analysis, charts, recommendations } = exportData

  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${metadata.title}</title>
      <style>
        ${getPDFStyles(config)}
      </style>
    </head>
    <body>
  `

  // Cover page
  if (config.sections.coverPage) {
    htmlContent += generateCoverPage(metadata, config)
  }

  // Executive summary
  if (config.sections.executiveSummary) {
    htmlContent += generateExecutiveSummary(analysis, config)
  }

  // Charts section
  if (config.sections.charts && charts) {
    htmlContent += generateChartsSection(charts, config)
  }

  // Detailed analysis
  if (config.sections.detailedAnalysis) {
    htmlContent += generateDetailedAnalysis(analysis, config)
  }

  // Recommendations
  if (config.sections.recommendations && recommendations) {
    htmlContent += generateRecommendationsSection(recommendations, config)
  }

  // Appendix
  if (config.sections.appendix && exportData.appendix) {
    htmlContent += generateAppendixSection(exportData.appendix, config)
  }

  htmlContent += `
    </body>
    </html>
  `

  return htmlContent
}

// Excel export utilities
export const generateExcelWorkbook = (exportData: any, config: ExportConfig) => {
  const { metadata, reviews, analysis } = exportData

  const workbook = {
    SheetNames: [] as string[],
    Sheets: {} as Record<string, any>,
  }

  // Summary sheet
  workbook.SheetNames.push('Summary')
  workbook.Sheets['Summary'] = generateSummarySheet(analysis, metadata)

  // Reviews data sheet
  workbook.SheetNames.push('Reviews Data')
  workbook.Sheets['Reviews Data'] = generateReviewsSheet(reviews)

  // Performance metrics sheet
  workbook.SheetNames.push('Performance')
  workbook.Sheets['Performance'] = generatePerformanceSheet(analysis)

  // Sentiment analysis sheet
  workbook.SheetNames.push('Sentiment')
  workbook.Sheets['Sentiment'] = generateSentimentSheet(analysis)

  // Themes sheet
  workbook.SheetNames.push('Themes')
  workbook.Sheets['Themes'] = generateThemesSheet(analysis)

  return workbook
}

// CSV export utilities
export const generateCSVContent = (reviews: Review[], config: ExportConfig): string => {
  const headers = [
    'Date',
    'Rating',
    'Customer Name',
    'Review Text',
    'Sentiment',
    'Staff Mentioned',
    'Main Themes',
    'Response Status',
    'Review URL',
  ]

  const rows = reviews.map(review => [
    format(new Date(review.publishedAtDate), 'yyyy-MM-dd'),
    review.stars.toString(),
    escapeCSVField(review.name || ''),
    escapeCSVField(review.text || ''),
    review.sentiment || '',
    escapeCSVField(review.staffMentioned || ''),
    escapeCSVField(review.mainThemes || ''),
    review.responseFromOwnerText ? 'Responded' : 'No Response',
    review.reviewUrl || '',
  ])

  return [headers, ...rows]
    .map(row => row.join(','))
    .join('\n')
}

// JSON export utilities
export const generateJSONContent = (exportData: any, config: ExportConfig): string => {
  const output = {
    metadata: exportData.metadata,
    summary: {
      healthScore: exportData.analysis.businessHealthScore,
      performanceMetrics: exportData.analysis.performanceMetrics,
      keyInsights: extractKeyInsights(exportData.analysis),
    },
    analysis: config.sections.detailedAnalysis ? exportData.analysis : null,
    reviews: config.sections.appendix ? exportData.reviews : null,
    generatedAt: new Date().toISOString(),
  }

  return JSON.stringify(output, null, 2)
}

// Template generation functions
const getReportTitle = (template: string): string => {
  const titles = {
    executive: 'Executive Summary Report',
    detailed: 'Comprehensive Analysis Report',
    minimal: 'Key Insights Report',
    custom: 'Business Analysis Report',
  }
  return titles[template as keyof typeof titles] || titles.executive
}

const generateCoverPage = (metadata: any, config: ExportConfig): string => {
  return `
    <div class="cover-page">
      <div class="header">
        ${config.branding.logoUrl ? `<img src="${config.branding.logoUrl}" alt="Logo" class="logo">` : ''}
        <h1 class="title">${metadata.title}</h1>
        <h2 class="subtitle">${metadata.subtitle}</h2>
      </div>
      <div class="business-info">
        <h3>Business: ${metadata.businessName}</h3>
        <p>Analysis Period: ${format(metadata.dateRange.from, 'MMM yyyy')} - ${format(metadata.dateRange.to, 'MMM yyyy')}</p>
        <p>Total Reviews Analyzed: ${metadata.totalReviews.toLocaleString()}</p>
      </div>
      <div class="footer">
        <p>Generated by Star-Gazer Analysis Platform</p>
        <p>${format(metadata.generatedAt, 'PPPP')}</p>
      </div>
    </div>
    <div class="page-break"></div>
  `
}

const generateExecutiveSummary = (analysis: AnalysisSummaryData, config: ExportConfig): string => {
  return `
    <div class="section">
      <h2>Executive Summary</h2>
      <div class="health-score">
        <h3>Business Health Score: ${analysis.businessHealthScore.overall}%</h3>
        <div class="metrics-grid">
          <div class="metric">
            <span class="label">Rating Score:</span>
            <span class="value">${analysis.businessHealthScore.components.rating}%</span>
          </div>
          <div class="metric">
            <span class="label">Sentiment Score:</span>
            <span class="value">${analysis.businessHealthScore.components.sentiment}%</span>
          </div>
          <div class="metric">
            <span class="label">Response Score:</span>
            <span class="value">${analysis.businessHealthScore.components.response}%</span>
          </div>
          <div class="metric">
            <span class="label">Volume Trend:</span>
            <span class="value">${analysis.businessHealthScore.components.volume}%</span>
          </div>
        </div>
      </div>
      <div class="key-findings">
        <h3>Key Findings</h3>
        <ul>
          <li>Average Rating: ${analysis.performanceMetrics.averageRating.toFixed(1)}/5.0</li>
          <li>Total Reviews: ${analysis.performanceMetrics.totalReviews.toLocaleString()}</li>
          <li>Growth Rate: ${analysis.performanceMetrics.growthRate > 0 ? '+' : ''}${analysis.performanceMetrics.growthRate.toFixed(1)}%</li>
          <li>Response Rate: ${analysis.responseAnalytics.responseRate.toFixed(1)}%</li>
        </ul>
      </div>
    </div>
  `
}

const generateChartsSection = (charts: any, config: ExportConfig): string => {
  return `
    <div class="section">
      <h2>Performance Visualizations</h2>
      <div class="charts-grid">
        ${Object.entries(charts).map(([key, chart]: [string, any]) => `
          <div class="chart-container">
            <h3>${chart.title}</h3>
            <div class="chart-placeholder">
              [Chart: ${chart.title}]
              <p class="chart-description">
                ${getChartDescription(key, chart)}
              </p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `
}

const generateDetailedAnalysis = (analysis: AnalysisSummaryData, config: ExportConfig): string => {
  return `
    <div class="section">
      <h2>Detailed Analysis</h2>
      
      <div class="subsection">
        <h3>Sentiment Analysis</h3>
        <div class="sentiment-breakdown">
          <div class="sentiment-item positive">
            <span class="label">Positive:</span>
            <span class="value">${analysis.sentimentAnalysis.distribution.positive.toFixed(1)}%</span>
          </div>
          <div class="sentiment-item neutral">
            <span class="label">Neutral:</span>
            <span class="value">${analysis.sentimentAnalysis.distribution.neutral.toFixed(1)}%</span>
          </div>
          <div class="sentiment-item negative">
            <span class="label">Negative:</span>
            <span class="value">${analysis.sentimentAnalysis.distribution.negative.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div class="subsection">
        <h3>Top Themes</h3>
        <div class="themes-list">
          ${analysis.thematicAnalysis.topCategories.slice(0, 10).map(theme => `
            <div class="theme-item">
              <span class="theme-name">${theme.category}</span>
              <span class="theme-count">${theme.count} mentions</span>
              <span class="theme-sentiment ${theme.averageSentiment > 0.1 ? 'positive' : theme.averageSentiment < -0.1 ? 'negative' : 'neutral'}">
                ${theme.averageSentiment > 0.1 ? 'Positive' : theme.averageSentiment < -0.1 ? 'Negative' : 'Neutral'}
              </span>
            </div>
          `).join('')}
        </div>
      </div>

      ${analysis.staffInsights.mentions.length > 0 ? `
        <div class="subsection">
          <h3>Staff Performance</h3>
          <div class="staff-list">
            ${analysis.staffInsights.mentions.slice(0, 5).map(staff => `
              <div class="staff-item">
                <span class="staff-name">${staff.name}</span>
                <span class="staff-mentions">${staff.mentionCount} mentions</span>
                <span class="staff-score">${staff.performanceScore.toFixed(1)}/10</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `
}

const generateRecommendationsSection = (recommendations: any, config: ExportConfig): string => {
  return `
    <div class="section">
      <h2>Recommendations</h2>
      
      ${recommendations.urgent.length > 0 ? `
        <div class="subsection">
          <h3>Urgent Actions</h3>
          <ul class="recommendations-list urgent">
            ${recommendations.urgent.map((item: any) => `
              <li class="priority-${item.priority}">
                <strong>${item.title}</strong>
                <p>${item.description}</p>
                <span class="timeline">Timeline: ${item.timeline}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}

      ${recommendations.improvements.length > 0 ? `
        <div class="subsection">
          <h3>Improvement Opportunities</h3>
          <ul class="recommendations-list improvements">
            ${recommendations.improvements.map((item: any) => `
              <li class="impact-${item.impactLevel}">
                <strong>${item.title}</strong>
                <p>${item.description}</p>
                <div class="impact-effort">
                  <span>Impact: ${item.impactLevel}</span>
                  <span>Effort: ${item.effortLevel}</span>
                </div>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `
}

// Helper functions
const filterReviewsForExport = (reviews: Review[], config: ExportConfig): Review[] => {
  // Apply any filtering logic based on config
  return reviews
}

const extractRecommendations = (analysisData: AnalysisSummaryData) => {
  return {
    urgent: analysisData.actionItems.urgentActions,
    improvements: analysisData.actionItems.improvementOpportunities,
    strengths: analysisData.actionItems.strengthsToLeverage,
    monitoring: analysisData.actionItems.keyMetricsToMonitor,
  }
}

const generateAppendix = (reviews: Review[], analysisData: AnalysisSummaryData) => {
  return {
    rawDataSample: reviews.slice(0, 100), // First 100 reviews
    methodologyNotes: {
      sentimentAnalysis: 'Sentiment scores calculated using natural language processing algorithms',
      themeExtraction: 'Themes identified through keyword frequency analysis and clustering',
      healthScore: 'Composite score based on rating (40%), sentiment (30%), response rate (20%), and volume trend (10%)',
    },
    dataQuality: {
      totalReviews: reviews.length,
      reviewsWithText: reviews.filter(r => r.text && r.text.length > 0).length,
      reviewsWithSentiment: reviews.filter(r => r.sentiment).length,
      reviewsWithThemes: reviews.filter(r => r.mainThemes).length,
    },
  }
}

const extractKeyInsights = (analysis: AnalysisSummaryData) => {
  return [
    `Business health score of ${analysis.businessHealthScore.overall}% indicates ${
      analysis.businessHealthScore.overall >= 80 ? 'excellent' :
      analysis.businessHealthScore.overall >= 60 ? 'good' : 'needs improvement'
    } performance`,
    `${analysis.sentimentAnalysis.distribution.positive.toFixed(1)}% of reviews express positive sentiment`,
    `Top concern: ${analysis.thematicAnalysis.attentionAreas[0]?.category || 'None identified'}`,
    `Response rate of ${analysis.responseAnalytics.responseRate.toFixed(1)}% ${
      analysis.responseAnalytics.responseRate >= 80 ? 'exceeds' :
      analysis.responseAnalytics.responseRate >= 60 ? 'meets' : 'falls below'
    } industry standards`,
  ]
}

const generateSummarySheet = (analysis: AnalysisSummaryData, metadata: any) => {
  return [
    ['Business Analysis Summary'],
    ['Business Name', metadata.businessName],
    ['Analysis Date', format(metadata.generatedAt, 'yyyy-MM-dd')],
    ['Total Reviews', metadata.totalReviews],
    [''],
    ['Health Score Breakdown'],
    ['Overall Score', `${analysis.businessHealthScore.overall}%`],
    ['Rating Component', `${analysis.businessHealthScore.components.rating}%`],
    ['Sentiment Component', `${analysis.businessHealthScore.components.sentiment}%`],
    ['Response Component', `${analysis.businessHealthScore.components.response}%`],
    ['Volume Component', `${analysis.businessHealthScore.components.volume}%`],
    [''],
    ['Key Metrics'],
    ['Average Rating', analysis.performanceMetrics.averageRating.toFixed(2)],
    ['Growth Rate', `${analysis.performanceMetrics.growthRate.toFixed(1)}%`],
    ['Response Rate', `${analysis.responseAnalytics.responseRate.toFixed(1)}%`],
    ['Positive Sentiment', `${analysis.sentimentAnalysis.distribution.positive.toFixed(1)}%`],
  ]
}

const generateReviewsSheet = (reviews: Review[]) => {
  const headers = ['Date', 'Rating', 'Customer', 'Review Text', 'Sentiment', 'Staff Mentioned', 'Themes']
  const rows = reviews.map(review => [
    format(new Date(review.publishedAtDate), 'yyyy-MM-dd'),
    review.stars,
    review.name || '',
    review.text || '',
    review.sentiment || '',
    review.staffMentioned || '',
    review.mainThemes || '',
  ])

  return [headers, ...rows]
}

const generatePerformanceSheet = (analysis: AnalysisSummaryData) => {
  return [
    ['Performance Metrics'],
    ['Metric', 'Value', 'Benchmark', 'Status'],
    ['Average Rating', analysis.performanceMetrics.averageRating.toFixed(2), '4.0', analysis.performanceMetrics.averageRating >= 4.0 ? 'Above' : 'Below'],
    ['Total Reviews', analysis.performanceMetrics.totalReviews, '100', analysis.performanceMetrics.totalReviews >= 100 ? 'Above' : 'Below'],
    ['Growth Rate', `${analysis.performanceMetrics.growthRate.toFixed(1)}%`, '5%', analysis.performanceMetrics.growthRate >= 5 ? 'Above' : 'Below'],
    ['Response Rate', `${analysis.responseAnalytics.responseRate.toFixed(1)}%`, '60%', analysis.responseAnalytics.responseRate >= 60 ? 'Above' : 'Below'],
  ]
}

const generateSentimentSheet = (analysis: AnalysisSummaryData) => {
  return [
    ['Sentiment Analysis'],
    ['Category', 'Percentage', 'Count'],
    ['Positive', `${analysis.sentimentAnalysis.distribution.positive.toFixed(1)}%`, Math.round(analysis.sentimentAnalysis.distribution.positive * analysis.performanceMetrics.totalReviews / 100)],
    ['Neutral', `${analysis.sentimentAnalysis.distribution.neutral.toFixed(1)}%`, Math.round(analysis.sentimentAnalysis.distribution.neutral * analysis.performanceMetrics.totalReviews / 100)],
    ['Negative', `${analysis.sentimentAnalysis.distribution.negative.toFixed(1)}%`, Math.round(analysis.sentimentAnalysis.distribution.negative * analysis.performanceMetrics.totalReviews / 100)],
  ]
}

const generateThemesSheet = (analysis: AnalysisSummaryData) => {
  const headers = ['Theme', 'Mentions', 'Avg Sentiment', 'Category']
  const rows = analysis.thematicAnalysis.topCategories.map(theme => [
    theme.category,
    theme.count,
    theme.averageSentiment.toFixed(2),
    theme.averageSentiment > 0.1 ? 'Positive' : theme.averageSentiment < -0.1 ? 'Negative' : 'Neutral',
  ])

  return [headers, ...rows]
}

const getPDFStyles = (config: ExportConfig): string => {
  const colors = config.branding.colors || defaultExportConfig.branding.colors!

  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .cover-page { min-height: 100vh; display: flex; flex-direction: column; justify-content: space-between; text-align: center; padding: 2rem; }
    .page-break { page-break-after: always; }
    .section { margin-bottom: 2rem; padding: 1rem 0; }
    .subsection { margin-bottom: 1.5rem; }
    h1 { font-size: 2.5rem; color: ${colors.primary}; margin-bottom: 1rem; }
    h2 { font-size: 2rem; color: ${colors.primary}; margin-bottom: 1rem; border-bottom: 2px solid ${colors.primary}; padding-bottom: 0.5rem; }
    h3 { font-size: 1.5rem; color: ${colors.secondary}; margin-bottom: 0.75rem; }
    .title { font-size: 3rem; font-weight: bold; }
    .subtitle { font-size: 1.5rem; color: ${colors.secondary}; margin-bottom: 2rem; }
    .logo { max-height: 100px; margin-bottom: 2rem; }
    .business-info { margin: 2rem 0; }
    .health-score { background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; }
    .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 1rem; }
    .metric { display: flex; justify-content: space-between; padding: 0.5rem; background: white; border-radius: 4px; }
    .charts-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; }
    .chart-container { border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; }
    .chart-placeholder { background: #f1f5f9; padding: 2rem; text-align: center; border-radius: 4px; }
    .sentiment-breakdown { display: flex; gap: 1rem; margin-top: 1rem; }
    .sentiment-item { flex: 1; padding: 1rem; border-radius: 4px; text-align: center; }
    .sentiment-item.positive { background: #dcfce7; color: #166534; }
    .sentiment-item.neutral { background: #f1f5f9; color: #475569; }
    .sentiment-item.negative { background: #fee2e2; color: #991b1b; }
    .themes-list, .staff-list { display: grid; gap: 0.5rem; }
    .theme-item, .staff-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #f8f9fa; border-radius: 4px; }
    .recommendations-list { list-style: none; }
    .recommendations-list li { margin-bottom: 1rem; padding: 1rem; border-left: 4px solid ${colors.accent}; background: #f8f9fa; }
    .priority-critical { border-left-color: #ef4444; }
    .priority-high { border-left-color: #f97316; }
    .priority-medium { border-left-color: #eab308; }
    .timeline { font-size: 0.875rem; color: ${colors.secondary}; font-style: italic; }
    .footer { margin-top: auto; color: ${colors.secondary}; font-size: 0.875rem; }
    @media print {
      body { -webkit-print-color-adjust: exact; }
      .page-break { page-break-after: always; }
    }
  `
}

const escapeCSVField = (field: string): string => {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

const getChartDescription = (key: string, chart: any): string => {
  const descriptions: Record<string, string> = {
    ratingTrends: 'Shows how customer ratings have evolved over time, identifying trends and patterns in satisfaction levels.',
    sentimentDistribution: 'Breaks down customer sentiment across all reviews, showing the proportion of positive, neutral, and negative feedback.',
    themeFrequency: 'Displays the most frequently mentioned topics and themes in customer reviews.',
    performanceMetrics: 'Provides a comprehensive overview of key performance indicators in a radar chart format.',
  }
  return descriptions[key] || 'Performance visualization chart'
}

// File download utility
export const downloadFile = (content: string | Blob, filename: string, mimeType: string) => {
  let blob: Blob

  if (content instanceof Blob) {
    blob = content
  } else {
    blob = new Blob([content], { type: mimeType })
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Export format utilities
export const exportFormats = {
  pdf: {
    extension: 'pdf',
    mimeType: 'application/pdf',
    generator: generatePDFContent,
  },
  excel: {
    extension: 'xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    generator: generateExcelWorkbook,
  },
  csv: {
    extension: 'csv',
    mimeType: 'text/csv',
    generator: generateCSVContent,
  },
  json: {
    extension: 'json',
    mimeType: 'application/json',
    generator: generateJSONContent,
  },
}
