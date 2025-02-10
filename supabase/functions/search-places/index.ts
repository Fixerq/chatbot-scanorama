
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { SearchRequest, SearchResponse } from './types.ts';
import { corsHeaders, getSearchRadius } from './constants.ts';
import { getCachedCoordinates, getCoordinates } from './geocoding.ts';
import { searchPlaces } from './placesApi.ts';
import { verifyUser } from './auth.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      }
    });
  }

  try {
    console.log('Starting search places function');
    
    // Skip auth for now to debug connection
    // await verifyUser(req.headers.get('Authorization'));

    if (req.method !== 'POST') {
      console.error('Invalid method:', req.method);
      throw new Error('Method not allowed');
    }

    const requestData = await req.json();
    console.log('Request data:', requestData);

    const { query, country, region } = requestData as SearchRequest;
    console.log('Parsed search request:', { query, country, region });

    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    if (!GOOGLE_API_KEY) {
      console.error('GOOGLE_API_KEY not found in environment variables');
      throw new Error('Google API key is not configured');
    }

    // Get coordinates for the location
    const locationQuery = `${region ? region + ', ' : ''}${country}`;
    console.log('Location query:', locationQuery);
    
    let coordinates = getCachedCoordinates(locationQuery);
    if (!coordinates) {
      coordinates = await getCoordinates(locationQuery, GOOGLE_API_KEY);
    }

    // Get radius based on whether region is specified
    const radiusMeters = getSearchRadius(region);
    console.log(`Using search radius of ${radiusMeters / 1609.34} miles`);

    // Search for places
    const searchResult = await searchPlaces(
      query,
      coordinates,
      radiusMeters,
      GOOGLE_API_KEY
    );

    console.log(`Found ${searchResult.results.length} results`);

    return new Response(
      JSON.stringify(searchResult),
      { 
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        } 
      }
    );

  } catch (error) {
    console.error('Error in search-places function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorResponse = {
      error: errorMessage,
      results: [],
      hasMore: false
    };

    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        }
      }
    );
  }
});
