import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const GOOGLE_API_KEY = Deno.env.get('Google API');
const RADIUS_MILES = 20;
const METERS_PER_MILE = 1609.34;
const MAX_RESULTS = 20; // Increased from 10 to 20

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  query: string;
  country: string;
  region: string;
  startIndex?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, country, region } = await req.json() as SearchRequest;
    console.log('Received search request:', { query, country, region });

    if (!GOOGLE_API_KEY) {
      console.error('Google API key not found');
      throw new Error('Google API key is not configured');
    }

    let locationQuery = query;
    if (region && country) {
      locationQuery = `${query} ${region} ${country}`;
    } else if (country) {
      locationQuery = `${query} ${country}`;
    }
    
    console.log('Using search query:', locationQuery);

    // Convert radius to meters for Places API
    const radiusMeters = Math.round(RADIUS_MILES * METERS_PER_MILE);

    // Search for businesses using Places Text Search
    const searchParams = new URLSearchParams({
      query: locationQuery,
      key: GOOGLE_API_KEY,
    });

    const searchUrl = `https://places.googleapis.com/v1/places:searchText`;
    console.log('Making Places API request to:', searchUrl);
    console.log('Search query:', locationQuery);

    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.types',
      },
      body: JSON.stringify({
        textQuery: locationQuery,
        maxResultCount: MAX_RESULTS,
        locationBias: {
          circle: {
            center: { latitude: 0, longitude: 0 },
            radius: radiusMeters,
          },
        },
      })
    });
    
    if (!searchResponse.ok) {
      console.error('Places API error:', {
        status: searchResponse.status,
        statusText: searchResponse.statusText
      });
      throw new Error(`Places API request failed: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    console.log('Places API response:', {
      totalResults: searchData.places?.length || 0,
      hasPlaces: !!searchData.places,
    });

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
        // Only include results with websites and that are businesses
        const hasWebsite = !!place.websiteUri;
        const isBusinessType = place.types?.some((type: string) => 
          ['establishment', 'business', 'store', 'service'].includes(type)
        );
        
        console.log(`Place ${place.displayName?.text}: hasWebsite=${hasWebsite}, isBusinessType=${isBusinessType}`);
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

    console.log(`Found ${results.length} businesses with websites out of ${searchData.places.length} total places`);

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
        details: error instanceof Error ? error.stack : undefined,
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