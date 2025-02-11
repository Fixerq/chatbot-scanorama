
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('Request received:', { method: req.method, url: req.url, body })

    if (body.type === 'search') {
      // Return test data matching the expected interface
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            results: [
              {
                url: 'https://maps.google.com/maps?q=Test+Business',
                title: 'Test Business',
                details: {
                  title: 'Test Business',
                  description: 'A test business in the specified location',
                  lastChecked: new Date().toISOString(),
                  address: '123 Test Street, Test City, Test Country',
                  phone: '555-0123',
                  mapsUrl: 'https://maps.google.com/maps?q=Test+Business',
                  types: ['business', 'test'],
                  rating: 4.5
                }
              }
            ],
            hasMore: false
          }
        }),
        { headers: corsHeaders }
      )
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid action type'
      }),
      { headers: corsHeaders }
    )

  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { headers: corsHeaders }
    )
  }
})
