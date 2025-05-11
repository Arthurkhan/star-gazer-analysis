
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Review } from "@/types/reviews";
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
  Legend 
} from "recharts";
import { ArrowUp, ArrowDown } from "lucide-react";
import { 
  calculateAverageRating, 
  countReviewsByRating, 
  groupReviewsByMonth,
  calculateMonthlyComparison 
} from "@/utils/dataUtils";

interface OverviewSectionProps {
  reviews: Review[];
}

const OverviewSection = ({ reviews }: OverviewSectionProps) => {
  const averageRating = calculateAverageRating(reviews);
  const ratingDistribution = countReviewsByRating(reviews);
  const monthlyReviews = groupReviewsByMonth(reviews);
  const monthlyComparison = calculateMonthlyComparison(reviews);
  
  // Calculate response rate
  const responseRate = reviews.length > 0
    ? (reviews.filter(r => r.responseFromOwnerText?.trim()).length / reviews.length) * 100
    : 0;
  
  // Calculate trend (simplified)
  const prevMonth = new Date();
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  
  const currentMonthReviews = reviews.filter(r => {
    const date = new Date(r.publishedAtDate);
    return date.getMonth() === new Date().getMonth() && 
           date.getFullYear() === new Date().getFullYear();
  });
  
  const prevMonthReviews = reviews.filter(r => {
    const date = new Date(r.publishedAtDate);
    return date.getMonth() === prevMonth.getMonth() && 
           date.getFullYear() === prevMonth.getFullYear();
  });
  
  const currentMonthAvg = calculateAverageRating(currentMonthReviews);
  const prevMonthAvg = calculateAverageRating(prevMonthReviews);
  
  const trend = currentMonthAvg > prevMonthAvg ? "up" : 
                (currentMonthAvg < prevMonthAvg ? "down" : "neutral");

  // Format data for rating distribution chart
  const ratingData = [
    { rating: "1 ★", count: ratingDistribution[1] || 0 },
    { rating: "2 ★", count: ratingDistribution[2] || 0 },
    { rating: "3 ★", count: ratingDistribution[3] || 0 },
    { rating: "4 ★", count: ratingDistribution[4] || 0 },
    { rating: "5 ★", count: ratingDistribution[5] || 0 },
  ];

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Reviews Card */}
        <Card className="shadow-md dark:bg-gray-800 border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {reviews.length}
            </div>
            <div className="mt-2 flex flex-col text-sm">
              <div className="flex items-center">
                <span className="text-gray-600 dark:text-gray-400 mr-1">vs Last Month:</span>
                <span className={monthlyComparison.vsLastMonth > 0 ? 'text-green-600' : monthlyComparison.vsLastMonth < 0 ? 'text-red-600' : 'text-gray-600'}>
                  {monthlyComparison.vsLastMonth > 0 ? '+' : ''}{monthlyComparison.vsLastMonth}
                </span>
                {monthlyComparison.vsLastMonth > 0 ? (
                  <ArrowUp className="h-3 w-3 text-green-600 ml-1" />
                ) : monthlyComparison.vsLastMonth < 0 ? (
                  <ArrowDown className="h-3 w-3 text-red-600 ml-1" />
                ) : null}
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 dark:text-gray-400 mr-1">vs Last Year:</span>
                <span className={monthlyComparison.vsLastYear > 0 ? 'text-green-600' : monthlyComparison.vsLastYear < 0 ? 'text-red-600' : 'text-gray-600'}>
                  {monthlyComparison.vsLastYear > 0 ? '+' : ''}{monthlyComparison.vsLastYear}
                </span>
                {monthlyComparison.vsLastYear > 0 ? (
                  <ArrowUp className="h-3 w-3 text-green-600 ml-1" />
                ) : monthlyComparison.vsLastYear < 0 ? (
                  <ArrowDown className="h-3 w-3 text-red-600 ml-1" />
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Average Rating Card */}
        <Card className="shadow-md dark:bg-gray-800 border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {averageRating.toFixed(1)}
              </div>
              <div className="flex items-center ml-2">
                <div className="text-lg text-star mr-1">★</div>
                {trend === "up" && (
                  <ArrowUp className="h-4 w-4 text-positive" />
                )}
                {trend === "down" && (
                  <ArrowDown className="h-4 w-4 text-negative" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Response Rate Card */}
        <Card className="shadow-md dark:bg-gray-800 border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Response Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {responseRate.toFixed(0)}%
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Trend Card */}
        <Card className="shadow-md dark:bg-gray-800 border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Recent Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {trend === "up" ? "Improving" : trend === "down" ? "Declining" : "Stable"}
              </div>
              <div className="ml-2">
                {trend === "up" && (
                  <ArrowUp className="h-5 w-5 text-positive" />
                )}
                {trend === "down" && (
                  <ArrowDown className="h-5 w-5 text-negative" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution Chart */}
        <Card className="shadow-md dark:bg-gray-800 border-0">
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="rating" />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                    formatter={(value) => [`${value} reviews`, "Count"]}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      borderRadius: "6px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Reviews Over Time Chart */}
        <Card className="shadow-md dark:bg-gray-800 border-0">
          <CardHeader>
            <CardTitle>Reviews Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyReviews}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                    formatter={(value) => [`${value} reviews`, "Count"]}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      borderRadius: "6px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.2} 
                    name="Reviews"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OverviewSection;
