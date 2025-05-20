import { useEffect, useState, useCallback, useMemo } from "react";
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
const PAGE_SIZE = 500; // Increased from 100 to 500 to load more reviews at once

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
  
  // Use the extracted business selection hook
  const { 
    selectedBusiness, 
    businessData, 
    handleBusinessChange,
    setBusinessData
  } = useBusinessSelection(reviewData);

  // Fetch businesses and set up tables
  const fetchInitialData = useCallback(async () => {
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
      
      // Fetch first page of reviews
      await fetchNextPage(0);
      
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
    }
  }, [toast]);
  
  // Fetch next page of reviews
  const fetchNextPage = useCallback(async (page: number) => {
    if (page === 0) {
      setReviewData([]); // Clear existing data when loading from the beginning
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      console.log(`Fetching reviews page ${page + 1} (${PAGE_SIZE} items per page)`);
      
      const { data, total, hasMore } = await fetchPaginatedReviews(
        page,
        PAGE_SIZE,
        selectedBusiness !== "All Businesses" ? selectedBusiness : undefined, 
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
      } else {
        console.log(`Fetched ${data.length} reviews for page ${page + 1}`);
        
        // Add to existing data if not page 0
        setReviewData(prev => (page === 0 ? data : [...prev, ...data]));
        setCurrentPage(page);
        setHasMoreData(hasMore);
        setTotalReviewCount(total);
        setLastFetched(Date.now());
        
        if (page === 0) {
          // Calculate business statistics once we have initial data
          console.log("Calculating business statistics...");
          const businessesObj = calculateBusinessStats(data);
          
          // Update business data
          setBusinessData({
            allBusinesses: { name: "All Businesses", count: total },
            businesses: businessesObj,
          });
          
          toast({
            title: "Data loaded successfully",
            description: `Loaded ${data.length} reviews of ${total} total`,
          });
          
          // If there's more data, fetch the next page automatically to load all reviews
          if (hasMore) {
            await fetchNextPage(page + 1);
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
    }
  }, [selectedBusiness, startDate, endDate, toast, setBusinessData]);

  // Fetch data on initial load
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);
  
  // When selected business changes, reset and load data
  useEffect(() => {
    // Reset pagination when selected business changes
    setCurrentPage(0);
    setHasMoreData(true);
    fetchNextPage(0);
  }, [selectedBusiness, startDate, endDate, fetchNextPage]);

  // Load more data function
  const loadMoreData = useCallback(() => {
    if (!loadingMore && hasMoreData) {
      fetchNextPage(currentPage + 1);
    }
  }, [loadingMore, hasMoreData, currentPage, fetchNextPage]);

  // Refresh data function
  const refreshData = useCallback(() => {
    // Reset pagination
    setCurrentPage(0);
    setHasMoreData(true);
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
    console.log(`Filtered to ${filtered.length} reviews for "${selectedBusiness}"`);
    return filtered;
  }, [getFilteredReviews, selectedBusiness]);

  // Generate enhanced analysis when data is available and business is selected
  useEffect(() => {
    if (selectedBusiness && selectedBusiness !== 'all' && !databaseError && reviewData.length > 0) {
      // Generate real analysis based on review data
      const analysis = generateEnhancedAnalysis(filteredReviews, selectedBusiness);
      setEnhancedAnalysis(analysis);
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
    lastFetched,
    enhancedAnalysis,
    totalReviewCount,
    currentPage,
    pageSize: PAGE_SIZE
  };
}
