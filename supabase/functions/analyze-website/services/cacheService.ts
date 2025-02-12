
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { ChatDetectionResult } from '../types.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

export async function getCachedAnalysis(url: string): Promise<ChatDetectionResult | null> {
  const { data: cachedResult, error: cacheError } = await supabase
    .from('cached_analyses')
    .select('*')
    .eq('url', url)
    .single();

  if (cacheError) {
    console.error('Cache lookup error:', cacheError);
    return null;
  }

  if (cachedResult && 
      new Date(cachedResult.last_analyzed).getTime() > Date.now() - 24 * 60 * 60 * 1000) {
    console.log('Found recent cache for URL:', url);
    return {
      status: 'success',
      chatSolutions: cachedResult.chatbot_providers || [],
      lastChecked: cachedResult.last_analyzed
    };
  }

  return null;
}

export async function updateCache(url: string, hasChat: boolean, providers: string[], details: Record<string, unknown>, isError = false, errorMessage?: string): Promise<void> {
  const { error: upsertError } = await supabase
    .from('cached_analyses')
    .upsert({
      url,
      has_chatbot: hasChat,
      chatbot_providers: providers,
      analysis_details: details,
      last_analyzed: new Date().toISOString(),
      is_error: isError,
      error_message: errorMessage
    });

  if (upsertError) {
    console.error('Cache update error:', upsertError);
  }
}
