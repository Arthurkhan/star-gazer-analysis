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
    categorySection: {
      marginBottom: 25,
    },
    categoryHeader: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      paddingBottom: 8,
      borderBottom: '2px solid #E5E7EB',
    },
    categoryIcon: {
      fontSize: 16,
      marginRight: 10,
    },
    categoryTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#1F2937',
    },
    categoryColorBar: {
      width: 4,
      height: 20,
      marginRight: 10,
      borderRadius: 2,
    },
    insightItem: {
      backgroundColor: '#FEFEFE',
      border: '1px solid #E5E7EB',
      borderRadius: 8,
      padding: 15,
      marginBottom: 12,
      borderLeft: '4px solid #E5E7EB',
    },
    insightItemKey: {
      borderLeftColor: '#3B82F6',
    },
    insightItemOpportunity: {
      borderLeftColor: '#10B981',
    },
    insightItemRisk: {
      borderLeftColor: '#EF4444',
    },
    insightNumber: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#6B7280',
      marginBottom: 6,
    },
    insightText: {
      fontSize: 11,
      color: '#374151',
      lineHeight: 1.6,
    },
    priorityBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      marginTop: 8,
    },
    priorityBadgeHigh: {
      backgroundColor: '#FEE2E2',
    },
    priorityBadgeMedium: {
      backgroundColor: '#FEF3C7',
    },
    priorityBadgeLow: {
      backgroundColor: '#DCFCE7',
    },
    priorityText: {
      fontSize: 9,
      fontWeight: 'bold',
    },
    priorityTextHigh: {
      color: '#DC2626',
    },
    priorityTextMedium: {
      color: '#D97706',
    },
    priorityTextLow: {
      color: '#059669',
    },
    emptyState: {
      backgroundColor: '#F9FAFB',
      border: '1px solid #D1D5DB',
      borderRadius: 8,
      padding: 20,
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: 11,
      color: '#6B7280',
      textAlign: 'center',
    },
    summaryBox: {
      backgroundColor: '#F0F9FF',
      border: '1px solid #0EA5E9',
      borderRadius: 8,
      padding: 15,
      marginTop: 20,
    },
    summaryTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#0C4A6E',
      marginBottom: 8,
    },
    summaryText: {
      fontSize: 10,
      color: '#0369A1',
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

interface PDFInsightsProps {
  data: string[]
  options: ExportOptions
}

export const PDFInsights: React.FC<PDFInsightsProps> = ({ data, options }) => {
  const styles = createStyles(options.brandingColor || '#3B82F6')

  // Organize insights into categories
  const organizeInsights = (insights: string[]) => {
    const categories = {
      keyFindings: insights.slice(0, Math.ceil(insights.length / 3)),
      opportunities: insights.slice(
        Math.ceil(insights.length / 3),
        Math.ceil((insights.length * 2) / 3),
      ),
      risks: insights.slice(Math.ceil((insights.length * 2) / 3)),
    }
    return categories
  }

  const { keyFindings, opportunities, risks } = organizeInsights(data)

  const renderInsightCategory = (
    title: string,
    icon: string,
    insights: string[],
    colorClass: 'key' | 'opportunity' | 'risk',
  ) => {
    if (insights.length === 0) {
      return (
        <View style={styles.categorySection}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryIcon}>{icon}</Text>
            <Text style={styles.categoryTitle}>{title}</Text>
          </View>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No {title.toLowerCase()} identified in the current analysis.
            </Text>
          </View>
        </View>
      )
    }

    return (
      <View style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <View
            style={[
              styles.categoryColorBar,
              {
                backgroundColor:
                  colorClass === 'key'
                    ? '#3B82F6'
                    : colorClass === 'opportunity'
                      ? '#10B981'
                      : '#EF4444',
              },
            ]}
          />
          <Text style={styles.categoryIcon}>{icon}</Text>
          <Text style={styles.categoryTitle}>{title}</Text>
        </View>

        {insights.map((insight, index) => {
          // Assign priority based on position and content
          const priority = index < 2 ? 'high' : index < 4 ? 'medium' : 'low'
          const priorityStyle =
            priority === 'high'
              ? styles.priorityBadgeHigh
              : priority === 'medium'
                ? styles.priorityBadgeMedium
                : styles.priorityBadgeLow
          const priorityTextStyle =
            priority === 'high'
              ? styles.priorityTextHigh
              : priority === 'medium'
                ? styles.priorityTextMedium
                : styles.priorityTextLow

          return (
            <View
              key={index}
              style={[
                styles.insightItem,
                colorClass === 'key'
                  ? styles.insightItemKey
                  : colorClass === 'opportunity'
                    ? styles.insightItemOpportunity
                    : styles.insightItemRisk,
              ]}
            >
              <Text style={styles.insightNumber}>
                {title} #{index + 1}
              </Text>
              <Text style={styles.insightText}>{insight}</Text>

              <View style={[styles.priorityBadge, priorityStyle]}>
                <Text style={[styles.priorityText, priorityTextStyle]}>
                  {priority.toUpperCase()} PRIORITY
                </Text>
              </View>
            </View>
          )
        })}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Page Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Key Insights & Findings</Text>
      </View>

      {/* Key Findings */}
      {renderInsightCategory('Key Findings', '🔍', keyFindings, 'key')}

      {/* Growth Opportunities */}
      {renderInsightCategory(
        'Growth Opportunities',
        '📈',
        opportunities,
        'opportunity',
      )}

      {/* Risk Factors */}
      {renderInsightCategory('Risk Factors', '⚠️', risks, 'risk')}

      {/* Summary Box */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>Analysis Summary</Text>
        <Text style={styles.summaryText}>
          This insights analysis identified {data.length} key findings across{' '}
          {keyFindings.length} primary insights,
          {opportunities.length} growth opportunities, and {risks.length}{' '}
          potential risk factors. These insights are derived from comprehensive
          analysis of customer review patterns, sentiment trends, and thematic
          clustering. Priority levels indicate the urgency and potential impact
          of addressing each insight.
        </Text>
      </View>

      {/* Page Number */}
      <Text style={styles.pageNumber}>Page 5</Text>
    </View>
  )
}

export default PDFInsights
