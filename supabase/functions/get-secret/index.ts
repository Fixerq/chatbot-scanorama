
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleOptions } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  // Handle CORS preflight requests using the shared handler
  const corsResponse = handleOptions(req);
  if (corsResponse) return corsResponse;

  try {
    console.log('Processing request for secret');
    const { key } = await req.json()
    console.log('Requested secret key:', key);

    // Log the request
    await supabase
      .from('edge_function_logs')
      .insert({
        function_name: 'get-secret',
        request_data: { key },
      });

    // Retrieve the secret value
    const value = Deno.env.get(key)
    console.log('Secret found:', value ? 'Yes' : 'No');

    if (!value) {
      const error = `Secret ${key} not found`;
      // Log the error
      await supabase
        .from('edge_function_logs')
        .insert({
          function_name: 'get-secret',
          request_data: { key },
          error: error,
        });

      console.error(error);
      return new Response(
        JSON.stringify({ error }),
        {
          status: 404,
          headers: { 
            ...corsHeaders,
            'Access-Control-Allow-Origin': req.headers.get('origin') || '*',
            'Content-Type': 'application/json' 
          },
        }
      )
    }

    // Log the successful response
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
          'Access-Control-Allow-Origin': req.headers.get('origin') || '*',
          'Content-Type': 'application/json' 
        },
      }
    )
  } catch (error) {
    console.error('Error processing request:', error);
    
    // Log the error
    await supabase
      .from('edge_function_logs')
      .insert({
        function_name: 'get-secret',
        error: error.message,
      });

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 
          ...corsHeaders,
          'Access-Control-Allow-Origin': req.headers.get('origin') || '*',
          'Content-Type': 'application/json' 
        },
      }
    )
  }
})
