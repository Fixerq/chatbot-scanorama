import { supabase } from '@/integrations/supabase/client';
import { AnalysisResult, CachedResult } from './types';

export const getCachedResult = async (url: string): Promise<CachedResult | null> => {
  const { data: cachedResult, error: cacheError } = await supabase
    .from('analyzed_urls')
    .select('*')
    .eq('url', url)
    .maybeSingle();

  if (cacheError) {
    console.error('Cache lookup error:', cacheError);
    return null;
  }

  return cachedResult;
};

export const cacheResult = async (url: string, result: AnalysisResult): Promise<void> => {
  const { error: insertError } = await supabase
    .from('analyzed_urls')
    .upsert({
      url,
      status: result.status,
      details: result.details,
      technologies: result.technologies
    });

  if (insertError) {
    console.error('Error caching result:', insertError);
  }
};

export const isCacheValid = (cachedResult: CachedResult): boolean => {
  const cacheAge = Date.now() - new Date(cachedResult.created_at).getTime();
  const cacheValidityPeriod = 24 * 60 * 60 * 1000; // 24 hours
  return cacheAge < cacheValidityPeriod;
};