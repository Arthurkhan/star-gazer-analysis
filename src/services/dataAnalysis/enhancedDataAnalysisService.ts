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
import { getBusinessContext, BusinessContext } from '@/utils/businessContext';

export class EnhancedDataAnalysisService {
  
  // Main analysis method
  public analyzeData(reviews: Review[], businessName?: string): EnhancedAnalysis {
    // Get business context if available
    const businessContext = businessName ? getBusinessContext(businessName) : null;
    
    const temporalPatterns = this.detectTemporalPatterns(reviews, businessContext);
    const historicalTrends = this.analyzeHistoricalTrends(reviews, businessContext);
    const reviewClusters = this.clusterReviews(reviews, businessContext);
    const seasonalAnalysis = this.analyzeSeasonalPatterns(reviews, businessContext);
    
    const insights = this.generateInsights(
      temporalPatterns,
      historicalTrends,
      reviewClusters,
      seasonalAnalysis,
      businessContext
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
  private detectTemporalPatterns(reviews: Review[], context?: BusinessContext | null): TemporalPattern[] {
    const patterns: TemporalPattern[] = [];
    
    // Daily patterns (e.g., lunch rush, happy hour)
    const dailyPattern = this.analyzeDailyPatterns(reviews, context);
    if (dailyPattern) patterns.push(dailyPattern);
    
    // Weekly patterns (e.g., weekend vs weekday)
    const weeklyPattern = this.analyzeWeeklyPatterns(reviews, context);
    if (weeklyPattern) patterns.push(weeklyPattern);
    
    // Monthly patterns (e.g., end of month surge)
    const monthlyPattern = this.analyzeMonthlyPatterns(reviews, context);
    if (monthlyPattern) patterns.push(monthlyPattern);
    
    return patterns;
  }
  
  private analyzeDailyPatterns(reviews: Review[], context?: BusinessContext | null): TemporalPattern | null {
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
    
    // Adjust hourly analysis based on business hours if available
    let relevantHours = hourlyMetrics;
    if (context?.hoursType) {
      switch(context.hoursType) {
        case 'standard':
          relevantHours = hourlyMetrics.filter(h => {
            const hour = parseInt(h.period.split(':')[0]);
            return hour >= 9 && hour <= 17;
          });
          break;
        case 'extended':
          relevantHours = hourlyMetrics.filter(h => {
            const hour = parseInt(h.period.split(':')[0]);
            return hour >= 7 && hour <= 20;
          });
          break;
        case 'evening':
          relevantHours = hourlyMetrics.filter(h => {
            const hour = parseInt(h.period.split(':')[0]);
            return hour >= 16 && hour <= 23;
          });
          break;
        case '24hour':
          relevantHours = hourlyMetrics; // All hours relevant
          break;
        case 'weekends':
          // Daily patterns not as relevant for weekend-only businesses
          break;
      }
    }
    
    // Identify peak hours
    if (relevantHours.length === 0) relevantHours = hourlyMetrics;
    const avgCount = relevantHours.reduce((sum, h) => sum + h.value, 0) / relevantHours.length;
    const peakHours = relevantHours.filter(h => h.value > avgCount * 1.5);
    
    // Customize description based on business type
    let description = `Peak activity during ${peakHours.map(h => h.period).join(', ')}`;
    if (context?.businessType) {
      if (['cafe', 'restaurant'].includes(context.businessType.toLowerCase())) {
        description = `Peak dining hours: ${peakHours.map(h => h.period).join(', ')}`;
      } else if (context.businessType.toLowerCase() === 'bar') {
        description = `Busiest serving hours: ${peakHours.map(h => h.period).join(', ')}`;
      } else if (context.businessType.toLowerCase().includes('gallery')) {
        description = `Peak visiting hours: ${peakHours.map(h => h.period).join(', ')}`;
      }
    }
    
    if (peakHours.length > 0) {
      return {
        pattern: 'daily',
        description,
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
  
  private analyzeWeeklyPatterns(reviews: Review[], context?: BusinessContext | null): TemporalPattern | null {
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
    
    // Customize description based on business type
    let description = weekendAvg > weekdayAvg 
      ? 'Higher activity on weekends' 
      : 'Higher activity on weekdays';
      
    if (context?.businessType) {
      if (['cafe', 'restaurant'].includes(context.businessType.toLowerCase())) {
        description = weekendAvg > weekdayAvg 
          ? 'Weekend dining significantly more popular' 
          : 'Weekday dining more popular than weekends';
      } else if (context.businessType.toLowerCase() === 'bar') {
        description = weekendAvg > weekdayAvg 
          ? 'Weekend nights are your busiest time' 
          : 'Weekdays are surprisingly busier than weekends';
      } else if (context.businessType.toLowerCase().includes('gallery')) {
        description = weekendAvg > weekdayAvg 
          ? 'Weekend visitors dominate your traffic' 
          : 'Weekday traffic exceeds weekend visitors';
      }
    }
    
    // Special case for weekend-only businesses
    if (context?.hoursType === 'weekends') {
      const saturdayData = weeklyMetrics[6];
      const sundayData = weeklyMetrics[0];
      
      if (saturdayData.value > sundayData.value * 1.3) {
        description = 'Saturdays are significantly busier than Sundays';
      } else if (sundayData.value > saturdayData.value * 1.3) {
        description = 'Sundays are significantly busier than Saturdays';
      } else {
        description = 'Similar activity levels on Saturdays and Sundays';
      }
    }
    
    if (Math.abs(weekendAvg - weekdayAvg) / weekdayAvg > 0.2) {
      return {
        pattern: 'weekly',
        description,
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
  
  private analyzeMonthlyPatterns(reviews: Review[], context?: BusinessContext | null): TemporalPattern | null {
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
    
    // Customize description based on business type and trends
    let description = secondHalf > firstHalf 
      ? 'Growing review volume trend' 
      : 'Declining review volume trend';
      
    const growthRate = ((secondHalf - firstHalf) / firstHalf) * 100;
    
    if (context?.businessType) {
      const businessTypeLabel = context.businessType.charAt(0).toUpperCase() + context.businessType.slice(1).toLowerCase();
      
      if (growthRate > 20) {
        description = `${businessTypeLabel} experiencing rapid growth (${growthRate.toFixed(0)}% increase)`;
      } else if (growthRate > 5) {
        description = `${businessTypeLabel} shows steady growth (${growthRate.toFixed(0)}% increase)`;
      } else if (growthRate < -20) {
        description = `${businessTypeLabel} facing significant decline (${Math.abs(growthRate).toFixed(0)}% decrease)`;
      } else if (growthRate < -5) {
        description = `${businessTypeLabel} experiencing gradual decline (${Math.abs(growthRate).toFixed(0)}% decrease)`;
      } else {
        description = `${businessTypeLabel} maintaining stable customer interest`;
      }
    }
    
    if (Math.abs(secondHalf - firstHalf) / firstHalf > 0.1) {
      return {
        pattern: 'monthly',
        description,
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
  private analyzeHistoricalTrends(reviews: Review[], context?: BusinessContext | null): HistoricalTrend[] {
    const trends: HistoricalTrend[] = [];
    
    // Rating trends
    trends.push(this.analyzeRatingTrends(reviews, context));
    
    // Volume trends
    trends.push(this.analyzeVolumeTrends(reviews, context));
    
    // Sentiment trends
    trends.push(this.analyzeSentimentTrends(reviews, context));
    
    return trends.filter(t => t !== null) as HistoricalTrend[];
  }
  
  private analyzeRatingTrends(reviews: Review[], context?: BusinessContext | null): HistoricalTrend {
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
    
    // Adjust trend thresholds based on business type
    let improvingThreshold = 0.5;
    let decliningThreshold = -0.5;
    
    if (context?.businessType === 'gallery' || context?.priceRange === 'luxury') {
      // Premium services have higher expectations, so smaller changes matter more
      improvingThreshold = 0.3;
      decliningThreshold = -0.3;
    } else if (context?.priceRange === 'budget') {
      // Budget services might have more volatility
      improvingThreshold = 0.8;
      decliningThreshold = -0.8;
    }
    
    return {
      metric: 'Average Rating',
      timeframe: 'month',
      data,
      trend: avgChange > improvingThreshold ? 'improving' : avgChange < decliningThreshold ? 'declining' : 'stable',
      forecast: this.forecastNextPeriod(data)
    };
  }
  
  private analyzeVolumeTrends(reviews: Review[], context?: BusinessContext | null): HistoricalTrend {
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
    
    // Adjust volume growth expectations based on business age/maturity
    // New businesses should grow faster than established ones
    let improvingThreshold = 5; // Default 5% growth is improving
    let decliningThreshold = -5; // Default 5% decline is declining
    
    return {
      metric: 'Review Volume',
      timeframe: 'month',
      data,
      trend: avgChange > improvingThreshold ? 'improving' : avgChange < decliningThreshold ? 'declining' : 'stable',
      forecast: this.forecastNextPeriod(data)
    };
  }
  
  private analyzeSentimentTrends(reviews: Review[], context?: BusinessContext | null): HistoricalTrend {
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
  private clusterReviews(reviews: Review[], context?: BusinessContext | null): ReviewCluster[] {
    const clusters: ReviewCluster[] = [];
    
    // Cluster by rating and sentiment
    const ratingClusters = this.clusterByRating(reviews, context);
    clusters.push(...ratingClusters);
    
    // Cluster by themes
    const themeClusters = this.clusterByThemes(reviews, context);
    clusters.push(...themeClusters);
    
    // If business specialties are provided, create clusters for those specialties
    if (context?.specialties && context.specialties.length > 0) {
      const specialtyClusters = this.clusterBySpecialties(reviews, context.specialties);
      clusters.push(...specialtyClusters);
    }
    
    return clusters;
  }
  
  private clusterByRating(reviews: Review[], context?: BusinessContext | null): ReviewCluster[] {
    const clusters: ReviewCluster[] = [];
    
    // Highly positive reviews (5 stars)
    const fiveStarReviews = reviews.filter(r => r.stars === 5);
    if (fiveStarReviews.length > 0) {
      // Customize name based on business type
      let clusterName = 'Delighted Customers';
      let clusterDescription = 'Customers who had exceptional experiences';
      
      if (context?.businessType) {
        if (['cafe', 'restaurant'].includes(context.businessType.toLowerCase())) {
          clusterName = 'Delighted Diners';
          clusterDescription = 'Diners who had exceptional dining experiences';
        } else if (context.businessType.toLowerCase() === 'bar') {
          clusterName = 'Delighted Patrons';
          clusterDescription = 'Patrons who had exceptional experiences';
        } else if (context.businessType.toLowerCase().includes('gallery')) {
          clusterName = 'Impressed Visitors';
          clusterDescription = 'Visitors who were highly impressed with the exhibitions';
        }
      }
      
      clusters.push({
        id: 'cluster-5star',
        name: clusterName,
        description: clusterDescription,
        reviewCount: fiveStarReviews.length,
        averageRating: 5,
        sentiment: 'positive',
        keywords: this.extractKeywords(fiveStarReviews),
        examples: fiveStarReviews.slice(0, 3).map(r => r.text || ''),
        insights: [
          `${fiveStarReviews.length} customers (${(fiveStarReviews.length / reviews.length * 100).toFixed(1)}%) gave 5-star ratings`,
          `Key satisfaction drivers: ${this.extractKeywords(fiveStarReviews).slice(0, 3).join(', ')}`
        ]
      });
    }
    
    // Negative reviews (1-2 stars)
    const negativeReviews = reviews.filter(r => r.stars <= 2);
    if (negativeReviews.length > 0) {
      // Customize name based on business type
      let clusterName = 'Dissatisfied Customers';
      let clusterDescription = 'Customers who had poor experiences';
      
      if (context?.businessType) {
        if (['cafe', 'restaurant'].includes(context.businessType.toLowerCase())) {
          clusterName = 'Dissatisfied Diners';
          clusterDescription = 'Diners who had poor dining experiences';
        } else if (context.businessType.toLowerCase() === 'bar') {
          clusterName = 'Dissatisfied Patrons';
          clusterDescription = 'Patrons who had negative experiences';
        } else if (context.businessType.toLowerCase().includes('gallery')) {
          clusterName = 'Disappointed Visitors';
          clusterDescription = 'Visitors who were disappointed with their experience';
        }
      }
      
      clusters.push({
        id: 'cluster-negative',
        name: clusterName,
        description: clusterDescription,
        reviewCount: negativeReviews.length,
        averageRating: negativeReviews.reduce((sum, r) => sum + r.stars, 0) / negativeReviews.length,
        sentiment: 'negative',
        keywords: this.extractKeywords(negativeReviews),
        examples: negativeReviews.slice(0, 3).map(r => r.text || ''),
        insights: [
          `${negativeReviews.length} customers (${(negativeReviews.length / reviews.length * 100).toFixed(1)}%) gave 1-2 star ratings`,
          `Main complaints: ${this.extractKeywords(negativeReviews).slice(0, 3).join(', ')}`
        ]
      });
    }
    
    return clusters;
  }
  
  private clusterByThemes(reviews: Review[], context?: BusinessContext | null): ReviewCluster[] {
    const clusters: ReviewCluster[] = [];
    const themeGroups: { [theme: string]: Review[] } = {};
    
    // Group reviews by main themes
    reviews.forEach(review => {
      if (review.mainThemes) {
        const themes = typeof review.mainThemes === 'string' 
          ? review.mainThemes.split(',').map(t => t.trim())
          : review.mainThemes;
        
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
        
        // Customize name based on business type
        let namePrefix = '';
        if (context?.businessType) {
          if (['cafe', 'restaurant'].includes(context.businessType.toLowerCase())) {
            namePrefix = avgRating >= 4 ? 'Popular ' : (avgRating <= 2 ? 'Concerning ' : '');
          } else if (context.businessType.toLowerCase() === 'bar') {
            namePrefix = avgRating >= 4 ? 'Praised ' : (avgRating <= 2 ? 'Criticized ' : '');
          } else if (context.businessType.toLowerCase().includes('gallery')) {
            namePrefix = avgRating >= 4 ? 'Admired ' : (avgRating <= 2 ? 'Critiqued ' : '');
          }
        }
        
        clusters.push({
          id: `cluster-theme-${theme.toLowerCase().replace(/\s+/g, '-')}`,
          name: `${namePrefix}${theme}`,
          description: `Reviews mentioning ${theme}`,
          reviewCount: themeReviews.length,
          averageRating: avgRating,
          sentiment: avgRating >= 4 ? 'positive' : avgRating <= 2 ? 'negative' : 'neutral',
          keywords: [theme, ...this.extractKeywords(themeReviews).filter(k => k !== theme)],
          examples: themeReviews.slice(0, 3).map(r => r.text || ''),
          insights: [
            `${themeReviews.length} reviews mention ${theme}`,
            `Average rating when ${theme} is mentioned: ${avgRating.toFixed(1)}`,
            `${((avgRating - reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length) * 100).toFixed(0)}% difference from overall average`
          ]
        });
      });
    
    return clusters;
  }
  
  private clusterBySpecialties(reviews: Review[], specialties: string[]): ReviewCluster[] {
    const clusters: ReviewCluster[] = [];
    
    specialties.forEach(specialty => {
      // Find reviews that mention this specialty
      const specialtyReviews = reviews.filter(review => 
        review.text && review.text.toLowerCase().includes(specialty.toLowerCase())
      );
      
      if (specialtyReviews.length >= 3) { // Only create clusters with at least 3 reviews
        const avgRating = specialtyReviews.reduce((sum, r) => sum + r.stars, 0) / specialtyReviews.length;
        
        clusters.push({
          id: `cluster-specialty-${specialty.toLowerCase().replace(/\s+/g, '-')}`,
          name: `${specialty} Specialty`,
          description: `Reviews mentioning your specialty: ${specialty}`,
          reviewCount: specialtyReviews.length,
          averageRating: avgRating,
          sentiment: avgRating >= 4 ? 'positive' : avgRating <= 2 ? 'negative' : 'neutral',
          keywords: this.extractKeywords(specialtyReviews),
          examples: specialtyReviews.slice(0, 3).map(r => r.text || ''),
          insights: [
            `${specialtyReviews.length} reviews mention your specialty: ${specialty}`,
            `Average rating for ${specialty}: ${avgRating.toFixed(1)}`
          ]
        });
      }
    });
    
    return clusters;
  }
  
  // Seasonal Analysis
  private analyzeSeasonalPatterns(reviews: Review[], context?: BusinessContext | null): SeasonalPattern[] {
    const patterns: SeasonalPattern[] = [];
    
    // Get adjusted seasons based on location if available
    const seasons = this.getAdjustedSeasons(context);
    const seasonGroups = this.groupBySeasons(reviews, seasons);
    
    Object.entries(seasonGroups).forEach(([season, seasonReviews]) => {
      if (seasonReviews.length < 10) return; // Skip seasons with too few reviews
      
      const avgRating = seasonReviews.reduce((sum, r) => sum + r.stars, 0) / seasonReviews.length;
      const sentiment = this.calculateSentiment(seasonReviews);
      const themes = this.extractKeywords(seasonReviews);
      
      // Compare with year average
      const yearAvgRating = reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length;
      
      patterns.push({
        season: season as SeasonalPattern['season'],
        name: this.getSeasonName(season, context),
        dateRange: seasons[season],
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
        recommendations: this.generateSeasonalRecommendations(season, avgRating, themes, context)
      });
    });
    
    return patterns;
  }
  
  private getAdjustedSeasons(context?: BusinessContext | null): { [season: string]: { start: string; end: string } } {
    // Default northern hemisphere seasons
    const defaultSeasons = {
      spring: { start: '03-01', end: '05-31' },
      summer: { start: '06-01', end: '08-31' },
      fall: { start: '09-01', end: '11-30' },
      winter: { start: '12-01', end: '02-28' }
    };
    
    // If we have location information, adjust seasons based on hemisphere
    if (context?.location?.country) {
      const southernHemisphereCountries = [
        'argentina', 'australia', 'bolivia', 'brazil', 'chile', 
        'new zealand', 'paraguay', 'peru', 'south africa', 'uruguay'
      ];
      
      const countryLower = context.location.country.toLowerCase();
      
      // Check if country is in southern hemisphere
      if (southernHemisphereCountries.some(country => countryLower.includes(country))) {
        // Swap seasons for southern hemisphere
        return {
          spring: { start: '09-01', end: '11-30' },
          summer: { start: '12-01', end: '02-28' },
          fall: { start: '03-01', end: '05-31' },
          winter: { start: '06-01', end: '08-31' }
        };
      }
    }
    
    return defaultSeasons;
  }
  
  private groupBySeasons(
    reviews: Review[], 
    seasons: { [season: string]: { start: string; end: string } }
  ): { [season: string]: Review[] } {
    const seasonGroups: { [season: string]: Review[] } = {
      spring: [],
      summer: [],
      fall: [],
      winter: []
    };
    
    reviews.forEach(review => {
      const date = new Date(review.publishedAtDate);
      const month = date.getMonth() + 1; // 1-12
      const day = date.getDate();
      const monthDay = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      // Determine which season this date falls into
      Object.entries(seasons).forEach(([season, dateRange]) => {
        const [startMonth, startDay] = dateRange.start.split('-').map(Number);
        const [endMonth, endDay] = dateRange.end.split('-').map(Number);
        
        // Special case for winter which spans year boundary
        if (season === 'winter' && startMonth > endMonth) {
          if ((month > startMonth || (month === startMonth && day >= startDay)) || 
              (month < endMonth || (month === endMonth && day <= endDay))) {
            seasonGroups[season].push(review);
          }
        } else {
          // Normal case for other seasons
          if ((month > startMonth || (month === startMonth && day >= startDay)) && 
              (month < endMonth || (month === endMonth && day <= endDay))) {
            seasonGroups[season].push(review);
          }
        }
      });
    });
    
    return seasonGroups;
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
      // Add null check for review.text before processing
      const text = review.text || '';
      if (!text) return; // Skip if text is null, undefined, or empty
      
      const words = text.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word && word.length > 3 && !this.isStopWord(word)) {
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
  
  private getSeasonName(season: string, context?: BusinessContext | null): string {
    // Default season names
    const names: { [key: string]: string } = {
      spring: 'Spring Season',
      summer: 'Summer Season',
      fall: 'Fall Season',
      winter: 'Winter Season'
    };
    
    // Customize based on business type if available
    if (context?.businessType) {
      const businessType = context.businessType.toLowerCase();
      
      if (['cafe', 'restaurant'].includes(businessType)) {
        if (season === 'summer') return 'Summer Dining Season';
        if (season === 'winter') return 'Winter Dining Season';
      } else if (businessType === 'bar') {
        if (season === 'summer') return 'Summer Nightlife Season';
        if (season === 'winter') return 'Winter Drinks Season';
      } else if (businessType.includes('gallery')) {
        if (season === 'summer') return 'Summer Exhibition Season';
        if (season === 'winter') return 'Winter Exhibition Season';
      }
    }
    
    return names[season] || season;
  }
  
  private generateSeasonalRecommendations(
    season: string, 
    avgRating: number, 
    themes: string[],
    context?: BusinessContext | null
  ): string[] {
    const recommendations: string[] = [];
    
    // Generic seasonal recommendations
    if (season === 'summer' && avgRating > 4) {
      recommendations.push('Capitalize on summer success with special events');
    } else if (season === 'winter' && avgRating < 3.5) {
      recommendations.push('Improve winter offerings to boost satisfaction');
    }
    
    // Business type specific recommendations
    if (context?.businessType) {
      const businessType = context.businessType.toLowerCase();
      
      if (['cafe', 'restaurant'].includes(businessType)) {
        if (season === 'summer') {
          recommendations.push('Consider introducing seasonal summer menu items');
          if (themes.some(t => t.includes('outdoor') || t.includes('patio'))) {
            recommendations.push('Enhance outdoor seating area for summer diners');
          }
        } else if (season === 'winter') {
          recommendations.push('Develop winter comfort food specials');
          recommendations.push('Create cozy winter atmosphere with lighting and decor');
        }
      } else if (businessType === 'bar') {
        if (season === 'summer') {
          recommendations.push('Develop signature summer cocktails');
          recommendations.push('Consider extended happy hours during summer evenings');
        } else if (season === 'winter') {
          recommendations.push('Create winter-themed drink menu');
          recommendations.push('Host winter events to attract customers during slower months');
        }
      } else if (businessType.includes('gallery')) {
        if (season === 'summer') {
          recommendations.push('Plan major exhibitions during peak summer months');
          recommendations.push('Consider extended summer hours for tourists');
        } else if (season === 'winter') {
          recommendations.push('Develop winter-themed exhibitions or events');
          recommendations.push('Create holiday gift promotions for art purchases');
        }
      }
    }
    
    // Add recommendations based on crowd themes
    if (themes.includes('crowd') || themes.includes('busy')) {
      recommendations.push('Implement reservation system for peak seasons');
    }
    
    // Add location-specific recommendations if available
    if (context?.location?.country && context?.location?.city) {
      const countryLower = context.location.country.toLowerCase();
      const cityLower = context.location.city.toLowerCase();
      
      // Add location-aware seasonal recommendations
      if (['us', 'usa', 'united states'].includes(countryLower)) {
        if (season === 'summer') {
          recommendations.push('Create special promotions around July 4th holiday');
        } else if (season === 'fall') {
          recommendations.push('Develop Thanksgiving-themed offerings in November');
        }
      } else if (['uk', 'united kingdom', 'england'].includes(countryLower)) {
        if (season === 'summer') {
          recommendations.push('Plan for bank holiday weekends with special promotions');
        } else if (season === 'winter') {
          recommendations.push('Develop Boxing Day and holiday season specials');
        }
      }
      
      // Add specific city recommendations for major tourism destinations
      const majorTouristCities = ['new york', 'london', 'paris', 'tokyo', 'rome', 'barcelona'];
      if (majorTouristCities.some(city => cityLower.includes(city))) {
        if (season === 'summer') {
          recommendations.push('Create targeted promotions for summer tourists');
        } else if (season === 'winter') {
          recommendations.push('Develop special offerings for winter holiday visitors');
        }
      }
    }
    
    return recommendations;
  }
  
  private generateInsights(
    temporalPatterns: TemporalPattern[],
    historicalTrends: HistoricalTrend[],
    reviewClusters: ReviewCluster[],
    seasonalPatterns: SeasonalPattern[],
    context?: BusinessContext | null
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
    
    // Add business-specific insights if context is available
    if (context) {
      // Add custom insights based on business type
      if (context.businessType) {
        const businessType = context.businessType.toLowerCase();
        
        if (['cafe', 'restaurant'].includes(businessType)) {
          if (reviewClusters.some(c => c.name.toLowerCase().includes('service') && c.sentiment === 'negative')) {
            risks.push('Service quality issues are impacting customer satisfaction');
          }
          if (reviewClusters.some(c => c.name.toLowerCase().includes('food') && c.sentiment === 'positive')) {
            opportunities.push('Food quality is a key strength - feature in marketing');
          }
        } else if (businessType === 'bar') {
          if (reviewClusters.some(c => c.name.toLowerCase().includes('drink') && c.sentiment === 'positive')) {
            opportunities.push('Drink quality is highly praised - consider signature drink promotions');
          }
          if (temporalPatterns.some(p => p.pattern === 'daily' && p.description.includes('evening'))) {
            keyFindings.push('Evening hours are your prime business time');
          }
        } else if (businessType.includes('gallery')) {
          if (reviewClusters.some(c => c.name.toLowerCase().includes('exhibit') && c.sentiment === 'positive')) {
            opportunities.push('Exhibition quality is a key strength - promote upcoming shows');
          }
          if (temporalPatterns.some(p => p.pattern === 'weekly' && p.description.includes('weekend'))) {
            keyFindings.push('Weekend visitors are your primary audience');
          }
        }
      }
      
      // Add price-tier specific insights
      if (context.priceRange) {
        if (context.priceRange === 'luxury' || context.priceRange === 'premium') {
          if (reviewClusters.some(c => c.keywords.some(k => k.includes('price') || k.includes('expensive')))) {
            risks.push('Price sensitivity noted in reviews - ensure value perception matches premium pricing');
          }
        }
      }
      
      // Add specialty-focused insights
      if (context.specialties && context.specialties.length > 0) {
        const mentionedSpecialties = context.specialties.filter(specialty => 
          reviewClusters.some(c => c.name.toLowerCase().includes(specialty.toLowerCase()))
        );
        
        if (mentionedSpecialties.length > 0) {
          keyFindings.push(`Your specialties (${mentionedSpecialties.join(', ')}) are frequently mentioned in reviews`);
        }
      }
    }
    
    return { keyFindings, opportunities, risks };
  }
}

// Export singleton instance
export const enhancedDataAnalysisService = new EnhancedDataAnalysisService();
