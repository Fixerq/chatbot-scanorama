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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, country, region, startIndex } = await req.json() as SearchRequest;
    console.log('Search request:', { query, country, region, startIndex });

    if (!GOOGLE_API_KEY) {
      console.error('Google API key not found');
      throw new Error('Google API key is not configured');
    }

    // Build location query
    const locationQuery = region ? `${region}, ${country}` : country;
    
    // Construct the places search URL
    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    searchUrl.searchParams.append('query', `${query} in ${locationQuery}`);
    searchUrl.searchParams.append('key', GOOGLE_API_KEY);
    
    if (startIndex) {
      searchUrl.searchParams.append('pagetoken', startIndex.toString());
    }

    console.log('Searching places with URL:', searchUrl.toString());

    // Fetch places
    const placesResponse = await fetch(searchUrl.toString());
    
    if (!placesResponse.ok) {
      console.error('Places API request failed:', placesResponse.statusText);
      throw new Error('Failed to fetch places from Google API');
    }

    const placesData = await placesResponse.json();
    console.log('Places API response:', {
      status: placesData.status,
      resultsCount: placesData.results?.length || 0
    });

    if (placesData.status !== 'OK' && placesData.status !== 'ZERO_RESULTS') {
      console.error('Places API error:', placesData);
      throw new Error(
        placesData.error_message || 
        `Places API returned status: ${placesData.status}`
      );
    }

    if (!placesData.results || placesData.results.length === 0) {
      return new Response(
        JSON.stringify({ 
          results: [], 
          hasMore: false 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get details for each place with explicit website field request
    const detailedResults = await Promise.all(
      placesData.results.map(async (place: any) => {
        if (!place.place_id) {
          console.log('Place missing place_id:', place);
          return null;
        }

        try {
          const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
          detailsUrl.searchParams.append('place_id', place.place_id);
          detailsUrl.searchParams.append('fields', 'website,name,formatted_address');
          detailsUrl.searchParams.append('key', GOOGLE_API_KEY);

          console.log(`Fetching details for place: ${place.name}`);
          
          const detailsResponse = await fetch(detailsUrl.toString());
          if (!detailsResponse.ok) {
            console.error(`Failed to fetch details for place ${place.place_id}: ${detailsResponse.statusText}`);
            return null;
          }

          const detailsData = await detailsResponse.json();
          console.log(`Place details for ${place.name}:`, {
            status: detailsData.status,
            hasWebsite: !!detailsData.result?.website
          });

          if (detailsData.status !== 'OK' || !detailsData.result) {
            console.log('Invalid place details:', detailsData);
            return null;
          }

          const { website, name, formatted_address } = detailsData.result;

          // Only return places with valid websites
          if (!website) {
            console.log(`No website found for place: ${name}`);
            return null;
          }

          // Validate website URL
          try {
            new URL(website);
            console.log(`Valid website found for ${name}: ${website}`);
            return {
              url: website,
              details: {
                title: name || place.name,
                description: formatted_address || place.formatted_address,
                lastChecked: new Date().toISOString()
              }
            };
          } catch (error) {
            console.log(`Invalid website URL for ${name}: ${website}`);
            return null;
          }
        } catch (error) {
          console.error(`Error fetching details for place ${place.place_id}:`, error);
          return null;
        }
      })
    );

    // Filter out null results and prepare response
    const validResults = detailedResults.filter((result): result is NonNullable<typeof result> => 
      result !== null && 
      typeof result.url === 'string' && 
      result.url.length > 0
    );
    
    console.log(`Found ${validResults.length} valid results with websites`);
    
    return new Response(
      JSON.stringify({
        results: validResults,
        hasMore: !!placesData.next_page_token
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        results: [],
        hasMore: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});