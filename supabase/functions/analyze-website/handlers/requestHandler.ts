
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { validateRequest } from '../utils/requestValidator.ts';
import { checkRateLimit } from '../utils/rateLimiter.ts';
import { getRealIp } from '../utils/httpUtils.ts';
import { getCachedAnalysis, updateCache } from '../services/cacheService.ts';
import { logAnalysis } from '../services/loggingService.ts';
import { createSuccessResponse, createErrorResponse, createRateLimitResponse } from '../utils/responseHandler.ts';
import { websiteAnalyzer } from '../services/websiteAnalyzer.ts';
import { normalizeUrl } from '../utils/urlUtils.ts';
import { ChatDetectionResult } from '../types.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_CONCURRENT_REQUESTS = 5;
const REQUEST_TIMEOUT = 30000; // 30 seconds
const activeRequests = new Set();

async function processAnalysisRequest(url: string, startTime: number): Promise<ChatDetectionResult> {
  const requestId = crypto.randomUUID();
  activeRequests.add(requestId);
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Analysis timeout')), REQUEST_TIMEOUT);
  });

  try {
    const result = await Promise.race([
      websiteAnalyzer(url),
      timeoutPromise
    ]);

    await updateCache(url, result.has_chatbot, result.chatSolutions, result.details);
    
    await logAnalysis({
      url,
      success: true,
      cached: false,
      providersFound: result.chatSolutions,
      responseTimeMs: Date.now() - startTime
    });
    
    return result;
  } catch (error) {
    console.error('[Handler] Error in processAnalysisRequest:', error);
    throw error;
  } finally {
    activeRequests.delete(requestId);
  }
}

export async function handleRequest(req: Request) {
  console.log('[Handler] Received request:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  const clientIP = getRealIp(req);

  try {
    const isAllowed = await checkRateLimit(supabase, clientIP);
    if (!isAllowed) {
      console.log('[Handler] Rate limit exceeded for IP:', clientIP);
      return createRateLimitResponse('Rate limit exceeded');
    }

    const body = await req.text();
    const requestData = JSON.parse(body);
    console.log('[Handler] Processing request data:', requestData);

    // Handle batch analysis
    if (Array.isArray(requestData.urls)) {
      console.log('[Handler] Processing batch of URLs:', requestData.urls.length);
      const results: ChatDetectionResult[] = [];
      
      for (const url of requestData.urls) {
        try {
          const normalizedUrl = normalizeUrl(url);
          console.log('[Handler] Processing URL:', normalizedUrl);
          
          const cachedResult = await getCachedAnalysis(normalizedUrl);
          if (cachedResult) {
            console.log('[Handler] Cache hit for:', normalizedUrl);
            results.push({
              ...cachedResult,
              fromCache: true
            });
            continue;
          }

          const result = await processAnalysisRequest(normalizedUrl, startTime);
          results.push(result);
          
        } catch (error) {
          console.error('[Handler] Error processing URL:', url, error);
          results.push({
            status: 'error',
            error: error.message,
            has_chatbot: false,
            has_live_elements: false,
            chatSolutions: [],
            liveElements: [],
            lastChecked: new Date().toISOString()
          });
        }
      }

      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle single URL analysis
    const { url } = validateRequest(body);
    const result = await processAnalysisRequest(url, startTime);
    return createSuccessResponse(result);

  } catch (error) {
    console.error('[Handler] Function error:', error);
    await logAnalysis({
      url: 'unknown',
      success: false,
      cached: false,
      errorMessage: error.message,
      responseTimeMs: Date.now() - startTime
    });
    
    return createErrorResponse(error.message);
  }
}
