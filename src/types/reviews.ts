
// Define allowed table names explicitly to match Supabase structure
export type TableName = "L'Envol Art Space" | "The Little Prince Cafe" | "Vol de Nuit, The Hidden Bar";

export interface Review {
  stars: number; // Fixed: was 'star', now matches database schema
  name: string;
  text: string;
  textTranslated?: string;
  title?: string;
  publishedAtDate: string;
  reviewUrl: string;
  originalLanguage?: string;
  responseFromOwnerText?: string;
  sentiment?: string; 
  staffMentioned?: string;
  mainThemes?: string;
  "common terms"?: string;
}

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
