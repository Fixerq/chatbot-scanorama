import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    const GOOGLE_API_KEY = Deno.env.get('Google API');
    
    if (!GOOGLE_API_KEY) {
      console.error('Google API key not found in environment variables');
      throw new Error('Google API key is not configured');
    }

    const { query, country, region, startIndex } = await req.json() as SearchRequest;
    console.log('Search request:', { query, country, region, startIndex });

    // Build location query
    const locationQuery = region ? `${region}, ${country}` : country;
    const searchQuery = `${query} in ${locationQuery}`;
    console.log('Search query:', searchQuery);

    // Get coordinates for location biasing
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationQuery)}&key=${GOOGLE_API_KEY}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (!geocodeData.results?.[0]?.geometry?.location) {
      console.error('Geocoding failed:', geocodeData);
      throw new Error('Could not determine location coordinates');
    }

    const { lat, lng } = geocodeData.results[0].geometry.location;
    console.log('Location coordinates:', { lat, lng });

    // Search for places
    const placesUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    const searchParams = new URLSearchParams({
      query: searchQuery,
      key: GOOGLE_API_KEY,
      location: `${lat},${lng}`,
      radius: '50000', // 50km radius
      type: 'establishment'
    });

    if (startIndex) {
      searchParams.append('pagetoken', startIndex.toString());
    }

    placesUrl.search = searchParams.toString();
    console.log('Places API URL:', placesUrl.toString());

    const placesResponse = await fetch(placesUrl.toString());
    const placesData = await placesResponse.json();

    if (placesData.status !== 'OK' && placesData.status !== 'ZERO_RESULTS') {
      console.error('Places API error:', placesData);
      throw new Error(`Places API failed: ${placesData.error_message || placesData.status}`);
    }

    console.log('Places API response:', placesData);

    if (!placesData.results?.length) {
      console.log('No places found');
      return new Response(
        JSON.stringify({
          results: [],
          hasMore: false,
          message: 'No businesses found in this area'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website,formatted_phone_number,name,formatted_address&key=${GOOGLE_API_KEY}`;
          const detailsResponse = await fetch(detailsUrl);
          const detailsData = await detailsResponse.json();

          console.log('Place details response:', detailsData);

          if (detailsData.status !== 'OK' || !detailsData.result) {
            console.log('Invalid place details:', detailsData);
            return null;
          }

          const { website, formatted_phone_number, name, formatted_address } = detailsData.result;

          // Skip places without websites
          if (!website) {
            console.log('Place missing website:', name);
            return null;
          }

          try {
            new URL(website);
            return {
              url: website,
              phone: formatted_phone_number || 'N/A',
              status: 'Processing...',
              details: {
                title: name || place.name,
                description: formatted_address || place.formatted_address,
                lastChecked: new Date().toISOString()
              }
            };
          } catch (error) {
            console.log('Invalid website URL:', website);
            return null;
          }
        } catch (error) {
          console.error('Error fetching place details:', error);
          return null;
        }
      })
    );

    const validResults = detailedResults.filter((result): result is NonNullable<typeof result> => 
      result !== null && 
      result.url && 
      result.details?.title
    );

    console.log(`Found ${validResults.length} valid results with websites`);

    return new Response(
      JSON.stringify({
        results: validResults,
        hasMore: Boolean(placesData.next_page_token)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
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