
import { SearchResult, SearchResponse } from './types/search';
import { filterResults } from './helpers/searchHelpers';
import { supabase } from '@/integrations/supabase/client';

export const performGoogleSearch = async (
  query: string,
  country: string,
  region?: string,
  startIndex?: number
): Promise<{ results: SearchResult[]; hasMore: boolean } | null> => {
  try {
    console.log('Initiating search with params:', { query, country, region, startIndex });

    const { data, error } = await supabase.functions.invoke<SearchResponse>('search-places', {
      body: {
        type: 'search',
        query,
        country,
        region,
        startIndex
      }
    });

    if (error) {
      console.error('Search error:', error);
      throw error;
    }

    if (!data?.data) {
      console.log('No data received from search endpoint');
      return null;
    }

    console.log('Search results received:', data.data);

    // Filter results to ensure we only get legitimate businesses
    const filteredResults = filterResults(data.data.results, query, country, region);

    return {
      results: filteredResults,
      hasMore: data.data.hasMore
    };
  } catch (error) {
    console.error('Error performing search:', error);
    throw error;
  }
};
