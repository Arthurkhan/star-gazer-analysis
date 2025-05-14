// This file uses pre-computed AI data from Supabase instead of external APIs
import { Review } from "@/types/reviews";
import { generateCacheKey, getFromCache, storeInCache, clearCache } from "./analysisCache";

export { clearCache };

interface DateRange {
  startDate: string;
  endDate: string;
}

// Analyze reviews using pre-computed Supabase data
export const analyzeReviewsWithExistingData = async (
  reviews: Review[],
  dateRange?: DateRange
): Promise<{
  sentimentAnalysis: { name: string; value: number }[];
  staffMentions: { name: string; count: number; sentiment: "positive" | "negative" | "neutral"; examples?: string[] }[];
  commonTerms: { text: string; count: number; category?: string }[];
  overallAnalysis: string;
  ratingBreakdown?: { rating: number; count: number; percentage: number }[];
  languageDistribution?: { language: string; count: number; percentage: number }[];
  mainThemes?: { theme: string; count: number; percentage: number }[];
}> => {
  try {
    // Filter reviews by date range if provided
    let filteredReviews = reviews;
    if (dateRange) {
      filteredReviews = filterReviewsByDateRange(reviews, dateRange);
    }

    // Calculate sentiment distribution from existing data
    const sentimentAnalysis = calculateSentimentDistribution(filteredReviews);
    
    // Extract and aggregate staff mentions
    const staffMentions = aggregateStaffMentions(filteredReviews);
    
    // Aggregate common terms
    const commonTerms = aggregateCommonTerms(filteredReviews);
    
    // Aggregate main themes
    const mainThemes = aggregateMainThemes(filteredReviews);
    
    // Generate comprehensive analysis text
    const overallAnalysis = generateOverallAnalysis(filteredReviews, {
      sentimentAnalysis,
      staffMentions,
      commonTerms,
      mainThemes
    });
    
    // Calculate additional statistics
    const ratingBreakdown = calculateRatingBreakdown(filteredReviews);
    const languageDistribution = calculateLanguageDistribution(filteredReviews);
    
    return {
      sentimentAnalysis,
      staffMentions,
      commonTerms,
      overallAnalysis,
      ratingBreakdown,
      languageDistribution,
      mainThemes
    };
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

// Calculate sentiment distribution from pre-computed data
function calculateSentimentDistribution(reviews: Review[]) {
  const sentiments = {
    positive: 0,
    neutral: 0,
    negative: 0
  };
  
  reviews.forEach(review => {
    const sentiment = review.sentiment?.toLowerCase() || 'neutral';
    if (sentiment in sentiments) {
      sentiments[sentiment as keyof typeof sentiments]++;
    }
  });
  
  return [
    { name: "Positive", value: sentiments.positive },
    { name: "Neutral", value: sentiments.neutral },
    { name: "Negative", value: sentiments.negative }
  ];
}

// Aggregate staff mentions from pre-computed data
function aggregateStaffMentions(reviews: Review[]) {
  const staffMap = new Map<string, { count: number; sentiments: string[]; examples: string[] }>();
  
  reviews.forEach(review => {
    if (review.staffMentioned) {
      const staffNames = review.staffMentioned.split(',').map(s => s.trim());
      staffNames.forEach(name => {
        if (!staffMap.has(name)) {
          staffMap.set(name, { count: 0, sentiments: [], examples: [] });
        }
        const staff = staffMap.get(name)!;
        staff.count++;
        staff.sentiments.push(review.sentiment || 'neutral');
        if (staff.examples.length < 3) {
          staff.examples.push(review.text.substring(0, 100) + '...');
        }
      });
    }
  });
  
  return Array.from(staffMap.entries()).map(([name, data]) => ({
    name,
    count: data.count,
    sentiment: calculateDominantSentiment(data.sentiments),
    examples: data.examples
  }));
}

// Aggregate common terms from pre-computed data
function aggregateCommonTerms(reviews: Review[]) {
  const termMap = new Map<string, number>();
  
  reviews.forEach(review => {
    if (review["common terms"]) {
      const terms = review["common terms"].split(',').map(t => t.trim());
      terms.forEach(term => {
        termMap.set(term, (termMap.get(term) || 0) + 1);
      });
    }
  });
  
  return Array.from(termMap.entries())
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20); // Top 20 terms
}

// Aggregate main themes
function aggregateMainThemes(reviews: Review[]) {
  const themeMap = new Map<string, number>();
  const total = reviews.length;
  
  reviews.forEach(review => {
    if (review.mainThemes) {
      const themes = review.mainThemes.split(',').map(t => t.trim());
      themes.forEach(theme => {
        themeMap.set(theme, (themeMap.get(theme) || 0) + 1);
      });
    }
  });
  
  return Array.from(themeMap.entries())
    .map(([theme, count]) => ({
      theme,
      count,
      percentage: (count / total) * 100
    }))
    .sort((a, b) => b.count - a.count);
}

// Generate comprehensive analysis text
function generateOverallAnalysis(
  reviews: Review[],
  aggregatedData: any
): string {
  const total = reviews.length;
  const avgRating = reviews.reduce((sum, r) => sum + r.stars, 0) / total;
  const sentiment = aggregatedData.sentimentAnalysis;
  const positivePercent = ((sentiment[0].value / total) * 100).toFixed(1);
  const negativePercent = ((sentiment[2].value / total) * 100).toFixed(1);
  
  const topThemes = aggregatedData.mainThemes.slice(0, 5).map((t: any) => t.theme).join(', ');
  const topStaff = aggregatedData.staffMentions.slice(0, 3).map((s: any) => s.name).join(', ');
  
  return `
📊 **Overall Summary**
Based on ${total} reviews with an average rating of ${avgRating.toFixed(1)} stars:

📈 **Sentiment Analysis**
• ${positivePercent}% positive reviews
• ${negativePercent}% negative reviews
• Customer satisfaction is ${Number(positivePercent) > 70 ? 'excellent' : Number(positivePercent) > 50 ? 'good' : 'needs improvement'}

🗣️ **Key Themes**
The most discussed topics are: ${topThemes || 'No specific themes identified'}

💬 **Staff Performance**
${topStaff ? `Frequently mentioned staff: ${topStaff}` : 'No specific staff members were frequently mentioned'}

🎯 **Recommendations**
${generateRecommendations(aggregatedData, avgRating)}
`;
}

// Generate recommendations based on the analysis
function generateRecommendations(data: any, avgRating: number): string {
  const recommendations = [];
  
  if (avgRating < 4) {
    recommendations.push('• Focus on improving customer satisfaction');
  }
  
  const total = data.sentimentAnalysis[0].value + data.sentimentAnalysis[1].value + data.sentimentAnalysis[2].value;
  const negativePercent = (data.sentimentAnalysis[2].value / total) * 100;
  
  if (negativePercent > 20) {
    recommendations.push('• Address negative feedback patterns');
  }
  
  if (data.staffMentions.some((s: any) => s.sentiment === 'negative')) {
    recommendations.push('• Provide additional training for staff receiving negative mentions');
  }
  
  return recommendations.join('\n') || '• Maintain current service levels';
}

// Helper functions
function filterReviewsByDateRange(reviews: Review[], dateRange: DateRange) {
  const start = new Date(dateRange.startDate);
  const end = new Date(dateRange.endDate);
  
  return reviews.filter(review => {
    const reviewDate = new Date(review.publishedAtDate);
    return reviewDate >= start && reviewDate <= end;
  });
}

function calculateDominantSentiment(sentiments: string[]): "positive" | "neutral" | "negative" {
  const counts: { positive: number; neutral: number; negative: number } = { 
    positive: 0, 
    neutral: 0, 
    negative: 0 
  };
  
  sentiments.forEach(s => {
    const sentiment = s.toLowerCase();
    if (sentiment in counts) {
      counts[sentiment as keyof typeof counts]++;
    }
  });
  
  const entries = Object.entries(counts) as [keyof typeof counts, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
}

// Calculate rating breakdown
function calculateRatingBreakdown(reviews: Review[]) {
  const totalReviews = reviews.length;
  const counts = {
    1: reviews.filter(r => r.stars === 1).length,
    2: reviews.filter(r => r.stars === 2).length,
    3: reviews.filter(r => r.stars === 3).length,
    4: reviews.filter(r => r.stars === 4).length,
    5: reviews.filter(r => r.stars === 5).length
  };
  
  return [
    { rating: 5, count: counts[5], percentage: totalReviews ? (counts[5] / totalReviews) * 100 : 0 },
    { rating: 4, count: counts[4], percentage: totalReviews ? (counts[4] / totalReviews) * 100 : 0 },
    { rating: 3, count: counts[3], percentage: totalReviews ? (counts[3] / totalReviews) * 100 : 0 },
    { rating: 2, count: counts[2], percentage: totalReviews ? (counts[2] / totalReviews) * 100 : 0 },
    { rating: 1, count: counts[1], percentage: totalReviews ? (counts[1] / totalReviews) * 100 : 0 }
  ];
}

// Calculate language distribution
function calculateLanguageDistribution(reviews: Review[]) {
  const totalReviews = reviews.length;
  const languages: Record<string, number> = {};
  
  reviews.forEach(review => {
    const language = review.originalLanguage || "Unknown";
    languages[language] = (languages[language] || 0) + 1;
  });
  
  return Object.entries(languages).map(([language, count]) => ({
    language,
    count,
    percentage: totalReviews ? (count / totalReviews) * 100 : 0
  })).sort((a, b) => b.count - a.count);
}

// Main function to get analysis
export const getAnalysis = async (reviews: Review[], dateRange?: DateRange): Promise<any> => {
  const cacheKey = generateCacheKey(reviews, 'local') + (dateRange ? `_${dateRange.startDate}_${dateRange.endDate}` : '');
  
  const cachedResult = getFromCache(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  
  const analysis = await analyzeReviewsWithExistingData(reviews, dateRange);
  storeInCache(cacheKey, analysis);
  
  return analysis;
};

// Legacy functions for compatibility - these no longer use external APIs
export const analyzeReviewsWithAI = analyzeReviewsWithExistingData;
