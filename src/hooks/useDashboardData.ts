import { useEffect, useState, useCallback, useMemo } from "react";
import { Review, Business, TableName } from "@/types/reviews";
import { EnhancedAnalysis } from "@/types/dataAnalysis";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchAvailableTables, 
  fetchAllReviewData, 
  clearAllCaches,
  fetchBusinesses
} from "@/services/reviewDataService";
import { 
  filterReviewsByBusiness, 
  getChartData, 
  calculateBusinessStats, 
  clearCaches 
} from "@/utils/reviewDataUtils";
import { useBusinessSelection } from "@/hooks/useBusinessSelection";

export function useDashboardData(startDate?: Date, endDate?: Date) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [databaseError, setDatabaseError] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [availableTables, setAvailableTables] = useState<TableName[]>([]);
  const [reviewData, setReviewData] = useState<Review[]>([]);
  const [lastFetched, setLastFetched] = useState<number>(0);
  const [enhancedAnalysis, setEnhancedAnalysis] = useState<EnhancedAnalysis | null>(null);
  
  // Use the extracted business selection hook
  const { 
    selectedBusiness, 
    businessData, 
    handleBusinessChange,
    setBusinessData
  } = useBusinessSelection(reviewData);

  // Memoized function to fetch data
  const fetchData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setDatabaseError(false);
    
    try {
      // Clear caches if force refresh is requested
      if (forceRefresh) {
        console.log("Forcing data refresh - clearing all caches");
        clearAllCaches();
        clearCaches();
      }
      
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
      
      // Fetch all reviews for all businesses
      console.log("Fetching all review data...");
      const startTime = performance.now();
      const allReviews = await fetchAllReviewData(tablesResult, startDate, endDate);
      const endTime = performance.now();
      console.log(`Fetched ${allReviews.length} reviews in ${Math.round((endTime - startTime) / 1000)} seconds`);
      
      if (allReviews.length === 0) {
        console.warn("No reviews found in database");
        setDatabaseError(true);
        setLoading(false);
        
        toast({
          title: "No reviews found",
          description: "Database is connected, but no reviews were found for the selected time period.",
          variant: "warning",
        });
        return;
      }
      
      setReviewData(allReviews);
      setLastFetched(Date.now());
      
      // Calculate business statistics
      console.log("Calculating business statistics...");
      const businessesObj = calculateBusinessStats(allReviews);
      
      // Log counts by business for debugging
      Object.entries(businessesObj).forEach(([name, data]) => {
        console.log(`Business "${name}": ${data.count} reviews`);
      });
      
      // Update business data
      setBusinessData({
        allBusinesses: { name: "All Businesses", count: allReviews.length },
        businesses: businessesObj,
      });
      
      toast({
        title: "Data loaded successfully",
        description: `Loaded ${allReviews.length} reviews across ${Object.keys(businessesObj).length} businesses`,
      });
      
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
    }
  }, [toast, setBusinessData, startDate, endDate]);

  // Fetch data on initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh data function
  const refreshData = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

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
      // In a production environment, this would call your AI service
      // For now, we'll leave this empty to avoid creating mock data
      setEnhancedAnalysis(null);
    } else {
      setEnhancedAnalysis(null);
    }
  }, [selectedBusiness, databaseError, reviewData.length]);

  return {
    loading,
    databaseError,
    businesses,
    selectedBusiness,
    businessData,
    getFilteredReviews: () => filteredReviews,
    getChartData,
    handleBusinessChange,
    refreshData,
    lastFetched,
    enhancedAnalysis
  };
}
