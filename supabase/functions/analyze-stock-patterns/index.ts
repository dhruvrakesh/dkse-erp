import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    const { query, dateRange, filters } = await req.json();
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get OpenAI API key from environment
    const openAIApiKey = Deno.env.get('OPENAI_KEY');
    
    if (!openAIApiKey) {
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Analyzing stock patterns for query:', query);
    console.log('Date range:', dateRange);

    // Fetch historical data based on filters
    let historyQuery = supabase
      .from('daily_stock_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false });

    if (dateRange?.start) {
      historyQuery = historyQuery.gte('snapshot_date', dateRange.start);
    }
    if (dateRange?.end) {
      historyQuery = historyQuery.lte('snapshot_date', dateRange.end);
    }

    const { data: stockHistory, error: historyError } = await historyQuery.limit(30);

    if (historyError) {
      console.error('Error fetching stock history:', historyError);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch stock history', 
        details: historyError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get current stock summary for context
    const { data: currentStock, error: currentError } = await supabase
      .from('stock_summary')
      .select('*')
      .limit(100);

    if (currentError) {
      console.error('Error fetching current stock:', currentError);
    }

    // Prepare context for AI analysis
    const contextData = {
      query,
      historicalData: stockHistory?.slice(0, 10) || [], // Last 10 days
      currentStock: currentStock?.slice(0, 50) || [], // Top 50 items
      totalHistoricalRecords: stockHistory?.length || 0,
      analysisDate: new Date().toISOString(),
      filters
    };

    // Create AI prompt
    const systemPrompt = `You are an expert inventory analyst. Analyze the stock data and provide insights based on the user's query. 

Current Context:
- Historical data spans ${contextData.totalHistoricalRecords} snapshots
- Current stock includes ${contextData.currentStock.length} items
- Analysis date: ${contextData.analysisDate}

Provide actionable insights focusing on:
1. Stock level trends
2. Consumption patterns
3. Potential stockouts or overstock situations
4. Recommendations for inventory optimization

Keep responses concise and data-driven.`;

    const userPrompt = `User Query: ${query}

Historical Data (last 10 snapshots):
${JSON.stringify(contextData.historicalData, null, 2)}

Current Stock Summary (top 50 items):
${JSON.stringify(contextData.currentStock, null, 2)}

Applied Filters: ${JSON.stringify(filters, null, 2)}

Please analyze this data and provide insights relevant to the user's query.`;

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const openAIResult = await openAIResponse.json();
    
    if (!openAIResponse.ok) {
      console.error('OpenAI API error:', openAIResult);
      return new Response(JSON.stringify({ 
        error: 'AI analysis failed', 
        details: openAIResult.error?.message || 'Unknown error' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiInsight = openAIResult.choices[0].message.content;

    // Store the query and result for future reference
    const { error: saveError } = await supabase
      .from('stock_analytics_queries')
      .insert({
        user_id: req.headers.get('user-id') || 'anonymous',
        query_text: query,
        query_type: 'ai_analysis',
        query_result: {
          insight: aiInsight,
          contextData: {
            historicalRecords: contextData.totalHistoricalRecords,
            currentStockItems: contextData.currentStock.length,
            analysisDate: contextData.analysisDate
          }
        },
        date_range_start: dateRange?.start || null,
        date_range_end: dateRange?.end || null,
        filters: filters || {}
      });

    if (saveError) {
      console.error('Error saving analytics query:', saveError);
    }

    return new Response(JSON.stringify({
      success: true,
      insight: aiInsight,
      metadata: {
        historicalRecords: contextData.totalHistoricalRecords,
        currentStockItems: contextData.currentStock.length,
        analysisDate: contextData.analysisDate,
        queryId: 'saved'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-stock-patterns function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});