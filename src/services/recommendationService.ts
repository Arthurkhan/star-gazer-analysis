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
  data?: Recommendations | { error: string; fallback?: Recommendations };
  error?: { message: string };
}

/**
 * Enhanced Recommendation Service with timeout and better error handling
 */
export class RecommendationService {
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
      const response = await supabase.functions.invoke<Recommendations | { error: string; fallback?: Recommendations }>('generate-recommendations', {
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
        const errorData = response.data as { error: string; fallback?: Recommendations };
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
          return errorData.fallback;
        }
        
        throw new Error(errorData.error);
      }

      logger.info('Successfully generated AI recommendations');
      return response.data as Recommendations;

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
${recommendations.urgentActions?.map(action => `• ${action}`).join('\n') || 'No urgent actions needed.'}

## Growth Strategies  
${recommendations.growthStrategies?.map(strategy => `• ${strategy}`).join('\n') || 'No growth strategies available.'}

## Marketing Plan
${recommendations.marketingPlan?.map(plan => `• ${plan}`).join('\n') || 'No marketing plans available.'}

## Competitive Analysis
${recommendations.competitiveAnalysis?.map(insight => `• ${insight}`).join('\n') || 'No competitive insights available.'}
    `.trim();
  }
}

// Export singleton instance
export const recommendationService = new RecommendationService();
