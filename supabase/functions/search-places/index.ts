
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";

console.log("Search Places Edge Function Initialized");

serve(async (req) => {
  const origin = req.headers.get('origin') || '*';
  console.log('Incoming request from origin:', origin);
  
  // Handle CORS preflight
  const corsResponse = handleOptions(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    return new Response(
      JSON.stringify({ status: 'ok' }),
      { 
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
      JSON.stringify({ 
        error: error.message,
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
