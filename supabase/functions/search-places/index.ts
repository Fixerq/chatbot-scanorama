
// Follow this example to create a Supabase Edge function
// https://developers.supabase.com/docs/guides/functions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'

const PLACES_API_URL = 'https://places.googleapis.com/v1/places:searchText'

// Create a Supabase client with the Auth context of the function
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  try {
    // Get the API key from Supabase secrets
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    if (!apiKey) {
      throw new Error('Missing Google Places API key')
    }

    // Parse request body
    const { query, country, region, startIndex, limit, include_details, client_timestamp } = await req.json()

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Missing query parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Log request info
    console.log(`Places search request: query=${query}, country=${country}, region=${region}, startIndex=${startIndex}, client_timestamp=${client_timestamp}`)

    // Check cache first
    const { data: cachedResults, error: cacheError } = await supabaseAdmin
      .from('cached_places')
      .select('place_data')
      .eq('query', query.toLowerCase())
      .eq('country', country || '')
      .eq('region', region || '')
      .order('created_at', { ascending: false })
      .limit(1)

    if (!cacheError && cachedResults && cachedResults.length > 0) {
      console.log('Cache hit for query:', query)
      
      // Update last accessed timestamp
      await supabaseAdmin
        .from('cached_places')
        .update({ last_accessed: new Date().toISOString() })
        .eq('query', query.toLowerCase())
        .eq('country', country || '')
        .eq('region', region || '')
      
      return new Response(
        JSON.stringify(cachedResults[0].place_data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build request to Google Places API
    let searchQuery = query
    if (country) {
      searchQuery += ` in ${country}`
    }
    if (region) {
      searchQuery += `, ${region}`
    }

    const requestBody = {
      textQuery: searchQuery,
      languageCode: "en",
      maxResultCount: limit || 20,
      locationBias: {
        circle: {
          center: {
            latitude: 37.7749,
            longitude: -122.4194
          },
          radius: 5000.0
        }
      }
    }

    // Prepare headers for Google Places API request
    const headers = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.websiteUri,places.id,places.types'
    }

    // Send request to Google Places API
    console.log('Fetching from Google Places API:', PLACES_API_URL)
    console.log('Request body:', JSON.stringify(requestBody))
    
    const response = await fetch(PLACES_API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Places API Error (${response.status}): ${errorText}`)
      
      return new Response(
        JSON.stringify({ 
          error: `Google Places API error: ${response.status}`,
          details: errorText
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status === 401 ? 401 : 500
        }
      )
    }

    const data = await response.json()
    console.log('Places API response:', JSON.stringify(data).substring(0, 500) + '...')

    // Transform the response to match our expected format
    const transformed = {
      results: (data.places || []).map((place: any) => ({
        id: place.id,
        name: place.displayName?.text || 'Unknown',
        address: place.formattedAddress || '',
        url: place.websiteUri || '',
        types: place.types || []
      })),
      nextPageToken: data.nextPageToken,
      hasMore: !!data.nextPageToken
    }

    // Save to cache
    const batchId = crypto.randomUUID()
    await supabaseAdmin
      .from('cached_places')
      .insert({
        place_id: batchId,
        business_name: query,
        place_data: transformed,
        search_batch_id: batchId,
        query: query.toLowerCase(),
        country: country || '',
        region: region || '',
        created_at: new Date().toISOString(),
        last_accessed: new Date().toISOString()
      })

    // Return the response with CORS headers
    return new Response(
      JSON.stringify(transformed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in search-places function:', error.message)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
