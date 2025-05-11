
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Review } from "@/types/reviews";
import { analyzeReviewInsights } from "@/utils/dataUtils";
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, Lightbulb, AlertTriangle, Star, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { getAnalysis } from "@/utils/openaiAnalysis";

interface KeyInsightsProps {
  reviews: Review[];
}

const KeyInsights = ({ reviews }: KeyInsightsProps) => {
  const [loading, setLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  
  const { 
    trendData, 
    needAttention, 
    ratingTrend, 
    commonThemes 
  } = analyzeReviewInsights(reviews);

  // Calculate month-over-month change
  const getMonthOverMonthChange = () => {
    if (trendData.length < 2) return { percentage: 0, positive: true };
    
    const lastMonth = trendData[trendData.length - 1].value;
    const previousMonth = trendData[trendData.length - 2].value;
    
    const change = lastMonth - previousMonth;
    const percentage = previousMonth !== 0 
      ? Math.abs((change / previousMonth) * 100).toFixed(1)
      : '100';
      
    return { 
      percentage: Number(percentage), 
      positive: change >= 0,
      raw: change.toFixed(1)
    };
  };
  
  const monthChange = getMonthOverMonthChange();

  // Calculate percentage of reviews needing attention
  const attentionPercentage = reviews.length > 0 
    ? ((needAttention.length / reviews.length) * 100).toFixed(1) 
    : '0';

  // Use AI to generate recommendations when the component mounts or reviews change
  useEffect(() => {
    const generateRecommendations = async () => {
      if (reviews.length < 5) return; // Need enough reviews to make meaningful recommendations
      
      setLoading(true);
      try {
        const analysis = await getAnalysis(reviews);
        
        // Extract recommendations from analysis if available
        if (analysis.overallAnalysis) {
          const recommendationsList = analysis.overallAnalysis
            .split(/\n|\./)
            .filter((item: string) => 
              item.trim().length > 10 && 
              (item.includes("recommend") || 
               item.includes("suggest") || 
               item.includes("should") || 
               item.includes("could") || 
               item.includes("improve"))
            )
            .map((item: string) => item.trim())
            .slice(0, 4); // Limit to 4 recommendations
            
          setAiRecommendations(recommendationsList);
        }
      } catch (error) {
        console.error("Error generating AI recommendations:", error);
      } finally {
        setLoading(false);
      }
    };
    
    generateRecommendations();
  }, [reviews]);

  return (
    <Card className="shadow-md dark:bg-gray-800 border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Key Insights
        </CardTitle>
        <CardDescription>
          Important patterns, actionable insights, and areas for improvement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Trend with enhanced visualization */}
        <div className="p-4 border border-border rounded-lg bg-background/50">
          <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white flex items-center">
            Rating Trend {" "}
            {ratingTrend === "up" && <TrendingUp className="h-4 w-4 text-green-500 ml-1" />}
            {ratingTrend === "down" && <TrendingDown className="h-4 w-4 text-red-500 ml-1" />}
          </h3>
          
          <div className="flex justify-between items-center mb-3">
            <p className="text-gray-600 dark:text-gray-300">
              {ratingTrend === "up" ? (
                "Ratings are improving over time. Keep up the good work!"
              ) : ratingTrend === "down" ? (
                "Ratings are declining. Consider addressing customer concerns."
              ) : (
                "Ratings are stable over time."
              )}
            </p>
            
            <Badge className={monthChange.positive ? "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300"}>
              {monthChange.positive ? "+" : ""}{monthChange.raw} stars ({monthChange.percentage}%) from last period
            </Badge>
          </div>
          
          <div className="flex space-x-1 mt-4 h-16 items-end">
            {trendData.map((point, i) => (
              <div key={i} className="flex flex-col items-center group">
                <div 
                  className={`w-10 min-w-8 mx-auto rounded-t-sm transition-all duration-300 group-hover:opacity-90 ${
                    point.value >= 4.5 
                      ? "bg-green-500 dark:bg-green-400" 
                      : point.value >= 3.5 
                      ? "bg-green-300 dark:bg-green-300" 
                      : point.value >= 2.5 
                      ? "bg-yellow-400 dark:bg-yellow-300" 
                      : "bg-red-400 dark:bg-red-300"
                  }`}
                  style={{ height: `${point.value * 8}px` }}
                >
                  <div className="text-xs text-center font-medium mt-1 invisible group-hover:visible absolute top-[-20px] left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow">
                    {point.value.toFixed(1)}
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap overflow-hidden text-ellipsis max-w-12 text-center">
                  {point.period}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Reviews Needing Attention with improved visualization */}
        <div className="p-4 border border-border rounded-lg bg-background/50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
              Reviews Needing Attention
            </h3>
            
            <Badge variant={Number(attentionPercentage) > 10 ? "destructive" : "outline"}>
              {attentionPercentage}% of total
            </Badge>
          </div>
          
          {needAttention.length > 0 ? (
            <ul className="space-y-3 mt-3">
              {needAttention.map((review, index) => (
                <li key={index} className="border-l-4 border-red-400 dark:border-red-500 pl-3 py-2 bg-red-50 dark:bg-red-900/10 rounded-r-md">
                  <div className="flex justify-between items-center">
                    <div className="text-amber-500 text-sm">{"★".repeat(review.star)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(review.publishedAtDate).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200 my-1">
                    {review.text.length > 150 ? `${review.text.substring(0, 150)}...` : review.text}
                  </p>
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between mt-1">
                    <span className="font-medium">{review.name}</span>
                    <span className="italic">{review.title}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded text-green-700 dark:text-green-300 text-sm flex gap-2 items-center">
              <Star className="h-4 w-4" />
              <p>No critical reviews needing attention. Great job!</p>
            </div>
          )}
        </div>
        
        {/* Common Themes with better categorization */}
        <div className="p-4 border border-border rounded-lg bg-background/50">
          <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
            Customer Experience Themes
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-green-600 dark:text-green-400 mb-2 flex items-center">
                <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 mr-2">Positive</Badge>
                Strengths to Maintain
              </h4>
              <ul className="space-y-2">
                {commonThemes
                  .filter(theme => theme.sentiment === "positive")
                  .map((theme, index) => (
                    <li key={index} className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 dark:bg-green-400 mr-2"></div>
                      <span className="text-gray-800 dark:text-gray-200">
                        {theme.text}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({theme.count})
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-red-600 dark:text-red-400 mb-2 flex items-center">
                <Badge variant="outline" className="bg-red-50 dark:bg-red-900/20 mr-2">Negative</Badge>
                Areas for Improvement
              </h4>
              <ul className="space-y-2">
                {commonThemes
                  .filter(theme => theme.sentiment === "negative")
                  .map((theme, index) => (
                    <li key={index} className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 dark:bg-red-400 mr-2"></div>
                      <span className="text-gray-800 dark:text-gray-200">
                        {theme.text}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({theme.count})
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
        
        {/* AI-powered Recommendations */}
        <div className="p-4 border border-border rounded-lg bg-background/50">
          <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white flex items-center">
            <Lightbulb className="h-5 w-5 text-amber-400 mr-2" />
            AI-Powered Recommendations
          </h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
              <span className="text-gray-500 dark:text-gray-400">Analyzing reviews...</span>
            </div>
          ) : aiRecommendations.length > 0 ? (
            <ul className="space-y-2">
              {aiRecommendations.map((recommendation, index) => (
                <li key={index} className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-md text-sm text-gray-800 dark:text-gray-200">
                  <div className="flex">
                    <span className="font-bold text-blue-600 dark:text-blue-400 mr-2">{index + 1}.</span>
                    <span>{recommendation.endsWith('.') ? recommendation : `${recommendation}.`}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 dark:text-gray-300 italic">
              Insufficient data to generate recommendations. Add more reviews to get AI-powered insights.
            </p>
          )}
          
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-md border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-2">Insights Summary</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {ratingTrend === "up" 
                ? "Your business is performing well with improving ratings. Focus on maintaining your strengths while addressing the areas highlighted for improvement."
                : ratingTrend === "down"
                ? "Your ratings show a decline. Prioritize addressing the negative themes and critical reviews to improve customer satisfaction."
                : "Your ratings are stable. To grow, consider both maintaining your strengths and addressing the improvement areas identified."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KeyInsights;
