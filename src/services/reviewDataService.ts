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
 * Fetch reviews by business ID with robust pagination to handle large datasets
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
    const pageSize = 1000; // Use a large page size to reduce round trips
    let hasMore = true;
    
    // Use pagination to fetch all reviews
    while (hasMore) {
      const from = page * pageSize;
      
      console.log(`Fetching page ${page+1} (from=${from}, limit=${pageSize}) for business ID ${businessId}`);
      
      // Use .range() is unreliable with larger datasets, so using limit/offset instead
      let query = supabase
        .from('reviews')
        .select('*', { count: 'exact' })
        .eq('business_id', businessId)
        .order('publishedatdate', { ascending: false })
        .limit(pageSize)
        .offset(from);
      
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
        console.log(`No more reviews found for business ID ${businessId} at page ${page+1}`);
        break;
      }
      
      console.log(`Fetched ${data.length} reviews for page ${page+1}`);
      allReviews = [...allReviews, ...data];
      page++;
      
      // Check if we've reached the end - only if we got fewer results than requested
      hasMore = data.length === pageSize;
      
      // Log progress
      if (count !== null) {
        console.log(`Progress: ${allReviews.length}/${count} reviews (${Math.round(allReviews.length/count*100)}%)`);
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
  // For cache busting during debugging
  const bypassCache = true;
  
  // Return cached reviews if available and not expired
  if (!bypassCache && reviewsCache.timestamp > Date.now() - CACHE_TTL) {
    console.log("Using cached reviews");
    return reviewsCache.data;
  }
  
  try {
    console.log("Fetching all reviews with business information");
    
    let allReviews: Review[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;
    
    // First, get total count to track progress
    const { count: totalCount } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Total reviews in database: ${totalCount}`);
    
    // Use pagination to fetch all reviews
    while (hasMore) {
      const from = page * pageSize;
      
      console.log(`Fetching page ${page+1} (from=${from}, limit=${pageSize}) of all reviews`);
      
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
        .limit(pageSize)
        .offset(from);
      
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
        console.log(`No more reviews found at page ${page+1}`);
        break;
      }
      
      console.log(`Fetched ${data.length} reviews for page ${page+1}`);
      
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
      
      // Check if we've reached the end - only if we got fewer results than requested
      hasMore = data.length === pageSize;
      
      // Log progress
      if (totalCount !== null) {
        console.log(`Progress: ${allReviews.length}/${totalCount} reviews (${Math.round(allReviews.length/totalCount*100)}%)`);
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
    
    console.log(`Found business names matching our expected tables: ${businessNames.join(', ')}`);
    
    // If we don't find any businesses matching our expected names,
    // use the first three business names instead
    if (businessNames.length === 0 && businesses.length > 0) {
      const fallbackNames = businesses.slice(0, 3).map(b => b.name) as TableName[];
      console.log(`Using fallback business names: ${fallbackNames.join(', ')}`);
      return fallbackNames;
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
    
    console.log(`Using hardcoded table names: ${knownTables.join(', ')}`);
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
      console.log(`Filtering reviews for specific tables: ${tables.join(', ')}`);
      
      // Get businesses for the table names
      const businesses = await fetchBusinesses();
      const businessMap = new Map(businesses.map(b => [b.name, b.id]));
      
      // Filter reviews to only include those for the specified tables/businesses
      const filteredReviews = allReviews.filter(review => {
        // Get the business from the joined data
        const business = (review as any).businesses;
        if (!business) return false;
        
        // Check if the business name is in our tables list
        return tables.includes(business.name as TableName);
      });
      
      console.log(`Filtered down to ${filteredReviews.length} reviews for the specified tables`);
      return filteredReviews;
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
