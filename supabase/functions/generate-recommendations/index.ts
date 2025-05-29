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
    
    // Log if business context is provided
    if (businessData.businessContext) {
      console.log('Using comprehensive business context for enhanced recommendations')
    }

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

    // Build comprehensive context from BusinessContext if available
    let contextualInfo = ''
    if (businessData.businessContext) {
      const ctx = businessData.businessContext
      
      contextualInfo = `
BUSINESS CONTEXT:
${ctx.location ? `Location: ${ctx.location.city}, ${ctx.location.country}${ctx.location.neighborhood ? `, ${ctx.location.neighborhood}` : ''}` : ''}
${ctx.operatingDays?.length ? `Operating Days: ${ctx.operatingDays.join(', ')}` : ''}
${ctx.peakHours ? `Peak Hours: ${ctx.peakHours}` : ''}
${ctx.averageTransaction ? `Average Transaction: ${ctx.averageTransaction}` : ''}
${ctx.seatingCapacity ? `Seating Capacity: ${ctx.seatingCapacity}` : ''}
${ctx.priceRange ? `Price Range: ${ctx.priceRange}` : ''}
${ctx.specialties?.length ? `Specialties: ${ctx.specialties.join(', ')}` : ''}
${ctx.customerTypes?.length ? `Target Customers: ${ctx.customerTypes.join(', ')}` : ''}
${ctx.mainCompetitors?.length ? `Main Competitors: ${ctx.mainCompetitors.join(', ')}` : ''}
${ctx.uniqueSellingPoints?.length ? `Unique Selling Points: ${ctx.uniqueSellingPoints.join(', ')}` : ''}
${ctx.onlinePresence ? `Online Presence: ${Object.entries(ctx.onlinePresence).filter(([k, v]) => v && k !== 'deliveryApps').map(([k]) => k).join(', ')}` : ''}
${ctx.onlinePresence?.deliveryApps?.length ? `Delivery Apps: ${ctx.onlinePresence.deliveryApps.join(', ')}` : ''}
${ctx.currentChallenges?.length ? `Current Challenges: ${ctx.currentChallenges.join(', ')}` : ''}
${ctx.businessGoals ? `Business Goals: ${ctx.businessGoals}` : ''}
${ctx.additionalContext ? `Additional Context: ${ctx.additionalContext}` : ''}
`.trim()
    }

    // Build the system prompt with enhanced context
    const systemPrompt = `You are a business consultant analyzing customer reviews for ${businessInfo.name}, a ${businessInfo.type}. 

${contextualInfo ? contextualInfo + '\n' : ''}

Based on the review data and business context provided, generate specific, actionable recommendations. Consider:
- The business's unique characteristics, location, and target market
- Current challenges and business goals
- Competitive landscape and unique selling points
- Online presence and operational details
- Cultural and regional factors based on location

Return JSON with exactly these fields:
{
  "urgentActions": ["action1", "action2", "action3"],
  "growthStrategies": ["strategy1", "strategy2", "strategy3"],
  "marketingPlan": ["plan1", "plan2", "plan3"],
  "competitiveAnalysis": ["insight1", "insight2", "insight3"]
}

Make recommendations highly specific to this business's context, challenges, and goals. Be practical and actionable.`

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
            content: systemPrompt
          },
          {
            role: 'user',
            content: JSON.stringify({
              businessInfo,
              recentReviews: reviewsSummary,
              hasBusinessContext: !!businessData.businessContext
            })
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500, // Increased for more detailed recommendations
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

    console.log('Successfully generated context-aware recommendations via OpenAI')

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