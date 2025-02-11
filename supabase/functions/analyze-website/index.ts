
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { analyzeChatbot } from "./analyzer.ts";
import type { RequestData } from "./types.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleOptions(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    console.log('Analyzing website: Starting request processing');
    
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Parse request body
    let requestData: RequestData;
    try {
      requestData = await req.json();
      console.log('Request data received:', requestData);
    } catch (parseError) {
      console.error('Error parsing request JSON:', parseError);
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON in request body',
          status: 'Error parsing request',
          lastChecked: new Date().toISOString()
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate URL
    if (!requestData?.url) {
      console.error('Missing URL in request');
      return new Response(
        JSON.stringify({
          error: 'URL is required',
          status: 'Missing required parameter',
          lastChecked: new Date().toISOString()
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const url = requestData.url.trim();
    if (!url) {
      console.error('Empty URL after trimming');
      return new Response(
        JSON.stringify({
          error: 'URL cannot be empty',
          status: 'Invalid URL',
          lastChecked: new Date().toISOString()
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Starting chatbot analysis for URL:', url);
    const chatSolutions = await analyzeChatbot(url);
    console.log('Chatbot analysis complete:', { url, chatSolutions });
    
    return new Response(
      JSON.stringify({
        status: chatSolutions.length > 0 ? 
          `Chatbot detected (${chatSolutions.join(', ')})` : 
          'No chatbot detected',
        chatSolutions,
        lastChecked: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in analyze-website function:', error);
    
    // Ensure we have a valid error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const timestamp = new Date().toISOString();

    return new Response(
      JSON.stringify({
        error: errorMessage,
        status: 'Error analyzing website',
        lastChecked: timestamp,
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
