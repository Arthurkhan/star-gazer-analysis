import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { businessData, apiKey } = await req.json()
    
    if (!apiKey) {
      throw new Error('OpenAI API key is required')
    }

    if (!businessData || !businessData.reviews || businessData.reviews.length === 0) {
      throw new Error('Business data with reviews is required')
    }

    console.log(`Generating recommendations for ${businessData.businessName || 'Unknown Business'}`)
    console.log(`Processing ${businessData.reviews.length} reviews`)

    // Prepare data for OpenAI
    const reviewsSummary = businessData.reviews.slice(0, 50).map(review => ({
      rating: review.stars,
      text: review.text || review.textTranslated,
      date: review.publishedAtDate || review.publishedatdate
    }))

    const businessInfo = {
      name: businessData.businessName,
      type: businessData.businessType || 'business',
      totalReviews: businessData.reviews.length,
      averageRating: businessData.reviews.reduce((sum, r) => sum + (r.stars || 0), 0) / businessData.reviews.length
    }

    // OpenAI API call
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Cost-effective model
        messages: [
          {
            role: 'system',
            content: `You are a business consultant analyzing customer reviews for ${businessInfo.name}, a ${businessInfo.type}. 
            Analyze the provided review data and return JSON with exactly these fields:
            {
              "urgentActions": ["action1", "action2", "action3"],
              "growthStrategies": ["strategy1", "strategy2", "strategy3"],
              "marketingPlan": ["plan1", "plan2", "plan3"],
              "competitiveAnalysis": ["insight1", "insight2", "insight3"]
            }
            Base your recommendations on the actual review content, ratings, and patterns you observe.
            Be specific and actionable for a ${businessInfo.type} business.`
          },
          {
            role: 'user',
            content: JSON.stringify({
              businessInfo,
              recentReviews: reviewsSummary
            })
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
        temperature: 0.7
      })
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()
      console.error('OpenAI API error:', errorData)
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }

    const openaiData = await openaiResponse.json()
    const recommendations = JSON.parse(openaiData.choices[0].message.content)

    console.log('Successfully generated recommendations via OpenAI')

    return new Response(
      JSON.stringify(recommendations),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in generate-recommendations function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        fallback: {
          urgentActions: ["Review API configuration", "Check data quality", "Verify business information"],
          growthStrategies: ["Improve customer service", "Enhance product quality", "Expand marketing reach"],
          marketingPlan: ["Social media engagement", "Customer feedback program", "Local community involvement"],
          competitiveAnalysis: ["Monitor competitor reviews", "Identify service gaps", "Benchmark performance"]
        }
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})