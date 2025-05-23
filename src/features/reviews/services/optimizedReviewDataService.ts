import { supabase } from '@/integrations/supabase/client';
import { Review } from '@/types/reviews';
import { measureAsyncPerformance } from '@/utils/performanceUtils';
import { reviewsCache, PaginatedResponse } from '@/utils/dataLoadingUtils';

/**
 * Optimized review data service with caching and performance monitoring
 */

export interface ReviewQueryOptions {
  businessName?: string;
  startDate?: Date;
  endDate?: Date;
  sentiment?: string;
  minStars?: number;
  maxStars?: number;
  limit?: number;
  offset?: number;
}

export interface ReviewsServiceResponse {
  reviews: Review[];
  total: number;
  cached: boolean;
}

// Generate cache key from query options
const generateCacheKey = (options: ReviewQueryOptions): string => {
  const key = [
    'reviews',
    options.businessName || 'all',
    options.startDate?.toISOString() || '',
    options.endDate?.toISOString() || '',
    options.sentiment || '',
    options.minStars || '',
    options.maxStars || '',
    options.limit || '',
    options.offset || '',
  ].join('|');
  
  return key;
};

/**
 * Fetch reviews with optimized caching and batching
 */
export const fetchReviews = async (options: ReviewQueryOptions = {}): Promise<ReviewsServiceResponse> => {
  const cacheKey = generateCacheKey(options);
  
  // Check cache first
  const cached = reviewsCache.get(cacheKey);
  if (cached) {
    return { ...cached, cached: true };
  }
  
  return measureAsyncPerformance('Fetch Reviews', async () => {
    let query = supabase.from(options.businessName || 'reviews').select('*', { count: 'exact' });
    
    // Apply filters
    if (options.startDate) {
      query = query.gte('publishedAtDate', options.startDate.toISOString());
    }
    
    if (options.endDate) {
      query = query.lte('publishedAtDate', options.endDate.toISOString());
    }
    
    if (options.sentiment) {
      query = query.eq('sentiment', options.sentiment);
    }
    
    if (options.minStars) {
      query = query.gte('stars', options.minStars);
    }
    
    if (options.maxStars) {
      query = query.lte('stars', options.maxStars);
    }
    
    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.offset) {
      query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1);
    }
    
    // Order by most recent first
    query = query.order('publishedAtDate', { ascending: false });
    
    const { data, error, count } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch reviews: ${error.message}`);
    }
    
    const result = {
      reviews: data || [],
      total: count || 0,
      cached: false,
    };
    
    // Cache the result
    reviewsCache.set(cacheKey, result);
    
    return result;
  });
};

/**
 * Fetch reviews with pagination for infinite scrolling
 */
export const fetchReviewsPaginated = async (
  page: number,
  pageSize: number,
  options: Omit<ReviewQueryOptions, 'limit' | 'offset'> = {}
): Promise<PaginatedResponse<Review>> => {
  const offset = (page - 1) * pageSize;
  
  const result = await fetchReviews({
    ...options,
    limit: pageSize,
    offset,
  });
  
  return {
    data: result.reviews,
    pagination: {
      page,
      limit: pageSize,
      total: result.total,
      hasMore: offset + pageSize < result.total,
    },
  };
};

/**
 * Batch fetch reviews for multiple businesses
 */
export const fetchMultipleBusinessReviews = async (
  businessNames: string[],
  options: Omit<ReviewQueryOptions, 'businessName'> = {}
): Promise<Record<string, ReviewsServiceResponse>> => {
  return measureAsyncPerformance('Batch Fetch Multiple Businesses', async () => {
    const results = await Promise.allSettled(
      businessNames.map(async (businessName) => {
        const response = await fetchReviews({ ...options, businessName });
        return { businessName, response };
      })
    );
    
    const businessReviews: Record<string, ReviewsServiceResponse> = {};
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        businessReviews[result.value.businessName] = result.value.response;
      } else {
        console.error(`Failed to fetch reviews for ${businessNames[index]}:`, result.reason);
        businessReviews[businessNames[index]] = {
          reviews: [],
          total: 0,
          cached: false,
        };
      }
    });
    
    return businessReviews;
  });
};

/**
 * Search reviews with full-text search optimization
 */
export const searchReviews = async (
  searchTerm: string,
  options: ReviewQueryOptions = {}
): Promise<ReviewsServiceResponse> => {
  const cacheKey = `search|${searchTerm}|${generateCacheKey(options)}`;
  
  // Check cache first
  const cached = reviewsCache.get(cacheKey);
  if (cached) {
    return { ...cached, cached: true };
  }
  
  return measureAsyncPerformance('Search Reviews', async () => {
    let query = supabase
      .from(options.businessName || 'reviews')
      .select('*', { count: 'exact' })
      .or(`text.ilike.%${searchTerm}%,textTranslated.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`);
    
    // Apply other filters
    if (options.startDate) {
      query = query.gte('publishedAtDate', options.startDate.toISOString());
    }
    
    if (options.endDate) {
      query = query.lte('publishedAtDate', options.endDate.toISOString());
    }
    
    if (options.sentiment) {
      query = query.eq('sentiment', options.sentiment);
    }
    
    if (options.minStars) {
      query = query.gte('stars', options.minStars);
    }
    
    if (options.maxStars) {
      query = query.lte('stars', options.maxStars);
    }
    
    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.offset) {
      query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1);
    }
    
    // Order by relevance (most recent first)
    query = query.order('publishedAtDate', { ascending: false });
    
    const { data, error, count } = await query;
    
    if (error) {
      throw new Error(`Failed to search reviews: ${error.message}`);
    }
    
    const result = {
      reviews: data || [],
      total: count || 0,
      cached: false,
    };
    
    // Cache the result for shorter time since search results change more frequently
    reviewsCache.set(cacheKey, result);
    
    return result;
  });
};

/**
 * Get review statistics with caching
 */
export const getReviewStats = async (
  businessName?: string
): Promise<{
  total: number;
  averageRating: number;
  sentimentDistribution: Record<string, number>;
  ratingDistribution: Record<number, number>;
  cached: boolean;
}> => {
  const cacheKey = `stats|${businessName || 'all'}`;
  
  // Check cache first
  const cached = reviewsCache.get(cacheKey);
  if (cached) {
    return { ...cached, cached: true };
  }
  
  return measureAsyncPerformance('Get Review Stats', async () => {
    const reviews = await fetchReviews({ businessName });
    
    const total = reviews.total;
    const averageRating = reviews.reviews.length > 0
      ? reviews.reviews.reduce((sum, review) => sum + (review.stars || 0), 0) / reviews.reviews.length
      : 0;
    
    const sentimentDistribution: Record<string, number> = {};
    const ratingDistribution: Record<number, number> = {};
    
    reviews.reviews.forEach(review => {
      // Count sentiment distribution
      const sentiment = review.sentiment || 'unknown';
      sentimentDistribution[sentiment] = (sentimentDistribution[sentiment] || 0) + 1;
      
      // Count rating distribution
      const rating = review.stars || 0;
      ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
    });
    
    const result = {
      total,
      averageRating,
      sentimentDistribution,
      ratingDistribution,
      cached: false,
    };
    
    // Cache stats for longer time
    reviewsCache.set(cacheKey, result);
    
    return result;
  });
};

/**
 * Preload critical review data
 */
export const preloadReviewData = async (businessNames: string[]): Promise<void> => {
  return measureAsyncPerformance('Preload Review Data', async () => {
    // Preload basic reviews for each business
    await Promise.allSettled(
      businessNames.map(businessName =>
        fetchReviews({ businessName, limit: 50 })
      )
    );
    
    // Preload stats for each business
    await Promise.allSettled(
      businessNames.map(businessName =>
        getReviewStats(businessName)
      )
    );
  });
};

/**
 * Invalidate cached data
 */
export const invalidateReviewCache = (businessName?: string): void => {
  if (businessName) {
    // Remove all cache entries for specific business
    const keys = Array.from((reviewsCache as any).cache.keys());
    keys.forEach(key => {
      if (key.includes(businessName)) {
        reviewsCache.delete(key);
      }
    });
  } else {
    // Clear entire cache
    reviewsCache.clear();
  }
};

/**
 * Get cache statistics
 */
export const getReviewCacheStats = () => {
  return reviewsCache.getStats();
};
