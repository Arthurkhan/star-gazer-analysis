import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tags, TrendingUp, TrendingDown, AlertTriangle, Star } from "lucide-react";
import { ThematicAnalysis } from "@/types/analysisSummary";

interface ThematicAnalysisSectionProps {
  thematicAnalysis: ThematicAnalysis;
}

export const ThematicAnalysisSection: React.FC<ThematicAnalysisSectionProps> = ({
  thematicAnalysis
}) => {
  const { topCategories, trendingTopics, attentionAreas } = thematicAnalysis;

  // Helper to get sentiment color
  const getSentimentColor = (sentiment: "positive" | "negative" | "neutral") => {
    switch (sentiment) {
      case "positive": return "text-green-600 bg-green-100";
      case "negative": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  // Helper to get trend icon
  const getTrendIcon = (trend: "rising" | "declining" | "stable") => {
    switch (trend) {
      case "rising": return <TrendingUp className="w-3 h-3 text-green-500" />;
      case "declining": return <TrendingDown className="w-3 h-3 text-red-500" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tags className="w-5 h-5" />
          Thematic Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Top Categories */}
          <div className="space-y-4">
            <h3 className="font-semibold">Top Categories</h3>
            {topCategories.length > 0 ? (
              <div className="space-y-3">
                {topCategories.slice(0, 6).map((category, index) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">#{index + 1}</span>
                        <span className="font-medium">{category.category}</span>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={getSentimentColor(category.sentiment)}
                      >
                        {category.sentiment}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{category.count} mentions ({category.percentage.toFixed(1)}%)</span>
                      {category.averageRating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{category.averageRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Tags className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No thematic data available</p>
              </div>
            )}
          </div>

          {/* Trending Topics */}
          <div className="space-y-4">
            <h3 className="font-semibold">Trending Topics</h3>
            {trendingTopics.length > 0 ? (
              <div className="space-y-3">
                {trendingTopics.slice(0, 6).map((topic) => (
                  <div key={topic.topic} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{topic.topic}</span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(topic.trend)}
                        <Badge variant={topic.trend === "rising" ? "default" : "secondary"}>
                          {topic.trend}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{topic.count} total mentions</span>
                      <span>{topic.recentMentions} recent</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No trending topics detected</p>
              </div>
            )}
          </div>

          {/* Attention Areas */}
          <div className="space-y-4">
            <h3 className="font-semibold">Areas Needing Attention</h3>
            {attentionAreas.length > 0 ? (
              <div className="space-y-3">
                {attentionAreas.slice(0, 6).map((area) => (
                  <div key={area.theme} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{area.theme}</span>
                      <Badge 
                        variant={area.urgency === "high" ? "destructive" : "secondary"}
                        className={
                          area.urgency === "high" ? "bg-red-100 text-red-700" :
                          area.urgency === "medium" ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-700"
                        }
                      >
                        {area.urgency} priority
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{area.negativeCount} negative mentions</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{area.averageRating.toFixed(1)} avg</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No critical issues detected</p>
                <p className="text-sm">Great job maintaining quality!</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
