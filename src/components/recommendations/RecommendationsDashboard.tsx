import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { GrowthStrategiesView } from "./GrowthStrategiesView";
import { PatternAnalysisView } from "./PatternAnalysisView";
import { CompetitiveAnalysisView } from "./CompetitiveAnalysisView";
import { ScenariosView } from "./ScenariosView";
import { type Recommendations } from "@/types/recommendations";

interface RecommendationsDashboardProps {
  recommendations: Recommendations | null;
  loading: boolean;
  error?: string;
  generatingMessage?: string;
}

export const RecommendationsDashboard = ({ 
  recommendations, 
  loading, 
  error,
  generatingMessage 
}: RecommendationsDashboardProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-lg font-medium">Generating recommendations...</p>
          {generatingMessage && (
            <p className="text-sm text-muted-foreground mt-2">{generatingMessage}</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!recommendations) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          Select a business and generate recommendations to see insights here.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Urgent Actions Alert */}
      {recommendations.urgentActions.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>Immediate Attention Required</AlertTitle>
          <AlertDescription>
            {recommendations.urgentActions.map(action => (
              <div key={action.id} className="mt-2">
                <strong>{action.title}</strong>: {action.description}
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="growth" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="growth">Growth Strategies</TabsTrigger>
          <TabsTrigger value="patterns">Pattern Analysis</TabsTrigger>
          <TabsTrigger value="competitive">Competitive Position</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
        </TabsList>
        
        <TabsContent value="growth">
          <GrowthStrategiesView 
            strategies={recommendations.growthStrategies}
            marketingPlan={recommendations.customerAttractionPlan}
          />
        </TabsContent>
        
        <TabsContent value="patterns">
          <PatternAnalysisView 
            insights={recommendations.patternInsights}
            longTermStrategies={recommendations.longTermStrategies}
          />
        </TabsContent>
        
        <TabsContent value="competitive">
          <CompetitiveAnalysisView 
            analysis={recommendations.competitivePosition}
          />
        </TabsContent>
        
        <TabsContent value="scenarios">
          <ScenariosView 
            scenarios={recommendations.scenarios}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
