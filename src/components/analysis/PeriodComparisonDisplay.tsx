import React, { useState, useCallback } from 'react';
import { DateRangeSelector } from '@/components/monthly-report/DateRangeSelector';
import { useSelectedDateRange } from '@/components/monthly-report/hooks/useSelectedDateRange';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon, Loader2, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useDashboardData } from '@/hooks/useDashboardData';
import { compareDataPeriods } from '@/services/comparisonService';
import { EnhancedAnalysis } from '@/types/dataAnalysis';
import { Review } from '@/types/reviews';
import { generateEnhancedAnalysis } from '@/utils/reviewDataUtils';

export interface ComparisonResult {
  ratingChange: number;
  reviewCountChange: number;
  reviewCountChangePercent: number;
  sentimentChange: number;
  improvingThemes: string[];
  decliningThemes: string[];
  newThemes: string[];
  removedThemes: string[];
  staffPerformanceChanges: Record<string, number>;
}

export function PeriodComparisonDisplay({ 
  businessName 
}: { 
  businessName: string;
}) {
  // Get current date and calculate one month ago
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  
  // Use the same date range hook as Monthly Report for current period
  const currentPeriod = useSelectedDateRange({
    initialFrom: oneMonthAgo,
    initialTo: today
  });
  
  // Use the same date range hook as Monthly Report for previous period
  const previousPeriod = useSelectedDateRange({
    initialFrom: twoMonthsAgo,
    initialTo: oneMonthAgo
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [currentData, setCurrentData] = useState<EnhancedAnalysis | null>(null);
  const [previousData, setPreviousData] = useState<EnhancedAnalysis | null>(null);
  const [currentReviews, setCurrentReviews] = useState<Review[]>([]);
  const [previousReviews, setPreviousReviews] = useState<Review[]>([]);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  
  const { 
    loading: dashboardLoading, 
    getFilteredReviews,
    refreshData 
  } = useDashboardData();
  
  // Handle comparison with proper loading management
  const handleCompare = useCallback(async () => {
    setIsLoading(true);
    setLoadingProgress(0);
    setLoadingMessage('Initializing comparison...');
    
    try {
      // Ensure both date ranges have valid 'to' dates
      if (!currentPeriod.dateRange.to || !previousPeriod.dateRange.to) {
        setLoadingMessage('Please select complete date ranges for both periods.');
        setTimeout(() => {
          setIsLoading(false);
          setLoadingProgress(0);
          setLoadingMessage('');
        }, 2000);
        return;
      }
      
      // Step 1: Load current period data (33%)
      setLoadingMessage('Loading current period data...');
      setLoadingProgress(10);
      
      await refreshData(currentPeriod.dateRange.from, currentPeriod.dateRange.to);
      const currentPeriodReviews = getFilteredReviews();
      
      // Filter reviews by business if not "all"
      const filteredCurrentReviews = businessName === 'all' 
        ? currentPeriodReviews 
        : currentPeriodReviews.filter(review => 
            review.title === businessName || 
            review.businesses?.name === businessName
          );
      
      setCurrentReviews(filteredCurrentReviews);
      const currentAnalysis = generateEnhancedAnalysis(filteredCurrentReviews, businessName);
      setCurrentData(currentAnalysis);
      
      setLoadingProgress(33);
      
      // Step 2: Load previous period data (66%)
      setLoadingMessage('Loading previous period data...');
      
      await refreshData(previousPeriod.dateRange.from, previousPeriod.dateRange.to);
      const previousPeriodReviews = getFilteredReviews();
      
      // Filter reviews by business if not "all"
      const filteredPreviousReviews = businessName === 'all' 
        ? previousPeriodReviews 
        : previousPeriodReviews.filter(review => 
            review.title === businessName || 
            review.businesses?.name === businessName
          );
      
      setPreviousReviews(filteredPreviousReviews);
      const previousAnalysis = generateEnhancedAnalysis(filteredPreviousReviews, businessName);
      setPreviousData(previousAnalysis);
      
      setLoadingProgress(66);
      
      // Step 3: Generate comparison (100%)
      setLoadingMessage('Generating comparison report...');
      
      if (currentAnalysis && previousAnalysis) {
        const result = compareDataPeriods(
          currentAnalysis, 
          previousAnalysis,
          filteredCurrentReviews,
          filteredPreviousReviews
        );
        setComparisonResult(result);
      }
      
      setLoadingProgress(100);
      setLoadingMessage('Comparison complete!');
      
      // Small delay to show completion
      setTimeout(() => {
        setIsLoading(false);
        setLoadingProgress(0);
        setLoadingMessage('');
      }, 500);
      
    } catch (error) {
      console.error("Error during comparison:", error);
      setLoadingMessage('Error during comparison. Please try again.');
      setTimeout(() => {
        setIsLoading(false);
        setLoadingProgress(0);
        setLoadingMessage('');
      }, 2000);
    }
  }, [businessName, currentPeriod.dateRange, previousPeriod.dateRange, refreshData, getFilteredReviews]);
  
  return (
    <div className="space-y-6">
      {/* Current Period Date Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>Current Period</CardTitle>
          </div>
          <CardDescription>Select the current period for comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <DateRangeSelector
            dateRange={currentPeriod.dateRange}
            selectingDate={currentPeriod.selectingDate}
            setSelectingDate={currentPeriod.setSelectingDate}
            fromDateInput={currentPeriod.fromDateInput}
            setFromDateInput={currentPeriod.setFromDateInput}
            toDateInput={currentPeriod.toDateInput}
            setToDateInput={currentPeriod.setToDateInput}
            dateInputError={currentPeriod.dateInputError}
            dateRangePresets={currentPeriod.dateRangePresets}
            applyDateRangePreset={currentPeriod.applyDateRangePreset}
            handleDateSelect={currentPeriod.handleDateSelect}
            handleManualDateSubmit={currentPeriod.handleManualDateSubmit}
            isDateInRange={currentPeriod.isDateInRange}
          />
        </CardContent>
      </Card>
      
      {/* Previous Period Date Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>Previous Period</CardTitle>
          </div>
          <CardDescription>Select the previous period for comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <DateRangeSelector
            dateRange={previousPeriod.dateRange}
            selectingDate={previousPeriod.selectingDate}
            setSelectingDate={previousPeriod.setSelectingDate}
            fromDateInput={previousPeriod.fromDateInput}
            setFromDateInput={previousPeriod.setFromDateInput}
            toDateInput={previousPeriod.toDateInput}
            setToDateInput={previousPeriod.setToDateInput}
            dateInputError={previousPeriod.dateInputError}
            dateRangePresets={previousPeriod.dateRangePresets}
            applyDateRangePreset={previousPeriod.applyDateRangePreset}
            handleDateSelect={previousPeriod.handleDateSelect}
            handleManualDateSubmit={previousPeriod.handleManualDateSubmit}
            isDateInRange={previousPeriod.isDateInRange}
          />
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={handleCompare}
            disabled={isLoading || dashboardLoading || !currentPeriod.dateRange.to || !previousPeriod.dateRange.to}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : 'Compare Periods'}
          </Button>
        </CardFooter>
      </Card>
      
      {isLoading && (
        <Card>
          <CardContent className="py-6">
            <div className="space-y-4">
              <div className="flex justify-center items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-lg font-medium">{loadingMessage}</p>
              </div>
              <Progress value={loadingProgress} className="w-full" />
              <p className="text-center text-sm text-muted-foreground">
                {loadingProgress}% complete
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {!isLoading && comparisonResult && (
        <Card>
          <CardHeader>
            <CardTitle>Comparison Results</CardTitle>
            <CardDescription>
              Analysis of changes between the two selected periods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="metrics">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
                <TabsTrigger value="themes">Themes</TabsTrigger>
                <TabsTrigger value="staff">Staff Performance</TabsTrigger>
                <TabsTrigger value="details">Detailed Changes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="metrics" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <MetricCard 
                    title="Rating Change" 
                    value={comparisonResult.ratingChange} 
                    formatter={(val) => val.toFixed(2)}
                    positive={comparisonResult.ratingChange > 0}
                  />
                  <MetricCard 
                    title="Review Volume" 
                    value={comparisonResult.reviewCountChangePercent} 
                    formatter={(val) => `${val.toFixed(1)}%`}
                    positive={comparisonResult.reviewCountChange > 0}
                    subtitle={`${comparisonResult.reviewCountChange > 0 ? '+' : ''}${comparisonResult.reviewCountChange} reviews`}
                  />
                  <MetricCard 
                    title="Sentiment Change" 
                    value={comparisonResult.sentimentChange} 
                    formatter={(val) => val.toFixed(2)}
                    positive={comparisonResult.sentimentChange > 0}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="themes" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Theme Changes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-sm font-medium mb-2">Improving Themes</h3>
                          {comparisonResult.improvingThemes.length > 0 ? (
                            <div className="space-y-2">
                              {comparisonResult.improvingThemes.map(theme => (
                                <div key={theme} className="flex items-center text-sm">
                                  <ArrowUpIcon className="w-4 h-4 text-green-500 mr-2" />
                                  <span>{theme}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No improving themes found</p>
                          )}
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="text-sm font-medium mb-2">Declining Themes</h3>
                          {comparisonResult.decliningThemes.length > 0 ? (
                            <div className="space-y-2">
                              {comparisonResult.decliningThemes.map(theme => (
                                <div key={theme} className="flex items-center text-sm">
                                  <ArrowDownIcon className="w-4 h-4 text-red-500 mr-2" />
                                  <span>{theme}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No declining themes found</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Theme Presence</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-sm font-medium mb-2">New Themes</h3>
                          {comparisonResult.newThemes.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {comparisonResult.newThemes.map(theme => (
                                <Badge key={theme} variant="outline" className="bg-green-50">
                                  {theme}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No new themes found</p>
                          )}
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="text-sm font-medium mb-2">Removed Themes</h3>
                          {comparisonResult.removedThemes.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {comparisonResult.removedThemes.map(theme => (
                                <Badge key={theme} variant="outline" className="bg-red-50">
                                  {theme}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No removed themes found</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="staff" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Staff Performance Changes</CardTitle>
                    <CardDescription>
                      Changes in sentiment for mentioned staff members
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(comparisonResult.staffPerformanceChanges).length > 0 ? (
                      <div className="space-y-4">
                        {Object.entries(comparisonResult.staffPerformanceChanges)
                          .sort(([_, a], [__, b]) => b - a)
                          .map(([name, change]) => (
                            <div key={name} className="flex items-center justify-between p-2 rounded-md border">
                              <span className="font-medium">{name}</span>
                              <div className="flex items-center">
                                {change > 0.05 ? (
                                  <ArrowUpIcon className="w-5 h-5 text-green-500 mr-2" />
                                ) : change < -0.05 ? (
                                  <ArrowDownIcon className="w-5 h-5 text-red-500 mr-2" />
                                ) : (
                                  <MinusIcon className="w-5 h-5 text-gray-400 mr-2" />
                                )}
                                <span className={change > 0.05 ? 'text-green-500 font-medium' : change < -0.05 ? 'text-red-500 font-medium' : 'text-gray-500'}>
                                  {change > 0 ? '+' : ''}{change.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No staff performance data available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="details" className="mt-6">
                <Card>
                  <CardContent className="py-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Review Volume Details</h3>
                        <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-md">
                          <div>
                            <p className="text-sm text-muted-foreground">Previous Period</p>
                            <p className="text-xl font-semibold">
                              {previousReviews.length} reviews
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Current Period</p>
                            <p className="text-xl font-semibold">
                              {currentReviews.length} reviews
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">Rating Details</h3>
                        <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-md">
                          <div>
                            <p className="text-sm text-muted-foreground">Previous Period Average</p>
                            <p className="text-xl font-semibold">
                              {previousReviews.length > 0 
                                ? (previousReviews.reduce((sum, r) => sum + (r.stars || 0), 0) / previousReviews.filter(r => r.stars).length).toFixed(2)
                                : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Current Period Average</p>
                            <p className="text-xl font-semibold">
                              {currentReviews.length > 0 
                                ? (currentReviews.reduce((sum, r) => sum + (r.stars || 0), 0) / currentReviews.filter(r => r.stars).length).toFixed(2)
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper component for metric cards
const MetricCard = ({ 
  title, 
  value, 
  formatter, 
  positive, 
  subtitle 
}: { 
  title: string; 
  value: number; 
  formatter: (val: number) => string;
  positive: boolean;
  subtitle?: string;
}) => {
  const isNeutral = Math.abs(value) < 0.05;
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <div className="mt-2 flex items-center justify-center">
            {!isNeutral && (
              positive ? 
                <ArrowUpIcon className="w-6 h-6 text-green-500 mr-1" /> : 
                <ArrowDownIcon className="w-6 h-6 text-red-500 mr-1" />
            )}
            <h3 className={`text-3xl font-semibold ${
              isNeutral ? 'text-gray-700 dark:text-gray-300' :
              positive ? 'text-green-600 dark:text-green-400' : 
                       'text-red-600 dark:text-red-400'
            }`}>
              {value > 0 && '+'}
              {formatter(value)}
            </h3>
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
