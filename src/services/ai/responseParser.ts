import { Recommendations, UrgentAction, GrowthStrategy, PatternInsight, CompetitiveAnalysis, MarketingPlan, BusinessScenario, Strategy } from '@/types/recommendations';
import { ReviewAnalysis } from '@/types/aiService';

export class AIResponseParser {
  
  /**
   * Parse AI response with error recovery and validation
   */
  async parseResponse(response: string | any, expectedType: string): Promise<any> {
    // Handle already parsed JSON
    if (typeof response === 'object' && response !== null) {
      return this.validateAndFix(response, expectedType);
    }
    
    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(response);
      return this.validateAndFix(parsed, expectedType);
    } catch (jsonError) {
      // If JSON parsing fails, try structured extraction
      return this.extractStructuredData(response, expectedType);
    }
  }
  
  /**
   * Validate parsed data and fix missing fields
   */
  private validateAndFix(data: any, expectedType: string): any {
    switch (expectedType) {
      case 'recommendations':
        return this.validateRecommendations(data);
      case 'analysis':
        return this.validateAnalysis(data);
      case 'marketing':
        return this.validateMarketing(data);
      case 'scenarios':
        return this.validateScenarios(data);
      default:
        return data;
    }
  }
  
  /**
   * Extract structured data from natural language response
   */
  private extractStructuredData(text: string, expectedType: string): any {
    switch (expectedType) {
      case 'recommendations':
        return this.extractRecommendations(text);
      case 'analysis':
        return this.extractAnalysis(text);
      case 'marketing':
        return this.extractMarketing(text);
      case 'scenarios':
        return this.extractScenarios(text);
      default:
        throw new Error(`Unknown expected type: ${expectedType}`);
    }
  }
  
  /**
   * Validate and fix recommendations structure
   */
  private validateRecommendations(data: any): Recommendations {
    const recommendations: Partial<Recommendations> = data || {};
    
    // Ensure all required fields exist
    return {
      urgentActions: this.validateUrgentActions(recommendations.urgentActions),
      growthStrategies: this.validateGrowthStrategies(recommendations.growthStrategies),
      patternInsights: this.validatePatternInsights(recommendations.patternInsights),
      competitivePosition: this.validateCompetitiveAnalysis(recommendations.competitivePosition),
      customerAttractionPlan: this.validateMarketingPlan(recommendations.customerAttractionPlan),
      scenarios: this.validateScenarios(recommendations.scenarios),
      longTermStrategies: this.validateStrategies(recommendations.longTermStrategies),
      analysis: recommendations.analysis || this.getDefaultAnalysis(),
      suggestions: recommendations.suggestions || [],
      actionPlan: recommendations.actionPlan || this.getDefaultActionPlan()
    };
  }
  
  private validateUrgentActions(actions: any): UrgentAction[] {
    if (!Array.isArray(actions)) return [];
    
    return actions.map((action, index) => ({
      id: action.id || `urgent-${index}`,
      title: action.title || 'Urgent Action Required',
      description: action.description || 'No description provided',
      category: action.category || 'important',
      relatedReviews: action.relatedReviews || [],
      suggestedAction: action.suggestedAction || action.description,
      timeframe: action.timeframe || 'Immediate'
    }));
  }
  
  private validateGrowthStrategies(strategies: any): GrowthStrategy[] {
    if (!Array.isArray(strategies)) return this.getDefaultGrowthStrategies();
    
    return strategies.map((strategy, index) => ({
      id: strategy.id || `growth-${index}`,
      type: strategy.type || 'operations',
      category: strategy.category || strategy.type || 'general',
      title: strategy.title || 'Growth Strategy',
      description: strategy.description || 'No description provided',
      steps: strategy.steps || strategy.implementation || [],
      implementation: strategy.implementation || strategy.steps || [],
      expectedImpact: strategy.expectedImpact || strategy.potentialImpact || 'Medium impact expected',
      potentialImpact: strategy.potentialImpact || 'medium',
      resourceRequirements: strategy.resourceRequirements || 'medium',
      timeframe: strategy.timeframe || 'short_term',
      kpis: strategy.kpis || []
    }));
  }
  
  private validatePatternInsights(insights: any): PatternInsight[] {
    if (!Array.isArray(insights)) return [];
    
    return insights.map((insight, index) => ({
      id: insight.id || `pattern-${index}`,
      pattern: insight.pattern || 'Unnamed Pattern',
      frequency: insight.frequency || 0,
      sentiment: insight.sentiment || 'neutral',
      impact: insight.impact || 'medium',
      trend: insight.trend || 'stable',
      recommendation: insight.recommendation || 'Monitor this pattern',
      examples: insight.examples || []
    }));
  }
  
  private validateCompetitiveAnalysis(analysis: any): CompetitiveAnalysis {
    if (!analysis) return this.getDefaultCompetitiveAnalysis();
    
    return {
      overview: analysis.overview || 'Competitive analysis overview',
      competitors: analysis.competitors || [],
      strengthsWeaknesses: analysis.strengthsWeaknesses || {
        strengths: analysis.strengths || [],
        weaknesses: analysis.weaknesses || [],
        opportunities: analysis.opportunities || [],
        threats: analysis.threats || []
      },
      recommendations: analysis.recommendations || [],
      position: analysis.position || 'average',
      metrics: analysis.metrics || {},
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      opportunities: analysis.opportunities || []
    };
  }
  
  private validateMarketingPlan(plan: any): MarketingPlan {
    if (!plan) return this.getDefaultMarketingPlan();
    
    return {
      overview: plan.overview || 'Marketing plan overview',
      objectives: plan.objectives || [],
      tactics: plan.tactics || [],
      budget: plan.budget || { total: '$0', breakdown: {} },
      timeline: plan.timeline || {
        start: new Date().toISOString(),
        end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        milestones: []
      },
      targetAudiences: plan.targetAudiences || {
        primary: [],
        secondary: [],
        untapped: []
      },
      channels: plan.channels || [],
      messaging: plan.messaging || {
        uniqueValue: '',
        keyPoints: [],
        callToAction: ''
      }
    };
  }
  
  private validateScenarios(scenarios: any): BusinessScenario[] {
    if (!Array.isArray(scenarios)) return this.getDefaultScenarios();
    
    return scenarios.map((scenario, index) => ({
      name: scenario.name || `Scenario ${index + 1}`,
      description: scenario.description || 'No description provided',
      probability: scenario.probability || 0.5,
      timeframe: scenario.timeframe || '6 months',
      projectedMetrics: scenario.projectedMetrics || {
        reviewVolume: 0,
        avgRating: 0,
        sentiment: 0,
        revenue: '0%'
      },
      requiredActions: scenario.requiredActions || [],
      assumptions: scenario.assumptions || []
    }));
  }
  
  private validateStrategies(strategies: any): Strategy[] {
    if (!Array.isArray(strategies)) return [];
    
    return strategies.map((strategy, index) => ({
      id: strategy.id || `strategy-${index}`,
      name: strategy.name || strategy.title || 'Strategy',
      title: strategy.title || strategy.name || 'Strategy',
      category: strategy.category || 'general',
      description: strategy.description || 'No description provided',
      riskLevel: strategy.riskLevel || 'medium',
      timeframe: strategy.timeframe || 'long_term',
      expectedROI: strategy.expectedROI || 'TBD',
      actions: strategy.actions || [],
      objectives: strategy.objectives || [],
      tactics: strategy.tactics || [],
      expectedOutcomes: strategy.expectedOutcomes || []
    }));
  }
  
  private validateAnalysis(data: any): ReviewAnalysis {
    return {
      sentiment: data.sentiment || {
        overall: 0.5,
        breakdown: { positive: 0, neutral: 0, negative: 0 }
      },
      themes: data.themes || [],
      painPoints: data.painPoints || [],
      strengths: data.strengths || [],
      customerSegments: data.customerSegments || []
    };
  }
  
  /**
   * Extract recommendations from natural language text
   */
  private extractRecommendations(text: string): Recommendations {
    // This is a simplified extraction - in production, you'd use more sophisticated NLP
    const recommendations: Partial<Recommendations> = {};
    
    // Extract urgent actions
    recommendations.urgentActions = this.extractUrgentActionsFromText(text);
    
    // Extract growth strategies
    recommendations.growthStrategies = this.extractGrowthStrategiesFromText(text);
    
    // Extract patterns
    recommendations.patternInsights = this.extractPatternInsightsFromText(text);
    
    // Fill in remaining fields with defaults
    return this.validateRecommendations(recommendations);
  }
  
  private extractUrgentActionsFromText(text: string): UrgentAction[] {
    const urgentActions: UrgentAction[] = [];
    const urgentPhrases = ['urgent', 'immediate', 'critical', 'asap', 'right away'];
    
    const lines = text.split('\n');
    lines.forEach((line, index) => {
      if (urgentPhrases.some(phrase => line.toLowerCase().includes(phrase))) {
        urgentActions.push({
          id: `urgent-${index}`,
          title: 'Urgent Action',
          description: line.trim(),
          category: 'critical',
          timeframe: 'Immediate'
        });
      }
    });
    
    return urgentActions;
  }
  
  private extractGrowthStrategiesFromText(text: string): GrowthStrategy[] {
    const strategies: GrowthStrategy[] = [];
    const strategyKeywords = ['strategy', 'plan', 'approach', 'implement', 'develop'];
    
    const sections = text.split(/\n\n+/);
    sections.forEach((section, index) => {
      if (strategyKeywords.some(keyword => section.toLowerCase().includes(keyword))) {
        strategies.push({
          id: `growth-${index}`,
          title: 'Growth Strategy',
          description: section.trim(),
          category: 'general',
          implementation: [],
          expectedImpact: 'Medium impact',
          timeframe: 'short_term',
          kpis: []
        });
      }
    });
    
    return strategies;
  }
  
  private extractPatternInsightsFromText(text: string): PatternInsight[] {
    const insights: PatternInsight[] = [];
    const patternKeywords = ['pattern', 'trend', 'frequently', 'commonly', 'often'];
    
    const lines = text.split('\n');
    lines.forEach((line, index) => {
      if (patternKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        insights.push({
          pattern: line.trim(),
          frequency: 5,
          sentiment: 'neutral',
          recommendation: 'Monitor this pattern',
          examples: []
        });
      }
    });
    
    return insights;
  }
  
  private extractAnalysis(text: string): ReviewAnalysis {
    // Simplified extraction logic
    return {
      sentiment: {
        overall: 0.5,
        breakdown: { positive: 33, neutral: 34, negative: 33 }
      },
      themes: this.extractThemesFromText(text),
      painPoints: this.extractPainPointsFromText(text),
      strengths: this.extractStrengthsFromText(text),
      customerSegments: []
    };
  }
  
  private extractThemesFromText(text: string): any[] {
    const themes: any[] = [];
    const themeKeywords = ['theme', 'topic', 'subject', 'about', 'regarding'];
    
    const lines = text.split('\n');
    lines.forEach((line, index) => {
      if (themeKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        themes.push({
          name: line.trim(),
          frequency: 1,
          sentiment: 'neutral',
          examples: []
        });
      }
    });
    
    return themes;
  }
  
  private extractPainPointsFromText(text: string): any[] {
    const painPoints: any[] = [];
    const painKeywords = ['problem', 'issue', 'concern', 'complaint', 'negative'];
    
    const lines = text.split('\n');
    lines.forEach((line, index) => {
      if (painKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        painPoints.push({
          issue: line.trim(),
          severity: 'medium',
          frequency: 1,
          suggestions: []
        });
      }
    });
    
    return painPoints;
  }
  
  private extractStrengthsFromText(text: string): any[] {
    const strengths: any[] = [];
    const strengthKeywords = ['strength', 'positive', 'good', 'excellent', 'great'];
    
    const lines = text.split('\n');
    lines.forEach((line, index) => {
      if (strengthKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        strengths.push({
          aspect: line.trim(),
          mentions: 1,
          impact: 'medium'
        });
      }
    });
    
    return strengths;
  }
  
  private extractMarketing(text: string): MarketingPlan {
    // Simplified extraction
    return this.validateMarketingPlan({
      overview: text.substring(0, 200),
      objectives: [],
      tactics: [],
      budget: { total: '$0', breakdown: {} }
    });
  }
  
  private extractScenarios(text: string): BusinessScenario[] {
    // Simplified extraction
    const scenarios: BusinessScenario[] = [];
    const scenarioKeywords = ['scenario', 'case', 'situation', 'outcome'];
    
    const sections = text.split(/\n\n+/);
    sections.forEach((section, index) => {
      if (scenarioKeywords.some(keyword => section.toLowerCase().includes(keyword))) {
        scenarios.push({
          name: `Scenario ${index + 1}`,
          description: section.trim(),
          probability: 0.5,
          timeframe: '6 months',
          projectedMetrics: {
            reviewVolume: 0,
            avgRating: 0,
            sentiment: 0,
            revenue: '0%'
          },
          requiredActions: []
        });
      }
    });
    
    return scenarios.length > 0 ? scenarios : this.getDefaultScenarios();
  }
  
  // Default value generators
  private getDefaultAnalysis(): any {
    return {
      sentimentAnalysis: [
        { name: 'Positive', value: 33 },
        { name: 'Neutral', value: 34 },
        { name: 'Negative', value: 33 }
      ],
      staffMentions: [],
      commonTerms: [],
      overallAnalysis: 'Analysis pending'
    };
  }
  
  private getDefaultActionPlan(): any {
    return {
      title: 'Action Plan',
      description: 'Recommended actions based on analysis',
      steps: [],
      expectedResults: 'Improved business performance',
      timeframe: 'ongoing'
    };
  }
  
  private getDefaultCompetitiveAnalysis(): CompetitiveAnalysis {
    return {
      overview: 'Competitive analysis pending',
      competitors: [],
      strengthsWeaknesses: {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: []
      },
      recommendations: [],
      position: 'average',
      metrics: {},
      strengths: [],
      weaknesses: [],
      opportunities: []
    };
  }
  
  private getDefaultMarketingPlan(): MarketingPlan {
    return {
      overview: 'Marketing plan pending',
      objectives: [],
      tactics: [],
      budget: { total: '$0', breakdown: {} },
      timeline: {
        start: new Date().toISOString(),
        end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        milestones: []
      },
      targetAudiences: {
        primary: [],
        secondary: [],
        untapped: []
      },
      channels: [],
      messaging: {
        uniqueValue: '',
        keyPoints: [],
        callToAction: ''
      }
    };
  }
  
  private getDefaultGrowthStrategies(): GrowthStrategy[] {
    return [{
      id: 'default-growth-1',
      title: 'Improve Customer Experience',
      description: 'Focus on enhancing customer satisfaction',
      category: 'customer_experience',
      implementation: ['Collect feedback', 'Train staff', 'Improve processes'],
      expectedImpact: 'Medium impact expected',
      timeframe: 'short_term',
      kpis: ['Customer satisfaction score', 'Review ratings']
    }];
  }
  
  private getDefaultScenarios(): BusinessScenario[] {
    return [{
      name: 'Steady Growth',
      description: 'Maintain current trajectory with minor improvements',
      probability: 0.6,
      timeframe: '6 months',
      projectedMetrics: {
        reviewVolume: 100,
        avgRating: 4.0,
        sentiment: 0.7,
        revenue: '+10%'
      },
      requiredActions: ['Continue current strategies', 'Monitor market changes']
    }];
  }
}
