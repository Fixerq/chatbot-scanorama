
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { analyzeWebsite, analyzeBatch } from "./analyzer.ts";
import { normalizeUrl, isValidUrl, sanitizeUrl } from "./utils/urlUtils.ts";
import { AnalysisOptions, BatchAnalysisRequest } from "./types.ts";
import { 
  validateUrl, 
  validateUrlArray, 
  validateNumber, 
  validateBoolean, 
  ValidationException, 
  createValidationErrorResponse,
  checkRateLimit 
} from "../_shared/validation.ts";

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
    // Rate limiting check
    const userAgent = req.headers.get('user-agent');
    const clientIP = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for');
    
    if (!checkRateLimit(userAgent, clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Request blocked' }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const requestBody = await req.json();
    const { 
      urls, url, debug = false, verifyResults = true, 
      deepVerification = false, smartDetection = true, 
      confidenceThreshold = 0.5, timeout = 30000,
      checkFunctionality = false, detectHiddenChatbots = false,
      ignoreVisibilityChecks = false, suggestedProviders = [],
      useEnhancedDetection = false, useAdvancedDetection = false
    } = requestBody;
    
    // Validate input parameters
    const options: AnalysisOptions = {
      debug: validateBoolean(debug, 'debug'),
      verifyResults: validateBoolean(verifyResults, 'verifyResults'),
      deepVerification: validateBoolean(deepVerification, 'deepVerification'),
      smartDetection: validateBoolean(smartDetection, 'smartDetection'),
      confidenceThreshold: validateNumber(confidenceThreshold, 'confidenceThreshold', 0, 1),
      checkFunctionality: validateBoolean(checkFunctionality, 'checkFunctionality'),
      timeout: validateNumber(timeout, 'timeout', 1000, 60000),
      detectHiddenChatbots: validateBoolean(detectHiddenChatbots, 'detectHiddenChatbots'),
      ignoreVisibilityChecks: validateBoolean(ignoreVisibilityChecks, 'ignoreVisibilityChecks'),
      suggestedProviders: Array.isArray(suggestedProviders) ? suggestedProviders : []
    };

    console.log("Analysis options:", options);

    // Handle batch analysis
    if (urls && Array.isArray(urls) && urls.length > 0) {
      console.log(`Batch analyzing ${urls.length} URLs`);
      
      try {
        const validUrls = validateUrlArray(urls, 'urls');
        console.log(`Validated ${validUrls.length} URLs for batch analysis`);
      } catch (validationError) {
        if (validationError instanceof ValidationException) {
          return createValidationErrorResponse(validationError);
        }
        throw validationError;
      }
      
      const processedUrls = urls
        .filter(u => u && isValidUrl(normalizeUrl(u)))
        .map(u => sanitizeUrl(normalizeUrl(u)));
      
      if (processedUrls.length === 0) {
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

    // Validate the single URL
    let validatedUrl: string;
    try {
      validatedUrl = validateUrl(targetUrl, 'url');
    } catch (validationError) {
      if (validationError instanceof ValidationException) {
        return createValidationErrorResponse(validationError);
      }
      throw validationError;
    }

    // Sanitize the URL (keeping existing logic for backward compatibility)
    const sanitizedUrl = sanitizeUrl(normalizeUrl(validatedUrl));
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
    
    // Handle validation errors
    if (error instanceof ValidationException) {
      return createValidationErrorResponse(error);
    }
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
