
import { Result } from '@/components/ResultsTable';
import { supabase } from '@/integrations/supabase/client';

interface PlacesResult {
  results: Result[];
  hasMore: boolean;
}

export const performGoogleSearch = async (
  query: string,
  country: string,
  region: string,
  startIndex?: number
): Promise<PlacesResult | null> => {
  try {
    console.log('Performing Places search with params:', {
      query,
      country,
      region,
      startIndex
    });

    const { data, error } = await supabase.functions.invoke('search-places', {
      body: {
        query,
        country,
        region,
        startIndex: startIndex || 0
      }
    });

    if (error) {
      console.error('Places search error:', error);
      return null;
    }

    console.log('Raw response from Edge Function:', data);

    if (!data.results || !Array.isArray(data.results)) {
      console.error('Invalid response format:', data);
      return null;
    }

    // Map the results to the expected format
    const formattedResults = data.results
      .filter((result: any) => result && result.url) // Only include results with URLs
      .map((result: any) => ({
        url: result.url,
        status: 'Ready for analysis',
        details: {
          title: result.details?.title || '',
          description: result.details?.description || '',
          lastChecked: new Date().toISOString()
        }
      }));

    console.log('Formatted results:', formattedResults);

    return {
      results: formattedResults,
      hasMore: data.hasMore || false
    };
  } catch (error) {
    console.error('Places search error:', error);
    return null;
  }
};
