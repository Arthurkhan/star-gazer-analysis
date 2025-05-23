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

  // Function to fetch ALL reviews using pagination to overcome Supabase limits
  const fetchAllReviewsWithPagination = async (): Promise<Review[]> => {
    console.log("🔍 Starting to fetch ALL reviews using pagination...");
    
    let allReviews: Review[] = [];
    let currentPage = 0;
    const pageSize = 1000; // Fetch in chunks of 1000
    let hasMore = true;
    
    // First, get the total count to know how much data we're dealing with
    const { count, error: countError } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error("❌ Error getting review count:", countError);
    } else {
      console.log(`📊 Total reviews in database: ${count}`);
    }
    
    while (hasMore) {
      console.log(`📄 Fetching page ${currentPage + 1} (rows ${currentPage * pageSize + 1}-${(currentPage + 1) * pageSize})...`);
      
      const { data: pageData, error } = await supabase
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
        .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);
      
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
      
      // Process and add reviews to our collection
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
      
      // If we got less than pageSize, we've reached the end
      if (pageData.length < pageSize) {
        console.log(`🏁 Got ${pageData.length} < ${pageSize} reviews, reached end of data`);
        hasMore = false;
      } else {
        currentPage++;
      }
      
      // Safety check to prevent infinite loops
      if (currentPage > 50) {
        console.warn("⚠️  Safety limit reached (50 pages), stopping fetch");
        hasMore = false;
      }
    }
    
    console.log(`🎉 Finished fetching! Total reviews collected: ${allReviews.length}`);
    return allReviews;
  };

  // Single data loading function - using pagination to get ALL data
  const loadAllData = useCallback(async () => {
    setLoading(true);
    setDatabaseError(false);
    
    try {
      console.log("🚀 Loading all application data...");
      
      // Load businesses
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
      
      // Load ALL reviews using pagination
      const allReviewsData = await fetchAllReviewsWithPagination();
      
      setAllReviews(allReviewsData);
      setLastFetched(Date.now());
      
      // Count reviews per business for verification
      const businessCounts = allReviewsData.reduce((acc, review) => {
        const businessName = review.businessName || review.title || 'Unknown';
        acc[businessName] = (acc[businessName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log("📊 Final review counts per business:", businessCounts);
      console.log(`🎯 Total reviews loaded: ${allReviewsData.length}`);
      
      toast({
        title: "Data loaded successfully",
        description: `Loaded ${allReviewsData.length} reviews from ${businessesData.length} businesses`,
      });
      
    } catch (error) {
      console.error("💥 Error loading data:", error);
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
    console.log(`🔄 Business selection changed to: ${businessName}`);
    setSelectedBusiness(businessName);
  }, []);

  // Refresh function - reload all data
  const refreshData = useCallback(async () => {
    console.log("🔄 Refreshing all data...");
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