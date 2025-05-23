import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Calendar, 
  Activity,
  Brain,
  Zap
} from 'lucide-react';
import { Review } from '@/types/reviews';
import { CustomBarLineTooltip } from '@/components/review-analysis/CustomTooltips';
import { format, addMonths, subMonths, parseISO, differenceInDays } from 'date-fns';

interface PredictiveAnalyticsProps {
  reviews: Review[];
  businessName: string;
  businessType: string;
}

interface TrendPrediction {
  period: string;
  actualRating?: number;
  predictedRating: number;
  confidence: number;
  actualVolume?: number;
  predictedVolume: number;
  isPredicted: boolean;
}

interface RiskIndicator {
  type: 'rating_decline' | 'volume_drop' | 'sentiment_shift' | 'seasonal_risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  description: string;
  recommendation: string;
  timeframe: string;
}

interface SeasonalForecast {
  month: string;
  expectedVolume: number;
  expectedRating: number;
  seasonalityFactor: number;
  recommendations: string[];
}

export function PredictiveAnalytics({ reviews, businessName, businessType }: PredictiveAnalyticsProps) {
  const [selectedPredictionType, setSelectedPredictionType] = useState<string>('trends');

  // Group reviews by month for trend analysis
  const monthlyData = useMemo(() => {
    const monthlyGroups = reviews.reduce((acc, review) => {
      const date = parseISO(review.publishedAtDate);
      const monthKey = format(date, 'yyyy-MM');
      
      if (!acc[monthKey]) {
        acc[monthKey] = { reviews: [], total: 0, ratingSum: 0 };
      }
      acc[monthKey].reviews.push(review);
      acc[monthKey].total += 1;
      acc[monthKey].ratingSum += review.stars;
      return acc;
    }, {} as Record<string, { reviews: Review[], total: number, ratingSum: number }>);

    return Object.entries(monthlyGroups)
      .map(([month, data]) => ({
        month,
        avgRating: data.ratingSum / data.total,
        volume: data.total,
        reviews: data.reviews,
        date: parseISO(month + '-01')
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [reviews]);

  // Generate trend predictions using simple linear regression
  const trendPredictions = useMemo((): TrendPrediction[] => {
    if (monthlyData.length < 3) return [];

    // Calculate linear regression for ratings and volume
    const n = monthlyData.length;
    const sumX = monthlyData.reduce((sum, _, i) => sum + i, 0);
    const sumY = monthlyData.reduce((sum, data) => sum + data.avgRating, 0);
    const sumXY = monthlyData.reduce((sum, data, i) => sum + (i * data.avgRating), 0);
    const sumX2 = monthlyData.reduce((sum, _, i) => sum + (i * i), 0);

    // Rating trend
    const ratingSlope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const ratingIntercept = (sumY - ratingSlope * sumX) / n;

    // Volume trend
    const sumVY = monthlyData.reduce((sum, data) => sum + data.volume, 0);
    const sumVXY = monthlyData.reduce((sum, data, i) => sum + (i * data.volume), 0);
    const volumeSlope = (n * sumVXY - sumX * sumVY) / (n * sumX2 - sumX * sumX);
    const volumeIntercept = (sumVY - volumeSlope * sumX) / n;

    // Generate predictions for next 6 months
    const predictions: TrendPrediction[] = [];
    
    // Add historical data
    monthlyData.forEach((data, i) => {
      predictions.push({
        period: format(data.date, 'MMM yyyy'),
        actualRating: data.avgRating,
        predictedRating: ratingIntercept + ratingSlope * i,
        actualVolume: data.volume,
        predictedVolume: Math.max(0, volumeIntercept + volumeSlope * i),
        confidence: 95 - (i * 2), // Confidence decreases over time
        isPredicted: false
      });
    });

    // Add future predictions
    for (let i = 0; i < 6; i++) {
      const futureIndex = n + i;
      const futureDate = addMonths(monthlyData[n - 1].date, i + 1);
      const predictedRating = ratingIntercept + ratingSlope * futureIndex;
      const predictedVolume = Math.max(0, volumeIntercept + volumeSlope * futureIndex);
      
      predictions.push({
        period: format(futureDate, 'MMM yyyy'),
        predictedRating: Math.max(1, Math.min(5, predictedRating)),
        predictedVolume: Math.round(predictedVolume),
        confidence: Math.max(50, 90 - (i * 8)), // Decreasing confidence
        isPredicted: true
      });
    }

    return predictions;
  }, [monthlyData]);

  // Identify risk indicators
  const riskIndicators = useMemo((): RiskIndicator[] => {
    const risks: RiskIndicator[] = [];
    
    if (monthlyData.length < 2) return risks;

    // Recent rating trend analysis
    const recentMonths = monthlyData.slice(-3);
    const ratingTrend = recentMonths.length > 1 ? 
      recentMonths[recentMonths.length - 1].avgRating - recentMonths[0].avgRating : 0;

    if (ratingTrend < -0.3) {
      risks.push({
        type: 'rating_decline',
        severity: ratingTrend < -0.6 ? 'critical' : 'high',
        probability: Math.min(90, Math.abs(ratingTrend) * 100),
        description: `Rating has declined by ${Math.abs(ratingTrend).toFixed(1)} stars over recent months`,
        recommendation: 'Investigate recent service issues and implement immediate improvements',
        timeframe: '1-2 months'
      });
    }

    // Volume drop analysis
    const volumeTrend = recentMonths.length > 1 ?
      ((recentMonths[recentMonths.length - 1].volume - recentMonths[0].volume) / recentMonths[0].volume) * 100 : 0;

    if (volumeTrend < -20) {
      risks.push({
        type: 'volume_drop',
        severity: volumeTrend < -40 ? 'high' : 'medium',
        probability: Math.min(85, Math.abs(volumeTrend)),
        description: `Review volume has decreased by ${Math.abs(volumeTrend).toFixed(0)}%`,
        recommendation: 'Increase customer engagement and implement review solicitation strategies',
        timeframe: '2-3 months'
      });
    }

    // Sentiment shift analysis
    const sentimentScores = recentMonths.map(month => {
      const positiveReviews = month.reviews.filter(r => r.stars >= 4).length;
      return (positiveReviews / month.reviews.length) * 100;
    });

    if (sentimentScores.length > 1) {
      const sentimentChange = sentimentScores[sentimentScores.length - 1] - sentimentScores[0];
      if (sentimentChange < -15) {
        risks.push({
          type: 'sentiment_shift',
          severity: sentimentChange < -25 ? 'high' : 'medium',
          probability: Math.min(80, Math.abs(sentimentChange) * 2),
          description: `Customer sentiment has declined by ${Math.abs(sentimentChange).toFixed(0)}%`,
          recommendation: 'Address negative feedback patterns and improve customer experience',
          timeframe: '1-2 months'
        });
      }
    }

    // Seasonal risk analysis
    const currentMonth = new Date().getMonth();
    const historicalSeasonality = calculateSeasonalRisk(monthlyData, currentMonth);
    if (historicalSeasonality.risk > 0.6) {
      risks.push({
        type: 'seasonal_risk',
        severity: 'medium',
        probability: historicalSeasonality.risk * 100,
        description: 'Historical data suggests lower performance during this season',
        recommendation: 'Prepare seasonal strategies and promotional campaigns',
        timeframe: '1-3 months'
      });
    }

    return risks.sort((a, b) => b.probability - a.probability);
  }, [monthlyData]);

  // Generate seasonal forecasts
  const seasonalForecasts = useMemo((): SeasonalForecast[] => {
    if (monthlyData.length < 12) return [];

    const forecasts: SeasonalForecast[] = [];
    
    for (let i = 0; i < 12; i++) {
      const month = addMonths(new Date(), i);
      const monthName = format(month, 'MMMM yyyy');
      const monthIndex = month.getMonth();
      
      // Calculate historical averages for this month
      const historicalData = monthlyData.filter(data => data.date.getMonth() === monthIndex);
      
      if (historicalData.length > 0) {
        const avgVolume = historicalData.reduce((sum, data) => sum + data.volume, 0) / historicalData.length;
        const avgRating = historicalData.reduce((sum, data) => sum + data.avgRating, 0) / historicalData.length;
        
        // Calculate seasonality factor
        const overallAvgVolume = monthlyData.reduce((sum, data) => sum + data.volume, 0) / monthlyData.length;
        const seasonalityFactor = avgVolume / overallAvgVolume;
        
        // Generate recommendations based on historical patterns
        const recommendations: string[] = [];
        if (seasonalityFactor > 1.2) {
          recommendations.push('Peak season - ensure adequate staffing');
          recommendations.push('Leverage high traffic for upselling opportunities');
        } else if (seasonalityFactor < 0.8) {
          recommendations.push('Quiet season - focus on customer retention');
          recommendations.push('Consider promotional campaigns to drive traffic');
        }
        
        if (avgRating < 4.0) {
          recommendations.push('Historical data shows quality issues - implement preventive measures');
        }

        forecasts.push({
          month: monthName,
          expectedVolume: Math.round(avgVolume),
          expectedRating: Number(avgRating.toFixed(1)),
          seasonalityFactor: Number(seasonalityFactor.toFixed(2)),
          recommendations
        });
      }
    }

    return forecasts;
  }, [monthlyData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Predictive Analytics & Forecasting
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedPredictionType} onValueChange={setSelectedPredictionType}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trends">Trend Predictions</TabsTrigger>
            <TabsTrigger value="risks">Risk Analysis</TabsTrigger>
            <TabsTrigger value="seasonal">Seasonal Forecast</TabsTrigger>
            <TabsTrigger value="projections">Performance Projections</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rating Trend Prediction */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Rating Trend Prediction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendPredictions}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis domain={[0, 5]} />
                      <Tooltip content={<CustomBarLineTooltip />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="actualRating" 
                        stroke="#8884d8" 
                        strokeWidth={3}
                        name="Actual Rating"
                        connectNulls={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="predictedRating" 
                        stroke="#ff7300" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Predicted Rating"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Volume Trend Prediction */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Volume Trend Prediction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={trendPredictions}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip content={<CustomBarLineTooltip />} />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="actualVolume" 
                        stroke="#82ca9d" 
                        fill="#82ca9d"
                        fillOpacity={0.6}
                        name="Actual Volume"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="predictedVolume" 
                        stroke="#ffc658" 
                        fill="#ffc658"
                        fillOpacity={0.3}
                        name="Predicted Volume"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Prediction Confidence */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prediction Confidence Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {trendPredictions.filter(p => p.isPredicted).slice(0, 6).map((prediction, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{prediction.period}</span>
                        <Badge variant={prediction.confidence > 70 ? 'default' : prediction.confidence > 50 ? 'secondary' : 'outline'}>
                          {prediction.confidence}% confidence
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div>Rating: {prediction.predictedRating.toFixed(1)}★</div>
                        <div>Volume: {prediction.predictedVolume} reviews</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risks" className="space-y-6">
            {riskIndicators.length === 0 ? (
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  No significant risks detected based on current data patterns. Continue monitoring for early warning signs.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {riskIndicators.map((risk, index) => (
                  <Alert key={index} variant={
                    risk.severity === 'critical' ? 'destructive' : 
                    risk.severity === 'high' ? 'destructive' : 'default'
                  }>
                    <AlertTriangle className="h-4 w-4" />
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold capitalize">{risk.type.replace('_', ' ')}</span>
                        <Badge variant={
                          risk.severity === 'critical' ? 'destructive' :
                          risk.severity === 'high' ? 'destructive' :
                          risk.severity === 'medium' ? 'secondary' : 'outline'
                        }>
                          {risk.severity} - {risk.probability.toFixed(0)}% probability
                        </Badge>
                        <Badge variant="outline">{risk.timeframe}</Badge>
                      </div>
                      <AlertDescription className="mb-2">
                        {risk.description}
                      </AlertDescription>
                      <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                        <strong>Recommendation:</strong> {risk.recommendation}
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="seasonal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  12-Month Seasonal Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                {seasonalForecasts.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      Insufficient historical data for seasonal forecasting. Need at least 12 months of data.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {seasonalForecasts.slice(0, 6).map((forecast, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">{forecast.month}</h4>
                          <div className="flex gap-2">
                            <Badge variant="outline">
                              {forecast.expectedRating}★ rating
                            </Badge>
                            <Badge variant="secondary">
                              {forecast.expectedVolume} reviews
                            </Badge>
                            <Badge variant={
                              forecast.seasonalityFactor > 1.2 ? 'default' :
                              forecast.seasonalityFactor < 0.8 ? 'destructive' : 'secondary'
                            }>
                              {forecast.seasonalityFactor}x seasonal
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Recommendations:</h5>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {forecast.recommendations.map((rec, recIndex) => (
                              <li key={recIndex}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projections" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <CardTitle className="text-lg">3-Month Outlook</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Expected Rating:</span>
                      <span className="font-semibold">
                        {(trendPredictions.filter(p => p.isPredicted).slice(0, 3).reduce((avg, p) => avg + p.predictedRating, 0) / 3).toFixed(1) || 0}★
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expected Volume:</span>
                      <span className="font-semibold">
                        {Math.round(trendPredictions.filter(p => p.isPredicted).slice(0, 3).reduce((avg, p) => avg + p.predictedVolume, 0) / 3) || 0} reviews
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence:</span>
                      <span className="font-semibold">
                        {Math.round(trendPredictions.filter(p => p.isPredicted).slice(0, 3).reduce((avg, p) => avg + p.confidence, 0) / 3) || 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <CardTitle className="text-lg">6-Month Outlook</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Expected Rating:</span>
                      <span className="font-semibold">
                        {(trendPredictions.filter(p => p.isPredicted).slice(0, 6).reduce((avg, p) => avg + p.predictedRating, 0) / 6).toFixed(1) || 0}★
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expected Volume:</span>
                      <span className="font-semibold">
                        {Math.round(trendPredictions.filter(p => p.isPredicted).slice(0, 6).reduce((avg, p) => avg + p.predictedVolume, 0) / 6) || 0} reviews
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence:</span>
                      <span className="font-semibold">
                        {Math.round(trendPredictions.filter(p => p.isPredicted).slice(0, 6).reduce((avg, p) => avg + p.confidence, 0) / 6) || 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <CardTitle className="text-lg">Risk Summary</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>High Priority Risks:</span>
                      <span className="font-semibold text-red-600">
                        {riskIndicators.filter(r => r.severity === 'high' || r.severity === 'critical').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Medium Priority:</span>
                      <span className="font-semibold text-yellow-600">
                        {riskIndicators.filter(r => r.severity === 'medium').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Low Priority:</span>
                      <span className="font-semibold text-green-600">
                        {riskIndicators.filter(r => r.severity === 'low').length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Helper function to calculate seasonal risk
function calculateSeasonalRisk(monthlyData: any[], currentMonth: number): { risk: number } {
  const sameMonthData = monthlyData.filter(data => data.date.getMonth() === currentMonth);
  if (sameMonthData.length === 0) return { risk: 0 };

  const avgRating = sameMonthData.reduce((sum, data) => sum + data.avgRating, 0) / sameMonthData.length;
  const overallAvg = monthlyData.reduce((sum, data) => sum + data.avgRating, 0) / monthlyData.length;
  
  // Risk is higher when this month historically performs worse
  const risk = Math.max(0, (overallAvg - avgRating) / overallAvg);
  return { risk };
}

export default PredictiveAnalytics;
