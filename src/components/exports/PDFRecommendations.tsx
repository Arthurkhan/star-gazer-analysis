import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { EnhancedAnalysis } from '@/types/dataAnalysis'
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
    prioritySection: {
      marginBottom: 20,
    },
    priorityHeader: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      borderRadius: 8,
      marginBottom: 12,
    },
    priorityHeaderUrgent: {
      backgroundColor: '#FEE2E2',
    },
    priorityHeaderHigh: {
      backgroundColor: '#FEF3C7',
    },
    priorityHeaderMedium: {
      backgroundColor: '#DBEAFE',
    },
    priorityHeaderLongTerm: {
      backgroundColor: '#DCFCE7',
    },
    priorityIcon: {
      fontSize: 14,
      marginRight: 8,
    },
    priorityTitle: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    priorityTitleUrgent: {
      color: '#991B1B',
    },
    priorityTitleHigh: {
      color: '#92400E',
    },
    priorityTitleMedium: {
      color: '#1E40AF',
    },
    priorityTitleLongTerm: {
      color: '#166534',
    },
    recommendationItem: {
      backgroundColor: '#FEFEFE',
      border: '1px solid #E5E7EB',
      borderRadius: 8,
      padding: 15,
      marginBottom: 10,
    },
    recommendationTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#1F2937',
      marginBottom: 6,
    },
    recommendationDescription: {
      fontSize: 10,
      color: '#6B7280',
      lineHeight: 1.5,
      marginBottom: 8,
    },
    recommendationMeta: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    implementationTime: {
      fontSize: 9,
      color: '#9CA3AF',
    },
    impactLevel: {
      fontSize: 9,
      fontWeight: 'bold',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    impactHigh: {
      backgroundColor: '#DCFCE7',
      color: '#166534',
    },
    impactMedium: {
      backgroundColor: '#FEF3C7',
      color: '#92400E',
    },
    impactLow: {
      backgroundColor: '#F3F4F6',
      color: '#6B7280',
    },
    summarySection: {
      backgroundColor: '#F8FAFC',
      border: '1px solid #E2E8F0',
      borderRadius: 8,
      padding: 15,
      marginTop: 20,
    },
    summaryTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#1E293B',
      marginBottom: 8,
    },
    summaryText: {
      fontSize: 10,
      color: '#475569',
      lineHeight: 1.5,
    },
    pageNumber: {
      position: 'absolute',
      bottom: 20,
      right: 30,
      fontSize: 10,
      color: '#9CA3AF',
    },
  })

interface PDFRecommendationsProps {
  data: EnhancedAnalysis
  options: ExportOptions
}

export const PDFRecommendations: React.FC<PDFRecommendationsProps> = ({
  data,
  options,
}) => {
  const styles = createStyles(options.brandingColor || '#3B82F6')

  // Generate recommendations based on data analysis
  const generateRecommendations = () => {
    const avgRating = data.historicalTrends?.[0]?.avgRating || 0
    const totalReviews =
      data.reviewClusters?.reduce(
        (sum, cluster) => sum + (cluster.count || 0),
        0,
      ) || 0
    const topCluster = data.reviewClusters?.sort(
      (a, b) => (b.count || 0) - (a.count || 0),
    )[0]

    const recommendations = {
      urgent: [] as any[],
      high: [] as any[],
      medium: [] as any[],
      longTerm: [] as any[],
    }

    // Generate data-driven recommendations
    if (avgRating < 3.5) {
      recommendations.urgent.push({
        title: 'Address Customer Satisfaction Issues',
        description:
          'With an average rating below 3.5, immediate action is needed to identify and resolve customer pain points. Focus on the most frequently mentioned negative aspects.',
        implementation: '1-2 weeks',
        impact: 'high',
      })
    }

    if (totalReviews < 50) {
      recommendations.high.push({
        title: 'Implement Review Generation Campaign',
        description:
          'Low review volume limits visibility and credibility. Launch targeted campaigns to encourage satisfied customers to share their experiences online.',
        implementation: '2-4 weeks',
        impact: 'high',
      })
    }

    // Business-type specific recommendations
    if (options.businessType === 'CAFE') {
      recommendations.medium.push({
        title: 'Enhance Coffee Program',
        description:
          'Consider introducing specialty coffee options, barista training, and seasonal menu items to differentiate from competitors and improve customer experience.',
        implementation: '1-2 months',
        impact: 'medium',
      })
      recommendations.longTerm.push({
        title: 'Develop Customer Loyalty Program',
        description:
          'Create a mobile-based loyalty program with rewards for frequent visits, referrals, and social media engagement to increase customer retention.',
        implementation: '3-6 months',
        impact: 'high',
      })
    } else if (options.businessType === 'BAR') {
      recommendations.medium.push({
        title: 'Expand Cocktail Menu & Experiences',
        description:
          'Introduce seasonal cocktails, craft beer selections, and themed drink experiences to appeal to a broader customer base and increase average spend.',
        implementation: '1-2 months',
        impact: 'medium',
      })
      recommendations.longTerm.push({
        title: 'Host Regular Events & Entertainment',
        description:
          'Organize weekly themed nights, live music, trivia events, or mixology classes to create a vibrant atmosphere and attract new customers.',
        implementation: '2-4 months',
        impact: 'high',
      })
    } else if (options.businessType === 'GALLERY') {
      recommendations.medium.push({
        title: 'Enhance Digital Presence',
        description:
          'Improve virtual gallery tours, social media engagement, and online art sales platform to reach art enthusiasts beyond local visitors.',
        implementation: '1-3 months',
        impact: 'medium',
      })
      recommendations.longTerm.push({
        title: 'Develop Educational Programs',
        description:
          'Create art workshops, artist talks, and educational programs to build community engagement and generate additional revenue streams.',
        implementation: '3-6 months',
        impact: 'high',
      })
    }

    // Data-driven recommendations based on clusters
    if (topCluster && topCluster.sentiment === 'negative') {
      recommendations.urgent.push({
        title: `Address Issues in ${topCluster.name}`,
        description:
          'This category has the most reviews but negative sentiment. Immediate improvements needed to address customer concerns in this area.',
        implementation: '1-2 weeks',
        impact: 'high',
      })
    }

    // Add general recommendations if none exist
    if (recommendations.urgent.length === 0) {
      recommendations.urgent.push({
        title: 'Monitor Review Sentiment Trends',
        description:
          'Establish a systematic approach to monitor and respond to customer feedback trends. Set up alerts for significant changes in sentiment.',
        implementation: '1 week',
        impact: 'medium',
      })
    }

    if (recommendations.high.length === 0) {
      recommendations.high.push({
        title: 'Improve Customer Service Training',
        description:
          'Invest in comprehensive customer service training to ensure consistent, high-quality interactions that lead to positive reviews.',
        implementation: '2-4 weeks',
        impact: 'high',
      })
    }

    if (recommendations.medium.length === 0) {
      recommendations.medium.push({
        title: 'Optimize Operational Efficiency',
        description:
          'Review and optimize operational processes to reduce wait times, improve service quality, and enhance overall customer experience.',
        implementation: '1-2 months',
        impact: 'medium',
      })
    }

    if (recommendations.longTerm.length === 0) {
      recommendations.longTerm.push({
        title: 'Develop Strategic Growth Plan',
        description:
          'Create a comprehensive growth strategy based on customer feedback insights, including expansion opportunities and service enhancements.',
        implementation: '3-6 months',
        impact: 'high',
      })
    }

    return recommendations
  }

  const recommendations = generateRecommendations()

  const renderPrioritySection = (
    title: string,
    icon: string,
    items: any[],
    priorityType: 'urgent' | 'high' | 'medium' | 'longTerm',
  ) => {
    if (items.length === 0) return null

    const headerStyle =
      priorityType === 'urgent'
        ? styles.priorityHeaderUrgent
        : priorityType === 'high'
          ? styles.priorityHeaderHigh
          : priorityType === 'medium'
            ? styles.priorityHeaderMedium
            : styles.priorityHeaderLongTerm

    const titleStyle =
      priorityType === 'urgent'
        ? styles.priorityTitleUrgent
        : priorityType === 'high'
          ? styles.priorityTitleHigh
          : priorityType === 'medium'
            ? styles.priorityTitleMedium
            : styles.priorityTitleLongTerm

    return (
      <View style={styles.prioritySection}>
        <View style={[styles.priorityHeader, headerStyle]}>
          <Text style={styles.priorityIcon}>{icon}</Text>
          <Text style={[styles.priorityTitle, titleStyle]}>{title}</Text>
        </View>

        {items.map((item, index) => {
          const impactStyle =
            item.impact === 'high'
              ? styles.impactHigh
              : item.impact === 'medium'
                ? styles.impactMedium
                : styles.impactLow

          return (
            <View key={index} style={styles.recommendationItem}>
              <Text style={styles.recommendationTitle}>• {item.title}</Text>
              <Text style={styles.recommendationDescription}>
                {item.description}
              </Text>
              <View style={styles.recommendationMeta}>
                <Text style={styles.implementationTime}>
                  Implementation: {item.implementation}
                </Text>
                <Text style={[styles.impactLevel, impactStyle]}>
                  {item.impact.toUpperCase()} IMPACT
                </Text>
              </View>
            </View>
          )
        })}
      </View>
    )
  }

  const totalRecommendations = Object.values(recommendations).reduce(
    (sum, arr) => sum + arr.length,
    0,
  )

  return (
    <View style={styles.container}>
      {/* Page Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Strategic Recommendations</Text>
      </View>

      {/* Priority Sections */}
      {renderPrioritySection(
        'URGENT ACTIONS',
        '🚨',
        recommendations.urgent,
        'urgent',
      )}
      {renderPrioritySection(
        'HIGH PRIORITY',
        '⚡',
        recommendations.high,
        'high',
      )}
      {renderPrioritySection(
        'MEDIUM PRIORITY',
        '📋',
        recommendations.medium,
        'medium',
      )}
      {renderPrioritySection(
        'LONG TERM STRATEGY',
        '🎯',
        recommendations.longTerm,
        'longTerm',
      )}

      {/* Summary Section */}
      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Implementation Roadmap</Text>
        <Text style={styles.summaryText}>
          This strategic recommendation framework includes{' '}
          {totalRecommendations} actionable items prioritized by urgency and
          potential impact. Begin with urgent actions to address immediate
          concerns, then progress through high and medium priority items.
          Long-term strategies should be planned and executed over the next 3-6
          months to ensure sustainable business growth and improved customer
          satisfaction.
        </Text>
      </View>

      {/* Page Number */}
      <Text style={styles.pageNumber}>Page 6</Text>
    </View>
  )
}

export default PDFRecommendations
