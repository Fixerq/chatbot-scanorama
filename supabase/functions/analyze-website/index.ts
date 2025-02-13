
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateRequest } from './utils/requestValidator.ts';
import { analyzeWithFirecrawl, checkFirecrawlCredits } from './services/firecrawlService.ts';
import { CHATBOT_PROVIDERS } from './providers/chatbotProviders.ts';
import { RequestData, ChatDetectionResult } from './types.ts';
import { checkRateLimit, getRealIp, corsHeaders } from './utils/httpUtils.ts';
import { getCachedAnalysis, updateCache } from './services/cacheService.ts';
import { logAnalysis } from './services/loggingService.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  let success = false;
  let cached = false;
  let providersFound: string[] = [];
  let errorMessage: string | undefined;
  let rateLimitRemaining: number | undefined;
  let isRateLimited = false;

  try {
    console.log('Received request:', req.method);
    
    // Check rate limiting
    const clientIP = getRealIp(req);
    console.log('Client IP:', clientIP);
    
    const isAllowed = await checkRateLimit(supabase, clientIP);
    if (!isAllowed) {
      console.log('Rate limit exceeded for IP:', clientIP);
      isRateLimited = true;
      errorMessage = 'Rate limit exceeded. Please try again later.';
      
      const responseTimeMs = Date.now() - startTime;
      await logAnalysis({
        url: 'unknown', // URL not yet parsed when rate limited
        success: false,
        cached: false,
        errorMessage,
        responseTimeMs,
        isRateLimited: true,
        metadata: { clientIP }
      });

      return new Response(
        JSON.stringify({
          status: 'error',
          error: errorMessage,
          has_chatbot: false,
          chatSolutions: [],
          lastChecked: new Date().toISOString()
        }),
        { 
          status: 429,
          headers: {
            ...corsHeaders,
            'Retry-After': '3600'
          }
        }
      );
    }

    const body = await req.text();
    console.log('Request body:', body);

    // Parse and validate request
    const requestData: RequestData = validateRequest(body);
    console.log('Analyzing website:', requestData.url);
    
    // Check cache first
    const cachedResult = await getCachedAnalysis(requestData.url);
    if (cachedResult) {
      console.log('Cache hit for URL:', requestData.url);
      success = true;
      cached = true;
      providersFound = cachedResult.chatSolutions || [];
      
      const responseTimeMs = Date.now() - startTime;
      await logAnalysis({
        url: requestData.url,
        success: true,
        cached: true,
        providersFound,
        responseTimeMs,
        metadata: { fromCache: true }
      });

      return new Response(
        JSON.stringify({
          ...cachedResult,
          fromCache: true
        }),
        { headers: corsHeaders }
      );
    }
    
    // Check Firecrawl credits before analysis
    const availableCredits = await checkFirecrawlCredits();
    if (availableCredits <= 0) {
      console.warn('Insufficient Firecrawl credits');
      errorMessage = 'Insufficient Firecrawl credits';
      
      const responseTimeMs = Date.now() - startTime;
      await logAnalysis({
        url: requestData.url,
        success: false,
        cached: false,
        errorMessage,
        responseTimeMs,
        metadata: { error: 'insufficient_credits' }
      });

      return new Response(
        JSON.stringify({
          status: 'error',
          has_chatbot: false,
          chatSolutions: [],
          details: { error: errorMessage },
          lastChecked: new Date().toISOString()
        }),
        { headers: corsHeaders }
      );
    }
    
    // Use Firecrawl for analysis
    const firecrawlResult = await analyzeWithFirecrawl(requestData.url);
    console.log('Firecrawl analysis complete:', firecrawlResult);
    
    if (firecrawlResult.status === 'error') {
      errorMessage = firecrawlResult.error || 'Analysis failed';
      throw new Error(errorMessage);
    }

    // Search for chatbot providers in the Firecrawl content
    if (firecrawlResult.content) {
      for (const [key, provider] of Object.entries(CHATBOT_PROVIDERS)) {
        if (provider.signatures.some(sig => 
          firecrawlResult.content.toLowerCase().includes(sig.toLowerCase())
        )) {
          providersFound.push(provider.name);
          console.log('Detected provider:', provider.name);
        }
      }
    }
    
    success = true;
    const result = {
      status: 'success',
      has_chatbot: providersFound.length > 0,
      chatSolutions: providersFound,
      details: firecrawlResult.metadata,
      lastChecked: firecrawlResult.analyzed_at
    };

    // Cache the result
    await updateCache(
      requestData.url,
      providersFound.length > 0,
      providersFound,
      firecrawlResult.metadata
    );
    
    const responseTimeMs = Date.now() - startTime;
    await logAnalysis({
      url: requestData.url,
      success: true,
      cached: false,
      providersFound,
      responseTimeMs,
      metadata: firecrawlResult.metadata
    });
    
    console.log('Sending response:', result);
    
    return new Response(
      JSON.stringify(result),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Function error:', error);
    errorMessage = error.message;
    
    const responseTimeMs = Date.now() - startTime;
    await logAnalysis({
      url: error.requestData?.url || 'unknown',
      success: false,
      cached: false,
      errorMessage,
      responseTimeMs,
      metadata: { error: error.stack }
    });
    
    return new Response(
      JSON.stringify({
        error: error.message,
        status: 'error',
        has_chatbot: false,
        chatSolutions: [],
        details: { error: error.message },
        lastChecked: new Date().toISOString()
      }),
      { 
        status: 200, // Return 200 even for errors
        headers: corsHeaders
      }
    );
  }
});
