
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { RATE_LIMIT } from '../types.ts';

export async function checkRateLimit(supabaseClient: any, ip: string): Promise<boolean> {
  try {
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
      return false;
    }

    if (!data.allowed) {
      console.log(`Rate limit exceeded for IP ${ip}. Reset at ${data.reset_at}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to check rate limit:', error);
    return false;
  }
}

