import { useMemo } from "react";
import { Review } from "@/types/reviews";
import { calculateBusinessStats } from "@/utils/reviewDataUtils";
import { performanceUtils } from "@/utils/performanceUtils";

interface UseBusinessStatsConfig {
  enablePerformanceMonitoring?: boolean;
}

interface UseBusinessStatsReturn {
  businessStats: Record<string, any>;
  businessData: {
    allBusinesses: { name: string; count: number };
    businesses: Record<string, any>;
  };
}

/**
 * Hook for calculating business statistics
 * Focused responsibility: Business metrics calculation
 */
export function useBusinessStats(
  reviews: Review[], 
  config: UseBusinessStatsConfig = {}
): UseBusinessStatsReturn {
  const { enablePerformanceMonitoring = process.env.NODE_ENV === 'development' } = config;

  /**
   * Memoized business statistics calculation
   */
  const businessStats = useMemo(() => {
    if (reviews.length === 0) return {};
    
    const stopMeasurement = enablePerformanceMonitoring 
      ? performanceUtils.startMeasurement('business-stats')
      : () => 0;
    
    const stats = calculateBusinessStats(reviews, reviews.length);
    
    if (enablePerformanceMonitoring) {
      stopMeasurement();
    }
    
    return stats;
  }, [reviews, enablePerformanceMonitoring]);

  /**
   * Memoized business data structure
   */
  const businessData = useMemo(() => ({
    allBusinesses: { name: "All Businesses", count: reviews.length },
    businesses: businessStats,
  }), [reviews.length, businessStats]);

  return {
    businessStats,
    businessData,
  };
}
