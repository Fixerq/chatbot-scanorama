
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleOptions } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests using the shared handler
  const corsResponse = handleOptions(req);
  if (corsResponse) return corsResponse;

  try {
    console.log('Processing request for secret');
    const { key } = await req.json()
    console.log('Requested secret key:', key);

    // Retrieve the secret value
    const value = Deno.env.get(key)
    console.log('Secret found:', value ? 'Yes' : 'No');

    if (!value) {
      console.error(`Secret ${key} not found`);
      return new Response(
        JSON.stringify({ error: `Secret ${key} not found` }),
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
