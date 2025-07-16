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
    const { format = 'json', dateRange, filters } = await req.json();
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Exporting historical data in format:', format);
    console.log('Date range:', dateRange);
    console.log('Filters:', filters);

    // Build query based on filters
    let query = supabase
      .from('daily_stock_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false });

    if (dateRange?.start) {
      query = query.gte('snapshot_date', dateRange.start);
    }
    if (dateRange?.end) {
      query = query.lte('snapshot_date', dateRange.end);
    }

    // Fetch all matching records
    const { data: snapshots, error } = await query;

    if (error) {
      console.error('Error fetching snapshots:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch data', 
        details: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!snapshots || snapshots.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No data found for the specified criteria' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process data based on format
    let responseData;
    let contentType;
    let filename;

    switch (format.toLowerCase()) {
      case 'json':
        responseData = JSON.stringify(snapshots, null, 2);
        contentType = 'application/json';
        filename = `stock_history_${new Date().toISOString().split('T')[0]}.json`;
        break;
      
      case 'csv':
        // Flatten the data for CSV export
        const flattenedData = snapshots.flatMap(snapshot => {
          const baseInfo = {
            snapshot_date: snapshot.snapshot_date,
            record_count: snapshot.record_count,
            created_at: snapshot.created_at
          };
          
          if (snapshot.snapshot_data && Array.isArray(snapshot.snapshot_data)) {
            return snapshot.snapshot_data.map(item => ({
              ...baseInfo,
              ...item
            }));
          }
          
          return [baseInfo];
        });

        // Generate CSV headers
        const headers = new Set();
        flattenedData.forEach(row => {
          Object.keys(row).forEach(key => headers.add(key));
        });
        const csvHeaders = Array.from(headers).join(',');
        
        // Generate CSV rows
        const csvRows = flattenedData.map(row => 
          Array.from(headers).map(header => 
            JSON.stringify(row[header] || '')
          ).join(',')
        );
        
        responseData = [csvHeaders, ...csvRows].join('\n');
        contentType = 'text/csv';
        filename = `stock_history_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      
      default:
        return new Response(JSON.stringify({ 
          error: 'Unsupported format. Use json or csv.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Return the data with appropriate headers for download
    return new Response(responseData, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error in export-historical-data function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});