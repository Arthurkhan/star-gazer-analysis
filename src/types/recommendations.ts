export type BusinessType = "cafe" | "restaurant" | "bar" | "hotel" | "retail" | "art_gallery" | "other";

import { EnhancedAnalysis } from "./dataAnalysis";

export interface Recommendations {
  // Business information
  businessId?: string;
  businessName?: string;
  
  analysis: AnalysisResult;
  suggestions: Suggestion[];
  actionPlan: ActionPlan;
  competitiveAnalysis?: CompetitiveAnalysis;
  growthStrategies?: GrowthStrategy[];
  scenarios?: Scenario[];
  
  // Enhanced Analysis data
  enhancedAnalysis?: EnhancedAnalysis;
  
  // Add missing properties referenced in components
  urgentActions: UrgentAction[];
  patternInsights: PatternInsight[];
  longTermStrategies: Strategy[];
  competitivePosition: CompetitiveAnalysis;
  customerAttractionPlan: MarketingPlan;
}

export interface AnalysisResult {
  sentimentAnalysis: { name: string; value: number }[];
  staffMentions: { name: string; count: number; sentiment: "positive" | "negative" | "neutral"; examples?: string[] }[];
  commonTerms: { text: string; count: number; category?: string }[];
  overallAnalysis: string;
  languageDistribution?: { language: string; count: number; percentage: number }[];
  ratingBreakdown?: { rating: number; count: number; percentage: number }[];
  mainThemes?: { theme: string; count: number; percentage: number }[];
  
  // Add missing properties
  temporalPatterns?: any[];
  historicalTrends?: any[];
  reviewClusters?: any[];
  seasonalAnalysis?: any[];
  insights?: {
    keyFindings: string[];
    opportunities: string[];
    risks: string[];
  };
}

export interface Suggestion {
  category: "staff" | "marketing" | "operations" | "customer_experience";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  effort: "high" | "medium" | "low";
  timeframe: "immediate" | "short_term" | "long_term";
}

export interface ActionPlan {
  title: string;
  description: string;
  steps: ActionStep[];
  expectedResults: string;
  timeframe: "immediate" | "short_term" | "long_term" | "ongoing";
}

export interface ActionStep {
  title: string;
  description: string;
  assignedTo?: string;
  status: "pending" | "in_progress" | "completed";
}

export interface CompetitiveAnalysis {
  overview: string;
  competitors: Competitor[];
  strengthsWeaknesses: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  recommendations: string[];
  
  // Add missing properties used in CompetitiveAnalysisView
  position: "above" | "average" | "below";
  metrics: {
    [key: string]: {
      value: number;
      benchmark: number;
      percentile: number;
    }
  };
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
}

export interface Competitor {
  name: string;
  metrics: {
    reviewVolume: number;
    avgRating: number;
    sentiment: number;
    revenue: string;
  };
  strengths: string[];
  weaknesses: string[];
}

export interface GrowthStrategy {
  type: "operations" | "brand" | "customer" | "innovation";
  title: string;
  description: string;
  steps: string[];
  potentialImpact: "high" | "medium" | "low";
  resourceRequirements: "high" | "medium" | "low";
  timeframe: "immediate" | "short_term" | "long_term" | "ongoing";
  
  // Add missing properties used in GrowthStrategiesView
  id: string;
  category: string;
  expectedImpact: string;
  implementation: string[];
  kpis: string[];
}

// Update Scenario to be compatible with BusinessScenario
export interface Scenario {
  name: string;
  description: string;
  probability: string | number; // Allow both string and number
  impact: "positive" | "negative" | "neutral";
  responseStrategy: string;
  triggers: string[];
  // Add properties to make it compatible with BusinessScenario
  projectedMetrics?: {
    reviewVolume: number;
    avgRating: number;
    sentiment: number;
    revenue: string;
    [key: string]: number | string;
  };
  requiredActions?: string[];
  timeframe?: string;
  assumptions?: string[];
}

export interface BusinessScenario {
  name: string;
  description: string;
  probability: number;
  timeframe?: string;
  projectedMetrics: {
    reviewVolume: number;
    avgRating: number;
    sentiment: number;
    revenue: string;
    [key: string]: number | string;
  };
  requiredActions: string[];
  assumptions?: string[];
  // Add these to make it compatible with Scenario
  impact?: "positive" | "negative" | "neutral";
  responseStrategy?: string;
  triggers?: string[];
}

export interface MarketingPlan {
  overview: string;
  objectives: string[];
  tactics: {
    name: string;
    description: string;
    channel: string;
    timeline: string;
    budget: string;
    kpis: string[];
  }[];
  budget: {
    total: string;
    breakdown: {
      [key: string]: string;
    };
  };
  timeline: {
    start: string;
    end: string;
    milestones: {
      date: string;
      description: string;
    }[];
  };
  
  // Add missing properties used in GrowthStrategiesView
  targetAudiences: {
    primary: string[];
    secondary: string[];
    untapped: string[];
  };
  channels: {
    name: string;
    strategy: string;
    budget: string;
  }[];
  messaging: {
    uniqueValue: string;
    keyPoints: string[];
    callToAction: string;
  };
}

export interface Strategy {
  name: string;
  description: string;
  objectives: string[];
  tactics: {
    name: string;
    description: string;
    timeline: string;
    owner: string;
    kpis: string[];
  }[];
  expectedOutcomes: string[];
  
  // Add missing properties used in PatternAnalysisView
  id: string;
  category: string;
  title: string;
  riskLevel: string;
  timeframe: string;
  expectedROI: string;
  actions: string[];
}

// Add missing interfaces
export interface UrgentAction {
  id: string;
  title: string;
  description: string;
  category: string;
  relatedReviews?: string[];
  suggestedAction?: string;
  timeframe?: string;
}

export interface PatternInsight {
  id?: string;
  pattern: string;
  frequency: number;
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  impact?: "high" | "medium" | "low";
  trend?: string;
  recommendation: string;
  examples: string[];
}

export interface CompetitiveInsight {
  metric: string;
  yourValue: number;
  industryAverage: number;
  topPerformer: number;
  percentile: number;
  gap: number;
  recommendation: string;
}
