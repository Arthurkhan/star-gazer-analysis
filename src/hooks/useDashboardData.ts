import { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
import { 
  checkTableExists, 
  fetchLegacyReviewsWithDateFilter, 
  fetchAllLegacyReviewsWithDateFilter 
} from "@/services/legacyReviewService";

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
  
  // NEW: Expose temp filter state for period comparison
  hasTemporaryFilter: boolean;
  clearTemporaryFilter: () => void;
  
  // NEW: Expose allReviews for comparison
  getAllReviews: () => Review[];
  
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
 * - ✅ **Supports both legacy and normalized tables** - Automatically detects and uses appropriate data source
 * - ✅ **Proper date filtering** - Maintains full dataset while supporting temporary date filtering
 * - ✅ **Performance optimized** - Uses memoization and efficient data structures
 * - ✅ **Single data source** - Loads all data once and provides simple filtering
 * - ✅ **Error handling** - Comprehensive error states and user feedback
 * - ✅ **TypeScript support** - Full type safety with detailed interfaces
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
  const [isUsingLegacyTables, setIsUsingLegacyTables] = useState<boolean>(false);
  
  // NEW: Temporary filtered reviews for date range queries
  const [tempFilteredReviews, setTempFilteredReviews] = useState<Review[] | null>(null);
  const [currentDateFilter, setCurrentDateFilter] = useState<{ from?: Date; to?: Date } | null>(null);

  /**
   * Memoized filtered reviews based on business selection
   * Now also considers temporary date-filtered reviews
   * 
   * @returns {Review[]} Filtered reviews for the selected business
   */
  const filteredReviews = useMemo(() => {
    const stopMeasurement = enablePerformanceMonitoring 
      ? PerformanceMonitor.startMeasurement('filter-reviews')
      : () => 0;
    
    // Use temporary filtered reviews if available (date filtering active)
    const reviewsToFilter = tempFilteredReviews !== null ? tempFilteredReviews : allReviews;
    const hasTempFilter = tempFilteredReviews !== null;
    
    console.log(`🔍 Filtering reviews:`, {
      source: hasTempFilter ? 'tempFilteredReviews' : 'allReviews',
      totalCount: reviewsToFilter.length,
      selectedBusiness,
      hasDateFilter: currentDateFilter !== null,
      hasTempFilter
    });
    
    let result: Review[];
    
    if (selectedBusiness === "all" || selectedBusiness === "All Businesses") {
      result = reviewsToFilter;
    } else {
      // FIX: Ensure proper filtering for all businesses including "The Little Prince Cafe"
      result = reviewsToFilter.filter(review => {
        // For legacy data, check the title field (which is set to the table name)
        if (review.title && review.title === selectedBusiness) {
          return true;
        }
        
        // For normalized data, check the businesses property
        if (review.businesses?.name === selectedBusiness) {
          return true;
        }
        
        // Additional check for businessName field (legacy compatibility)
        if (review.businessName === selectedBusiness) {
          return true;
        }
        
        return false;
      });
      
      // Debug logging for "The Little Prince Cafe"
      if (selectedBusiness === "The Little Prince Cafe") {
        console.log(`🔍 Debug - Filtering for "The Little Prince Cafe":`, {
          totalReviews: reviewsToFilter.length,
          filteredCount: result.length,
          sampleReview: reviewsToFilter[0] ? {
            title: reviewsToFilter[0].title,
            businessName: reviewsToFilter[0].businessName,
            businesses: reviewsToFilter[0].businesses
          } : null
        });
      }
    }
    
    if (enablePerformanceMonitoring) {
      const duration = stopMeasurement();
      if (duration > 10) { // Log if filtering takes more than 10ms
        console.log(`⚠️ Slow filtering detected: ${duration.toFixed(2)}ms for ${reviewsToFilter.length} reviews`);
      }
    }
    
    console.log(`✅ Filtered result: ${result.length} reviews for "${selectedBusiness}" (hasTempFilter: ${hasTempFilter})`);
    return result;
  }, [allReviews, selectedBusiness, tempFilteredReviews, currentDateFilter, enablePerformanceMonitoring]);

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
   * Check if the database is using legacy or normalized tables
   */
  const checkDatabaseStructure = async (): Promise<'legacy' | 'normalized'> => {
    // Check if normalized tables exist
    const { error: reviewsError } = await supabase
      .from('reviews')
      .select('id')
      .limit(1);
    
    const { error: businessesError } = await supabase
      .from('businesses')
      .select('id')
      .limit(1);
    
    if (!reviewsError && !businessesError) {
      console.log("✅ Using normalized database structure");
      return 'normalized';
    }
    
    // Check if legacy tables exist
    const legacyExists = await checkTableExists("The Little Prince Cafe");
    if (legacyExists) {
      console.log("⚠️ Using legacy database structure");
      return 'legacy';
    }
    
    throw new Error("No valid database structure found");
  };

  /**
   * Fetch all reviews using pagination to overcome Supabase row limits
   * Now supports optional date range filtering
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
      
      // Apply date filtering if provided
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
   * Now supports optional date range filtering without replacing the main dataset
   * 
   * @async
   * @function loadAllData
   * @param {Date} [from] - Optional start date for filtering
   * @param {Date} [to] - Optional end date for filtering
   * @param {boolean} [isInitialLoad] - Whether this is the initial load
   * @returns {Promise<void>}
   */
  const loadAllData = useCallback(async (from?: Date, to?: Date, isInitialLoad: boolean = false) => {
    setLoading(true);
    setDatabaseError(false);
    
    const stopMeasurement = enablePerformanceMonitoring 
      ? PerformanceMonitor.startMeasurement('load-all-data')
      : () => 0;
    
    try {
      console.log("🚀 Loading application data...", { from, to, isInitialLoad, selectedBusiness });
      
      // Check database structure first
      const dbStructure = await checkDatabaseStructure();
      setIsUsingLegacyTables(dbStructure === 'legacy');
      
      if (dbStructure === 'legacy') {
        console.log("📚 Using legacy table structure");
        
        // For legacy structure, businesses are derived from table names
        const knownBusinesses = [
          { id: '1', name: 'The Little Prince Cafe', business_type: 'cafe' },
          { id: '2', name: 'Vol de Nuit, The Hidden Bar', business_type: 'bar' },
          { id: '3', name: "L'Envol Art Space", business_type: 'gallery' }
        ];
        
        setBusinesses(knownBusinesses);
        
        // Fetch reviews from legacy tables with date filtering
        let reviewsData: Review[];
        
        if ((from || to) && !isInitialLoad) {
          // Date filtering requested - fetch filtered data without replacing main dataset
          console.log(`📅 Fetching date-filtered reviews for: ${selectedBusiness}`);
          
          // IMPORTANT: Always fetch from the specific business table when filtering by date
          if (selectedBusiness === "all" || selectedBusiness === "All Businesses") {
            reviewsData = await fetchAllLegacyReviewsWithDateFilter(from, to);
          } else {
            // Fetch from the specific business table
            reviewsData = await fetchLegacyReviewsWithDateFilter(selectedBusiness, from, to);
          }
          
          // Set as temporary filtered data
          setTempFilteredReviews(reviewsData);
          setCurrentDateFilter({ from, to });
          
          console.log(`📊 Date-filtered reviews loaded: ${reviewsData.length} for ${selectedBusiness}`);
        } else {
          // Initial load or no date filter - load all data
          console.log(`📊 Loading all reviews (no date filter)`);
          reviewsData = await fetchAllLegacyReviewsWithDateFilter();
          setAllReviews(reviewsData);
          setTempFilteredReviews(null);
          setCurrentDateFilter(null);
          
          console.log(`📊 All reviews loaded: ${reviewsData.length}`);
          
          // Debug log for The Little Prince Cafe
          const littlePrinceReviews = reviewsData.filter(r => 
            r.title === "The Little Prince Cafe" || 
            r.businessName === "The Little Prince Cafe"
          );
          console.log(`🔍 The Little Prince Cafe reviews: ${littlePrinceReviews.length}`);
        }
        
      } else {
        // Use normalized structure
        console.log("📚 Using normalized table structure");
        
        // Load businesses first (only on initial load)
        if (businesses.length === 0) {
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
        
        // Load reviews with optional date filtering
        if ((from || to) && !isInitialLoad) {
          // Date filtering requested - fetch filtered data without replacing main dataset
          const reviewsData = await fetchAllReviewsWithPagination(from, to);
          setTempFilteredReviews(reviewsData);
          setCurrentDateFilter({ from, to });
          
          console.log(`📊 Date-filtered reviews loaded: ${reviewsData.length}`);
        } else {
          // Initial load or no date filter - load all data
          const reviewsData = await fetchAllReviewsWithPagination();
          setAllReviews(reviewsData);
          setTempFilteredReviews(null);
          setCurrentDateFilter(null);
          
          console.log(`📊 All reviews loaded: ${reviewsData.length}`);
        }
      }
      
      setLastFetched(Date.now());
      
      const dateRangeText = from && to 
        ? ` from ${from.toLocaleDateString()} to ${to.toLocaleDateString()}`
        : '';
      
      const reviewCount = tempFilteredReviews ? tempFilteredReviews.length : allReviews.length;
      
      if (!isInitialLoad) {
        toast({
          title: "Data loaded successfully",
          description: `Loaded ${reviewCount} reviews${dateRangeText}`,
        });
      }
      
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
  }, [businesses.length, selectedBusiness, allReviews.length, tempFilteredReviews, toast, enablePerformanceMonitoring, pageSize, maxPages]);

  /**
   * Handle business selection change
   * 
   * @param {string} businessName - Name of the selected business or 'all'
   */
  const handleBusinessChange = useCallback((businessName: string) => {
    console.log(`🔄 Business selection changed to: ${businessName}`);
    setSelectedBusiness(businessName);
    
    // Don't clear temporary date filter on business change - let the consumer decide
    // This allows period comparison to work properly
  }, []);

  /**
   * Clear temporary filter - useful for period comparison
   */
  const clearTemporaryFilter = useCallback(() => {
    console.log("🧹 Clearing temporary filter");
    setTempFilteredReviews(null);
    setCurrentDateFilter(null);
  }, []);

  /**
   * Refresh all data from the database
   * Now supports optional date range filtering without replacing main dataset
   * 
   * @async
   * @function refreshData
   * @param {Date} [from] - Optional start date for filtering
   * @param {Date} [to] - Optional end date for filtering
   * @returns {Promise<void>}
   */
  const refreshData = useCallback(async (from?: Date, to?: Date) => {
    console.log("🔄 Refreshing data...", { from, to, selectedBusiness });
    
    // If date parameters are provided, this is a temporary filter request
    const isInitialLoad = !from && !to && allReviews.length === 0;
    await loadAllData(from, to, isInitialLoad);
  }, [loadAllData, allReviews.length, selectedBusiness]);

  /**
   * Get filtered reviews for the current business selection
   * 
   * @returns {Review[]} Array of filtered reviews
   */
  const getFilteredReviews = useCallback(() => {
    const hasTempFilter = tempFilteredReviews !== null;
    console.log(`📊 getFilteredReviews called:`, {
      filteredReviewsCount: filteredReviews.length,
      hasTempFilter,
      selectedBusiness,
      tempFilteredReviewsCount: tempFilteredReviews?.length || 0,
      currentDateFilter
    });
    return filteredReviews;
  }, [filteredReviews, tempFilteredReviews, selectedBusiness, currentDateFilter]);

  /**
   * NEW: Get all reviews regardless of business selection
   * 
   * @returns {Review[]} Array of all reviews
   */
  const getAllReviews = useCallback(() => {
    console.log(`📊 getAllReviews called:`, {
      allReviewsCount: allReviews.length
    });
    return allReviews;
  }, [allReviews]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefreshInterval > 0) {
      const interval = setInterval(() => refreshData(), autoRefreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshData, autoRefreshInterval]);

  // Initial data load on mount
  useEffect(() => {
    loadAllData(undefined, undefined, true);
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
    
    // Stats
    totalReviewCount: filteredReviews.length,
    lastFetched,
    
    // NEW: Expose temp filter state for period comparison
    hasTemporaryFilter: tempFilteredReviews !== null,
    clearTemporaryFilter,
    
    // NEW: Expose getAllReviews for comparison
    getAllReviews,
    
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
