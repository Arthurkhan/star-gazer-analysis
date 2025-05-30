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
import { 
  Calendar, 
  MessageSquare, 
  Activity,
  RefreshCw,
} from "lucide-react";

interface MonthlyReportProps {
  reviews: Review[];
  businessName?: string;
}

const MonthlyReport = ({ 
  reviews, 
  businessName = "Current Business"
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

  // Refresh data function
  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh - in real app this would refetch data
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

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