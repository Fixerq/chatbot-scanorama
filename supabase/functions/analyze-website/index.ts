
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from './_shared/cors.ts';
import { handleRequest } from './handlers/requestHandler.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Access-Control-Max-Age': '86400',
      },
      status: 204
    });
  }

  try {
    return await handleRequest(req);
  } catch (error) {
    console.error('[AnalyzeWebsite] Error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack,
      }),
      {
        status: error.status || 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
