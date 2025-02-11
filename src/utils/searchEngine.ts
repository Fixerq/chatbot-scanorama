
import { SearchResult, SearchResponse } from './types/search';
import { supabase } from '@/integrations/supabase/client';

export const performGoogleSearch = async (
  query: string,
  country: string,
  region: string
): Promise<{ results: SearchResult[]; hasMore: boolean } | null> => {
  try {
    console.log('Starting search:', { query, country, region });

    const { data, error } = await supabase.functions.invoke<SearchResponse>('search-places', {
      body: {
        action: 'search',
        params: {
          query,
          country,
          region
        }
      }
    });

    if (error) {
      console.error('Search error:', error);
      throw error;
    }

    if (!data?.data) {
      console.log('No results found');
      return null;
    }

    console.log('Search completed:', data.data);

    return {
      results: data.data.results,
      hasMore: data.data.hasMore
    };
  } catch (error) {
    console.error('Error performing search:', error);
    throw error;
  }
};
