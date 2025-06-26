/**
 * Cross-Browser Compatibility Testing Utility - Phase 5
 *
 * This module provides comprehensive browser compatibility testing
 * for the Star-Gazer-Analysis application.
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Monitor,
  Smartphone,
  Tablet,
  Chrome,
  Firefox,
} from 'lucide-react'
import { PerformanceMonitor } from '@/utils/performanceOptimizations'

interface BrowserInfo {
  name: string;
  version: string;
  userAgent: string;
  supported: boolean;
  issues: string[];
}

interface FeatureTest {
  name: string;
  test: () => boolean | Promise<boolean>;
  critical: boolean;
  description: string;
}

interface PerformanceTest {
  name: string;
  test: () => Promise<number>;
  threshold: number; // milliseconds
  description: string;
}

export const CrossBrowserTesting: React.FC = () => {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null)
  const [featureResults, setFeatureResults] = useState<Map<string, boolean>>(new Map())
  const [performanceResults, setPerformanceResults] = useState<Map<string, number>>(new Map())
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState<{
    passed: number;
    failed: number;
    warnings: number;
  }>({ passed: 0, failed: 0, warnings: 0 })

  // Browser detection
  const detectBrowser = (): BrowserInfo => {
    const {userAgent} = navigator
    let name = 'Unknown'
    let version = 'Unknown'
    const issues: string[] = []
    let supported = true

    // Chrome
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      name = 'Chrome'
      const chromeVersion = userAgent.match(/Chrome\/(\d+)/)
      version = chromeVersion ? chromeVersion[1] : 'Unknown'

      if (parseInt(version) < 90) {
        issues.push('Chrome version may be too old for optimal performance')
        supported = false
      }
    }
    // Firefox
    else if (userAgent.includes('Firefox')) {
      name = 'Firefox'
      const firefoxVersion = userAgent.match(/Firefox\/(\d+)/)
      version = firefoxVersion ? firefoxVersion[1] : 'Unknown'

      if (parseInt(version) < 85) {
        issues.push('Firefox version may be too old for optimal performance')
        supported = false
      }
    }
    // Safari
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      name = 'Safari'
      const safariVersion = userAgent.match(/Version\/(\d+)/)
      version = safariVersion ? safariVersion[1] : 'Unknown'

      if (parseInt(version) < 14) {
        issues.push('Safari version may be too old for optimal performance')
        supported = false
      }
    }
    // Edge
    else if (userAgent.includes('Edg')) {
      name = 'Edge'
      const edgeVersion = userAgent.match(/Edg\/(\d+)/)
      version = edgeVersion ? edgeVersion[1] : 'Unknown'

      if (parseInt(version) < 90) {
        issues.push('Edge version may be too old for optimal performance')
        supported = false
      }
    }
    // Internet Explorer (not supported)
    else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
      name = 'Internet Explorer'
      supported = false
      issues.push('Internet Explorer is not supported. Please use a modern browser.')
    }

    return { name, version, userAgent, supported, issues }
  }

  // Feature compatibility tests
  const featureTests: FeatureTest[] = [
    {
      name: 'ES2020 Support',
      test: () => {
        try {
          // Test optional chaining and nullish coalescing
          const obj: any = { a: { b: null } }
          return obj?.a?.b ?? 'default' === 'default'
        } catch {
          return false
        }
      },
      critical: true,
      description: 'Modern JavaScript features required for the application',
    },
    {
      name: 'CSS Grid Support',
      test: () => {
        const element = document.createElement('div')
        return 'grid' in element.style
      },
      critical: true,
      description: 'CSS Grid is used for responsive layouts',
    },
    {
      name: 'CSS Custom Properties',
      test: () => {
        const element = document.createElement('div')
        return CSS.supports('color', 'var(--test)')
      },
      critical: true,
      description: 'CSS variables are used for theming',
    },
    {
      name: 'Fetch API',
      test: () => typeof fetch !== 'undefined',
      critical: true,
      description: 'Fetch API is used for all network requests',
    },
    {
      name: 'Web Workers',
      test: () => typeof Worker !== 'undefined',
      critical: false,
      description: 'Web Workers are used for performance optimization',
    },
    {
      name: 'Local Storage',
      test: () => {
        try {
          localStorage.setItem('test', 'test')
          localStorage.removeItem('test')
          return true
        } catch {
          return false
        }
      },
      critical: true,
      description: 'Local Storage is used for user preferences',
    },
    {
      name: 'Intersection Observer',
      test: () => 'IntersectionObserver' in window,
      critical: false,
      description: 'Used for performance optimizations and lazy loading',
    },
    {
      name: 'ResizeObserver',
      test: () => 'ResizeObserver' in window,
      critical: false,
      description: 'Used for responsive chart rendering',
    },
    {
      name: 'WebGL Support',
      test: () => {
        try {
          const canvas = document.createElement('canvas')
          return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        } catch {
          return false
        }
      },
      critical: false,
      description: 'Used for advanced chart visualizations',
    },
    {
      name: 'Clipboard API',
      test: () => !!navigator.clipboard,
      critical: false,
      description: 'Used for copy-to-clipboard functionality',
    },
  ]

  // Performance tests
  const performanceTests: PerformanceTest[] = [
    {
      name: 'DOM Manipulation Speed',
      test: async () => {
        const startTime = performance.now()
        const container = document.createElement('div')

        for (let i = 0; i < 1000; i++) {
          const element = document.createElement('div')
          element.textContent = `Item ${i}`
          container.appendChild(element)
        }

        document.body.appendChild(container)
        document.body.removeChild(container)

        return performance.now() - startTime
      },
      threshold: 100,
      description: 'Time to create and manipulate 1000 DOM elements',
    },
    {
      name: 'JSON Parse Performance',
      test: async () => {
        const largeObject = { data: new Array(10000).fill(0).map((_, i) => ({ id: i, value: Math.random() })) }
        const jsonString = JSON.stringify(largeObject)

        const startTime = performance.now()
        JSON.parse(jsonString)
        return performance.now() - startTime
      },
      threshold: 50,
      description: 'Time to parse large JSON data',
    },
    {
      name: 'Array Processing Speed',
      test: async () => {
        const largeArray = new Array(100000).fill(0).map(() => Math.random())

        const startTime = performance.now()
        largeArray
          .filter(n => n > 0.5)
          .map(n => n * 2)
          .reduce((sum, n) => sum + n, 0)

        return performance.now() - startTime
      },
      threshold: 100,
      description: 'Time to process large array with filter/map/reduce',
    },
  ]

  // Run all tests
  const runTests = async () => {
    setTesting(true)
    const featureMap = new Map<string, boolean>()
    const performanceMap = new Map<string, number>()

    let passed = 0
    let failed = 0
    let warnings = 0

    // Feature tests
    for (const test of featureTests) {
      try {
        const result = await Promise.resolve(test.test())
        featureMap.set(test.name, result)

        if (result) {
          passed++
        } else if (test.critical) {
          failed++
        } else {
          warnings++
        }
      } catch (error) {
        featureMap.set(test.name, false)
        if (test.critical) {
          failed++
        } else {
          warnings++
        }
      }
    }

    // Performance tests
    for (const test of performanceTests) {
      try {
        const duration = await test.test()
        performanceMap.set(test.name, duration)

        if (duration <= test.threshold) {
          passed++
        } else if (duration <= test.threshold * 2) {
          warnings++
        } else {
          failed++
        }
      } catch (error) {
        performanceMap.set(test.name, -1)
        failed++
      }
    }

    setFeatureResults(featureMap)
    setPerformanceResults(performanceMap)
    setTestResults({ passed, failed, warnings })
    setTesting(false)
  }

  // Get device type
  const getDeviceType = () => {
    const width = window.innerWidth
    if (width < 768) return { icon: Smartphone, type: 'Mobile' }
    if (width < 1024) return { icon: Tablet, type: 'Tablet' }
    return { icon: Monitor, type: 'Desktop' }
  }

  const { icon: DeviceIcon, type: deviceType } = getDeviceType()

  useEffect(() => {
    setBrowserInfo(detectBrowser())
  }, [])

  if (!browserInfo) {
    return <div>Loading browser information...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Cross-Browser Compatibility Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Chrome className="w-4 h-4" />
                <span className="font-medium">Browser:</span>
                <span>{browserInfo.name} {browserInfo.version}</span>
                <Badge variant={browserInfo.supported ? 'default' : 'destructive'}>
                  {browserInfo.supported ? 'Supported' : 'Unsupported'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <DeviceIcon className="w-4 h-4" />
                <span className="font-medium">Device:</span>
                <span>{deviceType}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Screen:</span>
                <span>{window.screen.width}x{window.screen.height}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Viewport:</span>
                <span>{window.innerWidth}x{window.innerHeight}</span>
              </div>
            </div>
          </div>

          {browserInfo.issues.length > 0 && (
            <Alert className="mb-4" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {browserInfo.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Button onClick={runTests} disabled={testing} className="mb-4">
            {testing ? 'Running Tests...' : 'Run Compatibility Tests'}
          </Button>

          {!testing && (featureResults.size > 0 || performanceResults.size > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Card className="bg-green-50 dark:bg-green-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">{testResults.passed}</span>
                    <span className="text-sm text-green-600">Passed</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-yellow-50 dark:bg-yellow-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <span className="text-2xl font-bold text-yellow-600">{testResults.warnings}</span>
                    <span className="text-sm text-yellow-600">Warnings</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-red-50 dark:bg-red-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-2xl font-bold text-red-600">{testResults.failed}</span>
                    <span className="text-sm text-red-600">Failed</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {featureResults.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Feature Compatibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {featureTests.map((test) => {
                const result = featureResults.get(test.name)
                const status = result ? 'passed' : test.critical ? 'failed' : 'warning'

                return (
                  <div key={test.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {status === 'passed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {status === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                        {status === 'failed' && <XCircle className="w-4 h-4 text-red-600" />}
                        <span className="font-medium">{test.name}</span>
                        {test.critical && <Badge variant="outline" className="text-xs">Critical</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{test.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {performanceResults.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performanceTests.map((test) => {
                const result = performanceResults.get(test.name)
                if (result === undefined) return null

                const status = result === -1 ? 'failed' :
                             result <= test.threshold ? 'passed' :
                             result <= test.threshold * 2 ? 'warning' : 'failed'

                return (
                  <div key={test.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {status === 'passed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {status === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                        {status === 'failed' && <XCircle className="w-4 h-4 text-red-600" />}
                        <span className="font-medium">{test.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{test.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">
                        {result === -1 ? 'Error' : `${result.toFixed(2)}ms`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Threshold: {test.threshold}ms
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default CrossBrowserTesting
