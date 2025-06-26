import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import type { Recommendations } from '@/types/recommendations'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Info, AlertTriangle, Lightbulb, TrendingUp, Target, Rocket, Loader2, Sparkles, Zap, Shield, Timer, DollarSign, ChevronRight, Bot, Brain } from 'lucide-react'
import type { GenerationProgress } from '@/hooks/useRecommendations'

// Enhanced color mappings with gradients
const impactColors = {
  Low: 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200',
  Medium: 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border-amber-200',
  High: 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-200',
}

const effortColors = {
  Low: 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200',
  Medium: 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 border-yellow-200',
  High: 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border-purple-200',
}

// Icon mapping for different categories
const categoryIcons = {
  urgent: <Zap className="h-4 w-4" />,
  growth: <TrendingUp className="h-4 w-4" />,
  marketing: <Target className="h-4 w-4" />,
  positioning: <Shield className="h-4 w-4" />,
  future: <Rocket className="h-4 w-4" />,
}

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

export const RecommendationsDashboard: React.FC<RecommendationsDashboardProps> = ({
  data,
  isLoading = false,
  error = null,
  onRefresh,
  recommendations,
  loading,
  generatingMessage,
  businessName,
  progress,
}) => {
  const recommendationsData = data || recommendations
  const isLoadingState = isLoading || loading

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4 border-2">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle>Oops! Something went wrong</AlertTitle>
        <AlertDescription className="mt-2">
          {error.message || 'We couldn\'t generate recommendations right now. Let\'s try again!'}
        </AlertDescription>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} className="mt-3">
            <ChevronRight className="h-4 w-4 mr-1" /> Try Again
          </Button>
        )}
      </Alert>
    )
  }

  if (isLoadingState) {
    return (
      <Card className="w-full border-2 shadow-lg bg-gradient-to-br from-gray-800 to-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-primary/10 rounded-full">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Crafting Your Success Strategy
            </span>
          </CardTitle>
          <CardDescription className="text-base mt-2 text-gray-300">
            {progress?.message || generatingMessage || 'Our AI is analyzing your reviews and creating personalized recommendations...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {progress && (
              <>
                <Progress value={progress.progress} className="w-full h-3" />
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-primary">
                    {progress.stage === 'error' ? '❌ Error' : `✨ ${progress.stage.charAt(0).toUpperCase() + progress.stage.slice(1)}`}
                  </span>
                  <span className="font-bold text-primary">{progress.progress}%</span>
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
    )
  }

  if (generatingMessage && !progress) {
    return (
      <Alert className="mb-4 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-purple-50">
        <Sparkles className="h-5 w-5 text-primary" />
        <AlertTitle className="text-lg">Creating magic for {businessName} ✨</AlertTitle>
        <AlertDescription className="mt-1">{generatingMessage}</AlertDescription>
      </Alert>
    )
  }

  if (!recommendationsData) {
    return (
      <Alert className="mb-4 border-2 bg-gradient-to-r from-gray-50 to-white">
        <Info className="h-5 w-5" />
        <AlertTitle className="text-lg">Ready to unlock your potential?</AlertTitle>
        <AlertDescription className="mt-1">
          Select a business above and click "Generate Recommendations" to get started with AI-powered insights!
        </AlertDescription>
      </Alert>
    )
  }

  // Check if recommendations are AI-generated or fallback
  const isAIGenerated = recommendationsData.metadata?.source &&
    ['openai', 'claude', 'gemini'].includes(recommendationsData.metadata.source)
  const isFallback = recommendationsData.metadata?.source === 'fallback'

  return (
    <>
      {/* Metadata indicator */}
      {recommendationsData.metadata && (
        <Alert className={`mb-4 border-2 ${isAIGenerated ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'}`}>
          <div className="flex items-center gap-2">
            {isAIGenerated ? (
              <>
                <Brain className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-800">AI-Powered Recommendations</AlertTitle>
              </>
            ) : (
              <>
                <Bot className="h-5 w-5 text-amber-600" />
                <AlertTitle className="text-amber-800">General Recommendations</AlertTitle>
              </>
            )}
          </div>
          <AlertDescription className={`mt-1 ${isAIGenerated ? 'text-green-700' : 'text-amber-700'}`}>
            {isAIGenerated ? (
              <>Generated by {recommendationsData.metadata.provider || 'AI'}
              {recommendationsData.metadata.model && ` (${recommendationsData.metadata.model})`}
              {recommendationsData.metadata.reviewsAnalyzed && ` • Analyzed ${recommendationsData.metadata.reviewsAnalyzed} reviews`}</>
            ) : (
              <>Using pre-configured best practices{recommendationsData.metadata.reason ? ` (${recommendationsData.metadata.reason})` : ''}</>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="urgent" className="w-full">
        <TabsList className="grid grid-cols-5 mb-6 h-auto p-1 bg-gray-700 backdrop-blur">
          <TabsTrigger
            value="urgent"
            className="flex items-center gap-2 transition-all text-gray-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-md"
          >
            {categoryIcons.urgent}
            <span className="hidden sm:inline">Urgent</span>
          </TabsTrigger>
          <TabsTrigger
            value="growth"
            className="flex items-center gap-2 transition-all text-gray-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md"
          >
            {categoryIcons.growth}
            <span className="hidden sm:inline">Growth</span>
          </TabsTrigger>
          <TabsTrigger
            value="marketing"
            className="flex items-center gap-2 transition-all text-gray-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md"
          >
            {categoryIcons.marketing}
            <span className="hidden sm:inline">Marketing</span>
          </TabsTrigger>
          <TabsTrigger
            value="positioning"
            className="flex items-center gap-2 transition-all text-gray-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md"
          >
            {categoryIcons.positioning}
            <span className="hidden sm:inline">Position</span>
          </TabsTrigger>
          <TabsTrigger
            value="future"
            className="flex items-center gap-2 transition-all text-gray-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md"
          >
            {categoryIcons.future}
            <span className="hidden sm:inline">Future</span>
          </TabsTrigger>
        </TabsList>

        {/* Urgent Actions Tab */}
        <TabsContent value="urgent">
          <Card className="border-2 shadow-lg bg-gray-900">
            <CardHeader className="bg-gradient-to-r from-red-600 to-orange-600 rounded-t-lg text-white">
              <CardTitle className="flex items-center gap-3 text-2xl text-white">
                <div className="p-2 bg-white/20 backdrop-blur rounded-full">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                Quick Wins & Urgent Actions
              </CardTitle>
              <CardDescription className="text-base mt-2 text-red-50">
                🎯 Focus on these high-impact actions to see immediate improvements
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {recommendationsData.urgentActions && recommendationsData.urgentActions.length > 0 ? (
                <div className="space-y-4">
                  {recommendationsData.urgentActions.map((action, index) => (
                    <Card key={`urgent-${index}`} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-red-400 bg-gray-800 border-gray-700">
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <CardTitle className="text-lg flex items-start gap-2 text-white">
                            <span className="text-red-400 font-bold">#{index + 1}</span>
                            {action.title || action}
                          </CardTitle>
                          <div className="flex gap-2 flex-wrap">
                            {action.impact && (
                              <Badge className={`${impactColors[action.impact as keyof typeof impactColors]} border`}>
                                ⚡ {action.impact} Impact
                              </Badge>
                            )}
                            {action.effort && (
                              <Badge className={`${effortColors[action.effort as keyof typeof effortColors]} border`}>
                                💪 {action.effort} Effort
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-300 leading-relaxed">
                          {action.description || action}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert className="bg-green-50 border-green-200">
                  <Sparkles className="h-5 w-5 text-green-600" />
                  <AlertTitle className="text-green-800">Great news!</AlertTitle>
                  <AlertDescription className="text-green-700">
                    No urgent actions needed right now. You're doing fantastic! 🎉
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Growth Strategies Tab */}
        <TabsContent value="growth">
          <Card className="border-2 shadow-lg bg-gray-900">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-t-lg text-white">
              <CardTitle className="flex items-center gap-3 text-2xl text-white">
                <div className="p-2 bg-white/20 backdrop-blur rounded-full">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                Growth Strategies That Work
              </CardTitle>
              <CardDescription className="text-base mt-2 text-emerald-50">
                🚀 Strategic initiatives to accelerate your business growth
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {recommendationsData.growthStrategies && recommendationsData.growthStrategies.length > 0 ? (
                <div className="space-y-4">
                  {recommendationsData.growthStrategies.map((strategy, index) => (
                    <Card key={`growth-${index}`} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-green-400 bg-gray-800 border-gray-700">
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <CardTitle className="text-lg flex items-start gap-2 text-white">
                            <span className="text-green-400 font-bold">#{index + 1}</span>
                            {strategy.title || strategy}
                          </CardTitle>
                          <div className="flex gap-2 flex-wrap">
                            {strategy.impact && (
                              <Badge className={`${impactColors[strategy.impact as keyof typeof impactColors]} border`}>
                                📈 {strategy.impact} Impact
                              </Badge>
                            )}
                            {strategy.effort && (
                              <Badge className={`${effortColors[strategy.effort as keyof typeof effortColors]} border`}>
                                ⏱️ {strategy.effort} Effort
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-300 leading-relaxed">
                          {strategy.description || strategy}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert>
                  <Info className="h-5 w-5" />
                  <AlertTitle>No growth strategies yet</AlertTitle>
                  <AlertDescription>
                    Generate recommendations to see personalized growth strategies.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marketing Plan Tab */}
        <TabsContent value="marketing">
          <Card className="border-2 shadow-lg bg-gray-900">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-lg text-white">
              <CardTitle className="flex items-center gap-3 text-2xl text-white">
                <div className="p-2 bg-white/20 backdrop-blur rounded-full">
                  <Target className="h-6 w-6 text-white" />
                </div>
                {recommendationsData.customerAttractionPlan?.title || 'Customer Attraction Playbook'}
              </CardTitle>
              <CardDescription className="text-base mt-2 text-blue-50">
                {recommendationsData.customerAttractionPlan?.description || '🎯 Proven strategies to attract and delight customers'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {(recommendationsData.customerAttractionPlan?.strategies && recommendationsData.customerAttractionPlan.strategies.length > 0) ||
               (recommendationsData.marketingPlan && recommendationsData.marketingPlan.length > 0) ? (
                <div className="space-y-4">
                  {(recommendationsData.customerAttractionPlan?.strategies || recommendationsData.marketingPlan || []).map((strategy, index) => (
                    <Card key={`marketing-${index}`} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-400 bg-gray-800 border-gray-700">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-start gap-2 text-white">
                          <span className="text-blue-400 font-bold">#{index + 1}</span>
                          {strategy.title || strategy}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {strategy.timeline && (
                            <Badge variant="outline" className="bg-blue-600 text-white border-blue-600">
                              <Timer className="h-3 w-3 mr-1" /> {strategy.timeline}
                            </Badge>
                          )}
                          {strategy.cost && (
                            <Badge variant="outline" className="bg-green-600 text-white border-green-600">
                              <DollarSign className="h-3 w-3 mr-1" /> {strategy.cost}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-300 leading-relaxed">
                          {strategy.description || strategy}
                        </p>
                        {strategy.expectedOutcome && (
                          <div className="mt-4 p-3 bg-blue-900/50 rounded-lg border border-blue-700">
                            <p className="font-semibold text-blue-200 text-sm">🎯 Expected Result:</p>
                            <p className="text-blue-100 text-sm mt-1">{strategy.expectedOutcome}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert>
                  <Info className="h-5 w-5" />
                  <AlertTitle>No marketing strategies yet</AlertTitle>
                  <AlertDescription>
                    Generate recommendations to see your personalized marketing plan.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitive Positioning Tab */}
        <TabsContent value="positioning">
          <Card className="border-2 shadow-lg bg-gray-900">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-lg text-white">
              <CardTitle className="flex items-center gap-3 text-2xl text-white">
                <div className="p-2 bg-white/20 backdrop-blur rounded-full">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                {recommendationsData.competitivePositioning?.title || 'Your Competitive Edge'}
              </CardTitle>
              <CardDescription className="text-base mt-2 text-purple-50">
                {recommendationsData.competitivePositioning?.description || '🏆 Understanding and leveraging your unique market position'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {recommendationsData.competitivePositioning || (recommendationsData.competitiveAnalysis && recommendationsData.competitiveAnalysis.length > 0) ? (
                <div className="space-y-6">
                  {/* Competitive Insights */}
                  {recommendationsData.competitiveAnalysis && recommendationsData.competitiveAnalysis.length > 0 && (
                    <div className="p-4 bg-purple-900/30 rounded-lg border border-purple-700">
                      <h3 className="text-lg font-semibold mb-3 text-purple-200">💡 Key Insights</h3>
                      <ul className="space-y-2">
                        {recommendationsData.competitiveAnalysis.map((insight, index) => (
                          <li key={`insight-${index}`} className="flex items-start gap-2">
                            <ChevronRight className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                            <span className="text-purple-100">{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Strengths */}
                  {recommendationsData.competitivePositioning?.strengths && recommendationsData.competitivePositioning.strengths.length > 0 && (
                    <div className="p-4 bg-green-900/30 rounded-lg border border-green-700">
                      <h3 className="text-lg font-semibold mb-3 text-green-200">💪 Your Strengths</h3>
                      <ul className="space-y-2">
                        {recommendationsData.competitivePositioning.strengths.map((strength, index) => (
                          <li key={`strength-${index}`} className="flex items-start gap-2">
                            <ChevronRight className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                            <span className="text-green-100">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Opportunities */}
                  {recommendationsData.competitivePositioning?.opportunities && recommendationsData.competitivePositioning.opportunities.length > 0 && (
                    <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-700">
                      <h3 className="text-lg font-semibold mb-3 text-blue-200">🚀 Growth Opportunities</h3>
                      <ul className="space-y-2">
                        {recommendationsData.competitivePositioning.opportunities.map((opportunity, index) => (
                          <li key={`opportunity-${index}`} className="flex items-start gap-2">
                            <ChevronRight className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                            <span className="text-blue-100">{opportunity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {recommendationsData.competitivePositioning?.recommendations && recommendationsData.competitivePositioning.recommendations.length > 0 && (
                    <div className="p-4 bg-amber-900/30 rounded-lg border border-amber-700">
                      <h3 className="text-lg font-semibold mb-3 text-amber-200">🎯 Strategic Actions</h3>
                      <ul className="space-y-2">
                        {recommendationsData.competitivePositioning.recommendations.map((recommendation, index) => (
                          <li key={`positioning-rec-${index}`} className="flex items-start gap-2">
                            <ChevronRight className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                            <span className="text-amber-100">{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <Alert>
                  <Info className="h-5 w-5" />
                  <AlertTitle>No positioning analysis yet</AlertTitle>
                  <AlertDescription>
                    Generate recommendations to see your competitive positioning analysis.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Future Projections Tab */}
        <TabsContent value="future">
          <Card className="border-2 shadow-lg bg-gray-900">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-lg text-white">
              <CardTitle className="flex items-center gap-3 text-2xl text-white">
                <div className="p-2 bg-white/20 backdrop-blur rounded-full">
                  <Rocket className="h-6 w-6 text-white" />
                </div>
                Your Future Success Path
              </CardTitle>
              <CardDescription className="text-base mt-2 text-indigo-50">
                🔮 Data-driven projections and milestones for your business journey
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {recommendationsData.futureProjections ? (
                <div className="space-y-6">
                  {/* Short-Term Projections */}
                  {recommendationsData.futureProjections.shortTerm && recommendationsData.futureProjections.shortTerm.length > 0 && (
                    <div className="p-4 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-lg border border-indigo-700">
                      <h3 className="text-lg font-semibold mb-3 text-indigo-200">📅 Next 3-6 Months</h3>
                      <ul className="space-y-3">
                        {recommendationsData.futureProjections.shortTerm.map((projection, index) => (
                          <li key={`short-term-${index}`} className="flex items-start gap-3">
                            <div className="p-1 bg-indigo-800 rounded-full flex-shrink-0">
                              <ChevronRight className="h-4 w-4 text-indigo-200" />
                            </div>
                            <span className="text-gray-200">{projection}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Long-Term Projections */}
                  {recommendationsData.futureProjections.longTerm && recommendationsData.futureProjections.longTerm.length > 0 && (
                    <div className="p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-700">
                      <h3 className="text-lg font-semibold mb-3 text-purple-200">🎯 1-2 Year Vision</h3>
                      <ul className="space-y-3">
                        {recommendationsData.futureProjections.longTerm.map((projection, index) => (
                          <li key={`long-term-${index}`} className="flex items-start gap-3">
                            <div className="p-1 bg-purple-800 rounded-full flex-shrink-0">
                              <ChevronRight className="h-4 w-4 text-purple-200" />
                            </div>
                            <span className="text-gray-200">{projection}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <Alert>
                  <Info className="h-5 w-5" />
                  <AlertTitle>No future projections yet</AlertTitle>
                  <AlertDescription>
                    Generate recommendations to see your personalized growth projections.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}

export default RecommendationsDashboard
