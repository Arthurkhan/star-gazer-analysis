import { supabase } from '@/integrations/supabase/client';
import { Recommendations } from '@/types/recommendations';
import { BusinessContext } from '@/utils/businessContext';
import { ConsolidatedLogger } from '@/utils/logger';

const logger = new ConsolidatedLogger('RecommendationService');

export interface BusinessData {
  businessName: string;
  businessType: string;
  reviews: Array<{
    stars: number;
    text: string;
    publishedAtDate: string;
    name?: string;
    [key: string]: unknown;
  }>;
  businessContext?: BusinessContext;
}

interface EdgeFunctionResponse {
  data?: any;
  error?: { message: string };
}

// Interface for the actual response from edge function
interface EdgeFunctionRecommendations {
  urgentActions: Array<{
    title: string;
    description: string;
    impact: string;
    effort: string;
  }>;
  growthStrategies: Array<{
    title: string;
    description: string;
    impact: string;
    effort: string;
  }>;
  customerAttractionPlan: {
    title: string;
    description: string;
    strategies: Array<{
      title: string;
      description: string;
      timeline: string;
      cost: string;
      expectedOutcome: string;
    }>;
  };
  competitivePositioning: {
    title: string;
    description: string;
    strengths: string[];
    opportunities: string[];
    recommendations: string[];
  };
  futureProjections: {
    shortTerm: string[];
    longTerm: string[];
  };
}

/**
 * Enhanced Recommendation Service with timeout and better error handling
 */
export class RecommendationService {
  /**
   * Transform edge function response to frontend format
   */
  private transformRecommendations(edgeResponse: EdgeFunctionRecommendations, businessData: BusinessData): Recommendations {
    const transformedRecommendations: Recommendations = {
      businessName: businessData.businessName,
      
      // Transform urgent actions
      urgentActions: edgeResponse.urgentActions.map((action, index) => ({
        id: `urgent-${index}`,
        title: action.title,
        description: action.description,
        category: 'operations',
        timeframe: 'immediate'
      })),
      
      // Transform pattern insights from growth strategies
      patternInsights: edgeResponse.growthStrategies.slice(0, 3).map((strategy, index) => ({
        id: `pattern-${index}`,
        pattern: strategy.title,
        frequency: 1,
        sentiment: 'neutral' as const,
        impact: strategy.impact as 'high' | 'medium' | 'low',
        recommendation: strategy.description,
        examples: []
      })),
      
      // Transform long term strategies
      longTermStrategies: edgeResponse.futureProjections.longTerm.map((projection, index) => ({
        id: `strategy-${index}`,
        name: `Strategy ${index + 1}`,
        description: projection,
        objectives: [projection],
        tactics: [{
          name: 'Implementation',
          description: projection,
          timeline: '1-2 years',
          owner: 'Management',
          kpis: []
        }],
        expectedOutcomes: [projection],
        category: 'growth',
        title: projection,
        riskLevel: 'medium',
        timeframe: 'long_term',
        expectedROI: 'high',
        actions: []
      })),
      
      // Create competitive position from positioning data
      competitivePosition: {
        overview: edgeResponse.competitivePositioning.description,
        competitors: [],
        strengthsWeaknesses: {
          strengths: edgeResponse.competitivePositioning.strengths,
          weaknesses: [],
          opportunities: edgeResponse.competitivePositioning.opportunities,
          threats: []
        },
        recommendations: edgeResponse.competitivePositioning.recommendations,
        position: 'average' as const,
        metrics: {},
        strengths: edgeResponse.competitivePositioning.strengths,
        weaknesses: [],
        opportunities: edgeResponse.competitivePositioning.opportunities
      },
      
      // Transform customer attraction plan
      customerAttractionPlan: {
        overview: edgeResponse.customerAttractionPlan.description,
        objectives: edgeResponse.customerAttractionPlan.strategies.map(s => s.expectedOutcome),
        tactics: edgeResponse.customerAttractionPlan.strategies.map(strategy => ({
          name: strategy.title,
          description: strategy.description,
          channel: 'multi-channel',
          timeline: strategy.timeline,
          budget: strategy.cost,
          kpis: []
        })),
        budget: {
          total: 'Variable',
          breakdown: {}
        },
        timeline: {
          start: 'Immediate',
          end: 'Ongoing',
          milestones: []
        },
        targetAudiences: {
          primary: [],
          secondary: [],
          untapped: []
        },
        channels: [],
        messaging: {
          uniqueValue: edgeResponse.customerAttractionPlan.title,
          keyPoints: [],
          callToAction: ''
        }
      },
      
      // Create analysis result
      analysis: {
        sentimentAnalysis: [],
        staffMentions: [],
        commonTerms: [],
        overallAnalysis: `${edgeResponse.urgentActions.length} urgent actions identified, ${edgeResponse.growthStrategies.length} growth strategies recommended.`
      },
      
      // Create suggestions from all recommendations
      suggestions: [
        ...edgeResponse.urgentActions.map((action, index) => ({
          category: 'operations' as const,
          priority: action.impact.toLowerCase() as 'high' | 'medium' | 'low',
          title: action.title,
          description: action.description,
          impact: action.impact.toLowerCase() as 'high' | 'medium' | 'low',
          effort: action.effort.toLowerCase() as 'high' | 'medium' | 'low',
          timeframe: 'immediate' as const
        })),
        ...edgeResponse.growthStrategies.map((strategy, index) => ({
          category: 'marketing' as const,
          priority: strategy.impact.toLowerCase() as 'high' | 'medium' | 'low',
          title: strategy.title,
          description: strategy.description,
          impact: strategy.impact.toLowerCase() as 'high' | 'medium' | 'low',
          effort: strategy.effort.toLowerCase() as 'high' | 'medium' | 'low',
          timeframe: 'short_term' as const
        }))
      ],
      
      // Create action plan
      actionPlan: {
        title: 'Comprehensive Business Improvement Plan',
        description: 'A strategic roadmap based on AI analysis of customer feedback',
        steps: edgeResponse.urgentActions.slice(0, 3).map((action, index) => ({
          title: action.title,
          description: action.description,
          status: 'pending' as const
        })),
        expectedResults: edgeResponse.futureProjections.shortTerm[0] || 'Improved customer satisfaction and business growth',
        timeframe: 'ongoing' as const
      },
      
      // Transform growth strategies
      growthStrategies: edgeResponse.growthStrategies.map((strategy, index) => ({
        id: `growth-${index}`,
        type: 'operations' as const,
        title: strategy.title,
        description: strategy.description,
        steps: [strategy.description],
        potentialImpact: strategy.impact.toLowerCase() as 'high' | 'medium' | 'low',
        resourceRequirements: strategy.effort.toLowerCase() as 'high' | 'medium' | 'low',
        timeframe: 'short_term' as const,
        category: 'growth',
        expectedImpact: strategy.impact,
        implementation: [strategy.description],
        kpis: []
      }))
    };
    
    return transformedRecommendations;
  }

  /**
   * Generate recommendations using OpenAI via Supabase Edge Function
   */
  async generateRecommendations(businessData: BusinessData): Promise<Recommendations> {
    const apiKey = localStorage.getItem('OPENAI_API_KEY');
    
    if (!apiKey) {
      throw new Error('OpenAI API key is required. Please add it in your browser settings or local storage.');
    }

    if (!businessData.reviews || businessData.reviews.length === 0) {
      throw new Error('No reviews available for analysis');
    }

    logger.info(`Generating recommendations for ${businessData.businessName}`);
    logger.info(`Using ${businessData.reviews.length} reviews for analysis`);
    
    // Log if business context is included
    if (businessData.businessContext) {
      logger.info('Including comprehensive business context in analysis');
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await supabase.functions.invoke('generate-recommendations', {
        body: { 
          businessData,
          apiKey,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal as AbortSignal,
      }) as EdgeFunctionResponse;

      clearTimeout(timeoutId);

      // Check if the function exists (deployment issue)
      if (response.error?.message?.includes('not found') || response.error?.message?.includes('404')) {
        throw new Error('AI recommendation service is not deployed. Please deploy the Supabase edge function using: supabase functions deploy generate-recommendations');
      }

      if (response.error) {
        logger.error('Supabase function error:', response.error);
        
        // Check for common errors
        if (response.error.message?.includes('timeout')) {
          throw new Error('Request timed out. The AI service is taking too long to respond. Please try again.');
        }
        
        if (response.error.message?.includes('API key')) {
          throw new Error('Invalid OpenAI API key. Please check your API key in AI Settings.');
        }
        
        throw new Error(`Failed to generate recommendations: ${response.error.message}`);
      }

      if (!response.data) {
        throw new Error('No data returned from recommendation service');
      }

      // Handle both success and error responses from edge function
      if (response.data && typeof response.data === 'object' && 'error' in response.data) {
        const errorData = response.data as { error: string; fallback?: EdgeFunctionRecommendations };
        logger.warn('Edge function returned error, using fallback:', errorData.error);
        
        // Provide more helpful error messages
        if (errorData.error.includes('401') || errorData.error.includes('Unauthorized')) {
          throw new Error('Invalid OpenAI API key. Please check your API key in AI Settings.');
        }
        
        if (errorData.error.includes('429')) {
          throw new Error('OpenAI rate limit exceeded. Please wait a moment and try again.');
        }
        
        if (errorData.error.includes('500') || errorData.error.includes('503')) {
          throw new Error('OpenAI service is temporarily unavailable. Please try again later.');
        }
        
        // Return fallback recommendations if available
        if (errorData.fallback) {
          return this.transformRecommendations(errorData.fallback, businessData);
        }
        
        throw new Error(errorData.error);
      }

      logger.info('Successfully generated AI recommendations');
      return this.transformRecommendations(response.data as EdgeFunctionRecommendations, businessData);

    } catch (error: unknown) {
      clearTimeout(timeoutId);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      
      // Handle abort/timeout
      if (errorName === 'AbortError' || errorMessage?.includes('aborted')) {
        throw new Error('Request timed out after 30 seconds. Please check your internet connection and try again.');
      }
      
      // Network errors
      if (errorMessage?.includes('Failed to fetch') || errorMessage?.includes('Network')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      
      logger.error('Recommendation generation failed:', error);
      throw error;
    }
  }

  /**
   * Save recommendations to database
   */
  async saveRecommendations(businessName: string, _recommendations: Recommendations): Promise<void> {
    try {
      // This would save to your saved_recommendations table
      logger.info(`Saving recommendations for ${businessName}`);
      // Implementation depends on your database schema
    } catch (error) {
      logger.error('Failed to save recommendations:', error);
      throw error;
    }
  }

  /**
   * Export recommendations as text
   */
  exportRecommendations(businessName: string, recommendations: Recommendations): string {
    const timestamp = new Date().toLocaleDateString();
    
    return `
# Business Recommendations for ${businessName}
Generated on: ${timestamp}

## Urgent Actions
${recommendations.urgentActions?.map(action => `• ${action.title}: ${action.description}`).join('\n') || 'No urgent actions needed.'}

## Growth Strategies  
${recommendations.growthStrategies?.map(strategy => `• ${strategy.title}: ${strategy.description}`).join('\n') || 'No growth strategies available.'}

## Marketing Plan
${recommendations.customerAttractionPlan?.tactics?.map(tactic => `• ${tactic.name}: ${tactic.description}`).join('\n') || 'No marketing plans available.'}

## Competitive Analysis
${recommendations.competitivePosition?.recommendations?.map(insight => `• ${insight}`).join('\n') || 'No competitive insights available.'}
    `.trim();
  }
}

// Export singleton instance
export const recommendationService = new RecommendationService();
