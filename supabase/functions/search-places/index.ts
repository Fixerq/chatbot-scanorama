import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchRequest {
  query: string;
  country: string;
  region: string;
  startIndex: number;
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
    
    console.log('Received search request:', { query, country, region, startIndex });
    
    const locationQuery = region && region.toLowerCase() !== country.toLowerCase() 
      ? `${region}, ${country}`
      : country;
    const searchQuery = `${query} in ${locationQuery}`;

    console.log('Using location query:', locationQuery);
    console.log('Final search query:', searchQuery);

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationQuery)}&key=${GOOGLE_API_KEY}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    console.log('Geocoding API response:', geocodeData);
    
    if (geocodeData.status === 'REQUEST_DENIED') {
      console.error('Geocoding API request denied:', geocodeData.error_message);
      throw new Error(`Google API Error: ${geocodeData.error_message || 'API not properly configured'}`);
    }

    if (geocodeData.status !== 'OK') {
      throw new Error(`Geocoding failed: ${geocodeData.status} - ${geocodeData.error_message || 'Unknown error'}`);
    }

    if (!geocodeData.results?.[0]?.geometry?.location) {
      throw new Error('No location coordinates found in geocoding response');
    }

    const { lat, lng } = geocodeData.results[0].geometry.location;
    console.log('Location coordinates:', { lat, lng });

    const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&location=${lat},${lng}&radius=50000&type=business&key=${GOOGLE_API_KEY}`;
    
    const placesResponse = await fetch(placesUrl);
    const placesData = await placesResponse.json();

    console.log('Places API response:', placesData);

    if (placesData.status === 'REQUEST_DENIED') {
      console.error('Places API request denied:', placesData.error_message);
      throw new Error(`Google API Error: ${placesData.error_message || 'API not properly configured'}`);
    }

    if (placesData.status !== 'OK') {
      throw new Error(`Places API failed: ${placesData.status} - ${placesData.error_message || 'Unknown error'}`);
    }

    // Get detailed information including phone numbers for each place
    const placesWithDetails = await Promise.all(
      placesData.results.map(async (place: any) => {
        if (place.place_id) {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website,formatted_phone_number,international_phone_number&key=${GOOGLE_API_KEY}`;
          const detailsResponse = await fetch(detailsUrl);
          const detailsData = await detailsResponse.json();
          
          if (detailsData.status === 'OK') {
            return {
              ...place,
              website: detailsData.result?.website || null,
              phone: detailsData.result?.formatted_phone_number || detailsData.result?.international_phone_number || null
            };
          }
        }
        return place;
      })
    );

    // Filter out places without websites and ensure phone numbers are included
    const validResults = placesWithDetails
      .filter((place: any) => place.website)
      .map((place: any) => ({
        url: place.website,
        phone: place.phone || 'N/A',
        status: 'Processing...',
        details: {
          title: place.name,
          description: place.formatted_address,
          lastChecked: new Date().toISOString()
        }
      }));

    console.log('Returning results with phone numbers:', validResults.length);

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