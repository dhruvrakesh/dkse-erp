import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Checking API configuration status');

    const status = {
      openai: {
        configured: !!Deno.env.get('OPENAI_API_KEY'),
        name: 'OpenAI',
        description: 'AI-powered features and analytics'
      },
      email: {
        configured: false, // Can be expanded later for email service
        name: 'Email Service',
        description: 'Send notifications and reports via email'
      }
    };

    return new Response(JSON.stringify(status), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in check-api-status function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});