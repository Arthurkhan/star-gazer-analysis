import { supabase } from "@/integrations/supabase/client";
import { Review, TableName } from "@/types/reviews";

// Define a proper cache entry type
interface TableCacheEntry {
  timestamp: number;
  data: any[];
}

// Cache for table data to reduce database load
const tableDataCache = new Map<string, TableCacheEntry>();
const TABLE_CACHE_TTL = 1000 * 60 * 5; // 5 minute cache TTL

/**
 * Fetches data from a Supabase table with pagination to handle large datasets
 * With caching for better performance
 */
export const fetchTableDataWithPagination = async (tableName: TableName) => {
  console.log(`Fetching data from table: ${tableName}`);
  
  // Check if we have a cached result
  const cacheEntry = tableDataCache.get(tableName);
  if (cacheEntry && cacheEntry.timestamp > Date.now() - TABLE_CACHE_TTL) {
    console.log(`Using cached data for ${tableName}`);
    return cacheEntry.data;
  }
  
  let allData: any[] = [];
  let hasMore = true;
  let page = 0;
  const pageSize = 1000; // Supabase default limit
  
  while (hasMore) {
    try {
      // Calculate the range start based on the current page
      const rangeStart = page * pageSize;
      const rangeEnd = rangeStart + pageSize - 1;
      
      console.log(`Fetching page ${page+1} (rows ${rangeStart}-${rangeEnd}) from ${tableName}`);
      
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .range(rangeStart, rangeEnd);
      
      if (error) {
        console.error(`Error fetching page ${page+1} from ${tableName}:`, error);
        break;
      }
      
      if (data && data.length > 0) {
        console.log(`Retrieved ${data.length} rows from ${tableName}, page ${page+1}`);
        allData = [...allData, ...data];
        
        // Check if we've received fewer rows than the page size, indicating we're done
        hasMore = data.length === pageSize;
        
        // If count is available, we can be more precise
        if (count !== null) {
          hasMore = allData.length < count;
        }
      } else {
        // No more data
        hasMore = false;
      }
      
      page++;
    } catch (tableError) {
      console.error(`Failed to query table ${tableName} at page ${page+1}:`, tableError);
      break;
    }
  }
  
  console.log(`Total rows fetched from ${tableName}: ${allData.length}`);
  
  // Cache the result with the proper structure
  tableDataCache.set(tableName, {
    timestamp: Date.now(),
    data: allData
  });
  
  return allData;
};

/**
 * Cache for available tables
 */
let availableTablesCache: TableName[] | null = null;
let tablesLastFetched = 0;

/**
 * Fetches available tables from Supabase
 */
export const fetchAvailableTables = async (): Promise<TableName[]> => {
  // Return cached tables if available and not expired
  if (availableTablesCache && tablesLastFetched > Date.now() - (1000 * 60 * 60)) {
    console.log("Using cached tables list");
    return availableTablesCache;
  }
  
  try {
    // We'll use the predefined tables instead of querying for them
    const knownTables: TableName[] = [
      "L'Envol Art Space",
      "The Little Prince Cafe", 
      "Vol de Nuit, The Hidden Bar"
    ];
    
    console.log("Using known tables:", knownTables);
    
    // Update cache
    availableTablesCache = knownTables;
    tablesLastFetched = Date.now();
    
    return knownTables;
  } catch (error) {
    console.error("Failed to fetch tables:", error);
    
    // Fallback to the tables we know exist
    const knownTables: TableName[] = [
      "L'Envol Art Space",
      "The Little Prince Cafe", 
      "Vol de Nuit, The Hidden Bar"
    ];
    
    // Update cache with fallback
    availableTablesCache = knownTables;
    tablesLastFetched = Date.now();
    
    return knownTables;
  }
};

/**
 * Cache for all reviews data
 */
let allReviewsCache: Review[] | null = null;
let reviewsLastFetched = 0;

/**
 * Fetches review data from all available tables
 * With caching for better performance
 */
export const fetchAllReviewData = async (tables: TableName[]): Promise<Review[]> => {
  // Return cached reviews if available and not expired (10 minutes TTL)
  if (allReviewsCache && reviewsLastFetched > Date.now() - (1000 * 60 * 10)) {
    console.log("Using cached reviews data");
    return allReviewsCache;
  }
  
  let allReviews: Review[] = [];
  console.log("Fetching data from tables:", tables);
  
  // Use Promise.all to fetch data from all tables in parallel
  const tableDataPromises = tables.map(async (tableName) => {
    console.log(`Starting data fetch from table: ${tableName}`);
    
    try {
      // Use the pagination function to fetch all data
      const tableData = await fetchTableDataWithPagination(tableName);
      
      if (tableData && tableData.length > 0) {
        // Map the data to our Review type, handling possible column name variations
        return tableData.map((item: any) => ({
          name: item.name,
          title: item.title || tableName, // Use table name if title is missing
          stars: item.stars || item.star, // Handle both column names
          originalLanguage: item.originalLanguage,
          text: item.text,
          textTranslated: item.textTranslated,
          responseFromOwnerText: item.responseFromOwnerText,
          publishedAtDate: item.publishedAtDate,
          reviewUrl: item.reviewUrl,
          sentiment: item.sentiment,
          staffMentioned: item.staffMentioned,
          mainThemes: item.mainThemes,
          "common terms": item["common terms"]
        }));
      }
      return [];
    } catch (tableError) {
      console.error(`Failed to query table ${tableName}:`, tableError);
      return [];
    }
  });
  
  // Wait for all table data to be fetched
  const tableResults = await Promise.all(tableDataPromises);
  
  // Combine all results
  allReviews = tableResults.flat();
  
  console.log(`Total reviews fetched across all tables: ${allReviews.length}`);
  
  // Update cache
  allReviewsCache = allReviews;
  reviewsLastFetched = Date.now();
  
  return allReviews;
};

/**
 * Clear all caches - useful when forcing a refresh
 */
export const clearAllCaches = () => {
  tableDataCache.clear();
  availableTablesCache = null;
  allReviewsCache = null;
  console.log("All data caches cleared");
};
