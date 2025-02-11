
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
    const { action, params } = await req.json();
    console.log('Request params:', { action, params });

    // Handle search request
    if (action === 'search' && params?.keyword && params?.country) {
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
      const searchQuery = params.region 
        ? `${params.keyword} in ${params.region}, ${params.country}`
        : `${params.keyword} in ${params.country}`;

      const searchUrl = `https://customsearch.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(searchQuery)}`;
      
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

      // Map Google Search results to GooglePlacesResult format
      const results = data.items?.map((item: any) => ({
        name: item.title,
        formatted_address: item.snippet,
        website: item.link,
        types: []
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
      JSON.stringify({ error: 'Invalid request' }),
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
