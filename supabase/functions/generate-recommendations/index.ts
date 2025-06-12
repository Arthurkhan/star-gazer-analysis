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

// Unified prompt for all providers
const getUnifiedPrompt = (businessInfo: any, reviewsSummary: any[]) => {
  const systemPrompt = `You are a business consultant analyzing real customer reviews. Generate actionable recommendations based on the reviews provided.

CRITICAL: Return ONLY valid JSON, no text before or after. The response must start with { and end with }

Analyze the customer reviews and provide specific, actionable recommendations based on what customers are actually saying. Look for patterns in complaints, compliments, and suggestions.

Return this exact structure:
{
  "urgentActions": [
    {"title": "Specific action based on reviews", "description": "Detailed explanation addressing actual customer feedback", "impact": "High", "effort": "Low"},
    {"title": "Another urgent action", "description": "Based on common complaints or issues mentioned", "impact": "Medium", "effort": "Medium"},
    {"title": "Third action", "description": "Addressing patterns in negative reviews", "impact": "Low", "effort": "High"}
  ],
  "growthStrategies": [
    {"title": "Strategy based on positive feedback", "description": "Leverage what customers love", "impact": "High", "effort": "Low"},
    {"title": "Expansion opportunity", "description": "Based on customer requests", "impact": "Medium", "effort": "Medium"},
    {"title": "Long-term improvement", "description": "Address systematic issues", "impact": "Low", "effort": "High"}
  ],
  "customerAttractionPlan": {
    "title": "Customer Growth Plan",
    "description": "Based on what attracts current happy customers",
    "strategies": [
      {"title": "Attraction method", "description": "Based on positive review themes", "timeline": "1 week", "cost": "$100-500", "expectedOutcome": "Specific result"},
      {"title": "Marketing approach", "description": "Highlight strengths mentioned in reviews", "timeline": "2 weeks", "cost": "$200-1000", "expectedOutcome": "Measurable outcome"}
    ]
  },
  "competitivePositioning": {
    "title": "Your Competitive Edge",
    "description": "Based on what customers say makes you unique",
    "strengths": ["Strength mentioned in reviews", "Another strength customers love"],
    "opportunities": ["Gap identified from reviews", "Customer request pattern"],
    "recommendations": ["Action to enhance strengths", "Way to address weaknesses"]
  },
  "futureProjections": {
    "shortTerm": ["3-month projection based on current trajectory", "Expected improvement from addressing issues"],
    "longTerm": ["1-year vision if recommendations are implemented", "Market position potential"]
  }
}`;

  const userPrompt = `Business: ${businessInfo.name} (${businessInfo.type})
Average rating: ${businessInfo.averageRating}/5
Total reviews: ${businessInfo.totalReviews}

Recent customer reviews to analyze:
${reviewsSummary.slice(0, 20).map(r => `- ${r.rating}★: ${r.text}`).join('\n')}

Analyze these actual customer reviews and generate specific recommendations based on what customers are saying. Address both positive feedback (to amplify) and negative feedback (to fix). Be specific and reference actual review content in your recommendations.`;

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
        title: 'Improve Response Time',
        description: 'Respond to all customer reviews within 24 hours to show you value feedback.',
        impact: 'High',
        effort: 'Low',
      },
      {
        title: 'Address Common Complaints',
        description: 'Analyze negative reviews for patterns and create action plans to fix recurring issues.',
        impact: 'High',
        effort: 'Medium',
      },
      {
        title: 'Highlight Positive Mentions',
        description: 'Use positive review quotes in your marketing to attract similar customers.',
        impact: 'Medium',
        effort: 'Low',
      },
    ],
    growthStrategies: [
      {
        title: 'Implement Customer Suggestions',
        description: 'Review customer suggestions and implement the most requested features or services.',
        impact: 'High',
        effort: 'Medium',
      },
      {
        title: 'Create Loyalty Program',
        description: 'Reward repeat customers mentioned in reviews with special perks.',
        impact: 'High',
        effort: 'Medium',
      },
      {
        title: 'Staff Recognition',
        description: 'Publicly recognize staff members who receive positive mentions in reviews.',
        impact: 'Medium',
        effort: 'Low',
      },
    ],
    customerAttractionPlan: {
      title: 'Customer Growth Strategy',
      description: 'Attract new customers based on what current customers love',
      strategies: [
        {
          title: 'Social Proof Campaign',
          description: 'Share positive reviews on social media and website',
          timeline: 'Start immediately',
          cost: '$100/month',
          expectedOutcome: '20% more engagement',
        },
        {
          title: 'Referral Program',
          description: 'Encourage happy customers to bring friends',
          timeline: '2 weeks setup',
          cost: '10% discount per referral',
          expectedOutcome: '15% new customers',
        },
      ],
    },
    competitivePositioning: {
      title: 'Market Position Analysis',
      description: 'Understanding your unique value based on customer feedback',
      strengths: [
        'Quality of service as mentioned in reviews',
        'Unique features customers appreciate',
      ],
      opportunities: [
        'Services customers are asking for',
        'Areas where competitors fall short',
      ],
      recommendations: [
        'Emphasize your unique strengths in marketing',
        'Address gaps mentioned in reviews',
      ],
    },
    futureProjections: {
      shortTerm: [
        'Improved ratings from addressing immediate concerns',
        'Increased positive reviews from better engagement',
      ],
      longTerm: [
        'Market leader in customer satisfaction',
        'Expanded customer base from positive word-of-mouth',
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
    log.info('Request method:', req.method);
    
    // Parse request body
    let requestData;
    try {
      const bodyText = await req.text();
      log.info('Request body received, length:', bodyText.length);
      
      if (!bodyText || bodyText.trim() === '') {
        throw new Error('Empty request body');
      }
      
      requestData = JSON.parse(bodyText);
      log.info('Successfully parsed request data');
    } catch (parseErr) {
      log.error('Failed to parse request:', parseErr);
      throw new Error('Invalid request format');
    }
    
    const { businessData, provider, apiKey, model } = requestData || {};
    
    log.info(`Processing request for business: ${businessData?.businessName}`);
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

    // Prepare review data for AI
    const reviewsSummary = businessData.reviews.map((review: Review) => ({
      rating: review.stars,
      text: (review.text || review.textTranslated || 'No review text').substring(0, 200),
    }));

    const businessInfo = {
      name: businessData.businessName || 'Business',
      type: businessData.businessType || 'business',
      totalReviews: businessData.reviews.length,
      averageRating: Math.round((businessData.reviews.reduce((sum: number, r: Review) => sum + (r.stars || 0), 0) / businessData.reviews.length) * 10) / 10,
    };

    // Get unified prompt
    const { systemPrompt, userPrompt } = getUnifiedPrompt(businessInfo, reviewsSummary);

    log.info(`Calling ${provider} API with real review data...`);
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
        source: provider,
        provider: provider,
        model: model || 'default',
        timestamp: new Date().toISOString(),
        responseTime: responseTime,
        reviewsAnalyzed: businessData.reviews.length,
        businessName: businessData.businessName
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
