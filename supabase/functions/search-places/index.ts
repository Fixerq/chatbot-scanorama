
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";

console.log("Search Places Edge Function Initialized");

serve(async (req) => {
  const origin = req.headers.get('origin') || '*';
  console.log('Incoming request from origin:', origin);
  
  // Handle CORS preflight
  const corsResponse = handleOptions(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const { type, query, country, region } = await req.json();
    console.log('Request type:', type);

    if (type === 'get_api_key') {
      const apiKey = Deno.env.get('Firecrawl');
      console.log('API key fetch attempt');
      
      if (!apiKey) {
        console.error('Firecrawl API key not configured');
        return new Response(
          JSON.stringify({ error: 'API key not configured' }),
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

      return new Response(
        JSON.stringify({ 
          data: { 
            apiKey: apiKey 
          }
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

    // Handle search request
    if (type === 'search' && query && country) {
      const GOOGLE_API_KEY = Deno.env.get('Google API');
      const GOOGLE_CX = Deno.env.get('GOOGLE_CX');

      if (!GOOGLE_API_KEY || !GOOGLE_CX) {
        console.error('Google API configuration missing');
        return new Response(
          JSON.stringify({ error: 'Search configuration missing' }),
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

      // Construct search query with region if provided
      const searchQuery = region 
        ? `${query} in ${region}, ${country}`
        : `${query} in ${country}`;

      const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(searchQuery)}`;
      
      console.log('Executing search with query:', searchQuery);
      
      const response = await fetch(searchUrl);
      const data = await response.json();

      if (!response.ok) {
        console.error('Google API error:', data);
        return new Response(
          JSON.stringify({ error: 'Search failed', details: data.error }),
          { 
            status: response.status,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': origin 
            } 
          }
        );
      }

      const results = data.items?.map((item: any) => ({
        url: item.link,
        details: {
          title: item.title,
          description: item.snippet,
          lastChecked: new Date().toISOString()
        }
      })) || [];

      console.log(`Found ${results.length} results`);

      return new Response(
        JSON.stringify({ 
          data: { 
            results,
            hasMore: data.queries?.nextPage ? true : false
          }
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
      JSON.stringify({ status: 'ok' }),
      { 
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
