
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// Set up CORS headers for the Edge Function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// Cache for storing previous search results to avoid duplicates
const resultsCache = new Map();

// Basic cache management - clear old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, { timestamp }] of resultsCache.entries()) {
    // Clear entries older than 1 hour
    if (now - timestamp > 60 * 60 * 1000) {
      resultsCache.delete(key);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

// Function to generate a cache key from search parameters
function generateCacheKey(query, country, region) {
  return `${query.toLowerCase()}_${country.toLowerCase()}_${region.toLowerCase()}`;
}

// Get the Google Places API key from environment variables
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
if (!GOOGLE_API_KEY) {
  console.error('Google Places API key is not set in environment variables');
}

// Create a Supabase client (for future use if needed)
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);

// URLs for Places API
const PLACES_API_URL = 'https://places.googleapis.com/v1/places:searchText';

// Interface for the search request
interface SearchRequest {
  query: string;
  country: string;
  region: string;
  limit?: number;
  pageToken?: string;
  startIndex?: number;
  client_timestamp?: string;
}

// Interface for the search response
interface SearchResponse {
  results: any[];
  hasMore: boolean;
  nextPageToken?: string;
}

// The request handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Ensure request is POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
      );
    }

    // Parse JSON body 
    let payload: SearchRequest;
    try {
      payload = await req.json();
      console.log('Received search request with payload:', JSON.stringify(payload));
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body', details: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Extract request parameters with validation
    const { 
      query, 
      country, 
      region, 
      limit = 20, 
      pageToken,
      startIndex = 0,
      client_timestamp
    } = payload;

    // Validate required parameters
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: query' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Log request properties
    if (client_timestamp) {
      console.log(`Processing request with timestamp ${client_timestamp}`);
    }

    // Try to get results from cache first (if not using pageToken)
    const cacheKey = !pageToken ? generateCacheKey(query, country, region) : null;
    if (cacheKey && !pageToken && resultsCache.has(cacheKey)) {
      const cachedResults = resultsCache.get(cacheKey);
      console.log(`Using cached results for query "${query}" (cached ${new Date(cachedResults.timestamp).toISOString()})`);
      
      // Use startIndex for pagination when using cached results
      const paginatedResults = {
        ...cachedResults.data,
        results: cachedResults.data.results.slice(startIndex, startIndex + limit)
      };
      
      return new Response(
        JSON.stringify(paginatedResults),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Set up the request to the Google Places API
    const requestBody: any = {
      textQuery: query,
      maxResultCount: limit,
      languageCode: "en"
    };
    
    // Add regionCode if we have a valid country code
    if (country && country.length === 2) {
      requestBody.locationBias = {
        circle: {
          center: { latitude: 0, longitude: 0 }, // Default to center of the world
          radius: 20000000 // Large radius in meters to prioritize the country/region
        }
      };
      requestBody.regionCode = country.toUpperCase();
    }

    if (region) {
      // Add region to the query for better targeting
      requestBody.textQuery = `${requestBody.textQuery} ${region}`;
    }

    // If we have a pageToken, use it for pagination
    if (pageToken) {
      requestBody.pageToken = pageToken;
      console.log('Using page token for pagination:', pageToken);
    }

    // Log the request body for debugging
    console.log('Sending request to Google Places API with body:', JSON.stringify(requestBody, null, 2));

    try {
      // Make the request to the Google Places API
      const response = await fetch(PLACES_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.internationalPhoneNumber,places.regularOpeningHours,places.primaryType,places.types,places.rating,places.userRatingCount,places.priceLevel'
        },
        body: JSON.stringify(requestBody)
      });

      // Check for HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Google Places API returned ${response.status}: ${errorText}`);
        
        return new Response(
          JSON.stringify({
            error: `Google Places API error: ${response.status}`,
            details: errorText,
            status: response.status
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: response.status
          }
        );
      }

      // Parse the response
      const responseData = await response.json();
      
      // Log a snippet of the response for debugging
      console.log('Google Places API raw response snippet:', 
        JSON.stringify(responseData).slice(0, 500) + '...');

      // Extract and transform the results
      const results = [];
      
      if (responseData.places && Array.isArray(responseData.places)) {
        for (const place of responseData.places) {
          // Skip places without a website if possible
          if (!place.websiteUri && responseData.places.length > 5) {
            continue;
          }
          
          // Create a result object with the place details
          const resultObj = {
            url: place.websiteUri || 'https://example.com/no-website',
            status: 'Ready for analysis',
            details: {
              title: place.displayName?.text || 'Unknown Business',
              description: place.formattedAddress || '',
              lastChecked: new Date().toISOString(),
              phone: place.internationalPhoneNumber,
              rating: place.rating,
              reviewCount: place.userRatingCount,
              businessType: place.primaryType,
              priceLevel: place.priceLevel,
              openingHours: place.regularOpeningHours?.periods ? 
                place.regularOpeningHours.periods.map(period => ({
                  open: period.open,
                  close: period.close
                })) : null,
              placeId: place.id
            }
          };
          
          results.push(resultObj);
        }
      }

      // Create the response object
      const response_data: SearchResponse = {
        results,
        hasMore: !!responseData.nextPageToken
      };

      // Add nextPageToken to the response if available
      if (responseData.nextPageToken) {
        response_data.nextPageToken = responseData.nextPageToken;
        console.log('Returning next page token for pagination:', responseData.nextPageToken);
      }

      // Store in cache if not using pagination
      if (cacheKey && !pageToken) {
        resultsCache.set(cacheKey, {
          data: response_data,
          timestamp: Date.now()
        });
        console.log(`Cached ${results.length} results for query "${query}"`);
      }

      // Return the results
      return new Response(
        JSON.stringify(response_data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (apiError) {
      console.error('Error calling Google Places API:', apiError);
      return new Response(
        JSON.stringify({
          error: 'Google Places API call failed',
          details: apiError.message,
          status: 'api_error'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
