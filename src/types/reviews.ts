
export interface Review {
  name: string;
  title: string;
  star: number;
  originalLanguage: string;
  text: string;
  textTranslated?: string;
  responseFromOwnerText?: string;
  publishedAtDate: string;
  reviewUrl: string;
  sentiment?: string;
  staffMentioned?: string;
  mainThemes?: string;
  "common terms"?: string;
}

export interface BusinessInfo {
  name: string;
  count: number;
}

export interface BusinessData {
  allBusinesses: BusinessInfo;
  businesses: Record<string, BusinessInfo>;
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
  examples?: string[]; // Added the examples property as optional
}

export interface InsightsData {
  trendData: TrendPoint[];
  needAttention: Review[];
  ratingTrend: "up" | "down" | "neutral";
  commonThemes: ThemeData[];
}

// Define allowed table names explicitly to match Supabase structure
export type TableName = "L'Envol Art Space" | "The Little Prince Cafe" | "Vol de Nuit, The Hidden Bar";
