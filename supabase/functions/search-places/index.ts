
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { verifyUser } from "./auth.ts";
import { SearchRequest, SearchResponse } from "./types.ts";

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
    if (req.method !== 'POST') {
      throw new Error(`Method ${req.method} not allowed`);
    }

    // Get API keys
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    const GOOGLE_CX = Deno.env.get('GOOGLE_CX');
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');

    if (!GOOGLE_API_KEY || !GOOGLE_CX) {
      throw new Error('Google API configuration missing');
    }

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    const userId = await verifyUser(authHeader);
    console.log('User authenticated successfully:', userId);

    // Parse request body
    const requestData: SearchRequest = await req.json();
    console.log('Request data:', requestData);

    // Handle API key request
    if (requestData.type === 'get_api_key') {
      if (!FIRECRAWL_API_KEY) {
        throw new Error('Firecrawl API key not configured');
      }

      return new Response(
        JSON.stringify({ apiKey: FIRECRAWL_API_KEY }),
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
    const { query, country, region, startIndex = 0 } = requestData;
    
    if (!query || !country) {
      throw new Error('Missing required search parameters');
    }

    // Construct search query
    let searchQuery = `${query} business in ${country}`;
    if (region) {
      searchQuery += ` ${region}`;
    }

    console.log('Performing Google search with query:', searchQuery);

    // Call Google Custom Search API
    const googleSearchUrl = new URL('https://www.googleapis.com/customsearch/v1');
    googleSearchUrl.searchParams.append('key', GOOGLE_API_KEY);
    googleSearchUrl.searchParams.append('cx', GOOGLE_CX);
    googleSearchUrl.searchParams.append('q', searchQuery);
    googleSearchUrl.searchParams.append('start', startIndex.toString());

    const response = await fetch(googleSearchUrl.toString());
    const data = await response.json();

    if (!response.ok) {
      console.error('Google API error:', data);
      throw new Error(data.error?.message || 'Google search failed');
    }

    // Process and format results
    const results = data.items?.map((item: any) => ({
      url: item.link,
      details: {
        title: item.title,
        description: item.snippet,
        lastChecked: new Date().toISOString()
      }
    })) || [];

    const searchResponse: SearchResponse = {
      results,
      hasMore: !!data.queries?.nextPage?.[0]
    };

    console.log('Search completed successfully');

    return new Response(
      JSON.stringify(searchResponse),
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
