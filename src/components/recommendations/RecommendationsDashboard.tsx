import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Recommendations } from '@/types/recommendations';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Info, AlertTriangle, Lightbulb, TrendingUp, Target, Rocket, Loader2 } from 'lucide-react';
import { GenerationProgress } from '@/hooks/useRecommendations';

// Impact color mapping
const impactColors = {
  Low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  Medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  High: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

// Effort color mapping
const effortColors = {
  Low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  Medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  High: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

interface RecommendationsDashboardProps {
  data?: Recommendations;
  isLoading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
  recommendations?: Recommendations;
  loading?: boolean;
  generatingMessage?: string;
  businessName?: string;
  progress?: GenerationProgress;
}

/**
 * Dashboard component for displaying AI-generated recommendations
 */
export const RecommendationsDashboard: React.FC<RecommendationsDashboardProps> = ({
  data,
  isLoading = false,
  error = null,
  onRefresh,
  recommendations,
  loading,
  generatingMessage,
  businessName,
  progress
}) => {
  // Use either data or recommendations prop for backwards compatibility
  const recommendationsData = data || recommendations;
  const isLoadingState = isLoading || loading;
  
  // If there's an error, display an error message
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error loading recommendations</AlertTitle>
        <AlertDescription>
          {error.message || 'Failed to load recommendations. Please try again.'}
        </AlertDescription>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} className="mt-2">
            Try Again
          </Button>
        )}
      </Alert>
    );
  }

  // If loading, display a loading indicator with progress
  if (isLoadingState) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Generating AI Recommendations
          </CardTitle>
          <CardDescription>
            {progress?.message || generatingMessage || 'Please wait while we analyze your reviews...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {progress && (
              <>
                <Progress value={progress.progress} className="w-full h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{progress.stage === 'error' ? 'Error' : progress.stage.charAt(0).toUpperCase() + progress.stage.slice(1)}</span>
                  <span>{progress.progress}%</span>
                </div>
                {progress.stage === 'error' && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{progress.message}</AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // If generating, show the generating message
  if (generatingMessage && !progress) {
    return (
      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertTitle>Generating recommendations for {businessName}</AlertTitle>
        <AlertDescription>{generatingMessage}</AlertDescription>
      </Alert>
    );
  }

  // If no data, display a message
  if (!recommendationsData) {
    return (
      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertTitle>No recommendations available</AlertTitle>
        <AlertDescription>
          No recommendations have been generated yet. Select a business and generate recommendations.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Tabs defaultValue="urgent" className="w-full">
      <TabsList className="grid grid-cols-5 mb-4">
        <TabsTrigger value="urgent" className="flex items-center gap-1">
          <AlertTriangle className="h-4 w-4" /> Urgent
        </TabsTrigger>
        <TabsTrigger value="growth" className="flex items-center gap-1">
          <TrendingUp className="h-4 w-4" /> Growth
        </TabsTrigger>
        <TabsTrigger value="marketing" className="flex items-center gap-1">
          <Target className="h-4 w-4" /> Marketing
        </TabsTrigger>
        <TabsTrigger value="positioning" className="flex items-center gap-1">
          <Lightbulb className="h-4 w-4" /> Positioning
        </TabsTrigger>
        <TabsTrigger value="future" className="flex items-center gap-1">
          <Rocket className="h-4 w-4" /> Future
        </TabsTrigger>
      </TabsList>

      {/* Urgent Actions Tab */}
      <TabsContent value="urgent">
        <Card>
          <CardHeader>
            <CardTitle>Urgent Actions</CardTitle>
            <CardDescription>
              High-priority actions that should be addressed immediately
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recommendationsData.urgentActions && recommendationsData.urgentActions.length > 0 ? (
              <div className="space-y-4">
                {recommendationsData.urgentActions.map((action, index) => (
                  <Card key={`urgent-${index}`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="text-lg">{action.title || action}</CardTitle>
                        <div className="flex gap-2">
                          {action.impact && (
                            <Badge className={impactColors[action.impact as keyof typeof impactColors] || ''}>
                              Impact: {action.impact}
                            </Badge>
                          )}
                          {action.effort && (
                            <Badge className={effortColors[action.effort as keyof typeof effortColors] || ''}>
                              Effort: {action.effort}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p>{action.description || action}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No urgent actions</AlertTitle>
                <AlertDescription>
                  There are no urgent actions needed at this time. This is a good sign!
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Growth Strategies Tab */}
      <TabsContent value="growth">
        <Card>
          <CardHeader>
            <CardTitle>Growth Strategies</CardTitle>
            <CardDescription>
              Strategic initiatives to help grow your business
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recommendationsData.growthStrategies && recommendationsData.growthStrategies.length > 0 ? (
              <div className="space-y-4">
                {recommendationsData.growthStrategies.map((strategy, index) => (
                  <Card key={`growth-${index}`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="text-lg">{strategy.title || strategy}</CardTitle>
                        <div className="flex gap-2">
                          {strategy.impact && (
                            <Badge className={impactColors[strategy.impact as keyof typeof impactColors] || ''}>
                              Impact: {strategy.impact}
                            </Badge>
                          )}
                          {strategy.effort && (
                            <Badge className={effortColors[strategy.effort as keyof typeof effortColors] || ''}>
                              Effort: {strategy.effort}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p>{strategy.description || strategy}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No growth strategies</AlertTitle>
                <AlertDescription>
                  No growth strategies have been generated yet.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Marketing Plan Tab */}
      <TabsContent value="marketing">
        <Card>
          <CardHeader>
            <CardTitle>{recommendationsData.customerAttractionPlan?.title || 'Marketing Plan'}</CardTitle>
            <CardDescription>
              {recommendationsData.customerAttractionPlan?.description || 'Strategies to attract and retain customers'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(recommendationsData.customerAttractionPlan?.strategies && recommendationsData.customerAttractionPlan.strategies.length > 0) || 
             (recommendationsData.marketingPlan && recommendationsData.marketingPlan.length > 0) ? (
              <div className="space-y-4">
                {(recommendationsData.customerAttractionPlan?.strategies || recommendationsData.marketingPlan || []).map((strategy, index) => (
                  <Card key={`marketing-${index}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{strategy.title || strategy}</CardTitle>
                      <div className="flex flex-wrap gap-2">
                        {strategy.timeline && (
                          <Badge variant="outline">Timeline: {strategy.timeline}</Badge>
                        )}
                        {strategy.cost && (
                          <Badge variant="outline">Cost: {strategy.cost}</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p>{strategy.description || strategy}</p>
                      {strategy.expectedOutcome && (
                        <div className="mt-2">
                          <p className="font-medium">Expected Outcome:</p>
                          <p className="text-sm">{strategy.expectedOutcome}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No marketing strategies</AlertTitle>
                <AlertDescription>
                  No marketing strategies have been generated yet.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Competitive Positioning Tab */}
      <TabsContent value="positioning">
        <Card>
          <CardHeader>
            <CardTitle>{recommendationsData.competitivePositioning?.title || 'Competitive Positioning'}</CardTitle>
            <CardDescription>
              {recommendationsData.competitivePositioning?.description || 'Analysis of your market position'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recommendationsData.competitivePositioning || (recommendationsData.competitiveAnalysis && recommendationsData.competitiveAnalysis.length > 0) ? (
              <div className="space-y-6">
                {/* If we have competitiveAnalysis array (simple format) */}
                {recommendationsData.competitiveAnalysis && recommendationsData.competitiveAnalysis.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Competitive Insights</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {recommendationsData.competitiveAnalysis.map((insight, index) => (
                        <li key={`insight-${index}`}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Strengths */}
                {recommendationsData.competitivePositioning?.strengths && recommendationsData.competitivePositioning.strengths.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Strengths</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {recommendationsData.competitivePositioning.strengths.map((strength, index) => (
                        <li key={`strength-${index}`}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Opportunities */}
                {recommendationsData.competitivePositioning?.opportunities && recommendationsData.competitivePositioning.opportunities.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Opportunities</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {recommendationsData.competitivePositioning.opportunities.map((opportunity, index) => (
                        <li key={`opportunity-${index}`}>{opportunity}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {recommendationsData.competitivePositioning?.recommendations && recommendationsData.competitivePositioning.recommendations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Recommendations</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {recommendationsData.competitivePositioning.recommendations.map((recommendation, index) => (
                        <li key={`positioning-rec-${index}`}>{recommendation}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No positioning analysis</AlertTitle>
                <AlertDescription>
                  No competitive positioning analysis has been generated yet.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Future Projections Tab */}
      <TabsContent value="future">
        <Card>
          <CardHeader>
            <CardTitle>Future Projections</CardTitle>
            <CardDescription>
              Forecasts and predictions for your business
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recommendationsData.futureProjections ? (
              <div className="space-y-6">
                {/* Short-Term Projections */}
                {recommendationsData.futureProjections.shortTerm && recommendationsData.futureProjections.shortTerm.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Short-Term (3-6 months)</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {recommendationsData.futureProjections.shortTerm.map((projection, index) => (
                        <li key={`short-term-${index}`}>{projection}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Long-Term Projections */}
                {recommendationsData.futureProjections.longTerm && recommendationsData.futureProjections.longTerm.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Long-Term (1-2 years)</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {recommendationsData.futureProjections.longTerm.map((projection, index) => (
                        <li key={`long-term-${index}`}>{projection}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No future projections</AlertTitle>
                <AlertDescription>
                  No future projections have been generated yet.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default RecommendationsDashboard;
