
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Search Places Edge Function Initialized");

async function getLocationCoordinates(region: string, country: string) {
  const GOOGLE_API_KEY = Deno.env.get('Google API');
  const geocodeEndpoint = 'https://maps.googleapis.com/maps/api/geocode/json';
  
  try {
    const locationQuery = `${region}, ${country}`;
    console.log('Geocoding location:', locationQuery);
    
    const response = await fetch(
      `${geocodeEndpoint}?address=${encodeURIComponent(locationQuery)}&key=${GOOGLE_API_KEY}`
    );
    const data = await response.json();
    console.log('Geocoding response status:', data.status);
    
    if (data.results?.[0]?.geometry?.location) {
      console.log('Found coordinates:', data.results[0].geometry.location);
      return data.results[0].geometry.location;
    }
    throw new Error(`Location not found for: ${locationQuery}`);
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
}

async function searchBusinesses(params: { query: string; country: string; region?: string }) {
  const GOOGLE_API_KEY = Deno.env.get('Google API');
  console.log('Search params:', JSON.stringify(params));

  if (!GOOGLE_API_KEY) {
    console.error('Missing Google API configuration');
    throw new Error('API configuration missing');
  }

  if (!params.region) {
    throw new Error('Region is required for local business search');
  }

  try {
    // Get coordinates for the region
    const location = await getLocationCoordinates(params.region, params.country);
    console.log('Location coordinates:', location);

    // Use Places Nearby Search API
    const placesEndpoint = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
    const searchParams = new URLSearchParams({
      location: `${location.lat},${location.lng}`,
      radius: '80000', // 50 miles in meters
      keyword: params.query,
      type: 'establishment',
      key: GOOGLE_API_KEY
    });

    console.log('Searching with URL:', `${placesEndpoint}?${searchParams}`);
    const response = await fetch(`${placesEndpoint}?${searchParams}`);
    const data = await response.json();
    console.log('Places API response status:', data.status);

    if (data.status !== 'OK') {
      throw new Error(`Places API error: ${data.status}`);
    }

    console.log(`Found ${data.results.length} places`);

    // Get detailed information for each place
    const detailedResults = await Promise.all(
      data.results.slice(0, 20).map(async (place) => {
        const detailsEndpoint = 'https://maps.googleapis.com/maps/api/place/details/json';
        const detailsParams = new URLSearchParams({
          place_id: place.place_id,
          fields: 'website,formatted_phone_number,formatted_address,url',
          key: GOOGLE_API_KEY
        });

        try {
          const detailsResponse = await fetch(`${detailsEndpoint}?${detailsParams}`);
          const detailsData = await detailsResponse.json();

          return {
            url: detailsData.result?.website || '',
            details: {
              title: place.name,
              description: `${place.name} - ${place.vicinity}`,
              lastChecked: new Date().toISOString(),
              address: detailsData.result?.formatted_address || place.vicinity,
              phone: detailsData.result?.formatted_phone_number || '',
              mapsUrl: detailsData.result?.url || '',
              types: place.types,
              rating: place.rating
            }
          };
        } catch (error) {
          console.error('Error fetching place details:', error);
          return null;
        }
      })
    );

    const validResults = detailedResults.filter(result => result !== null);
    console.log(`Found ${validResults.length} valid business results`);

    return {
      results: validResults,
      hasMore: data.next_page_token ? true : false
    };
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin') || '*';
  console.log('Incoming request from origin:', origin);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        ...corsHeaders,
        'Access-Control-Allow-Origin': origin 
      } 
    });
  }

  try {
    const { type, query, country, region, startIndex } = await req.json();
    console.log('Request params:', { type, query, country, region, startIndex });

    if (type === 'get_api_key') {
      const apiKey = Deno.env.get('Firecrawl');
      console.log('API key fetch attempt');
      
      if (!apiKey) {
        console.error('Firecrawl API key not configured');
        return new Response(
          JSON.stringify({ 
            error: 'API key not configured',
            details: 'Firecrawl API key is missing from environment variables'
          }),
          { 
            status: 500,
            headers: { 
              ...corsHeaders,
              'Access-Control-Allow-Origin': origin,
              'Content-Type': 'application/json'
            } 
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          data: { 
            apiKey: apiKey 
          }
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Access-Control-Allow-Origin': origin,
            'Content-Type': 'application/json'
          } 
        }
      );
    }

    if (type === 'search') {
      if (!query || !country || !region) {
        return new Response(
          JSON.stringify({ 
            error: 'Missing required parameters',
            received: { query, country, region }
          }),
          { 
            status: 400,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': origin 
            } 
          }
        );
      }

      console.log('Executing search with params:', { query, country, region });
      const searchResults = await searchBusinesses({ query, country, region });

      return new Response(
        JSON.stringify({ 
          data: searchResults
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin 
          } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: 'Invalid request type',
        receivedType: type 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin 
        } 
      }
    );

  } catch (error) {
    console.error('Error in search function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        origin: origin
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin 
        } 
      }
    );
  }
});
