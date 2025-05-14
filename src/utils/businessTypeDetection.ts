import { BusinessType } from '@/types/businessTypes';

export function detectBusinessType(businessData: any): BusinessType {
  if (!businessData || !businessData.reviews) {
    return BusinessType.OTHER;
  }

  const reviews = businessData.reviews || [];
  
  // Safely handle the review texts
  const reviewTexts = reviews
    .map((r: any) => (r?.text || r?.comment || '').toLowerCase())
    .filter((text: string) => text.length > 0)
    .join(' ');
    
  const businessName = (businessData.name || '').toLowerCase();

  // Define keywords for each business type
  const businessTypeKeywords = {
    [BusinessType.CAFE]: ['coffee', 'espresso', 'latte', 'cappuccino', 'pastry', 'bakery', 'brew', 'barista'],
    [BusinessType.BAR]: ['drinks', 'cocktail', 'beer', 'wine', 'liquor', 'bartender', 'happy hour', 'nightlife'],
    [BusinessType.RESTAURANT]: ['food', 'menu', 'meal', 'dinner', 'lunch', 'chef', 'cuisine', 'dish', 'restaurant'],
    [BusinessType.GALLERY]: ['art', 'exhibition', 'artist', 'painting', 'sculpture', 'gallery', 'curator', 'artwork'],
    [BusinessType.RETAIL]: ['shop', 'store', 'buy', 'purchase', 'merchandise', 'product', 'shopping', 'retail'],
    [BusinessType.SERVICE]: ['service', 'professional', 'consultation', 'appointment', 'technician', 'repair', 'maintenance'],
  };

  // Count keyword occurrences
  const keywordCounts: Record<BusinessType, number> = {
    [BusinessType.CAFE]: 0,
    [BusinessType.BAR]: 0,
    [BusinessType.RESTAURANT]: 0,
    [BusinessType.GALLERY]: 0,
    [BusinessType.RETAIL]: 0,
    [BusinessType.SERVICE]: 0,
    [BusinessType.OTHER]: 0,
  };

  // Check business name first (higher weight)
  for (const [type, keywords] of Object.entries(businessTypeKeywords)) {
    for (const keyword of keywords) {
      if (businessName.includes(keyword)) {
        keywordCounts[type as BusinessType] += 3; // Higher weight for name matches
      }
    }
  }

  // Then check review content
  if (reviewTexts.length > 0) {
    for (const [type, keywords] of Object.entries(businessTypeKeywords)) {
      for (const keyword of keywords) {
        const occurrences = (reviewTexts.match(new RegExp(keyword, 'g')) || []).length;
        keywordCounts[type as BusinessType] += occurrences;
      }
    }
  }

  // Find the type with the highest count
  let maxCount = 0;
  let detectedType = BusinessType.OTHER;
  
  for (const [type, count] of Object.entries(keywordCounts)) {
    if (count > maxCount && type !== BusinessType.OTHER) {
      maxCount = count;
      detectedType = type as BusinessType;
    }
  }

  // If no clear winner, check for specific patterns
  if (detectedType === BusinessType.OTHER || maxCount < 5) {
    // Check if it's a restaurant based on ratings/reviews about food
    const foodRelatedTerms = ['delicious', 'tasty', 'flavor', 'portion', 'waiter', 'waitress'];
    const foodCount = foodRelatedTerms.reduce((count, term) => 
      count + (reviewTexts.match(new RegExp(term, 'g')) || []).length, 0
    );
    
    if (foodCount > 10) {
      detectedType = BusinessType.RESTAURANT;
    }
  }

  return detectedType;
}

// Get business-specific configuration
export function getBusinessConfig(businessType: BusinessType) {
  const configs = {
    [BusinessType.CAFE]: {
      primaryFocus: 'Coffee quality and ambiance',
      keyMetrics: ['drink quality', 'atmosphere', 'wifi', 'seating'],
      recommendationFocus: 'customer experience and beverage quality',
    },
    [BusinessType.BAR]: {
      primaryFocus: 'Atmosphere and drink selection',
      keyMetrics: ['drink variety', 'atmosphere', 'music', 'crowd'],
      recommendationFocus: 'nightlife experience and beverage menu',
    },
    [BusinessType.RESTAURANT]: {
      primaryFocus: 'Food quality and service',
      keyMetrics: ['food quality', 'service', 'value', 'cleanliness'],
      recommendationFocus: 'culinary experience and customer service',
    },
    [BusinessType.GALLERY]: {
      primaryFocus: 'Art curation and experience',
      keyMetrics: ['exhibitions', 'curation', 'space', 'events'],
      recommendationFocus: 'artistic value and visitor experience',
    },
    [BusinessType.RETAIL]: {
      primaryFocus: 'Product selection and service',
      keyMetrics: ['product variety', 'pricing', 'customer service', 'location'],
      recommendationFocus: 'inventory management and customer satisfaction',
    },
    [BusinessType.SERVICE]: {
      primaryFocus: 'Service quality and reliability',
      keyMetrics: ['professionalism', 'timeliness', 'quality', 'communication'],
      recommendationFocus: 'service excellence and client relationships',
    },
    [BusinessType.OTHER]: {
      primaryFocus: 'Overall customer satisfaction',
      keyMetrics: ['quality', 'service', 'value', 'experience'],
      recommendationFocus: 'general business improvement',
    },
  };

  return configs[businessType];
}
