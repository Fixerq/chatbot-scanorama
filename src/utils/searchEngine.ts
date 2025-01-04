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

    return {
      results: data.results.map((place: any) => ({
        url: place.website || '',
        status: 'Processing...',
        details: {
          title: place.name,
          description: place.formatted_address,
          lastChecked: new Date().toISOString()
        }
      })),
      hasMore: data.hasMore
    };
  } catch (error) {
    console.error('Places search error:', error);
    return null;
  }
};