// supabase/functions/generate-recommendations/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analysisData, reviews, businessType, provider } = await req.json();
    
    // Get API key based on provider
    let apiKey;
    switch (provider) {
      case 'openai':
        apiKey = Deno.env.get("OPENAI_API_KEY");
        break;
      case 'anthropic':
        apiKey = Deno.env.get("ANTHROPIC_API_KEY");
        break;
      case 'gemini':
        apiKey = Deno.env.get("GEMINI_API_KEY");
        break;
      default:
        throw new Error("Unsupported AI provider");
    }
    
    if (!apiKey) {
      throw new Error(`API key not found for ${provider}`);
    }
    
    const prompt = generateRecommendationPrompt(analysisData, reviews, businessType);
    
    let response;
    if (provider === 'openai') {
      response = await callOpenAI(apiKey, prompt);
    } else if (provider === 'anthropic') {
      response = await callAnthropic(apiKey, prompt);
    } else if (provider === 'gemini') {
      response = await callGemini(apiKey, prompt);
    }
    
    // Parse and structure the response
    const recommendations = parseAIResponse(response);
    
    return new Response(JSON.stringify(recommendations), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateRecommendationPrompt(analysisData: any, reviews: any[], businessType: string): string {
  return `As a business consultant, analyze this ${businessType} and provide detailed recommendations.

Current Analysis:
- Average Rating: ${analysisData.avgRating}
- Monthly Reviews: ${reviews.length}
- Sentiment: ${JSON.stringify(analysisData.sentimentAnalysis)}
- Common Themes: ${JSON.stringify(analysisData.commonTerms)}
- Staff Mentions: ${JSON.stringify(analysisData.staffMentions)}

Business Type: ${businessType}

Please provide:
1. Urgent Actions (critical issues that need immediate attention)
2. Growth Strategies (marketing and customer attraction plans)
3. Pattern Insights (trends and patterns in the data)
4. Competitive Analysis (how this business compares to industry standards)
5. Customer Attraction Plan (specific strategies to attract more customers)
6. Business Scenarios (best case, realistic, status quo projections)
7. Long-term Strategies (6-12 month strategic plans)

Focus especially on:
- How to attract more customers if review volume is low (<100/month)
- Addressing negative patterns and complaints
- Leveraging positive themes for marketing
- Creating actionable, specific recommendations

Provide the response in JSON format with the structure:
{
  "urgentActions": [...],
  "growthStrategies": [...],
  "patternInsights": [...],
  "competitivePosition": {...},
  "customerAttractionPlan": {...},
  "scenarios": [...],
  "longTermStrategies": [...]
}`;
}

async function callOpenAI(apiKey: string, prompt: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a business consultant specializing in customer experience and growth strategies.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAnthropic(apiKey: string, prompt: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-opus-20240229',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    }),
  });

  const data = await response.json();
  return data.content[0].text;
}

async function callGemini(apiKey: string, prompt: string) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    }),
  });

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

function parseAIResponse(response: string): any {
  try {
    // Try to parse as JSON first
    return JSON.parse(response);
  } catch {
    // If not valid JSON, extract the JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback: create basic structure from text response
    return {
      urgentActions: [],
      growthStrategies: [],
      patternInsights: [],
      competitivePosition: {
        position: 'average',
        metrics: {},
        strengths: [],
        weaknesses: [],
        opportunities: []
      },
      customerAttractionPlan: {
        targetAudiences: {},
        channels: [],
        messaging: {}
      },
      scenarios: [],
      longTermStrategies: []
    };
  }
}
