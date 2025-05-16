import { EnhancedAnalysis, ReviewCluster, HistoricalTrend } from '@/types/dataAnalysis';

export interface ComparisonResult {
  ratingChange: number;
  reviewCountChange: number;
  reviewCountChangePercent: number;
  sentimentChange: number;
  improvingThemes: string[];
  decliningThemes: string[];
  newThemes: string[];
  removedThemes: string[];
  staffPerformanceChanges: Record<string, number>;
}

/**
 * Compare data between two periods and calculate changes
 */
export function compareDataPeriods(current: EnhancedAnalysis, previous: EnhancedAnalysis): ComparisonResult {
  // Calculate basic metric changes
  const currentRating = extractAverageRating(current);
  const previousRating = extractAverageRating(previous);
  const ratingChange = currentRating - previousRating;
  
  const currentReviewCount = calculateTotalReviewCount(current.reviewClusters);
  const previousReviewCount = calculateTotalReviewCount(previous.reviewClusters);
  const reviewCountChange = currentReviewCount - previousReviewCount;
  const reviewCountChangePercent = previousReviewCount > 0 
    ? (reviewCountChange / previousReviewCount) * 100 
    : 0;
  
  const currentSentiment = extractAverageSentiment(current);
  const previousSentiment = extractAverageSentiment(previous);
  const sentimentChange = currentSentiment - previousSentiment;
  
  // Extract themes from both periods
  const currentThemes = extractThemes(current);
  const previousThemes = extractThemes(previous);
  
  // Identify new and removed themes
  const currentThemesSet = new Set(currentThemes.map(t => t.name));
  const previousThemesSet = new Set(previousThemes.map(t => t.name));
  
  const newThemes = currentThemes
    .filter(t => !previousThemesSet.has(t.name))
    .map(t => t.name);
  
  const removedThemes = previousThemes
    .filter(t => !currentThemesSet.has(t.name))
    .map(t => t.name);
  
  // Find themes that exist in both periods and compare their sentiment
  const improvingThemes: string[] = [];
  const decliningThemes: string[] = [];
  
  currentThemes.forEach(currentTheme => {
    const previousTheme = previousThemes.find(t => t.name === currentTheme.name);
    if (previousTheme) {
      if (currentTheme.sentiment > previousTheme.sentiment + 0.1) {
        improvingThemes.push(currentTheme.name);
      } else if (currentTheme.sentiment < previousTheme.sentiment - 0.1) {
        decliningThemes.push(currentTheme.name);
      }
    }
  });
  
  // Compare staff performance
  const staffPerformanceChanges: Record<string, number> = {};
  
  const currentStaff = extractStaffMentions(current);
  const previousStaff = extractStaffMentions(previous);
  
  // Combine all staff members from both periods
  const allStaffMembers = new Set([
    ...Object.keys(currentStaff), 
    ...Object.keys(previousStaff)
  ]);
  
  // Calculate changes for each staff member
  allStaffMembers.forEach(staffName => {
    const currentScore = currentStaff[staffName] || 0;
    const previousScore = previousStaff[staffName] || 0;
    staffPerformanceChanges[staffName] = currentScore - previousScore;
  });
  
  return {
    ratingChange,
    reviewCountChange,
    reviewCountChangePercent,
    sentimentChange,
    improvingThemes,
    decliningThemes,
    newThemes,
    removedThemes,
    staffPerformanceChanges
  };
}

/**
 * Extract average rating from analysis data
 */
function extractAverageRating(data: EnhancedAnalysis): number {
  // Try to get the rating from historical trends
  const ratingTrend = data.historicalTrends.find(
    trend => trend.metric.toLowerCase().includes('rating')
  );
  
  if (ratingTrend && ratingTrend.data.length > 0) {
    return ratingTrend.data[ratingTrend.data.length - 1].value;
  }
  
  // Fallback to calculating from review clusters
  return calculateAverageFromClusters(data.reviewClusters);
}

/**
 * Calculate average sentiment from analysis data
 */
function extractAverageSentiment(data: EnhancedAnalysis): number {
  // Try to get the sentiment from historical trends
  const sentimentTrend = data.historicalTrends.find(
    trend => trend.metric.toLowerCase().includes('sentiment')
  );
  
  if (sentimentTrend && sentimentTrend.data.length > 0) {
    return sentimentTrend.data[sentimentTrend.data.length - 1].value;
  }
  
  // Fallback to estimating from review clusters
  const clusters = data.reviewClusters;
  let totalWeightedSentiment = 0;
  let totalReviews = 0;
  
  for (const cluster of clusters) {
    const sentimentValue = mapSentimentToNumber(cluster.sentiment);
    totalWeightedSentiment += sentimentValue * cluster.reviewCount;
    totalReviews += cluster.reviewCount;
  }
  
  return totalReviews > 0 ? totalWeightedSentiment / totalReviews : 0;
}

/**
 * Map sentiment text to numerical value
 */
function mapSentimentToNumber(sentiment: string): number {
  switch (sentiment) {
    case 'positive': return 1;
    case 'neutral': return 0;
    case 'negative': return -1;
    case 'mixed': return 0;
    default: return 0;
  }
}

/**
 * Calculate average rating from review clusters
 */
function calculateAverageFromClusters(clusters: ReviewCluster[]): number {
  let totalWeightedRating = 0;
  let totalReviews = 0;
  
  for (const cluster of clusters) {
    totalWeightedRating += cluster.averageRating * cluster.reviewCount;
    totalReviews += cluster.reviewCount;
  }
  
  return totalReviews > 0 ? totalWeightedRating / totalReviews : 0;
}

/**
 * Calculate total number of reviews from clusters
 */
function calculateTotalReviewCount(clusters: ReviewCluster[]): number {
  return clusters.reduce((sum, cluster) => sum + cluster.reviewCount, 0);
}

/**
 * Extract theme information from analysis data
 */
function extractThemes(data: EnhancedAnalysis): Array<{ name: string; sentiment: number }> {
  // For this example, we'll extract themes from clusters and their keywords
  const themes: Array<{ name: string; sentiment: number }> = [];
  
  // Extract from clusters
  data.reviewClusters.forEach(cluster => {
    const sentimentValue = mapSentimentToNumber(cluster.sentiment);
    
    cluster.keywords.forEach(keyword => {
      // Avoid very short keywords
      if (keyword.length < 3) return;
      
      themes.push({
        name: keyword,
        sentiment: sentimentValue
      });
    });
  });
  
  // Combine duplicate themes by averaging sentiment
  const themeMap = new Map<string, { sentiment: number; count: number }>();
  
  themes.forEach(theme => {
    const existing = themeMap.get(theme.name);
    if (existing) {
      existing.sentiment += theme.sentiment;
      existing.count += 1;
    } else {
      themeMap.set(theme.name, { sentiment: theme.sentiment, count: 1 });
    }
  });
  
  // Convert back to array with averaged sentiment
  return Array.from(themeMap.entries()).map(([name, data]) => ({
    name,
    sentiment: data.sentiment / data.count
  }));
}

/**
 * Extract staff mentions and their sentiment from analysis data
 */
function extractStaffMentions(data: EnhancedAnalysis): Record<string, number> {
  const staffMentions: Record<string, number> = {};
  
  // This is just a placeholder - in a real implementation, you would extract
  // this from your analysis data structure
  
  // Example extraction (assuming data has a staffMentions property)
  if ((data as any).staffMentions) {
    (data as any).staffMentions.forEach((staff: any) => {
      staffMentions[staff.name] = staff.sentiment;
    });
  }
  
  // Simulate some staff data for the demo if not available
  if (Object.keys(staffMentions).length === 0) {
    const possibleStaff = ['John', 'Sarah', 'Elena', 'Marcus', 'Zoe'];
    const staffInClusters = new Set<string>();
    
    // Extract staff names from review clusters
    data.reviewClusters.forEach(cluster => {
      cluster.keywords.forEach(keyword => {
        if (possibleStaff.includes(keyword)) {
          staffInClusters.add(keyword);
        }
      });
    });
    
    // Assign random sentiment scores to staff
    staffInClusters.forEach(staffName => {
      // Get the most frequent cluster sentiment for this staff
      const relevantClusters = data.reviewClusters.filter(
        c => c.keywords.includes(staffName)
      );
      
      if (relevantClusters.length > 0) {
        // Calculate an average sentiment based on cluster sentiment
        const avgSentiment = relevantClusters.reduce((sum, c) => {
          return sum + mapSentimentToNumber(c.sentiment);
        }, 0) / relevantClusters.length;
        
        staffMentions[staffName] = avgSentiment;
      }
    });
  }
  
  return staffMentions;
}
