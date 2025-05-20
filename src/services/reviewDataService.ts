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