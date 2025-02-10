
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { SearchRequest, SearchResponse } from './types.ts';
import { verifyUser } from './auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-header',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    console.log('Starting search function');
    
    // Skip auth for now to debug connection
    // await verifyUser(req.headers.get('Authorization'));

    if (req.method !== 'POST') {
      console.error('Invalid method:', req.method);
      throw new Error('Method not allowed');
    }

    const requestData = await req.json();
    console.log('Request data:', requestData);

    const { query, country, region } = requestData as SearchRequest;
    console.log('Parsed search request:', { query, country, region });

    // Return empty results for now
    const searchResult: SearchResponse = {
      results: [],
      hasMore: false
    };

    console.log('Returning empty results');

    return new Response(
      JSON.stringify(searchResult),
      { 
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Error in search function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorResponse = {
      error: errorMessage,
      results: [],
      hasMore: false
    };

    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
