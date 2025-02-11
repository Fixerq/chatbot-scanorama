
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { analyzeChatbot } from "./analyzer.ts";
import type { RequestData } from "./types.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
      status: 204,
    });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const requestData = await req.json() as RequestData;
    console.log('Processing request:', requestData);

    if (!requestData?.url) {
      return new Response(JSON.stringify({
        error: 'URL is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const url = requestData.url.trim();
    if (!url) {
      return new Response(JSON.stringify({
        error: 'URL cannot be empty'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const chatSolutions = await analyzeChatbot(url);
    
    return new Response(JSON.stringify({
      status: chatSolutions.length > 0 ? 
        `Chatbot detected (${chatSolutions.join(', ')})` : 
        'No chatbot detected',
      chatSolutions,
      lastChecked: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing request:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorResponse = {
      error: errorMessage,
      status: 'Error analyzing website',
      lastChecked: new Date().toISOString()
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
