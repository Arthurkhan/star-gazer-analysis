import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { type BusinessScenario } from "@/types/recommendations";
import { TrendingUp, TrendingDown, Clock, DollarSign, BarChart3, Users } from "lucide-react";

interface ScenariosViewProps {
  scenarios: BusinessScenario[];
}

export const ScenariosView = ({ scenarios }: ScenariosViewProps) => {
  const getScenarioColor = (name: string) => {
    if (name.includes('Best')) return 'bg-green-500';
    if (name.includes('Realistic')) return 'bg-blue-500';
    if (name.includes('Status Quo')) return 'bg-gray-500';
    if (name.includes('Worst')) return 'bg-red-500';
    return 'bg-purple-500';
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'reviewVolume': return <Users className="w-4 h-4" />;
      case 'avgRating': return <BarChart3 className="w-4 h-4" />;
      case 'sentiment': return <TrendingUp className="w-4 h-4" />;
      case 'revenue': return <DollarSign className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const formatMetricValue = (key: string, value: number | string) => {
    if (key === 'revenue') return value;
    if (key === 'avgRating') return value.toFixed(2);
    if (key === 'sentiment') return `${(value * 100).toFixed(0)}%`;
    return value.toString();
  };

  const getChangeIndicator = (key: string, value: string | number) => {
    if (key === 'revenue') {
      const numValue = parseFloat(value.toString().replace('%', ''));
      return numValue > 0 ? (
        <TrendingUp className="w-4 h-4 text-green-500" />
      ) : numValue < 0 ? (
        <TrendingDown className="w-4 h-4 text-red-500" />
      ) : null;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Business Scenarios</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Projected outcomes based on different strategic approaches
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {scenarios.map((scenario, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{scenario.name}</CardTitle>
                  <CardDescription>{scenario.description}</CardDescription>
                </div>
                <Badge className={`${getScenarioColor(scenario.name)} text-white`}>
                  {(scenario.probability * 100).toFixed(0)}% Likely
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Clock className="w-4 h-4" />
                <span>{scenario.timeframe}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Probability Bar */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Probability</span>
                  <span className="text-sm text-muted-foreground">
                    {(scenario.probability * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={scenario.probability * 100} className="h-2" />
              </div>

              {/* Projected Metrics */}
              <div>
                <h4 className="text-sm font-medium mb-3">Projected Metrics</h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(scenario.projectedMetrics).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        {getMetricIcon(key)}
                        <span className="text-sm capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">
                          {formatMetricValue(key, value)}
                        </span>
                        {getChangeIndicator(key, value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Required Actions */}
              <div>
                <h4 className="text-sm font-medium mb-2">Required Actions</h4>
                <ul className="text-sm space-y-1">
                  {scenario.requiredActions.map((action, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-muted-foreground mr-2">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Insight */}
      <Card>
        <CardHeader>
          <CardTitle>Strategic Insight</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Based on the analysis, implementing the recommended actions has a high probability 
            of improving your business metrics. The best-case scenario shows significant 
            potential for growth, while maintaining the status quo may result in stagnation 
            or decline relative to competitors.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
