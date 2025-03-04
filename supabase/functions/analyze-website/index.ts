
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { analyzeWebsite, analyzeBatch } from "./analyzer.ts";
import { normalizeUrl, isValidUrl, sanitizeUrl } from "./utils/urlUtils.ts";
import { AnalysisOptions, BatchAnalysisRequest } from "./types.ts";

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
    const { 
      urls, url, debug = false, verifyResults = true, 
      deepVerification = false, smartDetection = true, 
      confidenceThreshold = 0.5, timeout = 30000,
      checkFunctionality = false, detectHiddenChatbots = false,
      ignoreVisibilityChecks = false, suggestedProviders = [],
      useEnhancedDetection = false, useAdvancedDetection = false
    } = await req.json();
    
    // Options for analysis
    const options: AnalysisOptions = {
      debug,
      verifyResults,
      deepVerification,
      smartDetection,
      confidenceThreshold: Number(confidenceThreshold) || 0.5,
      checkFunctionality,
      timeout: Number(timeout) || 30000,
      detectHiddenChatbots,
      ignoreVisibilityChecks,
      suggestedProviders: Array.isArray(suggestedProviders) ? suggestedProviders : []
    };

    console.log("Analysis options:", options);

    // Handle batch analysis
    if (urls && Array.isArray(urls) && urls.length > 0) {
      console.log(`Batch analyzing ${urls.length} URLs`);
      
      const validUrls = urls
        .filter(u => u && isValidUrl(normalizeUrl(u)))
        .map(u => sanitizeUrl(normalizeUrl(u)));
      
      if (validUrls.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No valid URLs provided' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      const results = await analyzeBatch(validUrls, options);
      
      return new Response(
        JSON.stringify(results),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Handle single URL analysis
    const targetUrl = url || (urls && urls[0]);
    
    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Normalize and validate URL
    const normalizedUrl = normalizeUrl(targetUrl);
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
      // Analyze the website
      const analysisResult = await analyzeWebsite(sanitizedUrl, undefined, options);

      console.log(`Analysis result for ${sanitizedUrl}:`, analysisResult);

      return new Response(
        JSON.stringify(analysisResult),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (fetchError) {
      console.error(`Error analyzing ${sanitizedUrl}:`, fetchError);
      
      return new Response(
        JSON.stringify({
          url: sanitizedUrl,
          status: 'Error: Could not analyze website',
          hasChatbot: false,
          chatSolutions: [],
          error: fetchError instanceof Error ? fetchError.message : String(fetchError),
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
