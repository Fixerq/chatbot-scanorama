
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { SearchRequest, SearchResponse } from './types.ts';

console.log("Search Places Edge Function Initialized");

serve(async (req) => {
  try {
    const requestOrigin = req.headers.get('origin');
    console.log('Request received from:', requestOrigin);
    
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      console.log('Handling OPTIONS request');
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    if (req.method !== 'POST') {
      throw new Error(`Method ${req.method} not allowed`);
    }

    // Parse and validate the request body
    let requestData;
    try {
      requestData = await req.json();
      console.log('Request data:', JSON.stringify(requestData));
    } catch (error) {
      console.error('Error parsing request body:', error);
      throw new Error('Invalid request body');
    }

    const { query, country, region, startIndex = 0 } = requestData as SearchRequest;
    
    if (!query || !country) {
      throw new Error('Missing required parameters: query and country are required');
    }

    console.log('Processing search request:', { query, country, region, startIndex });

    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    const GOOGLE_CX = Deno.env.get('GOOGLE_CX');

    if (!GOOGLE_API_KEY || !GOOGLE_CX) {
      throw new Error('Google API configuration missing');
    }

    // Construct the search query
    const searchQuery = `${query} ${region || ''} ${country}`;
    const start = startIndex ? startIndex + 1 : 1; // Google's API uses 1-based indexing

    // Make request to Google Custom Search API
    const googleApiUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(searchQuery)}&start=${start}`;
    
    console.log('Fetching results from Google API...');
    const response = await fetch(googleApiUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error('Google API error:', data);
      throw new Error(data.error?.message || 'Failed to fetch search results');
    }

    // Transform the results
    const searchResult: SearchResponse = {
      results: data.items?.map((item: any) => ({
        url: item.link,
        details: {
          title: item.title,
          description: item.snippet,
          lastChecked: new Date().toISOString()
        }
      })) || [],
      hasMore: Boolean(data.queries?.nextPage?.[0])
    };

    console.log(`Found ${searchResult.results.length} results`);

    return new Response(
      JSON.stringify(searchResult),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
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
          'Content-Type': 'application/json'
        },
        status: error instanceof Error && error.message.includes('not allowed') ? 405 : 500
      }
    );
  }
});
