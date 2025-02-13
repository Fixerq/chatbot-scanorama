
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { validateRequest } from '../utils/requestValidator.ts';
import { checkRateLimit } from '../utils/rateLimiter.ts';
import { getRealIp } from '../utils/httpUtils.ts';
import { getCachedAnalysis, updateCache } from '../services/cacheService.ts';
import { logAnalysis } from '../services/loggingService.ts';
import { createSuccessResponse, createErrorResponse, createRateLimitResponse } from '../utils/responseHandler.ts';
import { websiteAnalyzer } from '../services/websiteAnalyzer.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

export async function handleRequest(req: Request) {
  const startTime = Date.now();
  let success = false;
  let cached = false;
  let providersFound: string[] = [];
  let errorMessage: string | undefined;
  let isRateLimited = false;

  try {
    console.log('Received request:', req.method);
    
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
    console.log('Analyzing website:', requestData.url);
    
    const cachedResult = await getCachedAnalysis(requestData.url);
    if (cachedResult) {
      console.log('Cache hit for URL:', requestData.url);
      success = true;
      cached = true;
      
      await logRequestCompletion({
        url: requestData.url,
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

    const result = await websiteAnalyzer(requestData.url);
    await updateCache(requestData.url, result.has_chatbot, result.chatSolutions, result.details);
    
    await logRequestCompletion({
      url: requestData.url,
      success: true,
      cached: false,
      providersFound: result.chatSolutions,
      responseTimeMs: Date.now() - startTime,
      metadata: {}
    });
    
    return createSuccessResponse(result);

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
