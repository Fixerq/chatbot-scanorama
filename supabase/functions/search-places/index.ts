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
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(`${query} in ${locationQuery}`)}&key=${GOOGLE_API_KEY}`;
    
    if (startIndex) {
      searchUrl.searchParams.append('pagetoken', startIndex.toString());
    }

    console.log('Searching places with URL:', searchUrl);

    // Fetch places
    const placesResponse = await fetch(searchUrl);
    
    if (!placesResponse.ok) {
      console.error('Places API request failed:', placesResponse.statusText);
      throw new Error('Failed to fetch places from Google API');
    }

    const placesData = await placesResponse.json();
    console.log('Places API response status:', placesData.status);
    console.log('Number of places found:', placesData.results?.length || 0);

    if (placesData.status !== 'OK' && placesData.status !== 'ZERO_RESULTS') {
      console.error('Places API error:', placesData);
      throw new Error(`Places API returned status: ${placesData.status}`);
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

    // Get details for each place
    const detailedResults = await Promise.all(
      placesData.results.map(async (place: any) => {
        if (!place.place_id) {
          console.log('Place missing place_id:', place);
          return null;
        }

        try {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website,name,formatted_address&key=${GOOGLE_API_KEY}`;
          console.log(`Fetching details for place: ${place.name}`);
          
          const detailsResponse = await fetch(detailsUrl);
          if (!detailsResponse.ok) {
            console.error(`Failed to fetch details for place ${place.place_id}`);
            return null;
          }

          const detailsData = await detailsResponse.json();
          
          if (detailsData.status !== 'OK' || !detailsData.result) {
            console.log('Invalid place details:', detailsData);
            return null;
          }

          const { website, name, formatted_address } = detailsData.result;

          if (!website) {
            console.log(`No website found for place: ${name}`);
            return null;
          }

          // Validate website URL
          try {
            new URL(website);
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
            console.log(`Invalid website URL for ${name}: ${website}`);
            return null;
          }
        } catch (error) {
          console.error(`Error fetching details for place ${place.place_id}:`, error);
          return null;
        }
      })
    );

    // Filter out null results
    const validResults = detailedResults.filter(result => result !== null);
    
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