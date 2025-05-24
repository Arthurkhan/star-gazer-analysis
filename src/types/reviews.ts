// Define types for the new normalized database schema
export interface Business {
  id: string;
  name: string;
  business_type: string;
  created_at: string;
}

// Define a type for review data - Updated for Phase 1.2
// Includes both database field names (lowercase) and camelCase variants for compatibility
export interface Review {
  id: string;
  business_id: string;
  stars: number;
  name: string;
  text: string;
  
  // Database field names (lowercase - PostgreSQL standard)
  texttranslated?: string;      // Database field
  publishedatdate?: string;     // Database field
  reviewurl?: string;           // Database field  
  responsefromownertext?: string; // Database field - CRITICAL for engagement rate
  sentiment?: string;           // Database field
  staffmentioned?: string;      // Database field - CRITICAL for staff mentions
  mainthemes?: string;          // Database field - CRITICAL for thematic analysis
  language?: string;            // NEW DATABASE FIELD - Added in Phase 1
  created_at: string;           // Database field
  
  // Backward compatibility fields (camelCase variants)
  textTranslated?: string;      // Legacy compatibility
  publishedAtDate?: string;     // Legacy compatibility  
  reviewUrl?: string;           // Legacy compatibility
  responseFromOwnerText?: string; // Legacy compatibility
  staffMentioned?: string;      // Legacy compatibility
  mainThemes?: string;          // Legacy compatibility
  
  // Additional computed/legacy fields
  "common terms"?: string;      // Legacy field from old tables
  title?: string;               // Computed field during fetch for backwards compatibility
  originalLanguage?: string;    // Legacy field - will be replaced by 'language'
  businessName?: string;        // Computed field from business relationship
}

// Legacy table name type - kept for backwards compatibility
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

// Helper type for safe field access - handles both field name variants
export type ReviewFieldAccessor = {
  getResponseText: (review: Review) => string | undefined;
  getStaffMentioned: (review: Review) => string | undefined;
  getMainThemes: (review: Review) => string | undefined;
  getPublishedDate: (review: Review) => string | undefined;
  getLanguage: (review: Review) => string | undefined;
};

// Utility for safe field access - handles field name variants
export const reviewFieldAccessor: ReviewFieldAccessor = {
  getResponseText: (review: Review) => 
    review.responsefromownertext || review.responseFromOwnerText,
  
  getStaffMentioned: (review: Review) => 
    review.staffmentioned || review.staffMentioned,
  
  getMainThemes: (review: Review) => 
    review.mainthemes || review.mainThemes,
  
  getPublishedDate: (review: Review) => 
    review.publishedatdate || review.publishedAtDate,
  
  getLanguage: (review: Review) => 
    review.language || review.originalLanguage || 'unknown'
};
