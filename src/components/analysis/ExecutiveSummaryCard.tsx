import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Star, Users, MessageSquare, BarChart3 } from "lucide-react";
import { BusinessHealthScore, PerformanceMetrics, TimePeriodConfig } from "@/types/analysisSummary";

interface ExecutiveSummaryCardProps {
  healthScore: BusinessHealthScore;
  performanceMetrics: PerformanceMetrics;
  timePeriod: TimePeriodConfig;
}

export const ExecutiveSummaryCard: React.FC<ExecutiveSummaryCardProps> = ({
  healthScore,
  performanceMetrics,
  timePeriod
}) => {
  // Helper function to render trend indicator
  const renderTrendIndicator = (value: number, label: string) => {
    if (Math.abs(value) < 2) {
      return (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Minus className="w-4 h-4" />
          <span className="text-sm">Stable</span>
        </div>
      );
    }
    
    if (value > 0) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm">+{value.toFixed(1)}%</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-1 text-red-600">
        <TrendingDown className="w-4 h-4" />
        <span className="text-sm">{value.toFixed(1)}%</span>
      </div>
    );
  };

  // Helper function to get health score color and label
  const getHealthScoreInfo = (score: number) => {
    if (score >= 80) {
      return { color: "bg-green-500", label: "Excellent", textColor: "text-green-700" };
    } else if (score >= 60) {
      return { color: "bg-yellow-500", label: "Good", textColor: "text-yellow-700" };
    } else if (score >= 40) {
      return { color: "bg-orange-500", label: "Needs Attention", textColor: "text-orange-700" };
    } else {
      return { color: "bg-red-500", label: "Critical", textColor: "text-red-700" };
    }
  };

  const healthInfo = getHealthScoreInfo(healthScore.overall);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Executive Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Business Health Score */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${healthInfo.color}`} />
              <h3 className="font-semibold">Business Health</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{healthScore.overall}%</span>
                <Badge variant="secondary" className={healthInfo.textColor}>
                  {healthInfo.label}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Overall business performance score
              </div>
            </div>
            
            {/* Health breakdown */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Rating Quality</span>
                <span>{healthScore.breakdown.rating}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Customer Sentiment</span>
                <span>{healthScore.breakdown.sentiment}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Response Rate</span>
                <span>{healthScore.breakdown.response}%</span>
              </div>
            </div>
          </div>

          {/* Review Volume & Growth */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <h3 className="font-semibold">Review Volume</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{performanceMetrics.totalReviews}</span>
                <span className="text-sm text-muted-foreground">total</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {performanceMetrics.reviewsPerMonth.toFixed(1)} reviews/month avg
              </div>
            </div>
            
            {/* Growth indicator */}
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground mb-1">Growth Trend</div>
              {renderTrendIndicator(performanceMetrics.growthRate, "Growth")}
              <div className="text-xs text-muted-foreground">
                {performanceMetrics.trends.isGrowing ? "Expanding customer base" : "Stable customer engagement"}
              </div>
            </div>
          </div>

          {/* Rating Performance */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <h3 className="font-semibold">Rating Trends</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{healthScore.ratingTrend > 0 ? '+' : ''}{(healthScore.ratingTrend / 20).toFixed(1)}</span>
                <div className="flex items-center">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Rating change trend
              </div>
            </div>
            
            {/* Rating trend indicator */}
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground mb-1">Trend Direction</div>
              {renderTrendIndicator(healthScore.ratingTrend, "Rating")}
              <div className="text-xs text-muted-foreground">
                {healthScore.ratingTrend > 5 ? "Improving ratings" : 
                 healthScore.ratingTrend < -5 ? "Declining ratings" : "Stable ratings"}
              </div>
            </div>
          </div>

          {/* Response & Engagement */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-green-500" />
              <h3 className="font-semibold">Engagement</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{healthScore.responseRate}%</span>
                <span className="text-sm text-muted-foreground">response rate</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Owner-customer interaction level
              </div>
            </div>
            
            {/* Engagement assessment */}
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground mb-1">Engagement Level</div>
              <Badge variant={healthScore.responseRate >= 50 ? "default" : "secondary"}>
                {healthScore.responseRate >= 70 ? "High" :
                 healthScore.responseRate >= 40 ? "Moderate" : "Low"}
              </Badge>
              <div className="text-xs text-muted-foreground">
                {healthScore.responseRate >= 50 
                  ? "Active customer communication" 
                  : "Opportunity to increase responses"}
              </div>
            </div>
          </div>
        </div>

        {/* Period Information */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Analysis Period: {timePeriod.current.label}</span>
            <span>
              {timePeriod.current.start.toLocaleDateString()} - {timePeriod.current.end.toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
