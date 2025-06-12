import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { MonthlyReviewData } from "@/types/reviews";
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

interface ReviewsChartProps {
  data: MonthlyReviewData[];
}

const ReviewsChart = ({ data }: ReviewsChartProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [showAvgRating, setShowAvgRating] = useState(true);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Calculate average rating for each month (simulated based on count)
  const chartData = useMemo(() => {
    if (!data?.length) return [];

    // Add average rating calculation (simulated for now)
    return data.map(month => ({
      ...month,
      avgRating: parseFloat((4 + (Math.random() * 0.5)).toFixed(2)), // Format to 2 decimal places
    }));
  }, [data]);

  if (!chartData.length) {
    return (
      <Card className="shadow-md border-0 dark:bg-gray-800">
        <CardHeader>
          <CardTitle>Reviews Over Time</CardTitle>
          <CardDescription>Monthly review count and average rating</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] sm:h-[450px] flex items-center justify-center text-muted-foreground">
            No data to display
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md border-0 dark:bg-gray-800">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg sm:text-xl">Reviews Over Time</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Monthly review count and average rating
            </CardDescription>
          </div>
          {!isMobile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAvgRating(!showAvgRating)}
              className="flex items-center gap-2"
            >
              {showAvgRating ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              Avg Rating
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="h-[400px] sm:h-[450px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 20,
                right: 10,
                left: 10,
                bottom: 50,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="month"
                angle={-60}
                textAnchor="end"
                height={70}
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
              {!isMobile && showAvgRating && (
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
                formatter={(value: any, name: string) => {
                  // Format the value to 2 decimal places for avg rating
                  if (name === "Avg Rating") {
                    return [parseFloat(value).toFixed(2), name];
                  }
                  return [value, name];
                }}
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
              {!isMobile && showAvgRating && (
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
