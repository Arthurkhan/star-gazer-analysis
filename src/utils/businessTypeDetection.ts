import { BusinessType } from '@/types/businessTypes';

// Define business configurations with the expected structure
const BUSINESS_CONFIGS = {
  CAFE: {
    type: 'CAFE',
    name: 'The Little Prince Cafe',
    tableName: 'The Little Prince Cafe',
    industry: 'Food & Beverage',
    keywords: ['cafe', 'coffee', 'espresso', 'latte', 'pastry'],
    primaryFocus: 'Coffee quality and ambiance',
    keyMetrics: ['drink quality', 'atmosphere', 'wifi', 'seating'],
    recommendationFocus: 'customer experience and beverage quality',
  },
  BAR: {
    type: 'BAR',
    name: 'Vol de Nuit, The Hidden Bar',
    tableName: 'Vol de Nuit, The Hidden Bar',
    industry: 'Food & Beverage',
    keywords: ['bar', 'cocktails', 'drinks', 'nightlife', 'pub'],
    primaryFocus: 'Atmosphere and drink selection',
    keyMetrics: ['drink variety', 'atmosphere', 'music', 'crowd'],
    recommendationFocus: 'nightlife experience and beverage menu',
  },
  GALLERY: {
    type: 'GALLERY',
    name: "L'Envol Art Space",
    tableName: "L'Envol Art Space",
    industry: 'Arts & Culture',
    keywords: ['art', 'gallery', 'museum', 'exhibition', 'space'],
    primaryFocus: 'Art curation and experience',
    keyMetrics: ['exhibitions', 'curation', 'space', 'events'],
    recommendationFocus: 'artistic value and visitor experience',
  },
};

// Valid business names for validation
const VALID_BUSINESS_NAMES = [
  'The Little Prince Cafe',
  'Vol de Nuit, The Hidden Bar',
  "L'Envol Art Space",
];

/**
 * Detect business type from business name
 */
export function detectBusinessType(businessName: string): string {
  if (!businessName) {
    return 'CAFE'; // Default as per test expectations
  }

  const name = businessName.toLowerCase();

  // Check specific business names first
  if (name.includes('little prince') && name.includes('cafe')) {
    return 'CAFE';
  }
  if (name.includes('vol de nuit') && name.includes('bar')) {
    return 'BAR';
  }
  if (name.includes("l'envol") && name.includes('art')) {
    return 'GALLERY';
  }

  // Check for general keywords
  if (name.includes('cafe') || name.includes('coffee')) {
    return 'CAFE';
  }
  if (name.includes('bar') || name.includes('pub')) {
    return 'BAR';
  }
  if (name.includes('gallery') || name.includes('art') || name.includes('museum')) {
    return 'GALLERY';
  }

  // Default to CAFE for unknown types
  return 'CAFE';
}

/**
 * Get business configuration for a business type
 */
export function getBusinessConfig(businessType: string) {
  if (!(businessType in BUSINESS_CONFIGS)) {
    throw new Error(`Invalid business type: ${businessType}`);
  }
  return BUSINESS_CONFIGS[businessType as keyof typeof BUSINESS_CONFIGS];
}

/**
 * Validate if a business name is valid
 */
export function isValidBusinessName(businessName: string | null | undefined): boolean {
  if (!businessName) {
    return false;
  }
  
  return VALID_BUSINESS_NAMES.some(
    validName => validName.toLowerCase() === businessName.toLowerCase()
  );
}

// Keep the original function for backward compatibility with business data objects
export function detectBusinessTypeFromData(businessData: any): BusinessType {
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
