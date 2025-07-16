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
    const { service } = await req.json();
    console.log(`Testing ${service} API connection`);

    let result = { success: false, message: '', configured: false };

    switch (service) {
      case 'openai':
        const openAIKey = Deno.env.get('OPENAI_API_KEY');
        if (!openAIKey) {
          result = {
            success: false,
            message: 'OpenAI API key not configured',
            configured: false
          };
          break;
        }

        try {
          const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
              'Authorization': `Bearer ${openAIKey}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            result = {
              success: true,
              message: 'OpenAI API connection successful',
              configured: true
            };
          } else {
            result = {
              success: false,
              message: 'OpenAI API connection failed - invalid key or network error',
              configured: true
            };
          }
        } catch (error) {
          result = {
            success: false,
            message: 'OpenAI API connection failed - network error',
            configured: true
          };
        }
        break;

      default:
        result = {
          success: false,
          message: 'Unknown service',
          configured: false
        };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in test-api-connection function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Internal server error',
      configured: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});