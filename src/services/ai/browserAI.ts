import { 
  Recommendations, 
  BusinessHealth,
  UrgentAction,
  GrowthStrategy,
  PatternInsight,
  CompetitiveAnalysis,
  MarketingPlan,
  BusinessScenario,
  Strategy
} from '@/types/recommendations';
import { BusinessType, industryBenchmarks } from '@/types/businessTypes';
import { Review } from '@/types/reviews';

interface AnalysisResult {
  sentimentAnalysis: { name: string; value: number }[];
  staffMentions: { name: string; count: number; sentiment: string }[];
  commonTerms: { text: string; count: number }[];
  mainThemes?: { theme: string; count: number; percentage: number }[];
  overallAnalysis: string;
  ratingBreakdown?: { rating: number; count: number; percentage: number }[];
  languageDistribution?: { language: string; count: number; percentage: number }[];
}

export class BrowserAIService {
  // Core recommendation generation using rule-based logic and pattern matching
  async generateRecommendations(
    analysisData: AnalysisResult,
    reviews: Review[],
    businessType: BusinessType = BusinessType.OTHER
  ): Promise<Recommendations> {
    const businessHealth = this.analyzeBusinessHealth(analysisData, reviews, businessType);
    
    return {
      urgentActions: this.identifyUrgentActions(analysisData, reviews, businessHealth),
      growthStrategies: this.generateGrowthStrategies(analysisData, reviews, businessType, businessHealth),
      patternInsights: this.extractPatternInsights(analysisData, reviews),
      competitivePosition: this.analyzeCompetitivePosition(analysisData, reviews, businessType),
      customerAttractionPlan: this.createMarketingPlan(analysisData, reviews, businessType),
      scenarios: this.generateBusinessScenarios(businessHealth, analysisData),
      longTermStrategies: this.suggestLongTermStrategies(businessHealth, analysisData, businessType)
    };
  }

  // Analyze overall business health
  private analyzeBusinessHealth(
    data: AnalysisResult,
    reviews: Review[],
    businessType: BusinessType
  ): BusinessHealth {
    const totalReviews = reviews.length;
    const avgRating = reviews.reduce((sum, r) => sum + r.stars, 0) / totalReviews;
    const benchmark = industryBenchmarks[businessType];
    
    // Calculate health score (0-100)
    let score = 50; // Base score
    
    // Rating factor (±20 points)
    const ratingDiff = avgRating - benchmark.avgRating;
    score += ratingDiff * 20;
    
    // Review volume factor (±15 points)
    const monthlyReviews = this.calculateMonthlyReviews(reviews);
    const volumeDiff = (monthlyReviews - benchmark.monthlyReviews) / benchmark.monthlyReviews;
    score += Math.min(Math.max(volumeDiff * 15, -15), 15);
    
    // Sentiment factor (±15 points)
    const sentimentScore = this.calculateSentimentScore(data.sentimentAnalysis);
    score += (sentimentScore - 0.7) * 30;
    
    score = Math.min(Math.max(score, 0), 100);
    
    // Determine trend
    const recentReviews = reviews.filter(r => {
      const date = new Date(r.publishedAtDate);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return date > threeMonthsAgo;
    });
    
    const recentAvgRating = recentReviews.reduce((sum, r) => sum + r.stars, 0) / recentReviews.length;
    const trend = recentAvgRating > avgRating ? 'improving' : 
                  recentAvgRating < avgRating ? 'declining' : 'stable';
    
    // Identify SWOT
    const strengths = this.identifyStrengths(data, avgRating, benchmark);
    const weaknesses = this.identifyWeaknesses(data, avgRating, benchmark);
    const opportunities = this.identifyOpportunities(data, reviews, businessType);
    const threats = this.identifyThreats(data, reviews, businessType);
    
    return { score, trend, strengths, weaknesses, opportunities, threats };
  }

  // Identify urgent actions needed
  private identifyUrgentActions(
    data: AnalysisResult,
    reviews: Review[],
    health: BusinessHealth
  ): UrgentAction[] {
    const actions: UrgentAction[] = [];
    const recentReviews = reviews.filter(r => {
      const date = new Date(r.publishedAtDate);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return date > oneMonthAgo;
    });
    
    // Check for critical negative patterns
    const negativeReviews = recentReviews.filter(r => r.stars <= 2);
    if (negativeReviews.length / recentReviews.length > 0.2) {
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
    const negativeStaffMentions = data.staffMentions.filter(s => s.sentiment === 'negative');
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
    const monthlyReviews = this.calculateMonthlyReviews(reviews);
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
  }

  // Generate growth strategies
  private generateGrowthStrategies(
    data: AnalysisResult,
    reviews: Review[],
    businessType: BusinessType,
    health: BusinessHealth
  ): GrowthStrategy[] {
    const strategies: GrowthStrategy[] = [];
    
    // Marketing strategy for low review volume
    const monthlyReviews = this.calculateMonthlyReviews(reviews);
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
    const positiveThemes = data.commonTerms
      .filter(term => this.isPositiveTheme(term.text))
      .slice(0, 3);
    
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
    
    // Customer experience improvements
    if (health.score < 70) {
      strategies.push({
        id: 'growth-3',
        title: 'Customer Experience Enhancement',
        description: 'Systematic improvements to address pain points',
        category: 'customer_experience',
        expectedImpact: '0.3-0.5 star rating increase',
        implementation: [
          'Conduct staff training on identified weaknesses',
          'Implement customer feedback system',
          'Create service recovery protocols',
          'Regular quality audits'
        ],
        timeframe: '2-3 months',
        kpis: ['Average rating', 'Negative review percentage', 'Customer satisfaction score']
      });
    }
    
    return strategies;
  }

  // Extract pattern insights
  private extractPatternInsights(
    data: AnalysisResult,
    reviews: Review[]
  ): PatternInsight[] {
    const insights: PatternInsight[] = [];
    
    // Analyze common terms
    data.commonTerms.forEach(term => {
      const relatedReviews = reviews.filter(r => 
        r.text && typeof r.text === 'string' && 
        r.text.toLowerCase().includes(term.text.toLowerCase())
      );
      
      const sentiment = this.analyzeSentimentForTerm(relatedReviews);
      const frequency = (term.count / reviews.length) * 100;
      
      if (frequency > 5) { // Mentioned in >5% of reviews
        insights.push({
          id: `pattern-${term.text}`,
          pattern: term.text,
          frequency: frequency,
          sentiment: sentiment,
          recommendation: this.getRecommendationForPattern(term.text, sentiment, frequency),
          examples: relatedReviews.slice(0, 3).map(r => (r.text || '').substring(0, 100) + '...')
        });
      }
    });
    
    // Time-based patterns
    const timePatterns = this.analyzeTimePatterns(reviews);
    insights.push(...timePatterns);
    
    return insights.sort((a, b) => b.frequency - a.frequency);
  }

  // Analyze competitive position
  private analyzeCompetitivePosition(
    data: AnalysisResult,
    reviews: Review[],
    businessType: BusinessType
  ): CompetitiveAnalysis {
    const benchmark = industryBenchmarks[businessType];
    const avgRating = reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length;
    const monthlyReviews = this.calculateMonthlyReviews(reviews);
    const sentimentScore = this.calculateSentimentScore(data.sentimentAnalysis);
    
    const ratingPercentile = this.calculatePercentile(avgRating, benchmark.avgRating, 0.5);
    const volumePercentile = this.calculatePercentile(monthlyReviews, benchmark.monthlyReviews, 50);
    const sentimentPercentile = this.calculatePercentile(sentimentScore, 0.7, 0.1);
    
    const avgPercentile = (ratingPercentile + volumePercentile + sentimentPercentile) / 3;
    const position = avgPercentile > 60 ? 'above' : avgPercentile < 40 ? 'below' : 'average';
    
    // Identify competitive advantages and disadvantages
    const strengths = [];
    const weaknesses = [];
    const opportunities = [];
    
    if (ratingPercentile > 60) strengths.push('Higher than average rating');
    else if (ratingPercentile < 40) weaknesses.push('Below average rating');
    
    if (volumePercentile > 60) strengths.push('Strong review volume');
    else if (volumePercentile < 40) weaknesses.push('Low review volume');
    
    if (sentimentPercentile > 60) strengths.push('Excellent customer sentiment');
    else if (sentimentPercentile < 40) weaknesses.push('Poor customer sentiment');
    
    // Opportunities based on benchmark comparison
    benchmark.commonThemes.forEach(theme => {
      const hasTheme = data.commonTerms.some(term => 
        term.text && theme &&
        term.text.toLowerCase().includes(theme.toLowerCase())
      );
      if (!hasTheme) {
        opportunities.push(`Develop ${theme} offerings (industry standard)`);
      }
    });
    
    return {
      position,
      metrics: {
        rating: { value: avgRating, benchmark: benchmark.avgRating, percentile: ratingPercentile },
        reviewVolume: { value: monthlyReviews, benchmark: benchmark.monthlyReviews, percentile: volumePercentile },
        sentiment: { value: sentimentScore, benchmark: 0.7, percentile: sentimentPercentile }
      },
      strengths,
      weaknesses,
      opportunities
    };
  }

  // Create marketing plan
  private createMarketingPlan(
    data: AnalysisResult,
    reviews: Review[],
    businessType: BusinessType
  ): MarketingPlan {
    // Analyze current customer base
    const languages = data.languageDistribution || [];
    const themes = data.mainThemes || [];
    
    // Identify target audiences
    const primaryAudiences = this.identifyPrimaryAudiences(reviews, themes);
    const secondaryAudiences = this.identifySecondaryAudiences(businessType);
    const untappedAudiences = this.identifyUntappedAudiences(businessType, primaryAudiences);
    
    // Define marketing channels
    const channels = [
      {
        name: 'Social Media',
        strategy: 'Daily posts highlighting positive reviews and unique features',
        budget: 'low' as const
      },
      {
        name: 'Email Marketing',
        strategy: 'Weekly newsletter with promotions and updates',
        budget: 'low' as const
      },
      {
        name: 'Local SEO',
        strategy: 'Optimize Google My Business and local directories',
        budget: 'medium' as const
      },
      {
        name: 'Influencer Partnerships',
        strategy: 'Collaborate with local food/lifestyle bloggers',
        budget: 'medium' as const
      }
    ];
    
    // Craft messaging
    const topStrengths = data.commonTerms
      .filter(term => this.isPositiveTheme(term.text))
      .slice(0, 3)
      .map(t => t.text);
    
    const messaging = {
      keyPoints: topStrengths,
      uniqueValue: this.craftUniqueValueProposition(topStrengths, businessType),
      callToAction: 'Visit us today and experience the difference!'
    };
    
    return {
      targetAudiences: {
        primary: primaryAudiences,
        secondary: secondaryAudiences,
        untapped: untappedAudiences
      },
      channels,
      messaging
    };
  }

  // Generate business scenarios
  private generateBusinessScenarios(
    health: BusinessHealth,
    data: AnalysisResult
  ): BusinessScenario[] {
    const currentRating = health.score / 20; // Convert to 0-5 scale
    const currentVolume = 100; // Baseline
    
    return [
      {
        name: 'Best Case Scenario',
        description: 'All recommended strategies implemented successfully',
        probability: 0.25,
        timeframe: '6 months',
        projectedMetrics: {
          reviewVolume: currentVolume * 2,
          avgRating: Math.min(currentRating + 0.5, 5),
          sentiment: 0.85,
          revenue: '+30%'
        },
        requiredActions: [
          'Implement all urgent actions within 2 weeks',
          'Launch comprehensive marketing campaign',
          'Complete staff training program',
          'Optimize operations based on insights'
        ]
      },
      {
        name: 'Realistic Growth',
        description: 'Partial implementation of key strategies',
        probability: 0.50,
        timeframe: '6 months',
        projectedMetrics: {
          reviewVolume: currentVolume * 1.5,
          avgRating: Math.min(currentRating + 0.3, 5),
          sentiment: 0.75,
          revenue: '+15%'
        },
        requiredActions: [
          'Address critical issues',
          'Implement review generation campaign',
          'Basic staff training',
          'Social media marketing'
        ]
      },
      {
        name: 'Minimal Improvement',
        description: 'Only urgent issues addressed',
        probability: 0.20,
        timeframe: '6 months',
        projectedMetrics: {
          reviewVolume: currentVolume * 1.2,
          avgRating: currentRating + 0.1,
          sentiment: 0.70,
          revenue: '+5%'
        },
        requiredActions: [
          'Fix critical problems only',
          'Basic customer service improvements'
        ]
      },
      {
        name: 'Status Quo',
        description: 'No significant changes made',
        probability: 0.05,
        timeframe: '6 months',
        projectedMetrics: {
          reviewVolume: currentVolume,
          avgRating: currentRating,
          sentiment: 0.68,
          revenue: '0%'
        },
        requiredActions: []
      }
    ];
  }

  // Suggest long-term strategies
  private suggestLongTermStrategies(
    health: BusinessHealth,
    data: AnalysisResult,
    businessType: BusinessType
  ): Strategy[] {
    const strategies: Strategy[] = [];
    
    // Brand positioning strategy
    strategies.push({
      id: 'long-1',
      category: 'brand',
      title: 'Premium Brand Positioning',
      description: 'Elevate brand perception to command premium pricing',
      timeframe: '6-12 months',
      actions: [
        'Develop premium service offerings',
        'Upgrade physical space and ambiance',
        'Create exclusive customer experiences',
        'Partner with luxury brands'
      ],
      expectedROI: '25-40% margin increase',
      riskLevel: 'medium'
    });
    
    // Customer base expansion
    strategies.push({
      id: 'long-2',
      category: 'customer',
      title: 'Market Diversification',
      description: 'Expand into new customer segments and demographics',
      timeframe: '3-6 months',
      actions: [
        'Research untapped demographics',
        'Create targeted offerings for new segments',
        'Develop multichannel marketing approach',
        'Build strategic partnerships'
      ],
      expectedROI: '20-30% customer base growth',
      riskLevel: 'medium'
    });
    
    // Innovation strategy
    if (businessType === BusinessType.RESTAURANT || businessType === BusinessType.CAFE) {
      strategies.push({
        id: 'long-3',
        category: 'innovation',
        title: 'Menu Innovation Program',
        description: 'Regular introduction of new offerings based on trends',
        timeframe: '2-4 months',
        actions: [
          'Establish trend monitoring system',
          'Create seasonal menu rotations',
          'Develop signature items',
          'Test new concepts with focus groups'
        ],
        expectedROI: '15-25% revenue increase',
        riskLevel: 'low'
      });
    }
    
    // Digital transformation
    strategies.push({
      id: 'long-4',
      category: 'innovation',
      title: 'Digital Experience Enhancement',
      description: 'Leverage technology to improve customer experience',
      timeframe: '3-6 months',
      actions: [
        'Implement mobile ordering/payment',
        'Create loyalty app with rewards',
        'Develop AR/VR experiences',
        'Use AI for personalized recommendations'
      ],
      expectedROI: '30-50% efficiency improvement',
      riskLevel: 'medium'
    });
    
    return strategies;
  }

  // Helper methods
  private calculateMonthlyReviews(reviews: Review[]): number {
    const now = new Date();
    const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
    const recentReviews = reviews.filter(r => new Date(r.publishedAtDate) > oneYearAgo);
    return Math.round(recentReviews.length / 12);
  }

  private calculateSentimentScore(sentimentData: { name: string; value: number }[]): number {
    const total = sentimentData.reduce((sum, s) => sum + s.value, 0);
    const positive = sentimentData.find(s => s.name === 'Positive')?.value || 0;
    return positive / total;
  }

  private isPositiveTheme(theme: string): boolean {
    if (!theme || typeof theme !== 'string') return false;
    const positiveWords = [
      'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'delicious',
      'friendly', 'clean', 'comfortable', 'beautiful', 'perfect', 'love'
    ];
    return positiveWords.some(word => theme.toLowerCase().includes(word));
  }

  private analyzeSentimentForTerm(reviews: Review[]): 'positive' | 'negative' | 'neutral' {
    const avgRating = reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length;
    return avgRating >= 4 ? 'positive' : avgRating <= 2 ? 'negative' : 'neutral';
  }

  private getRecommendationForPattern(
    pattern: string,
    sentiment: 'positive' | 'negative' | 'neutral',
    frequency: number
  ): string {
    if (sentiment === 'positive' && frequency > 10) {
      return `Highlight "${pattern}" in marketing as a key strength`;
    } else if (sentiment === 'negative' && frequency > 5) {
      return `Address issues related to "${pattern}" immediately`;
    } else if (sentiment === 'neutral') {
      return `Improve "${pattern}" to convert neutral experiences to positive`;
    }
    return `Monitor "${pattern}" for trends`;
  }

  private analyzeTimePatterns(reviews: Review[]): PatternInsight[] {
    // This would analyze patterns by day of week, time of day, etc.
    // Simplified for this implementation
    return [];
  }

  private calculatePercentile(value: number, benchmark: number, stdDev: number): number {
    const zScore = (value - benchmark) / stdDev;
    const percentile = (1 + this.erf(zScore / Math.sqrt(2))) / 2 * 100;
    return Math.min(Math.max(percentile, 0), 100);
  }

  private identifyStrengths(
    data: AnalysisResult,
    avgRating: number,
    benchmark: any
  ): string[] {
    const strengths = [];
    if (avgRating > benchmark.avgRating) strengths.push('Above-average rating');
    
    const positiveThemes = data.commonTerms.filter(t => this.isPositiveTheme(t.text));
    if (positiveThemes.length > 0) {
      strengths.push(`Strong in: ${positiveThemes.slice(0, 3).map(t => t.text).join(', ')}`);
    }
    
    return strengths;
  }

  private identifyWeaknesses(
    data: AnalysisResult,
    avgRating: number,
    benchmark: any
  ): string[] {
    const weaknesses = [];
    if (avgRating < benchmark.avgRating) weaknesses.push('Below-average rating');
    
    const negativeStaff = data.staffMentions.filter(s => s.sentiment === 'negative');
    if (negativeStaff.length > 0) {
      weaknesses.push('Staff performance issues');
    }
    
    return weaknesses;
  }

  private identifyOpportunities(
    data: AnalysisResult,
    reviews: Review[],
    businessType: BusinessType
  ): string[] {
    const opportunities = [];
    
    const monthlyReviews = this.calculateMonthlyReviews(reviews);
    if (monthlyReviews < 100) {
      opportunities.push('Increase review volume to attract more customers');
    }
    
    // Add more opportunity identification logic
    opportunities.push('Expand digital marketing presence');
    opportunities.push('Develop loyalty program');
    
    return opportunities;
  }

  private identifyThreats(
    data: AnalysisResult,
    reviews: Review[],
    businessType: BusinessType
  ): string[] {
    const threats = [];
    
    const negativeReviews = reviews.filter(r => r.stars <= 2);
    if (negativeReviews.length / reviews.length > 0.15) {
      threats.push('High negative review rate damaging reputation');
    }
    
    threats.push('Increased competition in local market');
    
    return threats;
  }

  private identifyPrimaryAudiences(reviews: Review[], themes: any[]): string[] {
    // Analyze review content to identify primary customer types
    return ['Local residents', 'Young professionals', 'Families'];
  }

  private identifySecondaryAudiences(businessType: BusinessType): string[] {
    // Based on business type
    return ['Tourists', 'Business travelers', 'Students'];
  }

  private identifyUntappedAudiences(
    businessType: BusinessType,
    currentAudiences: string[]
  ): string[] {
    // Identify potential new audiences
    return ['Remote workers', 'Senior citizens', 'International visitors'];
  }

  private craftUniqueValueProposition(
    strengths: string[],
    businessType: BusinessType
  ): string {
    return `The premier ${businessType} known for ${strengths.join(', ')}`;
  }

  private erf(x: number): number {
    // Constants
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    // Save the sign of x
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);

    // A&S formula 7.1.26
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }
}
