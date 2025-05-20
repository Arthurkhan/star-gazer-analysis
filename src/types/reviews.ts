// Define types for the new normalized database schema
export interface Business {
  id: string;
  name: string;
  business_type: string;
  created_at: string;
}

// Define a type for review data
export interface Review {
  id: string;
  business_id: string;
  stars: number;
  name: string;
  text: string;
  textTranslated?: string;
  publishedAtDate?: string;  // Camel case (old format)
  publishedatdate?: string;  // Lower case (new format)
  reviewUrl: string;
  responseFromOwnerText?: string;
  sentiment?: string; 
  staffMentioned?: string;
  mainThemes?: string;
  "common terms"?: string;
  created_at: string;
  // Computed field during fetch for backwards compatibility
  title?: string;
  originalLanguage?: string;
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
