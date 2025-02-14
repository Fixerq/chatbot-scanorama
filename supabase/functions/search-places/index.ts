
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateSearchRequest } from './validation.ts';
import { searchBusinesses } from './businessSearch.ts';
import { corsHeaders, addCorsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

serve(async (req) => {
  try {
    console.log('Request received:', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    });
    
    if (req.method === 'OPTIONS') {
      console.log('Handling OPTIONS request');
      return new Response('ok', {
        status: 200,
        headers: corsHeaders
      });
    }

    if (req.method !== 'POST') {
      console.log('Invalid method:', req.method);
      throw new Error('Method not allowed');
    }

    const contentType = req.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (!contentType?.includes('application/json')) {
      throw new Error('Content-Type must be application/json');
    }

    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body:', requestBody);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      throw new Error('Invalid JSON in request body');
    }

    const { action, params } = requestBody;
    console.log('Search request:', { action, params });

    if (!params?.query) {
      throw new Error('Query parameter is required');
    }

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

    console.log('Initializing Supabase client');
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    // Search for businesses with pagination support
    console.log('Starting business search with params:', {
      ...params,
      pageToken: params.nextPageToken || 'not provided'
    });
    
    const searchResponse = await searchBusinesses(params, supabase);
    
    console.log('Search completed successfully:', {
      resultsCount: searchResponse.results.length,
      hasMore: searchResponse.hasMore,
      nextPageToken: searchResponse.nextPageToken || 'none'
    });

    const response = new Response(
      JSON.stringify({
        data: searchResponse,
        status: 'success'
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    return addCorsHeaders(response);

  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    
    const errorResponse = new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
        status: 'error'
      }),
      { 
        status: error.message === 'Method not allowed' ? 405 : 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    return addCorsHeaders(errorResponse);
  }
});
