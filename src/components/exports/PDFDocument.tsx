import React from 'react'
import { Document, Page, StyleSheet } from '@react-pdf/renderer'
import type { EnhancedAnalysis } from '@/types/dataAnalysis'
import type { ExportOptions } from '@/services/exportService'
import { PDFCoverPage } from './PDFCoverPage'
import { PDFExecutiveSummary } from './PDFExecutiveSummary'
import { PDFTemporalAnalysis } from './PDFTemporalAnalysis'
import { PDFReviewClusters } from './PDFReviewClusters'
import { PDFInsights } from './PDFInsights'
import { PDFRecommendations } from './PDFRecommendations'

// PDF Styles using built-in fonts
const styles = StyleSheet.create({
  document: {
    fontFamily: 'Helvetica',
  },
})

interface PDFDocumentProps {
  data: EnhancedAnalysis
  options: ExportOptions
}

export const PDFDocument: React.FC<PDFDocumentProps> = ({ data, options }) => {
  return (
    <Document
      style={styles.document}
      title={options.customTitle || `${options.businessName} - Analysis Report`}
    >
      {/* Cover Page */}
      <Page size='A4'>
        <PDFCoverPage options={options} />
      </Page>

      {/* Executive Summary */}
      <Page size='A4'>
        <PDFExecutiveSummary data={data} options={options} />
      </Page>

      {/* Temporal Analysis */}
      {data.temporalPatterns && (
        <Page size='A4'>
          <PDFTemporalAnalysis data={data.temporalPatterns} options={options} />
        </Page>
      )}

      {/* Review Clusters */}
      {options.includeTables &&
        data.reviewClusters &&
        data.reviewClusters.length > 0 && (
          <Page size='A4'>
            <PDFReviewClusters data={data.reviewClusters} options={options} />
          </Page>
        )}

      {/* Insights */}
      {data.insights && data.insights.length > 0 && (
        <Page size='A4'>
          <PDFInsights data={data.insights} options={options} />
        </Page>
      )}

      {/* Recommendations */}
      {options.includeRecommendations && (
        <Page size='A4'>
          <PDFRecommendations data={data} options={options} />
        </Page>
      )}
    </Document>
  )
}

export default PDFDocument
