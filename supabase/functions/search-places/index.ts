
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-header',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
const METERS_PER_MILE = 1609.34;
const MAX_RESULTS = 50;
const GEOCODING_CACHE_TTL = 86400;

// Define radius based on whether a region is specified
const getSearchRadius = (region: string | undefined): number => {
  // If no region specified, use a larger radius (100 miles)
  if (!region) {
    return Math.round(100 * METERS_PER_MILE);
  }
  // With region specified, use smaller radius (30 miles)
  return Math.round(30 * METERS_PER_MILE);
};

interface SearchRequest {
  query: string;
  country: string;
  region: string;
  startIndex?: number;
}

interface GeocodeResponse {
  results: {
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }[];
}

interface GeocodeCacheEntry {
  lat: number;
  lng: number;
  timestamp: number;
}

const geocodingCache = new Map<string, GeocodeCacheEntry>();

function getCachedCoordinates(query: string): { lat: number; lng: number } | null {
  const cacheEntry = geocodingCache.get(query);
  if (cacheEntry) {
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime - cacheEntry.timestamp < GEOCODING_CACHE_TTL) {
      return { lat: cacheEntry.lat, lng: cacheEntry.lng };
    }
    geocodingCache.delete(query);
  }
  return null;
}

function setCachedCoordinates(query: string, lat: number, lng: number): void {
  const timestamp = Math.floor(Date.now() / 1000);
  geocodingCache.set(query, { lat, lng, timestamp });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    console.log('Starting search places function');
    console.log('Method:', req.method);
    console.log('Headers:', Object.fromEntries(req.headers.entries()));
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: { persistSession: false }
      }
    );

    // Get the authorization header and verify the user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('User authenticated:', user.id);
    
    const { query, country, region, startIndex } = await req.json() as SearchRequest;
    console.log('Received search request:', { query, country, region });

    if (!GOOGLE_API_KEY) {
      console.error('GOOGLE_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Google API key is not configured',
          results: [],
          hasMore: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const locationQuery = `${region ? region + ', ' : ''}${country}`;
    console.log('Location query:', locationQuery);
    
    let coordinates = getCachedCoordinates(locationQuery);

    if (!coordinates) {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationQuery)}&key=${GOOGLE_API_KEY}`;
      console.log('Making Geocoding API request for location:', locationQuery);

      const geocodeResponse = await fetch(geocodeUrl);
      if (!geocodeResponse.ok) {
        const errorText = await geocodeResponse.text();
        console.error('Geocoding API error:', {
          status: geocodeResponse.status,
          statusText: geocodeResponse.statusText,
          error: errorText
        });
        return new Response(
          JSON.stringify({ 
            error: 'Geocoding API request failed',
            results: [],
            hasMore: false
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      const geocodeData: GeocodeResponse = await geocodeResponse.json();
      if (!geocodeData.results || geocodeData.results.length === 0) {
        console.error('No geocoding results found for query:', locationQuery);
        return new Response(
          JSON.stringify({ 
            error: 'No geocoding results found',
            results: [],
            hasMore: false
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      coordinates = geocodeData.results[0].geometry.location;
      console.log('Geocoded coordinates:', coordinates);
      setCachedCoordinates(locationQuery, coordinates.lat, coordinates.lng);
    }

    // Get radius based on whether region is specified
    const radiusMeters = getSearchRadius(region);
    console.log(`Using search radius of ${radiusMeters / METERS_PER_MILE} miles`);

    const searchUrl = 'https://places.googleapis.com/v1/places:searchText';
    
    console.log('Making Places API request with query:', query);

    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.types',
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: MAX_RESULTS,
        locationBias: {
          circle: {
            center: { latitude: coordinates.lat, longitude: coordinates.lng },
            radius: radiusMeters,
          },
        },
      })
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Places API error:', {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
        error: errorText
      });
      return new Response(
        JSON.stringify({ 
          error: 'Places API request failed',
          results: [],
          hasMore: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const searchData = await searchResponse.json();
    console.log('Places API response:', JSON.stringify(searchData, null, 2));
    
    if (!searchData.places) {
      console.log('No places found in the response');
      return new Response(
        JSON.stringify({ 
          results: [],
          hasMore: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = searchData.places
      .filter((place: any) => {
        const hasWebsite = !!place.websiteUri;
        const isBusinessType = place.types?.some((type: string) => 
          ['establishment', 'business', 'store', 'service'].includes(type)
        );
        return hasWebsite && isBusinessType;
      })
      .map((place: any) => ({
        url: place.websiteUri,
        details: {
          title: place.displayName?.text || '',
          description: place.formattedAddress || '',
          lastChecked: new Date().toISOString()
        }
      }));

    console.log(`Found ${results.length} valid business results`);

    return new Response(
      JSON.stringify({
        results,
        hasMore: searchData.places.length >= MAX_RESULTS
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-places function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        results: [],
        hasMore: false
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
