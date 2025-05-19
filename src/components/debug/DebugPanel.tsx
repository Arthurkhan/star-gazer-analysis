import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BugPlay } from "lucide-react";
import { Review, MonthlyReviewData } from "@/types/reviews";

interface DebugPanelProps {
  reviews: Review[];
  chartData: MonthlyReviewData[];
  businessName: string;
}

export const DebugPanel = ({ reviews, chartData, businessName }: DebugPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Count reviews by month for the current and last month
  const now = new Date();
  const currentMonth = `${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;
  
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStr = `${lastMonth.toLocaleString('default', { month: 'short' })} ${lastMonth.getFullYear()}`;
  
  // Find current month in chart data
  const currentMonthData = chartData.find(item => item.month === currentMonth);
  const lastMonthData = chartData.find(item => item.month === lastMonthStr);

  // Count reviews manually for verification
  const currentMonthReviews = reviews.filter(review => {
    const reviewDate = new Date(review.publishedAtDate);
    return reviewDate.getMonth() === now.getMonth() && 
           reviewDate.getFullYear() === now.getFullYear();
  });

  const lastMonthReviews = reviews.filter(review => {
    const reviewDate = new Date(review.publishedAtDate);
    return reviewDate.getMonth() === lastMonth.getMonth() && 
           reviewDate.getFullYear() === lastMonth.getFullYear();
  });

  // Check for newest review
  let newestReviewDate = "None";
  if (reviews.length > 0) {
    const sortedReviews = [...reviews].sort((a, b) => 
      new Date(b.publishedAtDate).getTime() - new Date(a.publishedAtDate).getTime()
    );
    newestReviewDate = new Date(sortedReviews[0].publishedAtDate).toLocaleString();
  }

  if (!isExpanded) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="absolute top-2 right-2 opacity-50 hover:opacity-100"
        onClick={() => setIsExpanded(true)}
      >
        <BugPlay className="w-4 h-4 mr-1" /> Debug
      </Button>
    );
  }
  
  return (
    <Card className="absolute top-2 right-2 p-4 w-96 bg-black/90 text-white z-50 text-xs overflow-auto max-h-[80vh]">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">Debug Panel</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-2 text-white hover:text-white"
          onClick={() => setIsExpanded(false)}
        >
          Close
        </Button>
      </div>
      
      <div className="space-y-3">
        <div>
          <h4 className="text-green-400 font-medium">Business Info</h4>
          <p>Selected Business: {businessName}</p>
          <p>Total Reviews: {reviews.length}</p>
        </div>
        
        <div>
          <h4 className="text-green-400 font-medium">Chart Data</h4>
          <p>Total Months: {chartData.length}</p>
          <p>Current Month: {currentMonth}</p>
          <p>Current Month in Chart: {currentMonthData ? "Yes" : "No"}</p>
          {currentMonthData && <p>Chart shows {currentMonthData.count} reviews in current month</p>}
          <p>Last Month: {lastMonthStr}</p>
          <p>Last Month in Chart: {lastMonthData ? "Yes" : "No"}</p>
          {lastMonthData && <p>Chart shows {lastMonthData.count} reviews in last month</p>}
        </div>
        
        <div>
          <h4 className="text-green-400 font-medium">Manual Count</h4>
          <p>Current Month Reviews: {currentMonthReviews.length}</p>
          <p>Last Month Reviews: {lastMonthReviews.length}</p>
          <p>Newest Review: {newestReviewDate}</p>
        </div>
        
        <div>
          <h4 className="text-green-400 font-medium">Recent Reviews</h4>
          <div className="max-h-40 overflow-y-auto border border-gray-700 rounded p-1 mt-1">
            {reviews.slice(0, 5).map((review, index) => (
              <div key={index} className="border-b border-gray-700 pb-1 mb-1">
                <p>{new Date(review.publishedAtDate).toLocaleString()}</p>
                <p className="truncate">{review.text?.substring(0, 50)}...</p>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-green-400 font-medium">Month Data</h4>
          <div className="max-h-40 overflow-y-auto border border-gray-700 rounded p-1 mt-1">
            {chartData.slice(-10).map((monthData, index) => (
              <div key={index} className="flex justify-between py-1">
                <span>{monthData.month}</span>
                <span>{monthData.count} reviews</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
