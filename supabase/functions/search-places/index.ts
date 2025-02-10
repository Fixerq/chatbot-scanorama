
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { verifyUser } from "./auth.ts";
import { SearchRequest, SearchResponse } from './types.ts';

console.log("Search Places Edge Function Initialized");

serve(async (req) => {
  const origin = req.headers.get('origin') || '*';
  console.log('Request received from origin:', origin);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  try {
    // Validate request method early
    if (req.method !== 'POST') {
      throw new Error(`Method ${req.method} not allowed`);
    }

    // Get API keys early and validate
    const GOOGLE_API_KEY = Deno.env.get('Google API');
    const GOOGLE_CX = Deno.env.get('GOOGLE_CX');
    const FIRECRAWL_API_KEY = Deno.env.get('Firecrawl');

    console.log('API Keys found:', {
      hasGoogleApi: !!GOOGLE_API_KEY,
      hasGoogleCx: !!GOOGLE_CX,
      hasFirecrawl: !!FIRECRAWL_API_KEY
    });

    if (!GOOGLE_API_KEY || !GOOGLE_CX) {
      console.error('Missing Google API configuration');
      throw new Error('Google API configuration missing');
    }

    // Verify user authentication
    const userId = await verifyUser(req.headers.get('Authorization'));
    console.log('User authenticated:', userId);

    // Parse request body
    let requestData: SearchRequest;
    try {
      requestData = await req.json();
      console.log('Request data:', requestData);
    } catch (error) {
      console.error('Error parsing request body:', error);
      throw new Error('Invalid request body');
    }

    // Handle API key request
    if (requestData.type === 'get_api_key') {
      console.log('Returning Firecrawl API key');
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
      throw new Error('Missing required parameters: query and country are required');
    }

    // Construct search query
    const searchTerms = [query];
    if (region) searchTerms.push(region);
    searchTerms.push(country);
    const searchQuery = searchTerms.join(' ');
    const start = startIndex ? startIndex + 1 : 1;

    // Make request to Google Custom Search API
    const googleApiUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(searchQuery)}&start=${start}`;
    
    console.log('Making Google API request');
    const response = await fetch(googleApiUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error('Google API error:', data);
      throw new Error(data.error?.message || 'Failed to fetch search results');
    }

    console.log('Google API response received');

    // Transform results
    const results = data.items?.map((item: any) => ({
      url: item.link,
      details: {
        title: item.title,
        description: item.snippet,
        lastChecked: new Date().toISOString()
      }
    })) || [];

    const searchResult: SearchResponse = {
      results,
      hasMore: Boolean(data.queries?.nextPage?.[0])
    };

    console.log(`Returning ${results.length} results`);

    return new Response(
      JSON.stringify(searchResult),
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
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        results: [],
        hasMore: false
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin
        },
        status: 500
      }
    );
  }
});
