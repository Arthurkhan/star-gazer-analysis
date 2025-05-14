import { BusinessType } from './businessTypes';

// Industry benchmarks for recommendations
export interface IndustryBenchmark {
  avgRating: number;
  monthlyReviews: number;
  responseRate: number;
  commonThemes: string[];
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export const industryBenchmarks: Record<BusinessType, IndustryBenchmark> = {
  [BusinessType.CAFE]: {
    avgRating: 4.2,
    monthlyReviews: 150,
    responseRate: 0.3,
    commonThemes: ['coffee', 'ambiance', 'wifi', 'service', 'atmosphere'],
    sentimentDistribution: { positive: 0.7, neutral: 0.2, negative: 0.1 }
  },
  [BusinessType.BAR]: {
    avgRating: 4.0,
    monthlyReviews: 120,
    responseRate: 0.25,
    commonThemes: ['drinks', 'atmosphere', 'music', 'crowd', 'service'],
    sentimentDistribution: { positive: 0.65, neutral: 0.25, negative: 0.1 }
  },
  [BusinessType.RESTAURANT]: {
    avgRating: 4.1,
    monthlyReviews: 200,
    responseRate: 0.4,
    commonThemes: ['food', 'service', 'ambiance', 'value', 'quality'],
    sentimentDistribution: { positive: 0.68, neutral: 0.22, negative: 0.1 }
  },
  [BusinessType.GALLERY]: {
    avgRating: 4.5,
    monthlyReviews: 50,
    responseRate: 0.2,
    commonThemes: ['art', 'exhibits', 'atmosphere', 'curation', 'space'],
    sentimentDistribution: { positive: 0.8, neutral: 0.15, negative: 0.05 }
  },
  [BusinessType.RETAIL]: {
    avgRating: 4.0,
    monthlyReviews: 100,
    responseRate: 0.35,
    commonThemes: ['selection', 'service', 'prices', 'quality', 'location'],
    sentimentDistribution: { positive: 0.65, neutral: 0.25, negative: 0.1 }
  },
  [BusinessType.SERVICE]: {
    avgRating: 4.3,
    monthlyReviews: 80,
    responseRate: 0.45,
    commonThemes: ['professionalism', 'quality', 'value', 'communication', 'reliability'],
    sentimentDistribution: { positive: 0.72, neutral: 0.2, negative: 0.08 }
  },
  [BusinessType.OTHER]: {
    avgRating: 4.1,
    monthlyReviews: 100,
    responseRate: 0.3,
    commonThemes: ['service', 'quality', 'value', 'experience', 'staff'],
    sentimentDistribution: { positive: 0.68, neutral: 0.22, negative: 0.1 }
  }
};

// Analysis result interface for recommendations
export interface AnalysisResult {
  business: string;
  businessType: BusinessType;
  reviews: any[];
  metrics: {
    totalReviews: number;
    avgRating: number;
    responseRate: number;
  };
  patterns: any;
  sentiment: any;
}

// Recommendation types
export interface UrgentAction {
  id: string;
  title: string;
  description: string;
  category: 'critical' | 'important' | 'moderate';
  relatedReviews: string[];
  suggestedAction: string;
  timeframe: string;
}

export interface GrowthStrategy {
  id: string;
  title: string;
  description: string;
  category: 'marketing' | 'operations' | 'customer_experience' | 'staff';
  expectedImpact: string;
  implementation: string[];
  timeframe: string;
  kpis: string[];
}

export interface PatternInsight {
  id: string;
  pattern: string;
  frequency: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  recommendation: string;
  examples: string[];
}

export interface CompetitiveAnalysis {
  position: 'above' | 'average' | 'below';
  metrics: {
    rating: { value: number; benchmark: number; percentile: number };
    reviewVolume: { value: number; benchmark: number; percentile: number };
    sentiment: { value: number; benchmark: number; percentile: number };
  };
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
}

export interface MarketingPlan {
  targetAudiences: {
    primary: string[];
    secondary: string[];
    untapped: string[];
  };
  channels: {
    name: string;
    strategy: string;
    budget: 'low' | 'medium' | 'high';
  }[];
  messaging: {
    keyPoints: string[];
    uniqueValue: string;
    callToAction: string;
  };
}

export interface BusinessScenario {
  name: string;
  description: string;
  probability: number;
  timeframe: string;
  projectedMetrics: {
    reviewVolume: number;
    avgRating: number;
    sentiment: number;
    revenue: string; // percentage change
  };
  requiredActions: string[];
}

export interface Strategy {
  id: string;
  category: 'brand' | 'customer' | 'innovation' | 'operations';
  title: string;
  description: string;
  timeframe: string;
  actions: string[];
  expectedROI: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface Recommendations {
  urgentActions: UrgentAction[];
  growthStrategies: GrowthStrategy[];
  patternInsights: PatternInsight[];
  competitivePosition: CompetitiveAnalysis;
  customerAttractionPlan: MarketingPlan;
  scenarios: BusinessScenario[];
  longTermStrategies: Strategy[];
}

export interface BusinessHealth {
  score: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}
