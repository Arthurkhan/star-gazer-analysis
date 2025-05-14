
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { type CompetitiveAnalysis } from "@/types/recommendations";
import { TrendingUp, TrendingDown, Award, AlertTriangle, Zap, Minus } from "lucide-react";

interface CompetitiveAnalysisViewProps {
  analysis: CompetitiveAnalysis;
}

export const CompetitiveAnalysisView = ({ analysis }: CompetitiveAnalysisViewProps) => {
  const getPositionColor = (position: string) => {
    switch (position) {
      case 'above': return 'text-green-600';
      case 'average': return 'text-yellow-600';
      case 'below': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPositionBadge = (position: string) => {
    switch (position) {
      case 'above': return <Badge className="bg-green-500 text-white">Above Average</Badge>;
      case 'average': return <Badge className="bg-yellow-500 text-white">Average</Badge>;
      case 'below': return <Badge className="bg-red-500 text-white">Below Average</Badge>;
      default: return <Badge>Unknown</Badge>;
    }
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'rating': return <Award className="w-5 h-5" />;
      case 'reviewVolume': return <TrendingUp className="w-5 h-5" />;
      case 'sentiment': return <Zap className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const formatMetricName = (metric: string) => {
    switch (metric) {
      case 'rating': return 'Average Rating';
      case 'reviewVolume': return 'Review Volume';
      case 'sentiment': return 'Customer Sentiment';
      default: return metric;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Position */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Market Position</CardTitle>
            {getPositionBadge(analysis.position)}
          </div>
          <CardDescription>
            How your business compares to industry benchmarks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className={`text-lg font-medium ${getPositionColor(analysis.position)}`}>
            Your business is performing {analysis.position} industry average
          </p>
        </CardContent>
      </Card>

      {/* Metrics Comparison */}
      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(analysis.metrics).map(([key, metric]) => (
          <Card key={key}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {getMetricIcon(key)}
                <CardTitle className="text-base">{formatMetricName(key)}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-2xl font-bold">{metric.value.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground">
                    vs {metric.benchmark.toFixed(2)}
                  </span>
                </div>
                <Progress value={metric.percentile} className="h-2" />
                <p className="text-sm text-muted-foreground mt-1">
                  {metric.percentile}th percentile
                </p>
              </div>
              <div className="flex items-center gap-2">
                {metric.value > metric.benchmark ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : metric.value < metric.benchmark ? (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                ) : (
                  <Minus className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-sm">
                  {Math.abs(((metric.value - metric.benchmark) / metric.benchmark) * 100).toFixed(1)}%
                  {metric.value > metric.benchmark ? ' above' : metric.value < metric.benchmark ? ' below' : ' at'} benchmark
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SWOT Analysis */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Strengths</CardTitle>
            <CardDescription>Your competitive advantages</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weaknesses</CardTitle>
            <CardDescription>Areas for improvement</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span className="text-sm">{weakness}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Opportunities</CardTitle>
            <CardDescription>Potential growth areas</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.opportunities.map((opportunity, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">◆</span>
                  <span className="text-sm">{opportunity}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
