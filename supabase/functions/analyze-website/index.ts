import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./types.ts";
import { analyzeChatbot } from "./analyzer.ts";
import type { RequestData } from "./types.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const requestData = await req.json() as RequestData;
    console.log('Received request data:', requestData);

    if (!requestData?.url) {
      throw new Error('URL is required in request data');
    }

    const url = requestData.url.trim();
    if (!url) {
      throw new Error('URL cannot be empty');
    }

    try {
      const chatSolutions = await analyzeChatbot(url);
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });

    } catch (error) {
      console.error('Error analyzing website:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Important change: Always return 200 status code but include error information
      // This prevents the Supabase client from treating it as a failed request
      return new Response(JSON.stringify({
        status: 'Error analyzing website',
        error: errorMessage,
        lastChecked: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Changed from httpStatus to always return 200
      });
    }

  } catch (error) {
    console.error('Error processing request:', error);
    // Even for invalid requests, return 200 with error information
    return new Response(JSON.stringify({
      status: 'Invalid request',
      error: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 // Changed from 400 to 200
    });
  }
});