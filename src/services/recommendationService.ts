import { supabase } from '@/integrations/supabase/client';
import { Recommendations } from '@/types/recommendations';
import { BusinessContext } from '@/utils/businessContext';

export interface BusinessData {
  businessName: string;
  businessType: string;
  reviews: any[];
  businessContext?: BusinessContext; // Add BusinessContext to the interface
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

    console.log(`Generating recommendations for ${businessData.businessName}`);
    console.log(`Using ${businessData.reviews.length} reviews for analysis`);
    
    // Log if business context is included
    if (businessData.businessContext) {
      console.log('Including comprehensive business context in analysis');
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await supabase.functions.invoke('generate-recommendations', {
        body: { 
          businessData,
          apiKey 
        },
        // @ts-ignore - Supabase types don't include signal yet
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Check if the function exists (deployment issue)
      if (response.error?.message?.includes('not found') || response.error?.message?.includes('404')) {
        throw new Error('AI recommendation service is not deployed. Please deploy the Supabase edge function using: supabase functions deploy generate-recommendations');
      }

      if (response.error) {
        console.error('Supabase function error:', response.error);
        
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
      if (response.data.error) {
        console.warn('Edge function returned error, using fallback:', response.data.error);
        
        // Provide more helpful error messages
        if (response.data.error.includes('401') || response.data.error.includes('Unauthorized')) {
          throw new Error('Invalid OpenAI API key. Please check your API key in AI Settings.');
        }
        
        if (response.data.error.includes('429')) {
          throw new Error('OpenAI rate limit exceeded. Please wait a moment and try again.');
        }
        
        if (response.data.error.includes('500') || response.data.error.includes('503')) {
          throw new Error('OpenAI service is temporarily unavailable. Please try again later.');
        }
        
        // Return fallback recommendations if available
        if (response.data.fallback) {
          return response.data.fallback;
        }
        
        throw new Error(response.data.error);
      }

      console.log('Successfully generated AI recommendations');
      return response.data;

    } catch (error: any) {
      clearTimeout(timeoutId);
      
      // Handle abort/timeout
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        throw new Error('Request timed out after 30 seconds. Please check your internet connection and try again.');
      }
      
      // Network errors
      if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      
      console.error('Recommendation generation failed:', error);
      throw error;
    }
  }

  /**
   * Save recommendations to database
   */
  async saveRecommendations(businessName: string, recommendations: Recommendations): Promise<void> {
    try {
      // This would save to your saved_recommendations table
      console.log(`Saving recommendations for ${businessName}`);
      // Implementation depends on your database schema
    } catch (error) {
      console.error('Failed to save recommendations:', error);
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
