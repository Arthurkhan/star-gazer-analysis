import { supabase } from "@/integrations/supabase/client";
import { Review, TableName } from "@/types/reviews";
import { Business } from "@/types/reviews";

// Constants
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const DEBUG_MODE = false;

// In-memory caches
const tableCache = {
  tables: [] as TableName[],
  timestamp: 0,
};

const reviewsCache = {
  data: [] as Review[],
  timestamp: 0,
};

const businessesCache = {
  data: [] as Business[],
  timestamp: 0,
};

/**
 * Clear all caches
 */
export const clearAllCaches = () => {
  console.log("Clearing all data caches");
  tableCache.tables = [];
  tableCache.timestamp = 0;
  reviewsCache.data = [];
  reviewsCache.timestamp = 0;
  businessesCache.data = [];
  businessesCache.timestamp = 0;
};

/**
 * Check if a table exists in the database
 */
const tableExists = async (tableName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
      
    return !error;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
};

/**
 * Fetch all available tables
 */
export const fetchAvailableTables = async (): Promise<TableName[]> => {
  // Return cached tables if available and not expired
  if (tableCache.timestamp > Date.now() - CACHE_TTL) {
    console.log("Using cached tables");
    return tableCache.tables;
  }
  
  try {
    console.log("Checking for available tables...");
    
    // Check known legacy tables
    const knownTables: TableName[] = [
      "L'Envol Art Space",
      "The Little Prince Cafe", 
      "Vol de Nuit, The Hidden Bar"
    ];
    
    const availableTables: TableName[] = [];
    
    // Check each known table
    for (const tableName of knownTables) {
      const exists = await tableExists(tableName);
      if (exists) {
        console.log(`Table found: ${tableName}`);
        availableTables.push(tableName);
      }
    }
    
    // Update cache
    tableCache.tables = availableTables;
    tableCache.timestamp = Date.now();
    
    return availableTables;
  } catch (error) {
    console.error("Error fetching available tables:", error);
    return [];
  }
};

/**
 * Fetch reviews from a specific table
 */
export const fetchReviewsFromTable = async (
  tableName: TableName,
  startDate?: Date,
  endDate?: Date
): Promise<Review[]> => {
  try {
    console.log(`Fetching reviews from table: ${tableName}`);
    
    let query = supabase
      .from(tableName)
      .select('*')
      .order('publishedAtDate', { ascending: false });
    
    // Add date filters if provided
    if (startDate) {
      query = query.gte('publishedAtDate', startDate.toISOString());
    }
    
    if (endDate) {
      query = query.lte('publishedAtDate', endDate.toISOString());
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`Error fetching reviews from ${tableName}:`, error);
      return [];
    }
    
    // Add the business name as title for each review
    const processedReviews = data.map(review => ({
      ...review,
      title: tableName
    }));
    
    console.log(`Fetched ${processedReviews.length} reviews from ${tableName}`);
    return processedReviews;
  } catch (error) {
    console.error(`Error fetching reviews from ${tableName}:`, error);
    return [];
  }
};

/**
 * Fetch all reviews from all available tables
 */
export const fetchAllReviewData = async (
  tables: TableName[],
  startDate?: Date,
  endDate?: Date
): Promise<Review[]> => {
  // Return cached reviews if available and not expired
  if (reviewsCache.timestamp > Date.now() - CACHE_TTL) {
    console.log("Using cached reviews");
    return reviewsCache.data;
  }
  
  try {
    let allReviews: Review[] = [];
    
    // Try the new schema first (reviews table)
    const hasReviewsTable = await tableExists('reviews');
    
    if (hasReviewsTable) {
      console.log("Found unified reviews table, using new schema");
      allReviews = await fetchAllReviews(startDate, endDate);
    } else {
      console.log("Using legacy tables for reviews");
      // Fetch from each available table
      for (const tableName of tables) {
        const reviews = await fetchReviewsFromTable(tableName, startDate, endDate);
        allReviews = [...allReviews, ...reviews];
      }
    }
    
    console.log(`Total ${allReviews.length} reviews fetched across all businesses`);
    
    // Update cache
    reviewsCache.data = allReviews;
    reviewsCache.timestamp = Date.now();
    
    return allReviews;
  } catch (error) {
    console.error("Failed to fetch all review data:", error);
    return [];
  }
};

/**
 * Get all reviews - checks both new and legacy tables
 */
export const fetchAllReviews = async (
  startDate?: Date, 
  endDate?: Date
): Promise<Review[]> => {
  // Always bypass cache in debug mode
  const bypassCache = DEBUG_MODE;
  
  // Return cached reviews if available and not expired
  if (!bypassCache && reviewsCache.timestamp > Date.now() - CACHE_TTL) {
    console.log("Using cached reviews");
    return reviewsCache.data;
  }
  
  try {
    console.log("Fetching all reviews...");
    
    // Check if the reviews table exists
    const hasReviewsTable = await tableExists('reviews');
    
    // If we don't have the new reviews table, try legacy tables
    if (!hasReviewsTable) {
      console.log("Reviews table not found, trying legacy tables...");
      const knownTables: TableName[] = [
        "L'Envol Art Space",
        "The Little Prince Cafe", 
        "Vol de Nuit, The Hidden Bar"
      ];
      
      let allReviews: Review[] = [];
      
      // Check each legacy table
      for (const tableName of knownTables) {
        // Check if this table exists
        const exists = await tableExists(tableName);
        if (exists) {
          console.log(`Found legacy table: ${tableName}`);
          const reviews = await fetchReviewsFromTable(tableName, startDate, endDate);
          allReviews = [...allReviews, ...reviews];
        } else {
          console.log(`Legacy table does not exist: ${tableName}`);
        }
      }
      
      console.log(`Total ${allReviews.length} reviews fetched from legacy tables`);
      
      // Update cache
      reviewsCache.data = allReviews;
      reviewsCache.timestamp = Date.now();
      
      return allReviews;
    }
    
    // Otherwise, use the new schema
    let allReviews: Review[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;
    
    // First, get total count to track progress
    const { count: totalCount } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Total reviews in database: ${totalCount || 'unknown'}`);
    
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
        .limit(pageSize);
      
      // Apply range instead of offset for pagination
      if (from > 0) {
        query = query.range(from, from + pageSize - 1);
      }
      
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
        
        // Ensure publishedAtDate is also available (for backwards compatibility)
        const normalizedReview = {
          ...review,
          // Add the business name as title for backward compatibility
          title: business?.name || 'Unknown Business',
          // Add the camelCase version of publishedatdate if it doesn't exist
          publishedAtDate: review.publishedAtDate || review.publishedatdate
        };
        
        return normalizedReview;
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
 * Fetch all businesses
 */
export const fetchBusinesses = async (): Promise<Business[]> => {
  // Return cached businesses if available and not expired
  if (businessesCache.timestamp > Date.now() - CACHE_TTL) {
    console.log("Using cached businesses");
    return businessesCache.data;
  }
  
  try {
    console.log("Fetching businesses...");
    
    // Check if the businesses table exists
    const hasBusinessesTable = await tableExists('businesses');
    
    // If we have the businesses table, use it
    if (hasBusinessesTable) {
      console.log("Found businesses table, using new schema");
      
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('name');
      
      if (error) {
        console.error("Error fetching businesses:", error);
        return [];
      }
      
      if (!data || data.length === 0) {
        console.log("No businesses found in table");
        return [];
      }
      
      console.log(`Fetched ${data.length} businesses`);
      
      // Update cache
      businessesCache.data = data;
      businessesCache.timestamp = Date.now();
      
      return data;
    }
    
    // Fallback: Generate businesses from known tables
    console.log("No businesses table found, generating from known tables");
    const knownBusinesses: Business[] = [
      { id: '1', name: "L'Envol Art Space", business_type: "GALLERY" },
      { id: '2', name: "The Little Prince Cafe", business_type: "CAFE" },
      { id: '3', name: "Vol de Nuit, The Hidden Bar", business_type: "BAR" }
    ];
    
    // Update cache
    businessesCache.data = knownBusinesses;
    businessesCache.timestamp = Date.now();
    
    return knownBusinesses;
  } catch (error) {
    console.error("Failed to fetch businesses:", error);
    return [];
  }
};