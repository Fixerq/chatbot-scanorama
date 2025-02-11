
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { searchBusinesses } from './businessSearch.ts';
import { verifyUser } from './auth.ts';
import { validateSearchRequest } from './validation.ts';
import { storeSearchResults } from './storage.ts';
import { corsHeaders } from './types.ts';

// Make sure function has proper error handling for all types of requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      }
    });
  }

  try {
    // Add detailed logging
    console.log('Request received:', {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      url: req.url
    });

    const userId = await verifyUser(req.headers.get('Authorization'));
    console.log('User authenticated:', userId);

    const { action, params } = await req.json();
    console.log('Request parameters:', { action, params });

    const validationError = validateSearchRequest(action, params);
    if (validationError) {
      console.error('Validation error:', validationError);
      throw new Error(validationError);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const result = await searchBusinesses(params);
    console.log('Search completed successfully');

    const searchBatchId = await storeSearchResults(supabaseAdmin, {
      userId,
      query: params.query,
      country: params.country,
      region: params.region,
      results: result.results
    });

    return new Response(
      JSON.stringify({ data: { ...result, searchBatchId } }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        } 
      }
    );
  } catch (error) {
    console.error('Request error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const statusCode = errorMessage.includes('Missing required') ? 400 : 
                      errorMessage.includes('Invalid action') ? 400 : 
                      errorMessage.includes('Failed to record') ? 500 : 500;

    return new Response(
      JSON.stringify({
        error: errorMessage,
        status: statusCode
      }),
      { 
        status: statusCode,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        } 
      }
    );
  }
});
