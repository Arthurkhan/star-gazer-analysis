import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Star, MessageSquare, TrendingUp, Calendar, Activity } from "lucide-react";
import { PerformanceMetrics, RatingAnalysis, ResponseAnalytics } from "@/types/analysisSummary";

interface PerformanceMetricsGridProps {
  performanceMetrics: PerformanceMetrics;
  ratingAnalysis: RatingAnalysis;
  responseAnalytics: ResponseAnalytics;
}

export const PerformanceMetricsGrid: React.FC<PerformanceMetricsGridProps> = ({
  performanceMetrics,
  ratingAnalysis,
  responseAnalytics
}) => {
  // Helper to format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  // Helper to get seasonal pattern info
  const getSeasonalInfo = (pattern: string) => {
    switch (pattern) {
      case "growing":
        return { label: "Growing", color: "text-green-600", bg: "bg-green-100" };
      case "declining":
        return { label: "Declining", color: "text-red-600", bg: "bg-red-100" };
      case "seasonal":
        return { label: "Seasonal", color: "text-blue-600", bg: "bg-blue-100" };
      default:
        return { label: "Stable", color: "text-gray-600", bg: "bg-gray-100" };
    }
  };

  const seasonalInfo = getSeasonalInfo(performanceMetrics.trends.seasonalPattern);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Review Volume Analysis */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                Review Volume
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{formatNumber(performanceMetrics.totalReviews)}</span>
                  <span className="text-sm text-muted-foreground">total reviews</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {performanceMetrics.reviewsPerMonth.toFixed(1)} reviews per month average
                </div>
              </div>

              {/* Recent Activity */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Recent Activity</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Last 3 months:</span>
                    <span className="font-medium">{performanceMetrics.recentActivity.last3Months}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Last 6 months:</span>
                    <span className="font-medium">{performanceMetrics.recentActivity.last6Months}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Last 12 months:</span>
                    <span className="font-medium">{performanceMetrics.recentActivity.last12Months}</span>
                  </div>
                </div>
              </div>

              {/* Growth Rate */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-semibold">Growth Rate</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-lg font-bold ${
                    performanceMetrics.growthRate > 0 ? 'text-green-600' : 
                    performanceMetrics.growthRate < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {performanceMetrics.growthRate > 0 ? '+' : ''}{performanceMetrics.growthRate.toFixed(1)}%
                  </span>
                  <Badge variant={performanceMetrics.trends.isGrowing ? "default" : "secondary"}>
                    {performanceMetrics.trends.isGrowing ? "Growing" : "Stable"}
                  </Badge>
                </div>
              </div>

              {/* Seasonal Pattern */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Pattern</h4>
                <Badge className={`${seasonalInfo.bg} ${seasonalInfo.color}`} variant="secondary">
                  {seasonalInfo.label}
                </Badge>
                <div className="text-xs text-muted-foreground">
                  Peak: {performanceMetrics.peakMonth || 'N/A'} {performanceMetrics.peakYear}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rating Distribution Analysis */}
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Rating Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Rating */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{ratingAnalysis.trends.current.toFixed(1)}</span>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Average rating • {ratingAnalysis.trends.direction === 'up' ? '↗️' : 
                                     ratingAnalysis.trends.direction === 'down' ? '↘️' : '➡️'} 
                  {Math.abs(ratingAnalysis.trends.change) > 0.1 ? 
                    ` ${ratingAnalysis.trends.change > 0 ? '+' : ''}${ratingAnalysis.trends.change.toFixed(1)}` : 
                    ' Stable'}
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Distribution</h4>
                {[5, 4, 3, 2, 1].map(rating => {
                  const data = ratingAnalysis.distribution[rating];
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-xs min-w-[20px]">{rating}★</span>
                      <Progress 
                        value={data.percentage} 
                        className="flex-1 h-2" 
                      />
                      <span className="text-xs min-w-[40px] text-right">
                        {data.percentage.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Quality Benchmarks */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Quality Benchmarks</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Excellent (4-5★):</span>
                    <span className="font-medium text-green-600">
                      {ratingAnalysis.benchmarks.excellent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Good (3-5★):</span>
                    <span className="font-medium text-blue-600">
                      {ratingAnalysis.benchmarks.good.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Needs Attention (1-2★):</span>
                    <span className="font-medium text-red-600">
                      {ratingAnalysis.benchmarks.needsImprovement.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Response Analytics */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-green-500" />
                Response Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Overall Response Rate */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{responseAnalytics.responseRate.toFixed(1)}%</span>
                  <span className="text-sm text-muted-foreground">response rate</span>
                </div>
                <Badge variant={responseAnalytics.responseRate >= 50 ? "default" : "secondary"}>
                  {responseAnalytics.responseRate >= 70 ? "Excellent" :
                   responseAnalytics.responseRate >= 50 ? "Good" :
                   responseAnalytics.responseRate >= 25 ? "Fair" : "Needs Improvement"}
                </Badge>
              </div>

              {/* Response by Rating */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Response by Rating</h4>
                {[1, 2, 3, 4, 5].reverse().map(rating => {
                  const data = responseAnalytics.responsesByRating[rating];
                  if (data.total === 0) return null;
                  
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-xs min-w-[20px]">{rating}★</span>
                      <Progress 
                        value={data.rate} 
                        className="flex-1 h-2" 
                      />
                      <span className="text-xs min-w-[60px] text-right">
                        {data.responded}/{data.total} ({data.rate.toFixed(0)}%)
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Response Effectiveness */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Effectiveness</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Impact Score:</span>
                    <span className="font-medium">
                      {responseAnalytics.responseEffectiveness.customerSatisfactionImpact.toFixed(1)}/10
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {responseAnalytics.responseEffectiveness.improvedSubsequentRatings
                      ? "Responses show positive impact"
                      : "Response effectiveness could be improved"}
                  </div>
                </div>
              </div>

              {/* Peak Activity Periods */}
              {performanceMetrics.trends.bestPeriods.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Peak Periods</h4>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {performanceMetrics.trends.bestPeriods.slice(0, 2).join(', ')}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};
