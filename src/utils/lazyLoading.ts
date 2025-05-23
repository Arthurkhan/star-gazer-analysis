/**
 * Enhanced Lazy Loading Components - Phase 5
 * 
 * This module provides enhanced lazy loading utilities for analysis components
 * with performance monitoring and error boundaries.
 */

import React, { Suspense, ComponentType, LazyExoticComponent } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PerformanceMonitor } from '@/utils/performanceOptimizations';

/**
 * Enhanced loading fallback component
 */
interface LoadingFallbackProps {
  componentName?: string;
  message?: string;
  showProgress?: boolean;
}

const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  componentName = 'Component', 
  message = 'Loading...', 
  showProgress = false 
}) => (
  <Card className="w-full">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        {message}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Loading {componentName}...
        </div>
        {showProgress && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '45%' }}></div>
            </div>
            <div className="text-xs text-muted-foreground">Initializing component</div>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

/**
 * Error fallback component for lazy loaded components
 */
interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  componentName?: string;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetErrorBoundary, 
  componentName = 'Component' 
}) => (
  <Alert variant="destructive" className="w-full">
    <AlertTriangle className="h-4 w-4" />
    <AlertDescription className="flex flex-col gap-4">
      <div>
        <strong>Failed to load {componentName}</strong>
        <p className="text-sm mt-1">{error.message}</p>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={resetErrorBoundary}
        className="w-fit"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Try Again
      </Button>
    </AlertDescription>
  </Alert>
);

/**
 * Enhanced lazy loading wrapper with performance monitoring
 */
export function createEnhancedLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: {
    componentName: string;
    fallbackMessage?: string;
    showProgress?: boolean;
    preload?: boolean;
    retryAttempts?: number;
  }
): LazyExoticComponent<ComponentType<P>> {
  const { 
    componentName, 
    fallbackMessage = `Loading ${options.componentName}...`,
    showProgress = false,
    preload = false,
    retryAttempts = 3
  } = options;

  // Preload the component if requested
  if (preload && typeof window !== 'undefined') {
    // Preload after a short delay to not block initial render
    setTimeout(() => {
      importFn().catch(console.error);
    }, 1000);
  }

  const LazyComponent = React.lazy(async () => {
    const stopMeasurement = PerformanceMonitor.startMeasurement(`lazy-load-${componentName}`);
    
    let attempts = 0;
    let lastError: Error;

    while (attempts < retryAttempts) {
      try {
        const module = await importFn();
        const loadTime = stopMeasurement();
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ ${componentName} loaded in ${loadTime.toFixed(2)}ms (attempt ${attempts + 1})`);
        }
        
        return module;
      } catch (error) {
        attempts++;
        lastError = error as Error;
        
        if (attempts < retryAttempts) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
          console.warn(`⚠️ ${componentName} load failed, retrying... (attempt ${attempts + 1}/${retryAttempts})`);
        }
      }
    }
    
    stopMeasurement();
    console.error(`❌ ${componentName} failed to load after ${retryAttempts} attempts:`, lastError);
    throw lastError!;
  });

  // Add display name for debugging
  LazyComponent.displayName = `Lazy(${componentName})`;

  return LazyComponent;
}

/**
 * Higher-order component for enhanced lazy loading with error boundary
 */
export function withEnhancedLazyLoading<P extends object>(
  LazyComponent: LazyExoticComponent<ComponentType<P>>,
  options: {
    componentName: string;
    fallbackMessage?: string;
    showProgress?: boolean;
    onError?: (error: Error) => void;
  }
) {
  const { componentName, fallbackMessage, showProgress = false, onError } = options;

  return React.memo((props: P) => (
    <ErrorBoundary
      FallbackComponent={(errorProps) => (
        <ErrorFallback {...errorProps} componentName={componentName} />
      )}
      onError={(error, errorInfo) => {
        console.error(`❌ Error in ${componentName}:`, error, errorInfo);
        onError?.(error);
      }}
      onReset={() => {
        console.log(`🔄 Resetting ${componentName}`);
      }}
    >
      <Suspense
        fallback={
          <LoadingFallback
            componentName={componentName}
            message={fallbackMessage}
            showProgress={showProgress}
          />
        }
      >
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  ));
}

/**
 * Pre-configured lazy components for analysis features
 */

// Enhanced Analysis Display
export const LazyEnhancedAnalysisDisplay = createEnhancedLazyComponent(
  () => import('@/components/analysis/EnhancedAnalysisDisplay'),
  {
    componentName: 'Enhanced Analysis Display',
    fallbackMessage: 'Loading advanced analytics...',
    showProgress: true,
    preload: false // Load on demand
  }
);

// Interactive Charts
export const LazyInteractiveCharts = createEnhancedLazyComponent(
  () => import('@/components/analysis/InteractiveCharts'),
  {
    componentName: 'Interactive Charts',
    fallbackMessage: 'Loading interactive visualizations...',
    showProgress: true,
    preload: true // Preload as charts are commonly used
  }
);

// Comparative Analysis
export const LazyComparativeAnalysis = createEnhancedLazyComponent(
  () => import('@/components/analysis/ComparativeAnalysis'),
  {
    componentName: 'Comparative Analysis',
    fallbackMessage: 'Loading comparison tools...',
    showProgress: true,
    preload: false
  }
);

// Advanced Filters
export const LazyAdvancedFilters = createEnhancedLazyComponent(
  () => import('@/components/analysis/AdvancedFilters'),
  {
    componentName: 'Advanced Filters',
    fallbackMessage: 'Loading filtering system...',
    showProgress: true,
    preload: false
  }
);

// Alert System
export const LazyAlertSystem = createEnhancedLazyComponent(
  () => import('@/components/analysis/AlertSystem'),
  {
    componentName: 'Alert System',
    fallbackMessage: 'Loading alert management...',
    showProgress: true,
    preload: false
  }
);

// Export Manager
export const LazyExportManager = createEnhancedLazyComponent(
  () => import('@/components/analysis/ExportManager'),
  {
    componentName: 'Export Manager',
    fallbackMessage: 'Loading export tools...',
    showProgress: true,
    preload: false
  }
);

// Dashboard Customizer
export const LazyDashboardCustomizer = createEnhancedLazyComponent(
  () => import('@/components/analysis/DashboardCustomizer'),
  {
    componentName: 'Dashboard Customizer',
    fallbackMessage: 'Loading customization panel...',
    showProgress: true,
    preload: false
  }
);

/**
 * Lazy loading manager for performance optimization
 */
export class LazyLoadingManager {
  private static preloadedComponents = new Set<string>();
  private static loadingComponents = new Set<string>();

  static preloadComponent(componentName: string, importFn: () => Promise<any>): void {
    if (this.preloadedComponents.has(componentName) || this.loadingComponents.has(componentName)) {
      return;
    }

    this.loadingComponents.add(componentName);
    
    const stopMeasurement = PerformanceMonitor.startMeasurement(`preload-${componentName}`);
    
    importFn()
      .then(() => {
        const loadTime = stopMeasurement();
        this.preloadedComponents.add(componentName);
        this.loadingComponents.delete(componentName);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Preloaded ${componentName} in ${loadTime.toFixed(2)}ms`);
        }
      })
      .catch((error) => {
        stopMeasurement();
        this.loadingComponents.delete(componentName);
        console.error(`❌ Failed to preload ${componentName}:`, error);
      });
  }

  static isPreloaded(componentName: string): boolean {
    return this.preloadedComponents.has(componentName);
  }

  static isLoading(componentName: string): boolean {
    return this.loadingComponents.has(componentName);
  }

  static getStats() {
    return {
      preloaded: Array.from(this.preloadedComponents),
      loading: Array.from(this.loadingComponents),
      preloadedCount: this.preloadedComponents.size,
      loadingCount: this.loadingComponents.size
    };
  }

  /**
   * Preload commonly used components based on user behavior
   */
  static preloadCommonComponents(): void {
    if (typeof window === 'undefined') return;

    // Preload interactive charts as they're commonly accessed
    this.preloadComponent('InteractiveCharts', () => import('@/components/analysis/InteractiveCharts'));
    
    // Preload export manager for business users
    setTimeout(() => {
      this.preloadComponent('ExportManager', () => import('@/components/analysis/ExportManager'));
    }, 2000);
  }
}

// Auto-preload common components in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Wait a bit before preloading to not interfere with initial page load
  setTimeout(() => {
    LazyLoadingManager.preloadCommonComponents();
  }, 3000);
}

export default {
  createEnhancedLazyComponent,
  withEnhancedLazyLoading,
  LazyLoadingManager,
  // Export all lazy components
  LazyEnhancedAnalysisDisplay,
  LazyInteractiveCharts,
  LazyComparativeAnalysis,
  LazyAdvancedFilters,
  LazyAlertSystem,
  LazyExportManager,
  LazyDashboardCustomizer
};
