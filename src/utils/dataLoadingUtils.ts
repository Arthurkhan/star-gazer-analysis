import { useQuery, useInfiniteQuery, UseQueryOptions, UseInfiniteQueryOptions } from '@tanstack/react-query';
import { measureAsyncPerformance, batchProcess } from '@/utils/performanceUtils';

/**
 * Progressive data loading utilities
 */

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface ProgressiveLoadingOptions {
  initialPageSize: number;
  maxPageSize: number;
  prefetchPages: number;
  staleTime: number;
  cacheTime: number;
}

const defaultProgressiveOptions: ProgressiveLoadingOptions = {
  initialPageSize: 50,
  maxPageSize: 200,
  prefetchPages: 2,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
};

/**
 * Enhanced query with performance monitoring and caching
 */
export const usePerformantQuery = <TData, TError = Error>(
  key: string[],
  queryFn: () => Promise<TData>,
  options: Partial<UseQueryOptions<TData, TError>> = {}
) => {
  return useQuery({
    queryKey: key,
    queryFn: () => measureAsyncPerformance(`Query: ${key.join('.')}`, queryFn),
    staleTime: defaultProgressiveOptions.staleTime,
    cacheTime: defaultProgressiveOptions.cacheTime,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Only retry on network errors, not application errors
      if (error instanceof Error && error.message.includes('NetworkError')) {
        return failureCount < 3;
      }
      return false;
    },
    ...options,
  });
};

/**
 * Progressive data loading with infinite scrolling
 */
export const useProgressiveData = <TData>(
  key: string[],
  fetchPage: (pageParam: number, pageSize: number) => Promise<PaginatedResponse<TData>>,
  options: Partial<ProgressiveLoadingOptions> = {}
) => {
  const config = { ...defaultProgressiveOptions, ...options };
  
  return useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam = 1 }) => 
      measureAsyncPerformance(
        `Progressive Load: ${key.join('.')} - Page ${pageParam}`,
        () => fetchPage(pageParam, config.initialPageSize)
      ),
    getNextPageParam: (lastPage) => 
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    staleTime: config.staleTime,
    cacheTime: config.cacheTime,
    refetchOnWindowFocus: false,
  });
};

/**
 * Batch data loader for processing large datasets
 */
export const useBatchLoader = <TInput, TOutput>(
  processor: (batch: TInput[]) => Promise<TOutput[]>,
  batchSize: number = 100
) => {
  const processBatch = async (
    items: TInput[],
    onProgress?: (processed: number, total: number) => void
  ): Promise<TOutput[]> => {
    return measureAsyncPerformance(
      `Batch Processing: ${items.length} items`,
      () => batchProcess(items, processor, batchSize, onProgress)
    );
  };
  
  return { processBatch };
};

/**
 * Smart caching utilities
 */
export class SmartCache<T> {
  private cache = new Map<string, { data: T; timestamp: number; hits: number }>();
  private maxSize: number;
  private ttl: number;
  
  constructor(maxSize: number = 100, ttl: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }
  
  set(key: string, data: T): void {
    // Remove expired entries
    this.cleanup();
    
    // Remove least recently used items if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0,
    });
  }
  
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Update hit count
    entry.hits++;
    
    return entry.data;
  }
  
  has(key: string): boolean {
    return this.get(key) !== null;
  }
  
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    this.cleanup();
    return this.cache.size;
  }
  
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
  
  private evictLRU(): void {
    let lruKey = '';
    let lruHits = Infinity;
    let oldestTimestamp = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < lruHits || (entry.hits === lruHits && entry.timestamp < oldestTimestamp)) {
        lruKey = key;
        lruHits = entry.hits;
        oldestTimestamp = entry.timestamp;
      }
    }
    
    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }
  
  getStats() {
    this.cleanup();
    const entries = Array.from(this.cache.values());
    
    return {
      size: this.cache.size,
      totalHits: entries.reduce((sum, entry) => sum + entry.hits, 0),
      averageAge: entries.length > 0 
        ? (Date.now() - entries.reduce((sum, entry) => sum + entry.timestamp, 0) / entries.length) / 1000
        : 0,
    };
  }
}

/**
 * Global cache instances
 */
export const reviewsCache = new SmartCache<any>(200, 10 * 60 * 1000); // 10 minutes
export const analyticsCache = new SmartCache<any>(50, 5 * 60 * 1000); // 5 minutes
export const recommendationsCache = new SmartCache<any>(20, 15 * 60 * 1000); // 15 minutes

/**
 * Preloading utilities
 */
export const preloadCriticalData = async () => {
  const criticalQueries = [
    'business-selection',
    'user-preferences',
    'cached-analytics',
  ];
  
  // Preload in parallel for faster initial load
  await Promise.allSettled(
    criticalQueries.map(query => 
      measureAsyncPerformance(`Preload: ${query}`, async () => {
        // Add your preload logic here
        console.log(`Preloading: ${query}`);
      })
    )
  );
};

/**
 * Stale-while-revalidate pattern
 */
export const useStaleWhileRevalidate = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    staleTime?: number;
    revalidateOnFocus?: boolean;
  } = {}
) => {
  const { staleTime = 5 * 60 * 1000, revalidateOnFocus = false } = options;
  
  return useQuery({
    queryKey: [key],
    queryFn: fetcher,
    staleTime,
    cacheTime: staleTime * 2,
    refetchOnWindowFocus: revalidateOnFocus,
    // Return stale data while fetching new data
    keepPreviousData: true,
  });
};

/**
 * Background data sync utility
 */
export const useBackgroundSync = (
  syncFn: () => Promise<void>,
  interval: number = 5 * 60 * 1000 // 5 minutes
) => {
  React.useEffect(() => {
    const sync = async () => {
      try {
        await measureAsyncPerformance('Background Sync', syncFn);
      } catch (error) {
        console.error('Background sync failed:', error);
      }
    };
    
    // Initial sync
    sync();
    
    // Set up interval
    const intervalId = setInterval(sync, interval);
    
    return () => clearInterval(intervalId);
  }, [syncFn, interval]);
};
