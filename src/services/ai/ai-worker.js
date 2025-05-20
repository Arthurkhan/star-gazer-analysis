// This is a Web Worker that handles AI processing off the main thread

// Define the core recommendation generation methods
const analyzeBusinessHealth = (data, reviews, businessType) => {
  if (!reviews || reviews.length === 0) {
    return {
      score: 50,
      trend: 'stable',
      strengths: ['Insufficient data for detailed analysis'],
      weaknesses: ['Insufficient data for detailed analysis'],
      opportunities: ['Increase review volume to enable detailed analysis'],
      threats: ['Inability to track performance trends due to low data volume']
    };
  }
  
  const totalReviews = reviews.length;
  const avgRating = reviews.reduce((sum, r) => sum + r.stars, 0) / totalReviews;
  const benchmark = data.benchmark || { avgRating: 4.0, monthlyReviews: 50 };
  
  // Calculate health score (0-100)
  let score = 50; // Base score
  
  // Rating factor (±20 points)
  const ratingDiff = avgRating - benchmark.avgRating;
  score += ratingDiff * 20;
  
  // Review volume factor (±15 points)
  const monthlyReviews = calculateMonthlyReviews(reviews);
  const volumeDiff = (monthlyReviews - benchmark.monthlyReviews) / benchmark.monthlyReviews;
  score += Math.min(Math.max(volumeDiff * 15, -15), 15);
  
  // Sentiment factor (±15 points)
  const sentimentScore = calculateSentimentScore(data.sentimentAnalysis);
  score += (sentimentScore - 0.7) * 30;
  
  score = Math.min(Math.max(score, 0), 100);
  
  // Determine trend
  const recentReviews = reviews.filter(r => {
    const date = new Date(r.publishedAtDate);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return date > threeMonthsAgo;
  });
  
  // Prevent division by zero
  const recentAvgRating = recentReviews.length > 0 
    ? recentReviews.reduce((sum, r) => sum + r.stars, 0) / recentReviews.length
    : avgRating;
  
  const trend = recentAvgRating > avgRating ? 'improving' : 
              recentAvgRating < avgRating ? 'declining' : 'stable';
  
  // Identify SWOT
  const strengths = identifyStrengths(data, avgRating, benchmark);
  const weaknesses = identifyWeaknesses(data, avgRating, benchmark);
  const opportunities = identifyOpportunities(data, reviews, businessType);
  const threats = identifyThreats(data, reviews, businessType);
  
  return { score, trend, strengths, weaknesses, opportunities, threats };
};

const identifyUrgentActions = (data, reviews, health) => {
  if (!reviews || reviews.length === 0) {
    return [
      {
        id: 'urgent-no-data',
        title: 'Insufficient Review Data',
        description: 'There are too few reviews to generate detailed urgent actions',
        category: 'critical',
        relatedReviews: [],
        suggestedAction: 'Implement review collection campaign immediately',
        timeframe: 'Within 1 week'
      }
    ];
  }
  
  const actions = [];
  const recentReviews = reviews.filter(r => {
    const date = new Date(r.publishedAtDate);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return date > oneMonthAgo;
  });
  
  // Check for critical negative patterns
  const negativeReviews = recentReviews.filter(r => r.stars <= 2);
  if (recentReviews.length > 0 && negativeReviews.length / recentReviews.length > 0.2) {
    actions.push({
      id: 'urgent-1',
      title: 'High Negative Review Rate',
      description: `${((negativeReviews.length / recentReviews.length) * 100).toFixed(1)}% of recent reviews are negative`,
      category: 'critical',
      relatedReviews: negativeReviews.slice(0, 5).map(r => r.reviewUrl),
      suggestedAction: 'Implement immediate service recovery program and staff training',
      timeframe: 'Within 1 week'
    });
  }
  
  // Check for staff issues
  const negativeStaffMentions = data.staffMentions && data.staffMentions.filter(s => s.sentiment === 'negative') || [];
  if (negativeStaffMentions.length > 0) {
    negativeStaffMentions.forEach(staff => {
      if (staff.count >= 3) {
        actions.push({
          id: `urgent-staff-${staff.name}`,
          title: `Staff Performance Issue: ${staff.name}`,
          description: `${staff.name} mentioned negatively in ${staff.count} reviews`,
          category: 'important',
          relatedReviews: [],
          suggestedAction: `Provide immediate coaching and support for ${staff.name}`,
          timeframe: 'Within 3 days'
        });
      }
    });
  }
  
  // Check review volume
  const monthlyReviews = calculateMonthlyReviews(reviews);
  if (monthlyReviews < 100) {
    actions.push({
      id: 'urgent-volume',
      title: 'Low Review Volume',
      description: `Only ${monthlyReviews} reviews per month (target: 100+)`,
      category: 'important',
      relatedReviews: [],
      suggestedAction: 'Launch review generation campaign with incentives',
      timeframe: 'Start within 1 week'
    });
  }
  
  return actions;
};

// Utility functions
const calculateMonthlyReviews = (reviews) => {
  if (!reviews || reviews.length === 0) return 0;
  
  const now = new Date();
  const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
  const recentReviews = reviews.filter(r => new Date(r.publishedAtDate) > oneYearAgo);
  return Math.round(recentReviews.length / 12);
};

const calculateSentimentScore = (sentimentData) => {
  if (!sentimentData || sentimentData.length === 0) return 0.5;
  
  const total = sentimentData.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return 0.5;
  
  const positive = sentimentData.find(s => s.name === 'Positive')?.value || 0;
  return positive / total;
};

const isPositiveTheme = (theme) => {
  if (!theme || typeof theme !== 'string') return false;
  const positiveWords = [
    'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'delicious',
    'friendly', 'clean', 'comfortable', 'beautiful', 'perfect', 'love'
  ];
  return positiveWords.some(word => theme.toLowerCase().includes(word));
};

const identifyStrengths = (data, avgRating, benchmark) => {
  const strengths = [];
  if (avgRating > benchmark.avgRating) strengths.push('Above-average rating');
  
  const positiveThemes = data.commonTerms && data.commonTerms.filter(t => isPositiveTheme(t.text)) || [];
  if (positiveThemes.length > 0) {
    strengths.push(`Strong in: ${positiveThemes.slice(0, 3).map(t => t.text).join(', ')}`);
  }
  
  if (strengths.length === 0) {
    strengths.push('Need more data to identify strengths');
  }
  
  return strengths;
};

const identifyWeaknesses = (data, avgRating, benchmark) => {
  const weaknesses = [];
  if (avgRating < benchmark.avgRating) weaknesses.push('Below-average rating');
  
  const negativeStaff = data.staffMentions && data.staffMentions.filter(s => s.sentiment === 'negative') || [];
  if (negativeStaff.length > 0) {
    weaknesses.push('Staff performance issues');
  }
  
  if (weaknesses.length === 0) {
    weaknesses.push('Need more data to identify weaknesses');
  }
  
  return weaknesses;
};

const identifyOpportunities = (data, reviews, businessType) => {
  const opportunities = [];
  
  const monthlyReviews = calculateMonthlyReviews(reviews);
  if (monthlyReviews < 100) {
    opportunities.push('Increase review volume to attract more customers');
  }
  
  opportunities.push('Expand digital marketing presence');
  opportunities.push('Develop loyalty program');
  
  return opportunities;
};

const identifyThreats = (data, reviews, businessType) => {
  const threats = [];
  
  if (!reviews || reviews.length === 0) {
    threats.push('Insufficient data to identify specific threats');
    threats.push('Lack of review data affects online visibility');
    return threats;
  }
  
  const negativeReviews = reviews.filter(r => r.stars <= 2);
  if (negativeReviews.length / reviews.length > 0.15) {
    threats.push('High negative review rate damaging reputation');
  }
  
  threats.push('Increased competition in local market');
  
  return threats;
};

// Main worker function to generate recommendations
const generateRecommendations = (analysisData, reviews, businessType) => {
  try {
    // Extract business information
    const businessId = analysisData.businessId;
    const businessName = analysisData.businessName || "Unknown Business";
    
    const businessHealth = analyzeBusinessHealth(analysisData, reviews, businessType);
    
    return {
      businessId,
      businessName,
      urgentActions: identifyUrgentActions(analysisData, reviews, businessHealth),
      growthStrategies: generateGrowthStrategies(analysisData, reviews, businessType, businessHealth),
      patternInsights: extractPatternInsights(analysisData, reviews),
      competitivePosition: analyzeCompetitivePosition(analysisData, reviews, businessType),
      customerAttractionPlan: createMarketingPlan(analysisData, reviews, businessType),
      scenarios: generateBusinessScenarios(businessHealth, analysisData),
      longTermStrategies: suggestLongTermStrategies(businessHealth, analysisData, businessType)
    };
  } catch (error) {
    return {
      error: error.message || 'Unknown error in recommendation generation'
    };
  }
};

// Implementation of the remaining methods (these are simplified versions)
const generateGrowthStrategies = (data, reviews, businessType, health) => {
  const strategies = [];
  
  // Marketing strategy for low review volume
  const monthlyReviews = calculateMonthlyReviews(reviews);
  if (monthlyReviews < 100) {
    strategies.push({
      id: 'growth-1',
      title: 'Review Generation Campaign',
      description: 'Increase review volume to attract more customers',
      category: 'marketing',
      expectedImpact: '50-100% increase in monthly reviews',
      implementation: [
        'Create post-visit email campaign requesting reviews',
        'Train staff to mention reviews at checkout',
        'Offer small incentive for honest reviews',
        'Display review QR codes at tables/checkout'
      ],
      timeframe: '1-2 months',
      kpis: ['Monthly review count', 'Review response rate', 'Customer engagement']
    });
  }
  
  // Leverage positive themes
  const positiveThemes = data.commonTerms && data.commonTerms
    .filter(term => isPositiveTheme(term.text))
    .slice(0, 3) || [];
  
  if (positiveThemes.length > 0) {
    strategies.push({
      id: 'growth-2',
      title: 'Amplify Strengths Marketing',
      description: `Focus marketing on top strengths: ${positiveThemes.map(t => t.text).join(', ')}`,
      category: 'marketing',
      expectedImpact: '20-30% increase in relevant customer segments',
      implementation: [
        `Update website/social media to emphasize ${positiveThemes[0].text}`,
        'Create content showcasing these strengths',
        'Train staff to highlight these features',
        'Update signage and promotional materials'
      ],
      timeframe: '1 month',
      kpis: ['Website traffic', 'Social media engagement', 'Conversion rate']
    });
  }
  
  // Add more growth strategies as needed
  
  return strategies;
};

const extractPatternInsights = (data, reviews) => {
  // Simplified implementation
  const insights = []; 
  
  if (!reviews || reviews.length === 0 || !data.commonTerms) {
    return [
      {
        id: 'pattern-no-data',
        pattern: 'Insufficient data for pattern analysis',
        frequency: 0,
        sentiment: 'neutral',
        recommendation: 'Collect more reviews to enable pattern analysis',
        examples: []
      }
    ];
  }
  
  // Process a few key patterns
  data.commonTerms.slice(0, 5).forEach(term => {
    insights.push({
      id: `pattern-${term.text}`,
      pattern: term.text,
      frequency: (term.count / reviews.length) * 100,
      sentiment: 'neutral',
      recommendation: `Monitor "${term.text}" for trends`,
      examples: []
    });
  });
  
  return insights;
};

const analyzeCompetitivePosition = (data, reviews, businessType) => {
  // Simplified implementation
  return {
    position: 'average',
    metrics: {
      rating: { value: 4.0, benchmark: 4.0, percentile: 50 },
      reviewVolume: { value: 50, benchmark: 50, percentile: 50 },
      sentiment: { value: 0.7, benchmark: 0.7, percentile: 50 }
    },
    strengths: ['Good overall performance'],
    weaknesses: ['Areas for improvement identified'],
    opportunities: ['Increase engagement with customers']
  };
};

const createMarketingPlan = (data, reviews, businessType) => {
  // Simplified implementation
  return {
    targetAudiences: {
      primary: ['Local residents', 'Young professionals'],
      secondary: ['Tourists', 'Business travelers'],
      untapped: ['Remote workers', 'Senior citizens']
    },
    channels: [
      {
        name: 'Social Media',
        strategy: 'Daily posts highlighting positive reviews',
        budget: 'low'
      },
      {
        name: 'Email Marketing',
        strategy: 'Weekly newsletter with promotions',
        budget: 'low'
      }
    ],
    messaging: {
      keyPoints: ['quality', 'service', 'value'],
      uniqueValue: 'The premier destination for quality service',
      callToAction: 'Visit us today!'
    }
  };
};

const generateBusinessScenarios = (health, data) => {
  // Simplified implementation
  return [
    {
      name: 'Best Case Scenario',
      description: 'All recommended strategies implemented successfully',
      probability: 0.25,
      timeframe: '6 months',
      projectedMetrics: {
        reviewVolume: 200,
        avgRating: 4.5,
        sentiment: 0.85,
        revenue: '+30%'
      },
      requiredActions: [
        'Implement all urgent actions',
        'Launch comprehensive marketing campaign'
      ]
    },
    {
      name: 'Realistic Growth',
      description: 'Partial implementation of key strategies',
      probability: 0.50,
      timeframe: '6 months',
      projectedMetrics: {
        reviewVolume: 150,
        avgRating: 4.3,
        sentiment: 0.75,
        revenue: '+15%'
      },
      requiredActions: [
        'Address critical issues',
        'Implement review generation campaign'
      ]
    }
  ];
};

const suggestLongTermStrategies = (health, data, businessType) => {
  // Simplified implementation
  return [
    {
      id: 'long-1',
      category: 'brand',
      title: 'Premium Brand Positioning',
      description: 'Elevate brand perception to command premium pricing',
      timeframe: '6-12 months',
      actions: [
        'Develop premium service offerings',
        'Upgrade physical space and ambiance'
      ],
      expectedROI: '25-40% margin increase',
      riskLevel: 'medium'
    },
    {
      id: 'long-2',
      category: 'customer',
      title: 'Market Diversification',
      description: 'Expand into new customer segments and demographics',
      timeframe: '3-6 months',
      actions: [
        'Research untapped demographics',
        'Create targeted offerings for new segments'
      ],
      expectedROI: '20-30% customer base growth',
      riskLevel: 'medium'
    }
  ];
};

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  const { analysisData, reviews, businessType } = event.data;
  
  try {
    // Adding a small delay to prevent blocking UI thread when worker starts
    setTimeout(() => {
      const recommendations = generateRecommendations(analysisData, reviews, businessType);
      self.postMessage(recommendations);
    }, 50);
  } catch (error) {
    self.postMessage({ error: error.message || 'Unknown error in the worker' });
  }
});
