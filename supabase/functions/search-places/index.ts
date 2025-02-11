
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { verifyUser } from "./auth.ts";

console.log("Search Places Edge Function Initialized");

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

serve(async (req) => {
  // Get the origin from the request headers
  const origin = req.headers.get('origin') || '*';
  console.log('Incoming request from origin:', origin);
  console.log('Request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));
  
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      console.log('Handling OPTIONS request');
      return new Response(null, {
        headers: {
          ...corsHeaders,
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
      });
    }

    // Validate request method early
    if (req.method !== 'POST') {
      console.error(`Invalid method: ${req.method}`);
      throw new Error(`Method ${req.method} not allowed`);
    }

    // Get API keys
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    const GOOGLE_CX = Deno.env.get('GOOGLE_CX');
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    const userId = await verifyUser(authHeader);
    console.log('User authenticated successfully:', userId);

    // Parse request body
    const requestData = await req.json();
    console.log('Request data:', requestData);

    // Handle API key request
    if (requestData.type === 'get_api_key') {
      if (!FIRECRAWL_API_KEY) {
        console.error('Firecrawl API key not configured');
        throw new Error('Firecrawl API key not configured');
      }

      return new Response(
        JSON.stringify({ apiKey: FIRECRAWL_API_KEY }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin
          }
        }
      );
    }

    // Return error response for invalid requests
    console.error('Invalid request type:', requestData.type);
    return new Response(
      JSON.stringify({ error: 'Invalid request type' }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin
        }
      }
    );

  } catch (error) {
    console.error('Error in search function:', error);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        origin: origin
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin
        }
      }
    );
  }
});
