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
const AUTO_LOAD_PAGES = 5; // Load initial 5 pages automatically for specific businesses

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
  
  // Refs to prevent infinite loops
  const isInitialMount = useRef(true);
  const isLoadingRef = useRef(false);
  const loadedBusinessDataRef = useRef(false);
  const previousSelectedBusinessRef = useRef<string>("");
  const autoLoadingRef = useRef(false);
  
  // Use the business selection hook WITHOUT passing reviewData to break circular dependency
  const { 
    selectedBusiness, 
    businessData, 
    handleBusinessChange,
    setBusinessData
  } = useBusinessSelection();

  // Calculate business stats from review data
  const updateBusinessStats = useCallback((reviews: Review[], total: number) => {
    try {
      if (loadedBusinessDataRef.current) return; // Only calculate once
      
      console.log("Calculating business statistics...");
      const businessesObj = calculateBusinessStats(reviews, total);
      
      // Update business data with actual counts
      setBusinessData({
        allBusinesses: { name: "All Businesses", count: total },
        businesses: businessesObj,
      });
      
      loadedBusinessDataRef.current = true;
    } catch (e) {
      console.error("Error calculating business stats:", e);
    }
  }, [setBusinessData]);

  // Fetch businesses and set up tables
  const fetchInitialData = useCallback(async () => {
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    setLoading(true);
    setDatabaseError(false);
    loadedBusinessDataRef.current = false;
    setAutoLoadingComplete(false);
    
    try {
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
      
      // Now manually call fetchData (but don't wait for it to complete)
      fetchData(); 
      
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
  
  // Main data fetching function (separated from fetchNextPage to avoid dependencies)
  const fetchData = useCallback(async () => {
    // Skip if already loading
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    
    try {
      setLoading(true);
      setReviewData([]);
      setAllPagesLoaded(false);
      loadedBusinessDataRef.current = false;
      setAutoLoadingComplete(false);
      
      // Actual data fetch
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
      } else {
        console.log(`Fetched ${data.length} reviews of ${total} total`);
        
        setReviewData(data);
        setCurrentPage(0);
        setHasMoreData(hasMore);
        setTotalReviewCount(total);
        setLastFetched(Date.now());
        
        // Update business stats
        updateBusinessStats(data, total);
        
        toast({
          title: "Data loaded successfully",
          description: `Loaded ${data.length} reviews of ${total} total`,
        });
        
        // Auto-load more pages if specific businesses with many reviews
        if (hasMore && 
            (selectedBusiness === "The Little Prince Cafe" ||
             data.length < total * 0.9)) { // Load more if we have less than 90% of reviews
          setTimeout(() => {
            autoLoadPages(1);
          }, 300);
        } else {
          setAutoLoadingComplete(true);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
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
  }, [selectedBusiness, startDate, endDate, toast, updateBusinessStats]);
  
  // Auto-load multiple pages for specific businesses
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
      
      // Load up to AUTO_LOAD_PAGES pages or until we reach the totalReviewCount
      while (shouldContinue && 
            currentPageNumber < AUTO_LOAD_PAGES && 
            totalLoadedReviews < totalReviewCount) {
        
        // Set loading state but don't block UI
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
          
          // Append new data to existing
          setReviewData(prev => [...prev, ...data]);
          setCurrentPage(currentPageNumber);
          totalLoadedReviews += data.length;
          
          // Check if we've loaded enough or reached the limit
          if (!hasMore || totalLoadedReviews >= MAX_ALLOWED_REVIEWS) {
            shouldContinue = false;
            setHasMoreData(hasMore);
            setAllPagesLoaded(!hasMore || totalLoadedReviews >= totalReviewCount);
          } else {
            currentPageNumber++;
          }
        }
      }
      
      // Update loading state
      setLoadingMore(false);
      setAutoLoadingComplete(true);
      
      console.log(`Auto-loaded ${totalLoadedReviews} of ${totalReviewCount} reviews (${Math.round((totalLoadedReviews/totalReviewCount)*100)}%)`);
      
    } catch (error) {
      console.error("Error auto-loading data:", error);
      setLoadingMore(false);
    } finally {
      autoLoadingRef.current = false;
      setAutoLoadingComplete(true);
    }
  }, [
    allPagesLoaded, hasMoreData, reviewData.length, 
    selectedBusiness, startDate, endDate, totalReviewCount
  ]);
  
  // Load more data function (manually triggered)
  const loadMoreData = useCallback(async () => {
    // Skip if already loading or no more data
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

  // Fetch data on initial mount only
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchInitialData();
    }
  }, [fetchInitialData]);
  
  // Handle business selection changes
  useEffect(() => {
    // Skip on first mount
    if (isInitialMount.current) return;
    
    // Skip if already loading or no change
    if (isLoadingRef.current || previousSelectedBusinessRef.current === selectedBusiness) return;
    
    console.log(`Business selection changed from "${previousSelectedBusinessRef.current}" to "${selectedBusiness}"`);
    previousSelectedBusinessRef.current = selectedBusiness;
    
    // Need to reload data with the new business selection
    fetchData();
    
  }, [selectedBusiness, fetchData]);

  // Refresh data function - for user-triggered refreshes
  const refreshData = useCallback(() => {
    if (isLoadingRef.current) return Promise.resolve();
    
    previousSelectedBusinessRef.current = ""; // Force a reload
    return fetchData();
  }, [fetchData]);

  // Get filtered reviews based on selected business - memoized
  const getFilteredReviews = useCallback(() => {
    return filterReviewsByBusiness(reviewData, selectedBusiness);
  }, [reviewData, selectedBusiness]);

  // Memoized filtered reviews
  const filteredReviews = useMemo(() => {
    const filtered = getFilteredReviews();
    return filtered;
  }, [getFilteredReviews]);

  // Generate enhanced analysis when data is available and business is selected
  const computedEnhancedAnalysis = useMemo(() => {
    // Only attempt analysis when we have enough data
    if (selectedBusiness && selectedBusiness !== 'all' && !databaseError && filteredReviews.length > 0) {
      try {
        return generateEnhancedAnalysis(filteredReviews, selectedBusiness);
      } catch (e) {
        console.error("Error generating analysis:", e);
        return null;
      }
    }
    return null;
  }, [selectedBusiness, databaseError, filteredReviews]);
  
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
