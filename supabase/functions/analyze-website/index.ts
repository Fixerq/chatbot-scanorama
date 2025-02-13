
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateRequest } from './utils/requestValidator.ts';
import { analyzeWithFirecrawl, checkFirecrawlCredits } from './services/firecrawlService.ts';
import { CHATBOT_PROVIDERS } from './providers/chatbotProviders.ts';
import { RequestData, ChatDetectionResult } from './types.ts';
import { checkRateLimit, getRealIp, corsHeaders } from './utils/httpUtils.ts';
import { getCachedAnalysis, updateCache } from './services/cacheService.ts';
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

  try {
    console.log('Received request:', req.method);
    
    // Check rate limiting
    const clientIP = getRealIp(req);
    console.log('Client IP:', clientIP);
    
    const isAllowed = await checkRateLimit(supabase, clientIP);
    if (!isAllowed) {
      console.log('Rate limit exceeded for IP:', clientIP);
      return new Response(
        JSON.stringify({
          status: 'error',
          error: 'Rate limit exceeded. Please try again later.',
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
      return new Response(
        JSON.stringify({
          status: 'error',
          has_chatbot: false,
          chatSolutions: [],
          details: { error: 'Insufficient Firecrawl credits' },
          lastChecked: new Date().toISOString()
        }),
        { headers: corsHeaders }
      );
    }
    
    // Use Firecrawl for analysis
    const firecrawlResult = await analyzeWithFirecrawl(requestData.url);
    console.log('Firecrawl analysis complete:', firecrawlResult);
    
    if (firecrawlResult.status === 'error') {
      throw new Error(firecrawlResult.error || 'Analysis failed');
    }

    // Search for chatbot providers in the Firecrawl content
    const detectedProviders = [];
    if (firecrawlResult.content) {
      for (const [key, provider] of Object.entries(CHATBOT_PROVIDERS)) {
        if (provider.signatures.some(sig => 
          firecrawlResult.content.toLowerCase().includes(sig.toLowerCase())
        )) {
          detectedProviders.push(provider.name);
          console.log('Detected provider:', provider.name);
        }
      }
    }
    
    const result = {
      status: 'success',
      has_chatbot: detectedProviders.length > 0,
      chatSolutions: detectedProviders,
      details: firecrawlResult.metadata,
      lastChecked: firecrawlResult.analyzed_at
    };

    // Cache the result
    await updateCache(
      requestData.url,
      detectedProviders.length > 0,
      detectedProviders,
      firecrawlResult.metadata
    );
    
    console.log('Sending response:', result);
    
    return new Response(
      JSON.stringify(result),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Function error:', error);
    
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
