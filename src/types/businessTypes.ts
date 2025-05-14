export enum BusinessType {
  CAFE = 'cafe',
  BAR = 'bar',
  RESTAURANT = 'restaurant',
  GALLERY = 'gallery',
  RETAIL = 'retail',
  SERVICE = 'service',
  OTHER = 'other'
}

export interface BusinessMetrics {
  averageRating: number;
  monthlyReviews: number;
  responseRate: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  commonThemes: string[];
  customerComplaints: string[];
}

export interface IndustryBenchmark {
  businessType: BusinessType;
  avgRating: number;
  monthlyReviews: number;
  responseRate: number;
  commonThemes: string[];
  successMetrics: {
    excellentThreshold: number;
    goodThreshold: number;
    needsImprovementThreshold: number;
  };
}

export const industryBenchmarks: Record<BusinessType, IndustryBenchmark> = {
  [BusinessType.CAFE]: {
    businessType: BusinessType.CAFE,
    avgRating: 4.2,
    monthlyReviews: 150,
    responseRate: 0.3,
    commonThemes: ['coffee', 'atmosphere', 'wifi', 'service', 'pastries'],
    successMetrics: {
      excellentThreshold: 4.5,
      goodThreshold: 4.0,
      needsImprovementThreshold: 3.5
    }
  },
  [BusinessType.BAR]: {
    businessType: BusinessType.BAR,
    avgRating: 4.0,
    monthlyReviews: 120,
    responseRate: 0.25,
    commonThemes: ['drinks', 'atmosphere', 'music', 'service', 'crowd'],
    successMetrics: {
      excellentThreshold: 4.3,
      goodThreshold: 3.8,
      needsImprovementThreshold: 3.3
    }
  },
  [BusinessType.RESTAURANT]: {
    businessType: BusinessType.RESTAURANT,
    avgRating: 4.1,
    monthlyReviews: 200,
    responseRate: 0.35,
    commonThemes: ['food', 'service', 'ambiance', 'value', 'menu'],
    successMetrics: {
      excellentThreshold: 4.4,
      goodThreshold: 3.9,
      needsImprovementThreshold: 3.4
    }
  },
  [BusinessType.GALLERY]: {
    businessType: BusinessType.GALLERY,
    avgRating: 4.4,
    monthlyReviews: 80,
    responseRate: 0.4,
    commonThemes: ['art', 'exhibitions', 'curation', 'space', 'events'],
    successMetrics: {
      excellentThreshold: 4.6,
      goodThreshold: 4.2,
      needsImprovementThreshold: 3.8
    }
  },
  [BusinessType.RETAIL]: {
    businessType: BusinessType.RETAIL,
    avgRating: 4.0,
    monthlyReviews: 100,
    responseRate: 0.2,
    commonThemes: ['selection', 'prices', 'service', 'quality', 'location'],
    successMetrics: {
      excellentThreshold: 4.3,
      goodThreshold: 3.8,
      needsImprovementThreshold: 3.3
    }
  },
  [BusinessType.SERVICE]: {
    businessType: BusinessType.SERVICE,
    avgRating: 4.3,
    monthlyReviews: 90,
    responseRate: 0.4,
    commonThemes: ['professionalism', 'quality', 'timeliness', 'value', 'communication'],
    successMetrics: {
      excellentThreshold: 4.5,
      goodThreshold: 4.0,
      needsImprovementThreshold: 3.5
    }
  },
  [BusinessType.OTHER]: {
    businessType: BusinessType.OTHER,
    avgRating: 4.1,
    monthlyReviews: 100,
    responseRate: 0.3,
    commonThemes: ['service', 'quality', 'value', 'experience', 'location'],
    successMetrics: {
      excellentThreshold: 4.4,
      goodThreshold: 3.9,
      needsImprovementThreshold: 3.4
    }
  }
};