import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Parse the request body
    const body = await req.json();
    const { userInput } = body;
    
    // Generate fallback recommendations
    const recommendations = [
      {
        id: "1",
        title: "Optimize your product descriptions",
        description: "Use clear, benefit-focused language to highlight your product's unique value.",
        category: "marketing"
      },
      {
        id: "2",
        title: "Implement email marketing automation",
        description: "Set up automated email sequences for new customers to improve engagement.",
        category: "marketing"
      },
      {
        id: "3",
        title: "Explore social media partnerships",
        description: "Identify and reach out to micro-influencers in your industry for collaborations.",
        category: "growth"
      },
      {
        id: "4",
        title: "Improve website conversion rate",
        description: "Add clear call-to-action buttons and simplify your checkout process.",
        category: "conversion"
      },
      {
        id: "5",
        title: "Create a referral program",
        description: "Incentivize existing customers to refer new customers to your business.",
        category: "growth"
      }
    ];
    
    return new Response(
      JSON.stringify({ recommendations }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});