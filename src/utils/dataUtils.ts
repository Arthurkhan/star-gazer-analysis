
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

// Extract staff mentions from "staffMentioned" column
export const extractStaffMentions_sync = (reviews: Review[]): StaffMention[] => {
  const staffMap: Record<string, { count: number, sentiment: string, examples: string[] }> = {};
  
  reviews.forEach(review => {
    if (!review.staffMentioned) return;
    
    // Split by commas or semicolons if multiple staff are mentioned
    const staffNames = review.staffMentioned.split(/[,;]/).map(s => s.trim()).filter(Boolean);
    
    staffNames.forEach(staffName => {
      if (!staffName) return;
      
      if (!staffMap[staffName]) {
        staffMap[staffName] = { count: 0, sentiment: 'neutral', examples: [] };
      }
      
      staffMap[staffName].count++;
      
      // Determine sentiment based on review sentiment
      if (review.sentiment?.toLowerCase().includes('positive')) {
        staffMap[staffName].sentiment = 'positive';
      } else if (review.sentiment?.toLowerCase().includes('negative')) {
        staffMap[staffName].sentiment = 'negative';
      }
      
      // Add review text as example if not already present
      if (review.text && !staffMap[staffName].examples.includes(review.text)) {
        if (staffMap[staffName].examples.length < 3) { // Limit to 3 examples
          staffMap[staffName].examples.push(review.text);
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
export const extractCommonTerms_sync = (reviews: Review[]): {text: string, count: number}[] => {
  // Create a map to merge similar terms and count occurrences
  const termsMap: Record<string, number> = {};
  
  reviews.forEach(review => {
    // Process mainThemes
    if (review.mainThemes) {
      const themes = review.mainThemes.split(/[,;]/).map(t => t.trim().toLowerCase()).filter(Boolean);
      themes.forEach(theme => {
        termsMap[theme] = (termsMap[theme] || 0) + 1;
      });
    }
    
    // Process common terms - using camelCase for TS compatibility
    if (review["common terms"]) {
      const terms = review["common terms"].split(/[,;]/).map(t => t.trim().toLowerCase()).filter(Boolean);
      terms.forEach(term => {
        termsMap[term] = (termsMap[term] || 0) + 1;
      });
    }
  });
  
  // Intelligently group similar terms
  const groupedTerms: Record<string, number> = {};
  
  // Define term categories for grouping
  const categories: Record<string, string[]> = {
    'service': ['service', 'staff', 'waiter', 'waitress', 'server', 'customer service', 'employee'],
    'ambiance': ['ambiance', 'atmosphere', 'decor', 'environment', 'vibe', 'interior', 'mood', 'lighting'],
    'location': ['location', 'place', 'area', 'neighborhood', 'parking', 'accessibility'],
    'art': ['art', 'artwork', 'exhibition', 'gallery', 'artist', 'painting', 'sculpture', 'creative'],
    'the little prince': ['little prince', 'prince', 'exupery', 'fox', 'rose', 'planet', 'book theme'],
    'f&b': ['food', 'drink', 'menu', 'dish', 'meal', 'taste', 'flavor', 'coffee', 'wine', 'cocktail', 'dessert', 'appetizer']
  };
  
  // Group terms by category
  Object.entries(termsMap).forEach(([term, count]) => {
    let categorized = false;
    
    for (const [category, relatedTerms] of Object.entries(categories)) {
      if (relatedTerms.some(related => term.includes(related) || related.includes(term))) {
        groupedTerms[category] = (groupedTerms[category] || 0) + count;
        categorized = true;
        break;
      }
    }
    
    if (!categorized) {
      groupedTerms['others'] = (groupedTerms['others'] || 0) + count;
    }
  });
  
  // Convert to array and sort by count
  return Object.entries(groupedTerms)
    .map(([text, count]) => ({ text: text.charAt(0).toUpperCase() + text.slice(1), count }))
    .sort((a, b) => b.count - a.count);
};

// Async version for compatibility
export const extractCommonTerms = async (reviews: Review[]): Promise<{text: string, count: number}[]> => {
  return extractCommonTerms_sync(reviews);
};

// Get overall analysis based on sentiment distribution and common themes
export const getOverallAnalysis = async (reviews: Review[]): Promise<string> => {
  const sentimentData = analyzeReviewSentiment_sync(reviews);
  const avgRating = calculateAverageRating(reviews);
  const staffMentions = extractStaffMentions_sync(reviews);
  const commonTerms = extractCommonTerms_sync(reviews);
  
  // Calculate positive percentage
  const totalReviews = reviews.length;
  const positiveReviews = sentimentData.find(item => item.name === "Positive")?.value || 0;
  const positivePercentage = totalReviews > 0 ? (positiveReviews / totalReviews * 100).toFixed(1) : "0";
  
  // Build overall analysis message
  let analysis = `Based on ${totalReviews} reviews, ${positivePercentage}% are positive with an average rating of ${avgRating.toFixed(1)}/5. `;
  
  // Add insights about most mentioned terms
  if (commonTerms.length > 0) {
    const topTerms = commonTerms.slice(0, 3).map(term => term.text.toLowerCase()).join(", ");
    analysis += `Customers frequently mention ${topTerms}. `;
  }
  
  // Add insights about staff if available
  if (staffMentions.length > 0) {
    const staffWithPositiveFeedback = staffMentions.filter(staff => staff.sentiment === "positive");
    if (staffWithPositiveFeedback.length > 0) {
      const topStaff = staffWithPositiveFeedback[0].name;
      analysis += `${topStaff} received the most positive mentions from customers. `;
    }
  }
  
  // Add strengths and areas for improvement
  if (avgRating >= 4.0) {
    analysis += "Overall, the business is performing well with strong customer satisfaction. ";
  } else if (avgRating >= 3.0) {
    analysis += "The business is performing adequately but has room for improvement. ";
  } else {
    analysis += "The business should focus on addressing customer concerns to improve satisfaction. ";
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
    
    const themes = review.mainThemes.split(/[,;]/).map(t => t.trim()).filter(Boolean);
    const sentiment = review.sentiment?.toLowerCase().includes('positive') 
      ? "positive" 
      : review.sentiment?.toLowerCase().includes('negative') 
        ? "negative" 
        : "neutral";
    
    themes.forEach(theme => {
      if (!themeCount[theme]) {
        themeCount[theme] = { count: 0, sentiment: "neutral" };
      }
      
      themeCount[theme].count++;
      
      // Update theme sentiment based on review sentiment
      if (sentiment === "positive" && themeCount[theme].sentiment !== "negative") {
        themeCount[theme].sentiment = "positive";
      } else if (sentiment === "negative" && themeCount[theme].sentiment !== "positive") {
        themeCount[theme].sentiment = "negative";
      }
    });
  });
  
  // Convert to ThemeData array and sort by count
  const commonThemes: ThemeData[] = Object.entries(themeCount)
    .map(([text, { count, sentiment }]) => ({ text, count, sentiment }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4); // Limit to top 4 themes
  
  return {
    trendData: lastSixQuarters,
    needAttention,
    ratingTrend,
    commonThemes,
  };
};
