
import React, { useState } from "react";
import { Review } from "@/types/reviews";
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getChartData } from "@/utils/reviewDataUtils";

interface MonthlyReviewsChartProps {
  reviews: Review[];
  className?: string;
}

const MonthlyReviewsChart: React.FC<MonthlyReviewsChartProps> = ({ reviews, className }) => {
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  
  // Get monthly review data with cumulative counts
  const monthlyReviews = getChartData(reviews);
  
  // Find the maximum cumulative count for Y-axis scaling
  const maxCumulativeCount = monthlyReviews.length > 0 
    ? Math.max(...monthlyReviews.map(item => item.cumulativeCount || 0)) + 10
    : 10;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">Cumulative Reviews</CardTitle>
        <ToggleGroup 
          type="single" 
          value={chartType} 
          onValueChange={(value) => value && setChartType(value as "line" | "bar")}
          className="border rounded-md p-1"
        >
          <ToggleGroupItem value="line" size="sm" className="text-xs px-3">Line</ToggleGroupItem>
          <ToggleGroupItem value="bar" size="sm" className="text-xs px-3">Bar</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "line" ? (
              <LineChart
                data={monthlyReviews}
                margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis 
                  dataKey="month" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70} 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  allowDecimals={false} 
                  domain={[0, maxCumulativeCount]}
                />
                <Tooltip 
                  formatter={(value) => [`${value} total reviews`, "Total Reviews"]}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    borderRadius: "6px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="cumulativeCount" 
                  stroke="#3b82f6" 
                  activeDot={{ r: 8 }} 
                  name="Cumulative"
                  strokeWidth={2}
                />
              </LineChart>
            ) : (
              <BarChart
                data={monthlyReviews}
                margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis 
                  dataKey="month" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70} 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  allowDecimals={false} 
                  domain={[0, maxCumulativeCount]}
                />
                <Tooltip 
                  formatter={(value) => [`${value} total reviews`, "Total Reviews"]}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    borderRadius: "6px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="cumulativeCount" 
                  fill="#3b82f6" 
                  name="Cumulative"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyReviewsChart;
