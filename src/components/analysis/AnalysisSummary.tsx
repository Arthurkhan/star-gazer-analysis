import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from "lucide-react";
import { Review } from "@/types/reviews";
import { AnalysisSummaryData, AnalysisConfig } from "@/types/analysisSummary";
import { generateAnalysisSummary } from "@/utils/analysisUtils";
import { ExecutiveSummaryCard } from "./ExecutiveSummaryCard";
import { PerformanceMetricsGrid } from "./PerformanceMetricsGrid";
import { SentimentAnalysisSection } from "./SentimentAnalysisSection";
import { ThematicAnalysisSection } from "./ThematicAnalysisSection";
import { StaffInsightsSection } from "./StaffInsightsSection";
import { OperationalInsightsSection } from "./OperationalInsightsSection";
import { ActionItemsSection } from "./ActionItemsSection";

interface AnalysisSummaryProps {
  reviews: Review[];
  businessName?: string;
  loading?: boolean;
  config?: AnalysisConfig;
  className?: string;
}

export const AnalysisSummary: React.FC<AnalysisSummaryProps> = ({
  reviews,
  businessName = "Current Business",
  loading = false,
  config = {
    timePeriod: "all",
    includeStaffAnalysis: true,
    includeThematicAnalysis: true,
    includeActionItems: true,
    comparisonPeriod: "previous"
  },
  className = ""
}) => {
  // Generate analysis data
  const analysisData: AnalysisSummaryData | null = useMemo(() => {
    if (!reviews || reviews.length === 0) return null;
    
    try {
      const data = generateAnalysisSummary(reviews, config);
      return { ...data, dataSource: { ...data.dataSource, businessName } };
    } catch (error) {
      console.error("Error generating analysis summary:", error);
      return null;
    }
  }, [reviews, config, businessName]);

  // Loading state
  if (loading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating Analysis Summary...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (!analysisData) {
    return (
      <Alert className={`w-full ${className}`} variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to generate analysis summary. Please ensure you have review data available.
        </AlertDescription>
      </Alert>
    );
  }

  // Success state with health score indicator
  const healthScore = analysisData.businessHealthScore.overall;
  const healthColor = healthScore >= 80 ? "text-green-600" : 
                     healthScore >= 60 ? "text-yellow-600" : "text-red-600";
  const healthIcon = healthScore >= 80 ? CheckCircle : 
                    healthScore >= 60 ? AlertTriangle : AlertTriangle;
  const HealthIcon = healthIcon;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with business health indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Analysis Summary</span>
              <span className="text-sm text-muted-foreground">
                ({analysisData.dataSource.totalReviews} reviews analyzed)
              </span>
            </div>
            <div className={`flex items-center gap-2 ${healthColor}`}>
              <HealthIcon className="w-5 h-5" />
              <span className="font-semibold">Health Score: {healthScore}%</span>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Executive Summary Card */}
      <ExecutiveSummaryCard 
        healthScore={analysisData.businessHealthScore}
        performanceMetrics={analysisData.performanceMetrics}
        timePeriod={analysisData.timePeriod}
      />

      {/* Performance Metrics Grid */}
      <PerformanceMetricsGrid 
        performanceMetrics={analysisData.performanceMetrics}
        ratingAnalysis={analysisData.ratingAnalysis}
        responseAnalytics={analysisData.responseAnalytics}
      />

      {/* Sentiment Analysis Section */}
      <SentimentAnalysisSection 
        sentimentAnalysis={analysisData.sentimentAnalysis}
      />

      {/* Thematic Analysis Section */}
      {config.includeThematicAnalysis && (
        <ThematicAnalysisSection 
          thematicAnalysis={analysisData.thematicAnalysis}
        />
      )}

      {/* Staff Insights Section */}
      {config.includeStaffAnalysis && analysisData.staffInsights.mentions.length > 0 && (
        <StaffInsightsSection 
          staffInsights={analysisData.staffInsights}
        />
      )}

      {/* Operational Insights Section */}
      <OperationalInsightsSection 
        operationalInsights={analysisData.operationalInsights}
      />

      {/* Action Items Section */}
      {config.includeActionItems && (
        <ActionItemsSection 
          actionItems={analysisData.actionItems}
        />
      )}

      {/* Footer with generation info */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground text-center">
            Analysis generated on {analysisData.generatedAt.toLocaleDateString()} at{" "}
            {analysisData.generatedAt.toLocaleTimeString()} • 
            Data period: {analysisData.timePeriod.current.start.toLocaleDateString()} to{" "}
            {analysisData.timePeriod.current.end.toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisSummary;
