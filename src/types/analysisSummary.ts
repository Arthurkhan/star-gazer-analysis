/**
 * Simplified Analysis Summary Types - Phase 1 Consolidation
 * 
 * Reduces 17 interfaces to 4 essential ones, using TypeScript inference
 * where possible and avoiding over-typing
 */

import { Review } from "./reviews";

// Core business metrics (consolidates health score, performance, ratings, sentiment)
export interface BusinessMetrics {
  // Core scores
  healthScore: number; // 0-100 overall business health
  averageRating: number;
  totalReviews: number;
  responseRate: number; // 0-100 percentage
  
  // Trends (simple direction indicators)
  trends: {
    rating: 'up' | 'down' | 'stable';
    volume: 'growing' | 'declining' | 'stable';
    sentiment: 'improving' | 'declining' | 'stable';
  };
  
  // Distributions (flexible data structure)
  distributions: {
    ratings: Record<number, number>; // star rating -> count
    sentiment: { positive: number; neutral: number; negative: number };
    languages?: Record<string, number>; // language -> count
  };
}

// Analysis insights (consolidates thematic, staff, operational, action items)
export interface AnalysisInsights {
  // Top themes/categories mentioned in reviews
  themes: Array<{
    name: string;
    count: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    rating?: number; // average rating for this theme
  }>;
  
  // Staff mentions (simplified)
  staff: Array<{
    name: string;
    mentions: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    examples: string[]; // up to 3 example review snippets
  }>;
  
  // Action items (simplified priority system)
  actions: {
    urgent: string[]; // Critical issues requiring immediate attention
    improvements: string[]; // Suggested improvements
    strengths: string[]; // Things to leverage
  };
  
  // Operational patterns (simplified)
  patterns: {
    peakPeriods: string[]; // When reviews are most frequent
    languageDiversity: number; // Number of different languages
    loyalCustomers: number; // Repeat reviewers count
  };
}

// Main analysis data structure
export interface AnalysisSummaryData {
  metrics: BusinessMetrics;
  insights: AnalysisInsights;
  
  // Meta information
  generatedAt: Date;
  businessName: string;
  dateRange: {
    start: Date;
    end: Date;
    totalReviews: number;
  };
  
  // Optional comparison data (if comparing periods)
  comparison?: {
    previousMetrics: Partial<BusinessMetrics>;
    changes: Record<string, number>; // metric -> percentage change
  };
}

// Analysis configuration (simplified)
export interface AnalysisConfig {
  // Time period
  period: 'last30days' | 'last90days' | 'last6months' | 'last12months' | 'all' | 'custom';
  customRange?: { start: Date; end: Date };
  
  // Features to include (defaults to all true)
  includeStaffAnalysis?: boolean;
  includeThemes?: boolean;
  includeComparison?: boolean;
  
  // Comparison type
  comparisonPeriod?: 'previous' | 'yearOverYear' | 'none';
}

// Helper type for trend calculations (used internally)
export type TrendDirection = 'up' | 'down' | 'stable';

export type SentimentType = 'positive' | 'negative' | 'neutral';

// Re-export for convenience
export type { Review };

// Default config
export const defaultAnalysisConfig: AnalysisConfig = {
  period: 'last90days',
  includeStaffAnalysis: true,
  includeThemes: true,
  includeComparison: false,
  comparisonPeriod: 'none'
};
