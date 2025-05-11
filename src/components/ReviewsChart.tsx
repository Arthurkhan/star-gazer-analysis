
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
          <ToggleGroupItem value="line" size="sm" className="text-xs px-3">Line</ToggleGroupItem>
          <ToggleGroupItem value="bar" size="sm" className="text-xs px-3">Bar</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent className="pt-2">
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
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  angle={-60} 
                  textAnchor="end" 
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => [`${value} reviews`, 'Count']}
                  labelFormatter={(label) => `${label}`}
                  contentStyle={{ borderRadius: '6px' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Reviews"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
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
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  angle={-60} 
                  textAnchor="end" 
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => [`${value} reviews`, 'Count']}
                  labelFormatter={(label) => `${label}`}
                  contentStyle={{ borderRadius: '6px' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar 
                  dataKey="count" 
                  name="Reviews" 
                  fill="#8884d8" 
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

export default ReviewsChart;
