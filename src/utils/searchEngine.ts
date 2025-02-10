
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
    console.log('Starting search with params:', {
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
      console.error('Search error:', error);
      toast.error(`Search failed: ${error.message}`);
      return null;
    }

    if (!data) {
      console.error('No data returned from search');
      toast.error('No results found. Please try again.');
      return null;
    }

    console.log('Search results:', data);

    return {
      results: data.results || [],
      hasMore: data.hasMore || false
    };
  } catch (error) {
    console.error('Search error:', error);
    toast.error('Search failed. Please try again later.');
    return null;
  }
};
