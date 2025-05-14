import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { type GrowthStrategy, type MarketingPlan } from "@/types/recommendations";
import { Target, TrendingUp, Clock, BarChart } from "lucide-react";

interface GrowthStrategiesViewProps {
  strategies: GrowthStrategy[];
  marketingPlan: MarketingPlan;
}

export const GrowthStrategiesView = ({ strategies, marketingPlan }: GrowthStrategiesViewProps) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'marketing': return <Target className="w-4 h-4" />;
      case 'operations': return <BarChart className="w-4 h-4" />;
      case 'customer_experience': return <TrendingUp className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'marketing': return 'bg-blue-500';
      case 'operations': return 'bg-green-500';
      case 'customer_experience': return 'bg-purple-500';
      case 'staff': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Growth Strategies */}
      <div className="grid gap-4 md:grid-cols-2">
        {strategies.map((strategy) => (
          <Card key={strategy.id} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(strategy.category)}
                  <CardTitle className="text-lg">{strategy.title}</CardTitle>
                </div>
                <Badge className={`${getCategoryColor(strategy.category)} text-white`}>
                  {strategy.category.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <CardDescription>{strategy.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Expected Impact</span>
                  <span className="text-sm text-muted-foreground">{strategy.expectedImpact}</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{strategy.timeframe}</span>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Implementation Steps:</h4>
                <ul className="text-sm space-y-1">
                  {strategy.implementation.slice(0, 3).map((step, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-muted-foreground mr-2">{index + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Key Metrics:</h4>
                <div className="flex flex-wrap gap-2">
                  {strategy.kpis.map((kpi, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {kpi}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Marketing Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Attraction Plan</CardTitle>
          <CardDescription>Comprehensive marketing strategy to reach new audiences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="font-medium mb-2">Primary Target</h4>
              <ul className="text-sm space-y-1">
                {marketingPlan.targetAudiences.primary.map((audience, index) => (
                  <li key={index}>• {audience}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Secondary Target</h4>
              <ul className="text-sm space-y-1">
                {marketingPlan.targetAudiences.secondary.map((audience, index) => (
                  <li key={index}>• {audience}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Untapped Opportunities</h4>
              <ul className="text-sm space-y-1">
                {marketingPlan.targetAudiences.untapped.map((audience, index) => (
                  <li key={index}>• {audience}</li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Marketing Channels</h4>
            <div className="grid gap-3 md:grid-cols-2">
              {marketingPlan.channels.map((channel, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{channel.name}</span>
                    <Badge variant={channel.budget === 'low' ? 'secondary' : channel.budget === 'medium' ? 'default' : 'destructive'}>
                      {channel.budget.toUpperCase()} BUDGET
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{channel.strategy}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Key Messaging</h4>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium">Unique Value:</span>
                <p className="text-sm text-muted-foreground">{marketingPlan.messaging.uniqueValue}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Key Points:</span>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  {marketingPlan.messaging.keyPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-sm font-medium">Call to Action:</span>
                <p className="text-sm font-semibold text-primary">{marketingPlan.messaging.callToAction}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
