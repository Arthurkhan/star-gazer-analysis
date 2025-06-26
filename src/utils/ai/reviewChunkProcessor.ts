
// This file handles processing of reviews in the Edge Function
import { supabase } from '@/integrations/supabase/client'

// Process reviews with the Edge Function
export async function analyzeReviewChunk(
  reviews: any[],
  provider: string,
  model: string,
  totalReviewCount: number,
  fullAnalysis: boolean,
): Promise<any> {
  console.log(`Calling Edge Function to analyze ${reviews.length} reviews with ${provider}`)

  try {
    // Call the Edge Function instead of making direct API calls
    const { data, error } = await supabase.functions.invoke('analyze-reviews', {
      body: {
        reviews,
        provider,
        model,
        fullAnalysis,
      },
    })

    if (error) {
      console.error('Edge Function error:', error)
      throw new Error(`Edge Function error: ${error.message}`)
    }

    console.log('AI Analysis Results:', data)

    // Return the analysis in the expected format
    return {
      sentimentAnalysis: data.sentimentAnalysis || [],
      staffMentions: data.staffMentions || [],
      commonTerms: data.commonTerms || [],
      overallAnalysis: data.overallAnalysis || '',
      ratingBreakdown: data.ratingBreakdown || [],
      languageDistribution: data.languageDistribution || [],
      provider: data.provider || provider,
      model: data.model || model,
    }
  } catch (error) {
    console.error('Error calling Edge Function:', error)
    throw error
  }
}
