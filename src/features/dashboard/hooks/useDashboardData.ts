import { useMemo } from "react";
import { getChartData } from "@/utils/reviewDataUtils";
import { useReviews } from "@/features/reviews/hooks/useReviews";
import { useBusinessStats } from "@/features/analytics/hooks/useBusinessStats";
import { useFilteredData } from "@/features/reviews/hooks/useFilteredData";
import { useBusinessSelection } from "./useBusinessSelection";

/**
 * Configuration options for the dashboard data hook
 */
interface DashboardDataConfig {
  /** Enable performance monitoring (default: true in development) */
  enablePerformanceMonitoring?: boolean;
  /** Page size for data fetching (default: 1000) */
  pageSize?: number;
  /** Maximum pages to fetch (safety limit, default: 50) */
  maxPages?: number;
  /** Auto-refresh interval in milliseconds (0 = disabled) */
  autoRefreshInterval?: number;
}

/**
 * Return type for the simplified useDashboardData hook
 */
interface DashboardDataReturn {
  // Core state
  loading: boolean;
  databaseError: boolean;
  businesses: any[];
  selectedBusiness: string;
  businessData: {
    allBusinesses: { name: string; count: number };
    businesses: Record<string, any>;
  };
  
  // Data getters
  getFilteredReviews: () => any[];
  getChartData: typeof getChartData;
  enhancedAnalysis: any;
  
  // Actions
  handleBusinessChange: (businessName: string) => void;
  refreshData: () => Promise<void>;
  
  // Stats
  totalReviewCount: number;
  lastFetched: number;
  
  // Backward compatibility
  loadingMore: boolean;
  hasMoreData: boolean;
  allPagesLoaded: boolean;
  autoLoadingComplete: boolean;
  currentPage: number;
  pageSize: number;
  loadMoreData: () => void;
}

/**
 * # Simplified Dashboard Data Hook
 * 
 * **Phase 2 Refactored Hook** - Now composed of smaller, focused hooks for better maintainability.
 * This hook orchestrates multiple specialized hooks to provide a unified dashboard interface.
 * 
 * ## Architecture
 * ```
 * useDashboardData (orchestrator)
 * ├── useReviews (data fetching)
 * ├── useBusinessStats (statistics calculation)
 * ├── useFilteredData (filtering & analysis)
 * └── useBusinessSelection (selection state)
 * ```
 * 
 * ## Benefits of Refactored Architecture
 * - ✅ **Single Responsibility** - Each hook has one clear purpose
 * - ✅ **Reduced Complexity** - Smaller, focused hooks are easier to understand
 * - ✅ **Better Testability** - Each hook can be tested independently
 * - ✅ **Improved Reusability** - Individual hooks can be used elsewhere
 * - ✅ **No Circular Dependencies** - Clear data flow between hooks
 * 
 * @param config - Optional configuration for the hook
 * @returns {DashboardDataReturn} Hook state and actions
 */
export function useDashboardData(config: DashboardDataConfig = {}): DashboardDataReturn {
  // Use focused hooks for specific responsibilities
  const { reviews, businesses, loading, error, lastFetched, refreshData, totalCount } = useReviews(config);
  const { selectedBusiness, handleBusinessChange } = useBusinessSelection();
  const { businessStats, businessData } = useBusinessStats(reviews, config);
  const { filteredReviews, enhancedAnalysis, getFilteredReviews } = useFilteredData(reviews, selectedBusiness, config);

  // Memoized chart data to prevent unnecessary recalculations
  const memoizedGetChartData = useMemo(() => getChartData, []);

  return {
    // Core state
    loading,
    databaseError: error,
    businesses,
    selectedBusiness,
    businessData,
    
    // Data getters
    getFilteredReviews,
    getChartData: memoizedGetChartData,
    enhancedAnalysis,
    
    // Actions
    handleBusinessChange,
    refreshData,
    
    // Statistics
    totalReviewCount: filteredReviews.length,
    lastFetched,
    
    // Backward compatibility props
    loadingMore: false,
    hasMoreData: false,
    allPagesLoaded: true,
    autoLoadingComplete: true,
    currentPage: 0,
    pageSize: totalCount,
    loadMoreData: () => {}, // No-op since we load all data at once
  };
}
