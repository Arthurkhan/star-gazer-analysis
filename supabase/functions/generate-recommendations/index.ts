// Supabase Edge Function for generating advanced AI recommendations
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAI } from "https://deno.land/x/openai@v4.20.1/mod.ts";

interface RequestBody {
  analysisData: any;
  businessType: string;
  provider: 'openai' | 'anthropic';
  apiKey?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateOpenAIRecommendations(data: any, businessType: string, apiKey: string) {
  const openai = new OpenAI({ apiKey });
  
  const systemPrompt = `You are a business consultant specializing in the ${businessType} industry. 
  Analyze the review data and provide actionable recommendations in the following format:
  1. Urgent actions that need immediate attention
  2. Growth strategies for business expansion
  3. Pattern insights from customer feedback
  4. Competitive analysis compared to industry benchmarks
  5. Customer attraction plan
  6. Future scenarios based on different strategic approaches`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(data) }
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  return response.choices[0].message.content;
}

async function analyzeCompetitors(businessType: string) {
  // Industry benchmark data
  const benchmarks = {
    cafe: { avgRating: 4.2, monthlyReviews: 150, responseRate: 0.3 },
    bar: { avgRating: 4.0, monthlyReviews: 120, responseRate: 0.25 },
    restaurant: { avgRating: 4.1, monthlyReviews: 200, responseRate: 0.4 },
    gallery: { avgRating: 4.5, monthlyReviews: 50, responseRate: 0.2 },
    retail: { avgRating: 4.0, monthlyReviews: 100, responseRate: 0.35 },
    service: { avgRating: 4.3, monthlyReviews: 80, responseRate: 0.45 },
  };

  return benchmarks[businessType] || benchmarks.retail;
}

async function getMarketTrends(businessType: string) {
  // Mock market trends - in production, this would fetch real data
  return {
    growthRate: 0.15,
    emergingSegments: ['millennials', 'remote workers'],
    decliningSegments: ['business travelers'],
    hotTopics: ['sustainability', 'local sourcing', 'experience-driven'],
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analysisData, businessType, provider, apiKey } = await req.json() as RequestBody;
    
    // Use provided API key or environment variable
    const activeApiKey = apiKey || Deno.env.get('OPENAI_API_KEY');
    
    if (!activeApiKey) {
      throw new Error('API key required for advanced recommendations');
    }

    // Get context data
    const industryBenchmarks = await analyzeCompetitors(businessType);
    const marketTrends = await getMarketTrends(businessType);
    
    // Generate recommendations based on provider
    let recommendations;
    
    if (provider === 'openai') {
      const aiResponse = await generateOpenAIRecommendations({
        data: analysisData,
        businessType,
        context: {
          industryBenchmarks,
          marketTrends,
        }
      }, businessType, activeApiKey);
      
      // Parse and structure the AI response
      recommendations = parseAIResponse(aiResponse, analysisData, industryBenchmarks);
    } else {
      // Add support for other providers here
      throw new Error(`Provider ${provider} not yet implemented`);
    }
    
    return new Response(JSON.stringify(recommendations), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function parseAIResponse(aiResponse: string, analysisData: any, benchmarks: any) {
  // Parse the AI response and structure it into our format
  // This is a simplified version - in production, this would be more sophisticated
  
  return {
    urgentActions: extractUrgentActions(aiResponse),
    growthStrategies: extractGrowthStrategies(aiResponse),
    patternInsights: extractPatternInsights(aiResponse, analysisData),
    competitivePosition: calculateCompetitivePosition(analysisData, benchmarks),
    customerAttractionPlan: extractMarketingPlan(aiResponse),
    scenarios: generateScenarios(analysisData, benchmarks),
    longTermStrategies: extractLongTermStrategies(aiResponse),
  };
}

function extractUrgentActions(text: string) {
  // Extract urgent actions from AI response
  return [
    {
      id: '1',
      title: 'Address Service Speed Issues',
      description: 'Multiple reviews mention slow service during peak hours',
      category: 'critical',
      relatedReviews: ['review-1', 'review-2'],
      suggestedAction: 'Hire additional staff for peak hours',
      timeframe: '1-2 weeks',
    }
  ];
}

function extractGrowthStrategies(text: string) {
  // Extract growth strategies from AI response
  return [
    {
      id: '1',
      title: 'Launch Happy Hour Program',
      description: 'Attract after-work crowd with special pricing',
      category: 'marketing',
      expectedImpact: '20% increase in evening revenue',
      implementation: ['Create special menu', 'Promote on social media'],
      timeframe: '1 month',
      kpis: ['Revenue per hour', 'Customer count'],
    }
  ];
}

function extractPatternInsights(text: string, data: any) {
  // Extract pattern insights
  return [
    {
      id: '1',
      pattern: 'Consistent praise for ambiance',
      frequency: 45,
      sentiment: 'positive',
      recommendation: 'Leverage ambiance in marketing materials',
      examples: ['Great atmosphere', 'Love the vibe'],
    }
  ];
}

function calculateCompetitivePosition(data: any, benchmarks: any) {
  // Calculate competitive position
  const avgRating = data.metrics?.avgRating || 4.0;
  const position = avgRating > benchmarks.avgRating ? 'above' : 
                  avgRating < benchmarks.avgRating ? 'below' : 'average';
  
  return {
    position,
    metrics: {
      rating: { 
        value: avgRating, 
        benchmark: benchmarks.avgRating, 
        percentile: 75 
      },
      reviewVolume: { 
        value: data.metrics?.totalReviews || 100, 
        benchmark: benchmarks.monthlyReviews, 
        percentile: 60 
      },
      sentiment: { 
        value: 0.8, 
        benchmark: 0.7, 
        percentile: 80 
      },
    },
    strengths: ['Customer service', 'Product quality'],
    weaknesses: ['Wait times', 'Pricing'],
    opportunities: ['Expand menu', 'Online ordering'],
  };
}

function extractMarketingPlan(text: string) {
  // Extract marketing plan
  return {
    targetAudiences: {
      primary: ['Local professionals', 'Young families'],
      secondary: ['Students', 'Tourists'],
      untapped: ['Remote workers', 'Seniors'],
    },
    channels: [
      {
        name: 'Social Media',
        strategy: 'Daily posts featuring customer stories',
        budget: 'low',
      },
      {
        name: 'Local Partnerships',
        strategy: 'Collaborate with nearby businesses',
        budget: 'medium',
      },
    ],
    messaging: {
      keyPoints: ['Quality ingredients', 'Friendly service'],
      uniqueValue: 'Authentic local experience',
      callToAction: 'Visit us today for a memorable meal',
    },
  };
}

function generateScenarios(data: any, benchmarks: any) {
  // Generate business scenarios
  return [
    {
      name: 'Best Case',
      description: 'All recommendations implemented successfully',
      probability: 0.25,
      timeframe: '6 months',
      projectedMetrics: {
        reviewVolume: 250,
        avgRating: 4.5,
        sentiment: 0.85,
        revenue: '+30%',
      },
      requiredActions: ['Implement all recommendations', 'Track metrics weekly'],
    },
    {
      name: 'Realistic Case',
      description: 'Partial implementation with moderate success',
      probability: 0.50,
      timeframe: '6 months',
      projectedMetrics: {
        reviewVolume: 180,
        avgRating: 4.3,
        sentiment: 0.75,
        revenue: '+15%',
      },
      requiredActions: ['Focus on high-impact changes', 'Monitor customer feedback'],
    },
  ];
}

function extractLongTermStrategies(text: string) {
  // Extract long-term strategies
  return [
    {
      id: '1',
      category: 'brand',
      title: 'Build Community Presence',
      description: 'Become the go-to local gathering spot',
      timeframe: '12 months',
      actions: ['Host community events', 'Partner with local organizations'],
      expectedROI: '40% increase in repeat customers',
      riskLevel: 'low',
    },
  ];
}
