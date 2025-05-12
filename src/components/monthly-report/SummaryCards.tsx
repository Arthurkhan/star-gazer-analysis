
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// Colors for the charts
const COLORS = ['#FF5252', '#FF9800', '#FFC107', '#8BC34A', '#4CAF50'];

interface SummaryCardsProps {
  summaryData: {
    totalReviews: number;
    averageRating: number;
    ratingDistribution: { name: string; value: number }[];
    comparison: {
      previousPeriod: {
        change: number;
        percentage: number;
        totalReviews: number;
      };
      previousYear: {
        change: number;
        percentage: number;
        totalReviews: number;
      };
    };
  };
}

export function SummaryCards({ summaryData }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Summary</CardTitle>
          <CardDescription>Selected date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Reviews</p>
              <p className="text-2xl font-bold">{summaryData.totalReviews}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center text-sm">
                  <span className="inline-flex items-center mr-1">
                    {summaryData.comparison.previousPeriod.change > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    ) : summaryData.comparison.previousPeriod.change < 0 ? (
                      <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                    ) : (
                      <Minus className="h-3 w-3 text-gray-500 mr-1" />
                    )}
                    {summaryData.comparison.previousPeriod.change > 0 ? '+' : ''}
                    {summaryData.comparison.previousPeriod.change}
                  </span>
                  <span className="text-muted-foreground text-xs">vs previous period</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center text-sm">
                  <span className="inline-flex items-center mr-1">
                    {summaryData.comparison.previousYear.change > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    ) : summaryData.comparison.previousYear.change < 0 ? (
                      <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                    ) : (
                      <Minus className="h-3 w-3 text-gray-500 mr-1" />
                    )}
                    {summaryData.comparison.previousYear.change > 0 ? '+' : ''}
                    {summaryData.comparison.previousYear.change}
                  </span>
                  <span className="text-muted-foreground text-xs">vs same period last year</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
              <p className="text-2xl font-bold">
                {summaryData.averageRating.toFixed(1)}
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
              <BarChart
                data={summaryData.ratingDistribution}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} reviews`, 'Count']}
                  contentStyle={{ borderRadius: '6px' }}
                />
                <Bar dataKey="value" name="Count">
                  {summaryData.ratingDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
