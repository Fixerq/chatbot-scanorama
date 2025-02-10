
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { verifyUser } from "./auth.ts";
import { SearchRequest, SearchResponse } from './types.ts';

console.log("Search Places Edge Function Initialized");

serve(async (req) => {
  const origin = req.headers.get('origin') || '*';
  console.log('Request received from origin:', origin);
  console.log('Request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
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
      console.error(`Invalid method: ${req.method}`);
      throw new Error(`Method ${req.method} not allowed`);
    }

    // Get API keys early and validate with proper environment variable names
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    const GOOGLE_CX = Deno.env.get('GOOGLE_CX');
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');

    console.log('API Keys validation:', {
      hasGoogleApi: !!GOOGLE_API_KEY,
      hasGoogleCx: !!GOOGLE_CX,
      hasFirecrawl: !!FIRECRAWL_API_KEY
    });

    if (!GOOGLE_API_KEY || !GOOGLE_CX) {
      console.error('Missing required API keys:', {
        googleApiPresent: !!GOOGLE_API_KEY,
        googleCxPresent: !!GOOGLE_CX
      });
      throw new Error('Google API configuration missing');
    }

    // Verify user authentication
    console.log('Attempting to verify user authentication');
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    const userId = await verifyUser(authHeader);
    console.log('User authenticated successfully:', userId);

    // Parse request body
    let requestData: SearchRequest;
    try {
      const rawBody = await req.text();
      console.log('Raw request body:', rawBody);
      requestData = JSON.parse(rawBody);
      console.log('Parsed request data:', requestData);
    } catch (error) {
      console.error('Error parsing request body:', error);
      throw new Error('Invalid request body');
    }

    // Handle API key request
    if (requestData.type === 'get_api_key') {
      console.log('Processing API key request');
      if (!FIRECRAWL_API_KEY) {
        console.error('Firecrawl API key not configured');
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
    
    console.log('Processing search request:', {
      query,
      country,
      region,
      startIndex
    });

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

    console.log('Constructed search query:', {
      searchQuery,
      start
    });

    // Make request to Google Custom Search API
    const googleApiUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(searchQuery)}&start=${start}`;
    
    console.log('Making Google API request to URL:', googleApiUrl.replace(GOOGLE_API_KEY, '[REDACTED]'));
    const response = await fetch(googleApiUrl);
    console.log('Google API response status:', response.status);
    
    const data = await response.json();
    console.log('Google API response data structure:', {
      hasItems: !!data.items,
      itemsCount: data.items?.length,
      hasQueries: !!data.queries,
      hasNextPage: !!data.queries?.nextPage
    });

    if (!response.ok) {
      console.error('Google API error response:', {
        status: response.status,
        error: data.error
      });
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

    console.log(`Transformed ${results.length} results`);

    const searchResult: SearchResponse = {
      results,
      hasMore: Boolean(data.queries?.nextPage?.[0])
    };

    console.log('Sending final response:', {
      resultCount: results.length,
      hasMore: searchResult.hasMore
    });

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.log('Sending error response:', errorMessage);
    
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
          'Access-Control-Allow-Origin': origin
        },
        status: 500
      }
    );
  }
});
