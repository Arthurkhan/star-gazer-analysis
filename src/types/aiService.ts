// Types for AI service providers and their responses
export type AIProviderType = 'openai' | 'claude' | 'gemini';

export interface AIConfig {
  provider: AIProviderType;
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ReviewAnalysis {
  sentiment: {
    overall: number;
    breakdown: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
  themes: {
    name: string;
    frequency: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    examples: string[];
  }[];
  painPoints: {
    issue: string;
    severity: 'high' | 'medium' | 'low';
    frequency: number;
    suggestions: string[];
  }[];
  strengths: {
    aspect: string;
    mentions: number;
    impact: 'high' | 'medium' | 'low';
  }[];
  customerSegments: {
    segment: string;
    percentage: number;
    characteristics: string[];
  }[];
}

export interface BusinessContext {
  businessName: string;
  businessType: string;
  reviews: any[];
  metrics: {
    avgRating: number;
    totalReviews: number;
    responseRate: number;
    monthlyReviews: number;
  };
  analysis: ReviewAnalysis;
  historicalTrends?: {
    ratingTrend: 'improving' | 'stable' | 'declining';
    volumeTrend: 'increasing' | 'stable' | 'decreasing';
    sentimentTrend: 'improving' | 'stable' | 'declining';
  };
}

export interface AIResponse {
  recommendations: any;
  confidence: number;
  reasoning?: string;
  sources?: string[];
}

export interface PromptTemplate {
  system: string;
  user: string;
  variables: string[];
}

export interface BusinessTypePrompts {
  analysis: PromptTemplate;
  recommendations: PromptTemplate;
  marketing: PromptTemplate;
  scenarios: PromptTemplate;
}
