
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleRequest } from './handlers/requestHandler.ts';
import { corsHeaders } from './utils/httpUtils.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Received analyze-website request:', req.method);
    return await handleRequest(req);
  } catch (error) {
    console.error('Unhandled error in analyze-website function:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        status: 'error'
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
