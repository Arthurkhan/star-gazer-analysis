import { supabase } from "@/integrations/supabase/client";
import { Review, Business, TableName } from "@/types/reviews";
import { BUSINESS_TYPE_MAPPINGS } from "@/types/BusinessMappings";

// Cache for business data
interface BusinessCacheEntry {
  timestamp: number;
  data: Business[];
}

// Cache for review data
interface ReviewCacheEntry {
  timestamp: number;
  data: Review[];
}

// Cache for tables
const businessCache: BusinessCacheEntry = {
  timestamp: 0,
  data: []
};

// Cache for reviews
const reviewsCache: ReviewCacheEntry = {
  timestamp: 0,
  data: []
};

const CACHE_TTL = 1000 * 60 * 5; // 5 minute cache TTL

/**
 * Get all businesses from the database
 */
export const fetchBusinesses = async (): Promise<Business[]> => {
  // Return cached businesses if available and not expired
  if (businessCache.timestamp > Date.now() - CACHE_TTL) {
    console.log("Using cached businesses");
    return businessCache.data;
  }
  
  try {
    console.log("Fetching businesses from database");
    const { data, error } = await supabase
      .from('businesses')
      .select('*');
    
    if (error) {
      console.error("Error fetching businesses:", error);
      throw error;
    }
    
    // Update cache
    businessCache.data = data || [];
    businessCache.timestamp = Date.now();
    
    return data || [];
  } catch (error) {
    console.error("Failed to fetch businesses:", error);
    return [];
  }
};

/**
 * Fetch reviews by business ID with pagination to handle large datasets
 */
export const fetchReviewsByBusinessId = async (
  businessId: string,
  startDate?: Date,
  endDate?: Date
): Promise<Review[]> => {
  console.log(`Fetching reviews for business ID: ${businessId}`);
  
  try {
    let allReviews: Review[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;
    
    // Use pagination to fetch all reviews
    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      console.log(`Fetching page ${page+1} (${from}-${to}) for business ID ${businessId}`);
      
      let query = supabase
        .from('reviews')
        .select('*', { count: 'exact' })
        .eq('business_id', businessId)
        .order('publishedatdate', { ascending: false })
        .range(from, to);
      
      // Add date filters if provided
      if (startDate) {
        query = query.gte('publishedatdate', startDate.toISOString());
      }
      
      if (endDate) {
        query = query.lte('publishedatdate', endDate.toISOString());
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error(`Error fetching reviews page ${page+1} for business ID ${businessId}:`, error);
        break;
      }
      
      if (!data || data.length === 0) {
        break;
      }
      
      allReviews = [...allReviews, ...data];
      page++;
      
      // Check if we've reached the end
      hasMore = data.length === pageSize;
      
      // If we have the count, we can be more precise
      if (count !== null && allReviews.length >= count) {
        hasMore = false;
      }
    }
    
    console.log(`Total ${allReviews.length} reviews fetched for business ID ${businessId}`);
    return allReviews;
  } catch (error) {
    console.error(`Failed to fetch reviews for business ID ${businessId}:`, error);
    return [];
  }
};

/**
 * Get all reviews with business information - using pagination to get ALL reviews
 */
export const fetchAllReviews = async (
  startDate?: Date, 
  endDate?: Date
): Promise<Review[]> => {
  // Return cached reviews if available and not expired
  if (reviewsCache.timestamp > Date.now() - CACHE_TTL) {
    console.log("Using cached reviews");
    return reviewsCache.data;
  }
  
  try {
    console.log("Fetching all reviews with business information");
    
    let allReviews: Review[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;
    
    // Use pagination to fetch all reviews
    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      console.log(`Fetching page ${page+1} (${from}-${to}) of all reviews`);
      
      let query = supabase
        .from('reviews')
        .select(`
          *,
          businesses:business_id (
            id,
            name,
            business_type
          )
        `, { count: 'exact' })
        .order('publishedatdate', { ascending: false })
        .range(from, to);
      
      // Add date filters if provided
      if (startDate) {
        query = query.gte('publishedatdate', startDate.toISOString());
      }
      
      if (endDate) {
        query = query.lte('publishedatdate', endDate.toISOString());
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error(`Error fetching reviews page ${page+1}:`, error);
        break;
      }
      
      if (!data || data.length === 0) {
        break;
      }
      
      // Process and transform the data
      const processedReviews = data.map(review => {
        const business = review.businesses as any;
        return {
          ...review,
          // Add the business name as title for backward compatibility
          title: business?.name || 'Unknown Business'
        };
      });
      
      allReviews = [...allReviews, ...processedReviews];
      page++;
      
      // Check if we've reached the end
      hasMore = data.length === pageSize;
      
      // If we have the count, we can be more precise
      if (count !== null && allReviews.length >= count) {
        hasMore = false;
      }
    }
    
    console.log(`Total ${allReviews.length} reviews fetched across all businesses`);
    
    // Update cache
    reviewsCache.data = allReviews;
    reviewsCache.timestamp = Date.now();
    
    return allReviews;
  } catch (error) {
    console.error("Failed to fetch all reviews:", error);
    return [];
  }
};

/**
 * Legacy method to keep backward compatibility
 * Maps to the new schema under the hood
 */
export const fetchAvailableTables = async (): Promise<TableName[]> => {
  try {
    const businesses = await fetchBusinesses();
    
    // Return only the business names that match our TableName type
    const businessNames = businesses
      .map(business => business.name)
      .filter(name => 
        name === "L'Envol Art Space" || 
        name === "The Little Prince Cafe" || 
        name === "Vol de Nuit, The Hidden Bar"
      ) as TableName[];
    
    // If we don't find any businesses matching our expected names,
    // use the first three business names instead
    if (businessNames.length === 0 && businesses.length > 0) {
      return businesses.slice(0, 3).map(b => b.name) as TableName[];
    }
    
    return businessNames;
  } catch (error) {
    console.error("Failed to fetch tables:", error);
    
    // Fallback to the tables we know exist
    const knownTables: TableName[] = [
      "L'Envol Art Space",
      "The Little Prince Cafe", 
      "Vol de Nuit, The Hidden Bar"
    ];
    
    return knownTables;
  }
};

/**
 * Legacy method for backward compatibility
 * Uses the new database schema under the hood
 */
export const fetchAllReviewData = async (
  tables: TableName[],
  startDate?: Date,
  endDate?: Date
): Promise<Review[]> => {
  try {
    // Get all reviews
    const allReviews = await fetchAllReviews(startDate, endDate);
    
    // If we have specific table names to filter by
    if (tables && tables.length > 0) {
      // Get businesses for the table names
      const businesses = await fetchBusinesses();
      const businessMap = new Map(businesses.map(b => [b.name, b.id]));
      
      // Filter reviews to only include those for the specified tables/businesses
      return allReviews.filter(review => {
        // Get the business from the joined data
        const business = (review as any).businesses;
        if (!business) return false;
        
        // Check if the business name is in our tables list
        return tables.includes(business.name as TableName);
      });
    }
    
    return allReviews;
  } catch (error) {
    console.error("Failed to fetch all review data:", error);
    return [];
  }
};

/**
 * Clear all caches - useful when forcing a refresh
 */
export const clearAllCaches = () => {
  businessCache.timestamp = 0;
  businessCache.data = [];
  reviewsCache.timestamp = 0;
  reviewsCache.data = [];
  console.log("All data caches cleared");
};

/**
 * Save a recommendation to the database
 */
export const saveRecommendation = async (
  businessId: string,
  recommendations: any
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('recommendations')
      .insert({
        business_id: businessId,
        recommendations: recommendations
      })
      .select('id');
    
    if (error) {
      console.error("Error saving recommendation:", error);
      throw error;
    }
    
    return data?.[0]?.id || null;
  } catch (error) {
    console.error("Failed to save recommendation:", error);
    return null;
  }
};

/**
 * Get latest recommendation for a business
 */
export const getLatestRecommendation = async (
  businessId: string
): Promise<any | null> => {
  try {
    const { data, error } = await supabase
      .from('recommendations')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error("Error fetching latest recommendation:", error);
      throw error;
    }
    
    return data?.[0] || null;
  } catch (error) {
    console.error("Failed to fetch latest recommendation:", error);
    return null;
  }
};
