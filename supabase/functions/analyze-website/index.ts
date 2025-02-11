
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
      },
      status: 204
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
      return new Response(JSON.stringify({
        error: 'URL is required in request data'
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
        status: 200,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error analyzing website:', error);
      
      // Handle specific error types
      if (error.name === 'AbortError' || error.message.includes('timed out')) {
        return new Response(JSON.stringify({
          error: 'Request took too long to complete',
          status: 'Analysis timed out',
          lastChecked: new Date().toISOString()
        }), {
          status: 408,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        error: error.message,
        status: 'Error analyzing website',
        lastChecked: new Date().toISOString()
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'Invalid request',
      lastChecked: new Date().toISOString()
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
