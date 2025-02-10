
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleOptions } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  console.log('Request received:', {
    method: req.method,
    origin: req.headers.get('origin'),
    url: req.url
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      }
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey,
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Process the request
    console.log('Processing request for secret');
    const { key } = await req.json();
    console.log('Requested secret key:', key);

    // Retrieve the secret value
    const value = Deno.env.get(key);
    console.log('Secret found:', value ? 'Yes' : 'No');

    if (!value) {
      const error = `Secret ${key} not found`;
      console.error(error);
      
      // Log the error
      await supabase
        .from('edge_function_logs')
        .insert({
          function_name: 'get-secret',
          request_data: { key },
          error: error,
        });

      return new Response(
        JSON.stringify({ error }),
        {
          status: 404,
          headers: { 
            ...corsHeaders,
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json' 
          },
        }
      );
    }

    // Log successful response
    await supabase
      .from('edge_function_logs')
      .insert({
        function_name: 'get-secret',
        request_data: { key },
        response_data: { success: true },
      });

    console.log('Successfully retrieved secret');
    return new Response(
      JSON.stringify({ [key]: value }),
      { 
        headers: { 
          ...corsHeaders,
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json' 
        },
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    
    // If Supabase client is available, log the error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase
          .from('edge_function_logs')
          .insert({
            function_name: 'get-secret',
            error: error.message,
          });
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 
          ...corsHeaders,
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});
