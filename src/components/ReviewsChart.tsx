
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { MonthlyReviewData } from "@/types/reviews";

interface ReviewsChartProps {
  data: MonthlyReviewData[];
}

const ReviewsChart = ({ data }: ReviewsChartProps) => {
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  
  return (
    <Card className="col-span-2 shadow-md border-0 dark:bg-gray-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">Reviews Timeline</CardTitle>
        <ToggleGroup type="single" value={chartType} onValueChange={(value) => value && setChartType(value as "line" | "bar")}>
          <ToggleGroupItem value="line">Line Chart</ToggleGroupItem>
          <ToggleGroupItem value="bar">Bar Chart</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "line" ? (
              <LineChart
                data={data}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  angle={-60} 
                  textAnchor="end" 
                  height={80}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} reviews`, 'Count']}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Reviews"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            ) : (
              <BarChart
                data={data}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  angle={-60} 
                  textAnchor="end" 
                  height={80}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} reviews`, 'Count']}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend />
                <Bar 
                  dataKey="count" 
                  name="Reviews" 
                  fill="#8884d8" 
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewsChart;
