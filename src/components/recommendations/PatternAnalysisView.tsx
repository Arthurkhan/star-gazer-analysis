import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type PatternInsight, type Strategy } from "@/types/recommendations";
import { TrendingUp, TrendingDown, Minus, AlertCircle, Lightbulb } from "lucide-react";

interface PatternAnalysisViewProps {
  insights: PatternInsight[];
  longTermStrategies: Strategy[];
}

export const PatternAnalysisView = ({ insights, longTermStrategies }: PatternAnalysisViewProps) => {
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'negative': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-500';
      case 'negative': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'brand': return <Lightbulb className="w-5 h-5" />;
      case 'customer': return <TrendingUp className="w-5 h-5" />;
      case 'innovation': return <AlertCircle className="w-5 h-5" />;
      default: return <TrendingUp className="w-5 h-5" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Pattern Insights */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Key Patterns Identified</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {insights.map((insight) => (
            <Card key={insight.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getSentimentIcon(insight.sentiment)}
                    <CardTitle className="text-base">{insight.pattern}</CardTitle>
                  </div>
                  <Badge className={`${getSentimentColor(insight.sentiment)} text-white`}>
                    {insight.sentiment}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Frequency: {insight.frequency} mentions</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm">{insight.recommendation}</p>
                </div>
                {insight.examples.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Examples:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {insight.examples.slice(0, 2).map((example, index) => (
                        <li key={index} className="italic">
                          "{example}"
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Long-term Strategies */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Long-term Strategic Initiatives</h3>
        <div className="grid gap-4">
          {longTermStrategies.map((strategy) => (
            <Card key={strategy.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(strategy.category)}
                    <div>
                      <CardTitle className="text-lg">{strategy.title}</CardTitle>
                      <CardDescription>{strategy.description}</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{strategy.category.toUpperCase()}</Badge>
                    <p className={`text-sm font-medium mt-1 ${getRiskColor(strategy.riskLevel)}`}>
                      {strategy.riskLevel.toUpperCase()} RISK
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Timeframe</p>
                    <p className="text-sm text-muted-foreground">{strategy.timeframe}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Expected ROI</p>
                    <p className="text-sm text-muted-foreground">{strategy.expectedROI}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Key Actions</p>
                  <ol className="text-sm space-y-1 list-decimal list-inside">
                    {strategy.actions.map((action, index) => (
                      <li key={index} className="text-muted-foreground">
                        {action}
                      </li>
                    ))}
                  </ol>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
