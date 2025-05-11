
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { groupReviewsByMonth, countReviewsByRating, calculateAverageRating } from "@/utils/dataUtils";
import { Review } from "@/types/reviews";

interface MonthlyReportProps {
  reviews: Review[];
}

const MonthlyReport = ({ reviews }: MonthlyReportProps) => {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [monthlyData, setMonthlyData] = useState<{
    name: string;
    totalReviews: number;
    averageRating: number;
    ratingDistribution: { name: string; value: number }[];
  }[]>([]);

  // Prepare monthly data
  useEffect(() => {
    if (!reviews.length) return;

    // Group reviews by month first
    const reviewsByMonth = new Map<string, Review[]>();
    
    reviews.forEach(review => {
      const date = new Date(review.publishedAtDate);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!reviewsByMonth.has(monthKey)) {
        reviewsByMonth.set(monthKey, []);
      }
      
      reviewsByMonth.get(monthKey)?.push(review);
    });
    
    // Convert to array format for our component
    const monthlySummary = Array.from(reviewsByMonth.entries()).map(([month, monthReviews]) => {
      const ratingCounts = countReviewsByRating(monthReviews);
      const ratingDistribution = [1, 2, 3, 4, 5].map(star => ({
        name: `${star} ★`,
        value: ratingCounts[star] || 0
      }));
      
      return {
        name: month,
        totalReviews: monthReviews.length,
        averageRating: calculateAverageRating(monthReviews),
        ratingDistribution
      };
    });
    
    // Sort by date (most recent first)
    monthlySummary.sort((a, b) => {
      const dateA = new Date(a.name);
      const dateB = new Date(b.name);
      return dateB.getTime() - dateA.getTime();
    });
    
    setMonthlyData(monthlySummary);
    
    // Set the most recent month as selected by default
    if (monthlySummary.length > 0 && !selectedMonth) {
      setSelectedMonth(monthlySummary[0].name);
    }
  }, [reviews, selectedMonth]);

  // Selected month data
  const selectedMonthData = monthlyData.find(month => month.name === selectedMonth);

  // Colors for the pie chart
  const COLORS = ['#FF5252', '#FF9800', '#FFC107', '#8BC34A', '#4CAF50'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Review Summary</CardTitle>
          <CardDescription>
            Review summary by month. Select a month to view detailed stats.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                onClick={(data) => {
                  if (data && data.activePayload && data.activePayload[0]) {
                    setSelectedMonth(data.activePayload[0].payload.name);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70} 
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="totalReviews" 
                  fill="#6366F1" 
                  name="Reviews"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {selectedMonthData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{selectedMonthData.name}</CardTitle>
              <CardDescription>Month summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Reviews</p>
                  <p className="text-2xl font-bold">{selectedMonthData.totalReviews}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                  <p className="text-2xl font-bold">
                    {selectedMonthData.averageRating.toFixed(1)}
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
                  <PieChart>
                    <Pie
                      data={selectedMonthData.ratingDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {selectedMonthData.ratingDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MonthlyReport;
