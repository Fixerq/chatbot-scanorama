
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateSearchRequest } from './validation.ts';
import { getLocationCoordinates, searchNearbyPlaces } from './placesApi.ts';

// Updated CORS headers to be more permissive
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Expose-Headers': '*',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // Handle CORS preflight requests first
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    // Log incoming request details for debugging
    console.log('Request received:', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    });

    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const { action, params } = await req.json();
    console.log('Search request:', { action, params });

    // Validate search parameters
    const validationError = validateSearchRequest(action, params);
    if (validationError) {
      console.error('Validation error:', validationError);
      throw new Error(validationError);
    }

    // Get coordinates for the location
    const location = await getLocationCoordinates(`${params.region}, ${params.country}`);
    if (!location) {
      throw new Error('Location not found');
    }

    // Search for places near the location
    const searchResponse = await searchNearbyPlaces(params.query, location);
    const results = searchResponse.results || [];
    
    console.log(`Found ${results.length} results for query:`, params.query);

    // Return successful response
    return new Response(
      JSON.stringify({
        data: {
          results: results.map(place => ({
            title: place.name,
            description: place.formatted_address,
            url: place.photos?.[0]?.photo_reference 
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${Deno.env.get('GOOGLE_PLACES_API_KEY')}`
              : `https://maps.google.com/?q=${encodeURIComponent(place.formatted_address)}`,
          })),
          hasMore: false,
          searchBatchId: crypto.randomUUID()
        }
      }),
      { 
        status: 200,
        headers: corsHeaders
      }
    );

  } catch (error) {
    console.error('Request error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
        status: 'error'
      }),
      { 
        status: 200, // Keep status 200 but include error in body
        headers: corsHeaders
      }
    );
  }
});
