
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { ChatDetectionResult } from '../types.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export async function getCachedAnalysis(url: string): Promise<ChatDetectionResult | null> {
  try {
    console.log('[CacheService] Checking cache for URL:', url);
    
    const { data, error } = await supabase
      .from('analysis_cache')
      .select('*')
      .eq('url', url)
      .single();

    if (error) {
      console.error('[CacheService] Error fetching from cache:', error);
      return null;
    }

    if (!data) {
      console.log('[CacheService] No cached data found for URL:', url);
      return null;
    }

    // Check if cache is still valid
    const cacheAge = Date.now() - new Date(data.last_checked).getTime();
    if (cacheAge > CACHE_DURATION) {
      console.log('[CacheService] Cache expired for URL:', url);
      return null;
    }

    console.log('[CacheService] Cache hit for URL:', url);
    return {
      has_chatbot: data.has_chatbot,
      chatSolutions: data.chatbot_solutions || [],
      details: data.details || {},
      lastChecked: data.last_checked,
      fromCache: true
    };
  } catch (error) {
    console.error('[CacheService] Unexpected error:', error);
    return null;
  }
}

export async function updateCache(
  url: string,
  has_chatbot: boolean,
  chatSolutions: string[],
  details: any
): Promise<void> {
  try {
    console.log('[CacheService] Updating cache for URL:', url);
    
    const { error } = await supabase
      .from('analysis_cache')
      .upsert({
        url,
        has_chatbot,
        chatbot_solutions: chatSolutions,
        details,
        last_checked: new Date().toISOString()
      }, {
        onConflict: 'url'
      });

    if (error) {
      console.error('[CacheService] Error updating cache:', error);
      throw error;
    }

    console.log('[CacheService] Cache updated successfully for URL:', url);
  } catch (error) {
    console.error('[CacheService] Failed to update cache:', error);
    throw error;
  }
}
