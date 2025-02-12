
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateSearchRequest } from './validation.ts';
import { searchBusinesses } from './businessSearch.ts';
import { corsHeaders, handleOptions } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

serve(async (req) => {
  try {
    // Log incoming request details
    console.log('Request received:', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    });

    // Handle CORS preflight requests
    const optionsResponse = handleOptions(req);
    if (optionsResponse) return optionsResponse;

    // Get origin from request headers
    const origin = req.headers.get('origin');
    console.log('Request origin:', origin);

    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Ensure content-type is application/json
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error('Content-Type must be application/json');
    }

    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed successfully:', requestBody);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      throw new Error('Invalid JSON in request body');
    }

    const { action, params } = requestBody;
    console.log('Search request:', { action, params });

    // Validate search parameters
    const validationError = validateSearchRequest(action, params);
    if (validationError) {
      console.error('Validation error:', validationError);
      throw new Error(validationError);
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration');
      throw new Error('Server configuration error');
    }

    console.log('Initializing Supabase client with URL:', supabaseUrl);
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    // Search for businesses
    console.log('Starting business search with params:', params);
    const searchResponse = await searchBusinesses(params, supabase);
    
    console.log(`Found ${searchResponse.results.length} results for query: ${params.query}`);

    // Set CORS headers based on origin
    const responseHeaders = {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin || '*'
    };

    // Return successful response
    return new Response(
      JSON.stringify({
        data: searchResponse,
        status: 'success'
      }),
      { 
        status: 200,
        headers: responseHeaders
      }
    );

  } catch (error) {
    console.error('Request error:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    
    // Include origin in error response headers
    const origin = req.headers.get('origin');
    const errorHeaders = {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin || '*'
    };
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
        status: 'error'
      }),
      { 
        status: error.message === 'Method not allowed' ? 405 : 500,
        headers: errorHeaders
      }
    );
  }
});
