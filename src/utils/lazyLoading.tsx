/**
 * Enhanced Lazy Loading System - Phase 5
 * 
 * Advanced lazy loading utilities with performance monitoring,
 * error handling, and intelligent preloading strategies.
 */

import React, { Suspense, lazy, ComponentType } from 'react';
import { PerformanceMonitor } from './performanceOptimizations';
import { AppError, ErrorType, ErrorSeverity, errorLogger } from './errorHandling';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';

// Loading state components
interface LoadingFallbackProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  showProgress?: boolean;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  size = 'medium', 
  message = 'Loading...', 
  showProgress = false 
}) => {
  const sizeClasses = {
    small: 'h-20',
    medium: 'h-40',
    large: 'h-60'
  };

  return (
    <Card className={`w-full ${sizeClasses[size]} flex items-center justify-center`}>
      <CardContent className="flex flex-col items-center gap-2 p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
        {showProgress && (
          <div className="w-32 h-1 bg-muted rounded overflow-hidden">
            <div className="h-full bg-primary rounded animate-pulse" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Error fallback for lazy loading failures
const LazyLoadErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <Card className="w-full h-40 flex items-center justify-center border-destructive">
    <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-destructive font-medium">Failed to load component</p>
      <button 
        onClick={retry}
        className="text-xs text-primary hover:underline"
      >
        Click to retry
      </button>
    </CardContent>
  </Card>
);

// Enhanced lazy loading options
interface LazyLoadOptions {
  fallback?: ComponentType<LoadingFallbackProps>;
  errorFallback?: ComponentType<{ error: Error; retry: () => void }>;
  preload?: boolean;
  retryCount?: number;
  timeout?: number;
  size?: 'small' | 'medium' | 'large';
  loadingMessage?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

// Enhanced lazy component creator
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): ComponentType<React.ComponentProps<T>> {
  const {
    fallback: CustomFallback = LoadingFallback,
    errorFallback: CustomErrorFallback = LazyLoadErrorFallback,
    preload = false,
    retryCount = 3,
    timeout = 10000,
    size = 'medium',
    loadingMessage = 'Loading component...',
    onLoad,
    onError
  } = options;

  let retries = 0;
  let loadPromise: Promise<{ default: T }> | null = null;

  const loadWithRetry = async (): Promise<{ default: T }> => {
    const stopMeasurement = PerformanceMonitor.startMeasurement('lazy-component-load');
    
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Component load timeout')), timeout);
      });

      // Race between import and timeout
      const result = await Promise.race([importFn(), timeoutPromise]);
      
      stopMeasurement();
      onLoad?.();
      
      return result;
    } catch (error) {
      stopMeasurement();
      
      const loadError = new AppError(
        `Failed to load lazy component: ${error.message}`,
        ErrorType.CLIENT,
        ErrorSeverity.MEDIUM,
        { 
          retries,
          maxRetries: retryCount,
          timeout,
          component: importFn.toString()
        }
      );

      errorLogger.logError(loadError);
      onError?.(error as Error);

      if (retries < retryCount) {
        retries++;
        console.warn(`Retrying component load (${retries}/${retryCount})...`);
        return loadWithRetry();
      }

      throw error;
    }
  };

  const LazyComponent = lazy(() => {
    if (!loadPromise) {
      loadPromise = loadWithRetry();
    }
    return loadPromise;
  });

  // Preload if requested
  if (preload && typeof window !== 'undefined') {
    // Delay preload to avoid blocking initial render
    setTimeout(() => {
      loadWithRetry().catch(() => {
        // Silently fail preload attempts
      });
    }, 100);
  }

  const WrappedComponent: ComponentType<React.ComponentProps<T>> = (props) => {
    const [error, setError] = React.useState<Error | null>(null);
    const [loadRetries, setLoadRetries] = React.useState(0);

    const handleRetry = React.useCallback(() => {
      setError(null);
      setLoadRetries(prev => prev + 1);
      loadPromise = null; // Reset the load promise
      retries = 0; // Reset internal retry counter
    }, []);

    if (error && loadRetries < retryCount) {
      return <CustomErrorFallback error={error} retry={handleRetry} />;
    }

    return (
      <Suspense 
        fallback={
          <CustomFallback 
            size={size} 
            message={loadingMessage} 
            showProgress={true}
          />
        }
      >
        <LazyComponent {...props} />
      </Suspense>
    );
  };

  // Add preload method to component
  (WrappedComponent as any).preload = () => {
    if (!loadPromise) {
      loadPromise = loadWithRetry();
    }
    return loadPromise;
  };

  WrappedComponent.displayName = `LazyComponent(${importFn.toString().slice(0, 50)}...)`;

  return WrappedComponent;
}

// Intersection Observer based lazy loading for heavy components
interface ObserverLazyLoadOptions extends LazyLoadOptions {
  rootMargin?: string;
  threshold?: number;
  placeholder?: ComponentType;
}

export function createObserverLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: ObserverLazyLoadOptions = {}
): ComponentType<React.ComponentProps<T> & { className?: string }> {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    placeholder: Placeholder = () => (
      <div className="w-full h-40 bg-muted animate-pulse rounded" />
    ),
    ...lazyOptions
  } = options;

  const LazyComponent = createLazyComponent(importFn, lazyOptions);

  return React.forwardRef<HTMLDivElement, React.ComponentProps<T> & { className?: string }>(
    function ObserverLazyComponent(props, ref) {
      const [isVisible, setIsVisible] = React.useState(false);
      const [hasLoaded, setHasLoaded] = React.useState(false);
      const elementRef = React.useRef<HTMLDivElement>(null);

      React.useImperativeHandle(ref, () => elementRef.current!);

      React.useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting && !hasLoaded) {
              setIsVisible(true);
              setHasLoaded(true);
              observer.disconnect();
            }
          },
          {
            rootMargin,
            threshold
          }
        );

        observer.observe(element);

        return () => {
          observer.disconnect();
        };
      }, [hasLoaded, rootMargin, threshold]);

      const { className, ...componentProps } = props;

      return (
        <div ref={elementRef} className={className}>
          {isVisible ? (
            <LazyComponent {...componentProps as React.ComponentProps<T>} />
          ) : (
            <Placeholder />
          )}
        </div>
      );
    }
  );
}

// Route-based lazy loading for pages
export function createRouteLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  routeName: string
): ComponentType<React.ComponentProps<T>> {
  return createLazyComponent(importFn, {
    size: 'large',
    loadingMessage: `Loading ${routeName}...`,
    preload: false,
    retryCount: 2,
    timeout: 15000,
    onLoad: () => {
      PerformanceMonitor.startMeasurement(`route-${routeName}-ready`);
    },
    onError: (error) => {
      errorLogger.logError(new AppError(
        `Failed to load route: ${routeName}`,
        ErrorType.CLIENT,
        ErrorSeverity.HIGH,
        { route: routeName, error: error.message }
      ));
    }
  });
}

// Preloader utility for warming up components
export class ComponentPreloader {
  private static preloadedComponents = new Set<string>();
  private static preloadQueue: Array<() => Promise<any>> = [];
  private static isProcessing = false;

  static async preload(
    components: Array<{
      name: string;
      loader: () => Promise<any>;
      priority?: number;
    }>
  ): Promise<void> {
    // Sort by priority (higher first)
    const sortedComponents = components.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const component of sortedComponents) {
      if (!this.preloadedComponents.has(component.name)) {
        this.preloadQueue.push(component.loader);
        this.preloadedComponents.add(component.name);
      }
    }

    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private static async processQueue(): Promise<void> {
    this.isProcessing = true;

    while (this.preloadQueue.length > 0) {
      const loader = this.preloadQueue.shift();
      if (loader) {
        try {
          await loader();
          // Small delay to avoid blocking the main thread
          await new Promise(resolve => setTimeout(resolve, 10));
        } catch (error) {
          console.warn('Component preload failed:', error);
        }
      }
    }

    this.isProcessing = false;
  }

  static clear(): void {
    this.preloadedComponents.clear();
    this.preloadQueue.length = 0;
    this.isProcessing = false;
  }

  static getStatus(): { preloaded: number; queued: number; processing: boolean } {
    return {
      preloaded: this.preloadedComponents.size,
      queued: this.preloadQueue.length,
      processing: this.isProcessing
    };
  }
}

// Hook for conditional lazy loading
export function useLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  condition: boolean,
  options: LazyLoadOptions = {}
): [ComponentType<React.ComponentProps<T>> | null, boolean] {
  const [LazyComponent, setLazyComponent] = React.useState<ComponentType<React.ComponentProps<T>> | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (condition && !LazyComponent) {
      setIsLoading(true);
      const component = createLazyComponent(importFn, {
        ...options,
        onLoad: () => {
          setIsLoading(false);
          options.onLoad?.();
        },
        onError: (error) => {
          setIsLoading(false);
          options.onError?.(error);
        }
      });
      setLazyComponent(() => component);
    }
  }, [condition, LazyComponent, importFn, options]);

  return [LazyComponent, isLoading];
}

// Lazy loading for analysis components
export const LazyInteractiveCharts = createLazyComponent(
  () => import('@/components/analysis/InteractiveCharts'),
  {
    size: 'large',
    loadingMessage: 'Loading interactive charts...',
    preload: false
  }
);

export const LazyExportManager = createLazyComponent(
  () => import('@/components/analysis/ExportManager'),
  {
    size: 'medium',
    loadingMessage: 'Loading export manager...',
    preload: false
  }
);

export const LazyDashboardCustomizer = createLazyComponent(
  () => import('@/components/analysis/DashboardCustomizer'),
  {
    size: 'large',
    loadingMessage: 'Loading dashboard customizer...',
    preload: false
  }
);

export const LazyAlertSystem = createLazyComponent(
  () => import('@/components/analysis/AlertSystem'),
  {
    size: 'medium',
    loadingMessage: 'Loading alert system...',
    preload: false
  }
);

export const LazyComparativeAnalysis = createLazyComponent(
  () => import('@/components/analysis/ComparativeAnalysis'),
  {
    size: 'large',
    loadingMessage: 'Loading comparative analysis...',
    preload: false
  }
);

export const LazyAdvancedFilters = createLazyComponent(
  () => import('@/components/analysis/AdvancedFilters'),
  {
    size: 'medium',
    loadingMessage: 'Loading advanced filters...',
    preload: false
  }
);

// Default export for compatibility
export default {
  createLazyComponent,
  createObserverLazyComponent,
  createRouteLazyComponent,
  ComponentPreloader,
  useLazyComponent,
  LoadingFallback,
  LazyInteractiveCharts,
  LazyExportManager,
  LazyDashboardCustomizer,
  LazyAlertSystem,
  LazyComparativeAnalysis,
  LazyAdvancedFilters
};
