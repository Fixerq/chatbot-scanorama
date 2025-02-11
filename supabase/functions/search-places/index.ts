
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
  console.log('Request received from origin:', origin);
  
  // Handle CORS preflight
  const corsResponse = handleOptions(req);
  if (corsResponse) return corsResponse;

  try {
    // Validate request method early
    if (req.method !== 'POST') {
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
    return new Response(
      JSON.stringify({ error: error.message }),
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
