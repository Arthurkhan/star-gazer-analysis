import { supabase } from '@/integrations/supabase/client'
import type { Recommendations } from '@/types/recommendations'
import { logger } from '@/utils/logger'

export interface BusinessData {
  businessName: string;
  businessType: string;
  reviews: any[];
}

/**
 * Generate recommendations using OpenAI via Supabase Edge Function
 *
 * @param businessData - The business data including reviews
 * @returns Promise<Recommendations> - Generated recommendations
 * @throws Error if API key is missing or generation fails
 */
export const generateRecommendations = async (businessData: BusinessData): Promise<Recommendations> => {
  const apiKey = localStorage.getItem('OPENAI_API_KEY')

  if (!apiKey) {
    throw new Error('OpenAI API key is required. Please add it in your browser settings or local storage.')
  }

  if (!businessData.reviews || businessData.reviews.length === 0) {
    throw new Error('No reviews available for analysis')
  }

  logger.info('recommendations', `Generating recommendations for ${businessData.businessName}`)
  logger.info('recommendations', `Using ${businessData.reviews.length} reviews for analysis`)

  try {
    const response = await supabase.functions.invoke('generate-recommendations', {
      body: {
        businessData,
        apiKey,
      },
    })

    if (response.error) {
      logger.error('recommendations', 'Supabase function error:', response.error)
      throw new Error(`Failed to generate recommendations: ${response.error.message}`)
    }

    if (!response.data) {
      throw new Error('No data returned from recommendation service')
    }

    // Handle both success and error responses from edge function
    if (response.data.error) {
      logger.warn('recommendations', 'Edge function returned error, using fallback:', response.data.error)
      return response.data.fallback
    }

    logger.info('recommendations', 'Successfully generated AI recommendations')
    return response.data

  } catch (error) {
    logger.error('recommendations', 'Recommendation generation failed:', error)
    throw new Error(`Recommendation generation failed: ${error.message}`)
  }
}

/**
 * Save recommendations to database
 *
 * @param businessName - Name of the business
 * @param recommendations - Recommendations to save
 * @returns Promise<void>
 * @throws Error if save operation fails
 */
export const saveRecommendations = async (businessName: string, recommendations: Recommendations): Promise<void> => {
  try {
    logger.info('recommendations', `Saving recommendations for ${businessName}`)
    // Implementation depends on your database schema
    // This can be implemented when the saved_recommendations table is ready
  } catch (error) {
    logger.error('recommendations', 'Failed to save recommendations:', error)
    throw error
  }
}

/**
 * Export recommendations as formatted text
 *
 * @param businessName - Name of the business
 * @param recommendations - Recommendations to export
 * @returns string - Formatted text export
 */
export const exportRecommendations = (businessName: string, recommendations: Recommendations): string => {
  const timestamp = new Date().toLocaleDateString()

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
    `.trim()
}

/**
 * Get latest recommendation for a business
 *
 * @param businessId - ID of the business
 * @returns Promise<any | null> - Latest recommendation or null
 */
export const getLatestRecommendation = async (businessId: string): Promise<any | null> => {
  try {
    logger.info('recommendations', `Fetching latest recommendation for business ${businessId}`)

    const { data, error } = await supabase
      .from('saved_recommendations')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      logger.error('recommendations', 'Error fetching recommendation:', error)
      return null
    }

    if (!data || data.length === 0) {
      logger.info('recommendations', `No recommendations found for business ${businessId}`)
      return null
    }

    logger.info('recommendations', `Found recommendation for business ${businessId}`)
    return data[0]
  } catch (error) {
    logger.error('recommendations', 'Failed to fetch latest recommendation:', error)
    return null
  }
}

/**
 * Save a recommendation to the database
 *
 * @param businessId - ID of the business
 * @param recommendations - Recommendations to save
 * @returns Promise<boolean> - Success status
 */
export const saveRecommendationToDb = async (businessId: string, recommendations: Recommendations): Promise<boolean> => {
  try {
    logger.info('recommendations', `Saving recommendation for business ${businessId}`)

    // Add timestamp to recommendations
    const recommendationWithTimestamp = {
      ...recommendations,
      lastUpdated: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('saved_recommendations')
      .insert({
        business_id: businessId,
        recommendations: recommendationWithTimestamp,
        created_at: new Date().toISOString(),
      })

    if (error) {
      logger.error('recommendations', 'Error saving recommendation:', error)
      return false
    }

    logger.info('recommendations', `Recommendation saved successfully for business ${businessId}`)
    return true
  } catch (error) {
    logger.error('recommendations', 'Failed to save recommendation:', error)
    return false
  }
}
