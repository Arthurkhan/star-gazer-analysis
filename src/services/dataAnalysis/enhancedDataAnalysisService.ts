import { Review } from '@/types/reviews';
import { 
  TemporalPattern, 
  HistoricalTrend, 
  ReviewCluster, 
  SeasonalPattern,
  EnhancedAnalysis,
  TimeSeriesData,
  PatternRecognitionResult
} from '@/types/dataAnalysis';

export class EnhancedDataAnalysisService {
  
  // Main analysis method
  public analyzeData(reviews: Review[]): EnhancedAnalysis {
    const temporalPatterns = this.detectTemporalPatterns(reviews);
    const historicalTrends = this.analyzeHistoricalTrends(reviews);
    const reviewClusters = this.clusterReviews(reviews);
    const seasonalAnalysis = this.analyzeSeasonalPatterns(reviews);
    
    const insights = this.generateInsights(
      temporalPatterns,
      historicalTrends,
      reviewClusters,
      seasonalAnalysis
    );
    
    return {
      temporalPatterns,
      historicalTrends,
      reviewClusters,
      seasonalAnalysis,
      insights
    };
  }
  
  // Temporal Pattern Recognition
  private detectTemporalPatterns(reviews: Review[]): TemporalPattern[] {
    const patterns: TemporalPattern[] = [];
    
    // Daily patterns (e.g., lunch rush, happy hour)
    const dailyPattern = this.analyzeDailyPatterns(reviews);
    if (dailyPattern) patterns.push(dailyPattern);
    
    // Weekly patterns (e.g., weekend vs weekday)
    const weeklyPattern = this.analyzeWeeklyPatterns(reviews);
    if (weeklyPattern) patterns.push(weeklyPattern);
    
    // Monthly patterns (e.g., end of month surge)
    const monthlyPattern = this.analyzeMonthlyPatterns(reviews);
    if (monthlyPattern) patterns.push(monthlyPattern);
    
    return patterns;
  }
  
  private analyzeDailyPatterns(reviews: Review[]): TemporalPattern | null {
    // Group reviews by hour of day
    const hourlyData: { [hour: number]: { count: number; avgRating: number } } = {};
    
    reviews.forEach(review => {
      const date = new Date(review.publishedAtDate);
      const hour = date.getHours();
      
      if (!hourlyData[hour]) {
        hourlyData[hour] = { count: 0, avgRating: 0 };
      }
      
      hourlyData[hour].count++;
      hourlyData[hour].avgRating += review.stars;
    });
    
    // Calculate averages and find patterns
    const hourlyMetrics = Object.entries(hourlyData).map(([hour, data]) => ({
      period: `${hour}:00`,
      metric: 'activity',
      value: data.count,
      avgRating: data.avgRating / data.count,
      trend: 'stable' as const
    }));
    
    // Identify peak hours
    const avgCount = hourlyMetrics.reduce((sum, h) => sum + h.value, 0) / hourlyMetrics.length;
    const peakHours = hourlyMetrics.filter(h => h.value > avgCount * 1.5);
    
    if (peakHours.length > 0) {
      return {
        pattern: 'daily',
        description: `Peak activity during ${peakHours.map(h => h.period).join(', ')}`,
        strength: 0.8,
        data: hourlyMetrics.map(h => ({
          period: h.period,
          metric: 'reviews',
          value: h.value,
          trend: h.value > avgCount ? 'increasing' : 'decreasing'
        }))
      };
    }
    
    return null;
  }
  
  private analyzeWeeklyPatterns(reviews: Review[]): TemporalPattern | null {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyData: { [day: string]: { count: number; avgRating: number } } = {};
    
    reviews.forEach(review => {
      const date = new Date(review.publishedAtDate);
      const dayName = daysOfWeek[date.getDay()];
      
      if (!weeklyData[dayName]) {
        weeklyData[dayName] = { count: 0, avgRating: 0 };
      }
      
      weeklyData[dayName].count++;
      weeklyData[dayName].avgRating += review.stars;
    });
    
    const weeklyMetrics = daysOfWeek.map(day => {
      const data = weeklyData[day] || { count: 0, avgRating: 0 };
      return {
        period: day,
        metric: 'activity',
        value: data.count,
        avgRating: data.count > 0 ? data.avgRating / data.count : 0,
        trend: 'stable' as const
      };
    });
    
    // Identify weekend vs weekday patterns
    const weekdayAvg = weeklyMetrics.slice(1, 6).reduce((sum, d) => sum + d.value, 0) / 5;
    const weekendAvg = (weeklyMetrics[0].value + weeklyMetrics[6].value) / 2;
    
    if (Math.abs(weekendAvg - weekdayAvg) / weekdayAvg > 0.2) {
      return {
        pattern: 'weekly',
        description: weekendAvg > weekdayAvg 
          ? 'Higher activity on weekends' 
          : 'Higher activity on weekdays',
        strength: 0.75,
        data: weeklyMetrics.map(w => ({
          period: w.period,
          metric: 'reviews',
          value: w.value,
          trend: w.value > weekdayAvg ? 'increasing' : 'decreasing'
        }))
      };
    }
    
    return null;
  }
  
  private analyzeMonthlyPatterns(reviews: Review[]): TemporalPattern | null {
    const monthlyData: { [month: string]: { count: number; avgRating: number } } = {};
    
    reviews.forEach(review => {
      const date = new Date(review.publishedAtDate);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { count: 0, avgRating: 0 };
      }
      
      monthlyData[monthKey].count++;
      monthlyData[monthKey].avgRating += review.stars;
    });
    
    const sortedMonths = Object.keys(monthlyData).sort();
    const monthlyMetrics = sortedMonths.map((month, index) => {
      const data = monthlyData[month];
      const previousMonth = index > 0 ? monthlyData[sortedMonths[index - 1]] : null;
      
      return {
        period: month,
        metric: 'reviews',
        value: data.count,
        avgRating: data.avgRating / data.count,
        trend: previousMonth 
          ? (data.count > previousMonth.count ? 'increasing' : 'decreasing')
          : 'stable' as const
      };
    });
    
    // Detect growth or decline trends
    const recentMonths = monthlyMetrics.slice(-6);
    const firstHalf = recentMonths.slice(0, 3).reduce((sum, m) => sum + m.value, 0) / 3;
    const secondHalf = recentMonths.slice(3).reduce((sum, m) => sum + m.value, 0) / 3;
    
    if (Math.abs(secondHalf - firstHalf) / firstHalf > 0.1) {
      return {
        pattern: 'monthly',
        description: secondHalf > firstHalf 
          ? 'Growing review volume trend' 
          : 'Declining review volume trend',
        strength: 0.7,
        data: monthlyMetrics.map(m => ({
          period: m.period,
          metric: 'reviews',
          value: m.value,
          trend: m.trend
        }))
      };
    }
    
    return null;
  }
  
  // Historical Trend Analysis
  private analyzeHistoricalTrends(reviews: Review[]): HistoricalTrend[] {
    const trends: HistoricalTrend[] = [];
    
    // Rating trends
    trends.push(this.analyzeRatingTrends(reviews));
    
    // Volume trends
    trends.push(this.analyzeVolumeTrends(reviews));
    
    // Sentiment trends
    trends.push(this.analyzeSentimentTrends(reviews));
    
    return trends.filter(t => t !== null) as HistoricalTrend[];
  }
  
  private analyzeRatingTrends(reviews: Review[]): HistoricalTrend {
    const monthlyRatings: { [month: string]: { sum: number; count: number } } = {};
    
    reviews.forEach(review => {
      const date = new Date(review.publishedAtDate);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthlyRatings[monthKey]) {
        monthlyRatings[monthKey] = { sum: 0, count: 0 };
      }
      
      monthlyRatings[monthKey].sum += review.stars;
      monthlyRatings[monthKey].count++;
    });
    
    const sortedMonths = Object.keys(monthlyRatings).sort();
    const data = sortedMonths.map((month, index) => {
      const avgRating = monthlyRatings[month].sum / monthlyRatings[month].count;
      const previousMonth = index > 0 
        ? monthlyRatings[sortedMonths[index - 1]].sum / monthlyRatings[sortedMonths[index - 1]].count
        : avgRating;
      
      return {
        period: month,
        value: avgRating,
        percentageChange: ((avgRating - previousMonth) / previousMonth) * 100
      };
    });
    
    // Determine overall trend
    const recentData = data.slice(-6);
    const avgChange = recentData.reduce((sum, d) => sum + d.percentageChange, 0) / recentData.length;
    
    return {
      metric: 'Average Rating',
      timeframe: 'month',
      data,
      trend: avgChange > 0.5 ? 'improving' : avgChange < -0.5 ? 'declining' : 'stable',
      forecast: this.forecastNextPeriod(data)
    };
  }
  
  private analyzeVolumeTrends(reviews: Review[]): HistoricalTrend {
    const monthlyVolume: { [month: string]: number } = {};
    
    reviews.forEach(review => {
      const date = new Date(review.publishedAtDate);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      monthlyVolume[monthKey] = (monthlyVolume[monthKey] || 0) + 1;
    });
    
    const sortedMonths = Object.keys(monthlyVolume).sort();
    const data = sortedMonths.map((month, index) => {
      const volume = monthlyVolume[month];
      const previousVolume = index > 0 ? monthlyVolume[sortedMonths[index - 1]] : volume;
      
      return {
        period: month,
        value: volume,
        percentageChange: ((volume - previousVolume) / previousVolume) * 100
      };
    });
    
    const recentData = data.slice(-6);
    const avgChange = recentData.reduce((sum, d) => sum + d.percentageChange, 0) / recentData.length;
    
    return {
      metric: 'Review Volume',
      timeframe: 'month',
      data,
      trend: avgChange > 5 ? 'improving' : avgChange < -5 ? 'declining' : 'stable',
      forecast: this.forecastNextPeriod(data)
    };
  }
  
  private analyzeSentimentTrends(reviews: Review[]): HistoricalTrend {
    const monthlySentiment: { [month: string]: { positive: number; total: number } } = {};
    
    reviews.forEach(review => {
      const date = new Date(review.publishedAtDate);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthlySentiment[monthKey]) {
        monthlySentiment[monthKey] = { positive: 0, total: 0 };
      }
      
      monthlySentiment[monthKey].total++;
      if (review.stars >= 4) {
        monthlySentiment[monthKey].positive++;
      }
    });
    
    const sortedMonths = Object.keys(monthlySentiment).sort();
    const data = sortedMonths.map((month, index) => {
      const sentimentScore = monthlySentiment[month].positive / monthlySentiment[month].total;
      const previousScore = index > 0 
        ? monthlySentiment[sortedMonths[index - 1]].positive / monthlySentiment[sortedMonths[index - 1]].total
        : sentimentScore;
      
      return {
        period: month,
        value: sentimentScore * 100,
        percentageChange: ((sentimentScore - previousScore) / previousScore) * 100
      };
    });
    
    const recentData = data.slice(-6);
    const avgChange = recentData.reduce((sum, d) => sum + d.percentageChange, 0) / recentData.length;
    
    return {
      metric: 'Positive Sentiment %',
      timeframe: 'month',
      data,
      trend: avgChange > 2 ? 'improving' : avgChange < -2 ? 'declining' : 'stable',
      forecast: this.forecastNextPeriod(data)
    };
  }
  
  // Review Clustering
  private clusterReviews(reviews: Review[]): ReviewCluster[] {
    const clusters: ReviewCluster[] = [];
    
    // Cluster by rating and sentiment
    const ratingClusters = this.clusterByRating(reviews);
    clusters.push(...ratingClusters);
    
    // Cluster by themes
    const themeClusters = this.clusterByThemes(reviews);
    clusters.push(...themeClusters);
    
    return clusters;
  }
  
  private clusterByRating(reviews: Review[]): ReviewCluster[] {
    const clusters: ReviewCluster[] = [];
    
    // Highly positive reviews (5 stars)
    const fiveStarReviews = reviews.filter(r => r.stars === 5);
    if (fiveStarReviews.length > 0) {
      clusters.push({
        id: 'cluster-5star',
        name: 'Delighted Customers',
        description: 'Customers who had exceptional experiences',
        reviewCount: fiveStarReviews.length,
        averageRating: 5,
        sentiment: 'positive',
        keywords: this.extractKeywords(fiveStarReviews),
        examples: fiveStarReviews.slice(0, 3).map(r => r.text),
        insights: [
          `${fiveStarReviews.length} customers (${(fiveStarReviews.length / reviews.length * 100).toFixed(1)}%) gave 5-star ratings`,
          `Key satisfaction drivers: ${this.extractKeywords(fiveStarReviews).slice(0, 3).join(', ')}`
        ]
      });
    }
    
    // Negative reviews (1-2 stars)
    const negativeReviews = reviews.filter(r => r.stars <= 2);
    if (negativeReviews.length > 0) {
      clusters.push({
        id: 'cluster-negative',
        name: 'Dissatisfied Customers',
        description: 'Customers who had poor experiences',
        reviewCount: negativeReviews.length,
        averageRating: negativeReviews.reduce((sum, r) => sum + r.stars, 0) / negativeReviews.length,
        sentiment: 'negative',
        keywords: this.extractKeywords(negativeReviews),
        examples: negativeReviews.slice(0, 3).map(r => r.text),
        insights: [
          `${negativeReviews.length} customers (${(negativeReviews.length / reviews.length * 100).toFixed(1)}%) gave 1-2 star ratings`,
          `Main complaints: ${this.extractKeywords(negativeReviews).slice(0, 3).join(', ')}`
        ]
      });
    }
    
    return clusters;
  }
  
  private clusterByThemes(reviews: Review[]): ReviewCluster[] {
    const clusters: ReviewCluster[] = [];
    const themeGroups: { [theme: string]: Review[] } = {};
    
    // Group reviews by main themes
    reviews.forEach(review => {
      if (review.mainThemes) {
        const themes = review.mainThemes.split(',').map(t => t.trim());
        themes.forEach(theme => {
          if (!themeGroups[theme]) {
            themeGroups[theme] = [];
          }
          themeGroups[theme].push(review);
        });
      }
    });
    
    // Create clusters for significant themes
    Object.entries(themeGroups)
      .filter(([_, reviews]) => reviews.length >= 5)
      .forEach(([theme, themeReviews]) => {
        const avgRating = themeReviews.reduce((sum, r) => sum + r.stars, 0) / themeReviews.length;
        
        clusters.push({
          id: `cluster-theme-${theme.toLowerCase().replace(/\s+/g, '-')}`,
          name: `${theme} Focused`,
          description: `Reviews mentioning ${theme}`,
          reviewCount: themeReviews.length,
          averageRating: avgRating,
          sentiment: avgRating >= 4 ? 'positive' : avgRating <= 2 ? 'negative' : 'neutral',
          keywords: [theme, ...this.extractKeywords(themeReviews).filter(k => k !== theme)],
          examples: themeReviews.slice(0, 3).map(r => r.text),
          insights: [
            `${themeReviews.length} reviews mention ${theme}`,
            `Average rating when ${theme} is mentioned: ${avgRating.toFixed(1)}`,
            `${((avgRating - reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length) * 100).toFixed(0)}% difference from overall average`
          ]
        });
      });
    
    return clusters;
  }
  
  // Seasonal Analysis
  private analyzeSeasonalPatterns(reviews: Review[]): SeasonalPattern[] {
    const patterns: SeasonalPattern[] = [];
    const seasons = this.groupBySeason(reviews);
    
    Object.entries(seasons).forEach(([season, seasonReviews]) => {
      if (seasonReviews.length < 10) return; // Skip seasons with too few reviews
      
      const avgRating = seasonReviews.reduce((sum, r) => sum + r.stars, 0) / seasonReviews.length;
      const sentiment = this.calculateSentiment(seasonReviews);
      const themes = this.extractKeywords(seasonReviews);
      
      // Compare with year average
      const yearAvgRating = reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length;
      
      patterns.push({
        season: season as SeasonalPattern['season'],
        name: this.getSeasonName(season),
        dateRange: this.getSeasonDateRange(season),
        metrics: {
          avgRating,
          reviewVolume: seasonReviews.length,
          sentiment,
          topThemes: themes.slice(0, 5)
        },
        comparison: {
          vsYearAverage: ((avgRating - yearAvgRating) / yearAvgRating) * 100,
          vsPreviousYear: 0 // Would need previous year data
        },
        recommendations: this.generateSeasonalRecommendations(season, avgRating, themes)
      });
    });
    
    return patterns;
  }
  
  private groupBySeason(reviews: Review[]): { [season: string]: Review[] } {
    const seasons: { [season: string]: Review[] } = {
      spring: [],
      summer: [],
      fall: [],
      winter: []
    };
    
    reviews.forEach(review => {
      const date = new Date(review.publishedAtDate);
      const month = date.getMonth();
      
      if (month >= 2 && month <= 4) seasons.spring.push(review);
      else if (month >= 5 && month <= 7) seasons.summer.push(review);
      else if (month >= 8 && month <= 10) seasons.fall.push(review);
      else seasons.winter.push(review);
    });
    
    return seasons;
  }
  
  // Helper methods
  private forecastNextPeriod(data: { period: string; value: number }[]): HistoricalTrend['forecast'] {
    if (data.length < 3) return undefined;
    
    // Simple linear regression for forecast
    const recentData = data.slice(-6);
    const trend = (recentData[recentData.length - 1].value - recentData[0].value) / recentData.length;
    const lastValue = recentData[recentData.length - 1].value;
    
    return {
      nextPeriod: this.getNextPeriod(recentData[recentData.length - 1].period),
      predictedValue: lastValue + trend,
      confidence: 0.7 // Simplified confidence score
    };
  }
  
  private getNextPeriod(period: string): string {
    const [year, month] = period.split('-').map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    return `${nextYear}-${nextMonth.toString().padStart(2, '0')}`;
  }
  
  private extractKeywords(reviews: Review[]): string[] {
    const wordFrequency: { [word: string]: number } = {};
    
    reviews.forEach(review => {
      const words = review.text.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3 && !this.isStopWord(word)) {
          wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        }
      });
    });
    
    return Object.entries(wordFrequency)
      .sort(([, a], [, b]) => b - a)
      .map(([word]) => word)
      .slice(0, 10);
  }
  
  private isStopWord(word: string): boolean {
    const stopWords = ['the', 'and', 'was', 'for', 'with', 'this', 'that', 'have', 'from', 'were'];
    return stopWords.includes(word);
  }
  
  private calculateSentiment(reviews: Review[]): number {
    const positiveReviews = reviews.filter(r => r.stars >= 4).length;
    return positiveReviews / reviews.length;
  }
  
  private getSeasonName(season: string): string {
    const names: { [key: string]: string } = {
      spring: 'Spring Season',
      summer: 'Summer Season',
      fall: 'Fall Season',
      winter: 'Winter Season'
    };
    return names[season] || season;
  }
  
  private getSeasonDateRange(season: string): { start: string; end: string } {
    const ranges: { [key: string]: { start: string; end: string } } = {
      spring: { start: '03-01', end: '05-31' },
      summer: { start: '06-01', end: '08-31' },
      fall: { start: '09-01', end: '11-30' },
      winter: { start: '12-01', end: '02-28' }
    };
    return ranges[season] || { start: '', end: '' };
  }
  
  private generateSeasonalRecommendations(season: string, avgRating: number, themes: string[]): string[] {
    const recommendations: string[] = [];
    
    if (season === 'summer' && avgRating > 4) {
      recommendations.push('Capitalize on summer success with outdoor events');
    }
    
    if (season === 'winter' && avgRating < 3.5) {
      recommendations.push('Improve winter offerings to boost satisfaction');
    }
    
    if (themes.includes('crowd') || themes.includes('busy')) {
      recommendations.push('Implement reservation system for peak seasons');
    }
    
    return recommendations;
  }
  
  private generateInsights(
    temporalPatterns: TemporalPattern[],
    historicalTrends: HistoricalTrend[],
    reviewClusters: ReviewCluster[],
    seasonalPatterns: SeasonalPattern[]
  ): EnhancedAnalysis['insights'] {
    const keyFindings: string[] = [];
    const opportunities: string[] = [];
    const risks: string[] = [];
    
    // Key findings from temporal patterns
    temporalPatterns.forEach(pattern => {
      if (pattern.strength > 0.7) {
        keyFindings.push(pattern.description);
      }
    });
    
    // Opportunities from historical trends
    historicalTrends.forEach(trend => {
      if (trend.trend === 'improving') {
        opportunities.push(`${trend.metric} is improving - leverage this momentum`);
      } else if (trend.trend === 'declining') {
        risks.push(`${trend.metric} is declining - immediate action needed`);
      }
    });
    
    // Insights from clusters
    reviewClusters.forEach(cluster => {
      if (cluster.sentiment === 'positive' && cluster.reviewCount > 20) {
        opportunities.push(`Leverage strength in "${cluster.name}" segment`);
      } else if (cluster.sentiment === 'negative') {
        risks.push(`Address issues in "${cluster.name}" segment`);
      }
    });
    
    // Seasonal insights
    seasonalPatterns.forEach(pattern => {
      if (pattern.comparison.vsYearAverage > 10) {
        opportunities.push(`Strong performance in ${pattern.name} - plan seasonal campaigns`);
      } else if (pattern.comparison.vsYearAverage < -10) {
        risks.push(`Weak performance in ${pattern.name} - needs improvement`);
      }
    });
    
    return { keyFindings, opportunities, risks };
  }
}

// Export singleton instance
export const enhancedDataAnalysisService = new EnhancedDataAnalysisService();
