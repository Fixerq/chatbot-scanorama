
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { SearchRequest, SearchResponse } from './types.ts';
import { corsHeaders } from '../_shared/cors.ts';

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
    
    if (req.method !== 'POST') {
      throw new Error(`Method ${req.method} not allowed`);
    }

    // Parse the request body
    const requestData = await req.json();
    console.log('Request data:', requestData);

    const { query, country, region, startIndex = 0 } = requestData as SearchRequest;
    
    if (!query || !country) {
      throw new Error('Missing required parameters: query and country are required');
    }

    console.log('Parsed search request:', { query, country, region, startIndex });

    // For now, return empty results since we removed Google Places integration
    const searchResult: SearchResponse = {
      results: [],
      hasMore: false
    };

    console.log('Returning results:', searchResult);

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
        status: error instanceof Error && error.message.includes('not allowed') ? 405 : 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
