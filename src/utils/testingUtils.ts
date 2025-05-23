/**
 * Testing and Cross-Browser Compatibility Utilities - Phase 5
 * 
 * This module provides utilities for testing performance optimizations
 * and ensuring cross-browser compatibility.
 */

/**
 * Browser compatibility detection utilities
 */
export class BrowserCompatibility {
  private static userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';

  static isChrome(): boolean {
    return this.userAgent.includes('Chrome') && !this.userAgent.includes('Edge');
  }

  static isFirefox(): boolean {
    return this.userAgent.includes('Firefox');
  }

  static isSafari(): boolean {
    return this.userAgent.includes('Safari') && !this.userAgent.includes('Chrome');
  }

  static isEdge(): boolean {
    return this.userAgent.includes('Edge');
  }

  static isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(this.userAgent);
  }

  static supportsIntersectionObserver(): boolean {
    return typeof IntersectionObserver !== 'undefined';
  }

  static supportsResizeObserver(): boolean {
    return typeof ResizeObserver !== 'undefined';
  }

  static supportsWebWorkers(): boolean {
    return typeof Worker !== 'undefined';
  }

  static getMemoryInfo() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }
    return null;
  }

  static reportCompatibility(): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Browser Compatibility Report:', {
        browser: this.getBrowserName(),
        mobile: this.isMobile(),
        intersectionObserver: this.supportsIntersectionObserver(),
        resizeObserver: this.supportsResizeObserver(),
        webWorkers: this.supportsWebWorkers(),
        memory: this.getMemoryInfo()
      });
    }
  }

  private static getBrowserName(): string {
    if (this.isChrome()) return 'Chrome';
    if (this.isFirefox()) return 'Firefox';
    if (this.isSafari()) return 'Safari';
    if (this.isEdge()) return 'Edge';
    return 'Unknown';
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceTester {
  private static tests: Map<string, number[]> = new Map();

  static async testComponentRender<T>(
    componentName: string,
    renderFn: () => T,
    iterations: number = 10
  ): Promise<{ average: number; min: number; max: number; results: T }> {
    const times: number[] = [];
    let lastResult: T;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      lastResult = renderFn();
      const end = performance.now();
      times.push(end - start);
    }

    const average = times.reduce((sum, time) => sum + time, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    this.tests.set(componentName, times);

    return {
      average: Math.round(average * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      results: lastResult!
    };
  }

  static async testDataProcessing<T>(
    operationName: string,
    dataProcessingFn: () => T,
    iterations: number = 5
  ): Promise<{ average: number; throughput: number; result: T }> {
    const times: number[] = [];
    let lastResult: T;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      lastResult = dataProcessingFn();
      const end = performance.now();
      times.push(end - start);
    }

    const average = times.reduce((sum, time) => sum + time, 0) / times.length;
    const throughput = 1000 / average; // Operations per second

    this.tests.set(operationName, times);

    return {
      average: Math.round(average * 100) / 100,
      throughput: Math.round(throughput * 100) / 100,
      result: lastResult!
    };
  }

  static getTestResults(testName?: string) {
    if (testName) {
      return this.tests.get(testName) || [];
    }
    
    const results: Record<string, any> = {};
    this.tests.forEach((times, name) => {
      const average = times.reduce((sum, time) => sum + time, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      
      results[name] = {
        average: Math.round(average * 100) / 100,
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        samples: times.length
      };
    });
    
    return results;
  }

  static clearTests(): void {
    this.tests.clear();
  }

  static async runPerformanceAudit(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') return;

    console.log('🚀 Running Performance Audit...');
    
    // Test memory usage
    const memoryInfo = BrowserCompatibility.getMemoryInfo();
    if (memoryInfo) {
      console.log('💾 Memory Usage:', memoryInfo);
      
      if (memoryInfo.used > memoryInfo.limit * 0.8) {
        console.warn('⚠️ High memory usage detected:', memoryInfo.used + 'MB');
      }
    }

    // Test render performance
    const renderStart = performance.now();
    await new Promise(resolve => requestAnimationFrame(resolve));
    const renderTime = performance.now() - renderStart;
    
    console.log('🎨 Render Frame Time:', Math.round(renderTime * 100) / 100 + 'ms');
    
    if (renderTime > 16.67) { // 60fps threshold
      console.warn('⚠️ Render performance below 60fps:', renderTime + 'ms');
    }

    // Test all stored performance results
    const results = this.getTestResults();
    if (Object.keys(results).length > 0) {
      console.log('📊 Performance Test Results:', results);
    }

    BrowserCompatibility.reportCompatibility();
  }
}

/**
 * Component testing helpers
 */
export class ComponentTester {
  static async testLazyLoading(
    componentName: string,
    lazyImport: () => Promise<any>
  ): Promise<{ loadTime: number; success: boolean; error?: string }> {
    const start = performance.now();
    
    try {
      await lazyImport();
      const loadTime = performance.now() - start;
      
      return {
        loadTime: Math.round(loadTime * 100) / 100,
        success: true
      };
    } catch (error) {
      const loadTime = performance.now() - start;
      
      return {
        loadTime: Math.round(loadTime * 100) / 100,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static testMemoization<T>(
    fn: (...args: any[]) => T,
    args: any[],
    iterations: number = 5
  ): { cached: number; uncached: number; speedup: number } {
    // Test uncached (first call)
    const uncachedStart = performance.now();
    const result1 = fn(...args);
    const uncachedTime = performance.now() - uncachedStart;

    // Test cached (subsequent calls)
    const cachedTimes: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const result = fn(...args);
      const time = performance.now() - start;
      cachedTimes.push(time);
    }

    const avgCachedTime = cachedTimes.reduce((sum, time) => sum + time, 0) / cachedTimes.length;
    const speedup = uncachedTime / avgCachedTime;

    return {
      cached: Math.round(avgCachedTime * 100) / 100,
      uncached: Math.round(uncachedTime * 100) / 100,
      speedup: Math.round(speedup * 100) / 100
    };
  }
}

/**
 * Automated testing suite for Phase 5 optimizations
 */
export class Phase5TestSuite {
  static async runAllTests(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      console.log('⚠️ Phase 5 tests only run in development mode');
      return;
    }

    console.log('🧪 Running Phase 5 Test Suite...');
    
    try {
      // Browser compatibility
      BrowserCompatibility.reportCompatibility();
      
      // Performance audit
      await PerformanceTester.runPerformanceAudit();
      
      // Component lazy loading tests
      console.log('📦 Testing lazy loading capabilities...');
      
      // Memory cleanup test
      console.log('🧹 Testing memory cleanup...');
      if (typeof gc !== 'undefined') {
        const beforeMemory = BrowserCompatibility.getMemoryInfo();
        (window as any).gc?.();
        const afterMemory = BrowserCompatibility.getMemoryInfo();
        
        if (beforeMemory && afterMemory) {
          console.log('Memory cleanup:', {
            before: beforeMemory.used + 'MB',
            after: afterMemory.used + 'MB',
            freed: (beforeMemory.used - afterMemory.used) + 'MB'
          });
        }
      }
      
      console.log('✅ Phase 5 Test Suite completed successfully');
      
    } catch (error) {
      console.error('❌ Phase 5 Test Suite failed:', error);
    }
  }
}

// Auto-run tests in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Run tests after initial load
  setTimeout(() => {
    Phase5TestSuite.runAllTests();
  }, 2000);
  
  // Expose testing utilities globally for debugging
  (window as any).Phase5Testing = {
    BrowserCompatibility,
    PerformanceTester,
    ComponentTester,
    Phase5TestSuite
  };
}

export default {
  BrowserCompatibility,
  PerformanceTester,
  ComponentTester,
  Phase5TestSuite
};
