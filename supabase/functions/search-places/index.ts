
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from '@supabase/supabase-js';
import { searchBusinesses } from "./businessSearch.ts";
import { validateSearchRequest } from "./validation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, country, region, pageToken, page, limit } = await req.json();
    
    console.log('Received search request with params:', { query, country, region, pageToken, page, limit });

    // Validate request parameters
    const validationError = validateSearchRequest({ query, country, region });
    if (validationError) {
      console.error('Validation error:', validationError);
      return new Response(
        JSON.stringify({ error: validationError }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Search for businesses
    const searchResults = await searchBusinesses({ 
      query, 
      country, 
      region,
      nextPageToken: pageToken,
    }, supabase);

    console.log('Search completed successfully with', searchResults.results.length, 'results');

    return new Response(
      JSON.stringify({
        results: searchResults.results,
        nextPageToken: searchResults.nextPageToken,
        searchBatchId: searchResults.searchBatchId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in search-places function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred during search',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
