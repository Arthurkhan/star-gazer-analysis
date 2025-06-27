/**
 * DETAILED ANALYSIS DISPLAY WITH TABS AND CHARTS
 * 
 * This component provides a comprehensive analysis display with multiple tabs:
 * - Executive Summary (Key Insights)
 * - Temporal Patterns (Day/Time analysis)
 * - Historical Trends (Performance over time)
 * - Review Clusters (Thematic grouping)
 * - Seasonal Analysis (Seasonal patterns)
 * 
 * Features:
 * - Tabbed interface for organized data presentation
 * - Interactive charts using Recharts
 * - Info tooltips for user guidance
 * - Responsive design
 * - Dark mode support
 * - Optional full view mode (vertical layout without tabs)
 * 
 * Dependencies:
 * - @/components/ui/card
 * - @/components/ui/tabs
 * - @/components/ui/badge
 * - @/components/ui/tooltip
 * - @/components/ui/separator
 * - recharts
 * - lucide-react
 * 
 * Required Types:
 * ```typescript
 * interface EnhancedAnalysisDisplayProps {
 *   temporalPatterns: {
 *     dayOfWeek: { day: string; count: number }[];
 *     timeOfDay: { time: string; count: number }[];
 *   };
 *   historicalTrends: {
 *     period: string;
 *     avgRating: number;
 *     reviewCount: number;
 *   }[];
 *   reviewClusters: {
 *     name: string;
 *     keywords: string[];
 *     count: number;
 *     sentiment: string;
 *   }[];
 *   seasonalAnalysis: {
 *     season: string;
 *     count: number;
 *     avgRating: number;
 *   }[];
 *   insights: string[];
 *   loading?: boolean;
 *   fullView?: boolean;
 * }
 * ```
 * 
 * Usage Example:
 * ```tsx
 * <EnhancedAnalysisDisplay
 *   temporalPatterns={temporalData}
 *   historicalTrends={trendData}
 *   reviewClusters={clusterData}
 *   seasonalAnalysis={seasonalData}
 *   insights={aiInsights}
 *   loading={false}
 *   fullView={false} // Set to true for vertical layout
 * />
 * ```
 * 
 * Customization:
 * - Modify COLORS array to change chart color scheme
 * - Adjust chart dimensions in ResponsiveContainer
 * - Customize tab labels and order
 * - Add/remove sections as needed
 * - Modify tooltip content for better user guidance
 */

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { BarChart, LineChart, PieChart, Calendar, Lightbulb, Info } from 'lucide-react'
import {
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts'

// Custom tooltip component for charts
const CustomBarLineTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border rounded shadow-lg">
        <p className="font-semibold">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border rounded shadow-lg">
        <p className="font-semibold">{payload[0].name}</p>
        <p>Count: {payload[0].value}</p>
        <p>Percentage: {(payload[0].percent * 100).toFixed(1)}%</p>
      </div>
    )
  }
  return null
}

// Helper component for info tooltips
const InfoTooltip: React.FC<{ content: string }> = ({ content }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="text-sm">{content}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)

export function EnhancedAnalysisDisplay({
  temporalPatterns,
  historicalTrends,
  reviewClusters,
  seasonalAnalysis,
  insights,
  loading = false,
  fullView = false,
}: EnhancedAnalysisDisplayProps) {
  // Custom colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Component sections (implementation details shown in full component)
  const InsightsSection = () => (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Lightbulb className="w-5 h-5 mr-2" />
            Executive Summary
          </CardTitle>
          <InfoTooltip content="AI-generated insights that highlight key patterns and trends in your review data." />
        </div>
        <CardDescription>AI-generated insights based on review data analysis</CardDescription>
      </CardHeader>
      <CardContent>
        {insights && insights.length > 0 ? (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="p-4 border rounded-md bg-muted/20">
                <p>{insight}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No insights available. Generate more reviews to enable AI insights.
          </p>
        )}
      </CardContent>
    </Card>
  )

  // If fullView is enabled, render all sections vertically
  if (fullView) {
    return (
      <div className="space-y-8 w-full">
        <InsightsSection />
        {/* Add other sections here in vertical layout */}
      </div>
    )
  }

  // Default tabbed view
  return (
    <div className="space-y-6">
      <Tabs defaultValue="insights">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="insights">Key Insights</TabsTrigger>
          <TabsTrigger value="temporal">Temporal Patterns</TabsTrigger>
          <TabsTrigger value="trends">Historical Trends</TabsTrigger>
          <TabsTrigger value="clusters">Review Clusters</TabsTrigger>
          <TabsTrigger value="seasonal">Seasonal Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="mt-6">
          <InsightsSection />
        </TabsContent>

        {/* Add other tab contents here */}
      </Tabs>
    </div>
  )
}