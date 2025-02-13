
import { corsHeaders } from './httpUtils.ts';
import { ChatDetectionResult } from '../types.ts';

export function createSuccessResponse(result: ChatDetectionResult): Response {
  return new Response(
    JSON.stringify(result),
    { headers: corsHeaders }
  );
}

export function createErrorResponse(error: string, status = 200): Response {
  return new Response(
    JSON.stringify({
      status: 'error',
      error,
      has_chatbot: false,
      chatSolutions: [],
      lastChecked: new Date().toISOString()
    }),
    { 
      status,
      headers: corsHeaders
    }
  );
}

export function createRateLimitResponse(error: string): Response {
  return new Response(
    JSON.stringify({
      status: 'error',
      error,
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

