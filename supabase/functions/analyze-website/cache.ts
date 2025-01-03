import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface CacheResult {
  url: string;
  status: string;
  details: Record<string, any>;
  technologies: string[];
}

export async function getCachedResult(supabaseClient: any, url: string): Promise<CacheResult | null> {
  const { data: cachedResult } = await supabaseClient
    .from('analyzed_urls')
    .select('*')
    .eq('url', url)
    .single();

  if (cachedResult) {
    const cacheAge = Date.now() - new Date(cachedResult.created_at).getTime();
    const cacheValidityPeriod = 24 * 60 * 60 * 1000; // 24 hours

    if (cacheAge < cacheValidityPeriod) {
      return cachedResult;
    }
  }

  return null;
}

export async function cacheResult(supabaseClient: any, result: CacheResult): Promise<void> {
  await supabaseClient
    .from('analyzed_urls')
    .upsert({
      url: result.url,
      status: result.status,
      details: result.details,
      technologies: result.technologies
    });
}