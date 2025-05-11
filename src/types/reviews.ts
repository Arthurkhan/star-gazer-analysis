
export interface Review {
  name: string;
  title: string;
  star: number;
  originalLanguage: string;
  text: string;
  translatedText?: string;
  responseFromOwnerText?: string;
  publishedAtDate: string;
  reviewUrl: string;
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
  cumulativeCount?: number;
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
