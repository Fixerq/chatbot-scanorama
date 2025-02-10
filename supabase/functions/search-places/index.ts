
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { verifyUser } from "./auth.ts";
import { SearchRequest, SearchResponse } from './types.ts';

console.log("Search Places Edge Function Initialized");

serve(async (req) => {
  // Log the request details
  const origin = req.headers.get('origin');
  console.log('Received request:', {
    method: req.method,
    origin,
    url: req.url
  });
  
  try {
    // Handle CORS preflight requests first
    if (req.method === 'OPTIONS') {
      console.log('Handling OPTIONS request');
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
      });
    }

    // Validate request method
    if (req.method !== 'POST') {
      console.error(`Invalid method: ${req.method}`);
      throw new Error(`Method ${req.method} not allowed`);
    }

    // Verify user authentication first
    console.log('Verifying user authentication');
    await verifyUser(req.headers.get('Authorization'));

    // Get API keys to fail fast if they're missing
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    const GOOGLE_CX = Deno.env.get('GOOGLE_CX');

    if (!GOOGLE_API_KEY || !GOOGLE_CX) {
      console.error('Missing API configuration');
      throw new Error('Google API configuration missing');
    }

    // Parse request body
    let requestData: SearchRequest;
    try {
      requestData = await req.json();
      console.log('Request data:', JSON.stringify(requestData));
    } catch (error) {
      console.error('Error parsing request body:', error);
      throw new Error('Invalid request body');
    }

    const { query, country, region, startIndex = 0 } = requestData;
    
    if (!query || !country) {
      console.error('Missing required parameters:', { query, country });
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

    console.log('Google API Response:', {
      status: response.status,
      hasItems: Boolean(data.items),
      itemCount: data.items?.length
    });

    if (!response.ok) {
      console.error('Google API error:', data);
      throw new Error(data.error?.message || 'Failed to fetch search results');
    }

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
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('Error in search function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        results: [],
        hasMore: false
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        status: error instanceof Error && error.message.includes('not allowed') ? 405 : 500
      }
    );
  }
});
