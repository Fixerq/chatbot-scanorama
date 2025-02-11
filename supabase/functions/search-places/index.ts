
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SearchParams } from './types.ts';
import { searchBusinesses } from './businessSearch.ts';
import { verifyUser } from './auth.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    console.log('User authenticated:', userId);

    const { action, params } = await req.json();
    console.log('Request received:', { action, params });

    if (action !== 'search') {
      console.error('Invalid action type:', action);
      throw new Error('Invalid action type');
    }

    if (!params?.query || !params?.country || !params?.region) {
      console.error('Missing required parameters:', params);
      throw new Error('Missing required search parameters: query, country, and region are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Create search history entry
    const { data: searchHistory, error: searchHistoryError } = await supabaseAdmin
      .from('search_history')
      .insert({
        user_id: userId,
        query: params.query,
        country: params.country,
        region: params.region
      })
      .select()
      .single();

    if (searchHistoryError) {
      console.error('Error creating search history:', searchHistoryError);
      throw new Error('Failed to record search history');
    }

    const result = await searchBusinesses(params as SearchParams);
    console.log('Search completed successfully');

    // Store search results
    if (result.results.length > 0) {
      const searchResults = result.results.map(item => ({
        search_id: searchHistory.id,
        business_name: item.details.title,
        description: item.details.description,
        website_url: item.url,
        address: item.details.address,
        business_type: item.details.businessType,
        phone_number: item.details.phoneNumber
      }));

      const { error: resultsError } = await supabaseAdmin
        .from('search_results')
        .insert(searchResults);

      if (resultsError) {
        console.error('Error storing search results:', resultsError);
        // Continue execution even if storing results fails
      }
    }

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
