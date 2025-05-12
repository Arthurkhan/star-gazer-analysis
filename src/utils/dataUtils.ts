
import { 
  Review, 
  SentimentData, 
  LanguageData, 
  MonthlyReviewData,
  InsightsData,
  ThemeData,
  TrendPoint,
  StaffMention
} from "@/types/reviews";

// Calculate average rating from reviews
export const calculateAverageRating = (reviews: Review[]): number => {
  if (reviews.length === 0) return 0;
  
  const sum = reviews.reduce((total, review) => total + review.star, 0);
  return sum / reviews.length;
};

// Count reviews by rating (1-5 stars)
export const countReviewsByRating = (
  reviews: Review[]
): Record<number, number> => {
  return reviews.reduce((counts, review) => {
    const star = review.star;
    counts[star] = (counts[star] || 0) + 1;
    return counts;
  }, {} as Record<number, number>);
};

// Group reviews by month, calculate count and month-over-month comparison
export const groupReviewsByMonth = (reviews: Review[]): MonthlyReviewData[] => {
  // Create a map for months
  const monthMap = new Map<string, { count: number }>();
  
  // Sort reviews by date
  const sortedReviews = [...reviews].sort(
    (a, b) => new Date(a.publishedAtDate).getTime() - new Date(b.publishedAtDate).getTime()
  );
  
  sortedReviews.forEach(review => {
    const date = new Date(review.publishedAtDate);
    const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    if (!monthMap.has(monthYear)) {
      monthMap.set(monthYear, { count: 0 });
    }
    
    const current = monthMap.get(monthYear)!;
    current.count += 1;
  });
  
  // Convert map to array
  const result: MonthlyReviewData[] = [];
  
  monthMap.forEach((value, key) => {
    result.push({
      month: key,
      count: value.count,
      cumulativeCount: 0, // Will be calculated next
    });
  });
  
  // Sort by date to ensure chronological order
  result.sort((a, b) => {
    const dateA = new Date(a.month);
    const dateB = new Date(b.month);
    return dateA.getTime() - dateB.getTime();
  });
  
  // Calculate cumulative count
  let cumulativeCount = 0;
  const cumulativeResult = result.map(item => {
    cumulativeCount += item.count;
    return {
      ...item,
      cumulativeCount
    };
  });
  
  return cumulativeResult;
};

// Calculate monthly comparison data
export const calculateMonthlyComparison = (reviews: Review[]): { 
  vsLastMonth: number; 
  vsLastYear: number;
  currentMonthCount: number;
  previousMonthCount: number;
  previousYearSameMonthCount: number;
} => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Current month
  const currentMonthReviews = reviews.filter(review => {
    const reviewDate = new Date(review.publishedAtDate);
    return reviewDate.getMonth() === currentMonth && reviewDate.getFullYear() === currentYear;
  });
  
  // Previous month
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  
  const previousMonthReviews = reviews.filter(review => {
    const reviewDate = new Date(review.publishedAtDate);
    return reviewDate.getMonth() === previousMonth && reviewDate.getFullYear() === previousMonthYear;
  });
  
  // Same month last year
  const previousYearSameMonthReviews = reviews.filter(review => {
    const reviewDate = new Date(review.publishedAtDate);
    return reviewDate.getMonth() === currentMonth && reviewDate.getFullYear() === currentYear - 1;
  });
  
  const currentMonthCount = currentMonthReviews.length;
  const previousMonthCount = previousMonthReviews.length;
  const previousYearSameMonthCount = previousYearSameMonthReviews.length;
  
  // Calculate differences
  const vsLastMonth = currentMonthCount - previousMonthCount;
  const vsLastYear = currentMonthCount - previousYearSameMonthCount;
  
  return {
    vsLastMonth,
    vsLastYear,
    currentMonthCount,
    previousMonthCount,
    previousYearSameMonthCount
  };
};

// Analyze sentiment from the database "sentiment" column
export const analyzeReviewSentiment_sync = (reviews: Review[]): SentimentData[] => {
  const sentimentCounts: Record<string, number> = { 
    'positive': 0, 
    'neutral': 0, 
    'negative': 0 
  };
  
  reviews.forEach(review => {
    const sentiment = review.sentiment?.toLowerCase() || 'neutral';
    if (sentiment.includes('positive')) {
      sentimentCounts['positive']++;
    } else if (sentiment.includes('negative')) {
      sentimentCounts['negative']++;
    } else {
      sentimentCounts['neutral']++;
    }
  });
  
  return [
    { name: "Positive", value: sentimentCounts['positive'] },
    { name: "Neutral", value: sentimentCounts['neutral'] },
    { name: "Negative", value: sentimentCounts['negative'] },
  ];
};

// Async version for compatibility
export const analyzeReviewSentiment = async (reviews: Review[]): Promise<SentimentData[]> => {
  return analyzeReviewSentiment_sync(reviews);
};

// Count reviews by language
export const countReviewsByLanguage = (reviews: Review[]): LanguageData[] => {
  const languageCounts: Record<string, number> = {};
  
  reviews.forEach(review => {
    const language = review.originalLanguage || 'Unknown';
    languageCounts[language] = (languageCounts[language] || 0) + 1;
  });
  
  // Convert to array and sort by count
  return Object.entries(languageCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

// Helper function to normalize and consolidate similar staff names
const normalizeStaffName = (name: string): string => {
  const nameLower = name.toLowerCase().trim();
  
  // Define name variants to consolidate
  const nameVariants: Record<string, string[]> = {
    'anna': ['ana', 'anne', 'nong ana', 'nong ena'],
    'arnaud': ['armand', 'the boss', 'arnaud nazare', 'arnaud nazare-aga'],
    'sam': ['sammy', 'samuel', 'samantha'],
    'dave': ['david', 'davey'],
    'mike': ['michael', 'mikey', 'michel'],
    'alex': ['alexander', 'alexandra', 'alexa'],
    'peps': ['pepsi', 'pep']
  };
  
  // Check if this name is a variant of a primary name
  for (const [primary, variants] of Object.entries(nameVariants)) {
    if (variants.includes(nameLower) || primary === nameLower) {
      // Capitalize first letter
      return primary.charAt(0).toUpperCase() + primary.slice(1);
    }
  }
  
  // If not a recognized variant, return original name with first letter capitalized
  return name.charAt(0).toUpperCase() + name.slice(1);
};

// Extract staff mentions from "staffMentioned" column
export const extractStaffMentions_sync = (reviews: Review[]): StaffMention[] => {
  const staffMap: Record<string, { count: number, sentiment: string, examples: string[] }> = {};
  
  reviews.forEach(review => {
    if (!review.staffMentioned) return;
    
    // Split by commas or semicolons if multiple staff are mentioned
    const staffNames = review.staffMentioned.split(/[,;]/).map(s => s.trim()).filter(Boolean);
    
    staffNames.forEach(staffName => {
      if (!staffName) return;
      
      // Normalize staff name to consolidate variants
      const normalizedName = normalizeStaffName(staffName);
      
      if (!staffMap[normalizedName]) {
        staffMap[normalizedName] = { count: 0, sentiment: 'neutral', examples: [] };
      }
      
      staffMap[normalizedName].count++;
      
      // Determine sentiment based on review sentiment
      if (review.sentiment?.toLowerCase().includes('positive')) {
        staffMap[normalizedName].sentiment = 'positive';
      } else if (review.sentiment?.toLowerCase().includes('negative')) {
        staffMap[normalizedName].sentiment = 'negative';
      }
      
      // Add review text as example if not already present
      if (review.text && !staffMap[normalizedName].examples.includes(review.text)) {
        if (staffMap[normalizedName].examples.length < 3) { // Limit to 3 examples
          staffMap[normalizedName].examples.push(review.text);
        }
      }
    });
  });
  
  // Convert to array and sort by count
  return Object.entries(staffMap)
    .map(([name, data]) => ({
      name,
      count: data.count,
      sentiment: data.sentiment as "positive" | "negative" | "neutral",
      examples: data.examples
    }))
    .sort((a, b) => b.count - a.count);
};

// Async version for compatibility
export const extractStaffMentions = async (reviews: Review[]): Promise<StaffMention[]> => {
  return extractStaffMentions_sync(reviews);
};

// Extract common terms from the "mainThemes" and "common terms" columns
export const extractCommonTerms_sync = (reviews: Review[]): {text: string, count: number, category?: string}[] => {
  // Define term categories for grouping with expanded categories
  const categories: Record<string, { name: string, terms: string[] }> = {
    'service': { 
      name: 'Service',
      terms: ['service', 'staff', 'waiter', 'waitress', 'server', 'customer service', 'employee', 'friendly', 'attentive', 'helpful', 'professional', 'quick', 'slow']
    },
    'ambiance': { 
      name: 'Ambiance',
      terms: ['ambiance', 'atmosphere', 'decor', 'environment', 'vibe', 'interior', 'mood', 'lighting', 'music', 'cozy', 'romantic', 'quiet', 'loud', 'crowded']
    },
    'location': { 
      name: 'Location',
      terms: ['location', 'place', 'area', 'neighborhood', 'parking', 'accessibility', 'central', 'convenient', 'hidden']
    },
    'art': { 
      name: 'Art & Gallery',
      terms: ['art', 'artwork', 'exhibition', 'gallery', 'artist', 'painting', 'sculpture', 'creative', 'display', 'exhibit']
    },
    'little_prince': { 
      name: 'Little Prince Theme',
      terms: ['little prince', 'prince', 'exupery', 'fox', 'rose', 'planet', 'book theme', 'story', 'theme', 'character']
    },
    'food': { 
      name: 'Food & Drinks',
      terms: ['food', 'drink', 'menu', 'dish', 'meal', 'taste', 'flavor', 'coffee', 'wine', 'cocktail', 'dessert', 'appetizer', 'delicious', 'tasty', 'fresh']
    },
    'value': { 
      name: 'Value & Price',
      terms: ['price', 'value', 'expensive', 'cheap', 'reasonable', 'overpriced', 'worth', 'cost', 'portion', 'money']
    },
    'cleanliness': { 
      name: 'Cleanliness',
      terms: ['clean', 'tidy', 'hygiene', 'spotless', 'dirty', 'neat', 'sanitary', 'bathroom', 'toilet']
    },
    'experience': { 
      name: 'Overall Experience',
      terms: ['experience', 'visit', 'return', 'recommend', 'again', 'never', 'always', 'favorite', 'best', 'worst', 'disappointed', 'impressive']
    }
  };
  
  // Create a map to merge similar terms and count occurrences
  const termsMap: Record<string, { count: number, category?: string }> = {};
  
  reviews.forEach(review => {
    // Process mainThemes
    if (review.mainThemes) {
      const themes = review.mainThemes.split(/[,;:]/).map(t => t.trim().toLowerCase()).filter(Boolean);
      themes.forEach(theme => {
        termsMap[theme] = { count: (termsMap[theme]?.count || 0) + 1 };
      });
    }
    
    // Process common terms - using camelCase for TS compatibility
    if (review["common terms"]) {
      const terms = review["common terms"].split(/[,;]/).map(t => t.trim().toLowerCase()).filter(Boolean);
      terms.forEach(term => {
        termsMap[term] = { count: (termsMap[term]?.count || 0) + 1 };
      });
    }
  });
  
  // Categorize each term 
  for (const [term, data] of Object.entries(termsMap)) {
    for (const [categoryKey, categoryData] of Object.entries(categories)) {
      if (categoryData.terms.some(keyword => term.includes(keyword) || keyword.includes(term))) {
        termsMap[term].category = categoryData.name;
        break;
      }
    }
    
    // If not categorized, check if it might be a staff name
    if (!termsMap[term].category) {
      const staffMentions = extractStaffMentions_sync(reviews);
      const isStaffName = staffMentions.some(staff => 
        staff.name.toLowerCase() === term || term.includes(staff.name.toLowerCase())
      );
      
      if (isStaffName) {
        termsMap[term].category = 'Staff';
      } else {
        termsMap[term].category = 'Others';
      }
    }
  }
  
  // Convert to array and sort by count
  return Object.entries(termsMap)
    .map(([text, data]) => ({ 
      text: text.charAt(0).toUpperCase() + text.slice(1), 
      count: data.count,
      category: data.category
    }))
    .sort((a, b) => b.count - a.count);
};

// Async version for compatibility
export const extractCommonTerms = async (reviews: Review[]): Promise<{text: string, count: number, category?: string}[]> => {
  return extractCommonTerms_sync(reviews);
};

// Get overall analysis based on sentiment distribution and common themes
export const getOverallAnalysis = async (reviews: Review[]): Promise<string> => {
  const sentimentData = analyzeReviewSentiment_sync(reviews);
  const avgRating = calculateAverageRating(reviews);
  const staffMentions = extractStaffMentions_sync(reviews);
  const commonTerms = extractCommonTerms_sync(reviews);
  const monthlyData = groupReviewsByMonth(reviews);
  
  // Calculate positive percentage
  const totalReviews = reviews.length;
  const positiveReviews = sentimentData.find(item => item.name === "Positive")?.value || 0;
  const positivePercentage = totalReviews > 0 ? (positiveReviews / totalReviews * 100).toFixed(1) : "0";
  
  // Calculate review growth
  let reviewTrend = "steady";
  if (monthlyData.length >= 3) {
    const lastThreeMonths = monthlyData.slice(-3);
    const firstMonth = lastThreeMonths[0].count;
    const lastMonth = lastThreeMonths[lastThreeMonths.length - 1].count;
    
    if (lastMonth > firstMonth * 1.2) {
      reviewTrend = "increasing";
    } else if (lastMonth < firstMonth * 0.8) {
      reviewTrend = "decreasing";
    }
  }
  
  // Get top categories
  const categoryCounts: Record<string, number> = {};
  commonTerms.forEach(term => {
    if (term.category) {
      categoryCounts[term.category] = (categoryCounts[term.category] || 0) + term.count;
    }
  });
  
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category]) => category.toLowerCase());
  
  // Build comprehensive analysis
  let analysis = `Based on an analysis of ${totalReviews} reviews, your establishment has an average rating of ${avgRating.toFixed(1)}/5 stars, with ${positivePercentage}% of reviews being positive. `;
  
  // Add review volume trend
  analysis += `The volume of reviews is ${reviewTrend}, `;
  if (reviewTrend === "increasing") {
    analysis += "indicating growing customer engagement and interest. ";
  } else if (reviewTrend === "decreasing") {
    analysis += "which might suggest a need for more active engagement with customers to encourage reviews. ";
  } else {
    analysis += "showing consistent customer feedback over time. ";
  }
  
  // Add insights about most mentioned terms/categories
  if (topCategories.length > 0) {
    analysis += `Customers most frequently comment on ${topCategories.join(", ")}, `;
    
    // Add specific strength based on top category
    const topCategory = topCategories[0];
    if (topCategory.includes("service") || topCategory.includes("staff")) {
      analysis += "highlighting the importance of your customer service experience. ";
    } else if (topCategory.includes("food") || topCategory.includes("drink")) {
      analysis += "indicating that your food and beverage offerings are a key factor in customer experiences. ";
    } else if (topCategory.includes("ambiance") || topCategory.includes("atmosphere")) {
      analysis += "showing that your establishment's atmosphere significantly impacts customer satisfaction. ";
    } else if (topCategory.includes("art") || topCategory.includes("gallery")) {
      analysis += "demonstrating that your artistic elements create a distinctive and memorable experience. ";
    } else {
      analysis += "which appear to be defining aspects of your customer experience. ";
    }
  }
  
  // Add insights about staff if available
  if (staffMentions.length > 0) {
    const staffWithPositiveFeedback = staffMentions.filter(staff => staff.sentiment === "positive");
    if (staffWithPositiveFeedback.length > 0) {
      const topStaff = staffWithPositiveFeedback.slice(0, 2).map(s => s.name).join(" and ");
      analysis += `${topStaff} received particularly positive mentions from customers, suggesting they significantly enhance the customer experience. `;
    }
    
    const staffWithNegativeFeedback = staffMentions.filter(staff => staff.sentiment === "negative");
    if (staffWithNegativeFeedback.length > 0) {
      analysis += "Some staff interactions may benefit from additional training to improve customer satisfaction. ";
    }
  }
  
  // Add language diversity insights
  const languages = countReviewsByLanguage(reviews);
  if (languages.length > 1) {
    const topLanguage = languages[0].name;
    const otherLanguagesCount = languages.length - 1;
    analysis += `Your business attracts a diverse clientele, with reviews in ${topLanguage} and ${otherLanguagesCount} other language${otherLanguagesCount > 1 ? 's' : ''}, indicating international appeal. `;
  }
  
  // Add conclusion with strengths and areas for improvement
  if (avgRating >= 4.5) {
    analysis += "Overall, your business is performing exceptionally well with outstanding customer satisfaction. Focus on maintaining your excellent standards while looking for innovative ways to exceed expectations further.";
  } else if (avgRating >= 4.0) {
    analysis += "Your business is performing strongly with high customer satisfaction. Consider addressing minor concerns in reviews to elevate the experience from great to exceptional.";
  } else if (avgRating >= 3.5) {
    analysis += "Your business is performing well with good customer satisfaction. There are opportunities to enhance specific aspects of your service to increase overall ratings.";
  } else if (avgRating >= 3.0) {
    analysis += "Your business is performing adequately, but has significant room for improvement. Focus on addressing the most common concerns in negative reviews to boost customer satisfaction.";
  } else {
    analysis += "Your business faces some challenges with customer satisfaction. A comprehensive review of operations may be needed, with priority given to addressing the critical issues mentioned in negative feedback.";
  }
  
  return analysis;
};

// Analyze reviews for insights
export const analyzeReviewInsights = (reviews: Review[]): InsightsData => {
  // Generate trend data by quarter
  const trendData: TrendPoint[] = [];
  
  // Group reviews by quarter
  const quarters = new Map<string, { sum: number; count: number }>();
  
  reviews.forEach(review => {
    const date = new Date(review.publishedAtDate);
    const quarter = `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
    
    if (!quarters.has(quarter)) {
      quarters.set(quarter, { sum: 0, count: 0 });
    }
    
    const current = quarters.get(quarter)!;
    current.sum += review.star;
    current.count += 1;
  });
  
  // Convert to trend points
  quarters.forEach((value, key) => {
    trendData.push({
      period: key,
      value: value.sum / value.count,
    });
  });
  
  // Sort by date
  trendData.sort((a, b) => {
    const yearA = parseInt(a.period.split(' ')[1]);
    const yearB = parseInt(b.period.split(' ')[1]);
    
    if (yearA !== yearB) return yearA - yearB;
    
    const quarterA = parseInt(a.period[1]);
    const quarterB = parseInt(b.period[1]);
    
    return quarterA - quarterB;
  });
  
  // Only keep last 6 quarters
  const lastSixQuarters = trendData.slice(-6);
  
  // Determine rating trend
  let ratingTrend: "up" | "down" | "neutral" = "neutral";
  
  if (lastSixQuarters.length >= 2) {
    const firstHalf = lastSixQuarters.slice(0, Math.floor(lastSixQuarters.length / 2));
    const secondHalf = lastSixQuarters.slice(Math.floor(lastSixQuarters.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, point) => sum + point.value, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, point) => sum + point.value, 0) / secondHalf.length;
    
    if (secondHalfAvg > firstHalfAvg + 0.2) {
      ratingTrend = "up";
    } else if (secondHalfAvg < firstHalfAvg - 0.2) {
      ratingTrend = "down";
    }
  }
  
  // Find reviews needing attention (low rating, no response)
  const needAttention = reviews
    .filter(review => review.star <= 2 && !review.responseFromOwnerText?.trim())
    .slice(0, 3);
  
  // Extract common themes from the database
  const themeCount: Record<string, { count: number, sentiment: "positive" | "negative" | "neutral" }> = {};
  
  reviews.forEach(review => {
    if (!review.mainThemes) return;
    
    const themes = review.mainThemes.split(/[,;:]/).map(t => t.trim()).filter(Boolean);
    const sentiment = review.sentiment?.toLowerCase().includes('positive') 
      ? "positive" 
      : review.sentiment?.toLowerCase().includes('negative') 
        ? "negative" 
        : "neutral";
    
    themes.forEach(theme => {
      // Extract category if theme is in format "Category: Term"
      let themeName = theme;
      let themeCategory = "";
      
      if (theme.includes(":")) {
        const parts = theme.split(":");
        themeCategory = parts[0].trim();
        themeName = parts[1].trim();
      }
      
      const key = themeCategory ? `${themeCategory}: ${themeName}` : themeName;
      
      if (!themeCount[key]) {
        themeCount[key] = { count: 0, sentiment: "neutral" };
      }
      
      themeCount[key].count++;
      
      // Update theme sentiment based on review sentiment
      if (sentiment === "positive" && themeCount[key].sentiment !== "negative") {
        themeCount[key].sentiment = "positive";
      } else if (sentiment === "negative" && themeCount[key].sentiment !== "positive") {
        themeCount[key].sentiment = "negative";
      }
    });
  });
  
  // Convert to ThemeData array and sort by count
  const commonThemes: ThemeData[] = Object.entries(themeCount)
    .map(([text, { count, sentiment }]) => ({ text, count, sentiment }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6); // Expanded to top 6 themes
  
  return {
    trendData: lastSixQuarters,
    needAttention,
    ratingTrend,
    commonThemes,
  };
};
