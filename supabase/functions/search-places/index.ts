
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

    const { action, params } = await req.json();
    console.log('Search request:', { action, params });

    // Validate search parameters
    const validationError = validateSearchRequest(action, params);
    if (validationError) {
      console.error('Validation error:', validationError);
      throw new Error(validationError);
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false
        }
      }
    );

    // Search for businesses
    const searchResponse = await searchBusinesses(params, supabase);
    
    console.log(`Found ${searchResponse.results.length} results for query: ${params.query}\n`);

    // Return successful response
    return new Response(
      JSON.stringify({
        data: searchResponse
      }),
      { 
        status: 200,
        headers: corsHeaders
      }
    );

  } catch (error) {
    console.error('Request error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
        status: 'error'
      }),
      { 
        status: 200,
        headers: corsHeaders
      }
    );
  }
});
