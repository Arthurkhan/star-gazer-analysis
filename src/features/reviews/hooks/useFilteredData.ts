import { useMemo, useCallback } from "react";
import { Review } from "@/types/reviews";
import { EnhancedAnalysis } from "@/types/dataAnalysis";
import { generateEnhancedAnalysis } from "@/utils/reviewDataUtils";
import { performanceUtils } from "@/utils/performanceUtils";
import { logger } from "@/utils/logger";

interface UseFilteredDataConfig {
  enablePerformanceMonitoring?: boolean;
}

interface UseFilteredDataReturn {
  filteredReviews: Review[];
  enhancedAnalysis: EnhancedAnalysis | null;
  getFilteredReviews: () => Review[];
  totalCount: number;
}

/**
 * Hook for filtering and analyzing review data
 * Focused responsibility: Data filtering and analysis
 */
export function useFilteredData(
  allReviews: Review[],
  selectedBusiness: string,
  config: UseFilteredDataConfig = {}
): UseFilteredDataReturn {
  const { enablePerformanceMonitoring = process.env.NODE_ENV === 'development' } = config;

  /**
   * Memoized filtered reviews based on business selection
   */
  const filteredReviews = useMemo(() => {
    const stopMeasurement = enablePerformanceMonitoring 
      ? performanceUtils.startMeasurement('filter-reviews')
      : () => 0;
    
    let result: Review[];
    
    if (selectedBusiness === "all" || selectedBusiness === "All Businesses") {
      result = allReviews;
    } else {
      result = allReviews.filter(review => 
        review.title === selectedBusiness || 
        review.businesses?.name === selectedBusiness
      );
    }
    
    if (enablePerformanceMonitoring) {
      const duration = stopMeasurement();
      if (duration > 10) { // Log if filtering takes more than 10ms
        logger.warn('filtering', `Slow filtering detected: ${duration.toFixed(2)}ms for ${allReviews.length} reviews`);
      }
    }
    
    return result;
  }, [allReviews, selectedBusiness, enablePerformanceMonitoring]);

  /**
   * Memoized enhanced analysis for individual businesses
   */
  const enhancedAnalysis = useMemo(() => {
    if (selectedBusiness === "all" || selectedBusiness === "All Businesses" || filteredReviews.length === 0) {
      return null;
    }
    
    const stopMeasurement = enablePerformanceMonitoring 
      ? performanceUtils.startMeasurement('enhanced-analysis')
      : () => 0;
    
    try {
      const analysis = generateEnhancedAnalysis(filteredReviews, selectedBusiness);
      
      if (enablePerformanceMonitoring) {
        stopMeasurement();
      }
      
      return analysis;
    } catch (error) {
      logger.error('analysis', 'Error generating enhanced analysis:', error);
      
      if (enablePerformanceMonitoring) {
        stopMeasurement();
      }
      
      return null;
    }
  }, [filteredReviews, selectedBusiness, enablePerformanceMonitoring]);

  /**
   * Get filtered reviews callback
   */
  const getFilteredReviews = useCallback(() => filteredReviews, [filteredReviews]);

  return {
    filteredReviews,
    enhancedAnalysis,
    getFilteredReviews,
    totalCount: filteredReviews.length,
  };
}
