
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders, handleOptions } from '../_shared/cors.ts';

const GOOGLE_API_KEY = Deno.env.get('Google API');
const RADIUS_MILES = 20;
const METERS_PER_MILE = 1609.34;
const MAX_RESULTS = 50;

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

    // First, geocode the location
    const locationQuery = `${region ? region + ', ' : ''}${country}`;
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationQuery)}&key=${GOOGLE_API_KEY}`;
    
    console.log('Making Geocoding API request with query:', locationQuery);

    const geocodeResponse = await fetch(geocodeUrl);
    if (!geocodeResponse.ok) {
      throw new Error(`Geocoding API request failed: ${geocodeResponse.statusText}`);
    }

    const geocodeData: GeocodeResponse = await geocodeResponse.json();
    if (!geocodeData.results || geocodeData.results.length === 0) {
      throw new Error('No geocoding results found for the specified location');
    }

    const { lat, lng } = geocodeData.results[0].geometry.location;
    console.log('Geocoded location:', { lat, lng });

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
            center: { latitude: lat, longitude: lng },
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
