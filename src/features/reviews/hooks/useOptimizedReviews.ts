import React, { useMemo } from 'react';
import { usePerformantQuery, useProgressiveData } from '@/utils/dataLoadingUtils';
import { useDebouncedCallback, useMemoryMonitor } from '@/utils/performanceUtils';
import { 
  fetchReviews, 
  fetchReviewsPaginated,
  getReviewStats,
  searchReviews,
  ReviewQueryOptions 
} from '../services/optimizedReviewDataService';
import { Review } from '@/types/reviews';

/**
 * Optimized hook for fetching reviews with performance monitoring
 */
export const useOptimizedReviews = (options: ReviewQueryOptions = {}) => {
  const queryKey = useMemo(() => [
    'reviews',
    options.businessName || 'all',
    JSON.stringify(options)
  ], [options]);

  return usePerformantQuery(
    queryKey,
    () => fetchReviews(options),
    {
      enabled: !!options.businessName || Object.keys(options).length > 0,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

/**
 * Progressive data loading hook for infinite scrolling
 */
export const useInfiniteReviews = (options: Omit<ReviewQueryOptions, 'limit' | 'offset'> = {}) => {
  return useProgressiveData(
    ['reviews-infinite', options.businessName || 'all', JSON.stringify(options)],
    (page, pageSize) => fetchReviewsPaginated(page, pageSize, options),
    {
      initialPageSize: 50,
      maxPageSize: 200,
      prefetchPages: 2,
    }
  );
};

/**
 * Review search hook with debouncing
 */
export const useReviewSearch = (
  searchTerm: string,
  options: ReviewQueryOptions = {},
  debounceMs: number = 300
) => {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState(searchTerm);
  
  // Debounce search term to avoid excessive API calls
  const debouncedSetSearch = useDebouncedCallback(
    (term: string) => setDebouncedSearchTerm(term),
    debounceMs
  );
  
  React.useEffect(() => {
    debouncedSetSearch(searchTerm);
  }, [searchTerm, debouncedSetSearch]);
  
  const queryKey = useMemo(() => [
    'reviews-search',
    debouncedSearchTerm,
    options.businessName || 'all',
    JSON.stringify(options)
  ], [debouncedSearchTerm, options]);
  
  return usePerformantQuery(
    queryKey,
    () => searchReviews(debouncedSearchTerm, options),
    {
      enabled: debouncedSearchTerm.length >= 2, // Only search with 2+ characters
      staleTime: 2 * 60 * 1000, // 2 minutes for search results
    }
  );
};

/**
 * Review statistics hook with caching
 */
export const useReviewStats = (businessName?: string) => {
  const queryKey = useMemo(() => [
    'review-stats',
    businessName || 'all'
  ], [businessName]);
  
  return usePerformantQuery(
    queryKey,
    () => getReviewStats(businessName),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes - stats change less frequently
    }
  );
};

/**
 * Hook for filtered and analyzed review data
 */
export const useFilteredReviews = (
  reviews: Review[],
  filters: {
    sentiment?: string;
    minStars?: number;
    maxStars?: number;
    dateRange?: { start: Date; end: Date };
    searchTerm?: string;
  } = {}
) => {
  return useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return {
        filteredReviews: [],
        stats: {
          total: 0,
          averageRating: 0,
          sentimentCounts: {},
          ratingCounts: {},
        },
      };
    }
    
    let filtered = reviews;
    
    // Apply sentiment filter
    if (filters.sentiment) {
      filtered = filtered.filter(review => review.sentiment === filters.sentiment);
    }
    
    // Apply star rating filters
    if (filters.minStars !== undefined) {
      filtered = filtered.filter(review => (review.stars || 0) >= filters.minStars!);
    }
    
    if (filters.maxStars !== undefined) {
      filtered = filtered.filter(review => (review.stars || 0) <= filters.maxStars!);
    }
    
    // Apply date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(review => {
        if (!review.publishedAtDate) return false;
        const reviewDate = new Date(review.publishedAtDate);
        return reviewDate >= filters.dateRange!.start && reviewDate <= filters.dateRange!.end;
      });
    }
    
    // Apply search term filter
    if (filters.searchTerm && filters.searchTerm.length >= 2) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(review => 
        (review.text && review.text.toLowerCase().includes(searchLower)) ||
        (review.textTranslated && review.textTranslated.toLowerCase().includes(searchLower)) ||
        (review.name && review.name.toLowerCase().includes(searchLower))
      );
    }
    
    // Calculate statistics
    const total = filtered.length;
    const averageRating = total > 0
      ? filtered.reduce((sum, review) => sum + (review.stars || 0), 0) / total
      : 0;
    
    const sentimentCounts: Record<string, number> = {};
    const ratingCounts: Record<number, number> = {};
    
    filtered.forEach(review => {
      const sentiment = review.sentiment || 'unknown';
      sentimentCounts[sentiment] = (sentimentCounts[sentiment] || 0) + 1;
      
      const rating = review.stars || 0;
      ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
    });
    
    return {
      filteredReviews: filtered,
      stats: {
        total,
        averageRating,
        sentimentCounts,
        ratingCounts,
      },
    };
  }, [reviews, filters]);
};

/**
 * Performance monitoring hook for review components
 */
export const useReviewPerformanceMonitor = () => {
  const memoryUsage = useMemoryMonitor(10000); // Check every 10 seconds
  const [renderCount, setRenderCount] = React.useState(0);
  const [lastRenderTime, setLastRenderTime] = React.useState(Date.now());
  
  React.useEffect(() => {
    setRenderCount(prev => prev + 1);
    setLastRenderTime(Date.now());
  });
  
  const performanceData = useMemo(() => ({
    renderCount,
    lastRenderTime,
    memoryUsage,
    timestamp: Date.now(),
  }), [renderCount, lastRenderTime, memoryUsage]);
  
  // Log performance warnings
  React.useEffect(() => {
    if (memoryUsage && memoryUsage.used > 100) { // >100MB
      console.warn('High memory usage detected:', memoryUsage);
    }
    
    if (renderCount > 100) {
      console.warn('High render count detected:', renderCount);
    }
  }, [memoryUsage, renderCount]);
  
  return performanceData;
};

/**
 * Batch operations hook for handling multiple reviews
 */
export const useBatchReviewOperations = () => {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  
  const processBatch = React.useCallback(async <T>(
    reviews: Review[],
    operation: (review: Review) => Promise<T>,
    batchSize: number = 10
  ): Promise<T[]> => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      const results: T[] = [];
      
      for (let i = 0; i < reviews.length; i += batchSize) {
        const batch = reviews.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(
          batch.map(review => operation(review))
        );
        
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          }
        });
        
        setProgress((i + batchSize) / reviews.length);
        
        // Allow other tasks to run
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
      return results;
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, []);
  
  return {
    processBatch,
    isProcessing,
    progress,
  };
};

/**
 * Smart pagination hook with preloading
 */
export const useSmartPagination = (
  totalItems: number,
  initialPageSize: number = 50
) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(initialPageSize);
  
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  
  const goToPage = React.useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);
  
  const nextPage = React.useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);
  
  const prevPage = React.useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);
  
  const changePageSize = React.useCallback((newSize: number) => {
    const currentStartIndex = (currentPage - 1) * pageSize;
    const newPage = Math.floor(currentStartIndex / newSize) + 1;
    setPageSize(newSize);
    setCurrentPage(newPage);
  }, [currentPage, pageSize]);
  
  return {
    currentPage,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    changePageSize,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};
