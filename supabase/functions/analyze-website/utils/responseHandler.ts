
import { corsHeaders } from '../utils/httpUtils.ts';

export function createSuccessResponse(data: any) {
  return new Response(
    JSON.stringify(data),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

export function createErrorResponse(message: string, status = 500) {
  return new Response(
    JSON.stringify({
      error: message
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

export function createRateLimitResponse(message: string) {
  return new Response(
    JSON.stringify({
      error: message,
      retryAfter: 60
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': '60'
      }
    }
  );
}
