import { supabase } from '@/integrations/supabase/client';
import { AnalysisResult, CachedResult, ParsedCachedResult } from './types';

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

  // Parse the details from Json to our expected format
  const parsedDetails = typeof cachedResult.details === 'string' 
    ? JSON.parse(cachedResult.details) 
    : cachedResult.details;

  return {
    ...cachedResult,
    details: {
      chatSolutions: parsedDetails?.chatSolutions || [],
      errorDetails: parsedDetails?.errorDetails,
      lastChecked: parsedDetails?.lastChecked,
      platform: parsedDetails?.platform
    }
  };
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

export const isCacheValid = (cachedResult: ParsedCachedResult): boolean => {
  const cacheAge = Date.now() - new Date(cachedResult.created_at).getTime();
  const cacheValidityPeriod = 24 * 60 * 60 * 1000; // 24 hours
  return cacheAge < cacheValidityPeriod;
};