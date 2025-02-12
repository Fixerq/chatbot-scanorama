
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': '*',
  'Access-Control-Allow-Headers': '*',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // Log incoming request details
  console.log('Request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    console.log('Processing request');
    
    // Return a basic success response regardless of input
    const response = {
      status: 'success',
      chatSolutions: [],
      lastChecked: new Date().toISOString()
    };
    
    console.log('Sending response:', response);
    
    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: corsHeaders 
      }
    );
  } catch (error) {
    // Log the error for debugging
    console.error('Function error:', error);
    
    const errorResponse = {
      status: 'error',
      chatSolutions: [],
      lastChecked: new Date().toISOString(),
      error: 'Internal server error'
    };
    
    console.log('Sending error response:', errorResponse);
    
    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 200,
        headers: corsHeaders 
      }
    );
  }
});
