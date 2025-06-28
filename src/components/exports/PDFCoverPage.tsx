import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { ExportOptions } from '@/services/exportService'

// Color utilities
const hexToRgb = (hex: string) => {
  const defaultColor = 'rgb(59, 130, 246)' // Default blue

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

    return `rgb(${r}, ${g}, ${b})`
  } catch (error) {
    return defaultColor
  }
}

const createStyles = (brandingColor: string) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 0,
      position: 'relative',
    },
    header: {
      backgroundColor: hexToRgb(brandingColor),
      height: 120,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    headerDecorative: {
      position: 'absolute',
      right: 20,
      top: 20,
      width: 60,
      height: 60,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 30,
    },
    headerDecorativeSmall: {
      position: 'absolute',
      left: 30,
      bottom: 30,
      width: 40,
      height: 40,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 20,
    },
    title: {
      fontSize: 28,
      fontFamily: 'Helvetica-Bold',
      color: 'white',
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: 'Helvetica',
      color: 'white',
      textAlign: 'center',
    },
    businessTypeBadge: {
      backgroundColor: 'white',
      paddingVertical: 6,
      paddingHorizontal: 20,
      borderRadius: 15,
      marginTop: 120,
      alignSelf: 'center',
    },
    businessTypeText: {
      color: hexToRgb(brandingColor),
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      textAlign: 'center',
    },
    contentSection: {
      flex: 1,
      padding: 40,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    dateSection: {
      alignItems: 'center',
      marginTop: 30,
    },
    dateLabel: {
      fontSize: 14,
      color: '#666',
      marginBottom: 8,
    },
    dateRange: {
      fontSize: 16,
      fontFamily: 'Helvetica-Bold',
      color: '#333',
    },
    reportTypeSection: {
      backgroundColor: '#F8FAFC',
      padding: 20,
      marginTop: 40,
    },
    reportTypeTitle: {
      fontSize: 16,
      fontFamily: 'Helvetica-Bold',
      color: '#1E293B',
      marginBottom: 10,
    },
    reportDescription: {
      fontSize: 12,
      color: '#64748B',
      lineHeight: 1.5,
    },
    featuresGrid: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 20,
    },
    featureItem: {
      backgroundColor: 'white',
      padding: 8,
      marginBottom: 8,
      width: '45%',
    },
    featureText: {
      fontSize: 10,
      color: '#475569',
    },
    footer: {
      borderTop: '1px solid #E2E8F0',
      paddingTop: 20,
      alignItems: 'center',
    },
    footerText: {
      fontSize: 10,
      color: '#94A3B8',
      textAlign: 'center',
    },
    brandingText: {
      fontSize: 12,
      color: '#64748B',
      textAlign: 'center',
      marginTop: 5,
    },
  })

interface PDFCoverPageProps {
  options: ExportOptions
}

export const PDFCoverPage: React.FC<PDFCoverPageProps> = ({ options }) => {
  const styles = createStyles(options.brandingColor || '#3B82F6')

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  }

  const reportFeatures = [
    'Executive Summary',
    'Temporal Analysis',
    'Review Clustering',
    'Sentiment Insights',
    'Strategic Recommendations',
    'Performance Metrics',
    'Data Visualizations',
    'Actionable Insights',
  ]

  return (
    <View style={styles.container}>
      {/* Header with gradient-like effect */}
      <View style={styles.header}>
        <View style={styles.headerDecorative} />
        <View style={styles.headerDecorativeSmall} />

        <Text style={styles.title}>
          {options.customTitle || options.businessName}
        </Text>
        <Text style={styles.subtitle}>
          Comprehensive Review Analysis Report
        </Text>
      </View>

      {/* Business Type Badge */}
      <View style={styles.businessTypeBadge}>
        <Text style={styles.businessTypeText}>
          {options.businessType.toUpperCase()}
        </Text>
      </View>

      {/* Main Content */}
      <View style={styles.contentSection}>
        {/* Date Range */}
        {options.dateRange && (
          <View style={styles.dateSection}>
            <Text style={styles.dateLabel}>Analysis Period</Text>
            <Text style={styles.dateRange}>
              {formatDate(options.dateRange.start)} -{' '}
              {formatDate(options.dateRange.end)}
            </Text>
          </View>
        )}

        {/* Report Type Description */}
        <View style={styles.reportTypeSection}>
          <Text style={styles.reportTypeTitle}>What's Inside This Report</Text>
          <Text style={styles.reportDescription}>
            This comprehensive analysis provides data-driven insights into
            customer feedback patterns, sentiment trends, and strategic
            recommendations to enhance business performance and customer
            satisfaction.
          </Text>

          {/* Features Grid */}
          <View style={styles.featuresGrid}>
            {reportFeatures.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureText}>✓ {feature}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated on {formatDate(new Date())}
          </Text>
          <Text style={styles.brandingText}>
            Powered by StarGazer Analysis Platform
          </Text>
        </View>
      </View>
    </View>
  )
}

export default PDFCoverPage
