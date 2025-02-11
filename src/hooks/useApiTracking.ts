
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useCallback } from 'react';

interface ApiRequestMetadata {
  endpoint: string;
  method: string;
  startTime: number;
}

export const useApiTracking = () => {
  const supabase = useSupabaseClient();

  const trackApiRequest = useCallback(async (
    metadata: ApiRequestMetadata,
    status?: number,
    error?: string
  ) => {
    try {
      const endTime = Date.now();
      const responseTime = endTime - metadata.startTime;

      await supabase.from('api_requests').insert({
        endpoint: metadata.endpoint,
        method: metadata.method,
        status_code: status,
        error_message: error,
        response_time_ms: responseTime,
      });
    } catch (error) {
      console.error('Failed to track API request:', error);
    }
  }, [supabase]);

  return { trackApiRequest };
};
