/**
 * Performance Dashboard Component - Phase 5
 * 
 * Development tool for monitoring application performance metrics,
 * error tracking, and memory usage in real-time.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Activity, 
  AlertTriangle, 
  Trash2, 
  RefreshCw,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  MemoryStick
} from 'lucide-react';
import { PerformanceMonitor, optimizeMemoryUsage } from '@/utils/performanceOptimizations';
import { 
  errorLogger, 
  ErrorType, 
  ErrorSeverity, 
  MemoryLeakDetector 
} from '@/utils/errorHandling';

interface PerformanceStats {
  count: number;
  average: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
}

interface MemoryInfo {
  used: number;
  total: number;
  limit: number;
}

export const PerformanceDashboard: React.FC = () => {
  const [performanceStats, setPerformanceStats] = useState<Record<string, PerformanceStats>>({});
  const [errorStats, setErrorStats] = useState<Record<ErrorType, number>>({});
  const [errorHistory, setErrorHistory] = useState<any[]>([]);
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [leakReport, setLeakReport] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Update stats periodically
  useEffect(() => {
    const updateStats = () => {
      // Performance stats
      setPerformanceStats(PerformanceMonitor.getAllStats());
      
      // Error stats
      setErrorStats(errorLogger.getErrorStats());
      setErrorHistory(errorLogger.getErrorHistory().slice(-20)); // Last 20 errors
      
      // Memory info (if available)
      if ('memory' in performance && (performance as any).memory) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
        });
      }
      
      // Memory leak report
      setLeakReport(MemoryLeakDetector.getLeakReport());
    };

    updateStats();

    if (autoRefresh) {
      const interval = setInterval(updateStats, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const handleClearStats = () => {
    PerformanceMonitor.clearStats();
    errorLogger.clearHistory();
    setPerformanceStats({});
    setErrorStats({});
    setErrorHistory([]);
  };

  const handleOptimizeMemory = () => {
    optimizeMemoryUsage();
    MemoryLeakDetector.cleanup();
  };

  const getPerformanceColor = (average: number) => {
    if (average < 50) return 'text-green-600';
    if (average < 100) return 'text-yellow-600';
    if (average < 200) return 'text-orange-600';
    return 'text-red-600';
  };

  const getErrorSeverityColor = (type: ErrorType) => {
    switch (type) {
      case ErrorType.CRITICAL:
        return 'destructive';
      case ErrorType.SERVER:
        return 'destructive';
      case ErrorType.PERMISSION:
        return 'destructive';
      case ErrorType.NETWORK:
        return 'secondary';
      case ErrorType.VALIDATION:
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getMemoryUsagePercentage = () => {
    if (!memoryInfo) return 0;
    return (memoryInfo.used / memoryInfo.limit) * 100;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Performance Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time application performance monitoring and diagnostics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto' : 'Manual'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOptimizeMemory}
          >
            <MemoryStick className="h-4 w-4 mr-2" />
            Optimize
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearStats}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(performanceStats).reduce((sum, stat) => sum + stat.count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total measurements taken
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(performanceStats).length > 0
                ? formatDuration(
                    Object.values(performanceStats).reduce((sum, stat) => sum + stat.average, 0) /
                    Object.values(performanceStats).length
                  )
                : '0ms'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Average across all operations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {Object.values(errorStats).reduce((sum, count) => sum + count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total errors logged
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MemoryStick className="h-4 w-4" />
              Memory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {memoryInfo ? `${memoryInfo.used}MB` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {memoryInfo ? `${getMemoryUsagePercentage().toFixed(1)}% of limit` : 'Memory info unavailable'}
            </p>
            {memoryInfo && (
              <Progress 
                value={getMemoryUsagePercentage()} 
                className="mt-2 h-1"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Operation Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(performanceStats).map(([operation, stats]) => (
                  <div key={operation} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="font-medium">{operation}</div>
                      <div className="text-sm text-muted-foreground">
                        {stats.count} calls • {formatDuration(stats.average)} avg
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div className="text-sm">
                        <div className={`font-medium ${getPerformanceColor(stats.average)}`}>
                          {formatDuration(stats.average)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDuration(stats.min)} - {formatDuration(stats.max)}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">P95: {formatDuration(stats.p95)}</div>
                        <div className="text-xs text-muted-foreground">
                          P50: {formatDuration(stats.p50)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Error Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(errorStats).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <Badge variant={getErrorSeverityColor(type as ErrorType)}>
                        {type}
                      </Badge>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {errorHistory.map((error, index) => (
                    <div key={index} className="text-xs p-2 border rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getErrorSeverityColor(error.type)} className="text-xs">
                          {error.severity}
                        </Badge>
                        <span className="text-muted-foreground">
                          {new Date(error.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="font-mono text-xs">{error.message}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="memory" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                {memoryInfo ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Used Memory</span>
                      <span className="font-medium">{memoryInfo.used} MB</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total Allocated</span>
                      <span className="font-medium">{memoryInfo.total} MB</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Memory Limit</span>
                      <span className="font-medium">{memoryInfo.limit} MB</span>
                    </div>
                    <Progress value={getMemoryUsagePercentage()} className="mt-4" />
                    <div className="text-sm text-center text-muted-foreground">
                      {getMemoryUsagePercentage().toFixed(1)}% of available memory
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    Memory information not available in this browser
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Memory Leaks</CardTitle>
              </CardHeader>
              <CardContent>
                {leakReport ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Active Intervals</span>
                      <span className={`font-medium ${leakReport.intervals > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {leakReport.intervals}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Event Listeners</span>
                      <span className={`font-medium ${leakReport.eventListeners > 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {leakReport.eventListeners}
                      </span>
                    </div>
                    
                    {Object.keys(leakReport.details).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Listener Details:</h4>
                        {Object.entries(leakReport.details).map(([key, count]) => (
                          <div key={key} className="flex justify-between text-xs">
                            <span className="font-mono">{key}</span>
                            <span>{count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    Memory leak detection not available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceDashboard;
