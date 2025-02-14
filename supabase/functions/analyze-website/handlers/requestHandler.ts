
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

// Reduce max concurrent requests to prevent resource exhaustion
const MAX_CONCURRENT_REQUESTS = 5;
const activeRequests = new Set();

// Add request queue
const requestQueue: Array<() => Promise<void>> = [];
let isProcessingQueue = false;

async function processQueue() {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  while (requestQueue.length > 0 && activeRequests.size < MAX_CONCURRENT_REQUESTS) {
    const nextRequest = requestQueue.shift();
    if (nextRequest) {
      await nextRequest();
    }
  }
  isProcessingQueue = false;
}

export async function handleRequest(req: Request) {
  const startTime = Date.now();
  let success = false;
  let cached = false;
  let providersFound: string[] = [];
  let errorMessage: string | undefined;
  let isRateLimited = false;

  try {
    console.log('[Handler] Request received:', req.method);
    
    const clientIP = getRealIp(req);
    console.log('[Handler] Client IP:', clientIP);

    // Check rate limiting
    const isAllowed = await checkRateLimit(supabase, clientIP);
    console.log('[Handler] Rate limit check result:', isAllowed);
    
    if (!isAllowed) {
      console.log('[Handler] Rate limit exceeded for IP:', clientIP);
      isRateLimited = true;
      errorMessage = 'Rate limit exceeded. Please try again later.';
      
      await logAnalysis({
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

    // Parse and validate request body
    const body = await req.text();
    console.log('[Handler] Request body:', body);
    
    const requestData = JSON.parse(body);
    console.log('[Handler] Parsed request data:', requestData);

    // Handle batch analysis
    if (Array.isArray(requestData.urls)) {
      console.log('[Handler] Processing batch of URLs:', requestData.urls.length);
      const results: ChatDetectionResult[] = [];
      
      for (const url of requestData.urls) {
        try {
          console.log('[Handler] Processing URL in batch:', url);
          const normalizedUrl = normalizeUrl(url);
          console.log('[Handler] Normalized URL:', normalizedUrl);
          
          // Check cache first
          const cachedResult = await getCachedAnalysis(normalizedUrl);
          if (cachedResult) {
            console.log('[Handler] Cache hit for URL:', normalizedUrl);
            results.push({
              ...cachedResult,
              fromCache: true
            });
            continue;
          }
          
          // Analyze website
          if (activeRequests.size >= MAX_CONCURRENT_REQUESTS) {
            console.log('[Handler] Max concurrent requests reached, queueing:', normalizedUrl);
            const result = await new Promise<ChatDetectionResult>((resolve) => {
              requestQueue.push(async () => {
                const analysisResult = await websiteAnalyzer(normalizedUrl);
                resolve(analysisResult);
              });
            });
            results.push(result);
          } else {
            console.log('[Handler] Starting analysis for:', normalizedUrl);
            const result = await websiteAnalyzer(normalizedUrl);
            console.log('[Handler] Analysis complete for:', normalizedUrl, 'Result:', result);
            results.push(result);
          }
        } catch (error) {
          console.error('[Handler] Error processing URL:', url, error);
          results.push({
            status: 'error',
            chatSolutions: [],
            has_chatbot: false,
            has_live_elements: false,
            error: error.message,
            lastChecked: new Date().toISOString()
          });
        }
      }

      await processQueue();
      console.log('[Handler] Batch processing complete. Total results:', results.length);
      
      return new Response(JSON.stringify(results), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Handle single URL analysis
    console.log('[Handler] Processing single URL analysis');
    const { url } = validateRequest(body);
    return await processAnalysisRequest(url, startTime);

  } catch (error) {
    console.error('[Handler] Function error:', error);
    errorMessage = error.message;
    
    await logAnalysis({
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

async function processAnalysisRequest(normalizedUrl: string, startTime: number) {
  const requestId = crypto.randomUUID();
  activeRequests.add(requestId);
  
  try {
    console.log('[Handler] Processing analysis request for:', normalizedUrl);
    
    const result = await websiteAnalyzer(normalizedUrl);
    console.log('[Handler] Analysis result:', result);
    
    await updateCache(normalizedUrl, result.has_chatbot, result.chatSolutions, result.details);
    console.log('[Handler] Cache updated for:', normalizedUrl);
    
    await logAnalysis({
      url: normalizedUrl,
      success: true,
      cached: false,
      providersFound: result.chatSolutions,
      responseTimeMs: Date.now() - startTime,
      metadata: {}
    });
    
    return createSuccessResponse(result);
  } catch (error) {
    console.error('[Handler] Error in processAnalysisRequest:', error);
    throw error;
  } finally {
    activeRequests.delete(requestId);
    processQueue();
  }
}
