import { type Review } from '@/types/reviews';

// Define the response type for enhanced data analysis
export interface EnhancedAnalysisResult {
  temporalPatterns: {
    dayOfWeek: { day: string; count: number }[];
    timeOfDay: { time: string; count: number }[];
  };
  historicalTrends: {
    period: string;
    avgRating: number;
    reviewCount: number;
  }[];
  reviewClusters: {
    name: string;
    keywords: string[];
    count: number;
    sentiment: string;
  }[];
  seasonalAnalysis: {
    season: string;
    count: number;
    avgRating: number;
  }[];
  insights: string[];
}

class EnhancedDataAnalysisService {
  async analyzeData(reviews: any[], businessName: string): Promise<EnhancedAnalysisResult> {
    // Default response with empty structures in case of no data
    const defaultResponse: EnhancedAnalysisResult = {
      temporalPatterns: {
        dayOfWeek: [],
        timeOfDay: [],
      },
      historicalTrends: [],
      reviewClusters: [],
      seasonalAnalysis: [],
      insights: [],
    };

    // Check if we have reviews to analyze
    if (!reviews || reviews.length === 0) {
      return defaultResponse;
    }

    try {
      // Analyze day of week patterns
      const dayOfWeekCounts = this.analyzeDayOfWeek(reviews);
      
      // Analyze time of day patterns
      const timeOfDayCounts = this.analyzeTimeOfDay(reviews);
      
      // Analyze historical trends (by month)
      const historicalTrends = this.analyzeHistoricalTrends(reviews);
      
      // Cluster reviews by common themes
      const reviewClusters = this.clusterReviews(reviews);
      
      // Seasonal analysis
      const seasonalAnalysis = this.analyzeSeasonalPatterns(reviews);
      
      // Generate insights based on the analysis
      const insights = this.generateInsights(
        reviews, 
        businessName, 
        dayOfWeekCounts, 
        timeOfDayCounts,
        historicalTrends,
        reviewClusters,
        seasonalAnalysis
      );
      
      return {
        temporalPatterns: {
          dayOfWeek: dayOfWeekCounts,
          timeOfDay: timeOfDayCounts,
        },
        historicalTrends,
        reviewClusters,
        seasonalAnalysis,
        insights,
      };
    } catch (error) {
      console.error('Error in enhanced data analysis:', error);
      return defaultResponse;
    }
  }

  // Helper methods for analysis

  private analyzeDayOfWeek(reviews: any[]): { day: string; count: number }[] {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const counts = days.map(day => ({ day, count: 0 }));
    
    reviews.forEach(review => {
      if (review.publishedAtDate) {
        try {
          const date = new Date(review.publishedAtDate);
          const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
          counts[dayOfWeek].count += 1;
        } catch (e) {
          // Skip invalid dates
        }
      }
    });
    
    return counts;
  }

  private analyzeTimeOfDay(reviews: any[]): { time: string; count: number }[] {
    const timeSlots = [
      { time: 'Morning (6AM-12PM)', count: 0 },
      { time: 'Afternoon (12PM-5PM)', count: 0 },
      { time: 'Evening (5PM-10PM)', count: 0 },
      { time: 'Night (10PM-6AM)', count: 0 },
    ];
    
    reviews.forEach(review => {
      if (review.publishedAtDate) {
        try {
          const date = new Date(review.publishedAtDate);
          const hour = date.getHours();
          
          if (hour >= 6 && hour < 12) {
            timeSlots[0].count += 1;
          } else if (hour >= 12 && hour < 17) {
            timeSlots[1].count += 1;
          } else if (hour >= 17 && hour < 22) {
            timeSlots[2].count += 1;
          } else {
            timeSlots[3].count += 1;
          }
        } catch (e) {
          // Skip invalid dates
        }
      }
    });
    
    return timeSlots;
  }

  private analyzeHistoricalTrends(reviews: any[]): { period: string; avgRating: number; reviewCount: number }[] {
    const periods: Record<string, { totalRating: number; count: number }> = {};
    
    // Group reviews by month
    reviews.forEach(review => {
      if (review.publishedAtDate && review.stars) {
        try {
          const date = new Date(review.publishedAtDate);
          const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!periods[period]) {
            periods[period] = { totalRating: 0, count: 0 };
          }
          
          periods[period].totalRating += review.stars;
          periods[period].count += 1;
        } catch (e) {
          // Skip invalid dates
        }
      }
    });
    
    // Convert to array and calculate averages
    const trends = Object.entries(periods).map(([period, data]) => ({
      period,
      avgRating: data.count > 0 ? data.totalRating / data.count : 0,
      reviewCount: data.count,
    }));
    
    // Sort by date
    return trends.sort((a, b) => a.period.localeCompare(b.period));
  }

  private clusterReviews(reviews: any[]): { name: string; keywords: string[]; count: number; sentiment: string }[] {
    // Simple clustering based on existing themes from reviews
    const clusters: Record<string, { keywords: string[]; count: number; sentiment: string; positiveCount: number; negativeCount: number }> = {};
    
    reviews.forEach(review => {
      if (review.mainThemes && typeof review.mainThemes === 'string') {
        const themes = review.mainThemes.split(',').map((theme: string) => theme.trim());
        
        themes.forEach(theme => {
          if (!theme) return;
          
          if (!clusters[theme]) {
            clusters[theme] = { 
              keywords: [], 
              count: 0, 
              sentiment: 'neutral',
              positiveCount: 0,
              negativeCount: 0
            };
          }
          
          clusters[theme].count += 1;
          
          // Track sentiment
          if (review.sentiment === 'positive') {
            clusters[theme].positiveCount += 1;
          } else if (review.sentiment === 'negative') {
            clusters[theme].negativeCount += 1;
          }
          
          // Extract potential keywords from review text
          if (review.text) {
            const words = review.text
              .toLowerCase()
              .split(/\\s+/)
              .filter((word: string) => word.length > 4 && !clusters[theme].keywords.includes(word));
            
            // Add up to 3 keywords per review
            clusters[theme].keywords.push(...words.slice(0, 3));
          }
        });
      }
    });
    
    // Calculate dominant sentiment for each cluster
    Object.values(clusters).forEach(cluster => {
      if (cluster.positiveCount > cluster.negativeCount) {
        cluster.sentiment = 'positive';
      } else if (cluster.negativeCount > cluster.positiveCount) {
        cluster.sentiment = 'negative';
      } else {
        cluster.sentiment = 'neutral';
      }
    });
    
    // Convert to array and sort by count
    return Object.entries(clusters)
      .map(([name, data]) => ({
        name,
        keywords: Array.from(new Set(data.keywords)).slice(0, 5), // Limit to 5 unique keywords
        count: data.count,
        sentiment: data.sentiment,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Return top 5 clusters
  }

  private analyzeSeasonalPatterns(reviews: any[]): { season: string; count: number; avgRating: number }[] {
    const seasons = [
      { season: 'Winter', count: 0, totalRating: 0 },
      { season: 'Spring', count: 0, totalRating: 0 },
      { season: 'Summer', count: 0, totalRating: 0 },
      { season: 'Fall', count: 0, totalRating: 0 },
    ];
    
    reviews.forEach(review => {
      if (review.publishedAtDate && review.stars) {
        try {
          const date = new Date(review.publishedAtDate);
          const month = date.getMonth();
          
          // Determine season
          let seasonIndex;
          if (month >= 0 && month <= 2) {
            seasonIndex = 0; // Winter
          } else if (month >= 3 && month <= 5) {
            seasonIndex = 1; // Spring
          } else if (month >= 6 && month <= 8) {
            seasonIndex = 2; // Summer
          } else {
            seasonIndex = 3; // Fall
          }
          
          seasons[seasonIndex].count += 1;
          seasons[seasonIndex].totalRating += review.stars;
        } catch (e) {
          // Skip invalid dates
        }
      }
    });
    
    // Calculate average ratings
    return seasons.map(season => ({
      season: season.season,
      count: season.count,
      avgRating: season.count > 0 ? season.totalRating / season.count : 0,
    }));
  }

  private generateInsights(
    reviews: any[],
    businessName: string,
    dayOfWeekCounts: { day: string; count: number }[],
    timeOfDayCounts: { time: string; count: number }[],
    historicalTrends: { period: string; avgRating: number; reviewCount: number }[],
    reviewClusters: { name: string; keywords: string[]; count: number; sentiment: string }[],
    seasonalAnalysis: { season: string; count: number; avgRating: number }[]
  ): string[] {
    const insights: string[] = [];
    
    // Add at least 3-4 meaningful insights based on the analysis
    
    // Busiest day insight
    const busiestDay = [...dayOfWeekCounts].sort((a, b) => b.count - a.count)[0];
    if (busiestDay && busiestDay.count > 0) {
      insights.push(`${busiestDay.day} is the most active day for reviews, suggesting high customer engagement on this day.`);
    }
    
    // Busiest time insight
    const busiestTime = [...timeOfDayCounts].sort((a, b) => b.count - a.count)[0];
    if (busiestTime && busiestTime.count > 0) {
      insights.push(`Most reviews are submitted during ${busiestTime.time}, indicating peak customer activity during this timeframe.`);
    }
    
    // Rating trend insight
    if (historicalTrends.length >= 2) {
      const latestPeriod = historicalTrends[historicalTrends.length - 1];
      const previousPeriod = historicalTrends[historicalTrends.length - 2];
      
      if (latestPeriod && previousPeriod) {
        const ratingDiff = latestPeriod.avgRating - previousPeriod.avgRating;
        
        if (Math.abs(ratingDiff) >= 0.2) {
          insights.push(
            ratingDiff > 0
              ? `Average rating has improved by ${ratingDiff.toFixed(1)} stars in the most recent period, showing positive momentum.`
              : `Average rating has decreased by ${Math.abs(ratingDiff).toFixed(1)} stars recently, suggesting potential areas for improvement.`
          );
        }
      }
    }
    
    // Top theme insight
    if (reviewClusters.length > 0) {
      const topCluster = reviewClusters[0];
      insights.push(
        topCluster.sentiment === 'positive'
          ? `"${topCluster.name}" is mentioned positively in ${topCluster.count} reviews, representing a key strength.`
          : topCluster.sentiment === 'negative'
          ? `"${topCluster.name}" appears in ${topCluster.count} reviews with negative sentiment, suggesting an area for improvement.`
          : `"${topCluster.name}" is a frequent topic in reviews, mentioned ${topCluster.count} times.`
      );
    }
    
    // Seasonal pattern insight
    const bestSeason = [...seasonalAnalysis].sort((a, b) => b.avgRating - a.avgRating)[0];
    if (bestSeason && bestSeason.count > 0) {
      insights.push(`${businessName} receives the highest ratings during ${bestSeason.season} (${bestSeason.avgRating.toFixed(1)} stars), which could inform seasonal strategy planning.`);
    }
    
    return insights;
  }
}

export const enhancedDataAnalysisService = new EnhancedDataAnalysisService();
