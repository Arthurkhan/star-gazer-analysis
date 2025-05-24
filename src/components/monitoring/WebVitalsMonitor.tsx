import { useEffect } from 'react'
import { getCLS, getFID, getFCP, getLCP, getTTFB, onCLS, onFID, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals'

interface VitalsData {
  metric: Metric
  timestamp: number
  url: string
  userAgent: string
}

// Web Vitals thresholds (Google recommendations)
const VITALS_THRESHOLDS = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FID: { good: 100, needsImprovement: 300 },
  FCP: { good: 1800, needsImprovement: 3000 },
  LCP: { good: 2500, needsImprovement: 4000 },
  TTFB: { good: 800, needsImprovement: 1800 },
} as const

type VitalName = keyof typeof VITALS_THRESHOLDS

function getVitalStatus(name: VitalName, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = VITALS_THRESHOLDS[name]
  if (value <= threshold.good) return 'good'
  if (value <= threshold.needsImprovement) return 'needs-improvement'
  return 'poor'
}

function logVital(metric: Metric) {
  const vitalsData: VitalsData = {
    metric,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  }

  const status = getVitalStatus(metric.name as VitalName, metric.value)
  const statusEmoji = {
    good: '✅',
    'needs-improvement': '⚠️',
    poor: '❌',
  }[status]

  console.log(
    `${statusEmoji} Web Vital: ${metric.name}`,
    `${metric.value} (${status})`,
    vitalsData
  )

  // In production, send to analytics service
  if (import.meta.env.PROD) {
    sendToAnalytics(vitalsData)
  }

  // Store in local storage for debugging
  if (import.meta.env.DEV) {
    const storedVitals = JSON.parse(localStorage.getItem('web-vitals') || '[]')
    storedVitals.push(vitalsData)
    // Keep only last 50 entries
    if (storedVitals.length > 50) {
      storedVitals.splice(0, storedVitals.length - 50)
    }
    localStorage.setItem('web-vitals', JSON.stringify(storedVitals))
  }
}

function sendToAnalytics(data: VitalsData) {
  // Example implementation - replace with your analytics service
  // Google Analytics 4
  if (typeof gtag !== 'undefined') {
    gtag('event', data.metric.name, {
      custom_parameter_1: data.metric.value,
      custom_parameter_2: data.url,
    })
  }

  // Custom analytics endpoint
  fetch('/api/analytics/web-vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(error => {
    console.warn('Failed to send vitals to analytics:', error)
  })
}

// React component for monitoring Web Vitals
export function WebVitalsMonitor() {
  useEffect(() => {
    // Monitor all core web vitals
    onCLS(logVital)
    onFID(logVital)
    onFCP(logVital)
    onLCP(logVital)
    onTTFB(logVital)

    // Also get immediate measurements for some metrics
    getCLS(logVital)
    getFCP(logVital)
    getLCP(logVital)
    getTTFB(logVital)

    // FID requires user interaction, so we can't get it immediately
    getFID(logVital)
  }, [])

  // This component doesn't render anything
  return null
}

// Utility function to get stored vitals (for debugging)
export function getStoredVitals(): VitalsData[] {
  try {
    return JSON.parse(localStorage.getItem('web-vitals') || '[]')
  } catch {
    return []
  }
}

// Utility function to clear stored vitals
export function clearStoredVitals(): void {
  localStorage.removeItem('web-vitals')
}

// Create a vitals summary for reporting
export function createVitalsSummary(vitals: VitalsData[] = getStoredVitals()) {
  const summary: Record<string, { count: number; average: number; status: Record<string, number> }> = {}

  vitals.forEach(({ metric }) => {
    if (!summary[metric.name]) {
      summary[metric.name] = {
        count: 0,
        average: 0,
        status: { good: 0, 'needs-improvement': 0, poor: 0 },
      }
    }

    const entry = summary[metric.name]
    entry.count++
    entry.average = (entry.average * (entry.count - 1) + metric.value) / entry.count
    
    const status = getVitalStatus(metric.name as VitalName, metric.value)
    entry.status[status]++
  })

  return summary
}

// Performance monitoring hook
export function usePerformanceMonitoring(options: { 
  enabled?: boolean
  reportInterval?: number 
} = {}) {
  const { enabled = true, reportInterval = 60000 } = options

  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(() => {
      const summary = createVitalsSummary()
      console.log('📊 Performance Summary:', summary)
    }, reportInterval)

    return () => clearInterval(interval)
  }, [enabled, reportInterval])
}

declare global {
  function gtag(...args: any[]): void
}

export default WebVitalsMonitor
