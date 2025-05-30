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

    // Build the enhanced system prompt
    const systemPrompt = `You are an expert business consultant analyzing customer reviews for ${businessInfo.name}, a ${businessInfo.type}. 

${contextualInfo ? contextualInfo + '\n' : ''}

Based on the review data and business context provided, generate creative, specific, and actionable recommendations. Your tone should be professional but friendly, using engaging language that inspires action.

Return JSON with exactly this structure:
{
  "urgentActions": [
    {
      "title": "Clear, action-oriented title (e.g., 'Transform Negative Reviews into Loyalty')",
      "description": "2-3 sentences explaining what to do, why it matters, and the expected impact. Be specific and engaging.",
      "impact": "High|Medium|Low",
      "effort": "High|Medium|Low"
    }
  ],
  "growthStrategies": [
    {
      "title": "Strategic initiative title (e.g., 'Launch VIP Experience Program')",
      "description": "Detailed explanation of the strategy, implementation approach, and expected outcomes. Make it exciting and achievable.",
      "impact": "High|Medium|Low",
      "effort": "High|Medium|Low"
    }
  ],
  "customerAttractionPlan": {
    "title": "Creative marketing plan name (e.g., 'The Neighborhood Ambassador Strategy')",
    "description": "Brief overview of the marketing approach",
    "strategies": [
      {
        "title": "Specific tactic (e.g., 'Instagram Story Takeovers')",
        "description": "How to implement this tactic and why it will work for this specific business",
        "timeline": "e.g., '2 weeks to launch'",
        "cost": "e.g., '$200/month'",
        "expectedOutcome": "What results to expect"
      }
    ]
  },
  "competitivePositioning": {
    "title": "Your Competitive Edge",
    "description": "Overview of market position",
    "strengths": ["Unique strength 1", "Unique strength 2", "etc"],
    "opportunities": ["Market opportunity 1", "Market opportunity 2", "etc"],
    "recommendations": ["How to leverage strengths", "How to capture opportunities", "etc"]
  },
  "futureProjections": {
    "shortTerm": ["3-6 month projection with specific metrics", "Another projection", "etc"],
    "longTerm": ["1-2 year vision with growth targets", "Another projection", "etc"]
  }
}

Requirements:
- Generate AT LEAST 5 items for urgentActions and growthStrategies
- Generate AT LEAST 4 strategies in customerAttractionPlan
- Make titles catchy and action-oriented, not generic
- Descriptions should provide real value, not repeat the title
- Use conversational but professional language
- Include specific examples relevant to the business type
- Consider cultural and regional factors
- Be optimistic and solution-focused
- Avoid corporate jargon - be clear and inspiring`

    // OpenAI API call
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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
        max_tokens: 2500, // Increased for more detailed recommendations
        temperature: 0.8 // Slightly higher for more creative responses
      })
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()
      console.error('OpenAI API error:', errorData)
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }

    const openaiData = await openaiResponse.json()
    const recommendations = JSON.parse(openaiData.choices[0].message.content)

    console.log('Successfully generated enhanced recommendations via OpenAI')

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
          urgentActions: [
            {
              title: "Enhance Customer Response Time",
              description: "Implement a system to respond to all reviews within 24 hours. This shows customers you care and can turn negative experiences into positive ones.",
              impact: "High",
              effort: "Low"
            },
            {
              title: "Create a Staff Recognition Program",
              description: "Celebrate employees mentioned positively in reviews. This boosts morale and encourages excellent service across the team.",
              impact: "High",
              effort: "Medium"
            },
            {
              title: "Address Common Pain Points",
              description: "Analyze negative feedback patterns and create action plans for the top 3 issues. Quick wins here can dramatically improve ratings.",
              impact: "High",
              effort: "Medium"
            },
            {
              title: "Implement Real-Time Feedback System",
              description: "Set up QR codes or tablets for instant feedback before customers leave. This helps catch issues before they become negative reviews.",
              impact: "Medium",
              effort: "Low"
            },
            {
              title: "Launch a Review Incentive Campaign",
              description: "Encourage satisfied customers to share their experiences with small incentives. This can boost your review volume and overall rating.",
              impact: "High",
              effort: "Low"
            }
          ],
          growthStrategies: [
            {
              title: "Build a Community Ambassador Program",
              description: "Recruit your most loyal customers as brand ambassadors. Give them exclusive perks and early access to new offerings in exchange for spreading the word.",
              impact: "High",
              effort: "Medium"
            },
            {
              title: "Create Instagrammable Moments",
              description: "Design specific areas or experiences that customers will want to photograph and share. This creates free marketing and attracts new visitors.",
              impact: "High",
              effort: "Medium"
            },
            {
              title: "Launch Limited-Time Experiences",
              description: "Introduce seasonal or monthly special events that create urgency and give customers reasons to return frequently.",
              impact: "Medium",
              effort: "Medium"
            },
            {
              title: "Partner with Local Influencers",
              description: "Collaborate with micro-influencers in your area for authentic content creation. Their followers trust their recommendations.",
              impact: "High",
              effort: "Low"
            },
            {
              title: "Develop a Signature Experience",
              description: "Create something unique that only your business offers. This becomes your calling card and differentiates you from competitors.",
              impact: "High",
              effort: "High"
            }
          ],
          customerAttractionPlan: {
            title: "The Magnetism Strategy",
            description: "A multi-channel approach to attract and retain customers",
            strategies: [
              {
                title: "Social Media Storytelling",
                description: "Share behind-the-scenes content and customer stories to build emotional connections",
                timeline: "Start immediately",
                cost: "$100-300/month",
                expectedOutcome: "20% increase in social engagement within 2 months"
              },
              {
                title: "Neighborhood Partnership Network",
                description: "Cross-promote with complementary local businesses to expand reach",
                timeline: "2 weeks to establish",
                cost: "Time investment only",
                expectedOutcome: "15% new customer acquisition"
              },
              {
                title: "First-Timer Welcome Program",
                description: "Create special offers and experiences for new customers to ensure great first impressions",
                timeline: "1 week to launch",
                cost: "5-10% discount cost",
                expectedOutcome: "30% conversion to repeat customers"
              },
              {
                title: "Digital Word-of-Mouth Campaign",
                description: "Encourage and facilitate online sharing with hashtags and photo opportunities",
                timeline: "Ongoing",
                cost: "$50-100/month",
                expectedOutcome: "Increased organic reach by 25%"
              }
            ]
          },
          competitivePositioning: {
            title: "Your Unique Market Position",
            description: "Leveraging your strengths to stand out",
            strengths: [
              "Strong customer loyalty base",
              "Unique atmosphere and ambiance",
              "Quality products/services",
              "Experienced team"
            ],
            opportunities: [
              "Growing local market demand",
              "Untapped customer segments",
              "Digital presence expansion",
              "Partnership possibilities"
            ],
            recommendations: [
              "Double down on what makes you unique",
              "Fill service gaps competitors miss",
              "Build stronger emotional connections with customers",
              "Leverage technology for better customer experience"
            ]
          },
          futureProjections: {
            shortTerm: [
              "25% increase in positive reviews within 3 months",
              "15% growth in repeat customer rate",
              "20% improvement in average transaction value",
              "30% boost in social media following"
            ],
            longTerm: [
              "Establish as the go-to destination in your category locally",
              "Expand customer base by 40% within 18 months",
              "Launch 2-3 new revenue streams",
              "Build a recognizable brand beyond immediate area"
            ]
          }
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