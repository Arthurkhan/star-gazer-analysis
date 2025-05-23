/**
 * Lazy Loading Utilities - Phase 1 Simplified
 * 
 * Simple loading fallback components for lazy loaded modules
 */

import React from 'react';
import { AppError, ErrorType, ErrorSeverity, errorLogger } from './errorHandling';

// Simple loading fallback component
export const LoadingFallback: React.FC<{ 
  error?: Error; 
  size?: 'small' | 'medium' | 'large';
  message?: string;
}> = ({ error, size = 'medium', message = 'Loading...' }) => {
  if (error) {
    errorLogger.error('Component loading failed:', error);
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-red-500 mb-2">Failed to load component</div>
          <button 
            onClick={() => window.location.reload()} 
            className="text-blue-500 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const sizeClasses = {
    small: 'p-4',
    medium: 'p-8', 
    large: 'p-12'
  };

  const spinnerSizes = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div className={`flex items-center justify-center ${sizeClasses[size]}`}>
      <div className="text-center">
        <div className={`animate-spin rounded-full border-b-2 border-blue-500 mx-auto mb-2 ${spinnerSizes[size]}`}></div>
        <div className="text-muted-foreground">{message}</div>
      </div>
    </div>
  );
};

// Simple spinner component
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`animate-spin rounded-full border-b-2 border-blue-500 ${sizeClasses[size]}`} />
  );
};

// Create lazy component with error boundary
export const createLazyComponent = <P extends object>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  fallback?: React.ComponentType
) => {
  const LazyComponent = React.lazy(importFn);
  
  return React.forwardRef<any, P>((props, ref) => (
    <React.Suspense fallback={fallback ? <fallback /> : <LoadingFallback />}>
      <LazyComponent {...props} ref={ref} />
    </React.Suspense>
  ));
};

// Placeholder components for missing lazy-loaded components
// These are simple placeholders that prevent import errors

export const LazyInteractiveCharts: React.FC<any> = (props) => (
  <div className="p-6 border rounded-lg">
    <h3 className="text-lg font-semibold mb-4">Interactive Charts</h3>
    <p className="text-muted-foreground">Interactive charts feature coming soon...</p>
    <LoadingFallback message="Charts feature in development" />
  </div>
);

export const LazyExportManager: React.FC<any> = (props) => (
  <div className="p-6 border rounded-lg">
    <h3 className="text-lg font-semibold mb-4">Export Manager</h3>
    <p className="text-muted-foreground">Export functionality coming soon...</p>
    <LoadingFallback message="Export feature in development" />
  </div>
);

export const LazyDashboardCustomizer: React.FC<any> = (props) => (
  <div className="p-6 border rounded-lg">
    <h3 className="text-lg font-semibold mb-4">Dashboard Customizer</h3>
    <p className="text-muted-foreground">Dashboard customization coming soon...</p>
    <LoadingFallback message="Customizer feature in development" />
  </div>
);

export const LazyAlertSystem: React.FC<any> = (props) => (
  <div className="p-6 border rounded-lg">
    <h3 className="text-lg font-semibold mb-4">Alert System</h3>
    <p className="text-muted-foreground">Performance alerts coming soon...</p>
    <LoadingFallback message="Alert system in development" />
  </div>
);

export const LazyComparativeAnalysis: React.FC<any> = (props) => (
  <div className="p-6 border rounded-lg">
    <h3 className="text-lg font-semibold mb-4">Comparative Analysis</h3>
    <p className="text-muted-foreground">Comparison features coming soon...</p>
    <LoadingFallback message="Comparison feature in development" />
  </div>
);

export const LazyAdvancedFilters: React.FC<any> = (props) => (
  <div className="p-6 border rounded-lg">
    <h3 className="text-lg font-semibold mb-4">Advanced Filters</h3>
    <p className="text-muted-foreground">Advanced filtering coming soon...</p>
    <LoadingFallback message="Filters feature in development" />
  </div>
);

export default {
  LoadingFallback,
  LoadingSpinner,
  createLazyComponent,
  LazyInteractiveCharts,
  LazyExportManager,
  LazyDashboardCustomizer,
  LazyAlertSystem,
  LazyComparativeAnalysis,
  LazyAdvancedFilters
};
