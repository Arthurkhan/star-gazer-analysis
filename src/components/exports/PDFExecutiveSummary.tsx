import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { EnhancedAnalysis } from '@/types/dataAnalysis'
import type { ExportOptions } from '@/services/exportService'

// Helper function to calculate fallback rating distribution
const calculateFallbackRatingDistribution = (
  clusters: any[],
  totalReviews: number,
) => {
  if (totalReviews === 0) {
    return Array.from({ length: 5 }, (_, i) => ({
      rating: 5 - i,
      count: 0,
      percentage: 0,
      color: ['#10B981', '#84CC16', '#F59E0B', '#F97316', '#EF4444'][i],
    }))
  }

  // Estimate distribution based on sentiment
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 }
  clusters.forEach(cluster => {
    const sentiment = cluster.sentiment || 'neutral'
    if (sentiment in sentimentCounts) {
      sentimentCounts[sentiment as keyof typeof sentimentCounts] +=
        cluster.count || 0
    }
  })

  const rating5 = Math.round(sentimentCounts.positive * 0.6)
  const rating4 = sentimentCounts.positive - rating5
  const rating3 = sentimentCounts.neutral
  const rating2 = Math.round(sentimentCounts.negative * 0.3)
  const rating1 = sentimentCounts.negative - rating2

  return [
    {
      rating: 5,
      count: rating5,
      percentage: (rating5 / totalReviews) * 100,
      color: '#10B981',
    },
    {
      rating: 4,
      count: rating4,
      percentage: (rating4 / totalReviews) * 100,
      color: '#84CC16',
    },
    {
      rating: 3,
      count: rating3,
      percentage: (rating3 / totalReviews) * 100,
      color: '#F59E0B',
    },
    {
      rating: 2,
      count: rating2,
      percentage: (rating2 / totalReviews) * 100,
      color: '#F97316',
    },
    {
      rating: 1,
      count: rating1,
      percentage: (rating1 / totalReviews) * 100,
      color: '#EF4444',
    },
  ]
}

// Helper function to calculate period comparison
const calculatePeriodComparison = (historicalTrends: any[]) => {
  if (historicalTrends.length < 2) {
    return {
      reviewChange: 'No comparison data',
      ratingChange: 'No comparison data',
    }
  }

  const latest = historicalTrends[0]
  const previous = historicalTrends[1]

  const reviewChange = latest.reviewCount - previous.reviewCount
  const reviewChangePercent =
    previous.reviewCount > 0
      ? ((reviewChange / previous.reviewCount) * 100).toFixed(1)
      : '0.0'

  const ratingChange = (latest.avgRating - previous.avgRating).toFixed(2)

  return {
    reviewChange: `${reviewChange >= 0 ? '+' : ''}${reviewChange} reviews (${reviewChangePercent}%)`,
    ratingChange: `${ratingChange >= 0 ? '+' : ''}${ratingChange} stars`,
  }
}

// Color utilities
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
      fontFamily: 'Helvetica-Bold',
      color: 'white',
      textAlign: 'center',
    },
    metricsGrid: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 15,
      marginBottom: 25,
    },
    metricCard: {
      backgroundColor: '#F8FAFC',
      border: '1px solid #E2E8F0',
      borderRadius: 8,
      padding: 15,
      flex: '1 1 45%',
      minWidth: 200,
    },
    metricLabel: {
      fontSize: 10,
      color: '#64748B',
      marginBottom: 5,
      fontFamily: 'Helvetica-Bold',
    },
    metricValue: {
      fontSize: 24,
      fontFamily: 'Helvetica-Bold',
      color: '#1E293B',
      marginBottom: 5,
    },
    metricChange: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
    },
    metricChangePositive: {
      color: '#059669',
    },
    metricChangeNegative: {
      color: '#DC2626',
    },
    summarySection: {
      backgroundColor: '#FEFEFE',
      border: '1px solid #E5E7EB',
      borderRadius: 8,
      padding: 20,
      marginBottom: 25,
    },
    summaryTitle: {
      fontSize: 16,
      fontFamily: 'Helvetica-Bold',
      color: '#1F2937',
      marginBottom: 12,
    },
    summaryText: {
      fontSize: 11,
      color: '#4B5563',
      lineHeight: 1.6,
      marginBottom: 10,
    },
    highlightsSection: {
      marginTop: 20,
    },
    highlightsTitle: {
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      color: '#1F2937',
      marginBottom: 10,
    },
    highlightItem: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    highlightBullet: {
      width: 6,
      height: 6,
      backgroundColor: hexToRgb(brandingColor),
      borderRadius: 3,
      marginRight: 10,
      marginTop: 4,
    },
    highlightText: {
      fontSize: 10,
      color: '#374151',
      lineHeight: 1.5,
      flex: 1,
    },
    ratingSection: {
      backgroundColor: '#F9FAFB',
      border: '1px solid #D1D5DB',
      borderRadius: 8,
      padding: 15,
    },
    ratingSectionTitle: {
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      color: '#1F2937',
      marginBottom: 15,
    },
    ratingBar: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    ratingLabel: {
      fontSize: 10,
      color: '#6B7280',
      width: 60,
    },
    ratingBarContainer: {
      flex: 1,
      height: 8,
      backgroundColor: '#E5E7EB',
      borderRadius: 4,
      marginHorizontal: 10,
      position: 'relative',
    },
    ratingBarFill: {
      height: 8,
      borderRadius: 4,
      position: 'absolute',
      top: 0,
      left: 0,
    },
    ratingValue: {
      fontSize: 10,
      color: '#374151',
      width: 60,
      textAlign: 'right',
    },
    pageNumber: {
      position: 'absolute',
      bottom: 20,
      right: 30,
      fontSize: 10,
      color: '#9CA3AF',
    },
  })

interface PDFExecutiveSummaryProps {
  data: EnhancedAnalysis
  options: ExportOptions
}

export const PDFExecutiveSummary: React.FC<PDFExecutiveSummaryProps> = ({
  data,
  options,
}) => {
  const styles = createStyles(options.brandingColor || '#3B82F6')

  // Calculate key metrics from real data
  const totalReviews =
    (data as any).totalReviews ||
    data.reviewClusters?.reduce(
      (sum, cluster) => sum + (cluster.count || 0),
      0,
    ) ||
    0
  const avgRating =
    (data as any).avgRating || data.historicalTrends?.[0]?.avgRating || 0
  const topCluster =
    data.reviewClusters?.sort((a, b) => (b.count || 0) - (a.count || 0))[0]
      ?.name || 'No theme data'
  const totalInsights = Array.isArray(data.insights) ? data.insights.length : 0

  // Use real rating distribution from transformed data or calculate from clusters
  const ratingDistribution =
    (data as any).ratingDistribution ||
    calculateFallbackRatingDistribution(data.reviewClusters || [], totalReviews)

  // Calculate real period comparison if historical data is available
  const periodComparison = calculatePeriodComparison(
    data.historicalTrends || [],
  )

  const highlights = [
    totalReviews > 0
      ? `Analyzed ${totalReviews.toLocaleString()} customer reviews with ${avgRating.toFixed(1)}-star average rating`
      : 'No review data available for analysis',
    data.reviewClusters && data.reviewClusters.length > 0
      ? `Identified ${data.reviewClusters.length} distinct customer experience themes`
      : 'No customer themes identified',
    data.temporalPatterns?.dayOfWeek?.length > 0
      ? `Temporal analysis reveals review patterns across ${data.temporalPatterns.dayOfWeek.length} time periods`
      : 'Limited temporal data available',
    totalInsights > 0
      ? `Generated ${totalInsights} actionable insights for strategic improvement`
      : 'No specific insights generated',
  ]

  return (
    <View style={styles.container}>
      {/* Page Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Executive Summary</Text>
      </View>

      {/* Key Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Reviews</Text>
          <Text style={styles.metricValue}>
            {totalReviews.toLocaleString()}
          </Text>
          <Text style={styles.metricChange}>
            {periodComparison.reviewChange}
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Average Rating</Text>
          <Text style={styles.metricValue}>
            {avgRating > 0 ? `${avgRating.toFixed(1)} ⭐` : 'No data'}
          </Text>
          <Text style={styles.metricChange}>
            {periodComparison.ratingChange}
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Top Category</Text>
          <Text style={styles.metricValue}>{topCluster}</Text>
          <Text style={styles.metricChange}>Most mentioned theme</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Insights Generated</Text>
          <Text style={styles.metricValue}>{totalInsights}</Text>
          <Text style={styles.metricChange}>AI-powered analysis</Text>
        </View>
      </View>

      {/* Summary Section */}
      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Executive Overview</Text>
        <Text style={styles.summaryText}>
          This comprehensive analysis covers {totalReviews.toLocaleString()}{' '}
          customer reviews for {options.businessName}. The business maintains an
          average rating of {avgRating.toFixed(1)} stars, with customers
          particularly appreciating aspects related to {topCluster}. This report
          provides detailed insights into customer sentiment, temporal patterns,
          and actionable recommendations for business improvement.
        </Text>

        <Text style={styles.summaryText}>
          The analysis period spans from{' '}
          {options.dateRange
            ? new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }).format(options.dateRange.start)
            : 'the beginning of available data'}{' '}
          to{' '}
          {options.dateRange
            ? new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }).format(options.dateRange.end)
            : 'the most recent data'}
          , providing a comprehensive view of customer feedback trends and
          patterns.
        </Text>

        {/* Key Highlights */}
        <View style={styles.highlightsSection}>
          <Text style={styles.highlightsTitle}>Key Highlights</Text>
          {highlights.map((highlight, index) => (
            <View key={index} style={styles.highlightItem}>
              <View style={styles.highlightBullet} />
              <Text style={styles.highlightText}>{highlight}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Rating Distribution */}
      <View style={styles.ratingSection}>
        <Text style={styles.ratingSectionTitle}>Rating Distribution</Text>
        {ratingDistribution.map((rating: any) => (
          <View key={rating.rating} style={styles.ratingBar}>
            <Text style={styles.ratingLabel}>{rating.rating} ⭐</Text>
            <View style={styles.ratingBarContainer}>
              <View
                style={[
                  styles.ratingBarFill,
                  {
                    backgroundColor: rating.color,
                    width: `${Math.max(rating.percentage || 0, 0)}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.ratingValue}>
              {rating.count || 0} ({(rating.percentage || 0).toFixed(1)}%)
            </Text>
          </View>
        ))}
      </View>

      {/* Page Number */}
      <Text style={styles.pageNumber}>Page 2</Text>
    </View>
  )
}

export default PDFExecutiveSummary
