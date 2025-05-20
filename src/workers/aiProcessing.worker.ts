/* eslint-disable no-restricted-globals */
// This is a Web Worker file for AI processing

// Define types for our messages
type WorkerMessage = {
  type: 'analyze';
  data: any;
};

// Handle messages from the main thread
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  if (!event.data) return;
  
  const { type, data } = event.data;
  
  switch (type) {
    case 'analyze':
      try {
        // Start the analysis
        console.log('[AI Worker] Starting analysis of review data');
        const result = analyzeReviews(data);
        
        // Send the results back to the main thread
        self.postMessage({
          type: 'result',
          data: result
        });
      } catch (error) {
        console.error('[AI Worker] Error during analysis:', error);
        self.postMessage({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error during analysis'
        });
      }
      break;
      
    default:
      console.warn(`[AI Worker] Unknown message type: ${type}`);
  }
});

// Analysis function that would contain the AI logic
function analyzeReviews(reviews: any[]) {
  console.log(`[AI Worker] Analyzing ${reviews.length} reviews`);
  
  // Calculate sentiment distribution
  const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
  reviews.forEach(review => {
    if (!review.sentiment) return;
    
    const sentiment = review.sentiment.toLowerCase();
    if (sentiment.includes('positive')) {
      sentimentCounts.positive++;
    } else if (sentiment.includes('negative')) {
      sentimentCounts.negative++;
    } else {
      sentimentCounts.neutral++;
    }
  });
  
  // Extract themes
  const themesMap = new Map<string, number>();
  reviews.forEach(review => {
    if (!review.mainThemes) return;
    
    const themes = review.mainThemes.split(',').map((t: string) => t.trim());
    themes.forEach((theme: string) => {
      if (!theme) return;
      themesMap.set(theme, (themesMap.get(theme) || 0) + 1);
    });
  });
  
  // Convert to array and sort by frequency
  const sortedThemes = Array.from(themesMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([text, count]) => ({ text, count }));
  
  // Extract staff mentions
  const staffMap = new Map<string, { count: number, sentiment: string }>();
  reviews.forEach(review => {
    if (!review.staffMentioned) return;
    
    const staffNames = review.staffMentioned.split(',').map((s: string) => s.trim());
    staffNames.forEach((name: string) => {
      if (!name) return;
      
      const currentData = staffMap.get(name) || { count: 0, sentiment: 'neutral' };
      
      // Update the data
      currentData.count++;
      
      // Update sentiment (negative takes priority)
      if (review.sentiment) {
        const sentiment = review.sentiment.toLowerCase();
        if (sentiment.includes('negative')) {
          currentData.sentiment = 'negative';
        } else if (sentiment.includes('positive') && currentData.sentiment !== 'negative') {
          currentData.sentiment = 'positive';
        }
      }
      
      staffMap.set(name, currentData);
    });
  });
  
  // Convert to array and sort by frequency
  const staffMentions = Array.from(staffMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .map(([name, data]) => ({
      name,
      count: data.count,
      sentiment: data.sentiment
    }));
  
  // Calculate average rating
  const totalStars = reviews.reduce((sum, review) => sum + (review.stars || 0), 0);
  const avgRating = reviews.length > 0 ? totalStars / reviews.length : 0;
  
  // Rating breakdown
  const ratingBreakdown = [1, 2, 3, 4, 5].map(rating => {
    const count = reviews.filter(r => r.stars === rating).length;
    return {
      rating,
      count,
      percentage: reviews.length > 0 ? (count / reviews.length) * 100 : 0
    };
  });
  
  // Return the analysis results
  return {
    sentimentAnalysis: [
      { name: 'Positive', value: sentimentCounts.positive },
      { name: 'Neutral', value: sentimentCounts.neutral },
      { name: 'Negative', value: sentimentCounts.negative }
    ],
    themes: sortedThemes.slice(0, 20), // Top 20 themes
    staffMentions,
    metrics: {
      totalReviews: reviews.length,
      avgRating,
      responseRate: reviews.filter(r => r.responseFromOwnerText).length / reviews.length
    },
    ratingBreakdown
  };
}

// Let the main thread know the worker is ready
self.postMessage({ type: 'ready' });

export {}; // This is needed to make TypeScript treat this file as a module
