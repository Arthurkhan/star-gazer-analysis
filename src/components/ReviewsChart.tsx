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
        month: format(new Date(month + "-01"), "MMM yyyy"), // Same format as cumulative chart
        count: data.count,
        avgRating: parseFloat((data.totalRating / data.count).toFixed(2)),
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    return data;
  }, [reviews]);

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
          Monthly review count and average rating
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 20,
                right: 10,
                left: 10,
                bottom: 35,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="month"
                angle={-60}
                textAnchor="end"
                height={50}
                tick={{ fontSize: 11 }}
                tickLine={{ stroke: '#ccc' }}
                axisLine={{ stroke: '#ccc' }}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#ccc' }}
                axisLine={{ stroke: '#ccc' }}
              />
              {!isMobile && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#ccc' }}
                  axisLine={{ stroke: '#ccc' }}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 1, fill: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
                name="Reviews"
              />
              {!isMobile && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgRating"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 1, fill: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#f59e0b' }}
                  name="Avg Rating"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewsChart;
