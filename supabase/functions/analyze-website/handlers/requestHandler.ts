
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
    console.log('Received request:', req.method);
    
    const clientIP = getRealIp(req);
    console.log('Client IP:', clientIP);
    
    const isAllowed = await checkRateLimit(supabase, clientIP);
    if (!isAllowed) {
      console.log('Rate limit exceeded for IP:', clientIP);
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

    const body = await req.text();
    const requestData = JSON.parse(body);
    console.log('Request body:', requestData);

    // Handle batch analysis
    if (Array.isArray(requestData.urls)) {
      console.log('Processing batch of URLs:', requestData.urls.length);
      const results: ChatDetectionResult[] = [];
      
      for (const url of requestData.urls) {
        try {
          const normalizedUrl = normalizeUrl(url);
          console.log('Processing URL:', normalizedUrl);
          
          // Check cache first
          const cachedResult = await getCachedAnalysis(normalizedUrl);
          if (cachedResult) {
            console.log('Cache hit for URL:', normalizedUrl);
            results.push({
              ...cachedResult,
              fromCache: true
            });
            continue;
          }
          
          // Analyze website
          if (activeRequests.size >= MAX_CONCURRENT_REQUESTS) {
            console.log('Max concurrent requests reached, queueing:', normalizedUrl);
            const result = await new Promise<ChatDetectionResult>((resolve) => {
              requestQueue.push(async () => {
                const analysisResult = await websiteAnalyzer(normalizedUrl);
                resolve(analysisResult);
              });
            });
            results.push(result);
          } else {
            const result = await websiteAnalyzer(normalizedUrl);
            results.push(result);
          }
        } catch (error) {
          console.error('Error processing URL:', url, error);
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
      
      return new Response(JSON.stringify(results), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Handle single URL analysis (backward compatibility)
    const { url } = validateRequest(body);
    return await processAnalysisRequest(url, startTime);

  } catch (error) {
    console.error('Function error:', error);
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
    console.log('Processing analysis request for:', normalizedUrl);
    
    const result = await websiteAnalyzer(normalizedUrl);
    await updateCache(normalizedUrl, result.has_chatbot, result.chatSolutions, result.details);
    
    await logAnalysis({
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
    processQueue();
  }
}
