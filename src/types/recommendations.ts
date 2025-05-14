import { BusinessType } from './businessTypes';

export interface Recommendation {
  id: string;
  category: 'urgent' | 'growth' | 'operational' | 'strategic' | 'competitive';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reasoning: string;
  expectedImpact: string;
  timeframe: string;
  metrics: string[];
  actions: string[];
  relatedData?: any;
}

export interface UrgentAction extends Recommendation {
  category: 'urgent';
  issue: string;
  affectedCustomers: number;
  riskLevel: 'severe' | 'high' | 'moderate';
}

export interface GrowthStrategy extends Recommendation {
  category: 'growth';
  targetAudience: string;
  marketingChannels: string[];
  estimatedCost: string;
  expectedROI: string;
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

export interface CompetitiveAnalysis {
  businessType: BusinessType;
  overallPosition: 'leader' | 'above-average' | 'average' | 'below-average' | 'lagging';
  insights: CompetitiveInsight[];
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface BusinessScenario {
  name: string;
  description: string;
  assumptions: string[];
  projectedMetrics: {
    rating: number;
    monthlyReviews: number;
    customerSatisfaction: number;
    revenue?: string;
  };
  probability: number;
  requiredActions: string[];
  timeline: string;
}

export interface PatternInsight {
  pattern: string;
  frequency: number;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  impact: 'high' | 'medium' | 'low';
  trend: 'increasing' | 'stable' | 'decreasing';
  recommendation: string;
  examples: string[];
}

export interface MarketingPlan {
  objectives: string[];
  targetSegments: {
    segment: string;
    characteristics: string[];
    channels: string[];
    messaging: string;
  }[];
  campaigns: {
    name: string;
    objective: string;
    duration: string;
    budget: string;
    expectedResults: string;
  }[];
  contentStrategy: {
    themes: string[];
    formats: string[];
    frequency: string;
  };
  kpis: string[];
}

export interface Strategy {
  id: string;
  category: 'brand' | 'customer' | 'innovation' | 'operational' | 'digital';
  title: string;
  description: string;
  timeframe: string;
  actions: string[];
  expectedOutcomes: string[];
  resources: string[];
  risks: string[];
  mitigations: string[];
}

export interface Recommendations {
  urgentActions: UrgentAction[];
  growthStrategies: GrowthStrategy[];
  patternInsights: PatternInsight[];
  competitivePosition: CompetitiveAnalysis;
  customerAttractionPlan: MarketingPlan;
  scenarios: BusinessScenario[];
  longTermStrategies: Strategy[];
  generatedAt: string;
  provider: 'browser' | 'api';
  businessType: BusinessType;
}