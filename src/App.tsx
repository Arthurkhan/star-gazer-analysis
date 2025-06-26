import { Toaster as Sonner } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { appDebugger } from '@/utils/debugger'
import { setupAdvancedErrorHandling } from '@/utils/errorHandling'
import { safeLocalStorage } from '@/utils/storage/safeStorage'
import loggingService from '@/services/logging/loggingService'
import connectionManager, { ConnectionEventType } from '@/utils/network/connectionManager'
import ErrorBoundary from '@/components/ErrorBoundary'
import DiagnosticPanel from '@/components/diagnostic/DiagnosticPanel'
// Removed unused import
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import AISettings from './pages/AISettings'
import NotFound from './pages/NotFound'

// Create a global query client with enhanced error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      onError: (error) => {
        appDebugger.error('React Query error:', error)
        loggingService.logError(
          error instanceof Error ? error.message : 'Query error',
          'error',
          {
            module: 'ReactQuery',
            operation: 'query',
            stack: error instanceof Error ? error.stack : undefined,
          },
        )
        toast({
          title: 'Data Fetch Error',
          description: error instanceof Error ? error.message : 'Failed to fetch data',
          variant: 'destructive',
        })
      },
    },
  },
})

// Initialize services
setupAdvancedErrorHandling()
loggingService.initialize()

// Connection state listener
connectionManager.addListener((state, eventType) => {
  switch (eventType) {
    case ConnectionEventType.OFFLINE:
      // Pause background operations when offline
      queryClient.cancelQueries()
      break
    case ConnectionEventType.ONLINE:
      // Refresh data when back online
      queryClient.invalidateQueries()
      break
  }
})

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  // Set viewport meta tag for mobile
  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]')
    if (!viewport) {
      const meta = document.createElement('meta')
      meta.name = 'viewport'
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      document.head.appendChild(meta)
    }

    // Add mobile web app meta tags
    const appleMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]')
    if (!appleMeta) {
      const meta = document.createElement('meta')
      meta.name = 'apple-mobile-web-app-capable'
      meta.content = 'yes'
      document.head.appendChild(meta)
    }

    const statusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
    if (!statusBar) {
      const meta = document.createElement('meta')
      meta.name = 'apple-mobile-web-app-status-bar-style'
      meta.content = 'black-translucent'
      document.head.appendChild(meta)
    }
  }, [])

  // Check system preference for dark mode and auth state
  useEffect(() => {
    appDebugger.info('App component mounted')

    // Show diagnostics if debug mode is enabled
    const debugMode = safeLocalStorage.getItem('DEBUG_MODE')
    setShowDiagnostics(debugMode === 'true')

    // Set up connection monitoring
    const handleConnectionChange = (state: { online: boolean }) => {
      setIsOffline(!state.online)
    }
    connectionManager.addListener(handleConnectionChange)

    // Dark mode handling with safe storage
    const theme = safeLocalStorage.getItem('theme')
    if (theme === 'dark' ||
        (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
      safeLocalStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      safeLocalStorage.setItem('theme', 'light')
    }

    // Check authentication with improved error handling
    const checkAuth = async () => {
      try {
        appDebugger.info('Checking authentication...')
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          appDebugger.error('Auth error:', error)
          loggingService.logError(
            `Authentication error: ${error.message}`,
            'error',
            {
              module: 'Authentication',
              operation: 'getSession',
              metadata: { error },
            },
          )
          setAuthError(`Authentication error: ${error.message}`)
          setIsAuthenticated(false)
          toast({
            title: 'Authentication Error',
            description: error.message,
            variant: 'destructive',
          })
        } else {
          appDebugger.info('Auth session:', data.session ? 'Found' : 'Not found')
          setIsAuthenticated(!!data.session)
          setAuthError(null)
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            appDebugger.info('Auth state changed:', { event, sessionExists: !!session })
            setIsAuthenticated(!!session)
            if (!session && event === 'SIGNED_OUT') {
              toast({
                title: 'Signed Out',
                description: 'You have been signed out successfully.',
                variant: 'info',
              })
            }
          },
        )

        setAuthLoading(false)
        return () => subscription.unsubscribe()
      } catch (err) {
        appDebugger.error('Error in authentication check:', err)
        const errorMessage = err instanceof Error ? err.message : 'Unknown authentication error'
        loggingService.logError(
          `Authentication error: ${errorMessage}`,
          'error',
          {
            module: 'Authentication',
            operation: 'checkAuth',
            stack: err instanceof Error ? err.stack : undefined,
          },
        )
        setAuthError(`Authentication error: ${errorMessage}`)
        setIsAuthenticated(false)
        setAuthLoading(false)
        toast({
          title: 'Authentication Error',
          description: errorMessage,
          variant: 'destructive',
        })
      }
    }

    checkAuth()

    // Cleanup
    return () => {
      connectionManager.removeListener(handleConnectionChange)
    }
  }, [])

  // Add debug drawer toggle on keyboard shortcut (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault()

        // Toggle debug mode
        if (safeLocalStorage.getItem('DEBUG_MODE') === 'true') {
          appDebugger.disable()
          safeLocalStorage.setItem('DEBUG_MODE', 'false')
          setShowDiagnostics(false)
          toast({
            title: 'Debug Mode Disabled',
            description: 'Application debugging has been turned off.',
            variant: 'info',
          })
        } else {
          appDebugger.enable()
          safeLocalStorage.setItem('DEBUG_MODE', 'true')
          setShowDiagnostics(true)
          toast({
            title: 'Debug Mode Enabled',
            description: 'Application debugging has been turned on. Check console for logs.',
            variant: 'info',
          })

          // Export current logs to console
          appDebugger.exportLogs()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Wait until we've checked auth before rendering
  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="text-gray-500 dark:text-gray-400 animate-pulse">Loading application...</p>
        </div>
      </div>
    )
  }

  // Show auth error if there is one
  if (authError && !isAuthenticated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Authentication Error</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{authError}</p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please try refreshing the page or checking your internet connection.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors flex-1">
              Refresh Page
            </button>
            <button
              onClick={() => { setAuthError(null); setIsAuthenticated(false) }}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded transition-colors flex-1">
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 antialiased text-gray-900 dark:text-gray-100">
            {/* Using only Sonner for toast notifications to avoid conflicts */}
            <Sonner
              position="top-center"
              closeButton
              expand={false}
              toastOptions={{
                className: '!top-safe-top',
              }}
            />

            {/* Diagnostic Panel (only shown in debug mode) */}
            {showDiagnostics && <DiagnosticPanel />}

            {/* Offline indicator */}
            {isOffline && (
              <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-2 text-center z-50 text-sm">
                You are currently offline. Some features may not be available.
              </div>
            )}

            <BrowserRouter>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/auth" />} />
                  <Route path="/auth" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Auth />} />
                  <Route
                    path="/dashboard"
                    element={
                      isAuthenticated ? (
                        <ErrorBoundary
                          fallback={
                            <div className="p-6 max-w-xl mx-auto my-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Dashboard Error</h2>
                              <p className="mb-4">We encountered a problem loading the dashboard.</p>
                              <button
                                onClick={() => window.location.reload()}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                              >
                                Reload Application
                              </button>
                            </div>
                          }
                        >
                          <Dashboard />
                        </ErrorBoundary>
                      ) : (
                        <Navigate to="/auth" />
                      )
                    }
                  />
                  <Route path="/ai-settings" element={isAuthenticated ? <AISettings /> : <Navigate to="/auth" />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
            </BrowserRouter>
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
