
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

interface LogEntry {
  url: string;
  success: boolean;
  cached: boolean;
  providersFound?: string[];
  errorMessage?: string;
  responseTimeMs: number;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

export async function logAnalysis(entry: LogEntry): Promise<void> {
  try {
    console.log('[LoggingService] Recording analysis:', entry);
    
    const { error } = await supabase
      .from('analysis_logs')
      .insert({
        url: entry.url,
        success: entry.success,
        cached: entry.cached,
        providers_found: entry.providersFound || [],
        error_message: entry.errorMessage,
        response_time_ms: entry.responseTimeMs,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('[LoggingService] Error logging analysis:', error);
      // Don't throw error to avoid interrupting the main flow
      return;
    }

    console.log('[LoggingService] Successfully logged analysis');
  } catch (error) {
    console.error('[LoggingService] Unexpected error logging analysis:', error);
    // Don't throw error to avoid interrupting the main flow
  }
}
