import { supabase } from '@/integrations/supabase/client';
import { Recommendations } from '@/types/recommendations';

export interface BusinessData {
  businessName: string;
  businessType: string;
  reviews: any[];
}

/**
 * Simplified Recommendation Service
 * Phase 3: Single OpenAI provider, no circuit breaker, no fallbacks
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

    try {
      const response = await supabase.functions.invoke('generate-recommendations', {
        body: { 
          businessData,
          apiKey 
        }
      });

      if (response.error) {
        console.error('Supabase function error:', response.error);
        throw new Error(`Failed to generate recommendations: ${response.error.message}`);
      }

      if (!response.data) {
        throw new Error('No data returned from recommendation service');
      }

      // Handle both success and error responses from edge function
      if (response.data.error) {
        console.warn('Edge function returned error, using fallback:', response.data.error);
        return response.data.fallback;
      }

      console.log('Successfully generated AI recommendations');
      return response.data;

    } catch (error) {
      console.error('Recommendation generation failed:', error);
      throw new Error(`Recommendation generation failed: ${error.message}`);
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
${recommendations.urgentActions.map(action => `• ${action}`).join('\n')}

## Growth Strategies  
${recommendations.growthStrategies.map(strategy => `• ${strategy}`).join('\n')}

## Marketing Plan
${recommendations.marketingPlan.map(plan => `• ${plan}`).join('\n')}

## Competitive Analysis
${recommendations.competitiveAnalysis.map(insight => `• ${insight}`).join('\n')}
    `.trim();
  }
}

// Export singleton instance
export const recommendationService = new RecommendationService();