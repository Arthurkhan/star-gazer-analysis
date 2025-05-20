export interface EnhancedAnalysis {
  temporalPatterns: {
    dayOfWeek: { day: string; count: number }[];
    timeOfDay: { time: string; count: number }[];
  };
  historicalTrends: {
    period: string;
    avgRating: number;
    reviewCount: number;
  }[];
  reviewClusters: {
    name: string;
    keywords: string[];
    count: number;
    sentiment: string;
  }[];
  seasonalAnalysis: {
    season: string;
    count: number;
    avgRating: number;
  }[];
  insights: string[];
}

export interface PeriodComparisonData {
  prevPeriod: {
    startDate: Date;
    endDate: Date;
    avgRating: number;
    reviewCount: number;
    sentimentDistribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
  currentPeriod: {
    startDate: Date;
    endDate: Date;
    avgRating: number;
    reviewCount: number;
    sentimentDistribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
  changes: {
    ratingChange: number;
    reviewCountChange: number;
    reviewCountPercentChange: number;
    sentimentChange: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
}
