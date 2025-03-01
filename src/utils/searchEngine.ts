
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
        startIndex: startIndex || 0,
        limit: 10, // Ensure we're requesting a consistent amount of results
        include_details: true // Request additional details for better verification
      }
    });

    if (error) {
      console.error('Places search error:', error);
      return null;
    }

    console.log('Raw response from Edge Function:', data);

    if (!data || !data.results || !Array.isArray(data.results)) {
      console.error('Invalid response format or empty results:', data);
      return {
        results: [],
        hasMore: false
      };
    }

    // Map the results to the expected format and ensure there are no undefined entries
    const formattedResults = data.results
      .filter((result: any) => result && result.url) // Only include results with URLs
      .map((result: any) => ({
        url: result.url,
        status: 'Ready for analysis',
        details: {
          title: result.details?.title || result.title || '',
          description: result.details?.description || result.description || '',
          lastChecked: new Date().toISOString()
        }
      }));

    console.log('Formatted results count:', formattedResults.length);
    console.log('Sample formatted result:', formattedResults[0]);

    return {
      results: formattedResults,
      hasMore: data.hasMore || false
    };
  } catch (error) {
    console.error('Places search error:', error);
    return null;
  }
};
