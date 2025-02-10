
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { SearchRequest, SearchResponse } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

console.log("Search Places Edge Function Initialized");

serve(async (req) => {
  try {
    console.log('Received request from origin:', req.headers.get('origin'));
    
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
      console.log('Received request data:', JSON.stringify(requestData));
    } catch (error) {
      console.error('Error parsing request body:', error);
      throw new Error('Invalid request body');
    }

    const { query, country, region, startIndex = 0 } = requestData as SearchRequest;
    
    if (!query || !country) {
      throw new Error('Missing required parameters: query and country are required');
    }

    console.log('Processing search request:', { query, country, region, startIndex });

    // For testing purposes, return a mock result
    const searchResult: SearchResponse = {
      results: [{
        url: "https://example.com",
        details: {
          title: "Test Result",
          description: "This is a test result to verify the edge function is working",
          lastChecked: new Date().toISOString()
        }
      }],
      hasMore: false
    };

    console.log('Returning results:', JSON.stringify(searchResult));

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
