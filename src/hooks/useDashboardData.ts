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

/**
 * Simplified Dashboard Data Hook
 * Eliminates infinite loops and circular dependencies
 * Loads all data once and provides simple filtering
 */
export function useDashboardData() {
  const { toast } = useToast();
  
  // Core state - simplified to essentials
  const [loading, setLoading] = useState(true);
  const [databaseError, setDatabaseError] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>("all");
  const [lastFetched, setLastFetched] = useState<number>(0);

  // Computed values - no complex caching needed for small datasets
  const filteredReviews = useMemo(() => {
    if (selectedBusiness === "all" || selectedBusiness === "All Businesses") {
      return allReviews;
    }
    return allReviews.filter(review => 
      review.title === selectedBusiness || 
      review.businesses?.name === selectedBusiness
    );
  }, [allReviews, selectedBusiness]);

  const businessStats = useMemo(() => {
    if (allReviews.length === 0) return {};
    return calculateBusinessStats(allReviews, allReviews.length);
  }, [allReviews]);

  const businessData = useMemo(() => ({
    allBusinesses: { name: "All Businesses", count: allReviews.length },
    businesses: businessStats,
  }), [allReviews.length, businessStats]);

  const enhancedAnalysis = useMemo(() => {
    if (selectedBusiness === "all" || selectedBusiness === "All Businesses" || filteredReviews.length === 0) {
      return null;
    }
    try {
      return generateEnhancedAnalysis(filteredReviews, selectedBusiness);
    } catch (error) {
      console.error("Error generating enhanced analysis:", error);
      return null;
    }
  }, [filteredReviews, selectedBusiness]);

  // Single data loading function - no pagination complexity
  const loadAllData = useCallback(async () => {
    setLoading(true);
    setDatabaseError(false);
    
    try {
      console.log("Loading all application data...");
      
      // Load businesses
      const { data: businessesData, error: businessesError } = await supabase
        .from('businesses')
        .select('*')
        .order('name');
      
      if (businessesError) {
        console.error("Error fetching businesses:", businessesError);
        setDatabaseError(true);
        toast({
          title: "Database Error",
          description: "Failed to load businesses. Please check your connection.",
          variant: "destructive",
        });
        return;
      }
      
      if (!businessesData || businessesData.length === 0) {
        console.error("No businesses found");
        setDatabaseError(true);
        toast({
          title: "No Data Found",
          description: "No businesses found in the database.",
          variant: "destructive",
        });
        return;
      }
      
      setBusinesses(businessesData);
      console.log(`Loaded ${businessesData.length} businesses`);
      
      // Load all reviews with business information
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          businesses:business_id (
            id,
            name,
            business_type
          )
        `)
        .order('publishedatdate', { ascending: false });
      
      if (reviewsError) {
        console.error("Error fetching reviews:", reviewsError);
        setDatabaseError(true);
        toast({
          title: "Database Error",
          description: "Failed to load reviews. Please check your connection.",
          variant: "destructive",
        });
        return;
      }
      
      if (!reviewsData) {
        console.log("No reviews found");
        setAllReviews([]);
        setLastFetched(Date.now());
        return;
      }
      
      // Process reviews to ensure compatibility
      const processedReviews = reviewsData.map(review => {
        const business = review.businesses as any;
        return {
          ...review,
          title: business?.name || 'Unknown Business',
          publishedAtDate: review.publishedAtDate || review.publishedatdate,
          businessName: business?.name,
        };
      });
      
      setAllReviews(processedReviews);
      setLastFetched(Date.now());
      
      console.log(`Loaded ${processedReviews.length} reviews`);
      
      toast({
        title: "Data loaded successfully",
        description: `Loaded ${processedReviews.length} reviews from ${businessesData.length} businesses`,
      });
      
    } catch (error) {
      console.error("Error loading data:", error);
      setDatabaseError(true);
      toast({
        title: "Loading Error",
        description: "An unexpected error occurred while loading data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Business selection handler - simple state update
  const handleBusinessChange = useCallback((businessName: string) => {
    console.log(`Business selection changed to: ${businessName}`);
    setSelectedBusiness(businessName);
  }, []);

  // Refresh function - reload all data
  const refreshData = useCallback(async () => {
    console.log("Refreshing all data...");
    await loadAllData();
  }, [loadAllData]);

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []); // No dependencies to prevent re-runs

  // Simple chart data function
  const getFilteredReviews = useCallback(() => filteredReviews, [filteredReviews]);

  return {
    // Core state
    loading,
    databaseError,
    businesses,
    selectedBusiness,
    businessData,
    
    // Data
    getFilteredReviews,
    getChartData,
    enhancedAnalysis,
    
    // Actions
    handleBusinessChange,
    refreshData,
    
    // Stats
    totalReviewCount: filteredReviews.length,
    lastFetched,
    
    // Simplified props for backward compatibility
    loadingMore: false,
    hasMoreData: false,
    allPagesLoaded: true,
    autoLoadingComplete: true,
    currentPage: 0,
    pageSize: allReviews.length,
    loadMoreData: () => {}, // No-op since we load all data at once
  };
}