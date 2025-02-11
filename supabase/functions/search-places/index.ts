
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Always respond to OPTIONS requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  try {
    console.log('Request received:', {
      method: req.method,
      url: req.url
    });

    // Basic request validation
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const { action, params } = await req.json();
    console.log('Request parameters:', { action, params });

    // Simple echo response for testing
    return new Response(
      JSON.stringify({
        data: {
          results: [],
          hasMore: false,
          searchBatchId: crypto.randomUUID()
        }
      }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Request error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
        status: 500
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
