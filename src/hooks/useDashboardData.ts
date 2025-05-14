
import { useEffect, useState, useCallback, useMemo } from "react";
import { Review, TableName } from "@/types/reviews";
import { useToast } from "@/hooks/use-toast";
import { fetchAvailableTables, fetchAllReviewData, clearAllCaches } from "@/services/reviewDataService";
import { filterReviewsByBusiness, getChartData, calculateBusinessStats, clearCaches } from "@/utils/reviewDataUtils";
import { useBusinessSelection } from "@/hooks/useBusinessSelection";

export function useDashboardData() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [availableTables, setAvailableTables] = useState<TableName[]>([]);
  const [reviewData, setReviewData] = useState<Review[]>([]);
  const [lastFetched, setLastFetched] = useState<number>(0);
  
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
    try {
      // Clear caches if force refresh is requested
      if (forceRefresh) {
        clearAllCaches();
        clearCaches();
      }
      
      // Use the tables we've fetched dynamically
      const tables = availableTables.length > 0 ? availableTables : await fetchAvailableTables();
      
      if (tables.length === 0) {
        throw new Error("No tables available");
      }
      
      if (availableTables.length === 0) {
        setAvailableTables(tables);
      }
      
      // Use our service to fetch all reviews
      const allReviews = await fetchAllReviewData(tables);
      setReviewData(allReviews);
      setLastFetched(Date.now());
      
      // Calculate business statistics
      const businessesObj = calculateBusinessStats(allReviews);
      
      // Update business data
      setBusinessData({
        allBusinesses: { name: "All Businesses", count: allReviews.length },
        businesses: businessesObj,
      });
      
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error fetching data",
        description: "Could not fetch review data from the database",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [availableTables, toast, setBusinessData]);

  // Fetch tables first, then fetch data once we have tables
  useEffect(() => {
    const initialize = async () => {
      try {
        const tables = await fetchAvailableTables();
        setAvailableTables(tables);
        
        // If we have tables, fetch the data
        if (tables.length > 0) {
          fetchData();
        }
      } catch (error) {
        console.error("Error initializing:", error);
        setLoading(false);
      }
    };
    
    initialize();
  }, []);

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
    return getFilteredReviews();
  }, [getFilteredReviews]);

  return {
    loading,
    selectedBusiness,
    businessData,
    getFilteredReviews: () => filteredReviews,
    getChartData,
    handleBusinessChange,
    refreshData,
    lastFetched
  };
}
