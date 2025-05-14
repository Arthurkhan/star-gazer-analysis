
export type BusinessType = "cafe" | "restaurant" | "bar" | "hotel" | "retail" | "art_gallery" | "other";

export interface Recommendations {
  analysis: AnalysisResult;
  suggestions: Suggestion[];
  actionPlan: ActionPlan;
  competitiveAnalysis?: CompetitiveAnalysis;
  growthStrategies?: GrowthStrategy[];
  scenarios?: Scenario[];
}

export interface AnalysisResult {
  sentimentAnalysis: { name: string; value: number }[];
  staffMentions: { name: string; count: number; sentiment: "positive" | "negative" | "neutral"; examples?: string[] }[];
  commonTerms: { text: string; count: number; category?: string }[];
  overallAnalysis: string;
  languageDistribution?: { language: string; count: number; percentage: number }[];
  ratingBreakdown?: { rating: number; count: number; percentage: number }[];
  mainThemes?: { theme: string; count: number; percentage: number }[];
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
}

export interface Scenario {
  name: string;
  description: string;
  probability: "high" | "medium" | "low";
  impact: "positive" | "negative" | "neutral";
  responseStrategy: string;
  triggers: string[];
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
}
