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

// Debug mode - force fresh data every time during development
const DEBUG_MODE = false; // Set to false for production
const CACHE_TTL = 1000 * 60 * 5; // 5 minute cache TTL

// Cache for table existence
const tableExistenceCache: Record<string, boolean> = {};

/**
 * Check if a table exists in the database
 */
const tableExists = async (tableName: string): Promise<boolean> => {
  // If we've already checked this table in this session, return the cached result
  if (tableExistenceCache[tableName] !== undefined) {
    return tableExistenceCache[tableName];
  }
  
  try {
    console.log(`Checking if table '${tableName}' exists...`);
    
    // We'll try two approaches to determine if a table exists
    
    // First approach: Try to get the table schema
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('get_table_schema', { table_name: tableName })
      .select('*');
    
    // If this succeeds, the table exists
    if (!schemaError) {
      console.log(`Table '${tableName}' exists (schema approach)`);
      tableExistenceCache[tableName] = true;
      return true;
    }
    
    // Second approach: Try to select a row with head:true
    const { error } = await supabase
      .from(tableName)
      .select('*', { head: true })
      .limit(1);
    
    // The most reliable way is to check for specific error codes
    if (error) {
      if (
        error.code === '42P01' || // PostgreSQL "relation does not exist"
        error.code === 'PGRST116' || // PostgREST table not found
        error.message.includes('relation') && error.message.includes('does not exist')
      ) {
        console.log(`Table '${tableName}' does not exist`);
        tableExistenceCache[tableName] = false;
        return false;
      }
      
      // Other errors (like permissions) - we'll assume the table exists but we can't access it
      console.log(`Error checking if table '${tableName}' exists, but assuming it does:`, error);
      tableExistenceCache[tableName] = true;
      return true;
    }
    
    // No error means the table exists
    console.log(`Table '${tableName}' exists`);
    tableExistenceCache[tableName] = true;
    return true;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    // Default to assuming the table doesn't exist in case of unexpected errors
    tableExistenceCache[tableName] = false;
    return false;
  }
};

/**
 * Get all businesses from the database
 */
export const fetchBusinesses = async (): Promise<Business[]> => {
  console.log("Fetching businesses from database");
  
  try {
    // First check if we have a cached result
    if (!DEBUG_MODE && businessCache.timestamp > Date.now() - CACHE_TTL) {
      console.log("Using cached businesses");
      return businessCache.data;
    }
    
    // First check if the 'businesses' table exists
    const businessesTableExists = await tableExists('businesses');
    console.log("Businesses table exists:", businessesTableExists);
    
    if (!businessesTableExists) {
      console.log("Businesses table not found, using legacy approach");
      
      // If the table doesn't exist, create mock business entries from the old table names
      const knownTables: TableName[] = [
        "L'Envol Art Space",
        "The Little Prince Cafe", 
        "Vol de Nuit, The Hidden Bar"
      ];
      
      // Check which tables actually exist
      const existingTables: TableName[] = [];
      for (const table of knownTables) {
        if (await tableExists(table)) {
          existingTables.push(table);
        }
      }
      
      console.log("Found existing legacy tables:", existingTables);
      
      // Create mock business entries from the existing legacy tables
      const mockBusinesses: Business[] = existingTables.map((name, index) => ({
        id: `legacy-${index}`,
        name: name,
        business_type: BUSINESS_TYPE_MAPPINGS[name] || "OTHER",
        created_at: new Date().toISOString()
      }));
      
      console.log("Generated legacy businesses:", mockBusinesses);
      
      // Update cache
      businessCache.data = mockBusinesses;
      businessCache.timestamp = Date.now();
      
      return mockBusinesses;
    }
    
    // Try to query the businesses table
    const { data, error } = await supabase
      .from('businesses')
      .select('*');
    
    if (error) {
      console.error("Error fetching businesses:", error);
      return [];
    }
    
    console.log(`Found ${data?.length || 0} businesses in database`);
    
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
 * Fetch reviews from a specific table (legacy method)
 */
const fetchReviewsFromTable = async (
  tableName: TableName,
  startDate?: Date,
  endDate?: Date
): Promise<Review[]> => {
  console.log(`Fetching reviews from legacy table: ${tableName}`);
  
  try {
    let query = supabase
      .from(tableName)
      .select('*');
    
    // Add date filters if provided
    if (startDate) {
      query = query.gte('publishedAtDate', startDate.toISOString());
    }
    
    if (endDate) {
      query = query.lte('publishedAtDate', endDate.toISOString());
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`Error fetching reviews from table ${tableName}:`, error);
      return [];
    }
    
    console.log(`Fetched ${data?.length || 0} reviews from table ${tableName}`);
    
    // Transform data to match the new schema format
    const transformedData: Review[] = (data || []).map(item => ({
      id: item.id || `legacy-${Math.random().toString(36).substring(2, 11)}`,
      business_id: `legacy-${tableName}`,
      stars: item.stars,
      name: item.name,
      text: item.text,
      textTranslated: item.textTranslated,
      publishedAtDate: item.publishedAtDate,
      reviewUrl: item.reviewUrl,
      responseFromOwnerText: item.responseFromOwnerText,
      sentiment: item.sentiment,
      staffMentioned: item.staffMentioned,
      mainThemes: item.mainThemes,
      title: tableName,
      created_at: item.created_at || new Date().toISOString()
    }));
    
    return transformedData;
  } catch (error) {
    console.error(`Failed to fetch reviews from table ${tableName}:`, error);
    return [];
  }
};

/**
 * Fetch reviews by business ID with robust pagination
 */
export const fetchReviewsByBusinessId = async (
  businessId: string,
  startDate?: Date,
  endDate?: Date
): Promise<Review[]> => {
  console.log(`Fetching reviews for business ID: ${businessId}`);
  
  // Handle legacy business IDs
  if (businessId.startsWith('legacy-')) {
    const tableName = businessId.replace('legacy-', '') as TableName;
    console.log(`Handling legacy business ID for table: ${tableName}`);
    return fetchReviewsFromTable(tableName as TableName, startDate, endDate);
  }
  
  try {
    // Check if the reviews table exists
    const hasReviewsTable = await tableExists('reviews');
    if (!hasReviewsTable) {
      console.error("Reviews table does not exist!");
      return [];
    }
    
    let allReviews: Review[] = [];
    let page = 0;
    const pageSize = 1000; // Use a large page size to reduce round trips
    let hasMore = true;
    
    // Use pagination to fetch all reviews
    while (hasMore) {
      const from = page * pageSize;
      
      console.log(`Fetching page ${page+1} (from=${from}, limit=${pageSize}) for business ID ${businessId}`);
      
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
    // Try to get businesses first
    const businesses = await fetchBusinesses();
    
    if (businesses.length > 0) {
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
    }
    
    // If no businesses were found, check for legacy tables
    console.log("No businesses found, checking for legacy tables...");
    const knownTables: TableName[] = [
      "L'Envol Art Space",
      "The Little Prince Cafe", 
      "Vol de Nuit, The Hidden Bar"
    ];
    
    // Check which of these tables exist
    const existingTables: TableName[] = [];
    for (const tableName of knownTables) {
      if (await tableExists(tableName)) {
        existingTables.push(tableName);
      }
    }
    
    if (existingTables.length > 0) {
      console.log(`Found existing legacy tables: ${existingTables.join(', ')}`);
      return existingTables;
    }
    
    // If all else fails, return the known tables anyway
    console.log(`Using hardcoded table names: ${knownTables.join(', ')}`);
    return knownTables;
  } catch (error) {
    console.error("Failed to fetch tables:", error);
    
    // Fallback to the tables we know exist
    const knownTables: TableName[] = [
      "L'Envol Art Space",
      "The Little Prince Cafe", 
      "Vol de Nuit, The Hidden Bar"
    ];
    
    console.log(`Using hardcoded table names due to error: ${knownTables.join(', ')}`);
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
    
    if (allReviews.length === 0) {
      console.warn("No reviews found in fetchAllReviewData");
    }
    
    // If we have specific table names to filter by
    if (tables && tables.length > 0) {
      console.log(`Filtering reviews for specific tables: ${tables.join(', ')}`);
      
      // Filter reviews to only include those for the specified tables/businesses
      const filteredReviews = allReviews.filter(review => {
        // Check title field first (for backward compatibility)
        if (review.title && tables.includes(review.title as TableName)) {
          return true;
        }
        
        // Then check the business from the joined data
        const business = (review as any).businesses;
        if (business && business.name && tables.includes(business.name as TableName)) {
          return true;
        }
        
        return false;
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
  // Also clear the table existence cache
  Object.keys(tableExistenceCache).forEach(key => {
    delete tableExistenceCache[key];
  });
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
    // Check if the recommendations table exists
    const hasRecommendationsTable = await tableExists('recommendations');
    if (!hasRecommendationsTable) {
      console.error("Recommendations table does not exist!");
      return null;
    }
    
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
    // Check if the recommendations table exists
    const hasRecommendationsTable = await tableExists('recommendations');
    if (!hasRecommendationsTable) {
      console.error("Recommendations table does not exist!");
      return null;
    }
    
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
