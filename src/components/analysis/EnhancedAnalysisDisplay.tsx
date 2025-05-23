import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { BarChart, LineChart, PieChart, Calendar, Lightbulb } from 'lucide-react';
import { 
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import { CustomBarLineTooltip, CustomPieTooltip } from '@/components/review-analysis/CustomTooltips';

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
}

export function EnhancedAnalysisDisplay({
  temporalPatterns,
  historicalTrends,
  reviewClusters,
  seasonalAnalysis,
  insights,
  loading = false
}: EnhancedAnalysisDisplayProps) {
  // Custom colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="w-5 h-5 mr-2" />
                Key Insights
              </CardTitle>
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
        </TabsContent>
        
        {/* Temporal Patterns Tab */}
        <TabsContent value="temporal" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Day of Week Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Reviews by Day of Week
                </CardTitle>
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
                      <Tooltip content={<CustomBarLineTooltip />} />
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
                <CardTitle className="flex items-center">
                  <BarChart className="w-5 h-5 mr-2" />
                  Reviews by Time of Day
                </CardTitle>
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
                      <Tooltip content={<CustomBarLineTooltip />} />
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
              <CardTitle className="flex items-center">
                <LineChart className="w-5 h-5 mr-2" />
                Historical Trends
              </CardTitle>
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
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 5]} />
                    <Tooltip content={<CustomBarLineTooltip />} />
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
                <CardTitle className="flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Cluster Distribution
                </CardTitle>
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
                      <Tooltip content={<CustomPieTooltip />} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Clusters Details */}
            <Card className="lg:col-span-7">
              <CardHeader>
                <CardTitle>Cluster Details</CardTitle>
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
                <CardTitle className="flex items-center">
                  <BarChart className="w-5 h-5 mr-2" />
                  Seasonal Review Volume
                </CardTitle>
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
                      <Tooltip content={<CustomBarLineTooltip />} />
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
                <CardTitle className="flex items-center">
                  <LineChart className="w-5 h-5 mr-2" />
                  Seasonal Rating Trends
                </CardTitle>
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
                      <Tooltip content={<CustomBarLineTooltip />} />
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
  );
}
