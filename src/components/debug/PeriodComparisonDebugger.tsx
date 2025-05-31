import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';

interface PeriodComparisonDebuggerProps {
  selectedBusiness: string;
  loading: boolean;
  refreshData: (from?: Date, to?: Date) => Promise<void>;
  getFilteredReviews: () => any[];
}

/**
 * Debug component for testing the Period Comparison feature
 * This component helps identify issues with date filtering and data fetching
 */
export function PeriodComparisonDebugger({ 
  selectedBusiness, 
  loading, 
  refreshData, 
  getFilteredReviews 
}: PeriodComparisonDebuggerProps) {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isDebugging, setIsDebugging] = useState(false);

  const runDebugTest = async () => {
    setIsDebugging(true);
    const logs: string[] = [];
    
    // Log initial state
    logs.push(`🔍 Debug Test Started at ${new Date().toISOString()}`);
    logs.push(`📍 Selected Business: ${selectedBusiness}`);
    
    try {
      // Test 1: Current period (last 30 days)
      const currentEnd = new Date();
      const currentStart = new Date();
      currentStart.setDate(currentStart.getDate() - 30);
      
      logs.push(`\n📅 Test 1: Current Period`);
      logs.push(`   From: ${format(currentStart, 'yyyy-MM-dd')}`);
      logs.push(`   To: ${format(currentEnd, 'yyyy-MM-dd')}`);
      
      await refreshData(currentStart, currentEnd);
      const currentReviews = getFilteredReviews();
      logs.push(`   ✅ Reviews fetched: ${currentReviews.length}`);
      
      // Test 2: Previous period (31-60 days ago)
      const previousEnd = new Date();
      previousEnd.setDate(previousEnd.getDate() - 31);
      const previousStart = new Date();
      previousStart.setDate(previousStart.getDate() - 60);
      
      logs.push(`\n📅 Test 2: Previous Period`);
      logs.push(`   From: ${format(previousStart, 'yyyy-MM-dd')}`);
      logs.push(`   To: ${format(previousEnd, 'yyyy-MM-dd')}`);
      
      await refreshData(previousStart, previousEnd);
      const previousReviews = getFilteredReviews();
      logs.push(`   ✅ Reviews fetched: ${previousReviews.length}`);
      
      // Test 3: Full data (no date filter)
      logs.push(`\n📅 Test 3: All Data (no date filter)`);
      await refreshData();
      const allReviews = getFilteredReviews();
      logs.push(`   ✅ Total reviews: ${allReviews.length}`);
      
      // Summary
      logs.push(`\n📊 Summary:`);
      logs.push(`   Current Period Reviews: ${currentReviews.length}`);
      logs.push(`   Previous Period Reviews: ${previousReviews.length}`);
      logs.push(`   Total Reviews: ${allReviews.length}`);
      
      if (currentReviews.length === 0 && previousReviews.length === 0) {
        logs.push(`\n⚠️ WARNING: No reviews found in either period!`);
        logs.push(`   This could mean:`);
        logs.push(`   - No reviews exist in these date ranges`);
        logs.push(`   - Date filtering is not working`);
        logs.push(`   - The 'publishedatdate' column has invalid data`);
      }
      
      // Check date format of reviews
      if (allReviews.length > 0) {
        const sampleReview = allReviews[0];
        logs.push(`\n🔍 Sample Review Date Check:`);
        logs.push(`   publishedAtDate: ${sampleReview.publishedAtDate}`);
        logs.push(`   publishedatdate: ${sampleReview.publishedatdate}`);
        logs.push(`   Date type: ${typeof sampleReview.publishedAtDate}`);
        
        // Check a few more dates to see the range
        if (allReviews.length > 1) {
          logs.push(`\n📅 Date Range in Reviews:`);
          const dates = allReviews
            .map(r => r.publishedAtDate || r.publishedatdate)
            .filter(d => d)
            .sort();
          logs.push(`   Oldest: ${dates[0]}`);
          logs.push(`   Newest: ${dates[dates.length - 1]}`);
        }
      }
      
    } catch (error) {
      logs.push(`\n❌ ERROR: ${error.message}`);
      logs.push(`   Stack: ${error.stack}`);
    }
    
    logs.push(`\n✅ Debug Test Completed`);
    setDebugInfo(logs);
    setIsDebugging(false);
  };

  const isAllBusinesses = selectedBusiness === 'all' || selectedBusiness === 'All Businesses';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Period Comparison Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            This debugger will test the date filtering functionality by fetching data for different periods.
            Make sure to select a specific business (not "All Businesses") before running the test.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Current selection: <span className="font-medium">{selectedBusiness}</span>
          </p>
          
          <Button 
            onClick={runDebugTest} 
            disabled={isDebugging || loading || isAllBusinesses}
          >
            {isDebugging ? 'Running Debug Test...' : 'Run Debug Test'}
          </Button>
        </div>
        
        {isAllBusinesses && (
          <Alert variant="destructive">
            <AlertDescription>
              Please select a specific business before running the debug test.
              Current selection: "{selectedBusiness}"
            </AlertDescription>
          </Alert>
        )}
        
        {debugInfo.length > 0 && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <pre className="text-xs whitespace-pre-wrap font-mono">
              {debugInfo.join('\n')}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}