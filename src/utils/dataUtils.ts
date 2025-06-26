import type {
  Review,
  SentimentData,
  LanguageData,
  MonthlyReviewData,
  InsightsData,
  ThemeData,
  TrendPoint,
  StaffMention} from '@/types/reviews'
import {
  reviewFieldAccessor,
} from '@/types/reviews'

// Calculate average rating from reviews
export const calculateAverageRating = (reviews: Review[]): number => {
  if (reviews.length === 0) return 0

  const sum = reviews.reduce((total, review) => total + review.stars, 0)
  return sum / reviews.length
}

// Count reviews by rating (1-5 stars)
export const countReviewsByRating = (
  reviews: Review[],
): Record<number, number> => {
  return reviews.reduce((counts, review) => {
    const {stars} = review
    counts[stars] = (counts[stars] || 0) + 1
    return counts
  }, {} as Record<number, number>)
}

// Calculate response rate from owner - FIXED ISSUE
export const calculateResponseRate = (reviews: Review[]): number => {
  if (reviews.length === 0) return 0

  const reviewsWithResponses = reviews.filter(review => {
    const responseText = reviewFieldAccessor.getResponseText(review)
    return responseText && responseText.trim().length > 0
  })

  return (reviewsWithResponses.length / reviews.length) * 100
}

// Calculate engagement metrics - NEW FUNCTION
export const calculateEngagementMetrics = (reviews: Review[]): {
  responseRate: number;
  responseCount: number;
  avgResponseLength: number;
  responseByRating: Record<number, { total: number; responded: number; rate: number }>;
  recentResponseRate: number; // Last 3 months
} => {
  if (reviews.length === 0) {
    return {
      responseRate: 0,
      responseCount: 0,
      avgResponseLength: 0,
      responseByRating: {},
      recentResponseRate: 0,
    }
  }

  // Overall response metrics
  const reviewsWithResponses = reviews.filter(review => {
    const responseText = reviewFieldAccessor.getResponseText(review)
    return responseText && responseText.trim().length > 0
  })

  const responseRate = (reviewsWithResponses.length / reviews.length) * 100
  const responseCount = reviewsWithResponses.length

  // Calculate average response length
  const totalResponseLength = reviewsWithResponses.reduce((total, review) => {
    const responseText = reviewFieldAccessor.getResponseText(review)
    return total + (responseText?.length || 0)
  }, 0)

  const avgResponseLength = responseCount > 0 ? totalResponseLength / responseCount : 0

  // Response rate by rating
  const responseByRating: Record<number, { total: number; responded: number; rate: number }> = {}

  for (let rating = 1; rating <= 5; rating++) {
    const reviewsWithRating = reviews.filter(r => r.stars === rating)
    const responsesWithRating = reviewsWithRating.filter(review => {
      const responseText = reviewFieldAccessor.getResponseText(review)
      return responseText && responseText.trim().length > 0
    })

    responseByRating[rating] = {
      total: reviewsWithRating.length,
      responded: responsesWithRating.length,
      rate: reviewsWithRating.length > 0 ? (responsesWithRating.length / reviewsWithRating.length) * 100 : 0,
    }
  }

  // Recent response rate (last 3 months)
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const recentReviews = reviews.filter(review => {
    const publishedDate = reviewFieldAccessor.getPublishedDate(review)
    if (!publishedDate) return false

    const reviewDate = new Date(publishedDate)
    return reviewDate >= threeMonthsAgo
  })

  const recentReviewsWithResponses = recentReviews.filter(review => {
    const responseText = reviewFieldAccessor.getResponseText(review)
    return responseText && responseText.trim().length > 0
  })

  const recentResponseRate = recentReviews.length > 0
    ? (recentReviewsWithResponses.length / recentReviews.length) * 100
    : 0

  return {
    responseRate,
    responseCount,
    avgResponseLength,
    responseByRating,
    recentResponseRate,
  }
}

// Group reviews by month, calculate count and month-over-month comparison
export const groupReviewsByMonth = (reviews: Review[]): MonthlyReviewData[] => {
  // Create a map for months
  const monthMap = new Map<string, { count: number }>()

  // Sort reviews by date
  const sortedReviews = [...reviews].sort(
    (a, b) => new Date(reviewFieldAccessor.getPublishedDate(a) || '').getTime() - new Date(reviewFieldAccessor.getPublishedDate(b) || '').getTime(),
  )

  sortedReviews.forEach(review => {
    const publishedDate = reviewFieldAccessor.getPublishedDate(review)
    if (!publishedDate) return

    const date = new Date(publishedDate)
    const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

    if (!monthMap.has(monthYear)) {
      monthMap.set(monthYear, { count: 0 })
    }

    const current = monthMap.get(monthYear)!
    current.count += 1
  })

  // Convert map to array
  const result: MonthlyReviewData[] = []

  monthMap.forEach((value, key) => {
    result.push({
      month: key,
      count: value.count,
      cumulativeCount: 0, // Will be calculated next
    })
  })

  // Sort by date to ensure chronological order
  result.sort((a, b) => {
    const dateA = new Date(a.month)
    const dateB = new Date(b.month)
    return dateA.getTime() - dateB.getTime()
  })

  // Calculate cumulative count
  let cumulativeCount = 0
  const cumulativeResult = result.map(item => {
    cumulativeCount += item.count
    return {
      ...item,
      cumulativeCount,
    }
  })

  return cumulativeResult
}

// Calculate monthly comparison data
export const calculateMonthlyComparison = (reviews: Review[]): {
  vsLastMonth: number;
  vsLastYear: number;
  currentMonthCount: number;
  previousMonthCount: number;
  previousYearSameMonthCount: number;
} => {
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  // Current month
  const currentMonthReviews = reviews.filter(review => {
    const publishedDate = reviewFieldAccessor.getPublishedDate(review)
    if (!publishedDate) return false

    const reviewDate = new Date(publishedDate)
    return reviewDate.getMonth() === currentMonth && reviewDate.getFullYear() === currentYear
  })

  // Previous month
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

  const previousMonthReviews = reviews.filter(review => {
    const publishedDate = reviewFieldAccessor.getPublishedDate(review)
    if (!publishedDate) return false

    const reviewDate = new Date(publishedDate)
    return reviewDate.getMonth() === previousMonth && reviewDate.getFullYear() === previousMonthYear
  })

  // Same month last year
  const previousYearSameMonthReviews = reviews.filter(review => {
    const publishedDate = reviewFieldAccessor.getPublishedDate(review)
    if (!publishedDate) return false

    const reviewDate = new Date(publishedDate)
    return reviewDate.getMonth() === currentMonth && reviewDate.getFullYear() === currentYear - 1
  })

  const currentMonthCount = currentMonthReviews.length
  const previousMonthCount = previousMonthReviews.length
  const previousYearSameMonthCount = previousYearSameMonthReviews.length

  // Calculate differences
  const vsLastMonth = currentMonthCount - previousMonthCount
  const vsLastYear = currentMonthCount - previousYearSameMonthCount

  return {
    vsLastMonth,
    vsLastYear,
    currentMonthCount,
    previousMonthCount,
    previousYearSameMonthCount,
  }
}

// Analyze sentiment from the database "sentiment" column
export const analyzeReviewSentiment_sync = (reviews: Review[]): SentimentData[] => {
  const sentimentCounts: Record<string, number> = {
    'positive': 0,
    'neutral': 0,
    'negative': 0,
  }

  reviews.forEach(review => {
    const sentiment = review.sentiment?.toLowerCase() || 'neutral'
    if (sentiment.includes('positive')) {
      sentimentCounts['positive']++
    } else if (sentiment.includes('negative')) {
      sentimentCounts['negative']++
    } else {
      sentimentCounts['neutral']++
    }
  })

  return [
    { name: 'Positive', value: sentimentCounts['positive'] },
    { name: 'Neutral', value: sentimentCounts['neutral'] },
    { name: 'Negative', value: sentimentCounts['negative'] },
  ]
}

// Async version for compatibility
export const analyzeReviewSentiment = async (reviews: Review[]): Promise<SentimentData[]> => {
  return analyzeReviewSentiment_sync(reviews)
}

// Count reviews by language - FIXED to use new language field
export const countReviewsByLanguage = (reviews: Review[]): LanguageData[] => {
  const languageCounts: Record<string, number> = {}

  reviews.forEach(review => {
    // Use the new language field from the database
    const language = reviewFieldAccessor.getLanguage(review)
    const languageName = getLanguageDisplayName(language)

    languageCounts[languageName] = (languageCounts[languageName] || 0) + 1
  })

  // Convert to array and sort by count
  return Object.entries(languageCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

// Helper function to convert language codes to display names
const getLanguageDisplayName = (languageCode: string): string => {
  if (!languageCode || languageCode === 'unknown') {
    return 'Unknown'
  }

  const languageMap: Record<string, string> = {
    'en': 'English',
    'th': 'Thai',
    'fr': 'French',
    'zh': 'Chinese',
    'zh-Hant': 'Chinese (Traditional)',
    'ja': 'Japanese',
    'ko': 'Korean',
    'de': 'German',
    'ru': 'Russian',
    'vi': 'Vietnamese',
    'es': 'Spanish',
    'pl': 'Polish',
    'nl': 'Dutch',
    'pt': 'Portuguese',
    'ta': 'Tamil',
    'fil': 'Filipino',
    'bg': 'Bulgarian',
    'id': 'Indonesian',
    'ro': 'Romanian',
    'iw': 'Hebrew',
    'it': 'Italian',
    'ar': 'Arabic',
    'sv': 'Swedish',
    'no': 'Norwegian',
    'da': 'Danish',
    'fi': 'Finnish',
    'hu': 'Hungarian',
    'cs': 'Czech',
    'sk': 'Slovak',
    'hr': 'Croatian',
    'sl': 'Slovenian',
    'et': 'Estonian',
    'lv': 'Latvian',
    'lt': 'Lithuanian',
    'mt': 'Maltese',
    'tr': 'Turkish',
    'uk': 'Ukrainian',
    'be': 'Belarusian',
    'mk': 'Macedonian',
    'sq': 'Albanian',
    'sr': 'Serbian',
    'bs': 'Bosnian',
    'me': 'Montenegrin',
    'el': 'Greek',
    'cy': 'Welsh',
    'ga': 'Irish',
    'gd': 'Scottish Gaelic',
    'eu': 'Basque',
    'ca': 'Catalan',
    'gl': 'Galician',
    'pt-BR': 'Portuguese (Brazil)',
    'es-MX': 'Spanish (Mexico)',
    'en-US': 'English (US)',
    'en-GB': 'English (UK)',
    'fr-CA': 'French (Canada)',
    'zh-CN': 'Chinese (Simplified)',
    'zh-TW': 'Chinese (Taiwan)',
    'hi': 'Hindi',
    'bn': 'Bengali',
    'ur': 'Urdu',
    'te': 'Telugu',
    'mr': 'Marathi',
    'gu': 'Gujarati',
    'kn': 'Kannada',
    'ml': 'Malayalam',
    'pa': 'Punjabi',
    'or': 'Odia',
    'as': 'Assamese',
    'ne': 'Nepali',
    'si': 'Sinhala',
    'my': 'Myanmar',
    'km': 'Khmer',
    'lo': 'Lao',
    'mn': 'Mongolian',
    'ka': 'Georgian',
    'hy': 'Armenian',
    'az': 'Azerbaijani',
    'kk': 'Kazakh',
    'ky': 'Kyrgyz',
    'tg': 'Tajik',
    'tk': 'Turkmen',
    'uz': 'Uzbek',
  }

  return languageMap[languageCode] || languageCode.charAt(0).toUpperCase() + languageCode.slice(1)
}

// Enhanced helper function to normalize and consolidate similar staff names
const normalizeStaffName = (name: string): string => {
  const nameLower = name.toLowerCase().trim()

  // Enhanced name variants mapping with more comprehensive consolidation
  const nameVariants: Record<string, string[]> = {
    'arnaud': ['mr. arnaud', 'mr.arnaud', 'mr arnaud', 'the boss', 'arnaud nazare', 'arnoud', 'arnaud nazare-aga', 'artist', 'armand', 'arnould', 'arnout', 'owner'],
    'anna': ['ana', 'anne', 'nong ana', 'nong ena', 'ann', 'ani', 'ania'],
    'sam': ['sammy', 'samuel', 'samantha', 'samm', 'sammie', 'sami'],
    'dave': ['david', 'davey', 'davie', 'davy'],
    'mike': ['michael', 'mikey', 'michel', 'mick', 'mickey', 'mik'],
    'alex': ['alexander', 'alexandra', 'alexa', 'alexis', 'alessandra', 'alyx'],
    'peps': ['pepsi', 'pep', 'pepsy', 'peppy'],
    'jen': ['jennifer', 'jenny', 'jenn', 'jenna'],
    'liz': ['elizabeth', 'lizzie', 'liza', 'eliza', 'beth'],
    'kate': ['katherine', 'kathy', 'katie', 'catherine', 'kat'],
    'tom': ['thomas', 'tommy', 'tomm'],
    'chris': ['christopher', 'christine', 'christy', 'christina'],
    'joe': ['joseph', 'joey', 'jo'],
    'rob': ['robert', 'robbie', 'bob', 'bobby'],
    'nick': ['nicholas', 'nicolas', 'nico', 'nicky'],
    'matt': ['matthew', 'mathew', 'mat', 'matty'],
  }

  // Check if this name is a variant of a primary name
  for (const [primary, variants] of Object.entries(nameVariants)) {
    if (variants.includes(nameLower) || primary === nameLower) {
      // Capitalize first letter
      return primary.charAt(0).toUpperCase() + primary.slice(1)
    }
  }

  // Check for partial matches if no exact match is found
  for (const [primary, variants] of Object.entries(nameVariants)) {
    if (nameLower.includes(primary) || variants.some(v => nameLower.includes(v))) {
      return primary.charAt(0).toUpperCase() + primary.slice(1)
    }
  }

  // If not a recognized variant, return original name with first letter capitalized
  return name.charAt(0).toUpperCase() + name.slice(1)
}

// Extract staff mentions from "staffMentioned" column
export const extractStaffMentions_sync = (reviews: Review[]): StaffMention[] => {
  const staffMap: Record<string, { count: number, sentiment: string, examples: string[] }> = {}

  reviews.forEach(review => {
    const staffMentioned = reviewFieldAccessor.getStaffMentioned(review)
    if (!staffMentioned) return

    // Split by commas or semicolons if multiple staff are mentioned
    const staffNames = staffMentioned.split(/[,;]/).map(s => s.trim()).filter(Boolean)

    staffNames.forEach(staffName => {
      if (!staffName) return

      // Normalize staff name to consolidate variants
      const normalizedName = normalizeStaffName(staffName)

      if (!staffMap[normalizedName]) {
        staffMap[normalizedName] = { count: 0, sentiment: 'neutral', examples: [] }
      }

      staffMap[normalizedName].count++

      // Determine sentiment based on review sentiment
      if (review.sentiment?.toLowerCase().includes('positive')) {
        staffMap[normalizedName].sentiment = 'positive'
      } else if (review.sentiment?.toLowerCase().includes('negative')) {
        staffMap[normalizedName].sentiment = 'negative'
      }

      // Add review text as example if not already present
      if (review.text && !staffMap[normalizedName].examples.includes(review.text)) {
        if (staffMap[normalizedName].examples.length < 3) { // Limit to 3 examples
          staffMap[normalizedName].examples.push(review.text)
        }
      }
    })
  })

  // Convert to array and sort by count
  return Object.entries(staffMap)
    .map(([name, data]) => ({
      name,
      count: data.count,
      sentiment: data.sentiment as 'positive' | 'negative' | 'neutral',
      examples: data.examples,
    }))
    .sort((a, b) => b.count - a.count)
}

// Async version for compatibility
export const extractStaffMentions = async (reviews: Review[]): Promise<StaffMention[]> => {
  return extractStaffMentions_sync(reviews)
}

// Enhanced function to extract and categorize common terms with better grouping
export const extractCommonTerms_sync = (reviews: Review[]): {text: string, count: number, category?: string}[] => {
  // Define more comprehensive term categories for better grouping
  const categories: Record<string, { name: string, terms: string[] }> = {
    'service': {
      name: 'Service Quality',
      terms: ['service', 'staff', 'waiter', 'waitress', 'server', 'customer service', 'employee', 'friendly', 'attentive',
              'helpful', 'professional', 'quick', 'slow', 'reception', 'greeting', 'hospitality', 'welcoming', 'hostess',
              'host', 'team', 'personnel', 'efficient', 'inefficient', 'manager', 'supervisor', 'bartender', 'barista'],
    },
    'ambiance': {
      name: 'Ambiance & Atmosphere',
      terms: ['ambiance', 'atmosphere', 'decor', 'environment', 'vibe', 'interior', 'mood', 'lighting', 'music', 'cozy',
              'romantic', 'quiet', 'loud', 'crowded', 'tranquil', 'relaxing', 'comfortable', 'decoration', 'design',
              'setting', 'ambience', 'seating', 'chairs', 'tables', 'space', 'scenery', 'view', 'aesthetics', 'style'],
    },
    'location': {
      name: 'Location & Accessibility',
      terms: ['location', 'place', 'area', 'neighborhood', 'parking', 'accessibility', 'central', 'convenient', 'hidden',
              'address', 'directions', 'situated', 'tucked', 'distance', 'nearby', 'metro', 'transport', 'station',
              'street', 'avenue', 'boulevard', 'district', 'quarter', 'remote', 'secluded', 'entrance', 'exit'],
    },
    'art': {
      name: 'Art & Gallery',
      terms: ['art', 'artwork', 'exhibition', 'gallery', 'artist', 'painting', 'sculpture', 'creative', 'display', 'exhibit',
              'installation', 'piece', 'collection', 'canvas', 'portrait', 'masterpiece', 'artistic', 'cultural', 'visual',
              'contemporary', 'modern', 'traditional', 'crafts', 'handmade', 'talent', 'creation', 'showcase', 'vernissage'],
    },
    'little_prince': {
      name: 'Little Prince Theme',
      terms: ['little prince', 'prince', 'exupery', 'fox', 'rose', 'planet', 'book theme', 'story', 'theme', 'character',
              'saint-exupery', 'le petit prince', 'aviator', 'stars', 'asteroid', 'fairy tale', 'fable', 'inspiration',
              'literature', 'classic', 'childhood', 'nostalgic', 'fantasy', 'philosophical', 'quotes', 'illustrations'],
    },
    'food': {
      name: 'Food & Beverage',
      terms: ['food', 'drink', 'menu', 'dish', 'meal', 'taste', 'flavor', 'coffee', 'wine', 'cocktail', 'dessert',
              'appetizer', 'delicious', 'tasty', 'fresh', 'cuisine', 'ingredient', 'specialty', 'chef', 'cooking', 'recipe',
              'selection', 'options', 'variety', 'breakfast', 'lunch', 'dinner', 'brunch', 'snack', 'beverage', 'juice',
              'tea', 'water', 'alcohol', 'beer', 'champagne', 'signature', 'spicy', 'sweet', 'savory', 'organic', 'local',
              'homemade', 'authentic', 'traditional', 'innovative', 'fusion', 'pizza', 'pasta', 'burger', 'steak', 'seafood',
              'vegetarian', 'vegan', 'gluten-free', 'diet', 'portion', 'presentation', 'plating', 'culinary', 'gourmet',
              'dining', 'feast', 'tasting', 'pairing', 'cuisine'],
    },
    'value': {
      name: 'Value & Price',
      terms: ['price', 'value', 'expensive', 'cheap', 'reasonable', 'overpriced', 'worth', 'cost', 'portion', 'money',
              'affordable', 'pricey', 'budget', 'economical', 'luxury', 'premium', 'bargain', 'deal', 'discount',
              'special offer', 'promotion', 'happy hour', 'quality-price', 'investment', 'spending', 'bill', 'check',
              'payment', 'credit card', 'cash', 'tip', 'service charge', 'inclusive', 'exclusive'],
    },
    'cleanliness': {
      name: 'Cleanliness & Hygiene',
      terms: ['clean', 'tidy', 'hygiene', 'spotless', 'dirty', 'neat', 'sanitary', 'bathroom', 'toilet', 'restroom',
              'washroom', 'shower', 'sink', 'soap', 'sanitizer', 'disinfectant', 'dusty', 'smelly', 'odor', 'fresh',
              'maintenance', 'housekeeping', 'standards', 'protocols', 'health', 'safety', 'covid', 'pandemic',
              'precautions', 'measures', 'washing', 'wiping', 'mopping', 'vacuuming', 'sweeping'],
    },
    'experience': {
      name: 'Overall Experience',
      terms: ['experience', 'visit', 'return', 'recommend', 'again', 'never', 'always', 'favorite', 'best', 'worst',
              'disappointed', 'impressive', 'satisfaction', 'dissatisfaction', 'happy', 'unhappy', 'pleased', 'displeased',
              'enjoyable', 'unpleasant', 'memorable', 'forgettable', 'excellent', 'terrible', 'fantastic', 'horrible',
              'amazing', 'outstanding', 'disappointing', 'superb', 'exceptional', 'mediocre', 'average', 'standard',
              'below average', 'above average', 'expectation', 'surprise', 'shock', 'delight', 'frustration', 'joy',
              'anger', 'sadness', 'excitement', 'boredom', 'pleasure', 'pain', 'relief', 'stress', 'relaxation'],
    },
    'special_events': {
      name: 'Special Events & Occasions',
      terms: ['event', 'occasion', 'celebration', 'birthday', 'anniversary', 'wedding', 'engagement', 'graduation',
              'promotion', 'party', 'meeting', 'conference', 'workshop', 'seminar', 'lecture', 'presentation',
              'performance', 'concert', 'show', 'exhibition', 'display', 'demonstration', 'festival', 'fair',
              'carnival', 'parade', 'ceremony', 'reception', 'gathering', 'reunion', 'date', 'romantic', 'special'],
    },
    'booking': {
      name: 'Booking & Reservation',
      terms: ['booking', 'reservation', 'appointment', 'scheduled', 'advance', 'confirmed', 'cancelled', 'modified',
              'changed', 'rescheduled', 'online', 'phone', 'email', 'website', 'app', 'platform', 'system',
              'confirmation', 'reminder', 'notification', 'deposit', 'prepayment', 'waiting list', 'availability',
              'full', 'busy', 'quiet', 'peak', 'off-peak', 'season', 'holiday', 'weekend', 'weekday'],
    },
  }

  // Create a map to merge similar terms and count occurrences
  const termsMap: Record<string, { count: number, category?: string }> = {}

  // Process term stems for better matching
  const getStem = (term: string): string => {
    // Simple stemming to match related words
    const simpleStems: Record<string, string[]> = {
      'clean': ['cleaning', 'cleanliness', 'cleaner', 'cleanest'],
      'staff': ['staffs', 'staffing', 'staffed'],
      'serve': ['service', 'serving', 'served', 'server', 'servers'],
      'decor': ['decoration', 'decorations', 'decorated', 'decorative'],
      'price': ['prices', 'pricing', 'priced'],
      'food': ['foods', 'foodie'],
      'recommend': ['recommendation', 'recommendations', 'recommending', 'recommended'],
      'visit': ['visiting', 'visited', 'visitor', 'visitors'],
      'atmosphere': ['atmospheric', 'ambiance', 'ambience'],
      'experience': ['experiences', 'experienced', 'experiencing'],
      'delicious': ['tasty', 'flavorful', 'yummy', 'appetizing', 'savory', 'scrumptious'],
      'friendly': ['welcoming', 'hospitable', 'warm', 'cordial', 'amicable'],
    }

    // Check if term matches any stem group
    for (const [stem, variants] of Object.entries(simpleStems)) {
      if (variants.includes(term.toLowerCase()) || term.toLowerCase() === stem) {
        return stem
      }
    }

    return term.toLowerCase()
  }

  // Function to normalize and combine similar terms
  const normalizeTerms = (term: string): string => {
    const processed = term.toLowerCase().trim()
    const stemmed = getStem(processed)

    // Synonym mapping for common terms
    const synonyms: Record<string, string> = {
      'awesome': 'excellent',
      'great': 'excellent',
      'good': 'excellent',
      'wonderful': 'excellent',
      'magnificent': 'excellent',
      'spectacular': 'excellent',
      'bad': 'poor',
      'terrible': 'poor',
      'horrible': 'poor',
      'awful': 'poor',
      'cheap': 'affordable',
      'inexpensive': 'affordable',
      'costly': 'expensive',
      'pricey': 'expensive',
      'overpriced': 'expensive',
      'tasty': 'delicious',
      'yummy': 'delicious',
      'flavorful': 'delicious',
      'appetizing': 'delicious',
      'scrumptious': 'delicious',
      'savory': 'delicious',
      'attentive': 'helpful',
      'caring': 'helpful',
      'supportive': 'helpful',
      'accommodating': 'helpful',
      'beautiful': 'attractive',
      'pretty': 'attractive',
      'gorgeous': 'attractive',
      'lovely': 'attractive',
      'charming': 'attractive',
      'cozy': 'comfortable',
      'comfy': 'comfortable',
      'relaxing': 'comfortable',
      'pleasant': 'comfortable',
    }

    return synonyms[stemmed] || stemmed
  }

  reviews.forEach(review => {
    // Process mainThemes
    const mainThemes = reviewFieldAccessor.getMainThemes(review)
    if (mainThemes) {
      const themes = mainThemes.split(/[,;:]/).map(t => t.trim().toLowerCase()).filter(Boolean)
      themes.forEach(theme => {
        const normalizedTheme = normalizeTerms(theme)

        if (!termsMap[normalizedTheme]) {
          termsMap[normalizedTheme] = { count: 0 }
        }

        termsMap[normalizedTheme].count += 1
      })
    }

    // Process common terms - using camelCase for TS compatibility
    if (review['common terms']) {
      const terms = review['common terms'].split(/[,;]/).map(t => t.trim().toLowerCase()).filter(Boolean)
      terms.forEach(term => {
        const normalizedTerm = normalizeTerms(term)

        if (!termsMap[normalizedTerm]) {
          termsMap[normalizedTerm] = { count: 0 }
        }

        termsMap[normalizedTerm].count += 1
      })
    }
  })

  // Categorize each term
  for (const [term, data] of Object.entries(termsMap)) {
    // Match term to categories using more sophisticated matching
    for (const [categoryKey, categoryData] of Object.entries(categories)) {
      const termToMatch = term.toLowerCase()

      // Check for exact match
      if (categoryData.terms.includes(termToMatch)) {
        termsMap[term].category = categoryData.name
        break
      }

      // Check for partial match - if term contains any category term
      for (const categoryTerm of categoryData.terms) {
        if (termToMatch.includes(categoryTerm) || categoryTerm.includes(termToMatch)) {
          termsMap[term].category = categoryData.name
          break
        }
      }

      // If category was found, break the outer loop
      if (termsMap[term].category) break
    }

    // If not categorized, check if it might be a staff name
    if (!termsMap[term].category) {
      const staffMentions = extractStaffMentions_sync(reviews)
      const isStaffName = staffMentions.some(staff =>
        staff.name.toLowerCase() === term || term.includes(staff.name.toLowerCase()),
      )

      if (isStaffName) {
        termsMap[term].category = 'Staff Mentions'
      } else {
        // Try to map any remaining uncategorized terms to appropriate categories
        // by checking for keyword matches
        const keywordMapping: Record<string, string> = {
          'wifi': 'Amenities',
          'internet': 'Amenities',
          'bathroom': 'Cleanliness & Hygiene',
          'toilet': 'Cleanliness & Hygiene',
          'book': 'Little Prince Theme',
          'story': 'Little Prince Theme',
          'gallery': 'Art & Gallery',
          'exhibit': 'Art & Gallery',
          'coffee': 'Food & Beverage',
          'tea': 'Food & Beverage',
          'wine': 'Food & Beverage',
          'cocktail': 'Food & Beverage',
          'beer': 'Food & Beverage',
          'parking': 'Location & Accessibility',
          'hour': 'Business Hours',
          'hours': 'Business Hours',
          'open': 'Business Hours',
          'close': 'Business Hours',
          'happy': 'Overall Experience',
          'sad': 'Overall Experience',
          'love': 'Overall Experience',
          'hate': 'Overall Experience',
          'like': 'Overall Experience',
          'dislike': 'Overall Experience',
          'recommend': 'Overall Experience',
          'return': 'Overall Experience',
          'again': 'Overall Experience',
        }

        // Check each word in the term against our keyword mapping
        const words = term.split(' ')
        for (const word of words) {
          if (keywordMapping[word]) {
            termsMap[term].category = keywordMapping[word]
            break
          }
        }

        // If still not categorized, assign to "Others"
        if (!termsMap[term].category) {
          termsMap[term].category = 'Others'
        }
      }
    }
  }

  // Convert to array and sort by count
  return Object.entries(termsMap)
    .map(([text, data]) => ({
      text: text.charAt(0).toUpperCase() + text.slice(1),
      count: data.count,
      category: data.category,
    }))
    .sort((a, b) => b.count - a.count)
}

// Async version for compatibility
export const extractCommonTerms = async (reviews: Review[]): Promise<{text: string, count: number, category?: string}[]> => {
  return extractCommonTerms_sync(reviews)
}

// Get overall analysis based on sentiment distribution and common themes
export const getOverallAnalysis = async (reviews: Review[]): Promise<string> => {
  const sentimentData = analyzeReviewSentiment_sync(reviews)
  const avgRating = calculateAverageRating(reviews)
  const staffMentions = extractStaffMentions_sync(reviews)
  const commonTerms = extractCommonTerms_sync(reviews)
  const monthlyData = groupReviewsByMonth(reviews)

  // Calculate positive percentage
  const totalReviews = reviews.length
  const positiveReviews = sentimentData.find(item => item.name === 'Positive')?.value || 0
  const positivePercentage = totalReviews > 0 ? (positiveReviews / totalReviews * 100).toFixed(1) : '0'

  // Calculate review growth
  let reviewTrend = 'steady'
  if (monthlyData.length >= 3) {
    const lastThreeMonths = monthlyData.slice(-3)
    const firstMonth = lastThreeMonths[0].count
    const lastMonth = lastThreeMonths[lastThreeMonths.length - 1].count

    if (lastMonth > firstMonth * 1.2) {
      reviewTrend = 'increasing'
    } else if (lastMonth < firstMonth * 0.8) {
      reviewTrend = 'decreasing'
    }
  }

  // Get top categories
  const categoryCounts: Record<string, number> = {}
  commonTerms.forEach(term => {
    if (term.category) {
      categoryCounts[term.category] = (categoryCounts[term.category] || 0) + term.count
    }
  })

  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([category]) => category.toLowerCase())

  // Enhanced comprehensive analysis with more detailed breakdown
  let analysis = `Based on a comprehensive analysis of ${reviews.length} customer reviews, your business has achieved an average rating of ${avgRating.toFixed(1)}/5 stars, with ${positivePercentage}% of reviews expressing positive sentiment. `

  // Frequency analysis
  const reviewDates = reviews
    .map(r => reviewFieldAccessor.getPublishedDate(r))
    .filter(Boolean)
    .map(date => new Date(date!))

  const oldestReviewDate = new Date(Math.min(...reviewDates.map(d => d.getTime())))
  const newestReviewDate = new Date(Math.max(...reviewDates.map(d => d.getTime())))
  const monthsDiff = (newestReviewDate.getFullYear() - oldestReviewDate.getFullYear()) * 12 + (newestReviewDate.getMonth() - oldestReviewDate.getMonth())
  const reviewsPerMonth = totalReviews / (monthsDiff || 1)

  analysis += `The business has collected reviews over a period of ${monthsDiff} months, averaging ${reviewsPerMonth.toFixed(1)} reviews per month. `

  // Add review volume trend with more context
  analysis += `The volume of customer reviews is currently ${reviewTrend}`
  if (reviewTrend === 'increasing') {
    analysis += ', which suggests growing popularity and customer engagement. This positive trend indicates that more customers are finding their experiences noteworthy enough to share feedback. '
  } else if (reviewTrend === 'decreasing') {
    analysis += ', which might indicate a need to encourage more customer feedback through gentle prompts after service or by addressing issues that may be preventing customers from leaving reviews. '
  } else {
    analysis += ', demonstrating consistent customer interaction and feedback patterns over time. This stability can be valuable for predictable business planning. '
  }

  // Add insights about most mentioned terms/categories with detailed examples
  if (topCategories.length > 0) {
    analysis += `Customer reviews most frequently highlight aspects related to ${topCategories.join(', ')}, `

    // Add specific insights based on top category
    const topCategory = topCategories[0].toLowerCase()
    const topCategoryTerms = commonTerms
      .filter(term => term.category?.toLowerCase() === topCategory)
      .slice(0, 3)
      .map(term => term.text.toLowerCase())

    if (topCategory.includes('service') || topCategory.includes('staff')) {
      analysis += `with specific praise for ${topCategoryTerms.join(', ')} being particularly notable. The human element of your business appears to be a defining competitive advantage. `
    } else if (topCategory.includes('food') || topCategory.includes('beverage')) {
      analysis += `specifically mentioning ${topCategoryTerms.join(', ')} as standout elements. Your culinary offerings clearly resonate with customers and represent a core strength. `
    } else if (topCategory.includes('ambiance') || topCategory.includes('atmosphere')) {
      analysis += `with ${topCategoryTerms.join(', ')} receiving particular attention. Your establishment's environment creates a distinctive and memorable impression on visitors. `
    } else if (topCategory.includes('art') || topCategory.includes('gallery')) {
      analysis += `particularly noting ${topCategoryTerms.join(', ')}. The artistic elements create a unique experience that distinguishes your venue from competitors. `
    } else if (topCategory.includes('little prince')) {
      analysis += `with frequent mention of ${topCategoryTerms.join(', ')}. The thematic elements related to The Little Prince story create a unique narrative that customers connect with. `
    } else if (topCategory.includes('value') || topCategory.includes('price')) {
      analysis += `frequently discussing ${topCategoryTerms.join(', ')}. Customer perceptions of value appear to be a significant factor in their overall assessment. `
    } else {
      analysis += `with ${topCategoryTerms.join(', ')} standing out as defining aspects of your customer experience. `
    }
  }

  // Add detailed insights about staff if available
  if (staffMentions.length > 0) {
    const staffWithPositiveFeedback = staffMentions.filter(staff => staff.sentiment === 'positive')
    if (staffWithPositiveFeedback.length > 0) {
      const topStaff = staffWithPositiveFeedback.slice(0, 3).map(s => s.name).join(', ')
      analysis += `Staff members ${topStaff} received notably positive mentions, suggesting they significantly enhance the customer experience. `

      // Add an example quote if available
      const exampleStaff = staffWithPositiveFeedback[0]
      if (exampleStaff.examples && exampleStaff.examples.length > 0) {
        const shortExample = exampleStaff.examples[0].length > 100
          ? `${exampleStaff.examples[0].substring(0, 100)}...`
          : exampleStaff.examples[0]
        analysis += `For instance, one customer noted: "${shortExample}" `
      }
    }

    const staffWithNegativeFeedback = staffMentions.filter(staff => staff.sentiment === 'negative')
    if (staffWithNegativeFeedback.length > 0) {
      analysis += 'Some staff interactions may benefit from additional training or coaching to improve consistency in customer satisfaction. '
    }
  }

  // Add language diversity insights with more detail - FIXED to use new language field
  const languages = countReviewsByLanguage(reviews)
  if (languages.length > 1) {
    const topLanguages = languages.slice(0, 3).map(l => l.name)
    const topLanguagePercentage = Math.round((languages[0].value / totalReviews) * 100)
    analysis += `Your business attracts a diverse clientele, with reviews in ${topLanguages.join(', ')}, indicating international appeal. ${languages[0].name} reviews account for ${topLanguagePercentage}% of feedback. `

    // Add geographic reach insights
    if (languages.some(l => ['French', 'Italian', 'Spanish', 'German'].includes(l.name))) {
      analysis += 'There appears to be significant European visitor interest. '
    } else if (languages.some(l => ['Japanese', 'Chinese', 'Korean', 'Thai'].includes(l.name))) {
      analysis += 'There is notable interest from Asian visitors. '
    }
  }

  // Add seasonality insights if available
  const monthCounts = new Map<number, number>()
  reviews.forEach(review => {
    const publishedDate = reviewFieldAccessor.getPublishedDate(review)
    if (publishedDate) {
      const month = new Date(publishedDate).getMonth()
      monthCounts.set(month, (monthCounts.get(month) || 0) + 1)
    }
  })

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const topMonths = [...monthCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2)

  if (topMonths.length > 0 && totalReviews > 20) {
    analysis += `Review volume appears highest during ${monthNames[topMonths[0][0]]}${topMonths.length > 1 ? ` and ${monthNames[topMonths[1][0]]}` : ''}, which might indicate peak business periods. `
  }

  // Add conclusion with strengths and areas for improvement
  if (avgRating >= 4.5) {
    analysis += `Overall, your business is performing exceptionally well with outstanding customer satisfaction. Focus on maintaining your excellent standards in ${
      topCategories.slice(0, 2).join(' and ')
      } while looking for innovative ways to exceed expectations further. The consistency in positive feedback suggests you've established reliable operational excellence.`
  } else if (avgRating >= 4.0) {
    analysis += `Your business is performing strongly with high customer satisfaction. To move from great to exceptional, consider addressing minor concerns in reviews related to ${
      categoryCounts['Others'] > 0 ? "various aspects mentioned in the 'Others' category" : 'less frequently mentioned areas'
      }. Small refinements to an already successful operation could yield significant results.`
  } else if (avgRating >= 3.5) {
    analysis += `Your business is performing well with good customer satisfaction. There are clear opportunities to enhance specific aspects of your service, particularly in ${
      Object.entries(categoryCounts).sort((a, b) => a[1] - b[1]).slice(0, 2).map(([category]) => category).join(' and ')
      }. Focusing on these areas could help increase your overall ratings and customer loyalty.`
  } else if (avgRating >= 3.0) {
    analysis += `Your business is performing adequately, but has significant room for improvement. Focus on addressing the most common concerns in negative reviews, particularly regarding ${
      Object.entries(categoryCounts).filter(([_, count]) => count > 3).sort((a, b) => a[1] - b[1]).slice(0, 2).map(([category]) => category).join(' and ')
      }. A targeted improvement plan could substantially boost customer satisfaction.`
  } else {
    analysis += `Your business faces some challenges with customer satisfaction. A comprehensive review of operations focusing first on ${
      Object.entries(categoryCounts).filter(([_, count]) => count > 3).sort((a, b) => a[1] - b[1]).slice(0, 2).map(([category]) => category).join(' and ')
      } may be needed, with priority given to addressing the critical issues mentioned in negative feedback. Consider consulting with staff to develop an action plan.`
  }

  return analysis
}

// Analyze reviews for insights
export const analyzeReviewInsights = (reviews: Review[]): InsightsData => {
  // Generate trend data by quarter
  const trendData: TrendPoint[] = []

  // Group reviews by quarter
  const quarters = new Map<string, { sum: number; count: number }>()

  reviews.forEach(review => {
    const publishedDate = reviewFieldAccessor.getPublishedDate(review)
    if (!publishedDate) return

    const date = new Date(publishedDate)
    const quarter = `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`

    if (!quarters.has(quarter)) {
      quarters.set(quarter, { sum: 0, count: 0 })
    }

    const current = quarters.get(quarter)!
    current.sum += review.stars
    current.count += 1
  })

  // Convert to trend points
  quarters.forEach((value, key) => {
    trendData.push({
      period: key,
      value: value.sum / value.count,
    })
  })

  // Sort by date
  trendData.sort((a, b) => {
    const yearA = parseInt(a.period.split(' ')[1])
    const yearB = parseInt(b.period.split(' ')[1])

    if (yearA !== yearB) return yearA - yearB

    const quarterA = parseInt(a.period[1])
    const quarterB = parseInt(b.period[1])

    return quarterA - quarterB
  })

  // Only keep last 6 quarters
  const lastSixQuarters = trendData.slice(-6)

  // Determine rating trend
  let ratingTrend: 'up' | 'down' | 'neutral' = 'neutral'

  if (lastSixQuarters.length >= 2) {
    const firstHalf = lastSixQuarters.slice(0, Math.floor(lastSixQuarters.length / 2))
    const secondHalf = lastSixQuarters.slice(Math.floor(lastSixQuarters.length / 2))

    const firstHalfAvg = firstHalf.reduce((sum, point) => sum + point.value, 0) / firstHalf.length
    const secondHalfAvg = secondHalf.reduce((sum, point) => sum + point.value, 0) / secondHalf.length

    if (secondHalfAvg > firstHalfAvg + 0.2) {
      ratingTrend = 'up'
    } else if (secondHalfAvg < firstHalfAvg - 0.2) {
      ratingTrend = 'down'
    }
  }

  // Find reviews needing attention (low rating, no response)
  const needAttention = reviews
    .filter(review => {
      const responseText = reviewFieldAccessor.getResponseText(review)
      return review.stars <= 2 && !responseText?.trim()
    })
    .slice(0, 3)

  // Extract common themes from the database with enhanced categorization
  const commonTerms = extractCommonTerms_sync(reviews)

  // Group themes by category and sentiment
  const themesBySentiment: Record<string, ThemeData[]> = {
    positive: [],
    negative: [],
    neutral: [],
  }

  // Process themes to ensure even distribution
  commonTerms.forEach(term => {
    // Determine sentiment based on reviews mentioning this term
    let termSentiment: 'positive' | 'negative' | 'neutral' = 'neutral'

    // Find reviews mentioning this term
    const mentioningReviews = reviews.filter(review => {
      const mainThemes = reviewFieldAccessor.getMainThemes(review)
      const commonTerms = review['common terms']

      return (mainThemes && mainThemes.toLowerCase().includes(term.text.toLowerCase())) ||
             (commonTerms && commonTerms.toLowerCase().includes(term.text.toLowerCase()))
    })

    // Calculate sentiment score based on these reviews
    if (mentioningReviews.length > 0) {
      const positiveCount = mentioningReviews.filter(r =>
        r.sentiment?.toLowerCase().includes('positive') || r.stars >= 4,
      ).length

      const negativeCount = mentioningReviews.filter(r =>
        r.sentiment?.toLowerCase().includes('negative') || r.stars <= 2,
      ).length

      const ratio = mentioningReviews.length > 0 ?
        (positiveCount - negativeCount) / mentioningReviews.length : 0

      if (ratio > 0.2) {
        termSentiment = 'positive'
      } else if (ratio < -0.2) {
        termSentiment = 'negative'
      }
    }

    // Add to appropriate sentiment category
    themesBySentiment[termSentiment].push({
      text: term.category ? `${term.category}: ${term.text}` : term.text,
      count: term.count,
      sentiment: termSentiment,
    })
  })

  // Take top themes from each sentiment category to ensure balanced representation
  const topPositive = themesBySentiment.positive.slice(0, 3)
  const topNegative = themesBySentiment.negative.slice(0, 3)
  const topNeutral = themesBySentiment.neutral.slice(0, 2)

  // Combine and sort by count
  const balancedThemes = [...topPositive, ...topNegative, ...topNeutral]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  return {
    trendData: lastSixQuarters,
    needAttention,
    ratingTrend,
    commonThemes: balancedThemes,
  }
}
