import { Review } from '@/types/reviews';
import { 
  TemporalPattern, 
  TimeSeriesData, 
  SeasonalPattern,
  TrendAnalysis,
  ClusteredReviews 
} from '@/types/dataAnalysis';

export class TemporalAnalysisService {
  
  /**
   * Analyze review trends over time
   */
  analyzeTemporalPatterns(reviews: Review[]): TemporalPattern[] {
    const patterns: TemporalPattern[] = [];
    
    // Group reviews by week, month, and day of week
    const weeklyPatterns = this.analyzeWeeklyPatterns(reviews);
    const monthlyPatterns = this.analyzeMonthlyPatterns(reviews);
    const dayOfWeekPatterns = this.analyzeDayOfWeekPatterns(reviews);
    const hourlyPatterns = this.analyzeHourlyPatterns(reviews);
    
    patterns.push(...weeklyPatterns, ...monthlyPatterns, ...dayOfWeekPatterns, ...hourlyPatterns);
    return patterns;
  }
  
  /**
   * Track metrics changes over months/years
   */
  generateHistoricalTrends(reviews: Review[]): TrendAnalysis {
    const sortedReviews = [...reviews].sort((a, b) => 
      new Date(a.publishedAtDate).getTime() - new Date(b.publishedAtDate).getTime()
    );
    
    // Calculate monthly metrics
    const monthlyMetrics = this.calculateMonthlyMetrics(sortedReviews);
    
    // Calculate trend direction
    const trends = this.calculateTrends(monthlyMetrics);
    
    // Identify significant changes
    const significantChanges = this.identifySignificantChanges(monthlyMetrics);
    
    return {
      monthlyMetrics,
      trends,
      significantChanges,
      projections: this.generateProjections(monthlyMetrics)
    };
  }
  
  /**
   * Group similar reviews for better insights
   */
  clusterReviews(reviews: Review[]): ClusteredReviews {
    const clusters: ClusteredReviews = {
      bySentiment: this.clusterBySentiment(reviews),
      byTheme: this.clusterByTheme(reviews),
      byRating: this.clusterByRating(reviews),
      byLength: this.clusterByLength(reviews),
      byResponseStatus: this.clusterByResponseStatus(reviews)
    };
    
    return clusters;
  }
  
  /**
   * Identify business patterns by time of year
   */
  analyzeSeasonalPatterns(reviews: Review[]): SeasonalPattern[] {
    const patterns: SeasonalPattern[] = [];
    
    // Group by season
    const seasonalGroups = this.groupBySeason(reviews);
    
    // Analyze each season
    Object.entries(seasonalGroups).forEach(([season, seasonReviews]) => {
      const avgRating = this.calculateAverageRating(seasonReviews);
      const volume = seasonReviews.length;
      const sentiment = this.calculateSentimentScore(seasonReviews);
      const commonThemes = this.extractCommonThemes(seasonReviews);
      
      patterns.push({
        season,
        avgRating,
        volume,
        sentiment,
        commonThemes,
        yearOverYearChange: this.calculateYearOverYearChange(seasonReviews)
      });
    });
    
    return patterns;
  }
  
  // Helper methods
  private analyzeWeeklyPatterns(reviews: Review[]): TemporalPattern[] {
    const weeklyGroups = this.groupByWeek(reviews);
    const patterns: TemporalPattern[] = [];
    
    Object.entries(weeklyGroups).forEach(([week, weekReviews]) => {
      patterns.push({
        period: week,
        type: 'weekly',
        avgRating: this.calculateAverageRating(weekReviews),
        volume: weekReviews.length,
        sentiment: this.calculateSentimentScore(weekReviews),
        trend: this.determineTrend(weekReviews)
      });
    });
    
    return patterns;
  }
  
  private analyzeMonthlyPatterns(reviews: Review[]): TemporalPattern[] {
    const monthlyGroups = this.groupByMonth(reviews);
    const patterns: TemporalPattern[] = [];
    
    Object.entries(monthlyGroups).forEach(([month, monthReviews]) => {
      patterns.push({
        period: month,
        type: 'monthly',
        avgRating: this.calculateAverageRating(monthReviews),
        volume: monthReviews.length,
        sentiment: this.calculateSentimentScore(monthReviews),
        trend: this.determineTrend(monthReviews)
      });
    });
    
    return patterns;
  }
  
  private analyzeDayOfWeekPatterns(reviews: Review[]): TemporalPattern[] {
    const dayGroups = this.groupByDayOfWeek(reviews);
    const patterns: TemporalPattern[] = [];
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    dayNames.forEach((day, index) => {
      const dayReviews = dayGroups[index] || [];
      patterns.push({
        period: day,
        type: 'dayOfWeek',
        avgRating: this.calculateAverageRating(dayReviews),
        volume: dayReviews.length,
        sentiment: this.calculateSentimentScore(dayReviews),
        trend: this.determineTrend(dayReviews)
      });
    });
    
    return patterns;
  }
  
  private analyzeHourlyPatterns(reviews: Review[]): TemporalPattern[] {
    const hourlyGroups = this.groupByHour(reviews);
    const patterns: TemporalPattern[] = [];
    
    Object.entries(hourlyGroups).forEach(([hour, hourReviews]) => {
      patterns.push({
        period: `${hour}:00`,
        type: 'hourly',
        avgRating: this.calculateAverageRating(hourReviews),
        volume: hourReviews.length,
        sentiment: this.calculateSentimentScore(hourReviews),
        trend: this.determineTrend(hourReviews)
      });
    });
    
    return patterns;
  }
  
  private groupByWeek(reviews: Review[]): Record<string, Review[]> {
    const groups: Record<string, Review[]> = {};
    
    reviews.forEach(review => {
      const date = new Date(review.publishedAtDate);
      const year = date.getFullYear();
      const week = this.getWeekNumber(date);
      const key = `${year}-W${week}`;
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(review);
    });
    
    return groups;
  }
  
  private groupByMonth(reviews: Review[]): Record<string, Review[]> {
    const groups: Record<string, Review[]> = {};
    
    reviews.forEach(review => {
      const date = new Date(review.publishedAtDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(review);
    });
    
    return groups;
  }
  
  private groupByDayOfWeek(reviews: Review[]): Record<number, Review[]> {
    const groups: Record<number, Review[]> = {};
    
    reviews.forEach(review => {
      const date = new Date(review.publishedAtDate);
      const dayOfWeek = date.getDay();
      
      if (!groups[dayOfWeek]) groups[dayOfWeek] = [];
      groups[dayOfWeek].push(review);
    });
    
    return groups;
  }
  
  private groupByHour(reviews: Review[]): Record<number, Review[]> {
    const groups: Record<number, Review[]> = {};
    
    reviews.forEach(review => {
      const date = new Date(review.publishedAtDate);
      const hour = date.getHours();
      
      if (!groups[hour]) groups[hour] = [];
      groups[hour].push(review);
    });
    
    return groups;
  }
  
  private groupBySeason(reviews: Review[]): Record<string, Review[]> {
    const groups: Record<string, Review[]> = {};
    const seasons = ['Winter', 'Spring', 'Summer', 'Fall'];
    
    reviews.forEach(review => {
      const date = new Date(review.publishedAtDate);
      const month = date.getMonth();
      let season: string;
      
      if (month >= 2 && month <= 4) season = 'Spring';
      else if (month >= 5 && month <= 7) season = 'Summer';
      else if (month >= 8 && month <= 10) season = 'Fall';
      else season = 'Winter';
      
      if (!groups[season]) groups[season] = [];
      groups[season].push(review);
    });
    
    return groups;
  }
  
  private clusterBySentiment(reviews: Review[]): Record<string, Review[]> {
    return reviews.reduce((clusters, review) => {
      const sentiment = review.sentiment || 'neutral';
      if (!clusters[sentiment]) clusters[sentiment] = [];
      clusters[sentiment].push(review);
      return clusters;
    }, {} as Record<string, Review[]>);
  }
  
  private clusterByTheme(reviews: Review[]): Record<string, Review[]> {
    const clusters: Record<string, Review[]> = {};
    
    reviews.forEach(review => {
      if (review.mainThemes) {
        const themes = review.mainThemes.split(',').map(t => t.trim());
        themes.forEach(theme => {
          if (!clusters[theme]) clusters[theme] = [];
          clusters[theme].push(review);
        });
      }
    });
    
    return clusters;
  }
  
  private clusterByRating(reviews: Review[]): Record<number, Review[]> {
    return reviews.reduce((clusters, review) => {
      const rating = review.stars;
      if (!clusters[rating]) clusters[rating] = [];
      clusters[rating].push(review);
      return clusters;
    }, {} as Record<number, Review[]>);
  }
  
  private clusterByLength(reviews: Review[]): Record<string, Review[]> {
    return reviews.reduce((clusters, review) => {
      const length = review.text?.length || 0;
      let category: string;
      
      if (length < 50) category = 'very-short';
      else if (length < 150) category = 'short';
      else if (length < 300) category = 'medium';
      else if (length < 500) category = 'long';
      else category = 'very-long';
      
      if (!clusters[category]) clusters[category] = [];
      clusters[category].push(review);
      return clusters;
    }, {} as Record<string, Review[]>);
  }
  
  private clusterByResponseStatus(reviews: Review[]): Record<string, Review[]> {
    return reviews.reduce((clusters, review) => {
      const status = review.responseFromOwnerText ? 'responded' : 'not-responded';
      if (!clusters[status]) clusters[status] = [];
      clusters[status].push(review);
      return clusters;
    }, {} as Record<string, Review[]>);
  }
  
  private calculateAverageRating(reviews: Review[]): number {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.stars, 0);
    return sum / reviews.length;
  }
  
  private calculateSentimentScore(reviews: Review[]): number {
    if (reviews.length === 0) return 0;
    const sentimentMap = { positive: 1, neutral: 0.5, negative: 0 };
    const sum = reviews.reduce((acc, review) => {
      const sentiment = review.sentiment || 'neutral';
      return acc + (sentimentMap[sentiment as keyof typeof sentimentMap] || 0.5);
    }, 0);
    return sum / reviews.length;
  }
  
  private extractCommonThemes(reviews: Review[]): string[] {
    const themeCount: Record<string, number> = {};
    
    reviews.forEach(review => {
      if (review.mainThemes) {
        const themes = review.mainThemes.split(',').map(t => t.trim());
        themes.forEach(theme => {
          themeCount[theme] = (themeCount[theme] || 0) + 1;
        });
      }
    });
    
    return Object.entries(themeCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([theme]) => theme);
  }
  
  private determineTrend(reviews: Review[]): 'improving' | 'stable' | 'declining' {
    if (reviews.length < 2) return 'stable';
    
    const sortedReviews = [...reviews].sort((a, b) => 
      new Date(a.publishedAtDate).getTime() - new Date(b.publishedAtDate).getTime()
    );
    
    const firstHalf = sortedReviews.slice(0, Math.floor(sortedReviews.length / 2));
    const secondHalf = sortedReviews.slice(Math.floor(sortedReviews.length / 2));
    
    const firstAvg = this.calculateAverageRating(firstHalf);
    const secondAvg = this.calculateAverageRating(secondHalf);
    
    if (secondAvg > firstAvg + 0.1) return 'improving';
    if (secondAvg < firstAvg - 0.1) return 'declining';
    return 'stable';
  }
  
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
  
  // Additional helper methods for trend analysis
  private calculateMonthlyMetrics(reviews: Review[]): TimeSeriesData[] {
    const monthlyGroups = this.groupByMonth(reviews);
    const metrics: TimeSeriesData[] = [];
    
    Object.entries(monthlyGroups).forEach(([month, monthReviews]) => {
      metrics.push({
        period: month,
        avgRating: this.calculateAverageRating(monthReviews),
        volume: monthReviews.length,
        sentiment: this.calculateSentimentScore(monthReviews),
        responseRate: this.calculateResponseRate(monthReviews)
      });
    });
    
    return metrics.sort((a, b) => a.period.localeCompare(b.period));
  }
  
  private calculateResponseRate(reviews: Review[]): number {
    if (reviews.length === 0) return 0;
    const respondedCount = reviews.filter(r => r.responseFromOwnerText).length;
    return respondedCount / reviews.length;
  }
  
  private calculateTrends(metrics: TimeSeriesData[]): Record<string, 'increasing' | 'stable' | 'decreasing'> {
    const trends: Record<string, 'increasing' | 'stable' | 'decreasing'> = {};
    
    if (metrics.length < 3) {
      return {
        rating: 'stable',
        volume: 'stable',
        sentiment: 'stable',
        responseRate: 'stable'
      };
    }
    
    // Calculate linear regression for each metric
    trends.rating = this.calculateLinearTrend(metrics.map(m => m.avgRating));
    trends.volume = this.calculateLinearTrend(metrics.map(m => m.volume));
    trends.sentiment = this.calculateLinearTrend(metrics.map(m => m.sentiment));
    trends.responseRate = this.calculateLinearTrend(metrics.map(m => m.responseRate));
    
    return trends;
  }
  
  private calculateLinearTrend(values: number[]): 'increasing' | 'stable' | 'decreasing' {
    const n = values.length;
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
    const sumX2 = values.reduce((sum, _, i) => sum + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    if (slope > 0.01) return 'increasing';
    if (slope < -0.01) return 'decreasing';
    return 'stable';
  }
  
  private identifySignificantChanges(metrics: TimeSeriesData[]): Array<{
    period: string;
    metric: string;
    change: number;
    significance: 'high' | 'medium' | 'low';
  }> {
    const changes: Array<{
      period: string;
      metric: string;
      change: number;
      significance: 'high' | 'medium' | 'low';
    }> = [];
    
    for (let i = 1; i < metrics.length; i++) {
      const current = metrics[i];
      const previous = metrics[i - 1];
      
      // Check rating changes
      const ratingChange = ((current.avgRating - previous.avgRating) / previous.avgRating) * 100;
      if (Math.abs(ratingChange) > 5) {
        changes.push({
          period: current.period,
          metric: 'rating',
          change: ratingChange,
          significance: Math.abs(ratingChange) > 10 ? 'high' : 'medium'
        });
      }
      
      // Check volume changes
      const volumeChange = ((current.volume - previous.volume) / previous.volume) * 100;
      if (Math.abs(volumeChange) > 20) {
        changes.push({
          period: current.period,
          metric: 'volume',
          change: volumeChange,
          significance: Math.abs(volumeChange) > 50 ? 'high' : 'medium'
        });
      }
    }
    
    return changes;
  }
  
  private generateProjections(metrics: TimeSeriesData[]): TimeSeriesData[] {
    if (metrics.length < 3) return [];
    
    const projections: TimeSeriesData[] = [];
    const trends = this.calculateTrends(metrics);
    
    // Project 3 months into the future
    for (let i = 1; i <= 3; i++) {
      const lastMetric = metrics[metrics.length - 1];
      const date = new Date(lastMetric.period);
      date.setMonth(date.getMonth() + i);
      
      const projection: TimeSeriesData = {
        period: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        avgRating: this.projectValue(lastMetric.avgRating, trends.rating),
        volume: Math.round(this.projectValue(lastMetric.volume, trends.volume)),
        sentiment: this.projectValue(lastMetric.sentiment, trends.sentiment),
        responseRate: this.projectValue(lastMetric.responseRate, trends.responseRate)
      };
      
      projections.push(projection);
    }
    
    return projections;
  }
  
  private projectValue(currentValue: number, trend: 'increasing' | 'stable' | 'decreasing'): number {
    const changeRate = trend === 'increasing' ? 1.05 : trend === 'decreasing' ? 0.95 : 1;
    return currentValue * changeRate;
  }
  
  private calculateYearOverYearChange(reviews: Review[]): number {
    const thisYear = new Date().getFullYear();
    const lastYear = thisYear - 1;
    
    const thisYearReviews = reviews.filter(r => new Date(r.publishedAtDate).getFullYear() === thisYear);
    const lastYearReviews = reviews.filter(r => new Date(r.publishedAtDate).getFullYear() === lastYear);
    
    if (lastYearReviews.length === 0) return 0;
    
    const thisYearAvg = this.calculateAverageRating(thisYearReviews);
    const lastYearAvg = this.calculateAverageRating(lastYearReviews);
    
    return ((thisYearAvg - lastYearAvg) / lastYearAvg) * 100;
  }
}
