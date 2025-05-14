
import { useState, useEffect } from "react";
import { Review } from "@/types/reviews";
import { 
  countReviewsByRating, 
  calculateAverageRating
} from "@/utils/dataUtils";
import { 
  parseISO, 
  isWithinInterval, 
  differenceInDays, 
  eachDayOfInterval, 
  format, 
  eachWeekOfInterval, 
  endOfWeek,
  eachMonthOfInterval,
  endOfMonth
} from "date-fns";

interface UseMonthlySummaryDataProps {
  reviews: Review[];
  dateRange: {
    from: Date;
    to: Date | undefined;
  };
  viewMode: "day" | "week" | "month";
}

export function useMonthlySummaryData({ reviews, dateRange, viewMode = "day" }: UseMonthlySummaryDataProps) {
  // Selected reviews (for the date range)
  const [selectedReviews, setSelectedReviews] = useState<Review[]>([]);
  
  // Calculate the internal viewMode based on the prop
  // This maps the MonthlyReport viewMode to the internal viewMode
  const [internalViewMode, setInternalViewMode] = useState<"daily" | "weekly" | "monthly">(
    viewMode === "day" ? "daily" : viewMode === "week" ? "weekly" : "monthly"
  );
  
  // Set internal view mode when prop changes
  useEffect(() => {
    if (viewMode === "day") setInternalViewMode("daily");
    else if (viewMode === "week") setInternalViewMode("weekly");
    else if (viewMode === "month") setInternalViewMode("monthly");
  }, [viewMode]);
  
  // Time period reviews data
  const [timeReviewsData, setTimeReviewsData] = useState<{
    date: string;
    day: string;
    count: number;
  }[]>([]);
  
  // Filtered reviews summary data
  const [summaryData, setSummaryData] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: [] as { name: string; value: number }[],
    comparison: {
      previousPeriod: {
        change: 0,
        percentage: 0,
        totalReviews: 0,
      },
      previousYear: {
        change: 0,
        percentage: 0,
        totalReviews: 0,
      }
    }
  });

  // Process filtered data based on date range
  useEffect(() => {
    if (!reviews.length || !dateRange.to) return;

    // Filter reviews within the selected date range
    const filteredReviews = reviews.filter(review => {
      const reviewDate = parseISO(review.publishedAtDate);
      return isWithinInterval(reviewDate, { start: dateRange.from, end: dateRange.to });
    });

    // Set the selected reviews for the table at the bottom
    setSelectedReviews(filteredReviews);
    
    // Calculate summary data
    const totalReviews = filteredReviews.length;
    const averageRating = calculateAverageRating(filteredReviews);
    const ratingCounts = countReviewsByRating(filteredReviews);
    const ratingDistribution = [1, 2, 3, 4, 5].map(star => ({
      name: `${star} ★`,
      value: ratingCounts[star] || 0
    }));
    
    // Calculate previous period comparison
    const daysDifference = differenceInDays(dateRange.to, dateRange.from) + 1;
    const previousPeriodFrom = new Date(dateRange.from);
    previousPeriodFrom.setDate(previousPeriodFrom.getDate() - daysDifference);
    const previousPeriodTo = new Date(dateRange.from);
    previousPeriodTo.setDate(previousPeriodTo.getDate() - 1);
    
    const previousPeriodReviews = reviews.filter(review => {
      const reviewDate = parseISO(review.publishedAtDate);
      return isWithinInterval(reviewDate, { 
        start: previousPeriodFrom, 
        end: previousPeriodTo 
      });
    });
    
    // Calculate previous year comparison (same date range, but one year ago)
    const previousYearFrom = new Date(dateRange.from);
    previousYearFrom.setFullYear(previousYearFrom.getFullYear() - 1);
    const previousYearTo = new Date(dateRange.to);
    previousYearTo.setFullYear(previousYearTo.getFullYear() - 1);
    
    const previousYearReviews = reviews.filter(review => {
      const reviewDate = parseISO(review.publishedAtDate);
      return isWithinInterval(reviewDate, { 
        start: previousYearFrom, 
        end: previousYearTo 
      });
    });
    
    // Calculate changes
    const previousPeriodCount = previousPeriodReviews.length;
    const previousYearCount = previousYearReviews.length;
    
    const previousPeriodChange = totalReviews - previousPeriodCount;
    const previousYearChange = totalReviews - previousYearCount;
    
    const previousPeriodPercentage = previousPeriodCount === 0 
      ? (totalReviews > 0 ? 100 : 0) 
      : (previousPeriodChange / previousPeriodCount) * 100;
      
    const previousYearPercentage = previousYearCount === 0 
      ? (totalReviews > 0 ? 100 : 0) 
      : (previousYearChange / previousYearCount) * 100;
    
    setSummaryData({
      totalReviews,
      averageRating,
      ratingDistribution,
      comparison: {
        previousPeriod: {
          change: previousPeriodChange,
          percentage: previousPeriodPercentage,
          totalReviews: previousPeriodCount
        },
        previousYear: {
          change: previousYearChange,
          percentage: previousYearPercentage,
          totalReviews: previousYearCount
        }
      }
    });

    // Generate time-based data based on the current viewMode
    generateTimeBasedData(filteredReviews);
  }, [reviews, dateRange]);

  // Update time-based data when viewMode changes
  useEffect(() => {
    if (!reviews.length || !dateRange.to) return;
    
    const filteredReviews = reviews.filter(review => {
      const reviewDate = parseISO(review.publishedAtDate);
      return isWithinInterval(reviewDate, { start: dateRange.from, end: dateRange.to });
    });
    
    generateTimeBasedData(filteredReviews);
  }, [internalViewMode]);

  // Helper function to generate time-based data
  const generateTimeBasedData = (filteredReviews: Review[]) => {
    if (internalViewMode === "daily") {
      // Generate all days in the range
      const allDays = eachDayOfInterval({
        start: dateRange.from,
        end: dateRange.to!
      });

      // Initialize counts for each day
      const dailyCounts = allDays.map(day => ({
        date: format(day, 'MMM dd'),
        day: format(day, 'EEEE'), // Add day of week
        count: 0
      }));

      // Count reviews for each day
      filteredReviews.forEach(review => {
        const reviewDate = parseISO(review.publishedAtDate);
        const dayIndex = allDays.findIndex(day => 
          day.getDate() === reviewDate.getDate() && 
          day.getMonth() === reviewDate.getMonth() &&
          day.getFullYear() === reviewDate.getFullYear()
        );
        if (dayIndex !== -1) {
          dailyCounts[dayIndex].count += 1;
        }
      });

      setTimeReviewsData(dailyCounts);
    } else if (internalViewMode === "weekly") {
      // Weekly view
      // Generate all weeks in the range
      const allWeeks = eachWeekOfInterval({
        start: dateRange.from,
        end: dateRange.to!
      });

      // Initialize counts for each week
      const weeklyCounts = allWeeks.map(weekStart => {
        const weekEnd = endOfWeek(weekStart);
        return {
          date: `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd')}`,
          day: `${format(weekStart, 'EEEE')} - ${format(weekEnd, 'EEEE')}`, // Add day of week
          count: 0
        };
      });

      // Count reviews for each week
      filteredReviews.forEach(review => {
        const reviewDate = parseISO(review.publishedAtDate);
        const weekIndex = allWeeks.findIndex(weekStart => 
          isWithinInterval(reviewDate, { 
            start: weekStart, 
            end: endOfWeek(weekStart)
          })
        );
        if (weekIndex !== -1) {
          weeklyCounts[weekIndex].count += 1;
        }
      });

      setTimeReviewsData(weeklyCounts);
    } else {
      // Monthly view
      // Generate all months in the range
      const allMonths = eachMonthOfInterval({
        start: dateRange.from,
        end: dateRange.to!
      });

      // Initialize counts for each month
      const monthlyCounts = allMonths.map(monthStart => {
        const monthEnd = endOfMonth(monthStart);
        return {
          date: format(monthStart, 'MMM yyyy'),
          day: `${format(monthStart, 'MMM')}`, // Just the month name
          count: 0
        };
      });

      // Count reviews for each month
      filteredReviews.forEach(review => {
        const reviewDate = parseISO(review.publishedAtDate);
        const monthIndex = allMonths.findIndex(monthStart => 
          reviewDate.getMonth() === monthStart.getMonth() && 
          reviewDate.getFullYear() === monthStart.getFullYear()
        );
        if (monthIndex !== -1) {
          monthlyCounts[monthIndex].count += 1;
        }
      });

      setTimeReviewsData(monthlyCounts);
    }
  };

  // Function to map MonthlyReport viewMode to internal viewMode
  const setViewMode = (mode: "day" | "week" | "month") => {
    if (mode === "day") setInternalViewMode("daily");
    else if (mode === "week") setInternalViewMode("weekly");
    else if (mode === "month") setInternalViewMode("monthly");
  };

  return {
    selectedReviews,
    summaryData,
    timeReviewsData,
    viewMode: internalViewMode,
    setViewMode,
    setSelectedReviews,
    setSummaryData,
    setTimeReviewsData
  };
}
