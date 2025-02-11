
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
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
      const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')
      if (!GOOGLE_API_KEY) {
        throw new Error('Google API key not configured')
      }

      const query = `${body.query} in ${body.region || ''}, ${body.country}`.trim()
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=business&key=${GOOGLE_API_KEY}`
      
      console.log('Fetching from Google Places API:', url.replace(GOOGLE_API_KEY, '[REDACTED]'))
      
      const response = await fetch(url)
      const data = await response.json()
      
      console.log('Google Places API response:', {
        status: data.status,
        resultsCount: data.results?.length || 0
      })
      
      if (data.status === 'OK' && data.results) {
        const formattedResults = data.results.map(place => ({
          url: `https://maps.google.com/maps?q=${encodeURIComponent(place.name)}`,
          title: place.name,
          details: {
            title: place.name,
            description: place.formatted_address,
            lastChecked: new Date().toISOString(),
            address: place.formatted_address,
            phone: place.formatted_phone_number || '',
            mapsUrl: `https://maps.google.com/maps?q=${encodeURIComponent(place.name)}`,
            types: place.types || [],
            rating: place.rating || 0
          }
        }))

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              results: formattedResults,
              hasMore: false
            }
          }),
          { headers: corsHeaders }
        )
      }
      
      // If no results or error, return empty results
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            results: [],
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
