
import { useEffect, useState } from "react";
import { Review, TableName } from "@/types/reviews";
import { useToast } from "@/hooks/use-toast";
import { fetchAvailableTables, fetchAllReviewData } from "@/services/reviewDataService";
import { filterReviewsByBusiness, getChartData, calculateBusinessStats } from "@/utils/reviewDataUtils";
import { useBusinessSelection } from "@/hooks/useBusinessSelection";

export function useDashboardData() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [availableTables, setAvailableTables] = useState<TableName[]>([]);
  const [reviewData, setReviewData] = useState<Review[]>([]);
  
  // Use the extracted business selection hook
  const { 
    selectedBusiness, 
    businessData, 
    handleBusinessChange,
    setBusinessData
  } = useBusinessSelection(reviewData);

  // Fetch available tables first
  useEffect(() => {
    const getTables = async () => {
      const tables = await fetchAvailableTables();
      setAvailableTables(tables);
    };
    
    getTables();
  }, []);

  // Then fetch data once we have tables
  useEffect(() => {
    if (availableTables.length > 0) {
      fetchData();
    }
  }, [availableTables]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Use the tables we've fetched dynamically
      const tables = availableTables;
      
      // Use our service to fetch all reviews
      const allReviews = await fetchAllReviewData(tables);
      setReviewData(allReviews);
      
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
  };

  // Get filtered reviews based on selected business
  const getFilteredReviews = () => {
    return filterReviewsByBusiness(reviewData, selectedBusiness);
  };

  return {
    loading,
    selectedBusiness,
    businessData,
    getFilteredReviews,
    getChartData,
    handleBusinessChange
  };
}
