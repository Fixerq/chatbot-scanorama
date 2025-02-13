
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { validateRequest } from '../utils/requestValidator.ts';
import { checkRateLimit } from '../utils/rateLimiter.ts';
import { getRealIp } from '../utils/httpUtils.ts';
import { getCachedAnalysis, updateCache } from '../services/cacheService.ts';
import { logAnalysis } from '../services/loggingService.ts';
import { createSuccessResponse, createErrorResponse, createRateLimitResponse } from '../utils/responseHandler.ts';
import { websiteAnalyzer } from '../services/websiteAnalyzer.ts';
import { normalizeUrl } from '../utils/urlUtils.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const MAX_CONCURRENT_REQUESTS = 3;
const activeRequests = new Set();

export async function handleRequest(req: Request) {
  const startTime = Date.now();
  let success = false;
  let cached = false;
  let providersFound: string[] = [];
  let errorMessage: string | undefined;
  let isRateLimited = false;

  try {
    console.log('Received request:', req.method);
    
    // Check if we're at the concurrent request limit
    if (activeRequests.size >= MAX_CONCURRENT_REQUESTS) {
      console.log('Too many concurrent requests:', activeRequests.size);
      throw new Error('Too many concurrent requests. Please try again later.');
    }
    
    const clientIP = getRealIp(req);
    console.log('Client IP:', clientIP);
    
    const isAllowed = await checkRateLimit(supabase, clientIP);
    if (!isAllowed) {
      console.log('Rate limit exceeded for IP:', clientIP);
      isRateLimited = true;
      errorMessage = 'Rate limit exceeded. Please try again later.';
      
      await logRequestCompletion({
        url: 'unknown',
        success: false,
        cached: false,
        errorMessage,
        responseTimeMs: Date.now() - startTime,
        isRateLimited: true,
        metadata: { clientIP }
      });

      return createRateLimitResponse(errorMessage);
    }

    const body = await req.text();
    console.log('Request body:', body);

    const requestData = validateRequest(body);
    const normalizedUrl = normalizeUrl(requestData.url);
    console.log('Analyzing website:', normalizedUrl);
    
    const requestId = crypto.randomUUID();
    activeRequests.add(requestId);
    
    try {
      const cachedResult = await getCachedAnalysis(normalizedUrl);
      if (cachedResult) {
        console.log('Cache hit for URL:', normalizedUrl);
        success = true;
        cached = true;
        
        await logRequestCompletion({
          url: normalizedUrl,
          success: true,
          cached: true,
          providersFound,
          responseTimeMs: Date.now() - startTime,
          metadata: { fromCache: true }
        });

        return createSuccessResponse({
          ...cachedResult,
          fromCache: true
        });
      }

      const result = await websiteAnalyzer(normalizedUrl);
      await updateCache(normalizedUrl, result.has_chatbot, result.chatSolutions, result.details);
      
      await logRequestCompletion({
        url: normalizedUrl,
        success: true,
        cached: false,
        providersFound: result.chatSolutions,
        responseTimeMs: Date.now() - startTime,
        metadata: {}
      });
      
      return createSuccessResponse(result);
    } finally {
      activeRequests.delete(requestId);
    }

  } catch (error) {
    console.error('Function error:', error);
    errorMessage = error.message;
    
    await logRequestCompletion({
      url: error.requestData?.url || 'unknown',
      success: false,
      cached: false,
      errorMessage,
      responseTimeMs: Date.now() - startTime,
      metadata: { error: error.stack }
    });
    
    return createErrorResponse(error.message);
  }
}

async function logRequestCompletion(params: {
  url: string;
  success: boolean;
  cached: boolean;
  providersFound?: string[];
  errorMessage?: string;
  responseTimeMs: number;
  isRateLimited?: boolean;
  metadata?: Record<string, unknown>;
}) {
  await logAnalysis(params);
}
