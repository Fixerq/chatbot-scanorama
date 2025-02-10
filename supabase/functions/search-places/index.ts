import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders, handleOptions } from '../_shared/cors.ts';

const GOOGLE_API_KEY = Deno.env.get('Google API');
const RADIUS_MILES = 20;
const METERS_PER_MILE = 1609.34;
const MAX_RESULTS = 50;
const GEOCODING_CACHE_TTL = 86400;

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
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          ...corsHeaders,
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    const { query, country, region, startIndex } = await req.json() as SearchRequest;
    console.log('Received search request:', { query, country, region });

    if (!GOOGLE_API_KEY) {
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
    let coordinates = getCachedCoordinates(locationQuery);

    if (!coordinates) {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationQuery)}&key=${GOOGLE_API_KEY}`;
      console.log('Making Geocoding API request with query:', locationQuery);

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
      console.log('Geocoded location:', coordinates);
      setCachedCoordinates(locationQuery, coordinates.lat, coordinates.lng);
    }

    const radiusMeters = Math.round(RADIUS_MILES * METERS_PER_MILE);
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
    
    if (!searchData.places) {
      console.log('No places found');
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
