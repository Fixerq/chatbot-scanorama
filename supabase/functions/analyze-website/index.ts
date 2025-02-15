
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { handleRequest } from './handlers/requestHandler.ts';

console.log("[AnalyzeWebsite] Function initialized");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
