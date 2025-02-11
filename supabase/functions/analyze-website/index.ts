
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
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Request-Headers': '*',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  try {
    console.log('Received request:', {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
    });

    const requestData = await req.json() as RequestData;
    console.log('Received request data:', requestData);

    if (!requestData?.url) {
      throw new Error('URL is required in request data');
    }

    const url = requestData.url.trim();
    if (!url) {
      throw new Error('URL cannot be empty');
    }

    // Create timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const chatSolutions = await analyzeChatbot(url);

      clearTimeout(timeoutId);
      
      console.log('Analysis complete:', {
        url,
        chatSolutions
      });

      return new Response(JSON.stringify({
        status: chatSolutions.length > 0 ? 
          `Chatbot detected (${chatSolutions.join(', ')})` : 
          'No chatbot detected',
        chatSolutions,
        lastChecked: new Date().toISOString()
      }), {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });

    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error analyzing website:', error);
      
      // Handle specific error types
      if (error.name === 'AbortError' || error.message.includes('timed out')) {
        return new Response(JSON.stringify({
          status: 'Analysis timed out',
          error: 'Request took too long to complete',
          lastChecked: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 408
        });
      }

      return new Response(JSON.stringify({
        status: 'Error analyzing website',
        error: error.message,
        lastChecked: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({
      status: 'Invalid request',
      error: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
