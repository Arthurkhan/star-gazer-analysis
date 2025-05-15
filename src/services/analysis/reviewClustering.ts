import { Review } from '@/types/reviews';

export interface ReviewCluster {
  id: string;
  name: string;
  description: string;
  reviews: Review[];
  commonThemes: string[];
  avgRating: number;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  size: number;
  insights: string[];
}

export interface ClusteringResult {
  clusters: ReviewCluster[];
  unclustered: Review[];
  summary: {
    totalClusters: number;
    largestCluster: string;
    mostPositiveCluster: string;
    mostNegativeCluster: string;
  };
}

export class ReviewClusteringService {
  
  // Main clustering method
  clusterReviews(reviews: Review[]): ClusteringResult {
    const clusters: ReviewCluster[] = [];
    const unclustered: Review[] = [];
    
    // Cluster by rating first
    const ratingClusters = this.clusterByRating(reviews);
    clusters.push(...ratingClusters);
    
    // Cluster by themes
    const themeClusters = this.clusterByThemes(reviews);
    clusters.push(...themeClusters);
    
    // Cluster by sentiment patterns
    const sentimentClusters = this.clusterBySentiment(reviews);
    clusters.push(...sentimentClusters);
    
    // Find reviews that don't fit well in any cluster
    const clusteredReviewIds = new Set(
      clusters.flatMap(c => c.reviews.map(r => r.reviewUrl))
    );
    
    reviews.forEach(review => {
      if (!clusteredReviewIds.has(review.reviewUrl)) {
        unclustered.push(review);
      }
    });
    
    // Generate summary
    const summary = this.generateClusteringSummary(clusters);
    
    return {
      clusters: this.rankClusters(clusters),
      unclustered,
      summary
    };
  }
  
  // Find similar reviews based on content
  findSimilarReviews(targetReview: Review, allReviews: Review[], limit: number = 5): Review[] {
    const similarities = allReviews
      .filter(r => r.reviewUrl !== targetReview.reviewUrl)
      .map(review => ({
        review,
        similarity: this.calculateSimilarity(targetReview, review)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    return similarities.map(s => s.review);
  }
  
  // Cluster by rating patterns
  private clusterByRating(reviews: Review[]): ReviewCluster[] {
    const ratingGroups: Record<number, Review[]> = {};
    
    reviews.forEach(review => {
      const rating = review.stars;
      if (!ratingGroups[rating]) ratingGroups[rating] = [];
      ratingGroups[rating].push(review);
    });
    
    return Object.entries(ratingGroups).map(([rating, groupReviews]) => {
      const ratingNum = parseInt(rating);
      const sentiment = ratingNum >= 4 ? 'positive' : ratingNum <= 2 ? 'negative' : 'neutral';
      
      return {
        id: `rating-${rating}`,
        name: `${rating} Star Reviews`,
        description: `Reviews with ${rating} star rating`,
        reviews: groupReviews,
        commonThemes: this.extractCommonThemes(groupReviews),
        avgRating: ratingNum,
        sentiment,
        size: groupReviews.length,
        insights: this.generateRatingInsights(ratingNum, groupReviews)
      };
    });
  }
  
  // Cluster by common themes
  private clusterByThemes(reviews: Review[]): ReviewCluster[] {
    const themeGroups: Record<string, Review[]> = {};
    
    reviews.forEach(review => {
      if (review.mainThemes) {
        const themes = review.mainThemes.split(',').map(t => t.trim());
        themes.forEach(theme => {
          if (!themeGroups[theme]) themeGroups[theme] = [];
          themeGroups[theme].push(review);
        });
      }
    });
    
    // Only create clusters for themes with multiple reviews
    return Object.entries(themeGroups)
      .filter(([_, reviews]) => reviews.length >= 3)
      .map(([theme, themeReviews]) => {
        const avgRating = themeReviews.reduce((sum, r) => sum + r.stars, 0) / themeReviews.length;
        
        return {
          id: `theme-${theme}`,
          name: `${theme} Theme`,
          description: `Reviews mentioning ${theme}`,
          reviews: themeReviews,
          commonThemes: [theme, ...this.extractCommonThemes(themeReviews)].slice(0, 5),
          avgRating,
          sentiment: this.calculateOverallSentiment(themeReviews),
          size: themeReviews.length,
          insights: this.generateThemeInsights(theme, themeReviews)
        };
      });
  }
  
  // Cluster by sentiment patterns
  private clusterBySentiment(reviews: Review[]): ReviewCluster[] {
    const sentimentGroups: Record<string, Review[]> = {
      positive: [],
      negative: [],
      neutral: [],
      mixed: []
    };
    
    reviews.forEach(review => {
      const sentiment = review.sentiment || 'neutral';
      if (!sentimentGroups[sentiment]) sentimentGroups[sentiment] = [];
      sentimentGroups[sentiment].push(review);
    });
    
    return Object.entries(sentimentGroups)
      .filter(([_, reviews]) => reviews.length > 0)
      .map(([sentiment, sentimentReviews]) => {
        const avgRating = sentimentReviews.reduce((sum, r) => sum + r.stars, 0) / sentimentReviews.length;
        
        return {
          id: `sentiment-${sentiment}`,
          name: `${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)} Sentiment`,
          description: `Reviews with ${sentiment} sentiment`,
          reviews: sentimentReviews,
          commonThemes: this.extractCommonThemes(sentimentReviews),
          avgRating,
          sentiment: sentiment as any,
          size: sentimentReviews.length,
          insights: this.generateSentimentInsights(sentiment, sentimentReviews)
        };
      });
  }
  
  // Extract common themes from reviews
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
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme]) => theme);
  }
  
  // Calculate similarity between two reviews
  private calculateSimilarity(review1: Review, review2: Review): number {
    let similarity = 0;
    
    // Rating similarity (0-1)
    similarity += (1 - Math.abs(review1.stars - review2.stars) / 4) * 0.3;
    
    // Sentiment similarity (0-1)
    if (review1.sentiment === review2.sentiment) similarity += 0.2;
    
    // Theme similarity (0-1)
    const themes1 = new Set(review1.mainThemes?.split(',').map(t => t.trim()) || []);
    const themes2 = new Set(review2.mainThemes?.split(',').map(t => t.trim()) || []);
    const commonThemes = [...themes1].filter(t => themes2.has(t));
    const totalThemes = themes1.size + themes2.size - commonThemes.length;
    if (totalThemes > 0) {
      similarity += (commonThemes.length / totalThemes) * 0.3;
    }
    
    // Text similarity (simplified)
    const words1 = new Set(review1.text.toLowerCase().split(/\s+/));
    const words2 = new Set(review2.text.toLowerCase().split(/\s+/));
    const commonWords = [...words1].filter(w => words2.has(w));
    const totalWords = words1.size + words2.size - commonWords.length;
    if (totalWords > 0) {
      similarity += (commonWords.length / totalWords) * 0.2;
    }
    
    return similarity;
  }
  
  // Calculate overall sentiment for a group of reviews
  private calculateOverallSentiment(reviews: Review[]): 'positive' | 'negative' | 'neutral' | 'mixed' {
    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    
    reviews.forEach(review => {
      const sentiment = review.sentiment || 'neutral';
      sentimentCounts[sentiment as keyof typeof sentimentCounts]++;
    });
    
    const total = reviews.length;
    if (sentimentCounts.positive > total * 0.6) return 'positive';
    if (sentimentCounts.negative > total * 0.6) return 'negative';
    if (sentimentCounts.neutral > total * 0.6) return 'neutral';
    return 'mixed';
  }
  
  // Generate insights for rating clusters
  private generateRatingInsights(rating: number, reviews: Review[]): string[] {
    const insights: string[] = [];
    
    insights.push(`${reviews.length} reviews with ${rating} stars`);
    
    if (rating >= 4) {
      insights.push('High satisfaction group');
      const themes = this.extractCommonThemes(reviews);
      if (themes.length > 0) {
        insights.push(`Key strengths: ${themes.slice(0, 3).join(', ')}`);
      }
    } else if (rating <= 2) {
      insights.push('Dissatisfied customer group');
      const themes = this.extractCommonThemes(reviews);
      if (themes.length > 0) {
        insights.push(`Main issues: ${themes.slice(0, 3).join(', ')}`);
      }
    }
    
    return insights;
  }
  
  // Generate insights for theme clusters
  private generateThemeInsights(theme: string, reviews: Review[]): string[] {
    const insights: string[] = [];
    const avgRating = reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length;
    
    insights.push(`"${theme}" mentioned in ${reviews.length} reviews`);
    insights.push(`Average rating when ${theme} is mentioned: ${avgRating.toFixed(1)}`);
    
    if (avgRating >= 4) {
      insights.push(`${theme} is a strong positive factor`);
    } else if (avgRating <= 3) {
      insights.push(`${theme} needs improvement`);
    }
    
    return insights;
  }
  
  // Generate insights for sentiment clusters
  private generateSentimentInsights(sentiment: string, reviews: Review[]): string[] {
    const insights: string[] = [];
    const avgRating = reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length;
    
    insights.push(`${reviews.length} reviews with ${sentiment} sentiment`);
    insights.push(`Average rating: ${avgRating.toFixed(1)} stars`);
    
    const themes = this.extractCommonThemes(reviews);
    if (themes.length > 0) {
      insights.push(`Common themes: ${themes.slice(0, 3).join(', ')}`);
    }
    
    return insights;
  }
  
  // Rank clusters by importance
  private rankClusters(clusters: ReviewCluster[]): ReviewCluster[] {
    return clusters.sort((a, b) => {
      // First by size
      if (b.size !== a.size) return b.size - a.size;
      
      // Then by average rating deviation from 3 (neutral)
      const aDeviation = Math.abs(a.avgRating - 3);
      const bDeviation = Math.abs(b.avgRating - 3);
      return bDeviation - aDeviation;
    });
  }
  
  // Generate clustering summary
  private generateClusteringSummary(clusters: ReviewCluster[]): ClusteringResult['summary'] {
    const largestCluster = clusters.reduce((largest, current) => 
      current.size > largest.size ? current : largest
    );
    
    const mostPositiveCluster = clusters.reduce((most, current) => 
      current.avgRating > most.avgRating ? current : most
    );
    
    const mostNegativeCluster = clusters.reduce((most, current) => 
      current.avgRating < most.avgRating ? current : most
    );
    
    return {
      totalClusters: clusters.length,
      largestCluster: largestCluster.name,
      mostPositiveCluster: mostPositiveCluster.name,
      mostNegativeCluster: mostNegativeCluster.name
    };
  }
}
