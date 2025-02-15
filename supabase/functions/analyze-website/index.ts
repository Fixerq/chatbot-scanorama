
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from './_shared/cors.ts';
import { handleAnalysisRequest } from './handlers/analysisHandler.ts';

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  return handleAnalysisRequest(req);
});
