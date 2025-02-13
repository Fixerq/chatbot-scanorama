
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

export async function logAnalysis({
  url,
  success,
  cached,
  providersFound,
  errorMessage,
  responseTimeMs,
  rateLimitRemaining,
  isRateLimited,
  metadata = {}
}: {
  url: string;
  success: boolean;
  cached: boolean;
  providersFound?: string[];
  errorMessage?: string;
  responseTimeMs?: number;
  rateLimitRemaining?: number;
  isRateLimited?: boolean;
  metadata?: Record<string, unknown>;
}) {
  try {
    const { error } = await supabase
      .from('analysis_logs')
      .insert([{
        url,
        success,
        cached,
        providers_found: providersFound || [],
        error_message: errorMessage,
        response_time_ms: responseTimeMs,
        rate_limit_remaining: rateLimitRemaining,
        is_rate_limited: isRateLimited,
        metadata
      }]);

    if (error) {
      console.error('Error logging analysis:', error);
    }
  } catch (error) {
    console.error('Failed to log analysis:', error);
  }
}
