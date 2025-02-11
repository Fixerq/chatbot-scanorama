
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SearchParams } from './types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache'
}

async function handleSearch(params: SearchParams) {
  console.log('Processing search with params:', params)
  
  return {
    results: [{
      url: "https://example.com",
      details: {
        title: "Test Business",
        description: "A test business in " + params.region,
        lastChecked: new Date().toISOString(),
        address: "123 Test St, " + params.region + ", " + params.country,
        types: ["business", "test"],
        rating: 4.5
      }
    }],
    hasMore: false
  }
}

async function handleRequest(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!req.body) {
      throw new Error('Empty request body')
    }

    const { action, params } = await req.json()
    console.log('Request received:', { method: req.method, url: req.url, action, params })

    if (action === 'search') {
      const searchParams = params as SearchParams
      const result = await handleSearch(searchParams)
      
      return new Response(
        JSON.stringify({
          success: true,
          data: result
        }),
        { 
          status: 200,
          headers: corsHeaders
        }
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
        error: error.message || 'Internal server error'
      }),
      { 
        status: 200, // Always return 200 to avoid CORS issues
        headers: corsHeaders
      }
    )
  }
}

serve(handleRequest)
