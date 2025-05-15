import { Review } from './reviews';

export interface TemporalPattern {
  period: string;
  type: 'weekly' | 'monthly' | 'dayOfWeek' | 'hourly';
  avgRating: number;
  volume: number;
  sentiment: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface TimeSeriesData {
  period: string;
  avgRating: number;
  volume: number;
  sentiment: number;
  responseRate: number;
}

export interface SeasonalPattern {
  season: string;
  avgRating: number;
  volume: number;
  sentiment: number;
  commonThemes: string[];
  yearOverYearChange: number;
}

export interface TrendAnalysis {
  monthlyMetrics: TimeSeriesData[];
  trends: Record<string, 'increasing' | 'stable' | 'decreasing'>;
  significantChanges: Array<{
    period: string;
    metric: string;
    change: number;
    significance: 'high' | 'medium' | 'low';
  }>;
  projections: TimeSeriesData[];
}

export interface ClusteredReviews {
  bySentiment: Record<string, Review[]>;
  byTheme: Record<string, Review[]>;
  byRating: Record<number, Review[]>;
  byLength: Record<string, Review[]>;
  byResponseStatus: Record<string, Review[]>;
}

export interface EnhancedAnalysisResult {
  temporalPatterns: TemporalPattern[];
  historicalTrends: TrendAnalysis;
  clusteredReviews: ClusteredReviews;
  seasonalPatterns: SeasonalPattern[];
}
