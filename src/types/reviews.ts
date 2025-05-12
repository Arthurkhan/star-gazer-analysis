
export interface Review {
  id?: number;
  name: string;
  text: string;
  textTranslated?: string;
  title?: string;
  star: number;
  publishedAtDate: string;
  responseFromOwnerText?: string;
  originalLanguage?: string;
  reviewUrl?: string;
  // Add new fields for AI analysis
  sentiment?: 'positive' | 'negative' | 'neutral';
  staffMentioned?: string;
  mainThemes?: string;
}

// Add these new interfaces to the bottom of the file
export interface ThemeCategory {
  name: string;
  color: string;
  keywords: string[];
}

export interface FilterOptions {
  category: string | null;
  sortBy: 'count' | 'alphabetical';
  sortOrder: 'asc' | 'desc';
}

// Add missing type definitions for other parts of the application
export interface SentimentData {
  name: string;
  value: number;
}

export interface LanguageData {
  name: string;
  value: number;
  languages?: LanguageData[];
  tooltip?: string;
}

export interface MonthlyReviewData {
  month: string;
  count: number;
  cumulativeCount: number;
}

export interface InsightsData {
  trendData: TrendPoint[];
  needAttention: Review[];
  ratingTrend: string;
  commonThemes: ThemeData[];
}

export interface ThemeData {
  text: string;
  count: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface TrendPoint {
  period: string;
  value: number;
}

export interface StaffMention {
  name: string;
  count: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  examples?: string[];
}

export interface BusinessData {
  allBusinesses: { name: string; count: number };
  businesses: Record<string, { name: string; count: number }>;
}
