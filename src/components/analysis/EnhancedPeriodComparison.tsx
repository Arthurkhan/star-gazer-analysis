import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Calendar, TrendingUp, TrendingDown, Minus, Loader2, 
  Download, ChevronDown, Clock, Globe, MessageCircle,
  CalendarDays, CalendarRange, CalendarClock, FileText, FileSpreadsheet
} from 'lucide-react';
import { format, subMonths, subQuarters, subYears, startOfMonth, endOfMonth, isValid } from 'date-fns';
import { usePeriodComparison } from '@/hooks/usePeriodComparison';
import { DateRangeSelector } from '@/components/monthly-report/DateRangeSelector';
import { useSelectedDateRange } from '@/components/monthly-report/hooks/useSelectedDateRange';
import { exportPeriodComparisonReport, exportPeriodComparisonCSV } from '@/utils/periodComparisonExport';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EnhancedPeriodComparisonProps {
  businessName: string;
}

// Color scheme for charts
const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  tertiary: '#F59E0B',
  positive: '#10B981',
  negative: '#EF4444',
  neutral: '#6B7280'
};

export function EnhancedPeriodComparison({ businessName }: EnhancedPeriodComparisonProps) {
  const [showDateSelectors, setShowDateSelectors] = useState(false);
  
  // Initialize with last month vs previous month - ensure valid dates
  const today = new Date();
  const oneMonthAgo = subMonths(today, 1);
  const twoMonthsAgo = subMonths(today, 2);
  
  // Ensure dates are valid before using them
  const initialCurrentFrom = isValid(oneMonthAgo) ? startOfMonth(oneMonthAgo) : startOfMonth(today);
  const initialCurrentTo = isValid(oneMonthAgo) ? endOfMonth(oneMonthAgo) : endOfMonth(today);
  const initialPreviousFrom = isValid(twoMonthsAgo) ? startOfMonth(twoMonthsAgo) : startOfMonth(subMonths(today, 2));
  const initialPreviousTo = isValid(twoMonthsAgo) ? endOfMonth(twoMonthsAgo) : endOfMonth(subMonths(today, 2));
  
  // Date range hooks with validated dates
  const currentPeriod = useSelectedDateRange({
    initialFrom: initialCurrentFrom,
    initialTo: initialCurrentTo
  });
  
  const previousPeriod = useSelectedDateRange({
    initialFrom: initialPreviousFrom,
    initialTo: initialPreviousTo
  });
  
  // Period comparison hook
  const {
    isLoading,
    loadingProgress,
    loadingMessage,
    currentData,
    previousData,
    comparisonResult,
    comparePeriods,
  } = usePeriodComparison();
  
  // Quick comparison presets
  const handleQuickCompare = (preset: 'lastMonth' | 'lastQuarter' | 'lastYear') => {
    const now = new Date();
    let currentStart, currentEnd, previousStart, previousEnd;
    
    switch (preset) {
      case 'lastMonth':
        currentEnd = endOfMonth(subMonths(now, 1));
        currentStart = startOfMonth(subMonths(now, 1));
        previousEnd = endOfMonth(subMonths(now, 2));
        previousStart = startOfMonth(subMonths(now, 2));
        break;
      case 'lastQuarter':
        currentEnd = endOfMonth(subMonths(now, 1));
        currentStart = startOfMonth(subMonths(now, 3));
        previousEnd = endOfMonth(subMonths(now, 4));
        previousStart = startOfMonth(subMonths(now, 6));
        break;
      case 'lastYear':
        currentEnd = endOfMonth(subMonths(now, 1));
        currentStart = startOfMonth(subMonths(now, 1));
        previousEnd = endOfMonth(subMonths(now, 13));
        previousStart = startOfMonth(subMonths(now, 13));
        break;
    }
    
    currentPeriod.setDateRange({ from: currentStart, to: currentEnd });
    previousPeriod.setDateRange({ from: previousStart, to: previousEnd });
    
    comparePeriods(
      businessName,
      { from: currentStart, to: currentEnd },
      { from: previousStart, to: previousEnd }
    );
  };
  
  // Handle custom comparison
  const handleCustomCompare = () => {
    comparePeriods(
      businessName,
      currentPeriod.dateRange,
      previousPeriod.dateRange
    );
  };
  
  // Prepare chart data
  const ratingTrendData = React.useMemo(() => {
    if (!currentData || !previousData) return [];
    
    // Group reviews by day for both periods
    const groupByDay = (reviews: any[]) => {
      const grouped = new Map<string, { date: string; rating: number; count: number }>();
      
      reviews.forEach(review => {
        if (!review.publishedAtDate) return;
        const reviewDate = new Date(review.publishedAtDate);
        if (!isValid(reviewDate)) return;
        
        const date = format(reviewDate, 'yyyy-MM-dd');
        const existing = grouped.get(date) || { date, rating: 0, count: 0 };
        existing.rating += review.stars || 0;
        existing.count += 1;
        grouped.set(date, existing);
      });
      
      return Array.from(grouped.values())
        .map(item => ({
          date: format(new Date(item.date), 'MMM dd'),
          rating: item.count > 0 ? Number((item.rating / item.count).toFixed(2)) : 0
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    };
    
    const currentTrend = groupByDay(currentData.reviews);
    const previousTrend = groupByDay(previousData.reviews);
    
    // Merge data for comparison
    const allDates = new Set([
      ...currentTrend.map(d => d.date),
      ...previousTrend.map(d => d.date)
    ]);
    
    return Array.from(allDates).map(date => ({
      date,
      current: currentTrend.find(d => d.date === date)?.rating || null,
      previous: previousTrend.find(d => d.date === date)?.rating || null
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [currentData, previousData]);
  
  const sentimentData = React.useMemo(() => {
    if (!comparisonResult) return [];
    
    return [
      {
        name: 'Current Period',
        positive: currentData?.reviews.filter(r => r.sentiment === 'positive').length || 0,
        neutral: currentData?.reviews.filter(r => r.sentiment === 'neutral').length || 0,
        negative: currentData?.reviews.filter(r => r.sentiment === 'negative').length || 0
      },
      {
        name: 'Previous Period',
        positive: previousData?.reviews.filter(r => r.sentiment === 'positive').length || 0,
        neutral: previousData?.reviews.filter(r => r.sentiment === 'neutral').length || 0,
        negative: previousData?.reviews.filter(r => r.sentiment === 'negative').length || 0
      }
    ];
  }, [currentData, previousData, comparisonResult]);
  
  const themeEvolutionData = React.useMemo(() => {
    if (!comparisonResult) return [];
    
    const allThemes = new Set([
      ...Object.keys(currentData?.themeAnalysis || {}),
      ...Object.keys(previousData?.themeAnalysis || {})
    ]);
    
    return Array.from(allThemes).map(theme => ({
      theme,
      current: currentData?.themeAnalysis[theme] || 0,
      previous: previousData?.themeAnalysis[theme] || 0
    })).sort((a, b) => (b.current + b.previous) - (a.current + a.previous));
  }, [currentData, previousData, comparisonResult]);
  
  const languageData = React.useMemo(() => {
    if (!currentData || !previousData) return [];
    
    const getLanguageDistribution = (reviews: any[]) => {
      const languages = new Map<string, number>();
      reviews.forEach(review => {
        const lang = review.language || 'Unknown';
        languages.set(lang, (languages.get(lang) || 0) + 1);
      });
      return languages;
    };
    
    const currentLangs = getLanguageDistribution(currentData.reviews);
    const previousLangs = getLanguageDistribution(previousData.reviews);
    const allLangs = new Set([...currentLangs.keys(), ...previousLangs.keys()]);
    
    return Array.from(allLangs).map(lang => ({
      language: lang,
      current: currentLangs.get(lang) || 0,
      previous: previousLangs.get(lang) || 0
    }));
  }, [currentData, previousData]);
  
  // Export functionality
  const handleExportPDF = () => {
    if (!currentData || !previousData || !comparisonResult) return;
    
    exportPeriodComparisonReport({
      businessName,
      currentPeriod: {
        from: currentPeriod.dateRange.from!,
        to: currentPeriod.dateRange.to!,
        reviews: currentData.reviews
      },
      previousPeriod: {
        from: previousPeriod.dateRange.from!,
        to: previousPeriod.dateRange.to!,
        reviews: previousData.reviews
      },
      comparisonResult: {
        ...comparisonResult,
        currentSentimentScore: currentData.metrics.sentimentScore,
        previousSentimentScore: previousData.metrics.sentimentScore
      }
    });
  };
  
  const handleExportCSV = () => {
    if (!currentData || !previousData || !comparisonResult) return;
    
    exportPeriodComparisonCSV({
      businessName,
      currentPeriod: {
        from: currentPeriod.dateRange.from!,
        to: currentPeriod.dateRange.to!,
        reviews: currentData.reviews
      },
      previousPeriod: {
        from: previousPeriod.dateRange.from!,
        to: previousPeriod.dateRange.to!,
        reviews: previousData.reviews
      },
      comparisonResult: {
        ...comparisonResult,
        currentSentimentScore: currentData.metrics.sentimentScore,
        previousSentimentScore: previousData.metrics.sentimentScore
      }
    });
  };
  
  // Safe date formatting helper
  const formatDate = (date: Date | undefined) => {
    if (!date || !isValid(date)) return 'N/A';
    return format(date, 'MMM dd, yyyy');
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Period Comparison Analysis</CardTitle>
            <CardDescription>
              Compare business performance across different time periods
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Clock className="mr-2 h-4 w-4" />
                  Quick Compare
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleQuickCompare('lastMonth')}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Compare Last Month vs Previous Month
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleQuickCompare('lastQuarter')}>
                  <CalendarRange className="mr-2 h-4 w-4" />
                  Compare Last Quarter vs Previous Quarter
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleQuickCompare('lastYear')}>
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Compare with Same Period Last Year
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDateSelectors(!showDateSelectors)}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Custom Dates
            </Button>
            
            {comparisonResult && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportCSV}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Date Selection (Collapsible) */}
        {showDateSelectors && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20">
            <div>
              <h4 className="text-sm font-medium mb-2">Current Period</h4>
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
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Previous Period</h4>
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
            </div>
            <div className="md:col-span-2 flex justify-center mt-4">
              <Button 
                onClick={handleCustomCompare}
                disabled={isLoading || !currentPeriod.dateRange.to || !previousPeriod.dateRange.to}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Comparing...
                  </>
                ) : (
                  'Compare Periods'
                )}
              </Button>
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4 p-6 border rounded-lg">
            <div className="flex justify-center items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-lg font-medium">{loadingMessage}</p>
            </div>
            <Progress value={loadingProgress} className="w-full" />
            <p className="text-center text-sm text-muted-foreground">
              {loadingProgress}% complete
            </p>
          </div>
        )}
        
        {/* Results */}
        {!isLoading && comparisonResult && (
          <>
            {/* Period Timeline Visual */}
            <div className="flex items-center justify-center gap-4 p-4 border rounded-lg bg-muted/20">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Previous Period</p>
                <p className="font-medium">
                  {formatDate(previousPeriod.dateRange.from)} - {formatDate(previousPeriod.dateRange.to)}
                </p>
                <Badge variant="secondary" className="mt-1">
                  {previousData?.reviews.length || 0} reviews
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-px w-8 bg-border" />
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <div className="h-px w-8 bg-border" />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Current Period</p>
                <p className="font-medium">
                  {formatDate(currentPeriod.dateRange.from)} - {formatDate(currentPeriod.dateRange.to)}
                </p>
                <Badge variant="secondary" className="mt-1">
                  {currentData?.reviews.length || 0} reviews
                </Badge>
              </div>
            </div>
            
            {/* Key Metrics Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title="Rating"
                value={comparisonResult.ratingChange}
                formatter={(val) => `${val > 0 ? '+' : ''}${val.toFixed(2)}`}
                positive={comparisonResult.ratingChange > 0}
                icon={TrendingUp}
                subtitle={`Current: ${currentData?.metrics.avgRating.toFixed(2) || 'N/A'}`}
              />
              <MetricCard
                title="Review Volume"
                value={comparisonResult.reviewCountChangePercent}
                formatter={(val) => `${val > 0 ? '+' : ''}${val.toFixed(1)}%`}
                positive={comparisonResult.reviewCountChange > 0}
                icon={MessageCircle}
                subtitle={`${Math.abs(comparisonResult.reviewCountChange)} reviews`}
              />
              <MetricCard
                title="Sentiment"
                value={comparisonResult.sentimentChange}
                formatter={(val) => `${val > 0 ? '+' : ''}${val.toFixed(2)}`}
                positive={comparisonResult.sentimentChange > 0}
                icon={TrendingUp}
                subtitle="Score change"
              />
              <MetricCard
                title="Response Rate"
                value={currentData?.metrics.responseRate ? 
                  currentData.metrics.responseRate - (previousData?.metrics.responseRate || 0) : 0}
                formatter={(val) => `${val > 0 ? '+' : ''}${val.toFixed(1)}%`}
                positive={currentData?.metrics.responseRate > (previousData?.metrics.responseRate || 0)}
                icon={Globe}
                subtitle={`Current: ${currentData?.metrics.responseRate.toFixed(1) || '0'}%`}
              />
            </div>
            
            {/* Detailed Analysis Tabs */}
            <Tabs defaultValue="trends" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="trends">Trends</TabsTrigger>
                <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
                <TabsTrigger value="themes">Themes</TabsTrigger>
                <TabsTrigger value="languages">Languages</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>
              
              <TabsContent value="trends" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Rating Trend Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={ratingTrendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 5]} />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="current"
                            stroke={CHART_COLORS.primary}
                            strokeWidth={2}
                            name="Current Period"
                            connectNulls
                          />
                          <Line
                            type="monotone"
                            dataKey="previous"
                            stroke={CHART_COLORS.secondary}
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name="Previous Period"
                            connectNulls
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="sentiment" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Sentiment Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sentimentData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="positive" fill={CHART_COLORS.positive} name="Positive" />
                          <Bar dataKey="neutral" fill={CHART_COLORS.neutral} name="Neutral" />
                          <Bar dataKey="negative" fill={CHART_COLORS.negative} name="Negative" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="themes" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Theme Evolution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={themeEvolutionData.slice(0, 8)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="theme" angle={-45} textAnchor="end" height={80} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="previous"
                            stackId="1"
                            stroke={CHART_COLORS.secondary}
                            fill={CHART_COLORS.secondary}
                            fillOpacity={0.6}
                            name="Previous Period"
                          />
                          <Area
                            type="monotone"
                            dataKey="current"
                            stackId="2"
                            stroke={CHART_COLORS.primary}
                            fill={CHART_COLORS.primary}
                            fillOpacity={0.6}
                            name="Current Period"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Theme Changes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Improving Themes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {comparisonResult.improvingThemes.length > 0 ? (
                        <div className="space-y-2">
                          {comparisonResult.improvingThemes.map(theme => (
                            <div key={theme} className="flex items-center justify-between">
                              <span className="text-sm">{theme}</span>
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No improving themes</p>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Declining Themes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {comparisonResult.decliningThemes.length > 0 ? (
                        <div className="space-y-2">
                          {comparisonResult.decliningThemes.map(theme => (
                            <div key={theme} className="flex items-center justify-between">
                              <span className="text-sm">{theme}</span>
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No declining themes</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="languages" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Language Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={languageData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="language" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="previous" fill={CHART_COLORS.secondary} name="Previous Period" />
                          <Bar dataKey="current" fill={CHART_COLORS.primary} name="Current Period" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="insights" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Key Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Performance Summary */}
                    <div className="p-4 border rounded-lg bg-muted/20">
                      <h4 className="font-medium mb-2">Overall Performance</h4>
                      <p className="text-sm text-muted-foreground">
                        {comparisonResult.ratingChange > 0 ? 
                          `Ratings improved by ${comparisonResult.ratingChange.toFixed(2)} stars` :
                          comparisonResult.ratingChange < 0 ?
                          `Ratings declined by ${Math.abs(comparisonResult.ratingChange).toFixed(2)} stars` :
                          'Ratings remained stable'
                        }
                        {' with '}
                        {comparisonResult.reviewCountChange > 0 ?
                          `${comparisonResult.reviewCountChangePercent.toFixed(1)}% more reviews` :
                          comparisonResult.reviewCountChange < 0 ?
                          `${Math.abs(comparisonResult.reviewCountChangePercent).toFixed(1)}% fewer reviews` :
                          'the same number of reviews'
                        }.
                      </p>
                    </div>
                    
                    {/* Top Improvements */}
                    {comparisonResult.improvingThemes.length > 0 && (
                      <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                        <h4 className="font-medium mb-2 text-green-800 dark:text-green-200">
                          Areas of Improvement
                        </h4>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Customers are particularly happy with: {comparisonResult.improvingThemes.slice(0, 3).join(', ')}.
                        </p>
                      </div>
                    )}
                    
                    {/* Areas of Concern */}
                    {comparisonResult.decliningThemes.length > 0 && (
                      <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950">
                        <h4 className="font-medium mb-2 text-red-800 dark:text-red-200">
                          Areas Needing Attention
                        </h4>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          Consider addressing: {comparisonResult.decliningThemes.slice(0, 3).join(', ')}.
                        </p>
                      </div>
                    )}
                    
                    {/* New Themes */}
                    {comparisonResult.newThemes.length > 0 && (
                      <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                        <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">
                          Emerging Topics
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          New themes in customer feedback: {comparisonResult.newThemes.slice(0, 3).join(', ')}.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Helper component for metric cards
const MetricCard = ({ 
  title, 
  value, 
  formatter, 
  positive, 
  icon: Icon,
  subtitle 
}: { 
  title: string; 
  value: number; 
  formatter: (val: number) => string;
  positive: boolean;
  icon: any;
  subtitle?: string;
}) => {
  const isNeutral = Math.abs(value) < 0.05;
  
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex items-center gap-2">
        {!isNeutral && (
          positive ? 
            <TrendingUp className="h-5 w-5 text-green-500" /> : 
            <TrendingDown className="h-5 w-5 text-red-500" />
        )}
        <span className={`text-2xl font-semibold ${
          isNeutral ? 'text-foreground' :
          positive ? 'text-green-600 dark:text-green-400' : 
                   'text-red-600 dark:text-red-400'
        }`}>
          {formatter(value)}
        </span>
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
};
