// Define types for the new normalized database schema
export interface Business {
  id: string;
  name: string;
  business_type: string;
  created_at: string;
}

/**
 * Review interface aligned with database schema - Phase 2.1 Implementation
 * 
 * This interface handles the field name inconsistencies between:
 * - TypeScript interfaces (camelCase) 
 * - Database schema (lowercase)
 * - Data processing functions expecting different field names
 * 
 * Includes both database field names (lowercase) and camelCase variants for compatibility
 */
export interface Review {
  // Core required fields
  id: string;
  business_id: string;
  stars: number;
  name: string;
  text: string;
  reviewurl: string;           // Required as per Phase 2.1 specification
  created_at: string;
  
  // Database field names (lowercase - PostgreSQL standard)
  texttranslated?: string;      // Database field - translated review text
  publishedatdate?: string;     // Database field - original publication date
  responsefromownertext?: string; // Database field - CRITICAL for engagement rate calculation
  sentiment?: string;           // Database field - sentiment analysis result
  staffmentioned?: string;      // Database field - CRITICAL for staff mentions functionality
  mainthemes?: string;          // Database field - CRITICAL for thematic analysis
  language?: string;            // NEW DATABASE FIELD - Added in Phase 1 for language detection
  
  // Backward compatibility fields (camelCase variants)
  // These ensure existing code continues to work during transition
  textTranslated?: string;      // Legacy compatibility for texttranslated
  publishedAtDate?: string;     // Legacy compatibility for publishedatdate
  reviewUrl?: string;           // Legacy compatibility for reviewurl
  responseFromOwnerText?: string; // Legacy compatibility for responsefromownertext
  staffMentioned?: string;      // Legacy compatibility for staffmentioned  
  mainThemes?: string;          // Legacy compatibility for mainthemes
  
  // Additional computed/legacy fields for backward compatibility
  "common terms"?: string;      // Legacy field from old table structures
  title?: string;               // Computed field during fetch for backwards compatibility
  originalLanguage?: string;    // Legacy field - replaced by 'language' field
  businessName?: string;        // Computed field from business relationship
}

// Legacy table name type - kept for backwards compatibility during migration
export type TableName = "L'Envol Art Space" | "The Little Prince Cafe" | "Vol de Nuit, The Hidden Bar";

export interface BusinessData {
  id?: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  // Add the following properties to resolve the type errors
  allBusinesses: {
    name: string;
    count: number;
  };
  businesses: Record<string, {
    name: string;
    count: number;
  }>;
}

export interface SentimentData {
  name: string;
  value: number;
}

export interface LanguageData {
  name: string;
  value: number;
}

export interface MonthlyReviewData {
  month: string;
  count: number;
  cumulativeCount: number;
  avgRating?: number;  // Average rating for the month
}

export interface ThemeData {
  text: string;
  count: number;
  sentiment: "positive" | "negative" | "neutral";
}

export interface TrendPoint {
  period: string;
  value: number;
}

export interface StaffMention {
  name: string;
  count: number;
  sentiment: "positive" | "negative" | "neutral";
  examples?: string[];
}

export interface InsightsData {
  trendData: TrendPoint[];
  needAttention: Review[];
  ratingTrend: "up" | "down" | "neutral";
  commonThemes: ThemeData[];
}

/**
 * Helper type for safe field access - handles both field name variants
 * This is crucial for Phase 2 implementation to handle field name inconsistencies
 */
export type ReviewFieldAccessor = {
  getResponseText: (review: Review) => string | undefined;
  getStaffMentioned: (review: Review) => string | undefined;
  getMainThemes: (review: Review) => string | undefined;
  getPublishedDate: (review: Review) => string | undefined;
  getLanguage: (review: Review) => string | undefined;
  getTextTranslated: (review: Review) => string | undefined;
  getReviewUrl: (review: Review) => string | undefined;
};

/**
 * Utility for safe field access - handles field name variants
 * 
 * This is the PRIMARY solution for field name inconsistencies identified in Phase 2.
 * All data processing functions should use these accessors instead of direct field access.
 * 
 * Usage: reviewFieldAccessor.getResponseText(review) instead of review.responseFromOwnerText
 */
export const reviewFieldAccessor: ReviewFieldAccessor = {
  /**
   * Get response text from owner - CRITICAL for engagement rate calculation
   * Handles both lowercase database field and camelCase compatibility field
   */
  getResponseText: (review: Review) => 
    review.responsefromownertext || review.responseFromOwnerText,
  
  /**
   * Get staff mentioned data - CRITICAL for staff mentions functionality
   * Handles both lowercase database field and camelCase compatibility field
   */
  getStaffMentioned: (review: Review) => 
    review.staffmentioned || review.staffMentioned,
  
  /**
   * Get main themes data - CRITICAL for thematic analysis
   * Handles both lowercase database field and camelCase compatibility field
   */
  getMainThemes: (review: Review) => 
    review.mainthemes || review.mainThemes,
  
  /**
   * Get published date - handles database and legacy field variants
   */
  getPublishedDate: (review: Review) => 
    review.publishedatdate || review.publishedAtDate,
  
  /**
   * Get language data - NEW FIELD added in Phase 1
   * Falls back to legacy originalLanguage field if new field not available
   */
  getLanguage: (review: Review) => 
    review.language || review.originalLanguage || 'unknown',
  
  /**
   * Get translated text - handles database and legacy field variants
   */
  getTextTranslated: (review: Review) => 
    review.texttranslated || review.textTranslated,
  
  /**
   * Get review URL - handles database and legacy field variants
   */
  getReviewUrl: (review: Review) => 
    review.reviewurl || review.reviewUrl
};

/**
 * Type guard to check if a review has response from owner
 * Useful for engagement rate calculations
 */
export const hasOwnerResponse = (review: Review): boolean => {
  const responseText = reviewFieldAccessor.getResponseText(review);
  return !!(responseText && responseText.trim().length > 0);
};

/**
 * Type guard to check if a review has staff mentions
 * Useful for staff analysis functionality
 */
export const hasStaffMentions = (review: Review): boolean => {
  const staffData = reviewFieldAccessor.getStaffMentioned(review);
  return !!(staffData && staffData.trim().length > 0);
};

/**
 * Type guard to check if a review has thematic analysis data
 * Useful for thematic analysis functionality
 */
export const hasThematicData = (review: Review): boolean => {
  const themeData = reviewFieldAccessor.getMainThemes(review);
  return !!(themeData && themeData.trim().length > 0);
};
