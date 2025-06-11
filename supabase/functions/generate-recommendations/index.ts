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

// Unified prompt for all providers
const getUnifiedPrompt = (businessInfo: any, reviewsSummary: any[]) => {
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

  return { systemPrompt, userPrompt };
};

// AI Provider implementations
async function callOpenAI(apiKey: string, model: string, systemPrompt: string, userPrompt: string) {
  const openaiModel = model || 'gpt-4o';
  log.info(`Using OpenAI model: ${openaiModel}`);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: openaiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1500,
      temperature: 0.5,
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    log.error('OpenAI API error:', errorData);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content);
}

async function callClaude(apiKey: string, model: string, systemPrompt: string, userPrompt: string) {
  const claudeModel = model || 'claude-3-opus-20240229';
  log.info(`Using Claude model: ${claudeModel}`);
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: claudeModel,
      messages: [
        { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
      ],
      max_tokens: 1500,
      temperature: 0.5
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    log.error('Claude API error:', errorData);
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.content[0].text;
  
  // Extract JSON from Claude's response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in Claude response');
  }
  
  return JSON.parse(jsonMatch[0]);
}

async function callGemini(apiKey: string, model: string, systemPrompt: string, userPrompt: string) {
  const geminiModel = model || 'gemini-1.5-pro';
  log.info(`Using Gemini model: ${geminiModel}`);
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${geminiModel}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `${systemPrompt}\n\n${userPrompt}`
        }]
      }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 1500,
        responseMimeType: "application/json"
      }
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    log.error('Gemini API error:', errorData);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates[0].content.parts[0].text;
  return JSON.parse(content);
}

// Fallback response for errors
const getFallbackResponse = (errorMessage: string) => ({
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
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    log.info('Edge function invoked at:', new Date().toISOString());
    
    // Parse request body with better error handling
    let requestData;
    try {
      const bodyText = await req.text();
      log.info('Request body length:', bodyText.length);
      
      if (!bodyText || bodyText.trim() === '') {
        throw new Error('Request body is empty');
      }
      
      requestData = JSON.parse(bodyText);
    } catch (parseError) {
      log.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify(getFallbackResponse('Invalid request format. Please ensure the request body is valid JSON.')),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200,
        },
      );
    }
    
    const { businessData, provider, apiKey, model, test } = requestData;
    
    // Test mode - return immediately without calling AI
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
    
    log.info(`Received request with business: ${businessData?.businessName}`);
    log.info(`Using provider: ${provider}, model: ${model}`);

    if (!apiKey) {
      log.error('No API key provided');
      throw new Error(`${provider || 'AI'} API key is required`);
    }

    if (!businessData || !businessData.reviews || businessData.reviews.length === 0) {
      log.error('Invalid business data:', businessData);
      throw new Error('Business data with reviews is required');
    }

    log.info(`Processing ${businessData.reviews.length} reviews for ${businessData.businessName}`);

    // Prepare data for AI - limit to 20 reviews to save tokens
    const reviewsSummary = businessData.reviews.slice(0, 20).map((review: Review) => ({
      rating: review.stars,
      text: (review.text || review.textTranslated || '').substring(0, 150),
    }));

    const businessInfo = {
      name: businessData.businessName,
      type: businessData.businessType || 'business',
      totalReviews: businessData.reviews.length,
      averageRating: Math.round((businessData.reviews.reduce((sum: number, r: Review) => sum + (r.stars || 0), 0) / businessData.reviews.length) * 10) / 10,
    };

    // Get unified prompt
    const { systemPrompt, userPrompt } = getUnifiedPrompt(businessInfo, reviewsSummary);

    log.info(`Calling ${provider} API...`);
    const startTime = Date.now();

    let recommendations;
    try {
      switch (provider) {
        case 'openai':
          recommendations = await callOpenAI(apiKey, model, systemPrompt, userPrompt);
          break;
        case 'claude':
          recommendations = await callClaude(apiKey, model, systemPrompt, userPrompt);
          break;
        case 'gemini':
          recommendations = await callGemini(apiKey, model, systemPrompt, userPrompt);
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
    } catch (error: unknown) {
      log.error(`${provider} API call failed:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('401')) {
        throw new Error(`Invalid API key. Please check your ${provider} API key.`);
      } else if (errorMessage.includes('429')) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      } else {
        throw new Error(`${provider} API error: ${errorMessage}`);
      }
    }

    const responseTime = Date.now() - startTime;
    log.info(`${provider} API responded in ${responseTime}ms`);

    // Validate the response structure
    if (!recommendations.urgentActions || !recommendations.growthStrategies) {
      throw new Error('Invalid recommendations structure received from AI');
    }

    // Return successful response
    const successResponse = {
      ...recommendations,
      metadata: {
        source: 'ai',
        provider: provider,
        model: model || 'default',
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

    return new Response(
      JSON.stringify(getFallbackResponse(errorMessage)),
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
