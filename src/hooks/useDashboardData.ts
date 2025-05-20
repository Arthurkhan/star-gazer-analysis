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

// Add a mock data function to prevent unnecessary DB calls
const getMockReviewData = (): Review[] => {
  // Return a small set of mock reviews for development
  return Array(10).fill(null).map((_, i) => ({
    id: `mock-${i}`,
    stars: Math.floor(Math.random() * 5) + 1,
    name: `Mock User ${i}`,
    text: `This is a mock review ${i}`,
    textTranslated: '',
    publishedAtDate: new Date(Date.now() - i * 86400000).toISOString(),
    reviewUrl: '',
    responseFromOwnerText: i % 3 === 0 ? 'Thank you for your feedback!' : '',
    sentiment: i % 3 === 0 ? 'positive' : i % 3 === 1 ? 'neutral' : 'negative',
    staffMentioned: i % 4 === 0 ? 'John, Mary' : '',
    mainThemes: i % 2 === 0 ? 'service, quality' : 'ambiance, price',
  }));
};

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
      // Use mock data when possible to prevent excessive API calls
      const useMockData = !forceRefresh && process.env.NODE_ENV === 'development';
      
      if (useMockData) {
        console.log("Using mock data to prevent API calls");
        
        // Create mock businesses
        const mockBusinesses: Business[] = [
          { id: "1", name: "The Little Prince Cafe" },
          { id: "2", name: "Vol de Nuit The Hidden Bar" },
          { id: "3", name: "L'Envol Art Space" }
        ];
        
        setBusinesses(mockBusinesses);
        setAvailableTables(mockBusinesses.map(b => b.name) as TableName[]);
        
        // Get mock review data
        const mockReviews = getMockReviewData();
        setReviewData(mockReviews);
        setLastFetched(Date.now());
        
        // Calculate business statistics
        const businessesObj = calculateBusinessStats(mockReviews);
        setBusinessData({
          allBusinesses: { name: "All Businesses", count: mockReviews.length },
          businesses: businessesObj,
        });
        
        setLoading(false);
        return;
      }
      
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
      // Simple mock enhanced analysis
      setEnhancedAnalysis({
        temporalPatterns: {
          dayOfWeek: [
            { day: "Monday", count: 10 },
            { day: "Tuesday", count: 15 },
            { day: "Wednesday", count: 20 },
            { day: "Thursday", count: 18 },
            { day: "Friday", count: 25 },
            { day: "Saturday", count: 30 },
            { day: "Sunday", count: 12 }
          ],
          timeOfDay: [
            { time: "Morning (6AM-12PM)", count: 30 },
            { time: "Afternoon (12PM-5PM)", count: 45 },
            { time: "Evening (5PM-10PM)", count: 60 },
            { time: "Night (10PM-6AM)", count: 15 }
          ]
        },
        historicalTrends: [
          { period: "2023-01", avgRating: 4.2, reviewCount: 25 },
          { period: "2023-02", avgRating: 4.3, reviewCount: 30 },
          { period: "2023-03", avgRating: 4.1, reviewCount: 28 }
        ],
        reviewClusters: [
          { name: "Service", keywords: ["friendly", "attentive", "prompt"], count: 35, sentiment: "positive" },
          { name: "Food", keywords: ["delicious", "tasty", "fresh"], count: 42, sentiment: "positive" },
          { name: "Ambiance", keywords: ["cozy", "relaxing", "atmosphere"], count: 20, sentiment: "neutral" }
        ],
        seasonalAnalysis: [
          { season: "Winter", count: 30, avgRating: 4.0 },
          { season: "Spring", count: 35, avgRating: 4.2 },
          { season: "Summer", count: 40, avgRating: 4.5 },
          { season: "Fall", count: 25, avgRating: 4.1 }
        ],
        insights: [
          "Friday is the most active day for reviews, suggesting high customer engagement on this day.",
          "Most reviews are submitted during Evening (5PM-10PM), indicating peak customer activity during this timeframe.",
          "Average rating has improved by 0.2 stars in the most recent period, showing positive momentum.",
          `"Service" is mentioned positively in 35 reviews, representing a key strength.`,
          `${selectedBusiness} receives the highest ratings during Summer (4.5 stars), which could inform seasonal strategy planning.`
        ]
      });
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
