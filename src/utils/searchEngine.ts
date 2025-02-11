
import { SearchResult } from './types/firecrawl';
import { filterResults } from './helpers/searchHelpers';
import { supabase } from '@/integrations/supabase/client';

interface SearchResponse {
  data: {
    results: SearchResult[];
    hasMore: boolean;
  };
}

export const performGoogleSearch = async (
  query: string,
  country: string,
  region?: string,
  startIndex?: number
): Promise<{ results: SearchResult[]; hasMore: boolean } | null> => {
  try {
    const { data: response, error } = await supabase.functions.invoke<SearchResponse>('search-places', {
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

    if (!response?.data) {
      return null;
    }

    // Filter results to ensure we only get legitimate businesses
    const filteredResults = filterResults(response.data.results, query, country, region);

    return {
      results: filteredResults,
      hasMore: response.data.hasMore
    };
  } catch (error) {
    console.error('Error performing search:', error);
    throw error;
  }
};
