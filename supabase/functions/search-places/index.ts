
// Follow this example to create a Supabase Edge function
// https://developers.supabase.com/docs/guides/functions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'

const PLACES_API_URL = 'https://places.googleapis.com/v1/places:searchText'

interface SearchRequest {
  query: string
  country: string
  region: string
  startIndex?: number
  limit?: number
  include_details?: boolean
  client_timestamp?: string
}

// Get the API key from environment variables
const getGoogleAPIKey = () => Deno.env.get('GOOGLE_PLACES_API_KEY') || ''

// Create a Supabase client
const createSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  return createClient(supabaseUrl, supabaseKey)
}

// Cache search results in the database
const cacheResults = async (
  supabase,
  query: string, 
  country: string, 
  region: string, 
  userId: string | undefined,
  results: any,
  searchBatchId: string
) => {
  try {
    if (!results || !results.places || results.places.length === 0) {
      console.log('No results to cache')
      return
    }
    
    // For each place in the results, store it in the cached_places table
    const places = results.places.map((place) => ({
      place_id: place.id || place.name,
      business_name: place.displayName?.text || 'Unknown Business',
      place_data: place,
      search_batch_id: searchBatchId,
      user_id: userId,
    }))
    
    const { error } = await supabase.from('cached_places').insert(places)
    
    if (error) {
      console.error('Error caching places:', error)
    } else {
      console.log(`Cached ${places.length} places successfully`)
    }
  } catch (error) {
    console.error('Error in cacheResults:', error)
  }
}

// Check if results are already cached
const getCachedResults = async (
  supabase,
  query: string,
  country: string,
  region: string,
  startIndex: number
) => {
  // TODO: Implement proper caching with query, country, region
  // This is a simplified version that just checks for cached place data
  try {
    const { data, error } = await supabase
      .from('cached_places')
      .select('place_data')
      .limit(20)
      .range(startIndex, startIndex + 19)
      
    if (error) {
      console.error('Error fetching cached results:', error)
      return null
    }
    
    if (data && data.length > 0) {
      console.log(`Found ${data.length} cached results`)
      return {
        places: data.map(item => item.place_data),
        nextPageToken: data.length === 20 ? 'has_more' : null
      }
    }
    
    return null
  } catch (error) {
    console.error('Error in getCachedResults:', error)
    return null
  }
}

// Cleanup error object for logging
const cleanErrorForLogging = (error: any) => {
  if (!error) return 'Unknown error'
  
  // If it's a fetch error, extract useful information
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 200) // First part of stack trace
    }
  }
  
  return error
}

// Process Google Places API response
const processPlacesResponse = (responseData: any) => {
  if (!responseData.places) {
    console.log('No places in response')
    return { results: [], hasMore: false }
  }
  
  const places = responseData.places.map((place: any) => {
    // Extract website URL if available
    const websiteUrl = place.websiteUri || 'https://example.com/no-website'
    
    // Extract other useful data
    return {
      url: websiteUrl,
      title: place.displayName?.text || '',
      details: {
        title: place.displayName?.text || '',
        description: place.formattedAddress || '',
        phone: place.internationalPhoneNumber || place.nationalPhoneNumber || '',
        rating: place.rating,
        reviewCount: place.userRatingCount,
        businessType: place.types?.[0] || '',
        placeId: place.id || '',
        location: place.location,
        formattedAddress: place.formattedAddress,
      }
    }
  }).filter((place: any) => place.url !== 'https://example.com/no-website')
  
  return {
    results: places,
    hasMore: !!responseData.nextPageToken
  }
}

// Main search function
const searchPlaces = async (req: Request) => {
  try {
    const apiKey = getGoogleAPIKey()
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Google Places API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    // Create supabase client
    const supabase = createSupabaseClient()
    
    // Parse request body
    const requestData: SearchRequest = await req.json()
    const { 
      query, 
      country, 
      region, 
      startIndex = 0, 
      limit = 20, 
      include_details = true,
      client_timestamp
    } = requestData
    
    // Get authenticated user if available
    const authHeader = req.headers.get('Authorization')
    let userId = undefined
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (!error && user) {
        userId = user.id
      }
    }
    
    console.log('Search request:', { 
      query, 
      country, 
      region, 
      startIndex, 
      limit,
      userId: userId ? 'authenticated' : 'anonymous',
      timestamp: client_timestamp
    })
    
    // Generate a unique ID for this search batch
    const searchBatchId = crypto.randomUUID()
    
    // Check cache first (for future implementation)
    // const cachedResults = await getCachedResults(supabase, query, country, region, startIndex)
    // if (cachedResults) {
    //   return new Response(
    //     JSON.stringify(processPlacesResponse(cachedResults)),
    //     { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    //   )
    // }
    
    // Construct locationBias based on country and region
    let locationRestriction = {}
    if (country) {
      // Add country restriction
      locationRestriction = {
        rectangularBias: {
          // These are wide bounds that cover most countries
          // In a real implementation, you'd use more precise country bounds
          low: { latitude: -90, longitude: -180 },
          high: { latitude: 90, longitude: 180 }
        }
      }
      
      // If we have both country and region, we can add a more specific restriction
      // This is a simplified approach - ideally you'd have proper geocoding
      if (region) {
        // Append region to search query for better results
        // This is a workaround for the lack of region biasing in the API
        const enhancedQuery = `${query} in ${region}, ${country}`
        requestData.query = enhancedQuery
      }
    }
    
    // Build the Places API request
    const placesApiRequest = {
      textQuery: requestData.query,
      languageCode: "en",
      maxResultCount: limit,
      locationBias: locationRestriction
    }
    
    // Add field mask for detailed results
    const fieldMask = "places.displayName,places.formattedAddress,places.websiteUri,places.id,places.location,places.types,places.rating,places.userRatingCount,places.internationalPhoneNumber,places.nationalPhoneNumber"
    
    // Call the Google Places API
    const response = await fetch(`${PLACES_API_URL}?key=${apiKey}&fieldMask=${fieldMask}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify(placesApiRequest),
    })
    
    // Parse the API response
    const rawResponseText = await response.text()
    let responseData
    
    try {
      responseData = JSON.parse(rawResponseText)
    } catch (e) {
      console.error('Failed to parse Places API response:', rawResponseText.substring(0, 500))
      return new Response(
        JSON.stringify({ error: 'Failed to parse Google Places API response', details: e.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    if (!response.ok) {
      console.error('Google Places API error:', responseData)
      return new Response(
        JSON.stringify({ 
          error: 'Google Places API error', 
          status: response.status,
          details: responseData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      )
    }
    
    // Process the response to match our application format
    const processedResults = processPlacesResponse(responseData)
    
    // Cache results for future use
    if (processedResults.results && processedResults.results.length > 0) {
      await cacheResults(
        supabase,
        query,
        country,
        region,
        userId,
        responseData,
        searchBatchId
      )
    }
    
    // Return the processed results
    return new Response(
      JSON.stringify(processedResults),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Unexpected error in searchPlaces:', cleanErrorForLogging(error))
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected error processing request',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  // Only allow POST requests
  if (req.method === 'POST') {
    return await searchPlaces(req)
  }
  
  // Return 405 for other request methods
  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
  )
})
