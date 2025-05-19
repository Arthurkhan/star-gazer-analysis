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
import { generateMockReviews } from "@/utils/mockDataGenerator";
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

  // Fallback to mock data if database connection fails
  const useMockData = useCallback(() => {
    console.log("Using mock data due to database issues");
    
    const { reviews, businesses } = generateMockReviews();
    
    setBusinesses(businesses);
    setReviewData(reviews);
    setLastFetched(Date.now());
    
    // Calculate business statistics from mock data
    const businessesObj = calculateBusinessStats(reviews);
    
    // Update business data
    setBusinessData({
      allBusinesses: { name: "All Businesses", count: reviews.length },
      businesses: businessesObj,
    });
    
    // Set available tables based on mock businesses
    const mockTables = businesses.map(b => b.name) as TableName[];
    setAvailableTables(mockTables);
    
    toast({
      title: "Using demo data",
      description: "Database connection failed. Using demo data for preview.",
      variant: "warning",
    });
  }, [setBusinessData, toast]);

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
        useMockData();
        setLoading(false);
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
        useMockData();
        setLoading(false);
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
        console.warn("No reviews found - using mock data");
        setDatabaseError(true);
        useMockData();
        setLoading(false);
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
      useMockData();
      
      toast({
        title: "Error fetching data",
        description: "Could not fetch review data from the database. Using mock data for preview.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, setBusinessData, startDate, endDate, useMockData]);

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

  // Generate mock enhanced analysis when recommendations are created
  // In a real implementation, this would come from your AI analysis
  useEffect(() => {
    if (selectedBusiness && selectedBusiness !== 'all') {
      // Create mock enhanced analysis data
      // This would normally come from your AI service
      const mockEnhancedAnalysis: EnhancedAnalysis = {
        temporalPatterns: [
          {
            pattern: 'daily',
            description: 'Daily review distribution shows peaks on weekends',
            strength: 0.78,
            data: Array.from({ length: 7 }, (_, i) => ({
              period: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
              metric: 'Reviews',
              value: Math.floor(Math.random() * 30) + 5,
              trend: i < 3 ? 'stable' : (i < 5 ? 'increasing' : 'decreasing')
            }))
          },
          {
            pattern: 'weekly',
            description: 'Weekly patterns show consistent engagement',
            strength: 0.65,
            data: Array.from({ length: 4 }, (_, i) => ({
              period: `Week ${i + 1}`,
              metric: 'Reviews',
              value: Math.floor(Math.random() * 100) + 20,
              trend: Math.random() > 0.5 ? 'increasing' : 'decreasing'
            }))
          },
          {
            pattern: 'monthly',
            description: 'Monthly activity shows seasonal fluctuations',
            strength: 0.82,
            data: Array.from({ length: 6 }, (_, i) => ({
              period: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i],
              metric: 'Reviews',
              value: Math.floor(Math.random() * 200) + 50,
              trend: Math.random() > 0.5 ? 'increasing' : 'decreasing'
            }))
          }
        ],
        historicalTrends: [
          {
            metric: 'Average Rating',
            timeframe: 'month',
            data: Array.from({ length: 6 }, (_, i) => ({
              period: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i],
              value: 3 + Math.random() * 1.8,
              percentageChange: Math.random() * 10 - 5
            })),
            trend: 'improving',
            forecast: {
              nextPeriod: 'Jul',
              predictedValue: 4.2,
              confidence: 0.75
            }
          },
          {
            metric: 'Positive Sentiment',
            timeframe: 'month',
            data: Array.from({ length: 6 }, (_, i) => ({
              period: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i],
              value: 50 + Math.random() * 30,
              percentageChange: Math.random() * 15 - 7
            })),
            trend: 'stable',
            forecast: {
              nextPeriod: 'Jul',
              predictedValue: 72,
              confidence: 0.65
            }
          }
        ],
        reviewClusters: [
          {
            id: 'cluster-5star',
            name: 'Delighted Customers',
            description: 'Highly satisfied customers giving 5-star reviews',
            reviewCount: 125,
            averageRating: 5.0,
            sentiment: 'positive',
            keywords: ['amazing', 'excellent', 'perfect', 'recommend', 'wonderful'],
            examples: ['Amazing experience from start to finish. The staff was incredibly attentive!'],
            insights: ['Strong positive sentiment around staff interactions', 'Product quality consistently praised']
          },
          {
            id: 'cluster-negative',
            name: 'Dissatisfied Customers',
            description: 'Customers reporting issues with service or products',
            reviewCount: 32,
            averageRating: 1.8,
            sentiment: 'negative',
            keywords: ['disappointing', 'slow', 'poor', 'waste', 'rude'],
            examples: ['Service was extremely slow and the staff seemed uninterested in helping.'],
            insights: ['Wait times mentioned frequently', 'Staff attitude needs improvement']
          },
          {
            id: 'cluster-1',
            name: 'Service Appreciators',
            description: 'Customers who value great service',
            reviewCount: 87,
            averageRating: 4.2,
            sentiment: 'positive',
            keywords: ['service', 'staff', 'helpful', 'friendly', 'attentive'],
            examples: ['The service was outstanding, very attentive and professional.'],
            insights: ['Staff training is paying off', 'Personal attention is valued']
          },
          {
            id: 'cluster-2',
            name: 'Ambiance Enthusiasts',
            description: 'Customers focusing on atmosphere and environment',
            reviewCount: 64,
            averageRating: 4.5,
            sentiment: 'positive',
            keywords: ['atmosphere', 'beautiful', 'cozy', 'ambiance', 'decor'],
            examples: ['The atmosphere was perfect for our anniversary dinner.'],
            insights: ['Recent renovations well-received', 'Evening lighting particularly appreciated']
          },
          {
            id: 'cluster-3',
            name: 'Value Seekers',
            description: 'Customers concerned with price and value',
            reviewCount: 43,
            averageRating: 3.7,
            sentiment: 'mixed',
            keywords: ['price', 'expensive', 'value', 'worth', 'overpriced'],
            examples: ['Good food but a bit overpriced for what you get.'],
            insights: ['Price point sensitivity increasing', 'Value perception could be improved']
          },
          {
            id: 'cluster-4',
            name: 'Product Quality Focus',
            description: 'Customers emphasizing product quality',
            reviewCount: 78,
            averageRating: 4.1,
            sentiment: 'positive',
            keywords: ['quality', 'fresh', 'delicious', 'tasty', 'authentic'],
            examples: ['Everything was so fresh and authentic, just like in Italy!'],
            insights: ['Ingredient quality stands out', 'Authenticity is valued']
          }
        ],
        seasonalAnalysis: [
          {
            season: 'summer',
            name: 'Summer Season',
            dateRange: {
              start: 'June 1',
              end: 'August 31'
            },
            metrics: {
              avgRating: 4.3,
              reviewVolume: 328,
              sentiment: 0.76,
              topThemes: ['outdoor seating', 'cold drinks', 'evening ambiance']
            },
            comparison: {
              vsYearAverage: 12.4,
              vsPreviousYear: 8.2
            },
            recommendations: [
              'Expand outdoor seating options',
              'Promote summer specials more aggressively',
              'Consider extending evening hours'
            ]
          },
          {
            season: 'winter',
            name: 'Holiday Season',
            dateRange: {
              start: 'November 15',
              end: 'January 15'
            },
            metrics: {
              avgRating: 4.1,
              reviewVolume: 412,
              sentiment: 0.68,
              topThemes: ['holiday specials', 'wait times', 'festive atmosphere']
            },
            comparison: {
              vsYearAverage: 5.8,
              vsPreviousYear: -2.3
            },
            recommendations: [
              'Improve staffing during peak holiday hours',
              'Streamline ordering process to reduce wait times',
              'Enhance holiday decorations and ambiance'
            ]
          }
        ],
        insights: {
          keyFindings: [
            'Customer satisfaction trending upward over the past quarter',
            'Service quality is the most impactful factor in positive reviews',
            'Weekend peak times need better staff allocation',
            'Menu variety is widely appreciated across customer segments'
          ],
          opportunities: [
            'Expanding outdoor seating could drive summer revenue',
            'Staff training on product knowledge shows high ROI',
            'Loyalty program mentions indicate expansion potential',
            'Morning hours show untapped customer potential'
          ],
          risks: [
            'Increased mentions of price sensitivity in recent reviews',
            'Wait times during peak hours generating negative sentiment',
            'Competitor mentions up 15% in comparison reviews',
            'Consistency issues appearing in food quality reviews'
          ]
        }
      };
      
      setEnhancedAnalysis(mockEnhancedAnalysis);
    } else {
      setEnhancedAnalysis(null);
    }
  }, [selectedBusiness]);

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
