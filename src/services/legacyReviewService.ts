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
    console.log(`🔍 Fetching reviews from legacy table: ${tableName}`);
    console.log(`📅 Date range: ${startDate?.toISOString()} to ${endDate?.toISOString()}`);
    
    let query = supabase.from(tableName).select('*');
    
    // Apply date filtering at the database level
    // IMPORTANT: The column name might be 'publishedatdate' (lowercase) in legacy tables
    if (startDate || endDate) {
      // First, let's check which column name is used
      const { data: sampleData, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!sampleError && sampleData && sampleData.length > 0) {
        const sample = sampleData[0];
        const dateColumn = sample.hasOwnProperty('publishedAtDate') ? 'publishedAtDate' : 'publishedatdate';
        console.log(`📊 Using date column: ${dateColumn}`);
        
        // Apply date filters with the correct column name
        if (startDate && endDate) {
          query = query
            .gte(dateColumn, startDate.toISOString())
            .lte(dateColumn, endDate.toISOString());
        } else if (startDate) {
          query = query.gte(dateColumn, startDate.toISOString());
        } else if (endDate) {
          query = query.lte(dateColumn, endDate.toISOString());
        }
      }
    }
    
    // Order by date descending
    query = query.order('publishedatdate', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`❌ Error fetching from ${tableName}:`, error);
      throw error;
    }
    
    if (!data) {
      console.log(`📭 No data found in ${tableName}`);
      return [];
    }
    
    console.log(`✅ Retrieved ${data.length} reviews from ${tableName} with date filter`);
    
    // Log sample of dates to verify filtering
    if (data.length > 0) {
      const firstDate = data[0].publishedAtDate || data[0].publishedatdate;
      const lastDate = data[data.length - 1].publishedAtDate || data[data.length - 1].publishedatdate;
      console.log(`📅 Date range in results: ${lastDate} to ${firstDate}`);
    }
    
    // Process reviews to ensure consistent format
    const processedReviews = data.map(review => ({
      ...review,
      title: tableName, // Use table name as title for legacy compatibility
      businessName: tableName,
      // Ensure we have the date field consistently named
      publishedAtDate: review.publishedAtDate || review.publishedatdate,
      publishedatdate: review.publishedatdate || review.publishedAtDate,
    }));
    
    return processedReviews;
  } catch (error) {
    console.error(`❌ Failed to fetch reviews from legacy table ${tableName}:`, error);
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
    console.log(`📊 Found ${tables.length} legacy business tables`);
    
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
    
    console.log(`🎯 Total reviews fetched from all legacy tables: ${allReviews.length}`);
    return allReviews;
  } catch (error) {
    console.error('Failed to fetch reviews from legacy tables:', error);
    throw error;
  }
};

/**
 * Test function to verify date filtering is working
 */
export const testLegacyDateFiltering = async (tableName: string): Promise<void> => {
  console.log(`🧪 Testing date filtering for ${tableName}`);
  
  // Test 1: Get total count
  const allReviews = await fetchLegacyReviewsWithDateFilter(tableName);
  console.log(`Total reviews: ${allReviews.length}`);
  
  // Test 2: Get last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentReviews = await fetchLegacyReviewsWithDateFilter(tableName, thirtyDaysAgo, new Date());
  console.log(`Reviews in last 30 days: ${recentReviews.length}`);
  
  // Test 3: Get specific month
  const startOfMonth = new Date('2025-05-01');
  const endOfMonth = new Date('2025-05-31');
  const mayReviews = await fetchLegacyReviewsWithDateFilter(tableName, startOfMonth, endOfMonth);
  console.log(`Reviews in May 2025: ${mayReviews.length}`);
};
