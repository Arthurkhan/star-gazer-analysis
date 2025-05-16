import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TemporalPattern, 
  HistoricalTrend,
  ReviewCluster,
  SeasonalPattern 
} from '@/types/dataAnalysis';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronUp, Loader2, CheckCircleIcon, XCircleIcon, InformationCircleIcon } from 'lucide-react';

interface EnhancedAnalysisDisplayProps {
  temporalPatterns: TemporalPattern[] | null;
  historicalTrends: HistoricalTrend[] | null;
  reviewClusters: ReviewCluster[] | null;
  seasonalAnalysis: SeasonalPattern[] | null;
  insights: {
    keyFindings: string[];
    opportunities: string[];
    risks: string[];
  } | null;
  loading: boolean;
}

export function EnhancedAnalysisDisplay({
  temporalPatterns,
  historicalTrends,
  reviewClusters,
  seasonalAnalysis,
  insights,
  loading
}: EnhancedAnalysisDisplayProps) {
  const [selectedPattern, setSelectedPattern] = useState<string>('daily');
  const [showAllClusters, setShowAllClusters] = useState(false);
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Analysis</CardTitle>
          <CardDescription>Analyzing data patterns...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!temporalPatterns && !historicalTrends && !reviewClusters && !seasonalAnalysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Analysis</CardTitle>
          <CardDescription>No analysis data available. Generate recommendations to see insights.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Tabs defaultValue="insights">
      <TabsList className="grid grid-cols-5 mb-4">
        <TabsTrigger value="insights">Key Insights</TabsTrigger>
        <TabsTrigger value="temporal">Temporal Patterns</TabsTrigger>
        <TabsTrigger value="historical">Historical Trends</TabsTrigger>
        <TabsTrigger value="clusters">Review Clusters</TabsTrigger>
        <TabsTrigger value="seasonal">Seasonal Patterns</TabsTrigger>
      </TabsList>
      
      <TabsContent value="insights">
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
            <CardDescription>Summary of analysis findings</CardDescription>
          </CardHeader>
          <CardContent>
            {insights ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {renderKeyInsights(insights)}
              </div>
            ) : (
              <p>No insights available.</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="temporal">
        <Card>
          <CardHeader>
            <CardTitle>Temporal Patterns</CardTitle>
            <CardDescription>How review metrics change over time</CardDescription>
            <div className="flex space-x-2 mt-2">
              <TabsList>
                <TabsTrigger 
                  value="daily" 
                  onClick={() => setSelectedPattern('daily')}
                  className={selectedPattern === 'daily' ? 'bg-primary text-primary-foreground' : ''}
                >
                  Daily
                </TabsTrigger>
                <TabsTrigger 
                  value="weekly" 
                  onClick={() => setSelectedPattern('weekly')}
                  className={selectedPattern === 'weekly' ? 'bg-primary text-primary-foreground' : ''}
                >
                  Weekly
                </TabsTrigger>
                <TabsTrigger 
                  value="monthly" 
                  onClick={() => setSelectedPattern('monthly')}
                  className={selectedPattern === 'monthly' ? 'bg-primary text-primary-foreground' : ''}
                >
                  Monthly
                </TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          <CardContent>
            {renderTemporalPatterns(temporalPatterns, selectedPattern)}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="historical">
        <Card>
          <CardHeader>
            <CardTitle>Historical Trends</CardTitle>
            <CardDescription>Long-term trend analysis and forecasts</CardDescription>
          </CardHeader>
          <CardContent>
            {renderHistoricalTrends(historicalTrends)}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="clusters">
        <Card>
          <CardHeader>
            <CardTitle>Review Clusters</CardTitle>
            <CardDescription>Groups of similar reviews and common themes</CardDescription>
          </CardHeader>
          <CardContent>
            {renderClusters(reviewClusters, showAllClusters, () => setShowAllClusters(!showAllClusters))}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="seasonal">
        <Card>
          <CardHeader>
            <CardTitle>Seasonal Patterns</CardTitle>
            <CardDescription>Seasonal variations in review metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {renderSeasonalPatterns(seasonalAnalysis)}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function renderKeyInsights(insights: { keyFindings: string[]; opportunities: string[]; risks: string[] }) {
  return (
    <>
      {insights.keyFindings.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-3 mb-4">
            <div className="rounded-full p-2 bg-blue-100 dark:bg-blue-900">
              <InformationCircleIcon className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="font-semibold text-lg">Key Findings</h3>
          </div>
          
          <ul className="space-y-2">
            {insights.keyFindings.map((finding, index) => (
              <li key={index} className="text-gray-600 dark:text-gray-300">
                {finding}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {insights.opportunities.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-3 mb-4">
            <div className="rounded-full p-2 bg-green-100 dark:bg-green-900">
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="font-semibold text-lg">Opportunities</h3>
          </div>
          
          <ul className="space-y-2">
            {insights.opportunities.map((opportunity, index) => (
              <li key={index} className="text-gray-600 dark:text-gray-300">
                {opportunity}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {insights.risks.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-3 mb-4">
            <div className="rounded-full p-2 bg-red-100 dark:bg-red-900">
              <XCircleIcon className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="font-semibold text-lg">Risks</h3>
          </div>
          
          <ul className="space-y-2">
            {insights.risks.map((risk, index) => (
              <li key={index} className="text-gray-600 dark:text-gray-300">
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function renderTemporalPatterns(patterns: TemporalPattern[] | null, selectedPattern: string) {
  if (!patterns || patterns.length === 0) {
    return <p>No temporal pattern data available.</p>;
  }
  
  const pattern = patterns.find(p => p.pattern === selectedPattern);
  
  if (!pattern) {
    return <p>No data available for the selected pattern type.</p>;
  }
  
  return (
    <div className="space-y-6">
      <div className="p-4 border rounded-lg bg-muted/20">
        <h3 className="font-medium mb-2">{pattern.description}</h3>
        <div className="flex items-center">
          <Badge variant={pattern.strength > 0.7 ? "success" : "info"} className="mr-2">
            {pattern.strength > 0.7 ? 'Strong Pattern' : pattern.strength > 0.4 ? 'Moderate Pattern' : 'Weak Pattern'}
          </Badge>
          <span className="text-sm text-muted-foreground">Confidence: {(pattern.strength * 100).toFixed(0)}%</span>
        </div>
      </div>
      
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={pattern.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" name={pattern.data[0]?.metric || 'Value'} fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {pattern.data.map((item, index) => (
          <div key={index} className="border rounded-md p-2 flex flex-col items-center text-center w-12 h-12">
            <span className="text-xs text-muted-foreground truncate w-full">{item.period}</span>
            <p className="text-base font-medium">{item.value}</p>
            <Badge variant={getTrendVariant(item.trend)} className="text-xs mt-1 px-1 py-0">
              {item.trend.charAt(0).toUpperCase() + item.trend.slice(1)}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderHistoricalTrends(trends: HistoricalTrend[] | null) {
  if (!trends || trends.length === 0) {
    return <p>No historical trend data available.</p>;
  }
  
  return (
    <div className="space-y-8">
      {trends.map((trend, index) => {
        // Determine Y-axis domain settings based on the metric
        let yAxisDomain: [number, number] | undefined;
        
        if (trend.metric.toLowerCase().includes('rating')) {
          yAxisDomain = [0, 5]; // Max vertical axis at 5 for ratings
        } else if (trend.metric.toLowerCase().includes('sentiment') || trend.metric.toLowerCase().includes('positive')) {
          // Calculate dynamic domain with minimum 10 units below lowest value
          const minValue = Math.min(...trend.data.map(d => d.value));
          const floorValue = Math.max(0, minValue - 10); // Ensure we don't go below 0
          yAxisDomain = [floorValue, 100];
        }
        
        return (
          <div key={index} className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">{trend.metric}</h3>
              <Badge 
                variant={
                  trend.trend === 'improving' ? "success" : 
                  trend.trend === 'declining' ? "destructive" : 
                  "neutral"
                }
              >
                {trend.trend.charAt(0).toUpperCase() + trend.trend.slice(1)}
              </Badge>
            </div>
            
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis domain={yAxisDomain} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name={trend.metric} 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                  />
                  {trend.forecast && (
                    <Line
                      type="monotone"
                      dataKey="forecast"
                      name="Forecast"
                      stroke="#82ca9d"
                      strokeDasharray="5 5"
                      connectNulls
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {trend.forecast && (
              <div className="p-4 border rounded-lg bg-muted/20">
                <h4 className="font-medium mb-2">Forecast</h4>
                <p>
                  Next period ({trend.forecast.nextPeriod}): {trend.forecast.predictedValue.toFixed(2)}
                  <span className="text-sm text-muted-foreground ml-2">
                    (Confidence: {(trend.forecast.confidence * 100).toFixed(0)}%)
                  </span>
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function renderClusters(clusters: ReviewCluster[] | null, showAll: boolean, toggleShowAll: () => void) {
  if (!clusters || clusters.length === 0) {
    return <p>No cluster data available.</p>;
  }
  
  // Keep special clusters (delighted and dissatisfied customers)
  const delightedCluster = clusters.find(c => c.id === 'cluster-5star');
  const dissatisfiedCluster = clusters.find(c => c.id === 'cluster-negative');
  
  // Get remaining clusters and sort by review count
  const remainingClusters = clusters
    .filter(c => c.id !== 'cluster-5star' && c.id !== 'cluster-negative')
    .sort((a, b) => b.reviewCount - a.reviewCount);
  
  // Build the final clusters array with special clusters first, then sorted by size
  let displayClusters: ReviewCluster[] = [];
  
  if (delightedCluster) displayClusters.push(delightedCluster);
  if (dissatisfiedCluster) displayClusters.push(dissatisfiedCluster);
  
  // Add sorted remaining clusters
  displayClusters = [...displayClusters, ...remainingClusters];
  
  // Limit to 10 clusters unless showAll is true
  const hasMoreClusters = displayClusters.length > 10;
  const visibleClusters = showAll ? displayClusters : displayClusters.slice(0, 10);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleClusters.map(cluster => (
          <div key={cluster.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-medium">{cluster.name}</h3>
                <p className="text-sm text-muted-foreground">{cluster.description}</p>
              </div>
              <Badge 
                variant={
                  cluster.sentiment === 'positive' ? "success" : 
                  cluster.sentiment === 'negative' ? "destructive" : 
                  "neutral"
                }
              >
                {cluster.sentiment.charAt(0).toUpperCase() + cluster.sentiment.slice(1)}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Review Count</p>
                <p className="text-lg font-medium">{cluster.reviewCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <p className="text-lg font-medium">{cluster.averageRating.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Keywords</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {cluster.keywords.slice(0, 5).map((keyword, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            {cluster.insights.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">Insights</h4>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {cluster.insights.map((insight, i) => (
                    <li key={i}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {cluster.examples.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium mb-1">Sample Review</h4>
                <div className="text-sm italic bg-muted/30 p-2 rounded">
                  "{cluster.examples[0]}"
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {hasMoreClusters && (
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={toggleShowAll}
            className="mt-2"
          >
            {showAll ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show More
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function renderSeasonalPatterns(patterns: SeasonalPattern[] | null) {
  if (!patterns || patterns.length === 0) {
    return <p>No seasonal pattern data available.</p>;
  }
  
  return (
    <div className="space-y-8">
      {patterns.map((pattern, index) => (
        <div key={index} className="border rounded-lg p-4">
          <h3 className="text-lg font-medium mb-1">{pattern.name}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {pattern.dateRange.start} to {pattern.dateRange.end}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Average Rating</p>
              <p className="text-lg font-medium">{pattern.metrics.avgRating.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Review Volume</p>
              <p className="text-lg font-medium">{pattern.metrics.reviewVolume}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">vs. Year Average</p>
              <p className={`text-lg font-medium ${pattern.comparison.vsYearAverage > 0 ? 'text-green-600' : pattern.comparison.vsYearAverage < 0 ? 'text-red-600' : ''}`}>
                {pattern.comparison.vsYearAverage > 0 ? '+' : ''}{pattern.comparison.vsYearAverage.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Top Themes</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {pattern.metrics.topThemes.slice(0, 3).map((theme, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          {pattern.recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-1">Recommendations</h4>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {pattern.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Helper functions
function getTrendVariant(trend: string): "success" | "destructive" | "neutral" | "warning" | "info" {
  switch (trend) {
    case 'increasing':
    case 'improving':
      return 'success';
    case 'decreasing':
    case 'declining':
      return 'destructive';
    case 'stable':
      return 'neutral';
    case 'volatile':
      return 'warning';
    default:
      return 'info';
  }
}
