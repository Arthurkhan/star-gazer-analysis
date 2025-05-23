import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useMemoryMonitor } from '@/utils/performanceUtils';
import { 
  getReviewCacheStats,
  reviewsCache,
  analyticsCache,
  recommendationsCache 
} from '@/utils/dataLoadingUtils';
import { Activity, Database, Clock, Zap, AlertTriangle } from 'lucide-react';

interface PerformanceMetrics {
  memoryUsage: ReturnType<typeof useMemoryMonitor>;
  cacheStats: ReturnType<typeof getReviewCacheStats>;
  renderMetrics: {
    componentsRendered: number;
    averageRenderTime: number;
    slowRenders: number;
  };
  networkMetrics: {
    activeRequests: number;
    totalRequests: number;
    averageResponseTime: number;
    errors: number;
  };
}

interface PerformanceMonitorProps {
  showDetailed?: boolean;
  onPerformanceIssue?: (issue: string, severity: 'low' | 'medium' | 'high') => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  showDetailed = false,
  onPerformanceIssue,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [performanceScore, setPerformanceScore] = useState(100);
  
  const memoryUsage = useMemoryMonitor(5000); // Update every 5 seconds
  
  // Update metrics
  useEffect(() => {
    const updateMetrics = () => {
      const cacheStats = getReviewCacheStats();
      
      // Mock render metrics (in real app, you'd track these globally)
      const renderMetrics = {
        componentsRendered: Math.floor(Math.random() * 50) + 10,
        averageRenderTime: Math.random() * 20 + 5,
        slowRenders: Math.floor(Math.random() * 5),
      };
      
      // Mock network metrics (in real app, you'd track these via interceptors)
      const networkMetrics = {
        activeRequests: Math.floor(Math.random() * 3),
        totalRequests: Math.floor(Math.random() * 100) + 20,
        averageResponseTime: Math.random() * 500 + 100,
        errors: Math.floor(Math.random() * 3),
      };
      
      setMetrics({
        memoryUsage,
        cacheStats,
        renderMetrics,
        networkMetrics,
      });
    };
    
    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);
    
    return () => clearInterval(interval);
  }, [memoryUsage]);
  
  // Calculate performance score
  useEffect(() => {
    if (!metrics || !memoryUsage) return;
    
    let score = 100;
    
    // Memory usage penalty
    if (memoryUsage.used > 150) score -= 30;
    else if (memoryUsage.used > 100) score -= 15;
    else if (memoryUsage.used > 50) score -= 5;
    
    // Slow renders penalty
    if (metrics.renderMetrics.slowRenders > 10) score -= 20;
    else if (metrics.renderMetrics.slowRenders > 5) score -= 10;
    
    // Network errors penalty
    if (metrics.networkMetrics.errors > 5) score -= 25;
    else if (metrics.networkMetrics.errors > 2) score -= 10;
    
    // Response time penalty
    if (metrics.networkMetrics.averageResponseTime > 1000) score -= 20;
    else if (metrics.networkMetrics.averageResponseTime > 500) score -= 10;
    
    setPerformanceScore(Math.max(0, score));
    
    // Trigger performance issue callbacks
    if (onPerformanceIssue) {
      if (score < 50) {
        onPerformanceIssue('Critical performance issues detected', 'high');
      } else if (score < 70) {
        onPerformanceIssue('Performance degradation detected', 'medium');
      } else if (score < 85) {
        onPerformanceIssue('Minor performance issues detected', 'low');
      }
    }
  }, [metrics, memoryUsage, onPerformanceIssue]);
  
  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getScoreBadgeVariant = (score: number) => {
    if (score >= 85) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };
  
  const clearCaches = () => {
    reviewsCache.clear();
    analyticsCache.clear();
    recommendationsCache.clear();
    console.log('All caches cleared');
  };
  
  if (!isVisible && !showDetailed) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        <Activity className="h-4 w-4" />
        Performance
      </Button>
    );
  }
  
  if (!metrics) {
    return (
      <Card className="w-80">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 animate-spin" />
            <span>Loading performance metrics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={`${showDetailed ? 'w-full' : 'w-80 fixed bottom-4 right-4 z-50'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Performance Monitor</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant={getScoreBadgeVariant(performanceScore)}>
              {performanceScore}/100
            </Badge>
            {!showDetailed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
              >
                ×
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Performance Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Overall Score</span>
            <span className={getScoreColor(performanceScore)}>
              {performanceScore}/100
            </span>
          </div>
          <Progress value={performanceScore} className="h-2" />
        </div>
        
        {/* Memory Usage */}
        {memoryUsage && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span className="text-sm font-medium">Memory Usage</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Used:</span>
                <span>{memoryUsage.used} MB</span>
              </div>
              <div className="flex justify-between">
                <span>Total:</span>
                <span>{memoryUsage.total} MB</span>
              </div>
              <Progress 
                value={(memoryUsage.used / memoryUsage.total) * 100} 
                className="h-1"
              />
            </div>
          </div>
        )}
        
        {/* Cache Statistics */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">Cache</span>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Entries:</span>
              <span>{metrics.cacheStats.size}</span>
            </div>
            <div className="flex justify-between">
              <span>Hit Rate:</span>
              <span>{Math.round((metrics.cacheStats.totalHits / Math.max(1, metrics.cacheStats.size)) * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Age:</span>
              <span>{Math.round(metrics.cacheStats.averageAge)}s</span>
            </div>
          </div>
        </div>
        
        {/* Network Metrics */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Network</span>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Active Requests:</span>
              <span>{metrics.networkMetrics.activeRequests}</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Response:</span>
              <span>{Math.round(metrics.networkMetrics.averageResponseTime)}ms</span>
            </div>
            <div className="flex justify-between">
              <span>Errors:</span>
              <span className={metrics.networkMetrics.errors > 0 ? 'text-red-500' : ''}>
                {metrics.networkMetrics.errors}
              </span>
            </div>
          </div>
        </div>
        
        {/* Render Metrics */}
        {showDetailed && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm font-medium">Rendering</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Components:</span>
                <span>{metrics.renderMetrics.componentsRendered}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Time:</span>
                <span>{Math.round(metrics.renderMetrics.averageRenderTime)}ms</span>
              </div>
              <div className="flex justify-between">
                <span>Slow Renders:</span>
                <span className={metrics.renderMetrics.slowRenders > 5 ? 'text-yellow-500' : ''}>
                  {metrics.renderMetrics.slowRenders}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Performance Warnings */}
        {(performanceScore < 70 || (memoryUsage && memoryUsage.used > 100)) && (
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center space-x-1">
              <AlertTriangle className="h-3 w-3 text-yellow-600" />
              <span className="text-xs text-yellow-800">Performance Warning</span>
            </div>
            <div className="text-xs text-yellow-700 mt-1">
              {performanceScore < 50 && "Critical performance issues detected. "}
              {performanceScore >= 50 && performanceScore < 70 && "Performance degradation detected. "}
              {memoryUsage && memoryUsage.used > 100 && "High memory usage detected. "}
              Consider optimizing or clearing caches.
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearCaches}
            className="text-xs"
          >
            Clear Caches
          </Button>
          {showDetailed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => console.log('Performance report generated')}
              className="text-xs"
            >
              Generate Report
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Global performance monitoring hook
 */
export const useGlobalPerformanceMonitor = () => {
  const [performanceIssues, setPerformanceIssues] = useState<Array<{
    message: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: number;
  }>>([]);
  
  const addPerformanceIssue = React.useCallback((message: string, severity: 'low' | 'medium' | 'high') => {
    setPerformanceIssues(prev => [
      ...prev.slice(-9), // Keep only last 10 issues
      { message, severity, timestamp: Date.now() }
    ]);
  }, []);
  
  const clearPerformanceIssues = React.useCallback(() => {
    setPerformanceIssues([]);
  }, []);
  
  return {
    performanceIssues,
    addPerformanceIssue,
    clearPerformanceIssues,
  };
};
