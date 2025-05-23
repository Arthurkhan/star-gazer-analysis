import { Review } from '@/types/reviews';
import { format, parseISO, subMonths, startOfMonth, endOfMonth, differenceInMonths } from 'date-fns';

export interface SentimentTrend {
  period: string;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  overallSentiment: number;
  trendDirection: 'improving' | 'declining' | 'stable';
  confidence: number;
}

export interface SentimentCorrelation {
  factor: string;
  correlation: number;
  impact: 'strong' | 'moderate' | 'weak';
  direction: 'positive' | 'negative';
  explanation: string;
}

export interface SentimentInsight {
  category: string;
  currentScore: number;
  previousScore: number;
  change: number;
  changePercentage: number;
  significance: 'high' | 'medium' | 'low';
  recommendation: string;
  affectingFactors: string[];
}

export interface SentimentChange {
  period: string;
  change: number;
  changeType: 'improvement' | 'decline' | 'stability';
  magnitude: 'significant' | 'moderate' | 'minor';
  keyFactors: string[];
  impactedCategories: string[];
}

/**
 * Analyze sentiment trends over time periods
 */
export function analyzeSentimentTrends(reviews: Review[], periodType: 'month' | 'quarter' | 'year' = 'month'): SentimentTrend[] {
  if (!reviews.length) return [];

  // Group reviews by time period
  const periodGroups = reviews.reduce((acc, review) => {
    const date = parseISO(review.publishedAtDate);
    let periodKey: string;
    
    switch (periodType) {
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        periodKey = `${date.getFullYear()}-Q${quarter}`;
        break;
      case 'year':
        periodKey = date.getFullYear().toString();
        break;
      default:
        periodKey = format(date, 'yyyy-MM');
    }
    
    if (!acc[periodKey]) {
      acc[periodKey] = [];
    }
    acc[periodKey].push(review);
    return acc;
  }, {} as Record<string, Review[]>);

  // Calculate sentiment for each period
  const sentimentTrends = Object.entries(periodGroups).map(([period, periodReviews]) => {
    const sentimentCounts = calculateSentimentCounts(periodReviews);
    const overallSentiment = calculateOverallSentiment(sentimentCounts);
    
    return {
      period,
      ...sentimentCounts,
      overallSentiment,
      trendDirection: 'stable' as const,
      confidence: calculateConfidence(periodReviews.length),
    };
  }).sort((a, b) => a.period.localeCompare(b.period));

  // Determine trend directions
  for (let i = 1; i < sentimentTrends.length; i++) {
    const current = sentimentTrends[i];
    const previous = sentimentTrends[i - 1];
    
    const sentimentChange = current.overallSentiment - previous.overallSentiment;
    
    if (sentimentChange > 5) {
      current.trendDirection = 'improving';
    } else if (sentimentChange < -5) {
      current.trendDirection = 'declining';
    }
  }

  return sentimentTrends;
}

/**
 * Calculate sentiment correlations with various factors
 */
export function calculateSentimentCorrelations(reviews: Review[]): SentimentCorrelation[] {
  if (!reviews.length) return [];

  const correlations: SentimentCorrelation[] = [];

  // Rating correlation
  const ratingCorrelation = calculateRatingSentimentCorrelation(reviews);
  correlations.push({
    factor: 'Star Rating',
    correlation: ratingCorrelation,
    impact: ratingCorrelation > 0.7 ? 'strong' : ratingCorrelation > 0.4 ? 'moderate' : 'weak',
    direction: ratingCorrelation > 0 ? 'positive' : 'negative',
    explanation: `Customer ratings ${ratingCorrelation > 0.7 ? 'strongly' : 'moderately'} correlate with sentiment scores`,
  });

  // Review length correlation
  const lengthCorrelation = calculateLengthSentimentCorrelation(reviews);
  correlations.push({
    factor: 'Review Length',
    correlation: Math.abs(lengthCorrelation),
    impact: Math.abs(lengthCorrelation) > 0.5 ? 'strong' : Math.abs(lengthCorrelation) > 0.3 ? 'moderate' : 'weak',
    direction: lengthCorrelation > 0 ? 'positive' : 'negative',
    explanation: `${lengthCorrelation > 0 ? 'Longer' : 'Shorter'} reviews tend to have ${lengthCorrelation > 0 ? 'more positive' : 'more negative'} sentiment`,
  });

  // Response correlation
  const responseCorrelation = calculateResponseSentimentCorrelation(reviews);
  correlations.push({
    factor: 'Owner Response',
    correlation: responseCorrelation,
    impact: responseCorrelation > 0.6 ? 'strong' : responseCorrelation > 0.3 ? 'moderate' : 'weak',
    direction: 'positive',
    explanation: 'Reviews with owner responses tend to have more positive sentiment perception',
  });

  // Time of year correlation
  const seasonalCorrelation = calculateSeasonalSentimentCorrelation(reviews);
  correlations.push({
    factor: 'Seasonal Patterns',
    correlation: seasonalCorrelation.correlation,
    impact: seasonalCorrelation.correlation > 0.4 ? 'strong' : seasonalCorrelation.correlation > 0.2 ? 'moderate' : 'weak',
    direction: 'positive',
    explanation: seasonalCorrelation.explanation,
  });

  return correlations;
}

/**
 * Generate sentiment insights for different categories/themes
 */
export function generateSentimentInsights(reviews: Review[], previousPeriodReviews: Review[] = []): SentimentInsight[] {
  if (!reviews.length) return [];

  const insights: SentimentInsight[] = [];
  
  // Overall sentiment insight
  const currentOverallSentiment = calculateOverallSentimentScore(reviews);
  const previousOverallSentiment = previousPeriodReviews.length > 0 ? 
    calculateOverallSentimentScore(previousPeriodReviews) : currentOverallSentiment;
    
  const overallChange = currentOverallSentiment - previousOverallSentiment;
  const overallChangePercentage = previousOverallSentiment > 0 ? 
    (overallChange / previousOverallSentiment) * 100 : 0;

  insights.push({
    category: 'Overall Sentiment',
    currentScore: currentOverallSentiment,
    previousScore: previousOverallSentiment,
    change: overallChange,
    changePercentage: overallChangePercentage,
    significance: Math.abs(overallChangePercentage) > 15 ? 'high' : Math.abs(overallChangePercentage) > 5 ? 'medium' : 'low',
    recommendation: generateSentimentRecommendation(overallChange, currentOverallSentiment),
    affectingFactors: identifyAffectingFactors(reviews, 'overall'),
  });

  // Theme-based sentiment insights
  const themeInsights = generateThemeSentimentInsights(reviews, previousPeriodReviews);
  insights.push(...themeInsights);

  // Staff sentiment insights
  const staffInsights = generateStaffSentimentInsights(reviews, previousPeriodReviews);
  insights.push(...staffInsights);

  return insights;
}

/**
 * Track sentiment changes over time
 */
export function trackSentimentChanges(reviews: Review[], lookbackMonths: number = 6): SentimentChange[] {
  if (!reviews.length) return [];

  const changes: SentimentChange[] = [];
  const now = new Date();

  // Analyze changes for each month in the lookback period
  for (let i = 0; i < lookbackMonths; i++) {
    const currentMonth = subMonths(now, i);
    const previousMonth = subMonths(now, i + 1);
    
    const currentMonthReviews = reviews.filter(review => {
      const reviewDate = parseISO(review.publishedAtDate);
      return reviewDate >= startOfMonth(currentMonth) && reviewDate <= endOfMonth(currentMonth);
    });

    const previousMonthReviews = reviews.filter(review => {
      const reviewDate = parseISO(review.publishedAtDate);
      return reviewDate >= startOfMonth(previousMonth) && reviewDate <= endOfMonth(previousMonth);
    });

    if (currentMonthReviews.length > 0 && previousMonthReviews.length > 0) {
      const currentSentiment = calculateOverallSentimentScore(currentMonthReviews);
      const previousSentiment = calculateOverallSentimentScore(previousMonthReviews);
      const change = currentSentiment - previousSentiment;

      changes.push({
        period: format(currentMonth, 'yyyy-MM'),
        change,
        changeType: change > 2 ? 'improvement' : change < -2 ? 'decline' : 'stability',
        magnitude: Math.abs(change) > 10 ? 'significant' : Math.abs(change) > 5 ? 'moderate' : 'minor',
        keyFactors: identifyChangeFactors(currentMonthReviews, previousMonthReviews),
        impactedCategories: identifyImpactedCategories(currentMonthReviews, previousMonthReviews),
      });
    }
  }

  return changes.reverse(); // Return in chronological order
}

// Helper functions
function calculateSentimentCounts(reviews: Review[]) {
  const counts = {
    positiveCount: 0,
    neutralCount: 0,
    negativeCount: 0,
  };

  reviews.forEach(review => {
    const sentiment = review.sentiment?.toLowerCase() || '';
    if (sentiment.includes('positive')) {
      counts.positiveCount++;
    } else if (sentiment.includes('negative')) {
      counts.negativeCount++;
    } else {
      counts.neutralCount++;
    }
  });

  return counts;
}

function calculateOverallSentiment(sentimentCounts: ReturnType<typeof calculateSentimentCounts>): number {
  const total = sentimentCounts.positiveCount + sentimentCounts.neutralCount + sentimentCounts.negativeCount;
  if (total === 0) return 0;
  
  const score = (sentimentCounts.positiveCount * 100 + sentimentCounts.neutralCount * 50) / total;
  return Math.round(score);
}

function calculateOverallSentimentScore(reviews: Review[]): number {
  const sentimentCounts = calculateSentimentCounts(reviews);
  return calculateOverallSentiment(sentimentCounts);
}

function calculateConfidence(sampleSize: number): number {
  // Simple confidence calculation based on sample size
  if (sampleSize >= 100) return 95;
  if (sampleSize >= 50) return 85;
  if (sampleSize >= 25) return 75;
  if (sampleSize >= 10) return 65;
  return 50;
}

function calculateRatingSentimentCorrelation(reviews: Review[]): number {
  if (reviews.length < 2) return 0;

  const data = reviews.map(review => ({
    rating: review.stars,
    sentiment: getSentimentScore(review.sentiment),
  }));

  return calculateCorrelation(data.map(d => d.rating), data.map(d => d.sentiment));
}

function calculateLengthSentimentCorrelation(reviews: Review[]): number {
  if (reviews.length < 2) return 0;

  const data = reviews.map(review => ({
    length: (review.text || '').length,
    sentiment: getSentimentScore(review.sentiment),
  }));

  return calculateCorrelation(data.map(d => d.length), data.map(d => d.sentiment));
}

function calculateResponseSentimentCorrelation(reviews: Review[]): number {
  if (reviews.length < 2) return 0;

  const withResponse = reviews.filter(r => r.responseFromOwnerText);
  const withoutResponse = reviews.filter(r => !r.responseFromOwnerText);

  if (withResponse.length === 0 || withoutResponse.length === 0) return 0;

  const avgSentimentWithResponse = withResponse.reduce((sum, r) => sum + getSentimentScore(r.sentiment), 0) / withResponse.length;
  const avgSentimentWithoutResponse = withoutResponse.reduce((sum, r) => sum + getSentimentScore(r.sentiment), 0) / withoutResponse.length;

  return (avgSentimentWithResponse - avgSentimentWithoutResponse) / 100; // Normalize to [-1, 1]
}

function calculateSeasonalSentimentCorrelation(reviews: Review[]): { correlation: number; explanation: string } {
  const monthlyData = reviews.reduce((acc, review) => {
    const month = parseISO(review.publishedAtDate).getMonth();
    if (!acc[month]) acc[month] = [];
    acc[month].push(getSentimentScore(review.sentiment));
    return acc;
  }, {} as Record<number, number[]>);

  const monthlyAvgs = Object.entries(monthlyData).map(([month, scores]) => ({
    month: parseInt(month),
    avgSentiment: scores.reduce((sum, score) => sum + score, 0) / scores.length,
  }));

  if (monthlyAvgs.length < 3) return { correlation: 0, explanation: 'Insufficient data for seasonal analysis' };

  // Simple seasonal pattern detection
  const seasons = [
    { months: [11, 0, 1], name: 'Winter' }, // Dec, Jan, Feb
    { months: [2, 3, 4], name: 'Spring' },  // Mar, Apr, May
    { months: [5, 6, 7], name: 'Summer' },  // Jun, Jul, Aug
    { months: [8, 9, 10], name: 'Fall' },   // Sep, Oct, Nov
  ];

  const seasonalAvgs = seasons.map(season => {
    const seasonData = monthlyAvgs.filter(m => season.months.includes(m.month));
    const avgSentiment = seasonData.length > 0 ? 
      seasonData.reduce((sum, m) => sum + m.avgSentiment, 0) / seasonData.length : 0;
    return { season: season.name, avgSentiment };
  });

  const maxSeason = seasonalAvgs.reduce((max, s) => s.avgSentiment > max.avgSentiment ? s : max);
  const minSeason = seasonalAvgs.reduce((min, s) => s.avgSentiment < min.avgSentiment ? s : min);

  const seasonalVariation = maxSeason.avgSentiment - minSeason.avgSentiment;
  const correlation = Math.min(1, seasonalVariation / 50); // Normalize

  return {
    correlation,
    explanation: `Sentiment tends to be ${maxSeason.season === minSeason.season ? 'consistent' : `higher in ${maxSeason.season} and lower in ${minSeason.season}`}`,
  };
}

function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumXX = x.reduce((sum, val) => sum + val * val, 0);
  const sumYY = y.reduce((sum, val) => sum + val * val, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
}

function getSentimentScore(sentiment: string | null | undefined): number {
  const sentimentStr = sentiment?.toLowerCase() || '';
  if (sentimentStr.includes('positive')) return 100;
  if (sentimentStr.includes('negative')) return 0;
  return 50; // neutral
}

function generateSentimentRecommendation(change: number, currentScore: number): string {
  if (change > 10) return 'Excellent improvement! Continue current strategies and monitor what\'s working well.';
  if (change > 5) return 'Good positive trend. Look for opportunities to accelerate this improvement.';
  if (change < -10) return 'Significant decline requires immediate attention. Review recent changes and customer feedback.';
  if (change < -5) return 'Negative trend detected. Investigate root causes and implement corrective measures.';
  if (currentScore > 80) return 'Maintain current high performance while looking for excellence opportunities.';
  if (currentScore < 60) return 'Below average sentiment requires systematic improvement efforts.';
  return 'Stable sentiment. Consider strategies to drive positive momentum.';
}

function identifyAffectingFactors(reviews: Review[], category: string): string[] {
  // Analyze themes and patterns that correlate with sentiment
  const factors: string[] = [];
  
  const themeAnalysis = reviews.reduce((acc, review) => {
    const themes = review.mainThemes?.split(',').map(t => t.trim()) || [];
    const sentiment = getSentimentScore(review.sentiment);
    
    themes.forEach(theme => {
      if (!acc[theme]) acc[theme] = [];
      acc[theme].push(sentiment);
    });
    
    return acc;
  }, {} as Record<string, number[]>);

  // Find themes that strongly correlate with sentiment
  Object.entries(themeAnalysis).forEach(([theme, sentiments]) => {
    if (sentiments.length >= 3) {
      const avgSentiment = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
      if (avgSentiment > 75) factors.push(`Positive: ${theme}`);
      if (avgSentiment < 25) factors.push(`Negative: ${theme}`);
    }
  });

  return factors.slice(0, 5); // Return top 5 factors
}

function generateThemeSentimentInsights(reviews: Review[], previousReviews: Review[]): SentimentInsight[] {
  const insights: SentimentInsight[] = [];
  
  // Extract unique themes
  const allThemes = new Set<string>();
  [...reviews, ...previousReviews].forEach(review => {
    const themes = review.mainThemes?.split(',').map(t => t.trim()) || [];
    themes.forEach(theme => allThemes.add(theme));
  });

  // Analyze sentiment for each theme
  Array.from(allThemes).slice(0, 5).forEach(theme => {
    const currentThemeReviews = reviews.filter(r => 
      r.mainThemes?.toLowerCase().includes(theme.toLowerCase())
    );
    const previousThemeReviews = previousReviews.filter(r => 
      r.mainThemes?.toLowerCase().includes(theme.toLowerCase())
    );

    if (currentThemeReviews.length >= 3) {
      const currentScore = calculateOverallSentimentScore(currentThemeReviews);
      const previousScore = previousThemeReviews.length > 0 ? 
        calculateOverallSentimentScore(previousThemeReviews) : currentScore;
      
      const change = currentScore - previousScore;
      const changePercentage = previousScore > 0 ? (change / previousScore) * 100 : 0;

      insights.push({
        category: `Theme: ${theme}`,
        currentScore,
        previousScore,
        change,
        changePercentage,
        significance: Math.abs(changePercentage) > 20 ? 'high' : Math.abs(changePercentage) > 10 ? 'medium' : 'low',
        recommendation: generateThemeRecommendation(theme, change, currentScore),
        affectingFactors: identifyAffectingFactors(currentThemeReviews, theme),
      });
    }
  });

  return insights;
}

function generateStaffSentimentInsights(reviews: Review[], previousReviews: Review[]): SentimentInsight[] {
  const insights: SentimentInsight[] = [];
  
  // Extract staff mentions
  const staffMentions = new Set<string>();
  [...reviews, ...previousReviews].forEach(review => {
    const staff = review.staffMentioned?.split(',').map(s => s.trim()) || [];
    staff.forEach(person => staffMentions.add(person));
  });

  // Analyze sentiment for each staff member
  Array.from(staffMentions).slice(0, 3).forEach(staff => {
    const currentStaffReviews = reviews.filter(r => 
      r.staffMentioned?.toLowerCase().includes(staff.toLowerCase())
    );
    const previousStaffReviews = previousReviews.filter(r => 
      r.staffMentioned?.toLowerCase().includes(staff.toLowerCase())
    );

    if (currentStaffReviews.length >= 2) {
      const currentScore = calculateOverallSentimentScore(currentStaffReviews);
      const previousScore = previousStaffReviews.length > 0 ? 
        calculateOverallSentimentScore(previousStaffReviews) : currentScore;
      
      const change = currentScore - previousScore;
      const changePercentage = previousScore > 0 ? (change / previousScore) * 100 : 0;

      insights.push({
        category: `Staff: ${staff}`,
        currentScore,
        previousScore,
        change,
        changePercentage,
        significance: Math.abs(changePercentage) > 25 ? 'high' : Math.abs(changePercentage) > 10 ? 'medium' : 'low',
        recommendation: generateStaffRecommendation(staff, change, currentScore),
        affectingFactors: identifyAffectingFactors(currentStaffReviews, staff),
      });
    }
  });

  return insights;
}

function generateThemeRecommendation(theme: string, change: number, currentScore: number): string {
  if (change > 15) return `${theme} is performing excellently. Use this as a competitive advantage.`;
  if (change < -15) return `${theme} sentiment has declined significantly. Investigate and address issues.`;
  if (currentScore > 80) return `${theme} maintains high customer satisfaction. Continue current approach.`;
  if (currentScore < 60) return `${theme} needs improvement. Focus training and resources on this area.`;
  return `${theme} has stable sentiment. Look for opportunities to create positive momentum.`;
}

function generateStaffRecommendation(staff: string, change: number, currentScore: number): string {
  if (change > 20) return `${staff} is receiving increasingly positive feedback. Recognize and learn from their approach.`;
  if (change < -20) return `${staff} sentiment has declined. Provide support and additional training.`;
  if (currentScore > 85) return `${staff} consistently receives positive feedback. Great team member.`;
  if (currentScore < 60) return `${staff} needs additional support to improve customer interactions.`;
  return `${staff} maintains consistent performance. Monitor for improvement opportunities.`;
}

function identifyChangeFactors(currentReviews: Review[], previousReviews: Review[]): string[] {
  // Compare theme frequencies between periods
  const currentThemes = extractThemeFrequencies(currentReviews);
  const previousThemes = extractThemeFrequencies(previousReviews);
  
  const factors: string[] = [];
  
  // Find themes with significant changes
  Object.keys(currentThemes).forEach(theme => {
    const currentFreq = currentThemes[theme] || 0;
    const previousFreq = previousThemes[theme] || 0;
    const change = currentFreq - previousFreq;
    
    if (Math.abs(change) > 2) {
      factors.push(change > 0 ? `Increased: ${theme}` : `Decreased: ${theme}`);
    }
  });

  return factors.slice(0, 3);
}

function identifyImpactedCategories(currentReviews: Review[], previousReviews: Review[]): string[] {
  const categories: string[] = [];
  
  // Analyze rating distributions
  const currentRatingDist = calculateRatingDistribution(currentReviews);
  const previousRatingDist = calculateRatingDistribution(previousReviews);
  
  // Find significant rating changes
  [5, 4, 3, 2, 1].forEach(rating => {
    const currentPct = currentRatingDist[rating] || 0;
    const previousPct = previousRatingDist[rating] || 0;
    const change = currentPct - previousPct;
    
    if (Math.abs(change) > 10) {
      categories.push(`${rating}-star reviews`);
    }
  });

  return categories.slice(0, 3);
}

function extractThemeFrequencies(reviews: Review[]): Record<string, number> {
  const frequencies: Record<string, number> = {};
  
  reviews.forEach(review => {
    const themes = review.mainThemes?.split(',').map(t => t.trim()) || [];
    themes.forEach(theme => {
      frequencies[theme] = (frequencies[theme] || 0) + 1;
    });
  });
  
  return frequencies;
}

function calculateRatingDistribution(reviews: Review[]): Record<number, number> {
  const distribution: Record<number, number> = {};
  const total = reviews.length;
  
  if (total === 0) return distribution;
  
  reviews.forEach(review => {
    const rating = review.stars;
    distribution[rating] = (distribution[rating] || 0) + 1;
  });
  
  // Convert to percentages
  Object.keys(distribution).forEach(rating => {
    distribution[parseInt(rating)] = (distribution[parseInt(rating)] / total) * 100;
  });
  
  return distribution;
}

export default {
  analyzeSentimentTrends,
  calculateSentimentCorrelations,
  generateSentimentInsights,
  trackSentimentChanges,
};
