import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { testLegacyDateFiltering } from '@/services/legacyReviewService';
import { usePeriodComparison } from '@/hooks/usePeriodComparison';

interface PeriodComparisonDebuggerProps {
  selectedBusiness: string;
  loading: boolean;
}

/**
 * Debug component for testing the Period Comparison feature
 * This component helps identify issues with date filtering and data fetching
 */
export function PeriodComparisonDebugger({ 
  selectedBusiness, 
  loading
}: PeriodComparisonDebuggerProps) {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isDebugging, setIsDebugging] = useState(false);
  
  const { comparePeriods } = usePeriodComparison();

  const runDebugTest = async () => {
    setIsDebugging(true);
    const logs: string[] = [];
    
    // Log initial state
    logs.push(`🔍 Debug Test Started at ${new Date().toISOString()}`);
    logs.push(`📍 Selected Business: ${selectedBusiness}`);
    
    try {
      // Test 1: Current period (May 2025)
      const mayStart = new Date('2025-05-01');
      const mayEnd = new Date('2025-05-31');
      mayEnd.setHours(23, 59, 59, 999);
      
      logs.push(`\n📅 Test 1: May 2025`);
      logs.push(`   From: ${format(mayStart, 'yyyy-MM-dd')}`);
      logs.push(`   To: ${format(mayEnd, 'yyyy-MM-dd')}`);
      
      // Test 2: Previous period (April 2025)
      const aprilStart = new Date('2025-04-01');
      const aprilEnd = new Date('2025-04-30');
      aprilEnd.setHours(23, 59, 59, 999);
      
      logs.push(`\n📅 Test 2: April 2025`);
      logs.push(`   From: ${format(aprilStart, 'yyyy-MM-dd')}`);
      logs.push(`   To: ${format(aprilEnd, 'yyyy-MM-dd')}`);
      
      // Run comparison using the new hook
      logs.push(`\n🚀 Running period comparison...`);
      
      await comparePeriods(
        selectedBusiness,
        { from: mayStart, to: mayEnd },
        { from: aprilStart, to: aprilEnd }
      );
      
      logs.push(`\n✅ Period comparison completed successfully!`);
      logs.push(`   Check the console for detailed results`);
      
    } catch (error) {
      logs.push(`\n❌ ERROR: ${error.message}`);
      logs.push(`   Stack: ${error.stack}`);
    }
    
    logs.push(`\n✅ Debug Test Completed`);
    setDebugInfo(logs);
    setIsDebugging(false);
  };
  
  const runDatabaseTest = async () => {
    setIsDebugging(true);
    const logs: string[] = [];
    
    logs.push(`🧪 Database Test Started at ${new Date().toISOString()}`);
    logs.push(`📍 Testing direct database queries for: ${selectedBusiness}`);
    
    try {
      // Run the test function from legacyReviewService
      logs.push(`\n⚡ Running direct database test...`);
      logs.push(`   Check browser console for detailed results`);
      
      await testLegacyDateFiltering(selectedBusiness);
      
      logs.push(`\n✅ Database test completed - check console for results`);
    } catch (error) {
      logs.push(`\n❌ Database test failed: ${error.message}`);
    }
    
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
          
          <div className="flex gap-2">
            <Button 
              onClick={runDebugTest} 
              disabled={isDebugging || loading || isAllBusinesses}
            >
              {isDebugging ? 'Running Debug Test...' : 'Run Debug Test'}
            </Button>
            
            <Button 
              onClick={runDatabaseTest}
              disabled={isDebugging || loading || isAllBusinesses}
              variant="outline"
            >
              Test Database Directly
            </Button>
          </div>
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
