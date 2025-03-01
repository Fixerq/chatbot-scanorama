
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { fetchHtmlContent } from './utils/httpUtils';
import { normalizeUrl, isValidUrl, sanitizeUrl } from './utils/urlUtils';
import { analyzeWebsite } from './analyzer';

// Setup CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Normalize and validate URL
    const normalizedUrl = normalizeUrl(url);
    if (!isValidUrl(normalizedUrl)) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Sanitize the URL
    const sanitizedUrl = sanitizeUrl(normalizedUrl);
    console.log(`Analyzing website: ${sanitizedUrl}`);

    try {
      // Fetch the HTML content
      const html = await fetchHtmlContent(sanitizedUrl);
      
      // Analyze the website content
      const analysisResult = await analyzeWebsite(sanitizedUrl, html, {
        debug: true,
        smartDetection: true,
        confidenceThreshold: 0.5
      });

      console.log(`Analysis result for ${sanitizedUrl}:`, analysisResult);

      return new Response(
        JSON.stringify({
          url: sanitizedUrl,
          status: analysisResult.status,
          hasChatbot: analysisResult.hasChatbot,
          chatSolutions: analysisResult.chatSolutions || [],
          confidence: analysisResult.confidence,
          verificationStatus: analysisResult.verificationStatus,
          lastChecked: analysisResult.lastChecked
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (fetchError) {
      console.error(`Error fetching or analyzing ${sanitizedUrl}:`, fetchError);
      
      return new Response(
        JSON.stringify({
          url: sanitizedUrl,
          status: 'Error: Could not analyze website',
          hasChatbot: false,
          chatSolutions: [],
          error: fetchError.message,
          lastChecked: new Date().toISOString()
        }),
        {
          status: 200, // Still return 200 for client to handle
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Server error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
