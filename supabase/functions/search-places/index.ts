
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SearchParams } from './types.ts';
import { searchBusinesses } from './businessSearch.ts';
import { verifyUser } from './auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userId = await verifyUser(req.headers.get('Authorization'));
    console.log('User authenticated:', userId);

    const { action, params } = await req.json();
    console.log('Request received:', { action, params });

    if (action !== 'search') {
      console.error('Invalid action type:', action);
      throw new Error('Invalid action type');
    }

    // Validate required parameters
    if (!params?.query || !params?.country || !params?.region) {
      console.error('Missing required parameters:', params);
      throw new Error('Missing required search parameters: query, country, and region are required');
    }

    const result = await searchBusinesses(params as SearchParams);
    console.log('Search completed successfully');

    return new Response(
      JSON.stringify({ data: result }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Request error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const statusCode = errorMessage.includes('API key') ? 403 : 
                      errorMessage.includes('required') ? 400 : 
                      errorMessage.includes('Invalid action') ? 400 : 500;

    return new Response(
      JSON.stringify({
        error: errorMessage,
        status: statusCode
      }),
      { 
        status: statusCode,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
