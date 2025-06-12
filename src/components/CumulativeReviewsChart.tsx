import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { MonthlyReviewData } from "@/types/reviews";
import { CustomBarLineTooltip } from "@/components/review-analysis/CustomTooltips";

interface CumulativeReviewsChartProps {
  data: MonthlyReviewData[];
}

const CumulativeReviewsChart = ({ data }: CumulativeReviewsChartProps) => {
  const [chartType, setChartType] = useState<"line" | "area">("area");
  
  // Find the maximum cumulative count for Y-axis scaling
  const maxCumulativeCount = data.length > 0 
    ? Math.max(...data.map(item => item.cumulativeCount || 0)) + Math.ceil(Math.max(...data.map(item => item.cumulativeCount || 0)) * 0.1)
    : 10;
  
  return (
    <Card className="col-span-full shadow-md border-0 dark:bg-gray-800 overflow-hidden transition-all duration-300 hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750">
        <CardTitle className="text-md font-medium">Cumulative Reviews Growth</CardTitle>
        <ToggleGroup 
          type="single" 
          value={chartType} 
          onValueChange={(value) => value && setChartType(value as "line" | "area")}
          className="border rounded-md p-1 bg-white dark:bg-gray-700 shadow-sm"
        >
          <ToggleGroupItem value="area" size="sm" className="text-xs px-3 data-[state=on]:bg-primary/10 data-[state=on]:text-primary">Area</ToggleGroupItem>
          <ToggleGroupItem value="line" size="sm" className="text-xs px-3 data-[state=on]:bg-primary/10 data-[state=on]:text-primary">Line</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "area" ? (
              <AreaChart
                data={data}
                margin={{
                  top: 20,
                  right: 10,
                  left: 10,
                  bottom: 35,
                }}
              >
                <defs>
                  <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
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
                  tick={{ fontSize: 12 }} 
                  tickLine={{ stroke: '#ccc' }}
                  axisLine={{ stroke: '#ccc' }}
                  domain={[0, maxCumulativeCount]}
                  allowDecimals={false}
                />
                <Tooltip 
                  content={<CustomBarLineTooltip />}
                />
                <Legend 
                  verticalAlign="top" 
                  height={30} 
                  wrapperStyle={{
                    paddingTop: '5px',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeCount"
                  name="Total Reviews"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#cumulativeGradient)"
                  dot={{ r: 4, strokeWidth: 1, fill: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                  animationDuration={1000}
                />
              </AreaChart>
            ) : (
              <LineChart
                data={data}
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
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#ccc' }}
                  axisLine={{ stroke: '#ccc' }}
                  domain={[0, maxCumulativeCount]}
                  allowDecimals={false}
                />
                <Tooltip 
                  content={<CustomBarLineTooltip />}
                />
                <Legend 
                  verticalAlign="top" 
                  height={30}
                  wrapperStyle={{
                    paddingTop: '5px',
                    fontSize: '12px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeCount"
                  name="Total Reviews"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 1, fill: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                  animationDuration={1000}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CumulativeReviewsChart;
