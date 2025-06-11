// @ts-check
/* eslint-disable no-console */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Review {
  stars: number;
  text?: string;
  textTranslated?: string;
  publishedAtDate?: string;
  publishedatdate?: string;
}

interface BusinessContext {
  location?: {
    city: string;
    country: string;
    neighborhood?: string;
  };
  operatingDays?: string[];
  peakHours?: string;
  averageTransaction?: string;
  seatingCapacity?: number;
  priceRange?: string;
  specialties?: string[];
  customerTypes?: string[];
  mainCompetitors?: string[];
  uniqueSellingPoints?: string[];
  onlinePresence?: Record<string, boolean | string[]>;
  currentChallenges?: string[];
  businessGoals?: string;
  additionalContext?: string;
}

interface BusinessData {
  businessName?: string;
  businessType?: string;
  businessContext?: BusinessContext;
  reviews: Review[];
}

// Function to log messages (can be disabled in production)
const log = {
  info: (message: string, ...args: unknown[]) => {
    if (Deno.env.get('DEBUG') === 'true') {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    if (Deno.env.get('DEBUG') === 'true') {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    log.info('Edge function invoked at:', new Date().toISOString());
    
    const { businessData, apiKey } = await req.json();
    log.info('Received request with business:', businessData?.businessName);

    if (!apiKey) {
      log.error('No API key provided');
      throw new Error('OpenAI API key is required');
    }

    if (!businessData || !businessData.reviews || businessData.reviews.length === 0) {
      log.error('Invalid business data:', businessData);
      throw new Error('Business data with reviews is required');
    }

    log.info(`Processing ${businessData.reviews.length} reviews for ${businessData.businessName}`);

    // Log if business context is provided
    if (businessData.businessContext) {
      log.info('Business context provided - using enhanced recommendations');
    }

    // Prepare data for OpenAI
    const reviewsSummary = businessData.reviews.slice(0, 50).map((review: Review) => ({
      rating: review.stars,
      text: review.text || review.textTranslated || '',
      date: review.publishedAtDate || review.publishedatdate || '',
    }));

    const businessInfo = {
      name: businessData.businessName,
      type: businessData.businessType || 'business',
      totalReviews: businessData.reviews.length,
      averageRating: businessData.reviews.reduce((sum: number, r: Review) => sum + (r.stars || 0), 0) / businessData.reviews.length,
    };

    // Build comprehensive context from BusinessContext if available
    let contextualInfo = '';
    if (businessData.businessContext) {
      const ctx = businessData.businessContext;

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
${ctx.onlinePresence?.deliveryApps?.length ? `Delivery Apps: ${(ctx.onlinePresence.deliveryApps as string[]).join(', ')}` : ''}
${ctx.currentChallenges?.length ? `Current Challenges: ${ctx.currentChallenges.join(', ')}` : ''}
${ctx.businessGoals ? `Business Goals: ${ctx.businessGoals}` : ''}
${ctx.additionalContext ? `Additional Context: ${ctx.additionalContext}` : ''}
`.trim();
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
- Avoid corporate jargon - be clear and inspiring`;

    log.info('Calling OpenAI API...');
    const startTime = Date.now();

    // OpenAI API call with better error handling
    let openaiResponse;
    try {
      openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo-1106', // Using stable model with JSON mode support
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: JSON.stringify({
                businessInfo,
                recentReviews: reviewsSummary,
                hasBusinessContext: !!businessData.businessContext,
              }),
            },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 3000, // Increased for more detailed recommendations
          temperature: 0.8, // Slightly higher for more creative responses
        }),
      });
    } catch (fetchError: unknown) {
      log.error('Fetch error:', fetchError);
      throw new Error(`Network error calling OpenAI API: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
    }

    const responseTime = Date.now() - startTime;
    log.info(`OpenAI API responded in ${responseTime}ms with status: ${openaiResponse.status}`);

    if (!openaiResponse.ok) {
      // deno-lint-ignore no-explicit-any
      let errorData: any;
      try {
        errorData = await openaiResponse.json();
        log.error('OpenAI API error response:', errorData);
      } catch {
        errorData = await openaiResponse.text();
        log.error('OpenAI API error text:', errorData);
      }
      
      // Check for specific error types
      if (openaiResponse.status === 401) {
        throw new Error('Invalid API key. Please check your OpenAI API key.');
      } else if (openaiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (openaiResponse.status === 404) {
        throw new Error('Model not found. The specified model may not be available.');
      } else {
        throw new Error(`OpenAI API error: ${openaiResponse.status} - ${JSON.stringify(errorData)}`);
      }
    }

    let openaiData;
    try {
      openaiData = await openaiResponse.json();
    } catch (jsonError) {
      log.error('Failed to parse OpenAI response:', jsonError);
      throw new Error('Failed to parse OpenAI response');
    }

    if (!openaiData.choices || !openaiData.choices[0] || !openaiData.choices[0].message) {
      log.error('Invalid OpenAI response structure:', openaiData);
      throw new Error('Invalid response from OpenAI API');
    }

    let recommendations;
    try {
      recommendations = JSON.parse(openaiData.choices[0].message.content);
    } catch (parseError) {
      log.error('Failed to parse recommendations JSON:', parseError);
      log.error('Raw content:', openaiData.choices[0].message.content);
      throw new Error('Failed to parse AI recommendations');
    }

    log.info('Successfully generated recommendations');

    // Always return 200 with success response
    return new Response(
      JSON.stringify(recommendations),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      },
    );

  } catch (error) {
    log.error('Error in generate-recommendations function:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Always return 200 status with error info and fallback
    return new Response(
      JSON.stringify({
        error: errorMessage,
        timestamp: new Date().toISOString(),
        fallback: {
          urgentActions: [
            {
              title: 'Enhance Customer Response Time',
              description: 'Implement a system to respond to all reviews within 24 hours. This shows customers you care and can turn negative experiences into positive ones.',
              impact: 'High',
              effort: 'Low',
            },
            {
              title: 'Create a Staff Recognition Program',
              description: 'Celebrate employees mentioned positively in reviews. This boosts morale and encourages excellent service across the team.',
              impact: 'High',
              effort: 'Medium',
            },
            {
              title: 'Address Common Pain Points',
              description: 'Analyze negative feedback patterns and create action plans for the top 3 issues. Quick wins here can dramatically improve ratings.',
              impact: 'High',
              effort: 'Medium',
            },
            {
              title: 'Implement Real-Time Feedback System',
              description: 'Set up QR codes or tablets for instant feedback before customers leave. This helps catch issues before they become negative reviews.',
              impact: 'Medium',
              effort: 'Low',
            },
            {
              title: 'Launch a Review Incentive Campaign',
              description: 'Encourage satisfied customers to share their experiences with small incentives. This can boost your review volume and overall rating.',
              impact: 'High',
              effort: 'Low',
            },
          ],
          growthStrategies: [
            {
              title: 'Build a Community Ambassador Program',
              description: 'Recruit your most loyal customers as brand ambassadors. Give them exclusive perks and early access to new offerings in exchange for spreading the word.',
              impact: 'High',
              effort: 'Medium',
            },
            {
              title: 'Create Instagrammable Moments',
              description: 'Design specific areas or experiences that customers will want to photograph and share. This creates free marketing and attracts new visitors.',
              impact: 'High',
              effort: 'Medium',
            },
            {
              title: 'Launch Limited-Time Experiences',
              description: 'Introduce seasonal or monthly special events that create urgency and give customers reasons to return frequently.',
              impact: 'Medium',
              effort: 'Medium',
            },
            {
              title: 'Partner with Local Influencers',
              description: 'Collaborate with micro-influencers in your area for authentic content creation. Their followers trust their recommendations.',
              impact: 'High',
              effort: 'Low',
            },
            {
              title: 'Develop a Signature Experience',
              description: 'Create something unique that only your business offers. This becomes your calling card and differentiates you from competitors.',
              impact: 'High',
              effort: 'High',
            },
          ],
          customerAttractionPlan: {
            title: 'The Magnetism Strategy',
            description: 'A multi-channel approach to attract and retain customers',
            strategies: [
              {
                title: 'Social Media Storytelling',
                description: 'Share behind-the-scenes content and customer stories to build emotional connections',
                timeline: 'Start immediately',
                cost: '$100-300/month',
                expectedOutcome: '20% increase in social engagement within 2 months',
              },
              {
                title: 'Neighborhood Partnership Network',
                description: 'Cross-promote with complementary local businesses to expand reach',
                timeline: '2 weeks to establish',
                cost: 'Time investment only',
                expectedOutcome: '15% new customer acquisition',
              },
              {
                title: 'First-Timer Welcome Program',
                description: 'Create special offers and experiences for new customers to ensure great first impressions',
                timeline: '1 week to launch',
                cost: '5-10% discount cost',
                expectedOutcome: '30% conversion to repeat customers',
              },
              {
                title: 'Digital Word-of-Mouth Campaign',
                description: 'Encourage and facilitate online sharing with hashtags and photo opportunities',
                timeline: 'Ongoing',
                cost: '$50-100/month',
                expectedOutcome: 'Increased organic reach by 25%',
              },
            ],
          },
          competitivePositioning: {
            title: 'Your Unique Market Position',
            description: 'Leveraging your strengths to stand out',
            strengths: [
              'Strong customer loyalty base',
              'Unique atmosphere and ambiance',
              'Quality products/services',
              'Experienced team',
            ],
            opportunities: [
              'Growing local market demand',
              'Untapped customer segments',
              'Digital presence expansion',
              'Partnership possibilities',
            ],
            recommendations: [
              'Double down on what makes you unique',
              'Fill service gaps competitors miss',
              'Build stronger emotional connections with customers',
              'Leverage technology for better customer experience',
            ],
          },
          futureProjections: {
            shortTerm: [
              '25% increase in positive reviews within 3 months',
              '15% growth in repeat customer rate',
              '20% improvement in average transaction value',
              '30% boost in social media following',
            ],
            longTerm: [
              'Establish as the go-to destination in your category locally',
              'Expand customer base by 40% within 18 months',
              'Launch 2-3 new revenue streams',
              'Build a recognizable brand beyond immediate area',
            ],
          },
        },
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200, // Always return 200 to ensure response body is properly handled
      },
    );
  }
});
