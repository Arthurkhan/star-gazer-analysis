import { supabase } from '@/integrations/supabase/client';
import { Recommendations, RecommendationMetadata } from '@/types/recommendations';
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
  data?: unknown;
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
  metadata?: RecommendationMetadata;
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
        impact: (strategy.impact?.toLowerCase() || 'medium') as 'high' | 'medium' | 'low',
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
        ...edgeResponse.urgentActions.map((action) => ({
          category: 'operations' as const,
          priority: (action.impact?.toLowerCase() || 'medium') as 'high' | 'medium' | 'low',
          title: action.title,
          description: action.description,
          impact: (action.impact?.toLowerCase() || 'medium') as 'high' | 'medium' | 'low',
          effort: (action.effort?.toLowerCase() || 'medium') as 'high' | 'medium' | 'low',
          timeframe: 'immediate' as const
        })),
        ...edgeResponse.growthStrategies.map((strategy) => ({
          category: 'marketing' as const,
          priority: (strategy.impact?.toLowerCase() || 'medium') as 'high' | 'medium' | 'low',
          title: strategy.title,
          description: strategy.description,
          impact: (strategy.impact?.toLowerCase() || 'medium') as 'high' | 'medium' | 'low',
          effort: (strategy.effort?.toLowerCase() || 'medium') as 'high' | 'medium' | 'low',
          timeframe: 'short_term' as const
        }))
      ],
      
      // Create action plan
      actionPlan: {
        title: 'Comprehensive Business Improvement Plan',
        description: 'A strategic roadmap based on AI analysis of customer feedback',
        steps: edgeResponse.urgentActions.slice(0, 3).map((action) => ({
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
        potentialImpact: (strategy.impact?.toLowerCase() || 'medium') as 'high' | 'medium' | 'low',
        resourceRequirements: (strategy.effort?.toLowerCase() || 'medium') as 'high' | 'medium' | 'low',
        timeframe: 'short_term' as const,
        category: 'growth',
        expectedImpact: strategy.impact,
        implementation: [strategy.description],
        kpis: []
      })),
      
      // Include metadata if available
      metadata: edgeResponse.metadata
    };
    
    return transformedRecommendations;
  }

  /**
   * Test edge function connectivity
   */
  async testEdgeFunction(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      logger.info('Testing edge function connectivity...');
      
      // Create test data that matches the exact format expected by the edge function
      const testData = {
        businessData: {
          businessName: 'Test Business',
          businessType: 'test',
          reviews: [
            {
              stars: 5,
              text: 'Great service! Very happy with my experience.',
              publishedAtDate: new Date().toISOString(),
              name: 'Test User'
            },
            {
              stars: 4,
              text: 'Good food but service could be faster.',
              publishedAtDate: new Date().toISOString(),
              name: 'Another User'
            },
            {
              stars: 3,
              text: 'Average experience, nothing special.',
              publishedAtDate: new Date().toISOString(),
              name: 'Third User'
            }
          ]
        },
        provider: 'openai',
        apiKey: 'test-key-for-edge-function-testing', // Use a test key
        model: 'gpt-3.5-turbo'
      };

      logger.info('Sending test request:', JSON.stringify(testData, null, 2));

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(testData)
      });

      const responseData = await response.json();
      logger.info('Edge function test response:', responseData);

      if (!responseData) {
        return {
          success: false,
          message: 'No response from edge function'
        };
      }
      
      // Check if it's a fallback response (which means the edge function is working)
      if (responseData.fallback) {
        return {
          success: true,
          message: 'Edge function is deployed and responding correctly! It returned a fallback response as expected for test data.',
          data: responseData
        };
      }

      // If we got actual recommendations, that's also good
      if (responseData.urgentActions && responseData.growthStrategies) {
        return {
          success: true,
          message: 'Edge function is working and returned recommendations!',
          data: responseData
        };
      }

      return {
        success: false,
        message: 'Unexpected response format from edge function',
        data: responseData
      };

    } catch (error) {
      logger.error('Edge function test failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        return {
          success: false,
          message: 'Edge function not found. Please deploy it using: supabase functions deploy generate-recommendations'
        };
      }
      
      return {
        success: false,
        message: `Edge function test failed: ${errorMessage}`
      };
    }
  }

  /**
   * Generate recommendations using AI via Supabase Edge Function
   */
  async generateRecommendations(businessData: BusinessData): Promise<Recommendations> {
    // Get the selected provider and API key
    const provider = localStorage.getItem('AI_PROVIDER') || 'openai';
    const apiKey = localStorage.getItem(`${provider.toUpperCase()}_API_KEY`);
    const model = localStorage.getItem(`${provider.toUpperCase()}_MODEL`);
    
    if (!apiKey) {
      throw new Error(`${provider} API key is required. Please add it in AI Settings.`);
    }

    if (!businessData.reviews || businessData.reviews.length === 0) {
      throw new Error('No reviews available for analysis');
    }

    logger.info(`Generating recommendations for ${businessData.businessName}`);
    logger.info(`Using ${provider} with model ${model || 'default'}`);
    logger.info(`Using ${businessData.reviews.length} reviews for analysis`);
    
    // Log if business context is included
    if (businessData.businessContext) {
      logger.info('Including comprehensive business context in analysis');
    }

    // Ensure all required fields are present in businessData
    const requestBody = {
      businessData: {
        businessName: businessData.businessName,
        businessType: businessData.businessType,
        reviews: businessData.reviews.map(review => ({
          stars: review.stars || 0,
          text: review.text || '',
          publishedAtDate: review.publishedAtDate || new Date().toISOString(),
          name: review.name || 'Anonymous'
        })),
        businessContext: businessData.businessContext
      },
      provider,
      apiKey,
      model: model || undefined
    };

    logger.info('Sending request to edge function...');
    logger.info('Request body structure:', {
      hasBusinessData: !!requestBody.businessData,
      businessName: requestBody.businessData.businessName,
      businessType: requestBody.businessData.businessType,
      reviewCount: requestBody.businessData.reviews.length,
      provider: requestBody.provider,
      hasApiKey: !!requestBody.apiKey,
      model: requestBody.model
    });

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout

    try {
      // Use direct fetch instead of supabase.functions.invoke to ensure proper body handling
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseData = await response.json();

      // Debug logging
      logger.info('Raw edge function response:', responseData);
      if (responseData) {
        logger.info('Response data type:', typeof responseData);
        logger.info('Response data keys:', Object.keys(responseData));
      }

      // The edge function now returns 200 status always, so check the response data
      if (!responseData) {
        throw new Error('No data returned from recommendation service');
      }

      // Check if it's an error response with fallback
      if (responseData.error && responseData.fallback) {
        logger.warn('Edge function returned error, using fallback:', responseData.error);
        
        // Log whether we're using fallback
        logger.info('🔄 Using FALLBACK recommendations (not AI-generated)');
        logger.info(`Fallback reason: ${responseData.error}`);
        
        // Provide more helpful error messages
        if (responseData.error.includes('401') || responseData.error.includes('Invalid API key')) {
          throw new Error(`Invalid ${provider} API key. Please check your API key in AI Settings.`);
        }
        
        if (responseData.error.includes('429') || responseData.error.includes('Rate limit')) {
          throw new Error(`${provider} rate limit exceeded. Please wait a moment and try again.`);
        }
        
        if (responseData.error.includes('500') || responseData.error.includes('503')) {
          logger.info(`${provider} service is temporarily unavailable, using fallback recommendations`);
          return this.transformRecommendations(responseData.fallback, businessData);
        }
        
        // For "Invalid request format", log more details
        if (responseData.error.includes('Invalid request format')) {
          logger.error('Invalid request format error. This usually means the edge function needs to be redeployed.');
          logger.error('Run: supabase functions deploy generate-recommendations');
        }
        
        // Use fallback recommendations for other errors
        logger.info('Using fallback recommendations due to API error');
        return this.transformRecommendations(responseData.fallback, businessData);
      }

      // Check if response has the expected structure
      if (!responseData.urgentActions || !responseData.growthStrategies) {
        logger.error('Invalid response structure:', responseData);
        throw new Error('Invalid response format from recommendation service');
      }

      // Log whether we're using AI or fallback
      if (responseData.metadata?.source) {
        const source = responseData.metadata.source;
        const providerName = responseData.metadata.provider || provider;
        const modelName = responseData.metadata.model || model || 'Unknown';
        
        if (source === 'openai' || source === 'claude' || source === 'gemini') {
          logger.info(`✅ Successfully generated AI recommendations using ${providerName}`);
          logger.info(`Model: ${modelName}`);
          if (responseData.metadata.responseTime) {
            logger.info(`Response time: ${responseData.metadata.responseTime}ms`);
          }
        } else if (source === 'fallback') {
          logger.info('🔄 Using FALLBACK recommendations');
          if (responseData.metadata.reason) {
            logger.info(`Reason: ${responseData.metadata.reason}`);
          }
        }
      }

      // Otherwise it's a success response with recommendations
      return this.transformRecommendations(responseData as EdgeFunctionRecommendations, businessData);

    } catch (error: unknown) {
      clearTimeout(timeoutId);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      
      // Handle abort/timeout
      if (errorName === 'AbortError' || errorMessage?.includes('aborted')) {
        throw new Error('Request timed out after 45 seconds. Please check your internet connection and try again.');
      }
      
      // Network errors
      if (errorMessage?.includes('Failed to fetch') || errorMessage?.includes('Network')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      
      // Edge function not found
      if (errorMessage?.includes('not found') || errorMessage?.includes('404')) {
        throw new Error('AI recommendation service is not deployed. Please deploy the Supabase edge function using: supabase functions deploy generate-recommendations');
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
