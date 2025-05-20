import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRecommendationService } from '@/services/recommendationService';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { RefreshCw, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

export function AIStatusMonitor() {
  const [circuitStatus, setCircuitStatus] = useState<{
    state: string;
    failureCount: number;
    canRetryIn: number;
  }>({ state: 'UNKNOWN', failureCount: 0, canRetryIn: 0 });
  
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    // Check status on load
    checkStatus();
    
    // Set up interval to check status every 10 seconds
    const interval = setInterval(() => {
      checkStatus();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  const checkStatus = () => {
    try {
      const service = getRecommendationService();
      const status = service.getCircuitStatus();
      setCircuitStatus(status);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Failed to check AI status:', error);
    }
  };
  
  const handleReset = async () => {
    try {
      setRefreshing(true);
      const service = getRecommendationService();
      service.resetCircuitBreaker();
      
      // Wait to make sure UI updates
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Re-check status
      checkStatus();
    } catch (error) {
      console.error('Failed to reset circuit breaker:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Determine status color/icon
  let statusColor = 'bg-gray-500';
  let StatusIcon = AlertCircle;
  
  if (circuitStatus.state === 'CLOSED') {
    statusColor = 'bg-green-500';
    StatusIcon = CheckCircle;
  } else if (circuitStatus.state === 'HALF_OPEN') {
    statusColor = 'bg-yellow-500';
    StatusIcon = AlertTriangle;
  } else if (circuitStatus.state === 'OPEN') {
    statusColor = 'bg-red-500';
    StatusIcon = AlertCircle;
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${statusColor}`}></div>
            AI System Status
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-1"
            onClick={checkStatus}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
        <CardDescription>
          Last checked: {lastChecked.toLocaleTimeString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Status</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <StatusIcon className={`h-4 w-4 ${
                  circuitStatus.state === 'CLOSED' ? 'text-green-500' : 
                  circuitStatus.state === 'HALF_OPEN' ? 'text-yellow-500' : 
                  circuitStatus.state === 'OPEN' ? 'text-red-500' : 'text-gray-500'
                }`} />
                <span className="font-medium">{circuitStatus.state}</span>
              </div>
            </div>
            <Badge variant={
              circuitStatus.state === 'CLOSED' ? 'outline' : 
              circuitStatus.state === 'HALF_OPEN' ? 'secondary' : 
              'destructive'
            }>
              {circuitStatus.state === 'CLOSED' ? 'Operational' : 
               circuitStatus.state === 'HALF_OPEN' ? 'Testing Recovery' : 
               'In Recovery'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Failures</div>
              <div className="text-lg font-medium mt-0.5">{circuitStatus.failureCount}</div>
            </div>
            {circuitStatus.state === 'OPEN' && circuitStatus.canRetryIn > 0 && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Retry In</div>
                <div className="text-lg font-medium mt-0.5">{circuitStatus.canRetryIn}s</div>
              </div>
            )}
          </div>
          
          {circuitStatus.state === 'OPEN' && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>AI System Recovery Mode</AlertTitle>
              <AlertDescription>
                The AI system is currently in recovery mode due to multiple failures. 
                It will automatically try to recover in {circuitStatus.canRetryIn} seconds.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center gap-1"
          onClick={handleReset}
          disabled={refreshing || circuitStatus.state === 'CLOSED'}
        >
          {refreshing ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ArrowPathIcon className="h-3.5 w-3.5" />
          )}
          Reset System
        </Button>
      </CardFooter>
    </Card>
  );
}
