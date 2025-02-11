
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userId = await verifyUser(req.headers.get('Authorization'));
    console.log('User verified:', userId);

    const { action, params } = await req.json();
    console.log('Request received:', { action, params });

    if (action !== 'search') {
      throw new Error('Invalid action type');
    }

    if (!params.query || !params.country || !params.region) {
      throw new Error('Missing required search parameters');
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
                      errorMessage.includes('required') ? 400 : 500;

    return new Response(
      JSON.stringify({
        error: errorMessage
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
