
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, parseISO, 
         startOfWeek, endOfWeek, addWeeks, eachWeekOfInterval, differenceInDays,
         subMonths, startOfDay, endOfDay, startOfYear, endOfYear, parse, isValid } from "date-fns";
import { CalendarRange, List, BarChart2, TrendingUp, TrendingDown, Minus, Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import { countReviewsByRating, calculateAverageRating, getOverallAnalysis } from "@/utils/dataUtils";
import { Review } from "@/types/reviews";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import ReviewsTable from "@/components/ReviewsTable";

interface MonthlyReportProps {
  reviews: Review[];
}

const MonthlyReport = ({ reviews }: MonthlyReportProps) => {
  // View mode (daily or weekly)
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");
  
  // Date range state
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date | undefined;
  }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  // Track which date we're currently selecting (start or end)
  const [selectingDate, setSelectingDate] = useState<'from' | 'to'>('from');
  
  // For manual date inputs
  const [fromDateInput, setFromDateInput] = useState(format(dateRange.from, "yyyy-MM-dd"));
  const [toDateInput, setToDateInput] = useState(dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : "");
  const [dateInputError, setDateInputError] = useState("");
  
  // Time period reviews data
  const [timeReviewsData, setTimeReviewsData] = useState<{
    date: string;
    day: string;
    count: number;
  }[]>([]);
  
  // Selected reviews (for the date range)
  const [selectedReviews, setSelectedReviews] = useState<Review[]>([]);
  
  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalysisLoading, setIsAnalysisLoading] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
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

  // Date range preset options
  const dateRangePresets = [
    { 
      name: "This Month", 
      range: () => ({ 
        from: startOfMonth(new Date()), 
        to: endOfMonth(new Date()) 
      })
    },
    { 
      name: "Last Month", 
      range: () => {
        const lastMonth = subMonths(new Date(), 1);
        return { 
          from: startOfMonth(lastMonth), 
          to: endOfMonth(lastMonth) 
        };
      }
    },
    { 
      name: "Last 30 Days", 
      range: () => ({ 
        from: startOfDay(subMonths(new Date(), 1)), 
        to: endOfDay(new Date()) 
      })
    },
    { 
      name: "This Year", 
      range: () => ({ 
        from: startOfYear(new Date()), 
        to: endOfYear(new Date()) 
      })
    }
  ];

  // Update input fields when dateRange changes
  useEffect(() => {
    setFromDateInput(format(dateRange.from, "yyyy-MM-dd"));
    if (dateRange.to) {
      setToDateInput(format(dateRange.to, "yyyy-MM-dd"));
    }
  }, [dateRange]);

  // Apply preset date range
  const applyDateRangePreset = (presetIndex: number) => {
    const newRange = dateRangePresets[presetIndex].range();
    setDateRange(newRange);
  };

  // Handle date selection in calendar
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    // If we're selecting the 'from' date
    if (selectingDate === 'from') {
      // If the selected date is after the end date, adjust the end date
      if (dateRange.to && date > dateRange.to) {
        setDateRange({ from: date, to: undefined });
      } else {
        setDateRange({ ...dateRange, from: date });
      }
      // Toggle to selecting the 'to' date
      setSelectingDate('to');
    } 
    // If we're selecting the 'to' date
    else {
      // If the selected date is before the start date, we're actually reselecting the start date
      if (date < dateRange.from) {
        setDateRange({ from: date, to: dateRange.from });
      } else {
        setDateRange({ ...dateRange, to: date });
      }
      // Toggle to selecting the 'from' date
      setSelectingDate('from');
    }
  };

  // Handle manual date input submission
  const handleManualDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDateInputError("");
    
    try {
      // Parse the input dates
      const fromDate = parse(fromDateInput, "yyyy-MM-dd", new Date());
      const toDate = toDateInput ? parse(toDateInput, "yyyy-MM-dd", new Date()) : undefined;
      
      // Validate the dates
      if (!isValid(fromDate)) {
        setDateInputError("Invalid start date format");
        return;
      }
      
      if (toDateInput && !isValid(toDate)) {
        setDateInputError("Invalid end date format");
        return;
      }
      
      if (toDate && fromDate > toDate) {
        setDateInputError("Start date cannot be after end date");
        return;
      }
      
      // Set the new date range
      setDateRange({
        from: fromDate,
        to: toDate
      });
    } catch (error) {
      setDateInputError("Error parsing dates. Please use YYYY-MM-DD format.");
    }
  };

  // Handle refresh analysis
  const handleRefreshAnalysis = async () => {
    if (selectedReviews.length === 0) {
      setAnalysisError("No reviews available for analysis in the selected date range.");
      return;
    }
    
    setIsAnalysisLoading(true);
    setAnalysisError(null);
    
    try {
      // Clear analysis cache to force a fresh analysis
      localStorage.removeItem("analysis_cache_key");
      
      const analysis = await getOverallAnalysis(selectedReviews);
      setAiAnalysis(analysis);
    } catch (error) {
      console.error("Error fetching AI analysis:", error);
      setAnalysisError("Could not retrieve AI analysis. Please try again later.");
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  // Colors for the charts
  const COLORS = ['#FF5252', '#FF9800', '#FFC107', '#8BC34A', '#4CAF50'];
  
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

    // Generate time-based data (daily or weekly)
    if (viewMode === "daily") {
      // Generate all days in the range
      const allDays = eachDayOfInterval({
        start: dateRange.from,
        end: dateRange.to
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
    } else {
      // Weekly view
      // Generate all weeks in the range
      const allWeeks = eachWeekOfInterval({
        start: dateRange.from,
        end: dateRange.to
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
    }
    
    // Get AI analysis for the filtered reviews
    if (filteredReviews.length > 0) {
      handleRefreshAnalysis();
    } else {
      setAiAnalysis("");
    }
  }, [reviews, dateRange, viewMode]);

  // Helper function to create date modifier to highlight the range
  const createDateModifier = (dateRange: { from: Date; to: Date | undefined }) => {
    return (date: Date) => {
      if (!dateRange.to) {
        return date.getTime() === dateRange.from.getTime();
      }
      return isWithinInterval(date, { start: dateRange.from, end: dateRange.to });
    };
  };

  // Create a date modifier for the selected range
  const isDateInRange = createDateModifier(dateRange);

  // Get the AI provider and model information
  const aiProvider = localStorage.getItem("AI_PROVIDER") || "openai";
  let aiModel = "";
  
  switch (aiProvider) {
    case "openai":
      aiModel = localStorage.getItem("OPENAI_MODEL") || "gpt-4o-mini";
      break;
    case "anthropic":
      aiModel = localStorage.getItem("ANTHROPIC_MODEL") || "claude-3-haiku-20240307";
      break;
    case "gemini":
      aiModel = localStorage.getItem("GEMINI_MODEL") || "gemini-1.5-flash";
      break;
  }

  return (
    <div className="space-y-6">
      {/* Date range selector at the top of the page */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reviews Analysis</h2>
          <p className="text-muted-foreground">
            Analysis for period: {format(dateRange.from, "MMM d, yyyy")} - {dateRange.to ? format(dateRange.to, "MMM d, yyyy") : "Select end date"}
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarRange className="mr-2 h-4 w-4" />
                <span>
                  {format(dateRange.from, "MMM d, yyyy")} - {dateRange.to ? format(dateRange.to, "MMM d, yyyy") : "Select end date"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-2 border-b">
                <div className="flex justify-center flex-wrap gap-1 mb-2">
                  {dateRangePresets.map((preset, index) => (
                    <Button 
                      key={preset.name} 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => applyDateRangePreset(index)}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-center text-muted-foreground mb-1">
                  Currently selecting: {selectingDate === 'from' ? 'Start date' : 'End date'}
                </p>
              </div>
              <div className="flex justify-between p-2 border-b">
                <form onSubmit={handleManualDateSubmit} className="flex flex-col space-y-2 w-full">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Start date</p>
                      <Input 
                        type="date" 
                        value={fromDateInput} 
                        onChange={(e) => setFromDateInput(e.target.value)}
                        placeholder="YYYY-MM-DD"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">End date</p>
                      <Input 
                        type="date" 
                        value={toDateInput} 
                        onChange={(e) => setToDateInput(e.target.value)}
                        placeholder="YYYY-MM-DD"
                        className="h-8 text-xs"
                      />
                    </div>
                    <Button type="submit" size="sm" className="h-8">Apply</Button>
                  </div>
                  {dateInputError && (
                    <p className="text-xs text-red-500">{dateInputError}</p>
                  )}
                </form>
              </div>
              <Calendar
                mode="single"
                defaultMonth={dateRange.from}
                selected={selectingDate === 'from' ? dateRange.from : dateRange.to}
                onSelect={handleDateSelect}
                numberOfMonths={2}
                className={cn("p-3 pointer-events-auto")}
                modifiers={{ range: isDateInRange }}
                modifiersStyles={{
                  range: { backgroundColor: "hsl(var(--primary) / 0.1)" }
                }}
                footer={
                  <p className="pt-2 text-xs text-center text-muted-foreground">
                    {dateRange.from && format(dateRange.from, "MMM d, yyyy")} - {dateRange.to ? format(dateRange.to, "MMM d, yyyy") : "Select end date"}
                  </p>
                }
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Summary</CardTitle>
            <CardDescription>Selected date range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Reviews</p>
                <p className="text-2xl font-bold">{summaryData.totalReviews}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center text-sm">
                    <span className="inline-flex items-center mr-1">
                      {summaryData.comparison.previousPeriod.change > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      ) : summaryData.comparison.previousPeriod.change < 0 ? (
                        <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                      ) : (
                        <Minus className="h-3 w-3 text-gray-500 mr-1" />
                      )}
                      {summaryData.comparison.previousPeriod.change > 0 ? '+' : ''}
                      {summaryData.comparison.previousPeriod.change}
                    </span>
                    <span className="text-muted-foreground text-xs">vs previous period</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center text-sm">
                    <span className="inline-flex items-center mr-1">
                      {summaryData.comparison.previousYear.change > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      ) : summaryData.comparison.previousYear.change < 0 ? (
                        <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                      ) : (
                        <Minus className="h-3 w-3 text-gray-500 mr-1" />
                      )}
                      {summaryData.comparison.previousYear.change > 0 ? '+' : ''}
                      {summaryData.comparison.previousYear.change}
                    </span>
                    <span className="text-muted-foreground text-xs">vs same period last year</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold">
                  {summaryData.averageRating.toFixed(1)}
                  <span className="text-yellow-500 ml-1">★</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Rating Distribution</CardTitle>
            <CardDescription>Breakdown by star rating</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={summaryData.ratingDistribution}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value} reviews`, 'Count']}
                    contentStyle={{ borderRadius: '6px' }}
                  />
                  <Legend />
                  <Bar dataKey="value" name="Count">
                    {summaryData.ratingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>AI Analysis</CardTitle>
            <CardDescription>
              Insights for the selected date range ({selectedReviews.length} reviews)
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshAnalysis} 
            disabled={isAnalysisLoading || selectedReviews.length === 0}
            className="ml-2"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isAnalysisLoading && "animate-spin")} />
            Refresh Analysis
          </Button>
        </CardHeader>
        <CardContent>
          {isAnalysisLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[80%]" />
              <Skeleton className="h-4 w-[85%]" />
              <Skeleton className="h-4 w-[70%]" />
            </div>
          ) : analysisError ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Analysis Error</AlertTitle>
              <AlertDescription>{analysisError}</AlertDescription>
            </Alert>
          ) : aiAnalysis ? (
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-line">
              <div className="text-xs text-muted-foreground mb-2">
                Generated with {aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)} {aiModel}
              </div>
              {aiAnalysis}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              {selectedReviews.length === 0 
                ? "No reviews available in the selected date range for analysis" 
                : "Click 'Refresh Analysis' to generate insights"}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Review Summary</CardTitle>
              <CardDescription>
                Review count by {viewMode === "daily" ? "day" : "week"} for selected date range
              </CardDescription>
            </div>
            <div className="flex flex-col md:flex-row gap-2 mt-2 md:mt-0">
              <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as "daily" | "weekly")}>
                <ToggleGroupItem value="daily" aria-label="Daily view">
                  <List className="h-4 w-4 mr-1" />
                  Daily
                </ToggleGroupItem>
                <ToggleGroupItem value="weekly" aria-label="Weekly view">
                  <BarChart2 className="h-4 w-4 mr-1" />
                  Weekly
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={timeReviewsData}
                margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey={(data) => `${data.date} (${data.day.substring(0, 3)})`} 
                  angle={-45} 
                  textAnchor="end" 
                  height={70} 
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name, props) => {
                    return [`${value} reviews`, 'Reviews'];
                  }}
                  labelFormatter={(label) => {
                    // Check if the label contains the day part
                    if (typeof label === 'string' && label.includes('(')) {
                      // Extract just the date part before the day
                      return label;
                    }
                    return label;
                  }}
                  contentStyle={{ borderRadius: '6px' }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#6366F1" 
                  name="Reviews"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Reviews section - Now using the ReviewsTable component instead of the simple table */}
      <ReviewsTable reviews={selectedReviews} />
    </div>
  );
};

export default MonthlyReport;
