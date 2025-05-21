import { supabase } from "@/integrations/supabase/client";
import { Review, TableName } from "@/types/reviews";
import { Business } from "@/types/reviews";
import { Recommendations } from "@/types/recommendations";

// Constants
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const DEBUG_MODE = false;
const MAX_REVIEWS_TO_FETCH = 10000; // Ensure we can fetch all reviews, even for large datasets

// In-memory caches
const tableCache = {
  tables: [] as TableName[],
  timestamp: 0,
};

const businessesCache = {
  data: [] as Business[],
  timestamp: 0,
};

const recommendationsCache = {
  data: {} as Record<string, any>,
  timestamp: 0,
};

/**
 * Clear all caches
 */
export const clearAllCaches = () => {
  console.log("Clearing all data caches");
  tableCache.tables = [];
  tableCache.timestamp = 0;
  businessesCache.data = [];
  businessesCache.timestamp = 0;
  recommendationsCache.data = {};
  recommendationsCache.timestamp = 0;
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
 * Fetch all reviews from a specific table (legacy method)
 */
export const fetchAllReviewsFromTable = async (
  tableName: TableName,
  startDate?: Date,
  endDate?: Date
): Promise<{ data: Review[], total: number }> => {
  try {
    console.log(`Fetching ALL reviews from table: ${tableName}`);
    
    // First get total count
    const countQuery = supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (startDate) {
      countQuery.gte('publishedAtDate', startDate.toISOString());
    }
    
    if (endDate) {
      countQuery.lte('publishedAtDate', endDate.toISOString());
    }
    
    const { count: totalCount, error: countError } = await countQuery;
    
    if (countError) {
      console.error(`Error counting reviews from ${tableName}:`, countError);
      return { data: [], total: 0 };
    }
    
    const total = totalCount || 0;
    
    if (total === 0) {
      return { data: [], total: 0 };
    }
    
    console.log(`Total ${total} reviews to fetch from ${tableName}`);
    
    // Now fetch all reviews in a single query
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
      return { data: [], total: 0 };
    }
    
    if (!data || data.length === 0) {
      console.log(`No reviews found for ${tableName}`);
      return { data: [], total: 0 };
    }
    
    // Add the business name as title for each review
    const processedReviews = data.map(review => ({
      ...review,
      title: tableName
    }));
    
    console.log(`Fetched ${processedReviews.length} reviews from ${tableName}`);
    return { 
      data: processedReviews, 
      total 
    };
  } catch (error) {
    console.error(`Error fetching reviews from ${tableName}:`, error);
    return { data: [], total: 0 };
  }
};

/**
 * Fetch reviews with pagination, supporting both new and legacy schema
 * In legacy mode, we'll fetch ALL reviews instead of using pagination
 */
export const fetchPaginatedReviews = async (
  page: number = 0,
  pageSize: number = 500,
  businessName?: string,
  startDate?: Date,
  endDate?: Date
): Promise<{ data: Review[], total: number, hasMore: boolean }> => {
  try {
    console.log(`Fetching reviews (page ${page + 1}, size ${pageSize})` + 
      (businessName ? ` for business "${businessName}"` : ''));
    
    // Check if we have the new reviews table
    const hasReviewsTable = await tableExists('reviews');
    
    if (hasReviewsTable) {
      console.log('Using new schema (reviews table)');
      
      // Using the new normalized schema
      const from = page * pageSize;
      
      // Build query for count
      let countQuery = supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true });
      
      // Add filters
      if (businessName && businessName !== 'All Businesses' && businessName !== 'all') {
        // First get business_id by name
        const { data: businessData } = await supabase
          .from('businesses')
          .select('id')
          .eq('name', businessName)
          .limit(1);
        
        if (businessData && businessData.length > 0) {
          const businessId = businessData[0].id;
          countQuery = countQuery.eq('business_id', businessId);
        }
      }
      
      // Add date filters if provided
      if (startDate) {
        countQuery = countQuery.gte('publishedatdate', startDate.toISOString());
      }
      
      if (endDate) {
        countQuery = countQuery.lte('publishedatdate', endDate.toISOString());
      }
      
      // Execute count query first
      const { count: totalCount, error: countError } = await countQuery;
      
      if (countError) {
        console.error('Error getting review count:', countError);
        return { data: [], total: 0, hasMore: false };
      }
      
      const total = totalCount || 0;
      
      // Build main query for data with pagination
      let dataQuery = supabase
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
      
      // Add the same filters as the count query
      if (businessName && businessName !== 'All Businesses' && businessName !== 'all') {
        const { data: businessData } = await supabase
          .from('businesses')
          .select('id')
          .eq('name', businessName)
          .limit(1);
          
        if (businessData && businessData.length > 0) {
          const businessId = businessData[0].id;
          dataQuery = dataQuery.eq('business_id', businessId);
        }
      }
      
      if (startDate) {
        dataQuery = dataQuery.gte('publishedatdate', startDate.toISOString());
      }
      
      if (endDate) {
        dataQuery = dataQuery.lte('publishedatdate', endDate.toISOString());
      }
      
      // For the first page, or if the result set is small, try to fetch all reviews at once
      if (page === 0 && total <= MAX_REVIEWS_TO_FETCH) {
        console.log(`Fetching all ${total} reviews at once`);
      } else {
        // Otherwise use pagination
        dataQuery = dataQuery.range(from, from + pageSize - 1);
      }
      
      // Execute the data query
      const { data, error } = await dataQuery;
      
      if (error) {
        console.error(`Error fetching reviews:`, error);
        return { data: [], total: 0, hasMore: false };
      }
      
      if (!data || data.length === 0) {
        console.log(`No reviews found for this query`);
        return { data: [], total, hasMore: false };
      }
      
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
      
      // Calculate if there are more reviews to fetch
      const hasMore = (from + processedReviews.length) < total;
      
      console.log(`Fetched ${processedReviews.length} reviews, total: ${total}, hasMore: ${hasMore}`);
      return { 
        data: processedReviews, 
        total, 
        hasMore 
      };
    } else {
      console.log('Using legacy schema (separate tables)');
      
      // With legacy schema, we'll get ALL reviews at once instead of using pagination
      
      // Get available tables
      const knownTables = await fetchAvailableTables();
      
      // If a business name is provided, only fetch from that table
      let tablesToFetch = knownTables;
      if (businessName && businessName !== 'All Businesses' && businessName !== 'all') {
        tablesToFetch = knownTables.filter(table => table === businessName);
      }
      
      if (tablesToFetch.length === 0) {
        console.warn('No tables available to fetch from');
        return { data: [], total: 0, hasMore: false };
      }
      
      // Fetch ALL reviews from all relevant tables
      let allReviews: Review[] = [];
      let totalAcrossTables = 0;
      
      // Fetch all reviews from all tables
      for (const table of tablesToFetch) {
        // Apply date filtering for all tables including "The Little Prince Cafe"
        const { data, total } = await fetchAllReviewsFromTable(table, startDate, endDate);
        allReviews.push(...data);
        totalAcrossTables += total;
      }
      
      // Sort by date
      allReviews.sort((a, b) => {
        const dateA = new Date(a.publishedAtDate || 0).getTime();
        const dateB = new Date(b.publishedAtDate || 0).getTime();
        return dateB - dateA; // Descending order
      });
      
      console.log(`Loaded ${allReviews.length} total reviews from all tables`);
      
      // Return all reviews since we've already loaded everything
      // Pagination will be done elsewhere if needed
      return {
        data: allReviews,
        total: totalAcrossTables,
        hasMore: false
      };
    }
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    return { data: [], total: 0, hasMore: false };
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

/**
 * Get the latest recommendation for a business
 */
export const getLatestRecommendation = async (businessId: string): Promise<any | null> => {
  try {
    // Return cached recommendation if available
    if (recommendationsCache.data[businessId] && recommendationsCache.timestamp > Date.now() - CACHE_TTL) {
      console.log(`Using cached recommendation for business ${businessId}`);
      return recommendationsCache.data[businessId];
    }
    
    console.log(`Fetching latest recommendation for business ${businessId}`);
    
    // Check if the saved_recommendations table exists
    const hasRecommendationsTable = await tableExists('saved_recommendations');
    
    if (!hasRecommendationsTable) {
      console.log('No recommendations table found');
      return null;
    }
    
    // Get the latest recommendation
    const { data, error } = await supabase
      .from('saved_recommendations')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error fetching recommendation:', error);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.log(`No recommendations found for business ${businessId}`);
      return null;
    }
    
    console.log(`Found recommendation for business ${businessId} from ${data[0].created_at}`);
    
    // Update cache
    recommendationsCache.data[businessId] = data[0];
    recommendationsCache.timestamp = Date.now();
    
    return data[0];
  } catch (error) {
    console.error('Failed to fetch latest recommendation:', error);
    return null;
  }
};

/**
 * Save a recommendation for a business
 */
export const saveRecommendation = async (businessId: string, recommendations: Recommendations): Promise<boolean> => {
  try {
    console.log(`Saving recommendation for business ${businessId}`);
    
    // Check if the saved_recommendations table exists
    const hasRecommendationsTable = await tableExists('saved_recommendations');
    
    if (!hasRecommendationsTable) {
      console.log('Creating saved_recommendations table...');
      
      // Create the table if it doesn't exist
      const { error: createError } = await supabase.rpc('create_recommendations_table');
      
      if (createError) {
        console.error('Error creating recommendations table:', createError);
        return false;
      }
    }
    
    // Add timestamp to recommendations
    const recommendationWithTimestamp = {
      ...recommendations,
      lastUpdated: new Date().toISOString()
    };
    
    // Save to database
    const { error } = await supabase
      .from('saved_recommendations')
      .insert({
        business_id: businessId,
        recommendations: recommendationWithTimestamp,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error saving recommendation:', error);
      return false;
    }
    
    console.log(`Recommendation saved for business ${businessId}`);
    
    // Update cache
    recommendationsCache.data[businessId] = {
      business_id: businessId,
      recommendations: recommendationWithTimestamp,
      created_at: new Date().toISOString()
    };
    recommendationsCache.timestamp = Date.now();
    
    return true;
  } catch (error) {
    console.error('Failed to save recommendation:', error);
    return false;
  }
};
