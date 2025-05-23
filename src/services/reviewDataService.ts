import { supabase } from "@/integrations/supabase/client";
import { Review, Business } from "@/types/reviews";
import { Recommendations } from "@/types/recommendations";

/**
 * Review Data Service
 * 
 * Provides data access methods for the Star-Gazer Analysis application.
 * Handles all database operations for businesses, reviews, and recommendations.
 * 
 * @author Star-Gazer Analysis Team
 * @version 0.1.0 - Phase 0 Cleanup
 */

/**
 * Fetch all businesses from the database
 * 
 * @returns {Promise<Business[]>} Array of all businesses
 * @throws {Error} Database or network errors
 */
export const fetchBusinesses = async (): Promise<Business[]> => {
  try {
    console.log("Fetching businesses...");
    
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .order('name');
    
    if (error) {
      console.error("Error fetching businesses:", error);
      throw new Error(`Failed to fetch businesses: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.warn("No businesses found in database");
      return [];
    }
    
    console.log(`Fetched ${data.length} businesses successfully`);
    return data;
  } catch (error) {
    console.error("Failed to fetch businesses:", error);
    throw error;
  }
};

/**
 * Fetch all reviews with business information
 * 
 * @returns {Promise<Review[]>} Array of all reviews with business data
 * @throws {Error} Database or network errors
 */
export const fetchAllReviews = async (): Promise<Review[]> => {
  try {
    console.log("Fetching all reviews...");
    
    const { data, error } = await supabase
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
    
    if (error) {
      console.error("Error fetching reviews:", error);
      throw new Error(`Failed to fetch reviews: ${error.message}`);
    }
    
    if (!data) {
      console.log("No reviews found");
      return [];
    }
    
    // Process reviews to normalize data structure
    const processedReviews = data.map(review => {
      const business = review.businesses as any;
      return {
        ...review,
        title: business?.name || 'Unknown Business',
        publishedAtDate: review.publishedAtDate || review.publishedatdate,
        businessName: business?.name,
      };
    });
    
    console.log(`Fetched ${processedReviews.length} reviews successfully`);
    return processedReviews;
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    throw error;
  }
};

/**
 * Fetch reviews for a specific business
 * 
 * @param {string} businessName - Name of the business
 * @returns {Promise<Review[]>} Array of reviews for the specified business
 * @throws {Error} Database or network errors
 */
export const fetchReviewsForBusiness = async (businessName: string): Promise<Review[]> => {
  try {
    console.log(`Fetching reviews for business: ${businessName}`);
    
    // First get the business ID
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('name', businessName)
      .single();
    
    if (businessError || !businessData) {
      console.error(`Business not found: ${businessName}`);
      return [];
    }
    
    // Then get reviews for that business
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        businesses:business_id (
          id,
          name,
          business_type
        )
      `)
      .eq('business_id', businessData.id)
      .order('publishedatdate', { ascending: false });
    
    if (error) {
      console.error("Error fetching business reviews:", error);
      throw new Error(`Failed to fetch reviews for ${businessName}: ${error.message}`);
    }
    
    if (!data) {
      return [];
    }
    
    // Process reviews to normalize data structure
    const processedReviews = data.map(review => {
      const business = review.businesses as any;
      return {
        ...review,
        title: business?.name || businessName,
        publishedAtDate: review.publishedAtDate || review.publishedatdate,
        businessName: business?.name || businessName,
      };
    });
    
    console.log(`Fetched ${processedReviews.length} reviews for ${businessName}`);
    return processedReviews;
  } catch (error) {
    console.error(`Failed to fetch reviews for business ${businessName}:`, error);
    throw error;
  }
};

/**
 * Fetch reviews with optional filtering
 * 
 * @param {string} [businessName] - Optional business name filter
 * @param {Date} [startDate] - Optional start date filter  
 * @param {Date} [endDate] - Optional end date filter
 * @returns {Promise<Review[]>} Array of filtered reviews
 */
export const fetchFilteredReviews = async (
  businessName?: string,
  startDate?: Date,
  endDate?: Date
): Promise<Review[]> => {
  try {
    const allReviews = businessName && businessName !== "all" && businessName !== "All Businesses"
      ? await fetchReviewsForBusiness(businessName)
      : await fetchAllReviews();
    
    // Apply date filtering if provided
    if (startDate || endDate) {
      return allReviews.filter(review => {
        const reviewDate = new Date(review.publishedAtDate || review.publishedatdate);
        if (startDate && reviewDate < startDate) return false;
        if (endDate && reviewDate > endDate) return false;
        return true;
      });
    }
    
    return allReviews;
  } catch (error) {
    console.error('Failed to fetch filtered reviews:', error);
    throw error;
  }
};

/**
 * Get the latest recommendation for a business
 * 
 * @param {string} businessId - Business ID
 * @returns {Promise<any | null>} Latest recommendation or null if none found
 */
export const getLatestRecommendation = async (businessId: string): Promise<any | null> => {
  try {
    console.log(`Fetching latest recommendation for business ${businessId}`);
    
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
    
    console.log(`Found recommendation for business ${businessId}`);
    return data[0];
  } catch (error) {
    console.error('Failed to fetch latest recommendation:', error);
    return null;
  }
};

/**
 * Save a recommendation for a business
 * 
 * @param {string} businessId - Business ID
 * @param {Recommendations} recommendations - Recommendation data to save
 * @returns {Promise<boolean>} Success status
 */
export const saveRecommendation = async (businessId: string, recommendations: Recommendations): Promise<boolean> => {
  try {
    console.log(`Saving recommendation for business ${businessId}`);
    
    // Add timestamp to recommendations
    const recommendationWithTimestamp = {
      ...recommendations,
      lastUpdated: new Date().toISOString()
    };
    
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
    
    console.log(`Recommendation saved successfully for business ${businessId}`);
    return true;
  } catch (error) {
    console.error('Failed to save recommendation:', error);
    return false;
  }
};

/**
 * Check if the database has the required tables and is accessible
 * 
 * @returns {Promise<boolean>} Database health status
 */
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    // Check if required tables exist by trying to query them
    const [businessesResult, reviewsResult] = await Promise.all([
      supabase.from('businesses').select('id').limit(1),
      supabase.from('reviews').select('id').limit(1)
    ]);
    
    return !businessesResult.error && !reviewsResult.error;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};
