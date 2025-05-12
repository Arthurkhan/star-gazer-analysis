
import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay, startOfYear, endOfYear } from "date-fns";
import { Review } from "@/types/reviews";
import { DateRangeSelector } from "./DateRangeSelector";
import { SummaryCards } from "./SummaryCards";
import { AiAnalysisCard } from "./AiAnalysisCard";
import { TimeReviewsChart } from "./TimeReviewsChart";
import ReviewsTable from "@/components/ReviewsTable";
import { useSelectedDateRange } from "./hooks/useSelectedDateRange";
import { useMonthlySummaryData } from "./hooks/useMonthlySummaryData";

interface MonthlyReportProps {
  reviews: Review[];
}

const MonthlyReport = ({ reviews }: MonthlyReportProps) => {
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");

  // Use our custom hooks for handling date range and summary data
  const {
    dateRange,
    setDateRange,
    selectingDate,
    setSelectingDate,
    fromDateInput,
    setFromDateInput,
    toDateInput,
    setToDateInput,
    dateInputError,
    setDateInputError,
    handleDateSelect,
    handleManualDateSubmit,
    applyDateRangePreset,
    dateRangePresets,
    isDateInRange
  } = useSelectedDateRange({
    initialFrom: startOfMonth(new Date()),
    initialTo: endOfMonth(new Date())
  });

  // Get all the selected reviews and summary data
  const {
    selectedReviews,
    summaryData,
    timeReviewsData,
    setSelectedReviews,
    setSummaryData,
    setTimeReviewsData
  } = useMonthlySummaryData({ reviews, dateRange, viewMode });

  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalysisLoading, setIsAnalysisLoading] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Date range selector */}
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

      {/* Summary Cards */}
      <SummaryCards summaryData={summaryData} />

      {/* AI Analysis Card */}
      <AiAnalysisCard
        selectedReviews={selectedReviews}
        aiAnalysis={aiAnalysis}
        setAiAnalysis={setAiAnalysis}
        isAnalysisLoading={isAnalysisLoading}
        setIsAnalysisLoading={setIsAnalysisLoading}
        analysisError={analysisError}
        setAnalysisError={setAnalysisError}
      />

      {/* Time Reviews Chart */}
      <TimeReviewsChart
        timeReviewsData={timeReviewsData}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Reviews Table */}
      <ReviewsTable reviews={selectedReviews} />
    </div>
  );
};

export default MonthlyReport;
