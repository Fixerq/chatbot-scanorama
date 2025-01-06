import { supabase } from '@/integrations/supabase/client';
import { ParsedCachedResult } from './types';

const CACHE_VALIDITY_PERIOD = 24 * 60 * 60 * 1000; // 24 hours

export const getCachedResult = async (url: string): Promise<ParsedCachedResult | null> => {
  const { data: cachedResult, error: cacheError } = await supabase
    .from('analyzed_urls')
    .select('*')
    .eq('url', url)
    .maybeSingle();

  if (cacheError) {
    console.error('Cache lookup error:', cacheError);
    return null;
  }

  if (!cachedResult) {
    return null;
  }

  const cacheAge = Date.now() - new Date(cachedResult.created_at).getTime();
  
  if (cacheAge >= CACHE_VALIDITY_PERIOD) {
    return null;
  }

  return {
    ...cachedResult,
    details: typeof cachedResult.details === 'string' 
      ? JSON.parse(cachedResult.details) 
      : cachedResult.details
  };
};

export const cacheResult = async (url: string, result: any): Promise<void> => {
  const { error: upsertError } = await supabase
    .from('analyzed_urls')
    .upsert({
      url,
      status: result.status,
      details: result.details,
      technologies: result.technologies
    }, {
      onConflict: 'url'
    });

  if (upsertError) {
    console.error('Error caching result:', upsertError);
  }
};