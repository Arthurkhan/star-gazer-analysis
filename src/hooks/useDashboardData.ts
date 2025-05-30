import { useEffect, useState, useCallback, useMemo } from "react";
import { Review, Business } from "@/types/reviews";
import { EnhancedAnalysis } from "@/types/dataAnalysis";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  getChartData, 
  calculateBusinessStats,
  generateEnhancedAnalysis,
} from "@/utils/reviewDataUtils";
import { PerformanceMonitor } from "@/utils/performanceOptimizations";

/**
 * Return type for the useDashboardData hook
 * @interface DashboardDataReturn
 */
interface DashboardDataReturn {
  // Core state
  loading: boolean;
  databaseError: boolean;
  businesses: Business[];
  selectedBusiness: string;
  businessData: {
    allBusinesses: { name: string; count: number };
    businesses: Record<string, any>;
  };
  
  // Data getters
  getFilteredReviews: () => Review[];
  getChartData: typeof getChartData;
  enhancedAnalysis: EnhancedAnalysis | null;
  
  // Actions
  handleBusinessChange: (businessName: string) => void;
  refreshData: (from?: Date, to?: Date) => Promise<void>;
  
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
 * # Dashboard Data Hook
 * 
 * **Phase 5 Optimized Hook** - A comprehensive data management hook for the Star-Gazer Analysis dashboard.
 * This hook provides centralized data fetching, state management, and business logic for the main dashboard.
 * 
 * ## Key Features
 * - ✅ **Eliminates infinite loops** - No circular dependencies between hooks
 * - ✅ **Performance optimized** - Uses memoization and efficient data structures
 * - ✅ **Single data source** - Loads all data once and provides simple filtering
 * - ✅ **Error handling** - Comprehensive error states and user feedback
 * - ✅ **TypeScript support** - Full type safety with detailed interfaces
 * 
 * ## Performance Optimizations
 * - **Memoized computed values** - Prevents unnecessary recalculations
 * - **Efficient pagination** - Fetches all data in chunks to overcome API limits
 * - **Smart filtering** - Client-side filtering for fast business switching
 * - **Performance monitoring** - Tracks execution times in development mode
 * 
 * ## Data Architecture
 * ```
 * useDashboardData
 * ├── Core State (loading, error, businesses, reviews)
 * ├── Computed Values (filteredReviews, businessStats, businessData)
 * ├── Data Fetching (pagination-based loading)
 * └── Actions (business selection, refresh, etc.)
 * ```
 * 
 * ## Usage Examples
 * 
 * ### Basic Usage
 * ```tsx
 * function Dashboard() {
 *   const {
 *     loading,
 *     businesses,
 *     selectedBusiness,
 *     getFilteredReviews,
 *     handleBusinessChange
 *   } = useDashboardData();
 * 
 *   if (loading) return <Loading />;
 * 
 *   return (
 *     <div>
 *       <BusinessSelector 
 *         businesses={businesses}
 *         selected={selectedBusiness}
 *         onChange={handleBusinessChange}
 *       />
 *       <ReviewsDisplay reviews={getFilteredReviews()} />
 *     </div>
 *   );
 * }
 * ```
 * 
 * ### With Enhanced Analysis
 * ```tsx
 * function AnalyticsDashboard() {
 *   const { enhancedAnalysis, selectedBusiness } = useDashboardData();
 * 
 *   return (
 *     <div>
 *       {enhancedAnalysis && selectedBusiness !== 'all' && (
 *         <EnhancedAnalysisDisplay analysis={enhancedAnalysis} />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 * 
 * ## Business Logic
 * - **Business Selection**: Supports 'all' for combined view or specific business names
 * - **Data Filtering**: Automatically filters reviews based on selected business
 * - **Enhanced Analysis**: Generates advanced analytics for individual businesses
 * - **Performance Stats**: Tracks loading times and provides business statistics
 * 
 * ## Error Handling
 * - Database connection errors are handled gracefully
 * - User-friendly error messages with retry options
 * - Fallback states for missing or corrupted data
 * - Comprehensive logging for debugging
 * 
 * @param config - Optional configuration for the hook
 * @returns {DashboardDataReturn} Hook state and actions
 * 
 * @example
 * ```tsx
 * // Basic usage
 * const dashboardData = useDashboardData();
 * 
 * // With configuration
 * const dashboardData = useDashboardData({
 *   pageSize: 2000,
 *   enablePerformanceMonitoring: true
 * });
 * ```
 * 
 * @author Star-Gazer Analysis Team
 * @version 5.0.0 - Phase 5 Performance & Polish
 * @since 1.0.0
 */
export function useDashboardData(config: DashboardDataConfig = {}): DashboardDataReturn {
  const { toast } = useToast();
  
  // Configuration with defaults
  const {
    enablePerformanceMonitoring = process.env.NODE_ENV === 'development',
    pageSize = 1000,
    maxPages = 50,
    autoRefreshInterval = 0
  } = config;
  
  /**
   * Core state management
   * Simplified to essential state variables to prevent infinite loops
   */
  const [loading, setLoading] = useState(true);
  const [databaseError, setDatabaseError] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>("all");
  const [lastFetched, setLastFetched] = useState<number>(0);

  /**
   * Memoized filtered reviews based on business selection
   * Performance: O(n) filtering only when business selection changes
   * 
   * @returns {Review[]} Filtered reviews for the selected business
   */
  const filteredReviews = useMemo(() => {
    const stopMeasurement = enablePerformanceMonitoring 
      ? PerformanceMonitor.startMeasurement('filter-reviews')
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
        console.log(`⚠️ Slow filtering detected: ${duration.toFixed(2)}ms for ${allReviews.length} reviews`);
      }
    }
    
    return result;
  }, [allReviews, selectedBusiness, enablePerformanceMonitoring]);

  /**
   * Memoized business statistics calculation
   * Performance: Only recalculates when reviews change
   * 
   * @returns {Record<string, any>} Business statistics object
   */
  const businessStats = useMemo(() => {
    if (allReviews.length === 0) return {};
    
    const stopMeasurement = enablePerformanceMonitoring 
      ? PerformanceMonitor.startMeasurement('business-stats')
      : () => 0;
    
    const stats = calculateBusinessStats(allReviews, allReviews.length);
    
    if (enablePerformanceMonitoring) {
      stopMeasurement();
    }
    
    return stats;
  }, [allReviews, enablePerformanceMonitoring]);

  /**
   * Memoized business data structure
   * Combines all businesses view with individual business stats
   * 
   * @returns {Object} Complete business data structure
   */
  const businessData = useMemo(() => ({
    allBusinesses: { name: "All Businesses", count: allReviews.length },
    businesses: businessStats,
  }), [allReviews.length, businessStats]);

  /**
   * Memoized enhanced analysis for individual businesses
   * Only generates analysis for specific business selections
   * 
   * @returns {EnhancedAnalysis | null} Enhanced analysis or null for 'all' view
   */
  const enhancedAnalysis = useMemo(() => {
    if (selectedBusiness === "all" || selectedBusiness === "All Businesses" || filteredReviews.length === 0) {
      return null;
    }
    
    const stopMeasurement = enablePerformanceMonitoring 
      ? PerformanceMonitor.startMeasurement('enhanced-analysis')
      : () => 0;
    
    try {
      const analysis = generateEnhancedAnalysis(filteredReviews, selectedBusiness);
      
      if (enablePerformanceMonitoring) {
        stopMeasurement();
      }
      
      return analysis;
    } catch (error) {
      console.error("❌ Error generating enhanced analysis:", error);
      
      if (enablePerformanceMonitoring) {
        stopMeasurement();
      }
      
      return null;
    }
  }, [filteredReviews, selectedBusiness, enablePerformanceMonitoring]);

  /**
   * Fetch all reviews using pagination to overcome Supabase row limits
   * Now supports optional date range filtering
   * 
   * This function implements efficient pagination to load all reviews from the database.
   * It fetches data in configurable chunks and processes them for optimal performance.
   * 
   * @private
   * @param {Date} [from] - Optional start date for filtering
   * @param {Date} [to] - Optional end date for filtering
   * @returns {Promise<Review[]>} Array of all reviews from the database
   * @throws {Error} Database or network errors
   */
  const fetchAllReviewsWithPagination = async (from?: Date, to?: Date): Promise<Review[]> => {
    const stopMeasurement = enablePerformanceMonitoring 
      ? PerformanceMonitor.startMeasurement('fetch-all-reviews')
      : () => 0;
    
    console.log("🔍 Starting to fetch reviews using pagination...", { from, to });
    
    let allReviews: Review[] = [];
    let currentPage = 0;
    let hasMore = true;
    
    // Get total count for progress tracking
    let countQuery = supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true });
    
    if (from) {
      countQuery = countQuery.gte('publishedatdate', from.toISOString());
    }
    if (to) {
      countQuery = countQuery.lte('publishedatdate', to.toISOString());
    }
    
    const { count, error: countError } = await countQuery;
    
    if (countError) {
      console.error("❌ Error getting review count:", countError);
    } else {
      console.log(`📊 Total reviews in date range: ${count}`);
    }
    
    while (hasMore && currentPage < maxPages) {
      const startRow = currentPage * pageSize;
      const endRow = startRow + pageSize - 1;
      
      console.log(`📄 Fetching page ${currentPage + 1} (rows ${startRow + 1}-${endRow + 1})...`);
      
      let pageQuery = supabase
        .from('reviews')
        .select(`
          *,
          businesses:business_id (
            id,
            name,
            business_type
          )
        `)
        .order('publishedatdate', { ascending: false })
        .range(startRow, endRow);
      
      // Apply date filtering if provided - FIXED: Now properly capturing the returned query
      if (from) {
        pageQuery = pageQuery.gte('publishedatdate', from.toISOString());
      }
      if (to) {
        pageQuery = pageQuery.lte('publishedatdate', to.toISOString());
      }
      
      const { data: pageData, error } = await pageQuery;
      
      if (error) {
        console.error(`❌ Error fetching page ${currentPage + 1}:`, error);
        throw error;
      }
      
      if (!pageData || pageData.length === 0) {
        console.log(`✅ No more data on page ${currentPage + 1}, stopping...`);
        hasMore = false;
        break;
      }
      
      console.log(`✅ Page ${currentPage + 1}: Got ${pageData.length} reviews`);
      
      // Process and normalize review data
      const processedPageData = pageData.map(review => {
        const business = review.businesses as any;
        return {
          ...review,
          title: business?.name || 'Unknown Business',
          publishedAtDate: review.publishedAtDate || review.publishedatdate,
          businessName: business?.name,
        };
      });
      
      allReviews.push(...processedPageData);
      
      // Check if we've reached the end
      if (pageData.length < pageSize) {
        console.log(`🏁 Got ${pageData.length} < ${pageSize} reviews, reached end of data`);
        hasMore = false;
      } else {
        currentPage++;
      }
    }
    
    if (currentPage >= maxPages) {
      console.warn(`⚠️ Safety limit reached (${maxPages} pages), stopping fetch`);
    }
    
    console.log(`🎉 Finished fetching! Total reviews collected: ${allReviews.length}`);
    
    if (enablePerformanceMonitoring) {
      const duration = stopMeasurement();
      console.log(`📊 Total fetch time: ${duration.toFixed(2)}ms`);
    }
    
    return allReviews;
  };

  /**
   * Load all application data (businesses and reviews)
   * Now supports optional date range filtering
   * 
   * This is the main data loading function that fetches all necessary data
   * for the dashboard. It handles errors gracefully and provides user feedback.
   * 
   * @async
   * @function loadAllData
   * @param {Date} [from] - Optional start date for filtering
   * @param {Date} [to] - Optional end date for filtering
   * @returns {Promise<void>}
   */
  const loadAllData = useCallback(async (from?: Date, to?: Date) => {
    setLoading(true);
    setDatabaseError(false);
    
    const stopMeasurement = enablePerformanceMonitoring 
      ? PerformanceMonitor.startMeasurement('load-all-data')
      : () => 0;
    
    try {
      console.log("🚀 Loading application data...", { from, to });
      
      // Load businesses first (only on initial load or when not provided dates)
      if (businesses.length === 0 && !from && !to) {
        const { data: businessesData, error: businessesError } = await supabase
          .from('businesses')
          .select('*')
          .order('name');
        
        if (businessesError) {
          console.error("❌ Error fetching businesses:", businessesError);
          setDatabaseError(true);
          toast({
            title: "Database Error",
            description: "Failed to load businesses. Please check your connection.",
            variant: "destructive",
          });
          return;
        }
        
        if (!businessesData || businessesData.length === 0) {
          console.error("❌ No businesses found");
          setDatabaseError(true);
          toast({
            title: "No Data Found",
            description: "No businesses found in the database.",
            variant: "destructive",
          });
          return;
        }
        
        setBusinesses(businessesData);
        console.log(`✅ Loaded ${businessesData.length} businesses`);
      }
      
      // Load all reviews using pagination with optional date filtering
      const allReviewsData = await fetchAllReviewsWithPagination(from, to);
      
      setAllReviews(allReviewsData);
      setLastFetched(Date.now());
      
      // Generate verification statistics
      const businessCounts = allReviewsData.reduce((acc, review) => {
        const businessName = review.businessName || review.title || 'Unknown';
        acc[businessName] = (acc[businessName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log("📊 Final review counts per business:", businessCounts);
      console.log(`🎯 Total reviews loaded: ${allReviewsData.length}`);
      
      const dateRangeText = from && to 
        ? ` from ${from.toLocaleDateString()} to ${to.toLocaleDateString()}`
        : '';
      
      toast({
        title: "Data loaded successfully",
        description: `Loaded ${allReviewsData.length} reviews${dateRangeText}`,
      });
      
      if (enablePerformanceMonitoring) {
        const duration = stopMeasurement();
        console.log(`🚀 Total load time: ${duration.toFixed(2)}ms`);
      }
      
    } catch (error) {
      console.error("💥 Error loading data:", error);
      setDatabaseError(true);
      toast({
        title: "Loading Error",
        description: "An unexpected error occurred while loading data.",
        variant: "destructive",
      });
      
      if (enablePerformanceMonitoring) {
        stopMeasurement();
      }
    } finally {
      setLoading(false);
    }
  }, [businesses.length, toast, enablePerformanceMonitoring, pageSize, maxPages]);

  /**
   * Handle business selection change
   * 
   * Updates the selected business and triggers UI updates.
   * This is optimized to only update state when necessary.
   * 
   * @param {string} businessName - Name of the selected business or 'all'
   */
  const handleBusinessChange = useCallback((businessName: string) => {
    console.log(`🔄 Business selection changed to: ${businessName}`);
    setSelectedBusiness(businessName);
  }, []);

  /**
   * Refresh all data from the database
   * Now supports optional date range filtering
   * 
   * Reloads all businesses and reviews, useful for getting latest data
   * without requiring a full page refresh.
   * 
   * @async
   * @function refreshData
   * @param {Date} [from] - Optional start date for filtering
   * @param {Date} [to] - Optional end date for filtering
   * @returns {Promise<void>}
   */
  const refreshData = useCallback(async (from?: Date, to?: Date) => {
    console.log("🔄 Refreshing data...", { from, to });
    await loadAllData(from, to);
  }, [loadAllData]);

  /**
   * Get filtered reviews for the current business selection
   * 
   * @returns {Review[]} Array of filtered reviews
   */
  const getFilteredReviews = useCallback(() => filteredReviews, [filteredReviews]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefreshInterval > 0) {
      const interval = setInterval(() => refreshData(), autoRefreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshData, autoRefreshInterval]);

  // Initial data load on mount
  useEffect(() => {
    loadAllData();
  }, []); // Intentionally no dependencies to prevent re-runs

  return {
    // Core state
    loading,
    databaseError,
    businesses,
    selectedBusiness,
    businessData,
    
    // Data getters
    getFilteredReviews,
    getChartData,
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
    pageSize: allReviews.length,
    loadMoreData: () => {}, // No-op since we load all data at once
  };
}
