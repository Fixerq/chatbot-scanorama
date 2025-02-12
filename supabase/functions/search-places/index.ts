
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateSearchRequest } from './validation.ts';
import { searchBusinesses } from './businessSearch.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

serve(async (req) => {
  try {
    // Log incoming request details
    console.log('Request received:', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    });

    // Always get the origin for CORS
    const origin = req.headers.get('origin') || '*';
    
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      console.log('Handling OPTIONS request with origin:', origin);
      return new Response('ok', {
        status: 204,
        headers: {
          ...corsHeaders,
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    if (req.method !== 'POST') {
      console.log('Invalid method:', req.method);
      throw new Error('Method not allowed');
    }

    // Ensure content-type is application/json
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

    // Search for businesses
    console.log('Starting business search with params:', params);
    const searchResponse = await searchBusinesses(params, supabase);
    
    console.log('Search completed successfully:', searchResponse);

    // Return successful response with proper CORS headers
    return new Response(
      JSON.stringify({
        data: searchResponse,
        status: 'success'
      }),
      { 
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin
        }
      }
    );

  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    
    const origin = req.headers.get('origin') || '*';
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
        status: 'error'
      }),
      { 
        status: error.message === 'Method not allowed' ? 405 : 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin
        }
      }
    );
  }
});
