import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Review } from "@/types/reviews";
import { useMemo, useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface ReviewsChartProps {
  reviews: Review[];
}

const ReviewsChart = ({ reviews }: ReviewsChartProps) => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const chartData = useMemo(() => {
    if (!reviews?.length) return [];

    // Group reviews by month
    const monthlyData: Record<string, { count: number; avgRating: number; totalRating: number }> = {};

    reviews.forEach((review) => {
      const date = new Date(review.publishedAtDate);
      const monthKey = format(date, "yyyy-MM");

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { count: 0, avgRating: 0, totalRating: 0 };
      }

      monthlyData[monthKey].count++;
      monthlyData[monthKey].totalRating += review.stars;
    });

    // Convert to array and calculate average rating
    const data = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        displayMonth: format(new Date(month + "-01"), isMobile ? "MMM" : "MMM yyyy"),
        count: data.count,
        avgRating: parseFloat((data.totalRating / data.count).toFixed(2)),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Only show last 12 months on mobile, all data on desktop
    if (isMobile && data.length > 6) {
      return data.slice(-6);
    }

    return data;
  }, [reviews, isMobile]);

  if (!chartData.length) {
    return (
      <Card className="shadow-md border-0 dark:bg-gray-800">
        <CardHeader>
          <CardTitle>Reviews Over Time</CardTitle>
          <CardDescription>Monthly review count and average rating</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] sm:h-[350px] flex items-center justify-center text-muted-foreground">
            No data to display
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md border-0 dark:bg-gray-800">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg sm:text-xl">Reviews Over Time</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {isMobile ? "Last 6 months" : "Monthly review count and average rating"}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="h-[250px] sm:h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: isMobile ? 5 : 30,
                left: isMobile ? -10 : 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="displayMonth"
                tick={{ fontSize: isMobile ? 10 : 12 }}
                angle={isMobile ? -45 : 0}
                textAnchor={isMobile ? "end" : "middle"}
                height={isMobile ? 60 : 30}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: isMobile ? 10 : 12 }}
                width={isMobile ? 30 : 40}
              />
              {!isMobile && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fontSize: 12 }}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: isMobile ? "12px" : "14px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: isMobile ? 3 : 4 }}
                activeDot={{ r: isMobile ? 5 : 8 }}
                name="Reviews"
              />
              {!isMobile && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgRating"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 8 }}
                  name="Avg Rating"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        {isMobile && (
          <div className="mt-4 flex justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Review Count</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewsChart;
