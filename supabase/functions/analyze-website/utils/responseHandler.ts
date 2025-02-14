
import { corsHeaders } from './httpUtils.ts';
import { ChatDetectionResult } from '../types.ts';

export function createSuccessResponse(result: ChatDetectionResult): Response {
  return new Response(
    JSON.stringify(result),
    { 
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      } 
    }
  );
}

export function createErrorResponse(error: string, status = 200): Response {
  return new Response(
    JSON.stringify({
      status: 'error',
      error,
      has_chatbot: false,
      chatSolutions: [],
      lastChecked: new Date().toISOString(),
      details: {
        error: error
      }
    }),
    { 
      status: 200, // Always return 200 to handle in the frontend
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
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
      lastChecked: new Date().toISOString(),
      details: {
        error: 'Rate limit exceeded'
      }
    }),
    { 
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': '3600'
      }
    }
  );
}
