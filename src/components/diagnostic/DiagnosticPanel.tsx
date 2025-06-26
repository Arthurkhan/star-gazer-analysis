import React, { useState, useEffect } from 'react'
import loggingService from '@/services/logging/loggingService'
import { ErrorSeverity } from '@/utils/errorHandling'
import { appDebugger } from '@/utils/debugger'

/**
 * A component that provides a diagnostic dashboard for error monitoring and debugging
 */
const DiagnosticPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<'errors' | 'warnings' | 'stats' | 'actions'>('errors')
  const [errors, setErrors] = useState<any[]>([])
  const [warnings, setWarnings] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [systemInfo, setSystemInfo] = useState<any>({})
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null)

  // Load diagnostic data on mount and tab change
  useEffect(() => {
    loadDiagnosticData()

    // Set up system info
    setSystemInfo({
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      devicePixelRatio: window.devicePixelRatio,
      timestamp: new Date().toISOString(),
      timezoneName: Intl.DateTimeFormat().resolvedOptions().timeZone,
      memoryInfo: 'performance' in window && 'memory' in performance
        ? {
            jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          }
        : 'Not available',
    })

    // Set up keyboard shortcut (Ctrl+Shift+F12) to toggle the panel
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'F12') {
        e.preventDefault()
        setIsVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [])

  // Handle auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = window.setInterval(() => {
        loadDiagnosticData()
      }, 3000) // Refresh every 3 seconds
      setRefreshInterval(interval)
    } else if (refreshInterval) {
      clearInterval(refreshInterval)
      setRefreshInterval(null)
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [autoRefresh])

  // Load all diagnostic data
  const loadDiagnosticData = () => {
    // Get errors and warnings
    setErrors(loggingService.getErrors())
    setWarnings(loggingService.getWarnings())

    // Get error statistics
    setStats(loggingService.getErrorStats())
  }

  // Clear logged errors
  const handleClearLogs = () => {
    loggingService.clearLogs()
    loadDiagnosticData()
  }

  // Force an error for testing
  const handleTestError = () => {
    try {
      throw new Error('This is a test error from DiagnosticPanel')
    } catch (error) {
      loggingService.logError(
        'Test error triggered manually',
        ErrorSeverity.ERROR,
        {
          module: 'DiagnosticPanel',
          operation: 'Test error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      )
      loadDiagnosticData()
    }
  }

  // Export logs to console
  const handleExportLogs = () => {
    appDebugger.exportLogs()
  }

  if (!isVisible) {
    return (
      <div className="fixed z-50 bottom-4 right-4">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg"
          title="Open Diagnostic Panel (Ctrl+Shift+F12)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-11/12 max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
            Diagnostic Panel
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="auto-refresh"
                checked={autoRefresh}
                onChange={() => setAutoRefresh(!autoRefresh)}
                className="mr-2"
              />
              <label htmlFor="auto-refresh" className="text-gray-600 dark:text-gray-300">
                Auto-refresh
              </label>
            </div>
            <button
              onClick={() => loadDiagnosticData()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
            >
              Refresh
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'errors'
                ? 'border-b-2 border-red-500 text-red-500'
                : 'text-gray-600 dark:text-gray-300'
            }`}
            onClick={() => setActiveTab('errors')}
          >
            Errors ({errors.length})
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'warnings'
                ? 'border-b-2 border-yellow-500 text-yellow-500'
                : 'text-gray-600 dark:text-gray-300'
            }`}
            onClick={() => setActiveTab('warnings')}
          >
            Warnings ({warnings.length})
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'stats'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-600 dark:text-gray-300'
            }`}
            onClick={() => setActiveTab('stats')}
          >
            Statistics
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'actions'
                ? 'border-b-2 border-green-500 text-green-500'
                : 'text-gray-600 dark:text-gray-300'
            }`}
            onClick={() => setActiveTab('actions')}
          >
            Actions
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'errors' && (
            <div className="space-y-2">
              {errors.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-300">No errors recorded.</p>
              ) : (
                errors.map((error, index) => (
                  <div
                    key={index}
                    className="border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900 rounded-lg p-3"
                  >
                    <div className="flex justify-between">
                      <h3 className="font-semibold text-red-600 dark:text-red-400">{error.message}</h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(error.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {error.module && (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">Module:</span> {error.module}
                        {error.operation && ` / ${error.operation}`}
                      </p>
                    )}
                    {error.stack && (
                      <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-40">
                        {error.stack}
                      </pre>
                    )}
                    {error.metadata && (
                      <div className="mt-2">
                        <details>
                          <summary className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                            Metadata
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify(error.metadata, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'warnings' && (
            <div className="space-y-2">
              {warnings.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-300">No warnings recorded.</p>
              ) : (
                warnings.map((warning, index) => (
                  <div
                    key={index}
                    className="border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-900 rounded-lg p-3"
                  >
                    <div className="flex justify-between">
                      <h3 className="font-semibold text-yellow-600 dark:text-yellow-400">{warning.message}</h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(warning.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {warning.module && (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">Module:</span> {warning.module}
                        {warning.operation && ` / ${warning.operation}`}
                      </p>
                    )}
                    {warning.stack && (
                      <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-40">
                        {warning.stack}
                      </pre>
                    )}
                    {warning.metadata && (
                      <div className="mt-2">
                        <details>
                          <summary className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                            Metadata
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify(warning.metadata, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Error Statistics</h3>
                <div className="space-y-2">
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Total Issues:</span> {stats.total || 0}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Errors:</span> {stats.errors || 0}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Warnings:</span> {stats.warnings || 0}
                  </p>

                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">By Severity</h4>
                    <div className="space-y-1">
                      {stats.bySeverity && Object.entries(stats.bySeverity).map(([severity, count]: [string, any]) => (
                        <div key={severity} className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400 capitalize">{severity}:</span>
                          <span className="font-mono">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">By Module</h4>
                    <div className="space-y-1">
                      {stats.byModule && Object.entries(stats.byModule).map(([module, count]: [string, any]) => (
                        <div key={module} className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">{module}:</span>
                          <span className="font-mono">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">System Information</h3>
                <div className="space-y-2">
                  {Object.entries(systemInfo).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <span className="font-semibold text-gray-700 dark:text-gray-300 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      {typeof value === 'object' ? (
                        <pre className="text-sm bg-gray-100 dark:bg-gray-800 p-1 rounded mt-1 overflow-auto">
                          {JSON.stringify(value, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-gray-600 dark:text-gray-400">{String(value)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Diagnostic Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={handleClearLogs}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                  >
                    Clear Error Logs
                  </button>
                  <button
                    onClick={handleTestError}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                  >
                    Generate Test Error
                  </button>
                  <button
                    onClick={handleExportLogs}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Export Logs to Console
                  </button>
                  <button
                    onClick={() => {
                      localStorage.setItem('DEBUG_MODE', 'true')
                      appDebugger.enable()
                      alert('Debug mode enabled. Check console for logs.')
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                  >
                    Enable Debug Mode
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Browser Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      if ('performance' in window) {
                        console.table(performance.getEntriesByType('navigation'))
                        alert('Navigation timing information logged to console')
                      } else {
                        alert('Performance API not available in this browser')
                      }
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                  >
                    Log Navigation Timing
                  </button>
                  <button
                    onClick={() => {
                      if ('performance' in window) {
                        console.table(performance.getEntriesByType('resource'))
                        alert('Resource timing information logged to console')
                      } else {
                        alert('Performance API not available in this browser')
                      }
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                  >
                    Log Resource Timing
                  </button>
                  <button
                    onClick={() => {
                      if ('caches' in window) {
                        caches.keys().then(keys => {
                          console.log('Cache keys:', keys)
                          alert(`Found ${keys.length} cache(s). Details logged to console.`)
                        })
                      } else {
                        alert('Cache API not available in this browser')
                      }
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                  >
                    Inspect Browser Caches
                  </button>
                  <button
                    onClick={() => {
                      localStorage.clear()
                      sessionStorage.clear()
                      alert('Local storage and session storage cleared')
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                  >
                    Clear Browser Storage
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-500 dark:text-gray-400">
          Press Ctrl+Shift+F12 to toggle this panel. Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}

export default DiagnosticPanel
