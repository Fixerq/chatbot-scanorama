
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { verifyUser } from "./auth.ts";
import { SearchRequest, SearchResponse } from './types.ts';

console.log("Search Places Edge Function Initialized");

serve(async (req) => {
  const origin = req.headers.get('origin');
  console.log('Request received from origin:', origin);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error(`Method ${req.method} not allowed`);
    }

    // Get API keys first
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    const GOOGLE_CX = Deno.env.get('GOOGLE_CX');

    if (!GOOGLE_API_KEY || !GOOGLE_CX) {
      console.error('Missing API configuration');
      throw new Error('Google API configuration missing');
    }

    // Verify user authentication
    const userId = await verifyUser(req.headers.get('Authorization'));
    console.log('User authenticated:', userId);

    // Parse request body
    const requestData: SearchRequest = await req.json();
    console.log('Search request:', requestData);

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
          'Access-Control-Allow-Origin': origin || '*'
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
          'Access-Control-Allow-Origin': origin || '*'
        },
        status: 500
      }
    );
  }
});
