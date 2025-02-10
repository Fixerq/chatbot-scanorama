
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Processing request for secret');
    const { key } = await req.json()
    console.log('Requested secret key:', key);

    const value = Deno.env.get(key)
    console.log('Secret found:', value ? 'Yes' : 'No');

    if (!value) {
      console.error(`Secret ${key} not found`);
      return new Response(
        JSON.stringify({ error: `Secret ${key} not found` }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Successfully retrieved secret');
    return new Response(
      JSON.stringify({ [key]: value }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
