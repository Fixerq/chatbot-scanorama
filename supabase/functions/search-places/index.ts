import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const GOOGLE_API_KEY = Deno.env.get('Google API');
const RADIUS_MILES = 20;
const METERS_PER_MILE = 1609.34;

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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key
    if (!GOOGLE_API_KEY) {
      console.error('Google API key not found in environment variables');
      throw new Error('Google API key is not configured');
    }

    const { query, country, region } = await req.json() as SearchRequest;
    console.log('Received search request:', { query, country, region });

    // Build location query
    let locationQuery = query;
    if (region && country) {
      locationQuery = `${query} ${region} ${country}`;
    } else if (country) {
      locationQuery = `${query} ${country}`;
    }
    
    console.log('Using search query:', locationQuery);

    // Convert radius to meters for Places API
    const radiusMeters = Math.round(RADIUS_MILES * METERS_PER_MILE);

    // Get country code for components parameter
    const countryCode = getCountryCode(country);
    
    // Build search parameters with components restriction
    const searchParams = new URLSearchParams({
      query: locationQuery,
      type: 'business',
      radius: radiusMeters.toString(),
      key: GOOGLE_API_KEY,
      ...(countryCode && { components: `country:${countryCode}` }),
    });

    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?${searchParams.toString()}`;
    console.log('Making Places API request:', searchUrl.replace(GOOGLE_API_KEY, '[REDACTED]'));

    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      console.error('Places API error:', {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
      });
      
      const errorText = await searchResponse.text();
      console.error('Error response:', errorText);
      
      throw new Error(`Places API request failed: ${searchResponse.statusText} - ${errorText}`);
    }

    const searchData = await searchResponse.json();
    console.log('Places API response status:', searchData.status);

    if (searchData.status === 'REQUEST_DENIED') {
      console.error('Places API request denied. Full response:', searchData);
      throw new Error(`Places API request denied: ${searchData.error_message || 'No error message provided'}`);
    }

    if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
      console.error('Places API error:', searchData);
      throw new Error(`Places API error: ${searchData.status}`);
    }

    // Get details for each place
    const placesWithDetails = await Promise.all(
      (searchData.results || []).slice(0, 10).map(async (place: any) => {
        if (!place.place_id) return null;

        try {
          const detailsParams = new URLSearchParams({
            place_id: place.place_id,
            fields: 'website,name,formatted_address',
            key: GOOGLE_API_KEY,
          });

          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?${detailsParams.toString()}`;
          const detailsResponse = await fetch(detailsUrl);
          
          if (!detailsResponse.ok) {
            console.error('Place Details API error:', {
              status: detailsResponse.status,
              statusText: detailsResponse.statusText,
              placeId: place.place_id
            });
            return null;
          }

          const detailsData = await detailsResponse.json();

          if (detailsData.status === 'OK' && detailsData.result?.website) {
            return {
              url: detailsData.result.website,
              name: detailsData.result.name,
              address: detailsData.result.formatted_address,
            };
          }
        } catch (error) {
          console.error('Error fetching place details:', error);
        }
        return null;
      })
    );

    // Filter out places without websites and format response
    const validResults = placesWithDetails
      .filter((place): place is NonNullable<typeof place> => 
        place !== null && Boolean(place.url)
      )
      .map(place => ({
        url: place.url,
        details: {
          title: place.name,
          description: place.address,
          lastChecked: new Date().toISOString()
        }
      }));

    console.log(`Found ${validResults.length} businesses with websites`);

    return new Response(
      JSON.stringify({
        results: validResults,
        hasMore: Boolean(searchData.next_page_token)
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

// Helper function to get country code
function getCountryCode(country: string): string | null {
  const countryMap: { [key: string]: string } = {
    'United States': 'US',
    'United Kingdom': 'GB',
    'Canada': 'CA',
    'Australia': 'AU',
    'Germany': 'DE',
    'France': 'FR',
    'Spain': 'ES',
    'Italy': 'IT',
    'Japan': 'JP',
    'Brazil': 'BR',
    'India': 'IN',
    'China': 'CN',
    'Singapore': 'SG',
    'Netherlands': 'NL',
    'Sweden': 'SE'
  };

  return countryMap[country] || null;
}