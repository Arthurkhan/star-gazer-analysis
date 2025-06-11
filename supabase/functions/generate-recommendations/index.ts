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

// Always enable logging for debugging
const log = {
  info: (message: string, ...args: unknown[]) => {
    console.log(`[INFO] ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  }
};

// Test function to verify edge function is working
async function testFunction() {
  return {
    urgentActions: [
      {
        title: 'Test Action 1',
        description: 'This is a test action to verify the edge function works',
        impact: 'High',
        effort: 'Low'
      },
      {
        title: 'Test Action 2',
        description: 'Another test action',
        impact: 'Medium',
        effort: 'Medium'
      },
      {
        title: 'Test Action 3',
        description: 'Third test action',
        impact: 'Low',
        effort: 'High'
      }
    ],
    growthStrategies: [
      {
        title: 'Test Strategy 1',
        description: 'Test growth strategy',
        impact: 'High',
        effort: 'Low'
      },
      {
        title: 'Test Strategy 2',
        description: 'Another test strategy',
        impact: 'Medium',
        effort: 'Medium'
      },
      {
        title: 'Test Strategy 3',
        description: 'Third test strategy',
        impact: 'Low',
        effort: 'High'
      }
    ],
    customerAttractionPlan: {
      title: 'Test Marketing Plan',
      description: 'Test description',
      strategies: [
        {
          title: 'Test Tactic 1',
          description: 'Test implementation',
          timeline: '1 week',
          cost: '$100',
          expectedOutcome: 'Test outcome'
        },
        {
          title: 'Test Tactic 2',
          description: 'Another test',
          timeline: '2 weeks',
          cost: '$200',
          expectedOutcome: 'Another outcome'
        }
      ]
    },
    competitivePositioning: {
      title: 'Test Competitive Edge',
      description: 'Test market position',
      strengths: ['Test strength 1', 'Test strength 2'],
      opportunities: ['Test opportunity 1', 'Test opportunity 2'],
      recommendations: ['Test recommendation 1', 'Test recommendation 2']
    },
    futureProjections: {
      shortTerm: ['Test short term 1', 'Test short term 2'],
      longTerm: ['Test long term 1', 'Test long term 2']
    }
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    log.info('Edge function invoked at:', new Date().toISOString());
    
    const { businessData, apiKey, test } = await req.json();
    
    // Test mode - return immediately without calling OpenAI
    if (test === true) {
      log.info('Running in test mode');
      const testRecommendations = await testFunction();
      
      return new Response(
        JSON.stringify({
          ...testRecommendations,
          metadata: {
            source: 'test',
            timestamp: new Date().toISOString(),
            message: 'Edge function is working correctly'
          }
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200,
        },
      );
    }
    
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

    // Prepare data for OpenAI - limit to 20 reviews to save tokens
    const reviewsSummary = businessData.reviews.slice(0, 20).map((review: Review) => ({
      rating: review.stars,
      text: (review.text || review.textTranslated || '').substring(0, 150), // Even shorter
    }));

    const businessInfo = {
      name: businessData.businessName,
      type: businessData.businessType || 'business',
      totalReviews: businessData.reviews.length,
      averageRating: Math.round((businessData.reviews.reduce((sum: number, r: Review) => sum + (r.stars || 0), 0) / businessData.reviews.length) * 10) / 10,
    };

    // Ultra-simplified prompt with strict JSON instructions
    const systemPrompt = `You are a business consultant. Generate recommendations based on reviews.

CRITICAL: Return ONLY valid JSON, no text before or after. The response must start with { and end with }

Return this exact structure:
{
  "urgentActions": [
    {"title": "Action title", "description": "Brief description", "impact": "High", "effort": "Low"},
    {"title": "Action title", "description": "Brief description", "impact": "Medium", "effort": "Medium"},
    {"title": "Action title", "description": "Brief description", "impact": "Low", "effort": "High"}
  ],
  "growthStrategies": [
    {"title": "Strategy title", "description": "Brief description", "impact": "High", "effort": "Low"},
    {"title": "Strategy title", "description": "Brief description", "impact": "Medium", "effort": "Medium"},
    {"title": "Strategy title", "description": "Brief description", "impact": "Low", "effort": "High"}
  ],
  "customerAttractionPlan": {
    "title": "Marketing Plan",
    "description": "Brief overview",
    "strategies": [
      {"title": "Tactic 1", "description": "Implementation", "timeline": "1 week", "cost": "$100", "expectedOutcome": "Result"},
      {"title": "Tactic 2", "description": "Implementation", "timeline": "2 weeks", "cost": "$200", "expectedOutcome": "Result"}
    ]
  },
  "competitivePositioning": {
    "title": "Market Position",
    "description": "Brief overview",
    "strengths": ["Strength 1", "Strength 2"],
    "opportunities": ["Opportunity 1", "Opportunity 2"],
    "recommendations": ["Recommendation 1", "Recommendation 2"]
  },
  "futureProjections": {
    "shortTerm": ["3-month projection", "Another projection"],
    "longTerm": ["1-year projection", "Another projection"]
  }
}`;

    const userPrompt = `Business: ${businessInfo.name} (${businessInfo.type})
Average rating: ${businessInfo.averageRating}/5
Total reviews: ${businessInfo.totalReviews}

Recent reviews:
${reviewsSummary.slice(0, 10).map(r => `- ${r.rating}★: ${r.text}`).join('\n')}

Generate recommendations in the exact JSON format specified. Remember: ONLY return JSON, no other text.`;

    log.info('Calling OpenAI API...');
    const startTime = Date.now();

    let openaiResponse;
    try {
      openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userPrompt
            },
          ],
          max_tokens: 1500,
          temperature: 0.5,
          response_format: { type: "json_object" } // Force JSON response
        }),
      });
    } catch (fetchError: unknown) {
      log.error('Fetch error:', fetchError);
      throw new Error(`Network error calling OpenAI API: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
    }

    const responseTime = Date.now() - startTime;
    log.info(`OpenAI API responded in ${responseTime}ms with status: ${openaiResponse.status}`);

    if (!openaiResponse.ok) {
      let errorData: any;
      try {
        errorData = await openaiResponse.json();
      } catch {
        errorData = await openaiResponse.text();
      }
      log.error('OpenAI API error:', errorData);
      
      if (openaiResponse.status === 401) {
        throw new Error('Invalid API key. Please check your OpenAI API key.');
      } else if (openaiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      } else {
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }
    }

    let openaiData;
    let responseText;
    try {
      responseText = await openaiResponse.text();
      log.info('Response length:', responseText.length);
      log.info('First 200 chars of response:', responseText.substring(0, 200));
      openaiData = JSON.parse(responseText);
    } catch (parseError) {
      log.error('Failed to parse OpenAI response:', parseError);
      log.error('Raw response text:', responseText);
      throw new Error('Failed to parse OpenAI response');
    }

    if (!openaiData.choices?.[0]?.message?.content) {
      log.error('Invalid OpenAI response structure:', openaiData);
      throw new Error('Invalid response from OpenAI');
    }

    let recommendations;
    const content = openaiData.choices[0].message.content;
    
    try {
      // Log the content for debugging
      log.info('Content to parse (first 500 chars):', content.substring(0, 500));
      
      // Try to extract JSON from the content
      // Remove any potential whitespace or newlines
      const trimmedContent = content.trim();
      
      // If content starts with { and ends with }, parse directly
      if (trimmedContent.startsWith('{') && trimmedContent.endsWith('}')) {
        recommendations = JSON.parse(trimmedContent);
      } else {
        // Try to extract JSON from the content
        const jsonMatch = trimmedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          recommendations = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in response');
        }
      }
      
      log.info('Successfully parsed recommendations');
      
      // Validate the structure
      if (!recommendations.urgentActions || !recommendations.growthStrategies) {
        throw new Error('Missing required fields in recommendations');
      }
      
    } catch (parseError) {
      log.error('Failed to parse recommendations:', parseError);
      log.error('Content that failed to parse:', content);
      throw new Error(`Failed to parse AI recommendations: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    // Return successful response
    const successResponse = {
      ...recommendations,
      metadata: {
        source: 'openai',
        model: 'gpt-3.5-turbo',
        timestamp: new Date().toISOString(),
        responseTime: responseTime
      }
    };

    return new Response(
      JSON.stringify(successResponse),
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

    // Return fallback with error
    const fallbackResponse = {
      error: errorMessage,
      timestamp: new Date().toISOString(),
      fallback: {
        urgentActions: [
          {
            title: 'Enhance Customer Response Time',
            description: 'Respond to all reviews within 24 hours to show customers you care.',
            impact: 'High',
            effort: 'Low',
          },
          {
            title: 'Create Staff Recognition Program',
            description: 'Celebrate employees mentioned positively in reviews.',
            impact: 'High',
            effort: 'Medium',
          },
          {
            title: 'Address Common Pain Points',
            description: 'Analyze negative feedback patterns and create action plans.',
            impact: 'High',
            effort: 'Medium',
          },
        ],
        growthStrategies: [
          {
            title: 'Community Ambassador Program',
            description: 'Recruit loyal customers as brand ambassadors.',
            impact: 'High',
            effort: 'Medium',
          },
          {
            title: 'Create Instagrammable Moments',
            description: 'Design photo-worthy areas for social media sharing.',
            impact: 'High',
            effort: 'Medium',
          },
          {
            title: 'Launch Limited-Time Events',
            description: 'Create monthly special events to drive repeat visits.',
            impact: 'Medium',
            effort: 'Medium',
          },
        ],
        customerAttractionPlan: {
          title: 'Customer Growth Strategy',
          description: 'Multi-channel approach to attract customers',
          strategies: [
            {
              title: 'Social Media Stories',
              description: 'Share behind-the-scenes content',
              timeline: 'Start now',
              cost: '$200/month',
              expectedOutcome: '20% more engagement',
            },
            {
              title: 'Local Partnerships',
              description: 'Cross-promote with nearby businesses',
              timeline: '2 weeks',
              cost: 'Free',
              expectedOutcome: '15% new customers',
            },
          ],
        },
        competitivePositioning: {
          title: 'Your Market Position',
          description: 'Leverage strengths to stand out',
          strengths: [
            'Strong customer loyalty',
            'Unique atmosphere',
          ],
          opportunities: [
            'Growing local market',
            'Untapped segments',
          ],
          recommendations: [
            'Focus on unique features',
            'Fill competitor gaps',
          ],
        },
        futureProjections: {
          shortTerm: [
            '25% more positive reviews in 3 months',
            '15% repeat customer growth',
          ],
          longTerm: [
            'Local market leader in 1 year',
            '40% customer base growth',
          ],
        },
        metadata: {
          source: 'fallback',
          reason: errorMessage,
          timestamp: new Date().toISOString()
        }
      },
    };

    return new Response(
      JSON.stringify(fallbackResponse),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      },
    );
  }
});
