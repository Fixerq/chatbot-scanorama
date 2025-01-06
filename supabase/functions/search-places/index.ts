import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const GOOGLE_API_KEY = Deno.env.get('Google API');

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
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, country, region, startIndex } = await req.json() as SearchRequest;
    console.log('Received search request:', { query, country, region, startIndex });

    if (!GOOGLE_API_KEY) {
      console.error('Google API key not found in environment variables');
      throw new Error('Google API key is not configured');
    }

    // Build location query
    const locationQuery = region ? `${query} in ${region}, ${country}` : `${query} in ${country}`;
    console.log('Constructed location query:', locationQuery);

    // Construct the Places API URL with URLSearchParams
    const params = new URLSearchParams({
      query: locationQuery,
      key: GOOGLE_API_KEY,
    });

    if (startIndex) {
      params.append('pagetoken', startIndex.toString());
    }

    const baseUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
    const searchUrl = `${baseUrl}?${params.toString()}`;
    console.log('Making request to Places API:', searchUrl.replace(GOOGLE_API_KEY, '[REDACTED]'));

    // Fetch places
    const placesResponse = await fetch(searchUrl);
    
    if (!placesResponse.ok) {
      console.error('Places API error:', {
        status: placesResponse.status,
        statusText: placesResponse.statusText
      });
      throw new Error(`Places API request failed: ${placesResponse.statusText}`);
    }

    const placesData = await placesResponse.json();
    console.log('Places API response status:', placesData.status);

    if (placesData.status !== 'OK' && placesData.status !== 'ZERO_RESULTS') {
      console.error('Places API error:', placesData);
      throw new Error(`Places API error: ${placesData.status}`);
    }

    if (!placesData.results || placesData.results.length === 0) {
      console.log('No results found');
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

    console.log(`Found ${placesData.results.length} places, fetching details...`);

    // Get details for each place
    const detailedResults = await Promise.all(
      placesData.results.map(async (place: any) => {
        if (!place.place_id) {
          console.log('Place missing place_id:', place);
          return null;
        }

        try {
          const detailsParams = new URLSearchParams({
            place_id: place.place_id,
            fields: 'website,name,formatted_address',
            key: GOOGLE_API_KEY
          });

          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?${detailsParams.toString()}`;
          console.log(`Fetching details for place: ${place.name}`);
          
          const detailsResponse = await fetch(detailsUrl);
          if (!detailsResponse.ok) {
            console.error(`Failed to fetch details for place ${place.place_id}:`, detailsResponse.statusText);
            return null;
          }

          const detailsData = await detailsResponse.json();
          
          if (detailsData.status !== 'OK' || !detailsData.result) {
            console.log(`Invalid details response for ${place.name}:`, detailsData.status);
            return null;
          }

          const { website, name, formatted_address } = detailsData.result;

          if (!website) {
            console.log(`No website found for place: ${name}`);
            return null;
          }

          return {
            url: website,
            status: 'Processing...',
            details: {
              title: name || place.name,
              description: formatted_address || place.formatted_address,
              lastChecked: new Date().toISOString()
            }
          };
        } catch (error) {
          console.error(`Error fetching details for place ${place.place_id}:`, error);
          return null;
        }
      })
    );

    // Filter out null results
    const validResults = detailedResults.filter(result => result !== null);
    console.log(`Found ${validResults.length} valid results with websites`);

    return new Response(
      JSON.stringify({
        results: validResults,
        hasMore: !!placesData.next_page_token
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