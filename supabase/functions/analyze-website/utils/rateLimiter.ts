
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { RATE_LIMIT } from '../types.ts';

export async function checkRateLimit(supabaseClient: any, ip: string): Promise<boolean> {
  try {
    console.log('Checking rate limit for IP:', ip);
    
    const { data, error } = await supabaseClient.rpc(
      'check_rate_limit',
      {
        p_client_id: ip,
        p_window_minutes: RATE_LIMIT.WINDOW_MINUTES,
        p_max_requests: RATE_LIMIT.MAX_REQUESTS
      }
    );

    if (error) {
      console.error('Error checking rate limit:', error);
      // On error checking rate limit, allow the request to proceed
      // Better to potentially allow some requests than block all on error
      return true;
    }

    if (!data) {
      console.error('No data returned from rate limit check');
      return true;
    }

    const allowed = data.allowed;
    console.log('Rate limit check result:', {
      allowed,
      currentCount: data.current_count,
      windowStart: data.window_start,
      resetAt: data.reset_at,
      retryAfter: data.retry_after
    });

    return allowed;
  } catch (error) {
    console.error('Failed to check rate limit:', error);
    // On unexpected error, allow the request to proceed
    return true;
  }
}
