/**
 * Lazy Loading Components - Phase 5
 *
 * This module provides lazy-loaded versions of analysis components
 * to improve performance and reduce initial bundle size.
 */

import React, { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createLazyComponent, PerformanceMonitor } from '@/utils/performanceOptimizations'

// Loading fallback component
const LoadingFallback: React.FC<{ componentName: string }> = ({ componentName }) => (
  <Card className="w-full">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading {componentName}...
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </CardContent>
  </Card>
)

// Lazy loaded analysis components
export const LazyInteractiveCharts = createLazyComponent(
  () => import('@/components/analysis/InteractiveCharts'),
  () => <LoadingFallback componentName="Interactive Charts" />,
)

export const LazyExportManager = createLazyComponent(
  () => import('@/components/analysis/ExportManager'),
  () => <LoadingFallback componentName="Export Manager" />,
)

export const LazyDashboardCustomizer = createLazyComponent(
  () => import('@/components/analysis/DashboardCustomizer'),
  () => <LoadingFallback componentName="Dashboard Customizer" />,
)

export const LazyAlertSystem = createLazyComponent(
  () => import('@/components/analysis/AlertSystem'),
  () => <LoadingFallback componentName="Alert System" />,
)

export const LazyComparativeAnalysis = createLazyComponent(
  () => import('@/components/analysis/ComparativeAnalysis'),
  () => <LoadingFallback componentName="Comparative Analysis" />,
)

export const LazyAdvancedFilters = createLazyComponent(
  () => import('@/components/analysis/AdvancedFilters'),
  () => <LoadingFallback componentName="Advanced Filters" />,
)

// Wrapper component with performance monitoring
interface LazyComponentWrapperProps {
  children: React.ReactNode;
  componentName: string;
  fallback?: React.ComponentType;
}

export const LazyComponentWrapper: React.FC<LazyComponentWrapperProps> = ({
  children,
  componentName,
  fallback: Fallback = () => <LoadingFallback componentName={componentName} />,
}) => {
  React.useEffect(() => {
    const stopMeasurement = PerformanceMonitor.startMeasurement(`lazy-${componentName}`)
    return () => {
      stopMeasurement()
    }
  }, [componentName])

  return (
    <Suspense fallback={<Fallback />}>
      {children}
    </Suspense>
  )
}

// Preload utility for critical components
export const preloadComponent = (componentLoader: () => Promise<any>) => {
  // Only preload if user is likely to interact (on mouse move or key press)
  const handleUserInteraction = () => {
    componentLoader().catch(() => {
      // Ignore preload errors
    })

    // Remove listeners after first interaction
    document.removeEventListener('mousemove', handleUserInteraction)
    document.removeEventListener('keydown', handleUserInteraction)
    document.removeEventListener('scroll', handleUserInteraction)
  }

  // Add listeners for user interaction
  document.addEventListener('mousemove', handleUserInteraction, { once: true })
  document.addEventListener('keydown', handleUserInteraction, { once: true })
  document.addEventListener('scroll', handleUserInteraction, { once: true })
}

// Initialize preloading for critical components
if (typeof window !== 'undefined') {
  // Preload interactive charts after user interaction
  preloadComponent(() => import('@/components/analysis/InteractiveCharts'))

  // Preload export manager after a short delay
  setTimeout(() => {
    preloadComponent(() => import('@/components/analysis/ExportManager'))
  }, 2000)
}

export default {
  LazyInteractiveCharts,
  LazyExportManager,
  LazyDashboardCustomizer,
  LazyAlertSystem,
  LazyComparativeAnalysis,
  LazyAdvancedFilters,
  LazyComponentWrapper,
  preloadComponent,
}
