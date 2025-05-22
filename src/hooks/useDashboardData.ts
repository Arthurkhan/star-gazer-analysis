import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Review, Business, TableName } from "@/types/reviews";
import { EnhancedAnalysis } from "@/types/dataAnalysis";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchAvailableTables, 
  fetchBusinesses,
  fetchPaginatedReviews
} from "@/services/reviewDataService";
import { 
  filterReviewsByBusiness, 
  getChartData, 
  calculateBusinessStats,
  generateEnhancedAnalysis,
} from "@/utils/reviewDataUtils";
import { useBusinessSelection } from "@/hooks/useBusinessSelection";

// Constants
const PAGE_SIZE = 2000; // Increased page size to load more reviews at once
const MAX_ALLOWED_REVIEWS = 10000; // Higher limit to accommodate larger businesses
const AUTO_LOAD_PAGES = 3; // Reduced from 5 to prevent overwhelming

export function useDashboardData(startDate?: Date, endDate?: Date) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [databaseError, setDatabaseError] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [availableTables, setAvailableTables] = useState<TableName[]>([]);
  const [reviewData, setReviewData] = useState<Review[]>([]);
  const [lastFetched, setLastFetched] = useState<number>(0);
  const [enhancedAnalysis, setEnhancedAnalysis] = useState<EnhancedAnalysis | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [totalReviewCount, setTotalReviewCount] = useState(0);
  const [allPagesLoaded, setAllPagesLoaded] = useState(false);
  const [autoLoadingComplete, setAutoLoadingComplete] = useState(false);
  
  // Refs to prevent infinite loops and manage state
  const isInitialMount = useRef(true);
  const isLoadingRef = useRef(false);
  const previousSelectedBusinessRef = useRef<string>("");
  const autoLoadingRef = useRef(false);
  const businessDataInitialized = useRef(false);
  const enhancedAnalysisCache = useRef<Map<string, EnhancedAnalysis>>(new Map());
  
  // Use the business selection hook WITHOUT circular dependencies
  const { 
    selectedBusiness, 
    businessData, 
    handleBusinessChange,
    setBusinessData
  } = useBusinessSelection();

  // Memoized business stats calculation - only runs when reviews change
  const businessStats = useMemo(() => {
    if (!reviewData.length || businessDataInitialized.current) {
      return businessData.businesses;
    }
    
    try {
      console.log("Calculating business statistics...");
      const stats = calculateBusinessStats(reviewData, totalReviewCount);
      return stats;
    } catch (e) {
      console.error("Error calculating business stats:", e);
      return {};
    }
  }, [reviewData.length, totalReviewCount]); // Only depend on length, not full array

  // Update business data only when stats actually change
  useEffect(() => {
    if (Object.keys(businessStats).length > 0 && !businessDataInitialized.current) {
      console.log("Updating business data with calculated stats");
      setBusinessData({
        allBusinesses: { name: "All Businesses", count: totalReviewCount },
        businesses: businessStats,
      });
      businessDataInitialized.current = true;
    }
  }, [businessStats, totalReviewCount, setBusinessData]);

  // Fetch businesses and set up tables - isolated function
  const fetchInitialData = useCallback(async () => {
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    setLoading(true);
    setDatabaseError(false);
    businessDataInitialized.current = false;
    setAutoLoadingComplete(false);
    
    try {
      console.log("Fetching initial application data...");
      
      // Get all businesses
      const businessesResult = await fetchBusinesses();
      console.log('Fetched businesses:', businessesResult.length);
      
      if (businessesResult.length === 0) {
        console.error("No businesses found - database may be empty or connection issue");
        setDatabaseError(true);
        setLoading(false);
        
        toast({
          title: "Database error",
          description: "No businesses found. Please check your database connection and configuration.",
          variant: "destructive",
        });
        return;
      }
      
      setBusinesses(businessesResult);
      
      // Get table names (for backward compatibility)
      let tablesResult = await fetchAvailableTables();
      console.log('Available tables:', tablesResult);
      
      // If no tables found but we have businesses, generate table names from businesses
      if (tablesResult.length === 0 && businessesResult.length > 0) {
        tablesResult = businessesResult.slice(0, 3).map(b => b.name) as TableName[];
        console.log('Generated table names from businesses:', tablesResult);
      }
      
      if (tablesResult.length === 0) {
        console.warn("No business tables available");
        setDatabaseError(true);
        setLoading(false);
        
        toast({
          title: "Database error",
          description: "No tables found in database. Please check your database schema.",
          variant: "destructive",
        });
        return;
      }
      
      setAvailableTables(tablesResult);
      
      // Reset pagination variables
      setCurrentPage(0);
      setHasMoreData(true);
      setAllPagesLoaded(false);
      setReviewData([]);
      
      console.log("Initial data setup complete, now fetching reviews...");
      
    } catch (error) {
      console.error("Error fetching initial data:", error);
      setDatabaseError(true);
      
      toast({
        title: "Database connection error",
        description: "Could not fetch data from the database. Please check your connection settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [toast]);
  
  // Main data fetching function - completely isolated from business selection updates
  const fetchReviewData = useCallback(async () => {
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    setLoading(true);
    setReviewData([]);
    setAllPagesLoaded(false);
    businessDataInitialized.current = false;
    setAutoLoadingComplete(false);
    
    try {
      console.log(`Fetching review data for: ${selectedBusiness}`);
      
      // Fetch data from the service
      const { data, total, hasMore } = await fetchPaginatedReviews(
        0, // Always start with page 0
        PAGE_SIZE,
        selectedBusiness !== "All Businesses" && selectedBusiness !== "all" ? selectedBusiness : undefined, 
        startDate, 
        endDate
      );
      
      if (data.length === 0) {
        console.warn("No reviews found in database");
        
        toast({
          title: "No reviews found",
          description: "No reviews were found for the selected time period.",
          variant: "warning",
        });
        setAllPagesLoaded(true);
        setTotalReviewCount(0);
      } else {
        console.log(`Fetched ${data.length} reviews of ${total} total`);
        
        setReviewData(data);
        setCurrentPage(0);
        setHasMoreData(hasMore);
        setTotalReviewCount(total);
        setLastFetched(Date.now());
        
        toast({
          title: "Data loaded successfully",
          description: `Loaded ${data.length} reviews of ${total} total`,
        });
        
        // Auto-load more pages if we haven't loaded all reviews and it's not too many
        if (hasMore && data.length < total && total <= MAX_ALLOWED_REVIEWS) {
          setTimeout(() => {
            autoLoadPages(1);
          }, 500);
        } else {
          setAutoLoadingComplete(true);
        }
      }
    } catch (error) {
      console.error("Error fetching review data:", error);
      setDatabaseError(true);
      
      toast({
        title: "Database connection error",
        description: "Could not fetch review data from the database. Please check your connection settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [selectedBusiness, startDate, endDate, toast]);
  
  // Auto-load multiple pages - isolated from main data flow
  const autoLoadPages = useCallback(async (startPage: number) => {
    if (autoLoadingRef.current || !hasMoreData || allPagesLoaded) {
      setAutoLoadingComplete(true);
      return;
    }
    
    autoLoadingRef.current = true;
    
    try {
      let currentPageNumber = startPage;
      let shouldContinue = true;
      let totalLoadedReviews = reviewData.length;
      
      // Load up to AUTO_LOAD_PAGES pages
      while (shouldContinue && 
            currentPageNumber < AUTO_LOAD_PAGES && 
            totalLoadedReviews < totalReviewCount &&
            totalLoadedReviews < MAX_ALLOWED_REVIEWS) {
        
        setLoadingMore(true);
        
        const { data, hasMore } = await fetchPaginatedReviews(
          currentPageNumber,
          PAGE_SIZE,
          selectedBusiness !== "All Businesses" && selectedBusiness !== "all" ? selectedBusiness : undefined, 
          startDate, 
          endDate
        );
        
        if (data.length === 0) {
          shouldContinue = false;
          setAllPagesLoaded(true);
        } else {
          console.log(`Auto-loaded page ${currentPageNumber + 1} with ${data.length} reviews`);
          
          // Append new data to existing (avoid state update loops)
          setReviewData(prev => {
            const combined = [...prev, ...data];
            return combined;
          });
          setCurrentPage(currentPageNumber);
          totalLoadedReviews += data.length;
          
          // Check if we should continue
          if (!hasMore || totalLoadedReviews >= MAX_ALLOWED_REVIEWS) {
            shouldContinue = false;
            setHasMoreData(hasMore);
            setAllPagesLoaded(!hasMore || totalLoadedReviews >= totalReviewCount);
          } else {
            currentPageNumber++;
          }
        }
      }
      
      setLoadingMore(false);
      setAutoLoadingComplete(true);
      
      console.log(`Auto-loaded ${totalLoadedReviews} of ${totalReviewCount} reviews`);
      
    } catch (error) {
      console.error("Error auto-loading data:", error);
      setLoadingMore(false);
    } finally {
      autoLoadingRef.current = false;
      setAutoLoadingComplete(true);
    }
  }, [hasMoreData, allPagesLoaded, reviewData.length, selectedBusiness, startDate, endDate, totalReviewCount]);
  
  // Load more data function (manually triggered)
  const loadMoreData = useCallback(async () => {
    if (isLoadingRef.current || loadingMore || !hasMoreData || allPagesLoaded) return;
    
    isLoadingRef.current = true;
    setLoadingMore(true);
    
    try {
      const nextPage = currentPage + 1;
      
      const { data, hasMore } = await fetchPaginatedReviews(
        nextPage,
        PAGE_SIZE,
        selectedBusiness !== "All Businesses" && selectedBusiness !== "all" ? selectedBusiness : undefined, 
        startDate, 
        endDate
      );
      
      if (data.length === 0) {
        setAllPagesLoaded(true);
      } else {
        console.log(`Loaded ${data.length} more reviews`);
        
        // Append new data to existing
        setReviewData(prev => [...prev, ...data]);
        setCurrentPage(nextPage);
        setHasMoreData(hasMore);
        
        // Check if we've reached the maximum allowed reviews
        const updatedTotalReviews = reviewData.length + data.length;
        if (updatedTotalReviews >= MAX_ALLOWED_REVIEWS) {
          setHasMoreData(false);
          toast({
            title: "Large dataset detected",
            description: `Loaded ${updatedTotalReviews} reviews (maximum limit reached).`,
            variant: "warning",
          });
        }
        
        if (!hasMore || updatedTotalReviews >= totalReviewCount) {
          setAllPagesLoaded(true);
        }
      }
    } catch (error) {
      console.error("Error loading more data:", error);
      
      toast({
        title: "Error loading more data",
        description: "Failed to load more reviews. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, [
    selectedBusiness, startDate, endDate, toast, 
    hasMoreData, allPagesLoaded, loadingMore, currentPage, reviewData.length, totalReviewCount
  ]);

  // Initial data fetch - runs only once on mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      console.log("Initializing dashboard data...");
      fetchInitialData();
    }
  }, []); // No dependencies to prevent re-runs

  // Separate effect for review data fetching when business changes
  useEffect(() => {
    // Skip initial mount (handled above)
    if (isInitialMount.current) return;
    
    // Skip if already loading or no change
    if (isLoadingRef.current) return;
    
    // Only fetch if business actually changed
    if (previousSelectedBusinessRef.current !== selectedBusiness) {
      console.log(`Business selection changed from "${previousSelectedBusinessRef.current}" to "${selectedBusiness}"`);
      previousSelectedBusinessRef.current = selectedBusiness;
      
      // Delay the fetch slightly to prevent rapid consecutive calls
      const timeoutId = setTimeout(() => {
        fetchReviewData();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedBusiness]); // Only depend on selectedBusiness

  // Separate effect for date range changes
  useEffect(() => {
    // Skip initial mount and loading states
    if (isInitialMount.current || isLoadingRef.current) return;
    
    // Only fetch if we have a business selected and dates have changed
    if (selectedBusiness && (startDate || endDate)) {
      console.log("Date range changed, refetching data...");
      
      const timeoutId = setTimeout(() => {
        fetchReviewData();
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [startDate, endDate]); // Only depend on date changes

  // Refresh data function - for user-triggered refreshes
  const refreshData = useCallback(() => {
    if (isLoadingRef.current) return Promise.resolve();
    
    console.log("Refreshing dashboard data...");
    previousSelectedBusinessRef.current = ""; // Force a reload
    businessDataInitialized.current = false;
    enhancedAnalysisCache.current.clear();
    
    return fetchInitialData().then(() => {
      return fetchReviewData();
    });
  }, [fetchInitialData, fetchReviewData]);

  // Get filtered reviews based on selected business - memoized for performance
  const filteredReviews = useMemo(() => {
    return filterReviewsByBusiness(reviewData, selectedBusiness);
  }, [reviewData, selectedBusiness]);

  // Generate enhanced analysis - memoized and cached
  const computedEnhancedAnalysis = useMemo(() => {
    if (!selectedBusiness || selectedBusiness === 'all' || databaseError || filteredReviews.length === 0) {
      return null;
    }
    
    // Use cache to avoid recomputing
    const cacheKey = `${selectedBusiness}-${filteredReviews.length}`;
    if (enhancedAnalysisCache.current.has(cacheKey)) {
      return enhancedAnalysisCache.current.get(cacheKey)!;
    }
    
    try {
      console.log(`Generating enhanced analysis for ${selectedBusiness}`);
      const analysis = generateEnhancedAnalysis(filteredReviews, selectedBusiness);
      enhancedAnalysisCache.current.set(cacheKey, analysis);
      return analysis;
    } catch (e) {
      console.error("Error generating analysis:", e);
      return null;
    }
  }, [selectedBusiness, databaseError, filteredReviews.length]); // Only length, not full array
  
  // Update enhanced analysis state when computed value changes
  useEffect(() => {
    setEnhancedAnalysis(computedEnhancedAnalysis);
  }, [computedEnhancedAnalysis]);

  return {
    loading,
    loadingMore,
    databaseError,
    businesses,
    selectedBusiness,
    businessData,
    getFilteredReviews: () => filteredReviews,
    getChartData,
    handleBusinessChange,
    refreshData,
    loadMoreData,
    hasMoreData,
    allPagesLoaded,
    lastFetched,
    enhancedAnalysis,
    totalReviewCount,
    currentPage,
    pageSize: PAGE_SIZE,
    autoLoadingComplete
  };
}