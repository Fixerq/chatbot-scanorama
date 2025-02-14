
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // We'll dynamically set this based on the request origin
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

export async function getCorsHeaders(request: Request) {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the request origin
    const origin = request.headers.get('origin');
    
    if (!origin) {
      return corsHeaders;
    }

    // Query the allowed_origins table
    const { data: allowedOrigins, error } = await supabaseClient
      .from('allowed_origins')
      .select('origin')
      .eq('origin', origin)
      .single();

    if (error) {
      console.error('Error checking allowed origins:', error);
      return corsHeaders;
    }

    // If the origin is allowed, return it in the headers
    return {
      ...corsHeaders,
      'Access-Control-Allow-Origin': allowedOrigins ? origin : corsHeaders['Access-Control-Allow-Origin']
    };
  } catch (error) {
    console.error('Error in getCorsHeaders:', error);
    return corsHeaders;
  }
}
