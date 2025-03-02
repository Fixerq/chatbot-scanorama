
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// Set up CORS headers for the Edge Function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Set up the Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Set up the Google Places API key
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY') ?? '';

// Cache settings
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Helper function to get cached results
async function getCachedResults(cacheKey: string) {
  const { data, error } = await supabase
    .from('cached_places')
    .select('*')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .limit(1)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data.results;
}

// Helper function to cache results
async function cacheResults(cacheKey: string, results: any) {
  const expiresAt = new Date(Date.now() + CACHE_DURATION_MS).toISOString();
  
  const { error } = await supabase
    .from('cached_places')
    .upsert({
      cache_key: cacheKey,
      results,
      expires_at: expiresAt
    }, { onConflict: 'cache_key' });
  
  if (error) {
    console.error('Error caching results:', error);
  }
}

// The request handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Reject non-POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: corsHeaders, status: 405 }
    );
  }
  
  try {
    // Parse the request body
    const options = await req.json();
    const { query, country, region, limit = 20, pageToken, client_timestamp } = options;
    
    console.log('Received request with options:', {
      query,
      country,
      region,
      limit,
      hasPageToken: !!pageToken,
      client_timestamp
    });
    
    // Check for required parameters
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: query' }),
        { headers: corsHeaders, status: 400 }
      );
    }
    
    // Check for Google Places API key
    if (!GOOGLE_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: 'Google Places API key not configured',
          status: 'config_error' 
        }),
        { headers: corsHeaders, status: 500 }
      );
    }
    
    // Try to get cached results if no pageToken (we can't cache paginated results)
    const cacheKey = !pageToken ? `${query}_${country}_${region}_${limit}` : null;
    if (cacheKey) {
      const cachedResults = await getCachedResults(cacheKey);
      if (cachedResults) {
        console.log('Returning cached results for:', cacheKey);
        return new Response(
          JSON.stringify(cachedResults),
          { headers: corsHeaders }
        );
      }
    }
    
    // Build the Places API URL
    const apiUrl = 'https://places.googleapis.com/v1/places:searchText';
    
    // Prepare the request body for the Google Places API
    const requestBody: any = {
      textQuery: query,
      maxResultCount: limit,
      languageCode: "en"
    };
    
    // Add regionCode if we have a valid country code
    if (country && country.length === 2) {
      requestBody.regionCode = country.toUpperCase();
    } else if (country && country.length > 2) {
      // Try to map country name to code (simplified version)
      const countryMap: Record<string, string> = {
        'united states': 'US',
        'usa': 'US',
        'united kingdom': 'GB',
        'uk': 'GB',
        'canada': 'CA',
        'australia': 'AU',
        'germany': 'DE',
        'france': 'FR',
        'italy': 'IT',
        'spain': 'ES',
        'japan': 'JP',
        'china': 'CN',
        'india': 'IN',
        'brazil': 'BR',
      };
      
      const code = countryMap[country.toLowerCase()];
      if (code) {
        requestBody.regionCode = code;
      }
    }
    
    // Include region in text query if provided
    if (region && region.trim()) {
      requestBody.textQuery = `${requestBody.textQuery} ${region}`;
    }
    
    // Add pageToken if available
    if (pageToken) {
      requestBody.pageToken = pageToken;
    }
    
    // Define the fields we want to get back to reduce payload size
    const fieldMask = "places.id,places.displayName,places.formattedAddress,places.websiteUri," +
                       "places.phoneNumbers,places.regularOpeningHours,places.primaryType," +
                       "places.types,places.rating,places.userRatingCount";
    
    console.log('Sending request to Google Places API:', JSON.stringify(requestBody));
    
    // Make the request to the Google Places API
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask': fieldMask
        },
        body: JSON.stringify(requestBody)
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Google Places API error:', response.status, JSON.stringify(responseData).slice(0, 500));
        
        return new Response(
          JSON.stringify({
            error: `Google Places API error (${response.status}): ${JSON.stringify(responseData).slice(0, 1000)}`,
            details: responseData?.error?.message || 'Unknown error',
            status: 'api_error',
            requestInfo: {
              url: apiUrl,
              body: requestBody,
              fieldMask
            }
          }),
          { 
            headers: corsHeaders,
            status: 500
          }
        );
      }
      
      console.log('Google Places API response:', JSON.stringify(responseData).slice(0, 300) + '...');
      
      // Define the results array
      let results: any[] = [];
      
      // Process the places from the response
      if (responseData.places && Array.isArray(responseData.places)) {
        results = responseData.places.map((place: any) => {
          const websiteUri = place.websiteUri || 'https://example.com/no-website';
          
          return {
            url: websiteUri,
            title: place.displayName?.text || 'Unknown',
            description: place.formattedAddress || 'No address available',
            details: {
              title: place.displayName?.text || 'Unknown',
              description: place.formattedAddress || 'No address available',
              phone: place.phoneNumbers?.[0] || null,
              type: place.primaryType || (place.types?.[0] || 'business'),
              rating: place.rating || null,
              reviewCount: place.userRatingCount || 0,
              openingHours: place.regularOpeningHours?.periods || null,
              placeId: place.id
            }
          };
        });
      }
      
      // Prepare the response data
      const response_data = {
        results,
        hasMore: !!responseData.nextPageToken,
        nextPageToken: responseData.nextPageToken || null
      };
      
      // Cache the results if cacheKey is available (non-paginated requests)
      if (cacheKey) {
        await cacheResults(cacheKey, response_data);
      }
      
      // Return the response
      return new Response(
        JSON.stringify(response_data),
        { headers: corsHeaders }
      );
    } catch (apiError) {
      console.error('Error calling Google Places API:', apiError);
      return new Response(
        JSON.stringify({
          error: 'Google Places API call failed',
          details: apiError.message,
          status: 'api_error',
          requestBody
        }),
        { 
          headers: corsHeaders,
          status: 500
        }
      );
    }
  } catch (error) {
    console.error('Detailed error info:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
        name: error.name,
        status: 'server_error'
      }),
      { 
        headers: corsHeaders,
        status: 500
      }
    );
  }
});
