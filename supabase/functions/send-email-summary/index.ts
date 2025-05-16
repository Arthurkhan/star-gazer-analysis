import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Resend } from 'https://esm.sh/resend';

// Initialize Resend with the API Key
// Make sure to set this environment variable in your Supabase project
const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const { recipient, subject, html, includeAttachments, attachments } = await req.json();
    
    if (!recipient || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields (recipient, subject, html)' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: 'StarGazer Analysis <notifications@stargazer-analysis.com>',
      to: recipient,
      subject: subject,
      html: html,
      attachments: attachments, // Pass any attachments if provided
    });
    
    if (error) {
      console.error('Email sending error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        id: data?.id,
        message: 'Email sent successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
