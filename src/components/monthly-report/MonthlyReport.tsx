
import { useMemo, useState } from "react";
import { Review } from "@/types/reviews";
import { DateRangeSelector } from "./DateRangeSelector";
import { SummaryCards } from "./SummaryCards";
import { TimeReviewsChart } from "./TimeReviewsChart";
import ReviewsTable from "@/components/ReviewsTable";
import { useSelectedDateRange } from "./hooks/useSelectedDateRange";
import { useMonthlySummaryData } from "./hooks/useMonthlySummaryData";
import AIAnalysisReport from "@/components/review-analysis/AIAnalysisReport";

interface MonthlyReportProps {
  reviews: Review[];
}

const MonthlyReport = ({ reviews }: MonthlyReportProps) => {
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
    viewMode,
    setViewMode
  } = useMonthlySummaryData({ 
    reviews, 
    dateRange
  });

  // Memoize the rendered components for better performance
  const dateSelector = useMemo(() => (
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
  ), [dateRange, selectingDate, fromDateInput, toDateInput, dateInputError]);

  const summaryCards = useMemo(() => (
    <SummaryCards summaryData={summaryData} />
  ), [summaryData]);

  const timeChart = useMemo(() => (
    <TimeReviewsChart
      timeReviewsData={timeReviewsData}
      viewMode={viewMode}
      setViewMode={setViewMode}
    />
  ), [timeReviewsData, viewMode, setViewMode]);

  const aiAnalysis = useMemo(() => (
    <AIAnalysisReport 
      reviews={selectedReviews} 
      dateRange={dateRange} 
      title="Monthly AI Analysis"
      className="mb-6"
    />
  ), [selectedReviews, dateRange]);

  return (
    <div className="space-y-6">
      {/* Date range selector */}
      {dateSelector}

      {/* Summary Cards */}
      {summaryCards}

      {/* AI Analysis Report */}
      {aiAnalysis}

      {/* Time Reviews Chart */}
      {timeChart}

      {/* Reviews Table */}
      <ReviewsTable reviews={selectedReviews} />
    </div>
  );
};

export default MonthlyReport;
