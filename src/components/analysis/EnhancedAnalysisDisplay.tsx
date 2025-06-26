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
import { CustomBarLineTooltip, CustomPieTooltip } from '@/components/review-analysis/CustomTooltips'

// Define the props interface based on the enhancedAnalysis structure
interface EnhancedAnalysisDisplayProps {
  temporalPatterns: {
    dayOfWeek: { day: string; count: number }[];
    timeOfDay: { time: string; count: number }[];
  };
  historicalTrends: {
    period: string;
    avgRating: number;
    reviewCount: number;
  }[];
  reviewClusters: {
    name: string;
    keywords: string[];
    count: number;
    sentiment: string;
  }[];
  seasonalAnalysis: {
    season: string;
    count: number;
    avgRating: number;
  }[];
  insights: string[];
  loading?: boolean;
  fullView?: boolean; // New prop to enable vertical full-width layout
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

  // Component for Key Insights section
  const InsightsSection = () => (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Lightbulb className="w-5 h-5 mr-2" />
            Executive Summary
          </CardTitle>
          <InfoTooltip content="AI-generated insights that highlight key patterns and trends in your review data. These insights help you quickly understand what customers are saying and identify areas for improvement." />
        </div>
        <CardDescription>
          AI-generated insights based on review data analysis
        </CardDescription>
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

  // Component for Performance Metrics (Historical Trends)
  const PerformanceSection = () => (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <LineChart className="w-5 h-5 mr-2" />
            Performance Metrics
          </CardTitle>
          <InfoTooltip content="Shows how your business performance changes over time. The left axis shows review volume (engagement), while the right axis shows average ratings (satisfaction). Look for correlations between volume and ratings." />
        </div>
        <CardDescription>
          Changes in ratings and review volume over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart
              data={historicalTrends}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis yAxisId="left" label={{ value: 'Review Count', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 5]} label={{ value: 'Average Rating', angle: 90, position: 'insideRight' }} />
              <RechartsTooltip content={<CustomBarLineTooltip />} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="reviewCount"
                name="Review Count"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avgRating"
                name="Average Rating"
                stroke="#82ca9d"
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )

  // Component for Sentiment Analysis (Temporal Patterns)
  const SentimentSection = () => (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Temporal Patterns
          </CardTitle>
          <InfoTooltip content="Analyzes when customers leave reviews. Day patterns help with staffing decisions, while time patterns show when customers are most engaged. Higher review counts often indicate busier periods." />
        </div>
        <CardDescription>
          Distribution of reviews across time periods
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Day of Week Chart */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium">Reviews by Day of Week</h4>
              <InfoTooltip content="Shows which days customers are most likely to leave reviews. This often correlates with your busiest days and can help identify weekly patterns in customer behavior." />
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={temporalPatterns.dayOfWeek}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <RechartsTooltip content={<CustomBarLineTooltip />} />
                  <Legend />
                  <Bar dataKey="count" name="Reviews" fill="#8884d8" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Time of Day Chart */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium">Reviews by Time of Day</h4>
              <InfoTooltip content="Shows when during the day customers post reviews. Evening spikes often indicate when customers reflect on their experience. This can help optimize response times and service hours." />
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={temporalPatterns.timeOfDay}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <RechartsTooltip content={<CustomBarLineTooltip />} />
                  <Legend />
                  <Bar dataKey="count" name="Reviews" fill="#00C49F" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Component for Thematic Analysis (Review Clusters)
  const ThematicSection = () => (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <PieChart className="w-5 h-5 mr-2" />
            Thematic Analysis
          </CardTitle>
          <InfoTooltip content="AI-powered analysis that groups reviews by common themes. Shows what aspects of your business customers talk about most. Keywords are extracted from actual review text to give context to each theme." />
        </div>
        <CardDescription>
          Common themes and their associated keywords
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Clusters Chart */}
          <div className="lg:col-span-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium">Topic Distribution</h4>
              <InfoTooltip content="Visual breakdown of review themes by percentage. Larger slices indicate topics mentioned more frequently. Use this to understand what matters most to your customers." />
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={reviewClusters}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {reviewClusters.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomPieTooltip />} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Clusters Details */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium">Theme Details</h4>
              <InfoTooltip content="Detailed breakdown of each theme showing sentiment (positive/negative/neutral) and related keywords. Keywords help understand what specific aspects customers mention within each theme." />
            </div>
            <div className="space-y-6">
              {reviewClusters.map((cluster, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">{cluster.name}</h3>
                    <Badge variant={
                      cluster.sentiment === 'positive' ? 'default' :
                      cluster.sentiment === 'negative' ? 'destructive' :
                      'secondary'
                    }>
                      {cluster.sentiment}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Mentioned in {cluster.count} reviews
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {cluster.keywords.map((keyword, idx) => (
                      <Badge key={idx} variant="outline">{keyword}</Badge>
                    ))}
                  </div>
                  {index < reviewClusters.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}

              {reviewClusters.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No review clusters detected. Try analyzing more reviews.
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Component for Operational Insights (Seasonal Analysis)
  const OperationalSection = () => (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <BarChart className="w-5 h-5 mr-2" />
            Operational Insights
          </CardTitle>
          <InfoTooltip content="Seasonal patterns help identify trends throughout the year. Use this to plan for busy seasons, adjust staffing, or launch seasonal promotions. Rating variations can indicate service quality during different periods." />
        </div>
        <CardDescription>
          Seasonal patterns and operational trends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Seasonal Review Count */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium">Seasonal Review Volume</h4>
              <InfoTooltip content="Shows how review volume changes by season. Higher volumes often indicate busier periods. Use this to anticipate seasonal demand and prepare accordingly." />
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={seasonalAnalysis}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="season" />
                  <YAxis />
                  <RechartsTooltip content={<CustomBarLineTooltip />} />
                  <Legend />
                  <Bar dataKey="count" name="Reviews" fill="#FFBB28" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Seasonal Rating */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium">Seasonal Rating Trends</h4>
              <InfoTooltip content="Shows how customer satisfaction varies by season. Lower ratings during busy seasons might indicate service strain. Use this to maintain quality during peak periods." />
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={seasonalAnalysis}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="season" />
                  <YAxis domain={[0, 5]} />
                  <RechartsTooltip content={<CustomBarLineTooltip />} />
                  <Legend />
                  <Bar dataKey="avgRating" name="Average Rating" fill="#FF8042" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // If fullView is enabled, render all sections vertically
  if (fullView) {
    return (
      <div className="space-y-8 w-full">
        <InsightsSection />
        <PerformanceSection />
        <SentimentSection />
        <ThematicSection />
        <OperationalSection />
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

        {/* Insights Tab */}
        <TabsContent value="insights" className="mt-6">
          <InsightsSection />
        </TabsContent>

        {/* Temporal Patterns Tab */}
        <TabsContent value="temporal" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Day of Week Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Reviews by Day of Week
                  </CardTitle>
                  <InfoTooltip content="Shows which days customers are most likely to leave reviews. This often correlates with your busiest days and can help identify weekly patterns in customer behavior." />
                </div>
                <CardDescription>
                  Distribution of reviews across days of the week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={temporalPatterns.dayOfWeek}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <RechartsTooltip content={<CustomBarLineTooltip />} />
                      <Legend />
                      <Bar dataKey="count" name="Reviews" fill="#8884d8" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Time of Day Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <BarChart className="w-5 h-5 mr-2" />
                    Reviews by Time of Day
                  </CardTitle>
                  <InfoTooltip content="Shows when during the day customers post reviews. Evening spikes often indicate when customers reflect on their experience. This can help optimize response times and service hours." />
                </div>
                <CardDescription>
                  Distribution of reviews across different times of day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={temporalPatterns.timeOfDay}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <RechartsTooltip content={<CustomBarLineTooltip />} />
                      <Legend />
                      <Bar dataKey="count" name="Reviews" fill="#00C49F" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Historical Trends Tab */}
        <TabsContent value="trends" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <LineChart className="w-5 h-5 mr-2" />
                  Historical Trends
                </CardTitle>
                <InfoTooltip content="Tracks performance over different time periods. The dual-axis design lets you see if increased engagement (more reviews) correlates with satisfaction (ratings). Look for patterns to understand your business trajectory." />
              </div>
              <CardDescription>
                Changes in ratings and review volume over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart
                    data={historicalTrends}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis yAxisId="left" label={{ value: 'Review Count', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 5]} label={{ value: 'Average Rating', angle: 90, position: 'insideRight' }} />
                    <RechartsTooltip content={<CustomBarLineTooltip />} />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="reviewCount"
                      name="Review Count"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="avgRating"
                      name="Average Rating"
                      stroke="#82ca9d"
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review Clusters Tab */}
        <TabsContent value="clusters" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Clusters Chart */}
            <Card className="lg:col-span-5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <PieChart className="w-5 h-5 mr-2" />
                    Cluster Distribution
                  </CardTitle>
                  <InfoTooltip content="Visual breakdown of review themes by percentage. Larger slices indicate topics mentioned more frequently. Use this to understand what matters most to your customers." />
                </div>
                <CardDescription>
                  Topics mentioned in reviews by frequency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={reviewClusters}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {reviewClusters.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomPieTooltip />} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Clusters Details */}
            <Card className="lg:col-span-7">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Cluster Details</CardTitle>
                  <InfoTooltip content="Each theme shows its overall sentiment and keywords extracted from reviews. Keywords help understand specific aspects customers mention. Use this to identify strengths to maintain and issues to address." />
                </div>
                <CardDescription>
                  Common themes and their associated keywords
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {reviewClusters.map((cluster, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">{cluster.name}</h3>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant={
                                cluster.sentiment === 'positive' ? 'default' :
                                cluster.sentiment === 'negative' ? 'destructive' :
                                'secondary'
                              } className="cursor-help">
                                {cluster.sentiment}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-sm">
                                {cluster.sentiment === 'positive' ? 'Customers are happy about this aspect' :
                                 cluster.sentiment === 'negative' ? 'This area needs improvement' :
                                 'Mixed opinions on this topic'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Mentioned in {cluster.count} reviews
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {cluster.keywords.map((keyword, idx) => (
                          <Badge key={idx} variant="outline">{keyword}</Badge>
                        ))}
                      </div>
                      {index < reviewClusters.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}

                  {reviewClusters.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">
                      No review clusters detected. Try analyzing more reviews.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Seasonal Analysis Tab */}
        <TabsContent value="seasonal" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Seasonal Review Count */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <BarChart className="w-5 h-5 mr-2" />
                    Seasonal Review Volume
                  </CardTitle>
                  <InfoTooltip content="Shows how review volume changes by season. Higher volumes often indicate busier periods. Use this to anticipate seasonal demand and prepare accordingly." />
                </div>
                <CardDescription>
                  Number of reviews by season
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={seasonalAnalysis}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="season" />
                      <YAxis />
                      <RechartsTooltip content={<CustomBarLineTooltip />} />
                      <Legend />
                      <Bar dataKey="count" name="Reviews" fill="#FFBB28" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Seasonal Rating */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <LineChart className="w-5 h-5 mr-2" />
                    Seasonal Rating Trends
                  </CardTitle>
                  <InfoTooltip content="Shows how customer satisfaction varies by season. Lower ratings during busy seasons might indicate service strain. Use this to maintain quality during peak periods." />
                </div>
                <CardDescription>
                  Average rating by season
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={seasonalAnalysis}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="season" />
                      <YAxis domain={[0, 5]} />
                      <RechartsTooltip content={<CustomBarLineTooltip />} />
                      <Legend />
                      <Bar dataKey="avgRating" name="Average Rating" fill="#FF8042" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
