
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, parseISO, startOfWeek, endOfWeek, addWeeks, eachWeekOfInterval } from "date-fns";
import { CalendarRange, List, BarChart2 } from "lucide-react";
import { countReviewsByRating, calculateAverageRating } from "@/utils/dataUtils";
import { Review } from "@/types/reviews";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface MonthlyReportProps {
  reviews: Review[];
}

const MonthlyReport = ({ reviews }: MonthlyReportProps) => {
  // View mode (daily or weekly)
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");
  
  // Date range state
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  
  // Time period reviews data
  const [timeReviewsData, setTimeReviewsData] = useState<{
    date: string;
    count: number;
  }[]>([]);
  
  // Selected reviews (for the date range)
  const [selectedReviews, setSelectedReviews] = useState<Review[]>([]);
  
  // Filtered reviews summary data
  const [summaryData, setSummaryData] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: [] as { name: string; value: number }[]
  });

  // Colors for the charts
  const COLORS = ['#FF5252', '#FF9800', '#FFC107', '#8BC34A', '#4CAF50'];
  
  // Process filtered data based on date range
  useEffect(() => {
    if (!reviews.length) return;

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
    
    setSummaryData({
      totalReviews,
      averageRating,
      ratingDistribution
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
  }, [reviews, dateRange, viewMode]);

  return (
    <div className="space-y-6">
      {/* Date range selector at the top of the page */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reviews Analysis</h2>
          <p className="text-muted-foreground">
            Analysis for period: {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarRange className="mr-2 h-4 w-4" />
                <span>
                  {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  if (range && range.from && range.to) {
                    setDateRange(range as { from: Date; to: Date });
                  }
                }}
                numberOfMonths={2}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

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
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70} 
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip />
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
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
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

      {/* Reviews list section */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
          <CardDescription>
            {selectedReviews.length} reviews for the selected date range ({format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedReviews.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No reviews found for the selected date range</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reviewer</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Review</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedReviews.map((review, index) => (
                    <TableRow key={index}>
                      <TableCell className="whitespace-nowrap">
                        {format(parseISO(review.publishedAtDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{review.name}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center">
                          {review.star} <span className="text-yellow-500 ml-1">★</span>
                        </span>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="line-clamp-3">{review.text}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyReport;
