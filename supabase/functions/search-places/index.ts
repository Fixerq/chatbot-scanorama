
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Search Places Edge Function Initialized");

async function getLocationCoordinates(region: string, country: string) {
  const GOOGLE_API_KEY = Deno.env.get('Google API');
  const geocodeEndpoint = 'https://maps.googleapis.com/maps/api/geocode/json';
  
  try {
    const response = await fetch(
      `${geocodeEndpoint}?address=${encodeURIComponent(`${region}, ${country}`)}&key=${GOOGLE_API_KEY}`
    );
    const data = await response.json();
    console.log('Geocoding response:', data.status);
    
    if (data.results?.[0]?.geometry?.location) {
      return data.results[0].geometry.location;
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }
  return null;
}

async function searchBusinesses(query: string, country: string, region?: string) {
  const GOOGLE_API_KEY = Deno.env.get('Google API');
  const GOOGLE_CX = Deno.env.get('GOOGLE_CX');

  if (!GOOGLE_API_KEY || !GOOGLE_CX) {
    console.error('Missing Google API configuration');
    return { results: [], hasMore: false };
  }

  const searchQuery = region 
    ? `${query} in ${region}, ${country}`
    : `${query} in ${country}`;

  try {
    // First use Google Custom Search to get initial results
    const searchUrl = `https://customsearch.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(searchQuery)}`;
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error('Google API error:', data);
      return { results: [], hasMore: false };
    }

    // Process and format the results
    const results = data.items?.map((item: any) => ({
      url: item.link,
      details: {
        title: item.title,
        description: item.snippet,
        lastChecked: new Date().toISOString()
      }
    })) || [];

    console.log(`Found ${results.length} results`);

    return {
      results: results.slice(0, 20), // Limit to top 20 results
      hasMore: data.queries?.nextPage ? true : false
    };
  } catch (error) {
    console.error('Search error:', error);
    return { results: [], hasMore: false };
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
      if (!query || !country) {
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
      const searchResults = await searchBusinesses(query, country, region);

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
