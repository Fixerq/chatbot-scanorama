
import { corsHeaders } from './httpUtils.ts';
import { ChatDetectionResult } from '../types.ts';

export function createSuccessResponse(result: ChatDetectionResult): Response {
  return new Response(
    JSON.stringify({
      ...result,
      analysis_result: {
        has_chatbot: result.has_chatbot,
        chatSolutions: result.chatSolutions,
        status: 'completed',
        lastChecked: result.lastChecked,
        details: {
          ...result.details,
          patterns: result.details?.matches?.map(match => ({
            type: match.type,
            pattern: match.pattern.toString(),
            matched: match.matched
          }))
        }
      }
    }),
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
      analysis_result: {
        has_chatbot: false,
        chatSolutions: [],
        status: 'error',
        error: error,
        lastChecked: new Date().toISOString(),
        details: {
          error: error
        }
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
      analysis_result: {
        has_chatbot: false,
        chatSolutions: [],
        status: 'error',
        error: 'Rate limit exceeded',
        lastChecked: new Date().toISOString(),
        details: {
          error: 'Rate limit exceeded'
        }
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

