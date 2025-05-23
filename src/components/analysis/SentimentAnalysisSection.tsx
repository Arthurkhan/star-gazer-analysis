import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Meh, Frown, TrendingUp, TrendingDown } from "lucide-react";
import { SentimentAnalysis } from "@/types/analysisSummary";

interface SentimentAnalysisSectionProps {
  sentimentAnalysis: SentimentAnalysis;
}

export const SentimentAnalysisSection: React.FC<SentimentAnalysisSectionProps> = ({
  sentimentAnalysis
}) => {
  const { distribution, trends, correlationWithRating } = sentimentAnalysis;

  // Helper to get sentiment icon and colors
  const getSentimentInfo = (type: "positive" | "neutral" | "negative") => {
    switch (type) {
      case "positive":
        return { icon: Heart, color: "text-green-600", bg: "bg-green-100", progressColor: "bg-green-500" };
      case "neutral":
        return { icon: Meh, color: "text-yellow-600", bg: "bg-yellow-100", progressColor: "bg-yellow-500" };
      case "negative":
        return { icon: Frown, color: "text-red-600", bg: "bg-red-100", progressColor: "bg-red-500" };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5" />
          Customer Sentiment Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Current Sentiment Distribution */}
          <div className="space-y-4">
            <h3 className="font-semibold">Current Sentiment Distribution</h3>
            
            {(["positive", "neutral", "negative"] as const).map(sentiment => {
              const data = distribution[sentiment];
              const info = getSentimentInfo(sentiment);
              const Icon = info.icon;
              
              return (
                <div key={sentiment} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${info.color}`} />
                      <span className="font-medium capitalize">{sentiment}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {data.count} reviews
                      </span>
                      <Badge variant="secondary">
                        {data.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={data.percentage} className="h-2" />
                </div>
              );
            })}

            {/* Overall Sentiment Score */}
            <div className="mt-4 p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Overall Sentiment Score</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">
                    {distribution.positive.percentage.toFixed(1)}%
                  </span>
                  <Badge variant={distribution.positive.percentage >= 70 ? "default" : "secondary"}>
                    {distribution.positive.percentage >= 80 ? "Excellent" :
                     distribution.positive.percentage >= 60 ? "Good" :
                     distribution.positive.percentage >= 40 ? "Fair" : "Needs Attention"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Sentiment Trends */}
          <div className="space-y-4">
            <h3 className="font-semibold">Sentiment Trends Over Time</h3>
            
            {trends.length > 0 ? (
              <div className="space-y-3">
                {trends.slice(-4).map((trend, index) => (
                  <div key={trend.period} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{trend.period}</span>
                      <div className="flex items-center gap-2">
                        {index > 0 && (
                          <div className="flex items-center gap-1">
                            {trend.positive > trends[index - 1]?.positive ? (
                              <TrendingUp className="w-3 h-3 text-green-500" />
                            ) : trend.positive < trends[index - 1]?.positive ? (
                              <TrendingDown className="w-3 h-3 text-red-500" />
                            ) : null}
                          </div>
                        )}
                        <span className="text-green-600">{trend.positive}%</span>
                      </div>
                    </div>
                    <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-200">
                      <div 
                        className="bg-green-500" 
                        style={{ width: `${trend.positive}%` }}
                      />
                      <div 
                        className="bg-yellow-500" 
                        style={{ width: `${trend.neutral}%` }}
                      />
                      <div 
                        className="bg-red-500" 
                        style={{ width: `${trend.negative}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Not enough data for trend analysis</p>
                <p className="text-sm">Trends will appear with more review data over time</p>
              </div>
            )}
          </div>
        </div>

        {/* Rating Correlation Analysis */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold mb-4">Sentiment vs Rating Correlation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* High Ratings Sentiment */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">High Ratings (4-5 ⭐)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Positive Sentiment:</span>
                    <span className="font-medium text-green-600">
                      {correlationWithRating.highRating.positive}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Negative Sentiment:</span>
                    <span className="font-medium text-red-600">
                      {correlationWithRating.highRating.negative}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {correlationWithRating.highRating.positive > correlationWithRating.highRating.negative * 3
                      ? "Strong positive correlation"
                      : "Moderate correlation"}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Low Ratings Sentiment */}
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Low Ratings (1-2 ⭐)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Positive Sentiment:</span>
                    <span className="font-medium text-green-600">
                      {correlationWithRating.lowRating.positive}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Negative Sentiment:</span>
                    <span className="font-medium text-red-600">
                      {correlationWithRating.lowRating.negative}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {correlationWithRating.lowRating.negative > correlationWithRating.lowRating.positive * 2
                      ? "Strong negative correlation"
                      : "Mixed sentiment in low ratings"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
