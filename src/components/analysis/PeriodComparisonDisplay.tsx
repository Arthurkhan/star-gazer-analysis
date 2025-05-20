import React, { useState, useEffect } from 'react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDashboardData } from '@/hooks/useDashboardData';
import { compareDataPeriods } from '@/services/comparisonService';
import { EnhancedAnalysis } from '@/types/dataAnalysis';
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

interface DateRange {
  from: Date;
  to: Date;
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
  
  // Initialize date ranges
  const [currentRange, setCurrentRange] = useState<DateRange>({
    from: oneMonthAgo,
    to: today
  });
  
  const [previousRange, setPreviousRange] = useState<DateRange>({
    from: twoMonthsAgo,
    to: oneMonthAgo
  });
  
  const [isComparing, setIsComparing] = useState(false);
  const [isLoadingCurrent, setIsLoadingCurrent] = useState(false);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);
  const [currentData, setCurrentData] = useState<EnhancedAnalysis | null>(null);
  const [previousData, setPreviousData] = useState<EnhancedAnalysis | null>(null);
  
  const { 
    loading: dashboardLoading, 
    getFilteredReviews,
    refreshData 
  } = useDashboardData();
  
  // Load data for current period
  useEffect(() => {
    if (!isComparing) return;
    
    const loadCurrentPeriodData = async () => {
      setIsLoadingCurrent(true);
      try {
        // Refresh data for the current date range
        await refreshData(currentRange.from, currentRange.to);
        
        // Get filtered reviews for the business
        const reviews = getFilteredReviews();
        
        // Generate enhanced analysis from the reviews
        const enhancedAnalysis = generateEnhancedAnalysis(reviews, businessName);
        setCurrentData(enhancedAnalysis);
      } catch (error) {
        console.error("Error loading current period data:", error);
      } finally {
        setIsLoadingCurrent(false);
      }
    };
    
    loadCurrentPeriodData();
  }, [businessName, currentRange.from, currentRange.to, isComparing, refreshData, getFilteredReviews]);
  
  // Load data for previous period
  useEffect(() => {
    if (!isComparing) return;
    
    const loadPreviousPeriodData = async () => {
      setIsLoadingPrevious(true);
      try {
        // Refresh data for the previous date range
        await refreshData(previousRange.from, previousRange.to);
        
        // Get filtered reviews for the business
        const reviews = getFilteredReviews();
        
        // Generate enhanced analysis from the reviews
        const enhancedAnalysis = generateEnhancedAnalysis(reviews, businessName);
        setPreviousData(enhancedAnalysis);
      } catch (error) {
        console.error("Error loading previous period data:", error);
      } finally {
        setIsLoadingPrevious(false);
      }
    };
    
    loadPreviousPeriodData();
  }, [businessName, previousRange.from, previousRange.to, isComparing, refreshData, getFilteredReviews]);
  
  // Generate comparison result
  const comparisonResult = React.useMemo(() => {
    if (!isComparing || !currentData || !previousData) return null;
    return compareDataPeriods(currentData, previousData);
  }, [isComparing, currentData, previousData]);
  
  const formatDateRange = (range: DateRange) => {
    const dateFormat = new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    return `${dateFormat.format(range.from)} - ${dateFormat.format(range.to)}`;
  };
  
  const currentRangeLabel = formatDateRange(currentRange);
  const previousRangeLabel = formatDateRange(previousRange);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Period Comparison</CardTitle>
          <CardDescription>Compare review metrics across two time periods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Current Period</h3>
              <DateRangePicker
                value={{ from: currentRange.from, to: currentRange.to }}
                onChange={(range) => {
                  if (range?.from && range?.to) {
                    setCurrentRange({ from: range.from, to: range.to });
                    // Reset comparison when date range changes
                    setIsComparing(false);
                  }
                }}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Previous Period</h3>
              <DateRangePicker
                value={{ from: previousRange.from, to: previousRange.to }}
                onChange={(range) => {
                  if (range?.from && range?.to) {
                    setPreviousRange({ from: range.from, to: range.to });
                    // Reset comparison when date range changes
                    setIsComparing(false);
                  }
                }}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={() => setIsComparing(true)}
            disabled={isLoadingCurrent || isLoadingPrevious || dashboardLoading}
            size="lg"
          >
            {isLoadingCurrent || isLoadingPrevious ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : 'Compare Periods'}
          </Button>
        </CardFooter>
      </Card>
      
      {isComparing && (isLoadingCurrent || isLoadingPrevious) && (
        <Card>
          <CardContent className="py-6">
            <div className="flex justify-center items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Loading and comparing data...</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {isComparing && comparisonResult && (
        <Card>
          <CardHeader>
            <CardTitle>Comparison Results</CardTitle>
            <CardDescription>
              {previousRangeLabel} vs {currentRangeLabel}
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
                              {previousData?.reviewClusters.reduce((sum, c) => sum + c.count, 0) || 0} reviews
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Current Period</p>
                            <p className="text-xl font-semibold">
                              {currentData?.reviewClusters.reduce((sum, c) => sum + c.count, 0) || 0} reviews
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
                              {previousData?.historicalTrends[previousData.historicalTrends.length - 1]?.avgRating.toFixed(2) || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Current Period Average</p>
                            <p className="text-xl font-semibold">
                              {currentData?.historicalTrends[currentData.historicalTrends.length - 1]?.avgRating.toFixed(2) || 'N/A'}
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
