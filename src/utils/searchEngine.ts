
import { Result } from '@/components/ResultsTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      toast.error('Search failed. Please try again.');
      return null;
    }

    if (!data || !data.results || !Array.isArray(data.results)) {
      console.error('Invalid response format:', data);
      toast.error('Received invalid search results');
      return null;
    }

    // Map the results to the expected format
    const formattedResults = data.results
      .filter((result: any) => result && result.url) // Only include results with URLs
      .map((result: any) => ({
        url: result.url,
        status: 'Ready',
        details: {
          title: result.details?.title || '',
          description: result.details?.description || '',
          lastChecked: new Date().toISOString()
        }
      }));

    console.log(`Found ${formattedResults.length} formatted results`);

    return {
      results: formattedResults,
      hasMore: data.hasMore || false
    };
  } catch (error) {
    console.error('Places search error:', error);
    toast.error('Search failed. Please try again.');
    return null;
  }
};
