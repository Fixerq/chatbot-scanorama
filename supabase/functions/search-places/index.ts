import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')

interface SearchRequest {
  query: string;
  country: string;
  region: string;
  startIndex: number;
}

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, country, region, startIndex } = await req.json() as SearchRequest;
    
    console.log('Received search request:', { query, country, region, startIndex });
    
    // Construct location-specific search query
    const locationQuery = region ? `${region}, ${country}` : country;
    const searchQuery = `${query} in ${locationQuery}`;

    // First, get the location coordinates using Geocoding API
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationQuery)}&key=${GOOGLE_API_KEY}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    console.log('Geocoding response:', geocodeData);

    if (!geocodeData.results?.[0]?.geometry?.location) {
      throw new Error('Location not found');
    }

    const { lat, lng } = geocodeData.results[0].geometry.location;

    // Then, search for businesses using Places API
    const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=50000&type=business&key=${GOOGLE_API_KEY}`;
    
    const placesResponse = await fetch(placesUrl);
    const placesData = await placesResponse.json();

    console.log('Places API response:', placesData);

    // Get website details for each place
    const placesWithWebsites = await Promise.all(
      placesData.results.map(async (place: any) => {
        if (place.place_id) {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website,formatted_phone_number&key=${GOOGLE_API_KEY}`;
          const detailsResponse = await fetch(detailsUrl);
          const detailsData = await detailsResponse.json();
          
          return {
            ...place,
            website: detailsData.result?.website || null,
            phone: detailsData.result?.formatted_phone_number || null
          };
        }
        return place;
      })
    );

    // Filter out places without websites
    const validResults = placesWithWebsites.filter((place: any) => place.website);

    console.log('Returning results:', validResults.length);

    return new Response(
      JSON.stringify({
        results: validResults,
        hasMore: placesData.next_page_token ? true : false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Search places error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})