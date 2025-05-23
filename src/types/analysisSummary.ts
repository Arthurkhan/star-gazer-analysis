import { Review } from "./reviews";

// Business health score components
export interface BusinessHealthScore {
  overall: number; // 0-100 score
  ratingTrend: number; // -100 to 100 (negative = declining, positive = improving)
  sentimentScore: number; // 0-100 based on positive sentiment percentage
  responseRate: number; // 0-100 percentage of reviews with owner responses
  volumeTrend: number; // -100 to 100 (review volume trend)
  breakdown: {
    rating: number;
    sentiment: number;
    response: number;
    volume: number;
  };
}

// Performance metrics over time
export interface PerformanceMetrics {
  totalReviews: number;
  reviewsPerMonth: number;
  growthRate: number; // percentage change from previous period
  peakMonth: string;
  peakYear: string;
  recentActivity: {
    last3Months: number;
    last6Months: number;
    last12Months: number;
  };
  trends: {
    isGrowing: boolean;
    seasonalPattern: "stable" | "seasonal" | "declining" | "growing";
    bestPeriods: string[];
    worstPeriods: string[];
  };
}

// Rating analysis
export interface RatingAnalysis {
  distribution: Record<number, { count: number; percentage: number }>;
  trends: {
    current: number;
    previous: number;
    change: number;
    direction: "up" | "down" | "stable";
  };
  benchmarks: {
    excellent: number; // 4.5+ percentage
    good: number; // 4.0+ percentage
    needsImprovement: number; // Below 3.0 percentage
  };
}

// Response analytics
export interface ResponseAnalytics {
  responseRate: number;
  responsesByRating: Record<number, { total: number; responded: number; rate: number }>;
  averageResponseTime?: number; // if available in future
  responseEffectiveness: {
    improvedSubsequentRatings: boolean;
    customerSatisfactionImpact: number;
  };
}

// Enhanced sentiment analysis
export interface SentimentAnalysis {
  distribution: {
    positive: { count: number; percentage: number };
    neutral: { count: number; percentage: number };
    negative: { count: number; percentage: number };
  };
  trends: Array<{
    period: string;
    positive: number;
    neutral: number;
    negative: number;
  }>;
  correlationWithRating: {
    highRating: { positive: number; negative: number }; // 4-5 stars
    lowRating: { positive: number; negative: number }; // 1-2 stars
  };
}

// Thematic analysis
export interface ThematicAnalysis {
  topCategories: Array<{
    category: string;
    count: number;
    percentage: number;
    averageRating: number;
    sentiment: "positive" | "negative" | "neutral";
  }>;
  trendingTopics: Array<{
    topic: string;
    count: number;
    trend: "rising" | "declining" | "stable";
    recentMentions: number;
  }>;
  attentionAreas: Array<{
    theme: string;
    negativeCount: number;
    averageRating: number;
    urgency: "high" | "medium" | "low";
  }>;
}

// Staff performance insights
export interface StaffInsights {
  mentions: Array<{
    name: string;
    totalMentions: number;
    positiveMentions: number;
    negativeMentions: number;
    averageRatingInMentions: number;
    trend: "improving" | "declining" | "stable";
    examples: string[];
  }>;
  overallStaffScore: number;
  trainingOpportunities: string[];
}

// Operational insights
export interface OperationalInsights {
  languageDiversity: Array<{
    language: string;
    count: number;
    percentage: number;
    averageRating: number;
  }>;
  reviewPatterns: {
    peakDays: string[];
    peakMonths: string[];
    quietPeriods: string[];
  };
  customerLoyalty: {
    repeatReviewers: number;
    loyaltyScore: number;
    averageTimeBetweenVisits?: number;
  };
}

// Action items and recommendations
export interface ActionItems {
  urgent: Array<{
    type: "unresponded_negative" | "trending_negative" | "staff_issue" | "operational_issue";
    description: string;
    priority: "critical" | "high" | "medium";
    affectedReviews: number;
    suggestedAction: string;
  }>;
  improvements: Array<{
    area: string;
    description: string;
    potentialImpact: "high" | "medium" | "low";
    effort: "low" | "medium" | "high";
    suggestedActions: string[];
  }>;
  strengths: Array<{
    area: string;
    description: string;
    leverageOpportunities: string[];
  }>;
  monitoring: Array<{
    metric: string;
    description: string;
    targetValue: number;
    currentValue: number;
  }>;
}

// Time period configuration
export interface TimePeriodConfig {
  current: {
    start: Date;
    end: Date;
    label: string;
  };
  previous: {
    start: Date;
    end: Date;
    label: string;
  };
  comparison: "month" | "quarter" | "year" | "custom";
}

// Main analysis summary data structure
export interface AnalysisSummaryData {
  businessHealthScore: BusinessHealthScore;
  performanceMetrics: PerformanceMetrics;
  ratingAnalysis: RatingAnalysis;
  responseAnalytics: ResponseAnalytics;
  sentimentAnalysis: SentimentAnalysis;
  thematicAnalysis: ThematicAnalysis;
  staffInsights: StaffInsights;
  operationalInsights: OperationalInsights;
  actionItems: ActionItems;
  timePeriod: TimePeriodConfig;
  generatedAt: Date;
  dataSource: {
    totalReviews: number;
    dateRange: {
      start: Date;
      end: Date;
    };
    businessName: string;
  };
}

// Configuration options for analysis
export interface AnalysisConfig {
  timePeriod: "last30days" | "last90days" | "last6months" | "last12months" | "all" | "custom";
  customRange?: {
    start: Date;
    end: Date;
  };
  includeStaffAnalysis: boolean;
  includeThematicAnalysis: boolean;
  includeActionItems: boolean;
  comparisonPeriod?: "previous" | "yearOverYear" | "none";
}

// Helper types for calculations
export interface TrendCalculation {
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
  direction: "up" | "down" | "stable";
  significance: "significant" | "minor" | "negligible";
}

export interface PeriodData {
  start: Date;
  end: Date;
  reviews: Review[];
  metrics: {
    averageRating: number;
    totalReviews: number;
    sentimentScore: number;
    responseRate: number;
  };
}
