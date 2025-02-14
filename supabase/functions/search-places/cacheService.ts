
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { SearchResult } from './types.ts';

interface CachedResult {
  results: SearchResult[];
  hasMore: boolean;
  nextPageToken?: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

export async function getCachedResults(query: string, country: string, region: string): Promise<CachedResult | null> {
  const cacheKey = `${query}-${country}-${region}`.toLowerCase();
  
  const { data: cachedResult, error } = await supabase
    .from('analysis_cache')
    .select('analysis_result, last_checked')
    .eq('url', cacheKey)
    .single();

  if (error) {
    console.error('Cache lookup error:', error);
    return null;
  }

  if (cachedResult && 
      new Date(cachedResult.last_checked).getTime() > Date.now() - 24 * 60 * 60 * 1000) {
    console.log('Found recent cache for query:', cacheKey);
    return cachedResult.analysis_result as CachedResult;
  }

  return null;
}

export async function cacheResults(query: string, country: string, region: string, results: CachedResult): Promise<void> {
  const cacheKey = `${query}-${country}-${region}`.toLowerCase();

  const { error } = await supabase
    .from('analysis_cache')
    .upsert({
      url: cacheKey,
      analysis_result: results,
      last_checked: new Date().toISOString()
    });

  if (error) {
    console.error('Cache update error:', error);
  }
}
