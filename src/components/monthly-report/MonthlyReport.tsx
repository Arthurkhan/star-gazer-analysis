import { useMemo, useState } from "react";
import { Review } from "@/types/reviews";
import { DateRangeSelector } from "./DateRangeSelector";
import { EnhancedSummaryCards } from "./EnhancedSummaryCards";
import { TimeReviewsChart } from "./TimeReviewsChart";
import ReviewsTable from "@/components/ReviewsTable";
import { useSelectedDateRange } from "./hooks/useSelectedDateRange";
import { useMonthlySummaryData } from "./hooks/useMonthlySummaryData";
import AIAnalysisReport from "@/components/review-analysis/AIAnalysisReport";
import { CustomPromptDialog } from "@/components/CustomPromptDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Star,
  BarChart3,
  PieChart,
  Activity,
  Target,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings
} from "lucide-react";

interface MonthlyReportProps {
  reviews: Review[];
  businessName?: string;
  businessType?: "CAFE" | "BAR" | "GALLERY";
}

const MonthlyReport = ({ 
  reviews, 
  businessName = "Current Business",
  businessType = "CAFE" 
}: MonthlyReportProps) => {
  // State for view mode (day, week, month)
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [refreshing, setRefreshing] = useState(false);
  
  // Use our custom hooks for handling date range and summary data
  const {
    dateRange,
    selectingDate,
    fromDateInput,
    toDateInput,
    dateInputError,
    dateRangePresets,
    handleDateSelect,
    setSelectingDate,
    setFromDateInput,
    setToDateInput,
    handleManualDateSubmit,
    applyDateRangePreset,
    isDateInRange
  } = useSelectedDateRange({
    initialFrom: new Date(new Date().setDate(1)), // First day of current month
    initialTo: new Date()
  });

  // Get all the selected reviews and summary data
  const {
    selectedReviews,
    summaryData,
    timeReviewsData,
    viewMode: internalViewMode,
    setViewMode: setInternalViewMode
  } = useMonthlySummaryData({ 
    reviews, 
    dateRange,
    viewMode // Pass the viewMode to the hook
  });

  // Calculate business intelligence metrics
  const businessIntelligence = useMemo(() => {
    const hasResponses = selectedReviews.filter(r => r.responseFromOwnerText).length;
    const avgResponseTime = "2.3 days"; // TODO: Calculate from actual data
    const sentimentTrend = summaryData.averageRating >= 4.2 ? "positive" : 
                         summaryData.averageRating >= 3.5 ? "neutral" : "negative";
    
    const recommendations = [];
    
    if (summaryData.averageRating < 4.0) {
      recommendations.push({
        type: "urgent",
        title: "Address Rating Concerns",
        description: "Focus on improving customer experience to boost ratings"
      });
    }
    
    if (hasResponses / selectedReviews.length < 0.5) {
      recommendations.push({
        type: "opportunity", 
        title: "Increase Response Rate",
        description: "Respond to more reviews to show customer engagement"
      });
    }

    if (summaryData.comparison.previousPeriod.change < 0) {
      recommendations.push({
        type: "attention",
        title: "Review Volume Declining", 
        description: "Consider encouraging more customer feedback"
      });
    }

    return {
      sentimentTrend,
      avgResponseTime,
      recommendations,
      responseEngagement: Math.round((hasResponses / selectedReviews.length) * 100)
    };
  }, [selectedReviews, summaryData]);

  // Refresh data function
  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh - in real app this would refetch data
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  // Business type specific insights
  const getBusinessTypeInsights = (type: string) => {
    switch (type) {
      case "CAFE":
        return {
          icon: "☕",
          focusAreas: ["Food Quality", "Service Speed", "Atmosphere", "Coffee Quality"],
          benchmarks: { averageRating: 4.2, responseRate: 45 }
        };
      case "BAR":
        return {
          icon: "🍷",
          focusAreas: ["Drink Quality", "Ambiance", "Music", "Staff Knowledge"],
          benchmarks: { averageRating: 4.1, responseRate: 35 }
        };
      case "GALLERY":
        return {
          icon: "🎨",
          focusAreas: ["Art Curation", "Space Design", "Staff Expertise", "Visitor Experience"],
          benchmarks: { averageRating: 4.3, responseRate: 60 }
        };
      default:
        return {
          icon: "🏢",
          focusAreas: ["Service Quality", "Customer Experience", "Value", "Cleanliness"],
          benchmarks: { averageRating: 4.0, responseRate: 50 }
        };
    }
  };

  const businessInsights = getBusinessTypeInsights(businessType);

  // Memoize the rendered components for better performance
  const dateSelector = useMemo(() => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>Report Period</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DateRangeSelector
          dateRange={dateRange}
          selectingDate={selectingDate}
          setSelectingDate={setSelectingDate}
          fromDateInput={fromDateInput}
          setFromDateInput={setFromDateInput}
          toDateInput={toDateInput}
          setToDateInput={setToDateInput}
          dateInputError={dateInputError}
          dateRangePresets={dateRangePresets}
          applyDateRangePreset={applyDateRangePreset}
          handleDateSelect={handleDateSelect}
          handleManualDateSubmit={handleManualDateSubmit}
          isDateInRange={isDateInRange}
        />
      </CardContent>
    </Card>
  ), [dateRange, selectingDate, fromDateInput, toDateInput, dateInputError, refreshing]);

  const enhancedSummaryCards = useMemo(() => (
    <EnhancedSummaryCards 
      summaryData={summaryData} 
      selectedReviews={selectedReviews}
      dateRange={dateRange}
      businessName={businessName}
    />
  ), [summaryData, selectedReviews, dateRange, businessName]);

  const timeChart = useMemo(() => (
    <TimeReviewsChart
      timeReviewsData={timeReviewsData}
      viewMode={internalViewMode}
      setViewMode={setViewMode}
    />
  ), [timeReviewsData, internalViewMode, setViewMode]);

  const businessIntelligenceCard = useMemo(() => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Business Intelligence & Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Business Type Insights */}
        <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{businessInsights.icon}</span>
            <div>
              <h4 className="font-medium">{businessType} Insights</h4>
              <p className="text-sm text-muted-foreground">Industry-specific metrics</p>
            </div>
          </div>
          <Badge variant="secondary">
            {businessInsights.focusAreas.length} Focus Areas
          </Badge>
        </div>

        {/* Performance vs Benchmarks */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Rating vs Benchmark</span>
              <Badge variant={summaryData.averageRating >= businessInsights.benchmarks.averageRating ? "default" : "secondary"}>
                {summaryData.averageRating >= businessInsights.benchmarks.averageRating ? "Above" : "Below"}
              </Badge>
            </div>
            <div className="text-lg font-bold">
              {summaryData.averageRating.toFixed(1)} / {businessInsights.benchmarks.averageRating}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Response vs Benchmark</span>
              <Badge variant={businessIntelligence.responseEngagement >= businessInsights.benchmarks.responseRate ? "default" : "secondary"}>
                {businessIntelligence.responseEngagement >= businessInsights.benchmarks.responseRate ? "Above" : "Below"}
              </Badge>
            </div>
            <div className="text-lg font-bold">
              {businessIntelligence.responseEngagement}% / {businessInsights.benchmarks.responseRate}%
            </div>
          </div>
        </div>

        <Separator />

        {/* Recommendations */}
        <div className="space-y-3">
          <h4 className="font-medium">Recommendations</h4>
          {businessIntelligence.recommendations.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Great work! No urgent recommendations at this time.
              </AlertDescription>
            </Alert>
          ) : (
            businessIntelligence.recommendations.map((rec, index) => (
              <Alert key={index} variant={rec.type === "urgent" ? "destructive" : "default"}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{rec.title}:</strong> {rec.description}
                </AlertDescription>
              </Alert>
            ))
          )}
        </div>

        {/* Focus Areas for Business Type */}
        <div className="space-y-2">
          <h4 className="font-medium">Key Focus Areas</h4>
          <div className="flex flex-wrap gap-2">
            {businessInsights.focusAreas.map((area, index) => (
              <Badge key={index} variant="outline">
                {area}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  ), [businessType, summaryData, businessIntelligence, businessInsights]);

  const aiAnalysis = useMemo(() => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            AI Analysis Report
          </CardTitle>
          <CustomPromptDialog />
        </div>
      </CardHeader>
      <CardContent>
        <AIAnalysisReport 
          reviews={selectedReviews} 
          dateRange={dateRange} 
          title="Monthly AI Analysis"
          className="border-0 shadow-none p-0"
        />
      </CardContent>
    </Card>
  ), [selectedReviews, dateRange]);

  const reviewsTableCard = useMemo(() => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Detailed Reviews ({selectedReviews.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ReviewsTable reviews={selectedReviews} />
      </CardContent>
    </Card>
  ), [selectedReviews]);

  return (
    <div className="space-y-8">
      {/* Date Range Selector */}
      {dateSelector}

      {/* Enhanced Summary Cards */}
      {enhancedSummaryCards}

      {/* Business Intelligence */}
      {businessIntelligenceCard}

      {/* Time Reviews Chart */}
      {timeChart}

      {/* AI Analysis Report */}
      {aiAnalysis}

      {/* Reviews Table */}
      {reviewsTableCard}
    </div>
  );
};

export default MonthlyReport;