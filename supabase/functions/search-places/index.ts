
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateSearchRequest } from './validation.ts';
import { searchBusinesses } from './businessSearch.ts';
import { corsHeaders } from './types.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    console.log('Request received:', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    });

    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
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
        persistSession: false
      }
    });

    // Search for businesses
    console.log('Starting business search with params:', params);
    const searchResponse = await searchBusinesses(params, supabase);
    
    console.log(`Found ${searchResponse.results.length} results for query: ${params.query}`);

    // Return successful response
    return new Response(
      JSON.stringify({
        data: searchResponse,
        status: 'success'
      }),
      { 
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Request error:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
        status: 'error'
      }),
      { 
        status: error.message === 'Method not allowed' ? 405 : 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
