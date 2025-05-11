
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
    <Card className="col-span-full shadow-md border-0 dark:bg-gray-800 overflow-hidden transition-all duration-300 hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750">
        <CardTitle className="text-md font-medium">Reviews Timeline</CardTitle>
        <ToggleGroup 
          type="single" 
          value={chartType} 
          onValueChange={(value) => value && setChartType(value as "line" | "bar")}
          className="border rounded-md p-1 bg-white dark:bg-gray-700 shadow-sm"
        >
          <ToggleGroupItem value="line" size="sm" className="text-xs px-3 data-[state=on]:bg-primary/10 data-[state=on]:text-primary">Line</ToggleGroupItem>
          <ToggleGroupItem value="bar" size="sm" className="text-xs px-3 data-[state=on]:bg-primary/10 data-[state=on]:text-primary">Bar</ToggleGroupItem>
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
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis 
                  dataKey="month" 
                  angle={-60} 
                  textAnchor="end" 
                  height={80}
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#ccc' }}
                  axisLine={{ stroke: '#ccc' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  tickLine={{ stroke: '#ccc' }}
                  axisLine={{ stroke: '#ccc' }}
                />
                <Tooltip 
                  formatter={(value) => [`${value} reviews`, 'Count']}
                  labelFormatter={(label) => `${label}`}
                  contentStyle={{ 
                    borderRadius: '6px', 
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    border: '1px solid #eee' 
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  wrapperStyle={{
                    paddingTop: '10px',
                    fontSize: '12px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Reviews"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 1, fill: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#8884d8' }}
                  animationDuration={1000}
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
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis 
                  dataKey="month" 
                  angle={-60} 
                  textAnchor="end" 
                  height={80}
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#ccc' }}
                  axisLine={{ stroke: '#ccc' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#ccc' }}
                  axisLine={{ stroke: '#ccc' }}
                />
                <Tooltip 
                  formatter={(value) => [`${value} reviews`, 'Count']}
                  labelFormatter={(label) => `${label}`}
                  contentStyle={{ 
                    borderRadius: '6px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    border: '1px solid #eee'
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  wrapperStyle={{
                    paddingTop: '10px',
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  name="Reviews" 
                  fill="#8884d8" 
                  radius={[4, 4, 0, 0]}
                  animationDuration={1000}
                  barSize={24}
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
