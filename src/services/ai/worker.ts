/* eslint-disable no-restricted-globals */
// This is the central worker file that handles all AI processing tasks

// Define types for our messages
type WorkerMessage = {
  task: string;
  data: any;
};

// Handle messages from the main thread
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  if (!event.data) return;
  
  const { task, data } = event.data;
  
  console.log(`[AI Worker] Received task: ${task}`);
  
  try {
    let result;
    
    switch (task) {
      case 'analyze':
        // Analysis task - extract insights from reviews
        result = analyzeReviews(data);
        break;
        
      case 'generateSimpleRecommendations':
        // Generate recommendations using the analysis data
        result = generateRecommendations(data);
        break;
        
      default:
        throw new Error(`Unknown task: ${task}`);
    }
    
    // Send the results back to the main thread
    self.postMessage({
      task,
      result,
      success: true
    });
  } catch (error) {
    console.error(`[AI Worker] Error executing task "${task}":`, error);
    
    // Send error back to main thread
    self.postMessage({
      task,
      error: error instanceof Error ? error.message : 'Unknown error in worker',
      success: false
    });
  }
});

// Analyze reviews and extract insights
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

// Generate recommendations based on the analysis
function generateRecommendations(data: any) {
  const { businessName, businessType, analysis } = data;
  
  console.log(`[AI Worker] Generating recommendations for ${businessName} (${businessType})`);
  
  // Simple metric to determine if urgent action is needed
  const needsUrgentAction = 
    analysis?.sentimentAnalysis?.find(s => s.name === 'Negative')?.value > 
    analysis?.sentimentAnalysis?.find(s => s.name === 'Positive')?.value;
  
  // Generate custom recommendations based on business type
  let recommendations: any = {
    urgentActions: [],
    growthStrategies: [],
    customerAttractionPlan: {
      title: 'Customer Attraction Plan',
      description: 'Strategies to attract and retain customers',
      strategies: []
    },
    competitivePositioning: {
      title: 'Competitive Positioning',
      description: 'Analysis of market position',
      strengths: [],
      opportunities: [],
      recommendations: []
    },
    futureProjections: {
      shortTerm: [],
      longTerm: []
    }
  };
  
  // Add some generic recommendations
  if (needsUrgentAction) {
    recommendations.urgentActions.push({
      title: 'Address Negative Reviews',
      description: 'Multiple customers have reported negative experiences. Immediate action is recommended.',
      impact: 'High',
      effort: 'Medium'
    });
  }
  
  // Add growth strategies based on business type
  switch (businessType) {
    case 'CAFE':
      recommendations.growthStrategies.push(
        {
          title: 'Expand Breakfast Menu',
          description: 'Consider adding more breakfast options based on customer preferences.',
          impact: 'Medium',
          effort: 'Low'
        },
        {
          title: 'Launch Loyalty Program',
          description: 'Implement a digital loyalty program to increase customer retention.',
          impact: 'High',
          effort: 'Medium'
        }
      );
      break;
      
    case 'BAR':
      recommendations.growthStrategies.push(
        {
          title: 'Signature Cocktail Series',
          description: 'Develop a series of signature cocktails to differentiate from competitors.',
          impact: 'Medium',
          effort: 'Low'
        },
        {
          title: 'Themed Nights',
          description: 'Implement themed nights to attract different customer segments.',
          impact: 'Medium',
          effort: 'Medium'
        }
      );
      break;
      
    case 'GALLERY':
      recommendations.growthStrategies.push(
        {
          title: 'Digital Exhibition',
          description: 'Create a virtual gallery experience to reach a wider audience.',
          impact: 'High',
          effort: 'High'
        },
        {
          title: 'Artist Workshops',
          description: 'Host workshops led by featured artists to increase engagement.',
          impact: 'Medium',
          effort: 'Medium'
        }
      );
      break;
      
    default:
      recommendations.growthStrategies.push(
        {
          title: 'Customer Feedback Campaign',
          description: 'Launch a structured feedback campaign to identify improvement areas.',
          impact: 'Medium',
          effort: 'Low'
        },
        {
          title: 'Online Presence Enhancement',
          description: 'Improve social media and online listings with updated information.',
          impact: 'Medium',
          effort: 'Medium'
        }
      );
  }
  
  // Add marketing strategies
  recommendations.customerAttractionPlan.strategies.push(
    {
      title: 'Social Media Campaign',
      description: 'Launch targeted social media advertisements to attract new customers.',
      timeline: '1-2 months',
      cost: 'Low',
      expectedOutcome: 'Increased brand awareness and new customer acquisition'
    },
    {
      title: 'Referral Program',
      description: 'Implement a customer referral program with incentives for both parties.',
      timeline: '1 month',
      cost: 'Low',
      expectedOutcome: 'Organic growth through existing customer network'
    }
  );
  
  // Competitive positioning
  recommendations.competitivePositioning.strengths = [
    'Unique customer experience',
    'Quality products/services',
    'Strategic location'
  ];
  
  recommendations.competitivePositioning.opportunities = [
    'Growing market demand',
    'Underserved customer segments',
    'Digital experience enhancement'
  ];
  
  recommendations.competitivePositioning.recommendations = [
    'Focus on unique selling propositions in marketing materials',
    'Target identified customer segments with tailored offerings',
    'Implement suggested digital improvements'
  ];
  
  // Future projections
  recommendations.futureProjections.shortTerm = [
    'Implementing recommended urgent actions will improve sentiment by 15%',
    'Marketing strategies should increase customer acquisition by 10-15%'
  ];
  
  recommendations.futureProjections.longTerm = [
    'Consistent implementation of growth strategies could lead to 20-30% revenue growth',
    'Building on competitive strengths will establish stronger market positioning'
  ];
  
  return { recommendations, success: true };
}

// Let the main thread know the worker is ready
self.postMessage({ type: 'ready' });

export {}; // This is needed to make TypeScript treat this file as a module
