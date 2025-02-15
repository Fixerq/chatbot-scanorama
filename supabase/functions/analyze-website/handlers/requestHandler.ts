
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
  'Content-Type': 'application/json',
  'Access-Control-Max-Age': '86400'
};

const MAX_ACTIVE_REQUESTS = 3;
const REQUEST_TIMEOUT = 50000; // 50 seconds
const activeRequests = new Set();

async function processAnalysisRequest(url: string, startTime: number): Promise<ChatDetectionResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT);

  try {
    console.log('[RequestHandler] Starting analysis for URL:', url);
    const result = await websiteAnalyzer(url);
    
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
    console.error('[RequestHandler] Processing error:', error);
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      throw new Error(`Analysis timed out after ${REQUEST_TIMEOUT}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function handleRequest(req: Request) {
  console.log('[Handler] Received request:', req.method, req.url);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (activeRequests.size >= MAX_ACTIVE_REQUESTS) {
    return createErrorResponse('Too many concurrent requests. Please try again later.', 429);
  }

  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  activeRequests.add(requestId);
  
  try {
    const clientIP = getRealIp(req);
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
            chatSolutions: [],
            details: {
              error: error.message,
              stack: error.stack
            },
            lastChecked: new Date().toISOString()
          });
        }
      }

      return new Response(JSON.stringify(results), {
        headers: corsHeaders
      });
    }

    // Handle single URL analysis
    const { url } = validateRequest(body);
    console.log('[Handler] Processing single URL:', url);
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
    
    let statusCode = 500;
    if (error.message.includes('timeout')) {
      statusCode = 504; // Gateway Timeout
    } else if (error.message.includes('rate limit')) {
      statusCode = 429; // Too Many Requests
    }
    
    return createErrorResponse(error.message, statusCode);
  } finally {
    activeRequests.delete(requestId);
  }
}
