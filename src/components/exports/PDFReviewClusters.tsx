import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { ExportOptions } from '@/services/exportService'

const hexToRgb = (hex: string) => {
  const defaultColor = 'rgb(59, 130, 246)'

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
      padding: 30,
      flex: 1,
    },
    header: {
      backgroundColor: hexToRgb(brandingColor),
      padding: 15,
      borderRadius: 8,
      marginBottom: 25,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center',
    },
    introduction: {
      backgroundColor: '#F8FAFC',
      padding: 15,
      borderRadius: 8,
      marginBottom: 20,
    },
    introText: {
      fontSize: 11,
      color: '#64748B',
      lineHeight: 1.5,
    },
    table: {
      border: '1px solid #D1D5DB',
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 20,
    },
    tableHeader: {
      backgroundColor: hexToRgb(brandingColor),
      display: 'flex',
      flexDirection: 'row',
      padding: 12,
    },
    tableRow: {
      display: 'flex',
      flexDirection: 'row',
      padding: 12,
      borderTop: '1px solid #E5E7EB',
    },
    tableRowAlternate: {
      backgroundColor: '#F9FAFB',
    },
    tableCellHeader: {
      fontSize: 11,
      fontWeight: 'bold',
      color: 'white',
    },
    tableCell: {
      fontSize: 10,
      color: '#374151',
    },
    clusterName: {
      flex: 2,
    },
    reviewCount: {
      flex: 1,
      textAlign: 'center',
    },
    sentiment: {
      flex: 1.5,
    },
    keywords: {
      flex: 2.5,
    },
    sentimentPositive: {
      color: '#059669',
    },
    sentimentNegative: {
      color: '#DC2626',
    },
    sentimentNeutral: {
      color: '#6B7280',
    },
    visualSection: {
      marginTop: 20,
    },
    visualTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#1F2937',
      marginBottom: 15,
    },
    chartContainer: {
      backgroundColor: '#F9FAFB',
      border: '1px solid #D1D5DB',
      borderRadius: 8,
      padding: 15,
    },
    barChart: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    },
    barRow: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    },
    barLabel: {
      fontSize: 9,
      color: '#6B7280',
      width: 120,
    },
    barContainer: {
      flex: 1,
      height: 14,
      backgroundColor: '#E5E7EB',
      borderRadius: 7,
      marginHorizontal: 10,
      position: 'relative',
    },
    barFill: {
      height: 14,
      borderRadius: 7,
      position: 'absolute',
      top: 0,
      left: 0,
    },
    barValue: {
      fontSize: 10,
      color: '#374151',
      width: 40,
      textAlign: 'right',
      fontWeight: 'bold',
    },
    pageNumber: {
      position: 'absolute',
      bottom: 20,
      right: 30,
      fontSize: 10,
      color: '#9CA3AF',
    },
  })

interface PDFReviewClustersProps {
  data: any[]
  options: ExportOptions
}

export const PDFReviewClusters: React.FC<PDFReviewClustersProps> = ({
  data,
  options,
}) => {
  const styles = createStyles(options.brandingColor || '#3B82F6')

  // Sort clusters by review count
  const sortedClusters = [...data].sort(
    (a, b) => (b.count || 0) - (a.count || 0),
  )
  const maxCount = Math.max(...sortedClusters.map(c => c.count || 0))

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return styles.sentimentPositive
      case 'negative':
        return styles.sentimentNegative
      default:
        return styles.sentimentNeutral
    }
  }

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return '😊'
      case 'negative':
        return '😟'
      default:
        return '😐'
    }
  }

  const getBarColor = (index: number) => {
    const colors = [
      '#10B981', // Green
      '#3B82F6', // Blue
      '#F59E0B', // Yellow
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#06B6D4', // Cyan
    ]
    return colors[index % colors.length]
  }

  return (
    <View style={styles.container}>
      {/* Page Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Review Clusters Analysis</Text>
      </View>

      {/* Introduction */}
      <View style={styles.introduction}>
        <Text style={styles.introText}>
          Customer reviews have been analyzed and grouped into distinct clusters
          based on common themes and sentiments. This clustering helps identify
          the key areas that matter most to customers and reveals patterns in
          feedback that can inform strategic business decisions.
        </Text>
      </View>

      {/* Clusters Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCellHeader, styles.clusterName]}>
            Cluster Name
          </Text>
          <Text style={[styles.tableCellHeader, styles.reviewCount]}>
            Reviews
          </Text>
          <Text style={[styles.tableCellHeader, styles.sentiment]}>
            Sentiment
          </Text>
          <Text style={[styles.tableCellHeader, styles.keywords]}>
            Key Themes
          </Text>
        </View>

        {sortedClusters.map((cluster, index) => {
          const count = cluster.count || 0
          const sentiment = cluster.sentiment || 'neutral'
          const keywords = Array.isArray(cluster.keywords)
            ? cluster.keywords.slice(0, 3).join(', ')
            : 'No keywords available'
          const sentimentEmoji = getSentimentEmoji(sentiment)
          const sentimentStyle = getSentimentColor(sentiment)

          return (
            <View
              key={index}
              style={[
                styles.tableRow,
                index % 2 === 1 ? styles.tableRowAlternate : {},
              ]}
            >
              <Text style={[styles.tableCell, styles.clusterName]}>
                {cluster.name || `Cluster ${index + 1}`}
              </Text>
              <Text style={[styles.tableCell, styles.reviewCount]}>
                {count}
              </Text>
              <Text
                style={[styles.tableCell, styles.sentiment, sentimentStyle]}
              >
                {sentimentEmoji}{' '}
                {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
              </Text>
              <Text style={[styles.tableCell, styles.keywords]}>
                {keywords}
              </Text>
            </View>
          )
        })}
      </View>

      {/* Visual Distribution */}
      <View style={styles.visualSection}>
        <Text style={styles.visualTitle}>Cluster Distribution</Text>
        <View style={styles.chartContainer}>
          <View style={styles.barChart}>
            {sortedClusters.slice(0, 8).map((cluster, index) => {
              // Show top 8 clusters
              const count = cluster.count || 0
              const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0
              const barColor = getBarColor(index)

              return (
                <View key={index} style={styles.barRow}>
                  <Text style={styles.barLabel}>
                    {cluster.name && cluster.name.length > 15
                      ? `${cluster.name.substring(0, 15)}...`
                      : cluster.name || `Cluster ${index + 1}`}
                  </Text>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${percentage}%`,
                          backgroundColor: barColor,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barValue}>{count}</Text>
                </View>
              )
            })}
          </View>
        </View>
      </View>

      {/* Page Number */}
      <Text style={styles.pageNumber}>Page 4</Text>
    </View>
  )
}

export default PDFReviewClusters
