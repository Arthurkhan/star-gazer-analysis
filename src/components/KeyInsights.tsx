
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Review } from "@/types/reviews";
import { analyzeReviewInsights } from "@/utils/dataUtils";
import { ArrowUp, ArrowDown } from "lucide-react";

interface KeyInsightsProps {
  reviews: Review[];
}

const KeyInsights = ({ reviews }: KeyInsightsProps) => {
  const { 
    trendData, 
    needAttention, 
    ratingTrend, 
    commonThemes 
  } = analyzeReviewInsights(reviews);

  return (
    <Card className="shadow-md dark:bg-gray-800 border-0">
      <CardHeader>
        <CardTitle>Key Insights</CardTitle>
        <CardDescription>
          Important patterns and reviews that need attention
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Trend */}
        <div>
          <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white flex items-center">
            Rating Trend {" "}
            {ratingTrend === "up" && <ArrowUp className="h-4 w-4 text-positive ml-1" />}
            {ratingTrend === "down" && <ArrowDown className="h-4 w-4 text-negative ml-1" />}
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            {ratingTrend === "up" ? (
              "Ratings are improving over time. Keep up the good work!"
            ) : ratingTrend === "down" ? (
              "Ratings are declining. Consider addressing customer concerns."
            ) : (
              "Ratings are stable over time."
            )}
          </p>
          
          <div className="flex space-x-1 mt-3">
            {trendData.map((point, i) => (
              <div 
                key={i}
                className={`h-8 w-3 rounded-t-sm ${
                  point.value >= 4.5 
                    ? "bg-green-500" 
                    : point.value >= 3.5 
                    ? "bg-green-300" 
                    : point.value >= 2.5 
                    ? "bg-yellow-400" 
                    : "bg-red-400"
                }`}
                style={{ height: `${point.value * 8}px` }}
                title={`${point.period}: ${point.value.toFixed(1)}`}
              />
            ))}
          </div>
        </div>
        
        {/* Reviews Needing Attention */}
        <div>
          <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
            Reviews Needing Attention
          </h3>
          
          {needAttention.length > 0 ? (
            <ul className="space-y-3">
              {needAttention.map((review, index) => (
                <li key={index} className="border-l-4 border-negative pl-3 py-1">
                  <div className="text-star text-sm">{"★".repeat(review.star)}</div>
                  <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                    {review.text}
                  </p>
                  <div className="text-xs text-gray-500 mt-1 flex justify-between">
                    <span>{review.name}</span>
                    <span>{new Date(review.publishedAtDate).toLocaleDateString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 dark:text-gray-300">
              No critical reviews needing attention. Great job!
            </p>
          )}
        </div>
        
        {/* Common Themes */}
        <div>
          <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
            Common Themes
          </h3>
          
          <ul className="space-y-2">
            {commonThemes.map((theme, index) => (
              <li key={index} className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${
                  theme.sentiment === "positive" 
                    ? "bg-positive" 
                    : theme.sentiment === "negative" 
                    ? "bg-negative" 
                    : "bg-neutral"
                } mr-2`}></div>
                <span className="text-gray-800 dark:text-gray-200">
                  {theme.text}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  ({theme.count} mentions)
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default KeyInsights;
