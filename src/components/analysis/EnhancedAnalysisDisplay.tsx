import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Info, BarChart2, Loader2, Search, TrendingUp, AlertTriangle } from "lucide-react";
import { TemporalPattern, HistoricalTrend, ReviewCluster, SeasonalPattern } from "@/types/dataAnalysis";
import { ResponsiveContainer, AreaChart as RechartsAreaChart, BarChart as RechartsBarChart, PieChart as RechartsPieChart, Area, Bar, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

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

export const EnhancedAnalysisDisplay = ({
  temporalPatterns,
  historicalTrends,
  reviewClusters,
  seasonalAnalysis,
  insights,
  loading
}: EnhancedAnalysisDisplayProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin mr-2" />
        Loading enhanced analysis...
      </div>
    );
  }

  if (!temporalPatterns && !historicalTrends && !reviewClusters && !seasonalAnalysis && !insights) {
    return (
      <Alert variant="default">
        <Info className="h-4 w-4" />
        <AlertTitle>No Enhanced Analysis Available</AlertTitle>
        <AlertDescription>
          Enhanced analysis data is not available for the selected business.
        </AlertDescription>
      </Alert>
    );
  }

  // Chart rendering functions
  const renderAreaChart = (data: any[]) => (
    <ResponsiveContainer width="100%" height={200}>
      <RechartsAreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="period" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );

  return (
    <div className="space-y-6">
      {/* Key Insights */}
      {insights && (
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Key Findings</h4>
              <ul className="list-disc pl-5">
                {insights.keyFindings.map((finding, index) => (
                  <li key={index}>{finding}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Opportunities</h4>
              <ul className="list-disc pl-5">
                {insights.opportunities.map((opportunity, index) => (
                  <li key={index}>{opportunity}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Risks</h4>
              <ul className="list-disc pl-5">
                {insights.risks.map((risk, index) => (
                  <li key={index}>{risk}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Temporal Patterns */}
      {temporalPatterns && (
        <Card>
          <CardHeader>
            <CardTitle>Temporal Patterns</CardTitle>
            <p className="text-sm text-muted-foreground">
              Understand how review activity changes over time.
            </p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] w-full">
              <div className="space-y-4">
                {temporalPatterns.map((pattern) => (
                  <div key={pattern.pattern} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">{pattern.pattern} Pattern</h4>
                      <Badge variant="secondary">Strength: {(pattern.strength * 100).toFixed(0)}%</Badge>
                    </div>
                    <p className="text-muted-foreground">{pattern.description}</p>
                    {renderAreaChart(pattern.data)}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Historical Trends */}
      {historicalTrends && (
        <Card>
          <CardHeader>
            <CardTitle>Historical Trends</CardTitle>
            <p className="text-sm text-muted-foreground">
              Track key metrics over time to identify trends.
            </p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] w-full">
              <div className="space-y-4">
                {historicalTrends.map((trend) => (
                  <div key={trend.metric} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">{trend.metric}</h4>
                      <Badge variant="secondary">Trend: {trend.trend}</Badge>
                    </div>
                    {renderAreaChart(trend.data)}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Review Clusters */}
      {reviewClusters && (
        <Card>
          <CardHeader>
            <CardTitle>Review Clusters</CardTitle>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Group reviews by common themes and sentiments.
              </p>
            </CardContent>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reviewClusters.map((cluster) => (
                  <div key={cluster.id} className="space-y-2">
                    <h4 className="text-sm font-medium">{cluster.name}</h4>
                    <p className="text-muted-foreground">{cluster.description}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Sentiment: {cluster.sentiment}</Badge>
                      <Badge variant="outline">Reviews: {cluster.reviewCount}</Badge>
                    </div>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                      {cluster.keywords.map((keyword, index) => (
                        <li key={index}>{keyword}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Seasonal Analysis */}
      {seasonalAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle>Seasonal Analysis</CardTitle>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Understand how business performs during different seasons.
              </p>
            </CardContent>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full">
              <div className="space-y-4">
                {seasonalAnalysis.map((season) => (
                  <div key={season.season} className="space-y-2">
                    <h4 className="text-sm font-medium">{season.name}</h4>
                    <p className="text-muted-foreground">
                      Date Range: {season.dateRange.start} - {season.dateRange.end}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Avg Rating: {season.metrics.avgRating}</Badge>
                      <Badge variant="outline">Review Volume: {season.metrics.reviewVolume}</Badge>
                    </div>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                      {season.recommendations.map((recommendation, index) => (
                        <li key={index}>{recommendation}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
