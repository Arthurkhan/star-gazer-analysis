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
    section: {
      marginBottom: 25,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#1F2937',
      marginBottom: 15,
    },
    table: {
      border: '1px solid #D1D5DB',
      borderRadius: 8,
      overflow: 'hidden',
    },
    tableHeader: {
      backgroundColor: '#F3F4F6',
      display: 'flex',
      flexDirection: 'row',
      padding: 12,
    },
    tableRow: {
      display: 'flex',
      flexDirection: 'row',
      padding: 10,
      borderTop: '1px solid #E5E7EB',
    },
    tableCell: {
      flex: 1,
      fontSize: 10,
      color: '#374151',
    },
    tableCellHeader: {
      flex: 1,
      fontSize: 11,
      fontWeight: 'bold',
      color: '#1F2937',
    },
    chartContainer: {
      backgroundColor: '#F9FAFB',
      border: '1px solid #D1D5DB',
      borderRadius: 8,
      padding: 15,
      marginTop: 15,
    },
    barChart: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    },
    barRow: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    },
    barLabel: {
      fontSize: 10,
      color: '#6B7280',
      width: 80,
    },
    barContainer: {
      flex: 1,
      height: 12,
      backgroundColor: '#E5E7EB',
      borderRadius: 6,
      marginHorizontal: 10,
      position: 'relative',
    },
    barFill: {
      height: 12,
      backgroundColor: hexToRgb(brandingColor),
      borderRadius: 6,
      position: 'absolute',
      top: 0,
      left: 0,
    },
    barValue: {
      fontSize: 10,
      color: '#374151',
      width: 40,
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

interface PDFTemporalAnalysisProps {
  data: any
  options: ExportOptions
}

export const PDFTemporalAnalysis: React.FC<PDFTemporalAnalysisProps> = ({
  data,
  options,
}) => {
  const styles = createStyles(options.brandingColor || '#3B82F6')

  const dayOfWeekData = data.dayOfWeek || []
  const timeOfDayData = data.timeOfDay || []

  // Calculate percentages and max values for visualization
  const totalDayReviews = dayOfWeekData.reduce(
    (sum: number, day: any) => sum + (day.count || 0),
    0,
  )
  const totalTimeReviews = timeOfDayData.reduce(
    (sum: number, time: any) => sum + (time.count || 0),
    0,
  )
  const maxDayCount = Math.max(
    ...dayOfWeekData.map((day: any) => day.count || 0),
  )
  const maxTimeCount = Math.max(
    ...timeOfDayData.map((time: any) => time.count || 0),
  )

  return (
    <View style={styles.container}>
      {/* Page Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Temporal Analysis</Text>
      </View>

      {/* Day of Week Analysis */}
      {dayOfWeekData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Review Distribution by Day of Week
          </Text>

          {/* Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCellHeader}>Day</Text>
              <Text style={styles.tableCellHeader}>Reviews</Text>
              <Text style={styles.tableCellHeader}>Percentage</Text>
              <Text style={styles.tableCellHeader}>Trend</Text>
            </View>

            {dayOfWeekData.map((day: any, index: number) => {
              const percentage =
                totalDayReviews > 0
                  ? (((day.count || 0) / totalDayReviews) * 100).toFixed(1)
                  : '0.0'
              const isMax = (day.count || 0) === maxDayCount
              const isAboveAverage =
                (day.count || 0) > totalDayReviews / dayOfWeekData.length
              const trend = isMax
                ? '📈 Peak'
                : isAboveAverage
                  ? '📊 Above Avg'
                  : '📉 Below Avg'

              return (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{day.day}</Text>
                  <Text style={styles.tableCell}>{day.count || 0}</Text>
                  <Text style={styles.tableCell}>{percentage}%</Text>
                  <Text style={styles.tableCell}>{trend}</Text>
                </View>
              )
            })}
          </View>

          {/* Visual Chart */}
          <View style={styles.chartContainer}>
            <View style={styles.barChart}>
              {dayOfWeekData.map((day: any, index: number) => {
                const percentage =
                  maxDayCount > 0 ? ((day.count || 0) / maxDayCount) * 100 : 0
                return (
                  <View key={index} style={styles.barRow}>
                    <Text style={styles.barLabel}>{day.day}</Text>
                    <View style={styles.barContainer}>
                      <View
                        style={[styles.barFill, { width: `${percentage}%` }]}
                      />
                    </View>
                    <Text style={styles.barValue}>{day.count || 0}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        </View>
      )}

      {/* Time of Day Analysis */}
      {timeOfDayData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Review Distribution by Time of Day
          </Text>

          {/* Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCellHeader}>Time Period</Text>
              <Text style={styles.tableCellHeader}>Reviews</Text>
              <Text style={styles.tableCellHeader}>Percentage</Text>
            </View>

            {timeOfDayData.map((time: any, index: number) => {
              const percentage =
                totalTimeReviews > 0
                  ? (((time.count || 0) / totalTimeReviews) * 100).toFixed(1)
                  : '0.0'

              return (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{time.time}</Text>
                  <Text style={styles.tableCell}>{time.count || 0}</Text>
                  <Text style={styles.tableCell}>{percentage}%</Text>
                </View>
              )
            })}
          </View>

          {/* Visual Chart */}
          <View style={styles.chartContainer}>
            <View style={styles.barChart}>
              {timeOfDayData.map((time: any, index: number) => {
                const percentage =
                  maxTimeCount > 0
                    ? ((time.count || 0) / maxTimeCount) * 100
                    : 0
                return (
                  <View key={index} style={styles.barRow}>
                    <Text style={styles.barLabel}>{time.time}</Text>
                    <View style={styles.barContainer}>
                      <View
                        style={[styles.barFill, { width: `${percentage}%` }]}
                      />
                    </View>
                    <Text style={styles.barValue}>{time.count || 0}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        </View>
      )}

      {/* Page Number */}
      <Text style={styles.pageNumber}>Page 3</Text>
    </View>
  )
}

export default PDFTemporalAnalysis
