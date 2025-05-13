
import { supabase } from "@/integrations/supabase/client";
import { Review, TableName } from "@/types/reviews";
import { useToast } from "@/hooks/use-toast";

/**
 * Fetches data from a Supabase table with pagination to handle large datasets
 */
export const fetchTableDataWithPagination = async (tableName: TableName) => {
  console.log(`Fetching data from table: ${tableName} with pagination`);
  
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
  return allData;
};

/**
 * Fetches available tables from Supabase
 */
export const fetchAvailableTables = async (): Promise<TableName[]> => {
  try {
    // We'll use the predefined tables instead of querying for them
    const knownTables: TableName[] = [
      "L'Envol Art Space",
      "The Little Prince Cafe", 
      "Vol de Nuit, The Hidden Bar"
    ];
    
    console.log("Using known tables:", knownTables);
    return knownTables;
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
 * Fetches review data from all available tables
 */
export const fetchAllReviewData = async (tables: TableName[]): Promise<Review[]> => {
  let allReviews: Review[] = [];
  console.log("Fetching data from tables:", tables);
  
  for (const tableName of tables) {
    console.log(`Starting data fetch from table: ${tableName}`);
    
    try {
      // Use the pagination function to fetch all data
      const tableData = await fetchTableDataWithPagination(tableName);
      
      if (tableData && tableData.length > 0) {
        // Map the data to our Review type, handling possible column name variations
        const reviews = tableData.map((item: any) => ({
          name: item.name,
          title: item.title || tableName, // Use table name if title is missing
          star: item.stars || item.star, // Handle both column names
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
        
        allReviews = [...allReviews, ...reviews];
      }
    } catch (tableError) {
      console.error(`Failed to query table ${tableName}:`, tableError);
      // Continue with the next table
    }
  }
  
  console.log(`Total reviews fetched across all tables: ${allReviews.length}`);
  return allReviews;
};
