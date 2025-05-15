import { Review } from '@/types/reviews';
import { addDays, startOfWeek, startOfMonth, startOfQuarter, format } from 'date-fns';

export interface TemporalPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'seasonal';
  period: string;
  metrics: {
    avgRating: number;
    reviewCount: number;
    sentiment: number;
    responseRate: number;
  };
  trends: {
    rating: 'up' | 'down' | 'stable';
    volume: 'up' | 'down' | 'stable';
    sentiment: 'up' | 'down' | 'stable';
  };
  insights: string[];
}

export interface TimeSeriesData {
  date: string;
  rating: number;
  volume: number;
  sentiment: number;
  positiveRatio: number;
}

export interface SeasonalPattern {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  months: number[];
  avgRating: number;
  reviewVolume: number;
  peakDays: string[];
  insights: string[];
}

export class TemporalAnalysisService {
  
  // Analyze patterns over different time periods
  analyzeTemporalPatterns(reviews: Review[]): TemporalPattern[] {
    const patterns: TemporalPattern[] = [];
    
    // Sort reviews by date
    const sortedReviews = [...reviews].sort((a, b) => 
      new Date(a.publishedAtDate).getTime() - new Date(b.publishedAtDate).getTime()
    );
    
    // Daily patterns (last 30 days)
    patterns.push(...this.analyzeDailyPatterns(sortedReviews));
    
    // Weekly patterns (last 12 weeks)
    patterns.push(...this.analyzeWeeklyPatterns(sortedReviews));
    
    // Monthly patterns (last 12 months)
    patterns.push(...this.analyzeMonthlyPatterns(sortedReviews));
    
    // Seasonal patterns (if enough data)
    if (reviews.length > 100) {
      patterns.push(...this.analyzeSeasonalPatterns(sortedReviews));
    }
    
    return patterns;
  }
  
  // Get time series data for visualization
  getTimeSeriesData(reviews: Review[], granularity: 'day' | 'week' | 'month'): TimeSeriesData[] {
    const groupedData = this.groupReviewsByPeriod(reviews, granularity);
    
    return Object.entries(groupedData).map(([period, periodReviews]) => {
      const ratings = periodReviews.map(r => r.stars);
      const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      
      const sentiments = periodReviews.map(r => this.getSentimentScore(r.sentiment));
      const avgSentiment = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
      
      const positiveCount = periodReviews.filter(r => r.sentiment === 'positive').length;
      const positiveRatio = positiveCount / periodReviews.length;
      
      return {
        date: period,
        rating: avgRating,
        volume: periodReviews.length,
        sentiment: avgSentiment,
        positiveRatio
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  // Identify peak and low periods
  identifyPeakPeriods(reviews: Review[]): {
    peakDays: { day: string; reason: string }[];
    lowDays: { day: string; reason: string }[];
    peakHours: { hour: number; volume: number }[];
  } {
    const dailyVolume = this.groupReviewsByPeriod(reviews, 'day');
    const sortedDays = Object.entries(dailyVolume)
      .map(([day, reviews]) => ({ day, volume: reviews.length }))
      .sort((a, b) => b.volume - a.volume);
    
    const peakDays = sortedDays.slice(0, 5).map(({ day, volume }) => ({
      day,
      reason: `High review volume (${volume} reviews)`
    }));
    
    const lowDays = sortedDays.slice(-5).map(({ day, volume }) => ({
      day,
      reason: `Low review volume (${volume} reviews)`
    }));
    
    // Analyze by hour of day
    const hourlyVolume: Record<number, number> = {};
    reviews.forEach(review => {
      const hour = new Date(review.publishedAtDate).getHours();
      hourlyVolume[hour] = (hourlyVolume[hour] || 0) + 1;
    });
    
    const peakHours = Object.entries(hourlyVolume)
      .map(([hour, volume]) => ({ hour: parseInt(hour), volume }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);
    
    return { peakDays, lowDays, peakHours };
  }
  
  // Analyze seasonal patterns
  analyzeSeasonalPatterns(reviews: Review[]): TemporalPattern[] {
    const seasonalData: Record<string, Review[]> = {
      spring: [],
      summer: [],
      fall: [],
      winter: []
    };
    
    reviews.forEach(review => {
      const month = new Date(review.publishedAtDate).getMonth();
      const season = this.getSeasonFromMonth(month);
      seasonalData[season].push(review);
    });
    
    return Object.entries(seasonalData).map(([season, seasonReviews]) => {
      if (seasonReviews.length === 0) return null;
      
      const avgRating = seasonReviews.reduce((sum, r) => sum + r.stars, 0) / seasonReviews.length;
      const sentiment = this.calculateAverageSentiment(seasonReviews);
      
      return {
        type: 'seasonal' as const,
        period: season,
        metrics: {
          avgRating,
          reviewCount: seasonReviews.length,
          sentiment,
          responseRate: this.calculateResponseRate(seasonReviews)
        },
        trends: {
          rating: 'stable' as const,
          volume: 'stable' as const,
          sentiment: 'stable' as const
        },
        insights: this.generateSeasonalInsights(season, seasonReviews)
      };
    }).filter(Boolean) as TemporalPattern[];
  }
  
  // Private helper methods
  private analyzeDailyPatterns(reviews: Review[]): TemporalPattern[] {
    const last30Days = reviews.filter(r => {
      const reviewDate = new Date(r.publishedAtDate);
      const daysAgo = Math.floor((Date.now() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysAgo <= 30;
    });
    
    const dailyGroups = this.groupReviewsByPeriod(last30Days, 'day');
    
    return Object.entries(dailyGroups).map(([day, dayReviews]) => {
      const avgRating = dayReviews.reduce((sum, r) => sum + r.stars, 0) / dayReviews.length;
      
      return {
        type: 'daily' as const,
        period: day,
        metrics: {
          avgRating,
          reviewCount: dayReviews.length,
          sentiment: this.calculateAverageSentiment(dayReviews),
          responseRate: this.calculateResponseRate(dayReviews)
        },
        trends: this.calculateTrends(dayReviews, dailyGroups),
        insights: this.generateDailyInsights(day, dayReviews)
      };
    });
  }
  
  private analyzeWeeklyPatterns(reviews: Review[]): TemporalPattern[] {
    const last12Weeks = reviews.filter(r => {
      const reviewDate = new Date(r.publishedAtDate);
      const weeksAgo = Math.floor((Date.now() - reviewDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
      return weeksAgo <= 12;
    });
    
    const weeklyGroups = this.groupReviewsByPeriod(last12Weeks, 'week');
    
    return Object.entries(weeklyGroups).map(([week, weekReviews]) => {
      const avgRating = weekReviews.reduce((sum, r) => sum + r.stars, 0) / weekReviews.length;
      
      return {
        type: 'weekly' as const,
        period: week,
        metrics: {
          avgRating,
          reviewCount: weekReviews.length,
          sentiment: this.calculateAverageSentiment(weekReviews),
          responseRate: this.calculateResponseRate(weekReviews)
        },
        trends: this.calculateTrends(weekReviews, weeklyGroups),
        insights: this.generateWeeklyInsights(week, weekReviews)
      };
    });
  }
  
  private analyzeMonthlyPatterns(reviews: Review[]): TemporalPattern[] {
    const last12Months = reviews.filter(r => {
      const reviewDate = new Date(r.publishedAtDate);
      const monthsAgo = Math.floor((Date.now() - reviewDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      return monthsAgo <= 12;
    });
    
    const monthlyGroups = this.groupReviewsByPeriod(last12Months, 'month');
    
    return Object.entries(monthlyGroups).map(([month, monthReviews]) => {
      const avgRating = monthReviews.reduce((sum, r) => sum + r.stars, 0) / monthReviews.length;
      
      return {
        type: 'monthly' as const,
        period: month,
        metrics: {
          avgRating,
          reviewCount: monthReviews.length,
          sentiment: this.calculateAverageSentiment(monthReviews),
          responseRate: this.calculateResponseRate(monthReviews)
        },
        trends: this.calculateTrends(monthReviews, monthlyGroups),
        insights: this.generateMonthlyInsights(month, monthReviews)
      };
    });
  }
  
  private groupReviewsByPeriod(
    reviews: Review[], 
    period: 'day' | 'week' | 'month'
  ): Record<string, Review[]> {
    const groups: Record<string, Review[]> = {};
    
    reviews.forEach(review => {
      const date = new Date(review.publishedAtDate);
      let key: string;
      
      switch (period) {
        case 'day':
          key = format(date, 'yyyy-MM-dd');
          break;
        case 'week':
          key = format(startOfWeek(date), 'yyyy-MM-dd');
          break;
        case 'month':
          key = format(startOfMonth(date), 'yyyy-MM');
          break;
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(review);
    });
    
    return groups;
  }
  
  private calculateTrends(
    currentReviews: Review[],
    allGroups: Record<string, Review[]>
  ): { rating: 'up' | 'down' | 'stable'; volume: 'up' | 'down' | 'stable'; sentiment: 'up' | 'down' | 'stable' } {
    // Simplified trend calculation
    return {
      rating: 'stable',
      volume: 'stable',
      sentiment: 'stable'
    };
  }
  
  private calculateAverageSentiment(reviews: Review[]): number {
    const sentiments = reviews.map(r => this.getSentimentScore(r.sentiment));
    return sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
  }
  
  private getSentimentScore(sentiment?: string): number {
    switch (sentiment) {
      case 'positive': return 1;
      case 'neutral': return 0;
      case 'negative': return -1;
      default: return 0;
    }
  }
  
  private calculateResponseRate(reviews: Review[]): number {
    const withResponse = reviews.filter(r => r.responseFromOwnerText).length;
    return withResponse / reviews.length;
  }
  
  private getSeasonFromMonth(month: number): string {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }
  
  private generateDailyInsights(day: string, reviews: Review[]): string[] {
    const insights: string[] = [];
    const avgRating = reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length;
    
    if (avgRating > 4.5) insights.push(`Excellent day with ${avgRating.toFixed(1)} average rating`);
    if (reviews.length > 10) insights.push(`High activity with ${reviews.length} reviews`);
    
    const dayOfWeek = new Date(day).toLocaleDateString('en', { weekday: 'long' });
    insights.push(`${dayOfWeek} performance`);
    
    return insights;
  }
  
  private generateWeeklyInsights(week: string, reviews: Review[]): string[] {
    const insights: string[] = [];
    const avgRating = reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length;
    
    if (avgRating > 4.3) insights.push(`Strong week with ${avgRating.toFixed(1)} average rating`);
    if (reviews.length > 50) insights.push(`High volume week with ${reviews.length} reviews`);
    
    return insights;
  }
  
  private generateMonthlyInsights(month: string, reviews: Review[]): string[] {
    const insights: string[] = [];
    const avgRating = reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length;
    
    const monthName = new Date(month).toLocaleDateString('en', { month: 'long', year: 'numeric' });
    insights.push(`${monthName} performance`);
    
    if (avgRating > 4.2) insights.push(`Strong month with ${avgRating.toFixed(1)} average rating`);
    if (reviews.length > 200) insights.push(`High activity month with ${reviews.length} reviews`);
    
    return insights;
  }
  
  private generateSeasonalInsights(season: string, reviews: Review[]): string[] {
    const insights: string[] = [];
    const avgRating = reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length;
    
    insights.push(`${season} season average: ${avgRating.toFixed(1)} stars`);
    insights.push(`Total ${season} reviews: ${reviews.length}`);
    
    // Season-specific insights
    if (season === 'summer' && avgRating > 4.3) {
      insights.push('Strong summer performance - consider summer promotions');
    }
    if (season === 'winter' && reviews.length < 100) {
      insights.push('Lower winter activity - consider winter marketing campaigns');
    }
    
    return insights;
  }
}
