
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { verifyUser } from "./auth.ts";
import { SearchRequest, SearchResponse } from './types.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

console.log("Search Places Edge Function Initialized");

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function logApiCall(userId: string, endpoint: string, status: number, error?: string) {
  try {
    const { error: logError } = await supabase
      .from('api_logs')
      .insert([
        {
          user_id: userId,
          endpoint,
          status,
          error
        }
      ]);

    if (logError) {
      console.error('Error logging API call:', logError);
    }
  } catch (e) {
    console.error('Failed to log API call:', e);
  }
}

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
    let requestData: SearchRequest;
    try {
      const rawBody = await req.text();
      requestData = JSON.parse(rawBody);
    } catch (error) {
      throw new Error('Invalid request body');
    }

    // Handle API key request
    if (requestData.type === 'get_api_key') {
      if (!FIRECRAWL_API_KEY) {
        throw new Error('Firecrawl API key not configured');
      }

      await logApiCall(userId, 'get_api_key', 200);
      
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
    
    const response = await fetch(googleApiUrl);
    const data = await response.json();

    if (!response.ok) {
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

    await logApiCall(userId, 'search', 200);

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
    
    if (error instanceof Error && 'userId' in error) {
      await logApiCall(error.userId as string, 'search', 500, errorMessage);
    }
    
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
