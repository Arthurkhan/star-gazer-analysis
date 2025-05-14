import { Review } from '@/types/reviews';
import { BusinessType, BusinessMetrics, industryBenchmarks } from '@/types/businessTypes';
import { PatternInsight, BusinessScenario, CompetitiveAnalysis, CompetitiveInsight } from '@/types/recommendations';

export interface BusinessHealth {
  score: number; // 0-100
  status: 'excellent' | 'good' | 'fair' | 'poor';
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  metrics: BusinessMetrics;
}

export class CriticalThinkingEngine {
  analyzeBusinessHealth(
    data: any, 
    businessType: BusinessType = BusinessType.OTHER
  ): BusinessHealth {
    const metrics = this.calculateMetrics(data);
    const benchmark = industryBenchmarks[businessType];
    
    // Calculate health score (0-100)
    const ratingScore = (metrics.averageRating / 5) * 40; // 40% weight
    const volumeScore = Math.min((metrics.monthlyReviews / benchmark.monthlyReviews) * 30, 30); // 30% weight
    const sentimentScore = (metrics.sentimentBreakdown.positive / 
      (metrics.sentimentBreakdown.positive + metrics.sentimentBreakdown.negative + metrics.sentimentBreakdown.neutral)) * 30; // 30% weight
    
    const totalScore = ratingScore + volumeScore + sentimentScore;
    
    const status = totalScore >= 85 ? 'excellent' : 
                  totalScore >= 70 ? 'good' : 
                  totalScore >= 50 ? 'fair' : 'poor';
    
    return {
      score: totalScore,
      status,
      strengths: this.identifyStrengths(metrics, benchmark),
      weaknesses: this.identifyWeaknesses(metrics, benchmark),
      opportunities: this.findOpportunities(metrics, benchmark),
      threats: this.assessThreats(metrics, benchmark),
      metrics
    };
  }
  
  private calculateMetrics(data: any): BusinessMetrics {
    const totalReviews = data.sentimentAnalysis[0].value + 
                        data.sentimentAnalysis[1].value + 
                        data.sentimentAnalysis[2].value;
    
    return {
      averageRating: data.ratingBreakdown.reduce((sum: number, item: any) => 
        sum + (item.rating * item.count), 0) / totalReviews,
      monthlyReviews: totalReviews, // This is simplified - should calculate actual monthly average
      responseRate: 0, // Would need to calculate from actual response data
      sentimentBreakdown: {
        positive: data.sentimentAnalysis[0].value,
        neutral: data.sentimentAnalysis[1].value,
        negative: data.sentimentAnalysis[2].value
      },
      commonThemes: data.mainThemes ? data.mainThemes.map((t: any) => t.theme) : [],
      customerComplaints: this.extractComplaints(data)
    };
  }
  
  private identifyStrengths(metrics: BusinessMetrics, benchmark: any): string[] {
    const strengths = [];
    
    if (metrics.averageRating >= benchmark.successMetrics.excellentThreshold) {
      strengths.push('Exceptional customer satisfaction ratings');
    }
    
    if (metrics.monthlyReviews > benchmark.monthlyReviews * 1.5) {
      strengths.push('High customer engagement and review volume');
    }
    
    const positiveSentimentRatio = metrics.sentimentBreakdown.positive / 
      (metrics.sentimentBreakdown.positive + metrics.sentimentBreakdown.negative);
    if (positiveSentimentRatio > 0.8) {
      strengths.push('Very positive customer sentiment');
    }
    
    // Analyze common themes for strengths
    const positiveThemes = metrics.commonThemes.filter(theme => 
      ['excellent', 'amazing', 'best', 'great', 'wonderful'].some(word => 
        theme.toLowerCase().includes(word)
      )
    );
    
    if (positiveThemes.length > 0) {
      strengths.push(`Customers love: ${positiveThemes.join(', ')}`);
    }
    
    return strengths;
  }
  
  private identifyWeaknesses(metrics: BusinessMetrics, benchmark: any): string[] {
    const weaknesses = [];
    
    if (metrics.averageRating < benchmark.successMetrics.needsImprovementThreshold) {
      weaknesses.push('Below-average customer satisfaction ratings');
    }
    
    if (metrics.monthlyReviews < benchmark.monthlyReviews * 0.5) {
      weaknesses.push('Low review volume suggests limited customer engagement');
    }
    
    const negativeSentimentRatio = metrics.sentimentBreakdown.negative / 
      (metrics.sentimentBreakdown.positive + metrics.sentimentBreakdown.negative);
    if (negativeSentimentRatio > 0.3) {
      weaknesses.push('High proportion of negative sentiment');
    }
    
    if (metrics.customerComplaints.length > 0) {
      weaknesses.push(`Recurring complaints about: ${metrics.customerComplaints.slice(0, 3).join(', ')}`);
    }
    
    return weaknesses;
  }
  
  private findOpportunities(metrics: BusinessMetrics, benchmark: any): string[] {
    const opportunities = [];
    
    if (metrics.monthlyReviews < 100) {
      opportunities.push('Implement review generation campaign to increase visibility');
    }
    
    if (metrics.responseRate < 0.3) {
      opportunities.push('Improve review response rate to show customer care');
    }
    
    // Find underperforming areas compared to benchmark
    const missingThemes = benchmark.commonThemes.filter((theme: string) => 
      !metrics.commonThemes.some(t => t.toLowerCase().includes(theme.toLowerCase()))
    );
    
    if (missingThemes.length > 0) {
      opportunities.push(`Expand offerings in: ${missingThemes.join(', ')}`);
    }
    
    return opportunities;
  }
  
  private assessThreats(metrics: BusinessMetrics, benchmark: any): string[] {
    const threats = [];
    
    if (metrics.averageRating < benchmark.avgRating) {
      threats.push('Rating below industry average risks losing customers to competitors');
    }
    
    const negativeTrend = metrics.sentimentBreakdown.negative > metrics.sentimentBreakdown.positive * 0.3;
    if (negativeTrend) {
      threats.push('Growing negative sentiment could damage reputation');
    }
    
    if (metrics.monthlyReviews < 50) {
      threats.push('Very low review volume reduces online visibility');
    }
    
    return threats;
  }
  
  private extractComplaints(data: any): string[] {
    // Extract common complaints from negative reviews
    // This is simplified - in a real implementation, we'd analyze actual review text
    const negativeThemes = data.commonTerms?.filter((term: any) => 
      ['bad', 'poor', 'terrible', 'awful', 'slow', 'rude', 'expensive', 'dirty'].some(word => 
        term.text.toLowerCase().includes(word)
      )
    ) || [];
    
    return negativeThemes.map((t: any) => t.text);
  }
  
  generateScenarios(currentState: BusinessHealth, recommendations: any): BusinessScenario[] {
    const currentRating = currentState.metrics.averageRating;
    const currentVolume = currentState.metrics.monthlyReviews;
    
    return [
      {
        name: "Best Case Scenario",
        description: "All recommendations successfully implemented with maximum impact",
        assumptions: [
          "100% implementation of urgent actions",
          "Successful execution of all growth strategies",
          "Positive market conditions",
          "No new competitive threats"
        ],
        projectedMetrics: {
          rating: Math.min(currentRating + 0.5, 5),
          monthlyReviews: currentVolume * 2,
          customerSatisfaction: 90,
          revenue: "+30-40% increase"
        },
        probability: 0.25,
        requiredActions: [
          "Immediate implementation of all urgent actions",
          "Full commitment to growth strategies",
          "Continuous monitoring and adjustment"
        ],
        timeline: "6-12 months"
      },
      {
        name: "Realistic Scenario",
        description: "Moderate success with partial implementation",
        assumptions: [
          "70% implementation of recommendations",
          "Some delays in execution",
          "Normal market conditions",
          "Typical competitive pressure"
        ],
        projectedMetrics: {
          rating: currentRating + 0.2,
          monthlyReviews: currentVolume * 1.5,
          customerSatisfaction: 80,
          revenue: "+15-20% increase"
        },
        probability: 0.50,
        requiredActions: [
          "Focus on high-priority actions",
          "Gradual rollout of strategies",
          "Regular progress reviews"
        ],
        timeline: "12-18 months"
      },
      {
        name: "Conservative Scenario",
        description: "Minimal implementation with limited resources",
        assumptions: [
          "Only urgent actions addressed",
          "Limited budget for growth initiatives",
          "Challenging market conditions",
          "Increased competition"
        ],
        projectedMetrics: {
          rating: currentRating + 0.1,
          monthlyReviews: currentVolume * 1.2,
          customerSatisfaction: 75,
          revenue: "+5-10% increase"
        },
        probability: 0.20,
        requiredActions: [
          "Fix critical issues only",
          "Maintain current operations",
          "Defensive market position"
        ],
        timeline: "6-12 months"
      },
      {
        name: "Status Quo",
        description: "No significant changes implemented",
        assumptions: [
          "No action taken on recommendations",
          "Business as usual approach",
          "Market forces determine outcomes"
        ],
        projectedMetrics: {
          rating: currentRating - 0.1,
          monthlyReviews: currentVolume,
          customerSatisfaction: 70,
          revenue: "0-5% change"
        },
        probability: 0.05,
        requiredActions: [
          "Continue current practices",
          "React to issues as they arise"
        ],
        timeline: "Ongoing"
      }
    ];
  }
  
  analyzePatterns(data: any): PatternInsight[] {
    const patterns: PatternInsight[] = [];
    
    // Analyze common terms and themes
    if (data.commonTerms) {
      data.commonTerms.forEach((term: any) => {
        const sentiment = this.determineSentiment(term.text);
        patterns.push({
          pattern: term.text,
          frequency: term.count,
          sentiment: sentiment,
          impact: term.count > 10 ? 'high' : term.count > 5 ? 'medium' : 'low',
          trend: 'stable', // Would need historical data for real trend analysis
          recommendation: this.generateRecommendation(term.text, sentiment),
          examples: [] // Would extract from actual reviews
        });
      });
    }
    
    return patterns;
  }
  
  private determineSentiment(text: string): 'positive' | 'negative' | 'neutral' | 'mixed' {
    const positiveWords = ['excellent', 'great', 'amazing', 'wonderful', 'best', 'fantastic'];
    const negativeWords = ['bad', 'poor', 'terrible', 'worst', 'awful', 'disappointing'];
    
    const hasPositive = positiveWords.some(word => text.toLowerCase().includes(word));
    const hasNegative = negativeWords.some(word => text.toLowerCase().includes(word));
    
    if (hasPositive && hasNegative) return 'mixed';
    if (hasPositive) return 'positive';
    if (hasNegative) return 'negative';
    return 'neutral';
  }
  
  private generateRecommendation(pattern: string, sentiment: string): string {
    if (sentiment === 'negative') {
      return `Address issues related to "${pattern}" to improve customer satisfaction`;
    } else if (sentiment === 'positive') {
      return `Leverage positive feedback about "${pattern}" in marketing materials`;
    }
    return `Monitor and improve aspects related to "${pattern}"`;
  }
  
  compareToIndustry(metrics: BusinessMetrics, businessType: BusinessType): CompetitiveAnalysis {
    const benchmark = industryBenchmarks[businessType];
    const insights: CompetitiveInsight[] = [];
    
    // Rating comparison
    insights.push({
      metric: 'Average Rating',
      yourValue: metrics.averageRating,
      industryAverage: benchmark.avgRating,
      topPerformer: benchmark.successMetrics.excellentThreshold,
      percentile: this.calculatePercentile(metrics.averageRating, benchmark.avgRating, benchmark.successMetrics),
      gap: metrics.averageRating - benchmark.avgRating,
      recommendation: metrics.averageRating < benchmark.avgRating ? 
        'Focus on service quality improvements to reach industry average' :
        'Maintain high standards while exploring differentiation opportunities'
    });
    
    // Review volume comparison
    insights.push({
      metric: 'Monthly Reviews',
      yourValue: metrics.monthlyReviews,
      industryAverage: benchmark.monthlyReviews,
      topPerformer: benchmark.monthlyReviews * 2,
      percentile: this.calculateVolumePercentile(metrics.monthlyReviews, benchmark.monthlyReviews),
      gap: metrics.monthlyReviews - benchmark.monthlyReviews,
      recommendation: metrics.monthlyReviews < benchmark.monthlyReviews ? 
        'Implement review generation strategies to increase visibility' :
        'Leverage high engagement for social proof marketing'
    });
    
    // Determine overall position
    const avgPercentile = insights.reduce((sum, i) => sum + i.percentile, 0) / insights.length;
    const position = avgPercentile >= 80 ? 'leader' :
                    avgPercentile >= 60 ? 'above-average' :
                    avgPercentile >= 40 ? 'average' :
                    avgPercentile >= 20 ? 'below-average' : 'lagging';
    
    return {
      businessType,
      overallPosition: position,
      insights,
      strengths: metrics.averageRating > benchmark.avgRating ? ['Rating above industry average'] : [],
      weaknesses: metrics.averageRating < benchmark.avgRating ? ['Rating below industry average'] : [],
      opportunities: ['Analyze competitor strategies', 'Identify market gaps'],
      threats: ['Increasing competition', 'Changing customer expectations']
    };
  }
  
  private calculatePercentile(value: number, average: number, successMetrics: any): number {
    if (value >= successMetrics.excellentThreshold) return 95;
    if (value >= successMetrics.goodThreshold) return 75;
    if (value >= average) return 50;
    if (value >= successMetrics.needsImprovementThreshold) return 25;
    return 10;
  }
  
  private calculateVolumePercentile(value: number, average: number): number {
    const ratio = value / average;
    if (ratio >= 2) return 95;
    if (ratio >= 1.5) return 80;
    if (ratio >= 1) return 50;
    if (ratio >= 0.5) return 25;
    return 10;
  }
}