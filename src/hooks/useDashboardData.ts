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
const PAGE_SIZE = 1000; // Reduced page size to prevent memory issues
const MAX_ALLOWED_REVIEWS = 10000; // Lower limit to prevent browser crashes
const AUTO_LOAD_PAGES = 1; // Only auto-load the first page to prevent infinite loops

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
  
  // Refs to prevent infinite loops
  const isInitialMount = useRef(true);
  const isLoadingRef = useRef(false);
  const autoLoadingRef = useRef(false);
  
  // Use the extracted business selection hook
  const { 
    selectedBusiness, 
    businessData, 
    handleBusinessChange,
    setBusinessData
  } = useBusinessSelection(reviewData);

  // Fetch businesses and set up tables
  const fetchInitialData = useCallback(async () => {
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    setLoading(true);
    setDatabaseError(false);
    
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
      
      // Fetch first page of reviews (don't await to allow UI to update)
      fetchNextPage(0);
      
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
  
  // Fetch next page of reviews
  const fetchNextPage = useCallback(async (page: number) => {
    // Prevent concurrent fetches
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    
    try {
      if (page === 0) {
        setReviewData([]); // Clear existing data when loading from the beginning
        setLoading(true);
        setAllPagesLoaded(false);
      } else {
        setLoadingMore(true);
      }
      
      console.log(`Fetching reviews page ${page + 1} (${PAGE_SIZE} items per page)`);
      
      // Only fetch if page is valid
      if (page < 0) {
        console.warn("Invalid page number:", page);
        return;
      }
      
      const { data, total, hasMore } = await fetchPaginatedReviews(
        page,
        PAGE_SIZE,
        selectedBusiness !== "All Businesses" && selectedBusiness !== "all" ? selectedBusiness : undefined, 
        startDate, 
        endDate
      );
      
      if (data.length === 0 && page === 0) {
        console.warn("No reviews found in database");
        
        toast({
          title: "No reviews found",
          description: "No reviews were found for the selected time period.",
          variant: "warning",
        });
        setAllPagesLoaded(true);
      } else {
        console.log(`Fetched ${data.length} reviews for page ${page + 1} of ${total} total`);
        
        // Add to existing data if not page 0
        const updatedReviews = page === 0 ? data : [...reviewData, ...data];
        
        // Check if we've reached the maximum allowed reviews to prevent browser crashes
        const hasReachedLimit = updatedReviews.length >= MAX_ALLOWED_REVIEWS;
        
        setReviewData(updatedReviews);
        setCurrentPage(page);
        setHasMoreData(hasMore && !hasReachedLimit);
        setTotalReviewCount(total);
        setLastFetched(Date.now());
        
        // Calculate business statistics once we have initial data
        try {
          console.log("Calculating business statistics...");
          const businessesObj = calculateBusinessStats(data, total); // Only pass current page data
          
          // Update business data with actual counts
          setBusinessData({
            allBusinesses: { name: "All Businesses", count: total },
            businesses: businessesObj,
          });
        } catch (e) {
          console.error("Error calculating business stats:", e);
        }

        if (page === 0) {
          toast({
            title: "Data loaded successfully",
            description: `Loaded ${data.length} reviews of ${total} total`,
          });
        }
        
        // Only auto-load subsequent pages if explicitly enabled and within limits
        if (page < AUTO_LOAD_PAGES && hasMore && !hasReachedLimit && !autoLoadingRef.current) {
          autoLoadingRef.current = true;
          
          // Timeout to allow UI to update before loading more
          setTimeout(() => {
            autoLoadingRef.current = false;
            fetchNextPage(page + 1);
          }, 500);
        } else if (!hasMore || hasReachedLimit) {
          setAllPagesLoaded(true);
          
          if (hasReachedLimit && hasMore) {
            toast({
              title: "Large dataset detected",
              description: `Loaded ${updatedReviews.length} reviews. Additional reviews can be loaded on demand.`,
              variant: "warning",
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching reviews page ${page + 1}:`, error);
      
      if (page === 0) {
        setDatabaseError(true);
        
        toast({
          title: "Database connection error",
          description: "Could not fetch review data from the database. Please check your connection settings.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error loading more data",
          description: "Failed to load more reviews. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      if (page === 0) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
      isLoadingRef.current = false;
    }
  }, [selectedBusiness, startDate, endDate, toast, setBusinessData, reviewData]);

  // Fetch data on initial load only once
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchInitialData();
    }
  }, [fetchInitialData]);
  
  // When selected business changes, reset and load data
  useEffect(() => {
    // Skip on first mount as fetchInitialData already runs
    if (isInitialMount.current) return;
    
    // Prevent re-fetching when unnecessary 
    if (isLoadingRef.current || autoLoadingRef.current) return;
    
    // Don't reset if already loading the correct business
    console.log(`Business selection changed to: ${selectedBusiness}`);
    setCurrentPage(0);
    setHasMoreData(true);
    setAllPagesLoaded(false);
    fetchNextPage(0);
    
  }, [selectedBusiness, startDate, endDate, fetchNextPage]);

  // Load more data function - manually triggered
  const loadMoreData = useCallback(() => {
    if (!loadingMore && hasMoreData && !allPagesLoaded && !isLoadingRef.current) {
      fetchNextPage(currentPage + 1);
    }
  }, [loadingMore, hasMoreData, currentPage, fetchNextPage, allPagesLoaded]);

  // Refresh data function
  const refreshData = useCallback(() => {
    if (isLoadingRef.current) return Promise.resolve();
    
    // Reset pagination
    setCurrentPage(0);
    setHasMoreData(true);
    setAllPagesLoaded(false);
    // Fetch first page
    return fetchNextPage(0);
  }, [fetchNextPage]);

  // Get filtered reviews based on selected business - memoized
  const getFilteredReviews = useCallback(() => {
    return filterReviewsByBusiness(reviewData, selectedBusiness);
  }, [reviewData, selectedBusiness]);

  // Memoized filtered reviews
  const filteredReviews = useMemo(() => {
    const filtered = getFilteredReviews();
    // Avoid excessive logging
    if (filtered.length > 0) {
      console.log(`Filtered to ${filtered.length} reviews for "${selectedBusiness}"`);
    }
    return filtered;
  }, [getFilteredReviews, selectedBusiness]);

  // Generate enhanced analysis when data is available and business is selected
  useEffect(() => {
    // Only attempt analysis when we have enough data
    if (selectedBusiness && selectedBusiness !== 'all' && !databaseError && reviewData.length > 0) {
      try {
        // Generate real analysis based on review data
        const analysis = generateEnhancedAnalysis(filteredReviews, selectedBusiness);
        setEnhancedAnalysis(analysis);
      } catch (e) {
        console.error("Error generating analysis:", e);
        setEnhancedAnalysis(null);
      }
    } else {
      setEnhancedAnalysis(null);
    }
  }, [selectedBusiness, databaseError, reviewData.length, filteredReviews]);

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
    pageSize: PAGE_SIZE
  };
}
