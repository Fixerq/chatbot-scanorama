
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { searchBusinesses } from "./businessSearch.ts";

console.log("Search Places Edge Function Initialized");

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
            status: 200, // Return 200 to avoid CORS issues
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
            status: 200, // Return 200 to avoid CORS issues
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
        status: 200, // Return 200 to avoid CORS issues
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
        status: 200, // Return 200 to avoid CORS issues
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin 
        } 
      }
    );
  }
});
