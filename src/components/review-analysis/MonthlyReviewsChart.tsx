
import React from "react";
import { Review } from "@/types/reviews";
import { groupReviewsByMonth } from "@/utils/dataUtils";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

interface MonthlyReviewsChartProps {
  reviews: Review[];
}

const MonthlyReviewsChart: React.FC<MonthlyReviewsChartProps> = ({ reviews }) => {
  // Monthly review data (synchronous)
  const monthlyReviews = groupReviewsByMonth(reviews);
  
  // Find the maximum cumulative count for Y-axis scaling
  const maxCumulativeCount = monthlyReviews.length > 0 
    ? Math.max(...monthlyReviews.map(item => item.cumulativeCount || 0)) + 10
    : 10;

  return (
    <div>
      <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
        Cumulative Reviews by Month
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={monthlyReviews}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
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
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlyReviewsChart;
