
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders, handleOptions } from '../_shared/cors.ts';

const GOOGLE_API_KEY = Deno.env.get('Google API');
const RADIUS_MILES = 20;
const METERS_PER_MILE = 1609.34;
const MAX_RESULTS = 50;
const GEOCODING_CACHE_TTL = 86400; // 24 hours in seconds

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

// Simple in-memory cache for geocoding results
const geocodingCache = new Map<string, GeocodeCacheEntry>();

/**
 * Retrieves cached coordinates for a given query if available and not expired.
 */
function getCachedCoordinates(query: string): { lat: number; lng: number } | null {
  const cacheEntry = geocodingCache.get(query);
  if (cacheEntry) {
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime - cacheEntry.timestamp < GEOCODING_CACHE_TTL) {
      return { lat: cacheEntry.lat, lng: cacheEntry.lng };
    }
    // Remove expired cache entry
    geocodingCache.delete(query);
  }
  return null;
}

/**
 * Stores coordinates in the cache with the current timestamp.
 */
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
    
    const { query, country, region } = await req.json() as SearchRequest;
    console.log('Received search request:', { query, country, region });

    if (!GOOGLE_API_KEY) {
      throw new Error('Google API key is not configured');
    }

    // Construct the location query for geocoding
    const locationQuery = `${region ? region + ', ' : ''}${country}`;
    
    // Attempt to retrieve cached coordinates
    let coordinates = getCachedCoordinates(locationQuery);

    if (!coordinates) {
      // Geocoding API URL
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
        throw new Error(`Geocoding API request failed: ${geocodeResponse.statusText}`);
      }

      const geocodeData: GeocodeResponse = await geocodeResponse.json();
      if (!geocodeData.results || geocodeData.results.length === 0) {
        throw new Error('No geocoding results found for the specified location');
      }

      coordinates = geocodeData.results[0].geometry.location;
      console.log('Geocoded location:', coordinates);

      // Cache the obtained coordinates
      setCachedCoordinates(locationQuery, coordinates.lat, coordinates.lng);
    } else {
      console.log('Using cached geocoded coordinates:', coordinates);
    }

    // Convert radius to meters for Places API
    const radiusMeters = Math.round(RADIUS_MILES * METERS_PER_MILE);

    // Search for businesses using Places API V2
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
      throw new Error(`Places API request failed: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    
    if (!searchData.places) {
      console.log('No places found');
      return new Response(
        JSON.stringify({ 
          results: [],
          hasMore: false
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json'
          } 
        }
      );
    }

    // Filter and format results
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
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        } 
      }
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
