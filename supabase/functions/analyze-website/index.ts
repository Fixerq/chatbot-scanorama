
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { handleRequest } from './handlers/requestHandler.ts';
import { corsHeaders } from './utils/httpUtils.ts';

console.log("[AnalyzeWebsite] Function initialized");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
      },
      status: 204
    });
  }

  try {
    return await handleRequest(req);
  } catch (error) {
    console.error('[AnalyzeWebsite] Unhandled error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack,
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
