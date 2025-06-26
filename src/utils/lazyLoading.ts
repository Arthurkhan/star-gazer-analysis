/**
 * Lazy Loading System - Core Utilities
 *
 * This file contains only non-JSX utilities and re-exports JSX components
 * from the .tsx file to maintain compatibility.
 */

import type { ComponentType } from 'react'

// Re-export JSX components from the .tsx file
export {
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
  LazyAdvancedFilters,
} from './lazyLoading.tsx'

// Enhanced lazy loading options (non-JSX types)
export interface LazyLoadOptions {
  fallback?: ComponentType<any>;
  errorFallback?: ComponentType<{ error: Error; retry: () => void }>;
  preload?: boolean;
  retryCount?: number;
  timeout?: number;
  size?: 'small' | 'medium' | 'large';
  loadingMessage?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

// Loading fallback props interface
export interface LoadingFallbackProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  showProgress?: boolean;
}

// Observer lazy load options interface
export interface ObserverLazyLoadOptions extends LazyLoadOptions {
  rootMargin?: string;
  threshold?: number;
  placeholder?: ComponentType;
}

// Default export for compatibility
const LazyLoadingUtils = {
  createLazyComponent: async () => {
    const module = await import('./lazyLoading.tsx')
    return module.createLazyComponent
  },
  createObserverLazyComponent: async () => {
    const module = await import('./lazyLoading.tsx')
    return module.createObserverLazyComponent
  },
  createRouteLazyComponent: async () => {
    const module = await import('./lazyLoading.tsx')
    return module.createRouteLazyComponent
  },
  ComponentPreloader: async () => {
    const module = await import('./lazyLoading.tsx')
    return module.ComponentPreloader
  },
  useLazyComponent: async () => {
    const module = await import('./lazyLoading.tsx')
    return module.useLazyComponent
  },
}

export default LazyLoadingUtils
