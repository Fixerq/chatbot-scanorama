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

    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    console.log('Normalized URL:', normalizedUrl);

    try {
      new URL(normalizedUrl);
    } catch {
      throw new Error('Invalid URL format');
    }

    const chatSolutions = await analyzeChatbot(normalizedUrl);
    console.log('Analysis complete:', {
      url: normalizedUrl,
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
    console.error('Error processing request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    let status = 'Error analyzing website';
    let httpStatus = 500;

    if (errorMessage.includes('abort') || errorMessage.includes('timeout')) {
      status = 'Analysis timed out';
      httpStatus = 408;
    } else if (errorMessage.includes('404')) {
      status = 'Website not found';
      httpStatus = 404;
    } else if (errorMessage.includes('403')) {
      status = 'Access denied';
      httpStatus = 403;
    } else if (errorMessage.includes('network')) {
      status = 'Network error';
      httpStatus = 503;
    }

    return new Response(JSON.stringify({
      status,
      error: errorMessage,
      lastChecked: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: httpStatus
    });
  }
});