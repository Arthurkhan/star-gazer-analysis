import { supabase } from "@/integrations/supabase/client";
import { Review } from "@/types/reviews";

/**
 * Legacy Review Service for handling business-named tables
 * Provides proper date filtering at the database level
 */

/**
 * Fetch reviews from a legacy business-named table with date filtering
 */
export const fetchLegacyReviewsWithDateFilter = async (
  tableName: string,
  startDate?: Date,
  endDate?: Date
): Promise<Review[]> => {
  try {
    console.log(`Fetching reviews from legacy table: ${tableName}`);
    console.log(`Date range: ${startDate?.toISOString()} to ${endDate?.toISOString()}`);
    
    let query = supabase.from(tableName).select('*');
    
    // Apply date filtering at the database level
    if (startDate || endDate) {
      // Convert dates to ISO strings for comparison
      if (startDate && endDate) {
        // Both dates provided - use range
        query = query
          .gte('publishedAtDate', startDate.toISOString())
          .lte('publishedAtDate', endDate.toISOString());
      } else if (startDate) {
        // Only start date
        query = query.gte('publishedAtDate', startDate.toISOString());
      } else if (endDate) {
        // Only end date
        query = query.lte('publishedAtDate', endDate.toISOString());
      }
    }
    
    // Order by date descending
    query = query.order('publishedAtDate', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`Error fetching from ${tableName}:`, error);
      throw error;
    }
    
    if (!data) {
      console.log(`No data found in ${tableName}`);
      return [];
    }
    
    // Process reviews to ensure consistent format
    const processedReviews = data.map(review => ({
      ...review,
      title: tableName, // Use table name as title for legacy compatibility
      businessName: tableName,
      // Ensure we have the date field consistently named
      publishedAtDate: review.publishedAtDate || review.publishedatdate,
    }));
    
    console.log(`Fetched ${processedReviews.length} reviews from ${tableName} with date filter`);
    return processedReviews;
  } catch (error) {
    console.error(`Failed to fetch reviews from legacy table ${tableName}:`, error);
    throw error;
  }
};

/**
 * Check if a table exists in the database
 */
export const checkTableExists = async (tableName: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('stars')
      .limit(1);
    
    return !error;
  } catch (error) {
    return false;
  }
};

/**
 * Get all available legacy business tables
 */
export const getLegacyBusinessTables = async (): Promise<string[]> => {
  const knownBusinesses = [
    "The Little Prince Cafe",
    "Vol de Nuit, The Hidden Bar",
    "L'Envol Art Space"
  ];
  
  const existingTables: string[] = [];
  
  for (const business of knownBusinesses) {
    if (await checkTableExists(business)) {
      existingTables.push(business);
    }
  }
  
  return existingTables;
};

/**
 * Fetch reviews from multiple legacy tables with date filtering
 */
export const fetchAllLegacyReviewsWithDateFilter = async (
  startDate?: Date,
  endDate?: Date
): Promise<Review[]> => {
  try {
    const tables = await getLegacyBusinessTables();
    console.log(`Found ${tables.length} legacy business tables`);
    
    const allReviews: Review[] = [];
    
    for (const table of tables) {
      const reviews = await fetchLegacyReviewsWithDateFilter(table, startDate, endDate);
      allReviews.push(...reviews);
    }
    
    // Sort all reviews by date descending
    allReviews.sort((a, b) => {
      const dateA = new Date(a.publishedAtDate || a.publishedatdate);
      const dateB = new Date(b.publishedAtDate || b.publishedatdate);
      return dateB.getTime() - dateA.getTime();
    });
    
    console.log(`Total reviews fetched from all legacy tables: ${allReviews.length}`);
    return allReviews;
  } catch (error) {
    console.error('Failed to fetch reviews from legacy tables:', error);
    throw error;
  }
};
