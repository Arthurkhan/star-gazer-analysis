import { useEffect, useRef, useCallback } from 'react'

/**
 * Performance monitoring utilities
 */

// Memory usage tracking
export const trackMemoryUsage = () => {
  if ('memory' in performance) {
    const {memory} = (performance as any)
    return {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024 * 100) / 100,
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024 * 100) / 100,
      timestamp: Date.now(),
    }
  }
  return null
}

// Performance measurement for async operations
export const measureAsyncPerformance = async <T>(
  name: string,
  operation: () => Promise<T>,
): Promise<T> => {
  const start = performance.now()
  try {
    const result = await operation()
    const duration = performance.now() - start

    if (duration > 100) { // Only log operations >100ms
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)
    }

    return result
  } catch (error) {
    const duration = performance.now() - start
    console.error(`[Performance Error] ${name}: ${duration.toFixed(2)}ms`, error)
    throw error
  }
}

// Debounced function with cleanup
export const createDebouncedFunction = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): T & { cancel: () => void } => {
  let timeoutId: NodeJS.Timeout | null = null

  const debouncedFunc = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func(...args)
      timeoutId = null
    }, delay)
  }) as T & { cancel: () => void }

  debouncedFunc.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return debouncedFunc
}

// Throttled function with cleanup
export const createThrottledFunction = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): T & { cancel: () => void } => {
  let lastCall = 0
  let timeoutId: NodeJS.Timeout | null = null

  const throttledFunc = ((...args: Parameters<T>) => {
    const now = Date.now()

    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        func(...args)
        timeoutId = null
      }, delay - (now - lastCall))
    }
  }) as T & { cancel: () => void }

  throttledFunc.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return throttledFunc
}

/**
 * React hooks for performance optimization
 */

// Cleanup hook for preventing memory leaks
export const useCleanup = (cleanup: () => void) => {
  const cleanupRef = useRef(cleanup)
  cleanupRef.current = cleanup

  useEffect(() => {
    return () => cleanupRef.current()
  }, [])
}

// Debounced callback hook
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = [],
): T & { cancel: () => void } => {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  const debouncedFuncRef = useRef<(T & { cancel: () => void }) | null>(null)

  const memoizedCallback = useCallback(() => {
    if (debouncedFuncRef.current) {
      debouncedFuncRef.current.cancel()
    }

    debouncedFuncRef.current = createDebouncedFunction(
      (...args: Parameters<T>) => callbackRef.current(...args),
      delay,
    )

    return debouncedFuncRef.current
  }, [delay, ...deps])

  useEffect(() => {
    return () => {
      if (debouncedFuncRef.current) {
        debouncedFuncRef.current.cancel()
      }
    }
  }, [])

  return memoizedCallback()
}

// Throttled callback hook
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = [],
): T & { cancel: () => void } => {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  const throttledFuncRef = useRef<(T & { cancel: () => void }) | null>(null)

  const memoizedCallback = useCallback(() => {
    if (throttledFuncRef.current) {
      throttledFuncRef.current.cancel()
    }

    throttledFuncRef.current = createThrottledFunction(
      (...args: Parameters<T>) => callbackRef.current(...args),
      delay,
    )

    return throttledFuncRef.current
  }, [delay, ...deps])

  useEffect(() => {
    return () => {
      if (throttledFuncRef.current) {
        throttledFuncRef.current.cancel()
      }
    }
  }, [])

  return memoizedCallback()
}

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {},
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false)
  const [hasIntersected, setHasIntersected] = React.useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
      if (entry.isIntersecting && !hasIntersected) {
        setHasIntersected(true)
      }
    }, options)

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [elementRef, options, hasIntersected])

  return { isIntersecting, hasIntersected }
}

// Memory usage monitoring hook
export const useMemoryMonitor = (interval: number = 5000) => {
  const [memoryUsage, setMemoryUsage] = React.useState<ReturnType<typeof trackMemoryUsage>>(null)

  useEffect(() => {
    const updateMemoryUsage = () => {
      const usage = trackMemoryUsage()
      setMemoryUsage(usage)
    }

    updateMemoryUsage() // Initial measurement
    const intervalId = setInterval(updateMemoryUsage, interval)

    return () => clearInterval(intervalId)
  }, [interval])

  return memoryUsage
}

// Web Workers utilities
export const createWorker = (workerFunction: Function): Worker => {
  const blob = new Blob([`(${workerFunction.toString()})()`], {
    type: 'application/javascript',
  })

  return new Worker(URL.createObjectURL(blob))
}

// Batch processing utility
export const batchProcess = async <T, R>(
  items: T[],
  processor: (batch: T[]) => Promise<R[]>,
  batchSize: number = 100,
  onProgress?: (processed: number, total: number) => void,
): Promise<R[]> => {
  const results: R[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await processor(batch)
    results.push(...batchResults)

    if (onProgress) {
      onProgress(Math.min(i + batchSize, items.length), items.length)
    }

    // Allow other tasks to run
    await new Promise(resolve => setTimeout(resolve, 0))
  }

  return results
}
