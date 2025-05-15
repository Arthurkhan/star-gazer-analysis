export interface TemporalPattern {
  pattern: 'daily' | 'weekly' | 'monthly' | 'seasonal';
  description: string;
  strength: number; // 0-1 confidence score
  data: {
    period: string;
    metric: string;
    value: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }[];
}

export interface HistoricalTrend {
  metric: string;
  timeframe: 'month' | 'quarter' | 'year';
  data: {
    period: string;
    value: number;
    percentageChange: number;
  }[];
  trend: 'improving' | 'declining' | 'stable' | 'volatile';
  forecast?: {
    nextPeriod: string;
    predictedValue: number;
    confidence: number;
  };
}

export interface ReviewCluster {
  id: string;
  name: string;
  description: string;
  reviewCount: number;
  averageRating: number;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  keywords: string[];
  examples: string[];
  insights: string[];
}

export interface SeasonalPattern {
  season: 'spring' | 'summer' | 'fall' | 'winter' | 'holiday' | 'custom';
  name: string;
  dateRange: {
    start: string;
    end: string;
  };
  metrics: {
    avgRating: number;
    reviewVolume: number;
    sentiment: number;
    topThemes: string[];
  };
  comparison: {
    vsYearAverage: number;
    vsPreviousYear: number;
  };
  recommendations: string[];
}

export interface EnhancedAnalysis {
  temporalPatterns: TemporalPattern[];
  historicalTrends: HistoricalTrend[];
  reviewClusters: ReviewCluster[];
  seasonalAnalysis: SeasonalPattern[];
  insights: {
    keyFindings: string[];
    opportunities: string[];
    risks: string[];
  };
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface PatternRecognitionResult {
  patternType: string;
  confidence: number;
  description: string;
  actionableInsight: string;
  affectedMetrics: string[];
}
